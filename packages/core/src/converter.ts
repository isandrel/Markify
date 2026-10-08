/**
 * Core Markdown converter — orchestrates the conversion pipeline.
 * Platform-agnostic: works in browser, CLI, and MCP contexts.
 *
 * Supports three conversion strategies:
 *   - 'dom-only':  Use DOM parsing (userscript default)
 *   - 'api-first': Try site API → Jina Reader → DOM fallback (CLI/MCP default)
 *   - 'api-only':  Only use APIs, error if none available
 */

import TurndownService from 'turndown';
import type { ConvertOptions, ConvertResult, ConversionConfig, ConvertStrategy, SiteMetadata } from './types';
import { findSiteAdapter, getBuiltInAdapters } from './adapters';
import type { SiteAdapter } from './adapters/base';
import { generateFrontmatter, formatDate, extractMainContent } from './utils';
import { applyDocumentTemplate } from './templates';
import { applyFilenameTemplate } from './utils/filename';
import { logger } from './utils/logger';
import { fetchViaJinaReader } from './reader';

/**
 * Default conversion configuration
 */
const defaultConversion: ConversionConfig = {
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    removeElements: ['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe'],
};

/**
 * Create a configured Turndown service
 */
function createTurndownService(config?: ConversionConfig): TurndownService {
    const c = { ...defaultConversion, ...config };

    const service = new TurndownService({
        headingStyle: c.headingStyle as any,
        codeBlockStyle: c.codeBlockStyle as any,
        emDelimiter: c.emDelimiter,
        strongDelimiter: c.strongDelimiter,
        linkStyle: c.linkStyle as any,
    });

    // Strikethrough support
    service.addRule('strikethrough', {
        filter: ['del', 's', 'strike'] as any,
        replacement: (content: string) => `~~${content}~~`,
    });

    // Remove unwanted elements
    service.remove((c.removeElements || []) as any);

    return service;
}

/**
 * Convert a web page to Obsidian-formatted Markdown
 *
 * Conversion pipeline by strategy:
 *
 *   dom-only (browser userscript):
 *     1. Site API (US Card Forum, 1Point3Acres) if matched
 *     2. DOM parsing with Turndown
 *
 *   api-first (CLI/MCP default):
 *     1. Site API (US Card Forum, 1Point3Acres) if matched
 *     2. Jina Reader API (works for any public URL)
 *     3. Fallback: fetch HTML → DOM parse → Turndown
 *
 *   api-only:
 *     1. Site API if matched
 *     2. Jina Reader API
 *     3. Error if both fail (no DOM fallback)
 */
export async function convert(options: ConvertOptions): Promise<ConvertResult> {
    const {
        url,
        html,
        document: doc,
        adapterName,
        includeFrontmatter = true,
        templates,
        fetcher,
        signal,
        onProgress,
        metadataSnapshot,
        adapterConfig,
        conversion,
        strategy = 'dom-only', // Default preserves existing behavior
        readerConfig,
    } = options;

    // Find appropriate adapter
    let adapter: SiteAdapter | null = null;
    const adapters = getBuiltInAdapters();
    if (adapterName) {
        adapter = adapters.find(a => a.name.toLowerCase() === adapterName.toLowerCase() || a.id === adapterName) ?? null;
    }
    if (!adapter) {
        adapter = findSiteAdapter(url, adapters);
    }

    logger.info(`Using adapter: ${adapter?.name || 'Default'}, strategy: ${strategy}`);

    // ─── Step 1: Try site-specific API (all strategies) ───────────────

    const siteApiResult = await trySiteApi(adapter, url, fetcher, adapterConfig, signal, onProgress);
    if (siteApiResult !== null) {
        // CLI/MCP pass a parsed page instead of a snapshot; APIs without metadata still need its title and tags.
        const pageMetadata = !metadataSnapshot && doc && adapter?.extractMetadata ? await adapter.extractMetadata(doc, url) : {};
        return buildResult(siteApiResult.markdown, adapter, url, templates, includeFrontmatter,
            adapter?.includesFrontmatter ?? false, { ...pageMetadata, ...metadataSnapshot, ...siteApiResult.metadata }, adapterConfig);
    }

    // ─── Step 2: Try Jina Reader (api-first / api-only) ──────────────

    if (strategy === 'api-first' || strategy === 'api-only') {
        // Build Jina Reader config from adapter selectors
        const jinaConfig = {
            ...readerConfig,
            targetSelector: readerConfig?.targetSelector
                ?? adapter?.contentSelectors?.join(', '),
            removeSelector: readerConfig?.removeSelector
                ?? adapter?.removeSelectors?.join(', '),
        };

        const readerResult = await fetchViaJinaReader(url, jinaConfig, fetcher);

        if (readerResult) {
            logger.info(`Jina Reader returned ${readerResult.content.length} chars`);

            let markdown = readerResult.content;

            // Apply post-processing if adapter has it
            if (adapter?.postProcess) {
                markdown = adapter.postProcess(markdown);
            }

            const metadata: SiteMetadata = {
                title: readerResult.title || 'Untitled',
                url: readerResult.url,
                date: formatDate(),
                downloaded: formatDate(),
                description: readerResult.description,
            };

            // Merge adapter metadata from title/URL patterns if available
            if (adapter?.extractMetadata && doc) {
                const adapterMeta = await adapter.extractMetadata(doc, url);
                Object.assign(metadata, adapterMeta);
            }
            if (adapter?.frontmatterFields) {
                Object.assign(metadata, adapter.frontmatterFields);
            }

            let finalContent = markdown;
            if (includeFrontmatter) {
                const frontmatter = generateFrontmatter(metadata);
                finalContent = `${frontmatter}\n${markdown}`;
            }

            return {
                markdown: finalContent,
                metadata,
                adapter: adapter?.name || 'Jina Reader',
                filename: buildFilename(metadata, adapter, templates),
            };
        }

        // api-only: error out, don't fall through to DOM
        if (strategy === 'api-only') {
            throw new Error(
                `No API available for ${url}. Site API not matched, Jina Reader failed. ` +
                `Use strategy 'api-first' to allow DOM fallback.`
            );
        }

        logger.warn('Jina Reader failed, falling back to DOM parsing...');
    }

    // ─── Step 3: DOM-based conversion (dom-only / api-first fallback) ─

    return convertViaDom(options, adapter);
}

/**
 * Try site-specific API conversion via the adapter's fetchViaApi() method.
 * Returns raw markdown string or null if no site API is available.
 *
 * This is fully generic — any adapter that sets hasApi=true and implements
 * fetchViaApi() will be invoked. No hardcoded site names here.
 */
async function trySiteApi(
    adapter: SiteAdapter | null,
    url: string,
    fetcher?: import('./types').HttpFetcher,
    adapterConfig?: import('./config').AdapterConfig,
    signal?: AbortSignal,
    onProgress?: (message: string) => void,
): Promise<{ markdown: string; metadata: Partial<SiteMetadata> } | null> {
    // Only try if adapter declares it has an API and provides a fetcher function
    if (!adapter?.hasApi || !adapter?.fetchViaApi) {
        return null;
    }

    if (!fetcher) {
        // Provide a default fetch-based fetcher
        fetcher = {
            get: async (fetchUrl: string, opts?: any) => {
                const res = await fetch(fetchUrl, {
                    credentials: opts?.credentials ? 'include' : 'same-origin',
                    headers: opts?.headers,
                    signal: opts?.signal,
                });
                return { status: res.status, ok: res.ok, text: await res.text() };
            },
        };
    }

    logger.info(`Trying site API for ${adapter.name}...`);

    const { getAdapterConfig } = await import('./config');
    const resolvedConfig = adapterConfig ?? adapter.config ?? getAdapterConfig(adapter.id ?? adapter.name);
    let metadata: Partial<SiteMetadata> = {};
    const result = await adapter.fetchViaApi(url, fetcher, resolvedConfig, {
        signal, onProgress, onMetadata: value => { metadata = { ...metadata, ...value }; },
    });
    return result === null ? null : { markdown: result, metadata };
}

/**
 * DOM-based conversion — the original Turndown pipeline.
 * Used by userscript directly and as fallback for api-first.
 */
async function convertViaDom(
    options: ConvertOptions,
    adapter: SiteAdapter | null,
): Promise<ConvertResult> {
    const {
        url,
        html,
        document: doc,
        includeFrontmatter = true,
        templates,
        conversion,
    } = options;

    const turndownService = createTurndownService(conversion);
    let markdown: string;

    if (doc) {
        let contentElement: any;

        if (adapter?.contentSelectors) {
            for (const selector of adapter.contentSelectors) {
                contentElement = doc.querySelector(selector);
                if (contentElement) break;
            }
        }

        if (!contentElement) {
            contentElement = extractMainContent(doc);
        }

        let contentClone = contentElement.cloneNode(true);

        if (adapter?.removeSelectors) {
            for (const selector of adapter.removeSelectors) {
                const elements = contentClone.querySelectorAll(selector);
                Array.from(elements).forEach((el: any) => el.remove());
            }
        }

        if (adapter?.preProcess) {
            contentClone = adapter.preProcess(contentClone);
        }

        const htmlString = contentClone.outerHTML || contentClone.innerHTML || String(contentClone);
        markdown = turndownService.turndown(htmlString);

        if (adapter?.postProcess) {
            markdown = adapter.postProcess(markdown);
        }
    } else if (html) {
        markdown = turndownService.turndown(html);
    } else {
        throw new Error('DOM strategy requires either document or html to be provided');
    }

    // Build metadata
    const metadata = await extractMetadataFromDoc(adapter, doc, url);

    // Build final output
    let finalContent = markdown;
    if (includeFrontmatter && !adapter?.includesFrontmatter) {
        const frontmatter = generateFrontmatter(metadata);

        if (templates?.content?.header) {
            finalContent = templates.content.header + finalContent;
        }
        if (templates?.content?.footer) {
            finalContent = finalContent + templates.content.footer;
        }

        if (templates?.document?.enabled && templates?.document?.template) {
            finalContent = applyDocumentTemplate(templates.document.template, {
                frontmatter,
                content: finalContent,
                ...metadata,
            });
        } else {
            finalContent = frontmatter ? `${frontmatter}\n${finalContent}` : finalContent;
        }
    }

    return {
        markdown: finalContent,
        metadata,
        adapter: adapter?.name || 'Default',
        filename: buildFilename(metadata, adapter, templates),
    };
}

/**
 * Build a ConvertResult from raw markdown returned by a site API
 */
async function buildResult(
    rawMarkdown: string,
    adapter: SiteAdapter | null,
    url: string,
    templates: any,
    includeFrontmatter: boolean,
    adapterIncludesFrontmatter: boolean,
    metadataSnapshot: Partial<SiteMetadata> = {},
    adapterConfig?: import('./config').AdapterConfig,
): Promise<ConvertResult> {
    const metadata: SiteMetadata = {
        title: 'Untitled',
        url,
        date: formatDate(),
        downloaded: formatDate(),
        ...metadataSnapshot,
    };

    let finalContent = rawMarkdown;

    if (includeFrontmatter && !adapterIncludesFrontmatter) {
        const frontmatter = generateFrontmatter(metadata);
        finalContent = `${frontmatter}\n${rawMarkdown}`;
    }

    return {
        markdown: finalContent,
        metadata,
        adapter: adapter?.name || 'API',
        filename: buildFilename(metadata, adapter, templates, adapterConfig),
    };
}

/**
 * Build a suggested filename from metadata
 */
function buildFilename(
    metadata: Record<string, any>,
    adapter: SiteAdapter | null,
    templates?: any,
    adapterConfig?: import('./config').AdapterConfig,
): string {
    return applyFilenameTemplate(
        adapterConfig?.filename.single ?? adapter?.config?.filename.single ?? templates?.filename?.single ?? '{title}',
        {
            title: metadata.title || 'untitled',
            id: metadata.id,
            author: metadata.author,
            site: adapter?.id ?? adapter?.name,
            date: formatDate(),
        },
    );
}

/**
 * Extract metadata from a document using the adapter
 */
async function extractMetadataFromDoc(
    adapter: SiteAdapter | null,
    doc: any | undefined,
    url: string,
): Promise<SiteMetadata> {
    const date = formatDate();
    let metadata: SiteMetadata = {
        title: doc?.title || 'Untitled',
        url,
        date,
        downloaded: formatDate(),
    };

    if (adapter?.extractMetadata && doc) {
        const customMetadata = await adapter.extractMetadata(doc, url);
        metadata = { ...metadata, ...customMetadata };
    } else if (doc) {
        const authorMeta = doc.querySelector('meta[name="author"]');
        const descMeta = doc.querySelector('meta[name="description"]');
        const keywordsMeta = doc.querySelector('meta[name="keywords"]');

        if (authorMeta?.getAttribute('content')) metadata.author = authorMeta.getAttribute('content');
        if (descMeta?.getAttribute('content')) metadata.description = descMeta.getAttribute('content');

        const keywordsContent = keywordsMeta?.getAttribute('content');
        const tags = keywordsContent
            ?.split(',')
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag.length > 0) || ['web-clip'];

        metadata.tags = tags;
    }

    if (adapter?.frontmatterFields) {
        metadata = { ...metadata, ...adapter.frontmatterFields };
    }

    return metadata;
}

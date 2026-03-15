/**
 * 1Point3Acres adapter
 *
 * Config-driven forum API adapter.
 * ALL values come from config/adapters/1point3acres.toml — nothing hardcoded here.
 * This file contains only the logic (how to fetch, parse, assemble).
 */

import type { SiteAdapter } from './base';
import type { HttpFetcher } from '../types';
import { logger } from '../utils/logger';
import { humanDelay, buildHeaders } from '../utils/http';
import { getAdapterConfig, extractIdFromUrl, interpolate, type AdapterConfig } from '../config';
import bbob from '@bbob/html';
import presetHTML5 from '@bbob/preset-html5';

/**
 * Load adapter config from TOML (required — no inline defaults)
 */
function cfg(): AdapterConfig | undefined {
    return getAdapterConfig('1Point3Acres') ?? getAdapterConfig('1point3acres');
}

/**
 * Read a field value from an API response using the TOML field mapping.
 *
 * Example TOML:
 *   [api.fields]
 *   title = "subject"      ← maps internal "title" to API's "subject" field
 *
 * If no mapping exists, uses the field name as-is.
 */
function readField(
    data: Record<string, unknown>,
    fieldName: string,
    fieldConfig: Record<string, unknown>,
): unknown {
    const apiField = typeof fieldConfig[fieldName] === 'string'
        ? fieldConfig[fieldName] as string
        : fieldName;
    return data[apiField];
}

/**
 * 1Point3Acres adapter definition.
 * URL patterns are also in TOML but duplicated here for static registration.
 */
export const onePoint3AcresAdapter: SiteAdapter = {
    name: '1Point3Acres',
    // These must match config/adapters/1point3acres.toml [site] url_patterns
    urlPatterns: [
        'https://www.1point3acres.com/bbs/thread-*',
        'https://www.1point3acres.com/home/pins/*',
        'https://instant.1point3acres.com/thread/*',
    ],
    hasApi: true,
    includesFrontmatter: true,
    preProcess: (element) => element,

    fetchViaApi: async (url, fetcher, configOverride) => {
        const config = configOverride ?? cfg();
        if (!config?.api) {
            throw new Error('1Point3Acres adapter requires TOML config (config/adapters/1point3acres.toml)');
        }

        const idPatterns = config.api.id_extraction?.patterns;
        if (!idPatterns?.length) {
            throw new Error('1Point3Acres config missing api.id_extraction.patterns');
        }

        const threadId = extractIdFromUrl(url, idPatterns);
        if (!threadId) {
            throw new Error(`Could not extract thread ID from URL: ${url}`);
        }

        return fetchForumApiContent(threadId, fetcher, config);
    },
};

/**
 * Fetch thread content from a forum JSON API.
 *
 * This function is fully config-driven:
 * - Endpoints come from TOML (api.thread_endpoint, api.posts_endpoint)
 * - Field names come from TOML (api.fields.title → "subject", etc.)
 * - Templates come from TOML (frontmatter.template, document.template, etc.)
 * - Delays come from TOML (api.page_delay)
 *
 * No hardcoded URLs, field names, or templates exist in this file.
 */
export async function fetchForumApiContent(
    threadId: string,
    fetcher: HttpFetcher,
    config: Record<string, unknown>,
    onProgress?: (message: string) => void,
): Promise<string | null> {
    try {
        const api = config.api as Record<string, unknown>;
        const fields = (api.fields ?? {}) as Record<string, unknown>;
        const postFields = (typeof fields.post === 'object' && fields.post !== null
            ? fields.post
            : fields) as Record<string, unknown>;
        const responseConfig = (api.response ?? {}) as Record<string, unknown>;

        // ─── Fetch thread data ───────────────────────────────────────

        const threadEndpoint = api.thread_endpoint as string;
        if (!threadEndpoint) {
            throw new Error('Config missing api.thread_endpoint');
        }

        const apiUrl = interpolate(threadEndpoint, { thread_id: threadId });
        logger.info(`Fetching thread content from: ${apiUrl}`);

        const headers = buildHeaders({}, config.http as Record<string, string> | undefined);
        const response = await fetcher.get(apiUrl, { headers });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const parsed = JSON.parse(response.text);

        // Validate response using config-defined checks
        const successField = responseConfig.success_field as string;
        const successValue = responseConfig.success_value as number;
        const dataField = responseConfig.data_field as string;

        if (successField && parsed[successField] !== successValue) {
            throw new Error(`Invalid API response: ${successField}=${parsed[successField]}`);
        }

        const thread = dataField ? parsed[dataField] : parsed;
        if (!thread) {
            throw new Error(`API response missing data field: ${dataField}`);
        }

        // Read fields using TOML mapping
        const title = readField(thread, 'title', fields) as string;
        const author = readField(thread, 'author', fields) as string;
        const contentRaw = readField(thread, 'content', fields) as string;
        const postedAt = readField(thread, 'posted_at', fields) as number;
        const updatedAt = readField(thread, 'updated_at', fields) as number;
        const views = readField(thread, 'views', fields) as number;
        const replies = readField(thread, 'replies', fields) as number;
        const favorites = (readField(thread, 'favorites', fields) as number) ?? 0;

        // Get templates from config
        const delimiter = config.delimiter as string ?? '---';
        const frontmatterTpl = (config.frontmatter as Record<string, string>)?.template;
        const docTpl = (config.document as Record<string, string>)?.template;
        const commentTpl = (config.comment as Record<string, string>)?.template;
        const commentsHeaderTpl = (config.comments_header as Record<string, string>)?.template;
        const sourceUrlTpl = (config.metadata as Record<string, string>)?.source_url;

        if (!frontmatterTpl || !docTpl) {
            throw new Error('Config missing frontmatter.template or document.template');
        }

        // Convert content based on format from config
        const contentFormat = api.content_format as string ?? 'bbcode';
        const contentHtml = contentFormat === 'bbcode'
            ? convertBBCodeToHTML(contentRaw || '')
            : contentRaw || '';

        // ─── Fetch comments ──────────────────────────────────────────

        let commentsMarkdown = '';
        if (replies > 0) {
            try {
                const pageSize = api.page_size as number;
                const order = api.order as string;
                const maxPages = api.max_pages as number;
                const postsEndpoint = api.posts_endpoint as string;
                const pageDelay = api.page_delay as Record<string, number> | undefined;

                if (!postsEndpoint) {
                    throw new Error('Config missing api.posts_endpoint');
                }

                let allPosts: Record<string, unknown>[] = [];
                let currentPage = 1;
                let hasMorePages = true;

                logger.info(`Fetching ${replies} comments (${pageSize} per page)...`);

                while (hasMorePages && currentPage <= maxPages) {
                    const postsUrl = interpolate(postsEndpoint, {
                        thread_id: threadId,
                        page_size: pageSize,
                        order,
                        page: currentPage,
                    });
                    logger.info(`Fetching page ${currentPage}: ${postsUrl}`);

                    if (onProgress) {
                        onProgress(`📥 Page ${currentPage}/${Math.ceil(replies / pageSize)}...`);
                    }

                    const postsResponse = await fetcher.get(postsUrl, { headers });

                    if (!postsResponse.ok) {
                        throw new Error(`Posts request failed: ${postsResponse.status}`);
                    }

                    const postsData = JSON.parse(postsResponse.text);

                    if (postsData.posts && Array.isArray(postsData.posts)) {
                        allPosts = allPosts.concat(postsData.posts);
                        logger.info(`Page ${currentPage}: ${postsData.posts.length} comments (total: ${allPosts.length})`);

                        if (postsData.posts.length < pageSize) {
                            hasMorePages = false;
                        } else {
                            currentPage++;
                            // Human-like delay between pages
                            if (pageDelay) {
                                const waited = await humanDelay(pageDelay);
                                logger.info(`Waited ${waited}ms before next page`);
                            }
                        }
                    } else {
                        hasMorePages = false;
                    }
                }

                if (allPosts.length > 0 && commentTpl && commentsHeaderTpl) {
                    commentsMarkdown = commentsHeaderTpl
                        .replace(/{count}/g, allPosts.length.toString())
                        .replace(/{delimiter}/g, delimiter);

                    if (order === 'time_desc') {
                        allPosts.reverse();
                    }

                    for (const post of allPosts) {
                        const postDate = new Date((post[postFields.posted_at as string ?? 'dateline'] as number) * 1000).toLocaleString();
                        const postContent = contentFormat === 'bbcode'
                            ? convertBBCodeToHTML((post[postFields.content as string ?? 'message_bbcode'] as string) || '')
                            : (post[postFields.content as string ?? 'message_bbcode'] as string) || '';

                        const comment = commentTpl
                            .replace(/{author}/g, post[postFields.author as string ?? 'author'] as string)
                            .replace(/{date}/g, postDate)
                            .replace(/{content}/g, postContent)
                            .replace(/{delimiter}/g, delimiter);

                        commentsMarkdown += comment;
                    }

                    logger.info(`Added ${allPosts.length} comments from ${currentPage - 1} pages`);
                }
            } catch (error) {
                logger.error('Error fetching posts:', error);
            }
        }

        // ─── Build final document ────────────────────────────────────

        const threadUrl = sourceUrlTpl
            ? interpolate(sourceUrlTpl, { thread_id: threadId })
            : `thread-${threadId}`;
        const postDate = new Date(postedAt * 1000).toISOString();
        const lastUpdated = new Date(updatedAt * 1000).toISOString();
        const downloadedDate = new Date().toISOString();
        const sourceLink = `"[${title}](${threadUrl})"`;

        const frontmatter = frontmatterTpl
            .replace(/{title}/g, title)
            .replace(/{author}/g, author)
            .replace(/{posted_at}/g, postDate)
            .replace(/{updated_at}/g, lastUpdated)
            .replace(/{downloaded_at}/g, downloadedDate)
            .replace(/{url}/g, sourceLink)
            .replace(/{views}/g, views.toString())
            .replace(/{replies}/g, replies.toString())
            .replace(/{favorites}/g, favorites.toString());

        const markdown = docTpl
            .replace(/{frontmatter}/g, frontmatter)
            .replace(/{title}/g, title)
            .replace(/{author}/g, author)
            .replace(/{date}/g, new Date(postedAt * 1000).toLocaleString())
            .replace(/{content}/g, contentHtml)
            .replace(/{views}/g, views.toString())
            .replace(/{replies}/g, replies.toString())
            .replace(/{favorites}/g, favorites.toString())
            .replace(/{comments}/g, commentsMarkdown)
            .replace(/{delimiter}/g, delimiter);

        return markdown;
    } catch (error) {
        logger.error('Error fetching forum API content:', error);
        return null;
    }
}

/**
 * Convert BBCode to HTML using @bbob library
 */
function convertBBCodeToHTML(bbcode: string): string {
    return bbob(bbcode, presetHTML5());
}

// Re-export for backward compatibility
export { fetchForumApiContent as fetch1Point3AcresContent };

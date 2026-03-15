/**
 * US Card Forum adapter
 *
 * Discourse-based forum with a /raw/ endpoint for direct Markdown export.
 * ALL values come from config/adapters/uscardforum.toml — nothing hardcoded here.
 * This file contains only the logic (how to fetch, paginate, assemble).
 */

import type { SiteAdapter } from './base';
import type { HttpFetcher } from '../types';
import { logger } from '../utils/logger';
import { humanDelay, buildHeaders } from '../utils/http';
import { getAdapterConfig, extractIdFromUrl, interpolate, type AdapterConfig } from '../config';

/**
 * Load adapter config from TOML (required — no inline defaults)
 */
function cfg(): AdapterConfig | undefined {
    return getAdapterConfig('US Card Forum') ?? getAdapterConfig('uscardforum');
}

/**
 * US Card Forum adapter definition.
 * URL patterns match config/adapters/uscardforum.toml [site] url_patterns.
 */
export const usCardForumAdapter: SiteAdapter = {
    name: 'US Card Forum',
    urlPatterns: [
        'https://www.uscardforum.com/t/*/*',
    ],
    hasApi: true,

    extractMetadata: (doc, url) => {
        const config = cfg();
        const cleanupPattern = (config?.metadata as Record<string, string>)?.title_cleanup ?? '';
        const title = cleanupPattern
            ? doc.title.replace(new RegExp(cleanupPattern), '').trim()
            : doc.title;

        const idPatterns = (config?.api as Record<string, unknown>)?.id_extraction as Record<string, string[]> | undefined;
        const topicId = idPatterns?.patterns ? extractIdFromUrl(url, idPatterns.patterns) : null;

        const baseUrl = (config?.site as Record<string, string>)?.base_url ?? '';
        const sourceTemplate = (config?.metadata as Record<string, string>)?.source_url;
        const source = topicId && sourceTemplate
            ? interpolate(sourceTemplate, { base_url: baseUrl, topic_id: topicId })
            : url;

        const tags = (config?.metadata as Record<string, string[]>)?.tags;

        return {
            title,
            ...(tags ? { tags } : {}),
            source,
        };
    },

    fetchViaApi: async (url, fetcher, configOverride) => {
        const config = configOverride ?? cfg();
        if (!config?.api) {
            throw new Error('US Card Forum adapter requires TOML config (config/adapters/uscardforum.toml)');
        }

        const api = config.api as Record<string, unknown>;
        const idExtraction = api.id_extraction as Record<string, string[]> | undefined;
        if (!idExtraction?.patterns?.length) {
            throw new Error('US Card Forum config missing api.id_extraction.patterns');
        }

        const topicId = extractIdFromUrl(url, idExtraction.patterns);
        if (!topicId) {
            throw new Error(`Could not extract topic ID from URL: ${url}`);
        }

        return fetchDiscourseRawContent(topicId, fetcher, config);
    },
};

/**
 * Fetch all pages of a Discourse topic via the /raw/ endpoint.
 *
 * Fully config-driven:
 * - api.raw_endpoint: URL template with {base_url}, {topic_id}, {page}
 * - api.max_pages: safety limit for pagination
 * - api.page_delay: human-like delay config (min_ms, max_ms, jitter)
 * - site.base_url: base URL for template interpolation
 * - page_separator: string between pages in final output
 */
export async function fetchDiscourseRawContent(
    topicId: string,
    fetcher: HttpFetcher | undefined,
    config: Record<string, unknown>,
): Promise<string | null> {
    const api = config.api as Record<string, unknown>;
    const site = (config.site ?? {}) as Record<string, string>;

    const baseUrl = site.base_url;
    const rawEndpoint = api.raw_endpoint as string;
    const maxPages = (api.max_pages as number) ?? 100;
    const pageDelay = api.page_delay as Record<string, number> | undefined;
    const separator = (config.page_separator as string) ?? '\n\n---\n\n';
    const requestConfig = (api.request ?? {}) as Record<string, unknown>;
    const credentials = (requestConfig.credentials as boolean) ?? true;

    if (!rawEndpoint) {
        throw new Error('Config missing api.raw_endpoint');
    }

    // Build headers with real User-Agent
    const headers = buildHeaders({}, config.http as Record<string, string> | undefined);

    // Default to global fetch if no fetcher provided
    const doFetch = fetcher ?? {
        get: async (url: string, opts?: Record<string, unknown>) => {
            const res = await fetch(url, {
                credentials: (opts?.credentials as boolean) ? 'include' : 'same-origin',
                headers,
            });
            return { status: res.status, ok: res.ok, text: await res.text() };
        },
    };

    const pages: string[] = [];
    let page = 1;

    logger.info(`Fetching Discourse topic ${topicId} (all pages)...`);

    while (page <= maxPages) {
        const url = interpolate(rawEndpoint, { base_url: baseUrl, topic_id: topicId, page });

        try {
            const response = await doFetch.get(url, { credentials, headers });

            if (!response.ok) {
                if (page === 1) {
                    throw new Error(`Failed to fetch content: ${response.status}`);
                }
                break;
            }

            const text = response.text;

            if (!text || text.trim().length === 0) {
                break;
            }

            pages.push(text);
            logger.info(`Fetched page ${page} (${text.length} characters)`);

            // Human-like delay between pages
            if (pageDelay) {
                const waited = await humanDelay(pageDelay);
                logger.info(`Waited ${waited}ms before next page`);
            }

            page++;
        } catch (error) {
            logger.error(`Error fetching page ${page}:`, error);
            if (page === 1) {
                return null;
            }
            break;
        }
    }

    logger.info(`Complete! Downloaded ${pages.length} pages, total ${pages.join('').length} characters`);
    return pages.join(separator);
}

// Re-export for backward compatibility
export { fetchDiscourseRawContent as fetchUSCardForumContent };

/**
 * Reader Service — API-based URL-to-Markdown conversion
 *
 * Converts web pages to Markdown using external reader APIs
 * instead of fragile HTML parsing + CSS selectors.
 *
 * Priority order:
 *   1. Site-specific API (US Card Forum /raw/, 1Point3Acres API)
 *   2. Jina Reader API (r.jina.ai) — works for any public URL
 *   3. Fallback to HTML fetch + Turndown (DOM-based, least reliable)
 */

import type { HttpFetcher } from './types';
import { logger } from './utils/logger';
import { findSiteAdapter, getBuiltInAdapters } from './adapters';

/**
 * Configuration for reader services
 */
export interface ReaderConfig {
    /** Jina Reader API token (from JINA_TOKEN env var) */
    jinaToken?: string;
    /** Timeout in milliseconds for reader requests */
    timeout?: number;
    /** Whether to include links in the markdown output */
    includeLinks?: boolean;
    /** Whether to include images in the markdown output */
    includeImages?: boolean;
    /** Target CSS selectors to focus on (Jina supports this) */
    targetSelector?: string;
    /** CSS selectors to exclude from output */
    removeSelector?: string;
}

/**
 * Result from a reader API call
 */
export interface ReaderResult {
    /** The markdown content */
    content: string;
    /** Page title extracted by the reader */
    title: string;
    /** Original URL (after redirects) */
    url: string;
    /** Description/excerpt if available */
    description?: string;
    /** Which reader was used */
    source: 'jina' | 'site-api' | 'html-fallback';
}

/**
 * Fetch a URL as Markdown using Jina Reader API.
 *
 * Jina Reader (r.jina.ai) renders JavaScript, handles paywalls
 * and cookie walls, and returns clean Markdown — no DOM parsing needed.
 *
 * @see https://jina.ai/reader/
 */
export async function fetchViaJinaReader(
    url: string,
    config?: ReaderConfig,
    fetcher?: HttpFetcher,
): Promise<ReaderResult | null> {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };

    // Auth token (increases rate limits significantly)
    const token = config?.jinaToken ?? process.env.JINA_TOKEN;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Jina-specific headers for content control
    if (config?.targetSelector) {
        headers['X-Target-Selector'] = config.targetSelector;
    }
    if (config?.removeSelector) {
        headers['X-Remove-Selector'] = config.removeSelector;
    }
    if (config?.includeLinks === false) {
        headers['X-Retain-Images'] = 'none';
    }

    logger.info(`Fetching via Jina Reader: ${jinaUrl}`);

    try {
        const doFetch = fetcher ?? createDefaultFetcher();
        const response = await doFetch.get(jinaUrl, { headers });

        if (!response.ok) {
            logger.warn(`Jina Reader returned ${response.status} for ${url}`);
            return null;
        }

        // Jina returns JSON when Accept: application/json is set
        try {
            const json = JSON.parse(response.text);
            if (json.data) {
                return {
                    content: json.data.content || '',
                    title: json.data.title || '',
                    url: json.data.url || url,
                    description: json.data.description,
                    source: 'jina',
                };
            }
        } catch {
            // Not JSON — raw markdown response
        }

        // Fallback: treat response as raw markdown
        // Extract title from first heading if present
        const titleMatch = response.text.match(/^#\s+(.+)$/m);
        return {
            content: response.text,
            title: titleMatch?.[1] || '',
            url,
            source: 'jina',
        };
    } catch (error) {
        logger.error('Jina Reader request failed:', error);
        return null;
    }
}

/**
 * Check if a URL has a dedicated site-specific API adapter.
 * These are always preferred over generic readers.
 *
 * Dynamically checks the adapter registry — no hardcoded site names.
 */
export function hasSiteApi(url: string): boolean {
    return findSiteAdapter(url, getBuiltInAdapters())?.hasApi === true;
}

/**
 * Create default fetch-based HttpFetcher
 */
function createDefaultFetcher(): HttpFetcher {
    return {
        get: async (url: string, opts?: { headers?: Record<string, string> }) => {
            const res = await fetch(url, {
                headers: opts?.headers,
            });
            return {
                status: res.status,
                ok: res.ok,
                text: await res.text(),
            };
        },
    };
}

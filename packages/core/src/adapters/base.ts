/**
 * Site Adapter Interface
 *
 * Defines how to extract and convert content from specific websites.
 * Adapters can work via DOM selectors (userscript) or API endpoints (CLI/MCP).
 */

import type { MinimalDocument, MinimalElement, HttpFetcher, SiteMetadata, ApiConversionContext } from '../types';
import type { AdapterConfig } from '../config';

export interface SiteAdapter {
    /** Site name for identification */
    name: string;

    /** URL patterns to match (supports wildcards and regex) */
    urlPatterns: (string | RegExp)[];
    /** A configured adapter uses exact origins and compiled thread routes. */
    matchesUrl?: (url: string) => boolean;
    /** Resolved job configuration for profile-backed adapters. */
    config?: AdapterConfig;
    id?: string;

    /** Selectors for main content (DOM-based strategy) */
    contentSelectors?: string[];

    /** Selectors to remove before conversion (DOM-based strategy) */
    removeSelectors?: string[];

    /**
     * Custom metadata extraction
     * @param doc - Document interface (browser DOM or linkedom)
     * @param url - The page URL (replaces window.location dependency)
     */
    extractMetadata?: (doc: MinimalDocument, url: string) => Partial<SiteMetadata> | Promise<Partial<SiteMetadata>>;

    /** Pre-processing hook before conversion */
    preProcess?: (element: MinimalElement) => MinimalElement;

    /** Post-processing hook after markdown conversion */
    postProcess?: (markdown: string) => string;

    /** Indicates adapter already includes frontmatter in output */
    includesFrontmatter?: boolean;

    /** Custom frontmatter fields */
    frontmatterFields?: Record<string, string | string[]>;

    // ─── API-based adapter support ───────────────────────────────────

    /**
     * Whether this adapter has a dedicated API for content fetching.
     * When true, the converter will try fetchViaApi() before DOM/Jina.
     */
    hasApi?: boolean;

    /**
     * Fetch content via the site's API.
     * Returns Markdown, or null only when unsupported. Attempted failures throw.
     *
     * @param url - The page URL
     * @param fetcher - HTTP fetcher implementation
     * @param config - Adapter-specific config from TOML
     */
    fetchViaApi?: (
        url: string,
        fetcher: HttpFetcher,
        config?: Record<string, any>,
        context?: ApiConversionContext,
    ) => Promise<string | null>;
}

// Re-export SiteMetadata from types for convenience
export type { SiteMetadata } from '../types';

/**
 * Test if a URL matches a pattern
 */
export function matchesPattern(url: string, pattern: string | RegExp): boolean {
    if (pattern instanceof RegExp) {
        return pattern.test(url);
    }

    // Convert wildcard pattern to regex
    const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
        .replace(/\*/g, '.*'); // Convert * to .*

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
}

/**
 * Find the appropriate site adapter for a URL
 */
export function findSiteAdapter(url: string, adapters: SiteAdapter[]): SiteAdapter | null {
    for (const adapter of adapters) {
        if (adapter.matchesUrl) {
            if (adapter.matchesUrl(url)) return adapter;
            continue;
        }
        for (const pattern of adapter.urlPatterns) {
            if (matchesPattern(url, pattern)) {
                return adapter;
            }
        }
    }
    return null;
}

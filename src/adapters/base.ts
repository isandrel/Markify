/**
 * Site Adapter Interface
 * Defines how to extract content from specific websites
 */
export interface SiteAdapter {
    /** Site name for identification */
    name: string;

    /** URL patterns to match (supports wildcards and regex) */
    urlPatterns: (string | RegExp)[];

    /** Selectors for main content */
    contentSelectors?: string[];

    /** Selectors to remove before conversion */
    removeSelectors?: string[];

    /** Custom metadata extraction */
    extractMetadata?: (doc: Document) => Partial<SiteMetadata> | Promise<Partial<SiteMetadata>>;

    /** Pre-processing hook before conversion */
    preProcess?: (element: Element) => Element;

    /** Post-processing hook after markdown conversion */
    postProcess?: (markdown: string) => string;

    /** Indicates adapter already includes frontmatter in output */
    includesFrontmatter?: boolean;

    /** Custom frontmatter fields */
    frontmatterFields?: Record<string, string | string[]>;
}

/**
 * Metadata extracted from a page
 */
export interface SiteMetadata {
    title: string;
    url: string;
    date: string;
    author?: string;
    description?: string;
    tags?: string[];
    [key: string]: unknown;
}

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
 * Find the appropriate site adapter for the current URL
 */
export function findSiteAdapter(url: string, adapters: SiteAdapter[]): SiteAdapter | null {
    for (const adapter of adapters) {
        for (const pattern of adapter.urlPatterns) {
            if (matchesPattern(url, pattern)) {
                return adapter;
            }
        }
    }
    return null;
}

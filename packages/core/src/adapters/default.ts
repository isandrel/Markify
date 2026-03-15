import type { SiteAdapter } from './base';

/**
 * Default adapter (fallback for unknown sites)
 */
export const defaultAdapter: SiteAdapter = {
    name: 'Default',
    urlPatterns: ['*'],
    contentSelectors: [
        'article',
        '[role="main"]',
        'main',
        '.post-content',
        '.article-content',
        '.entry-content',
        '#content',
        '.content',
    ],
    removeSelectors: [
        'script',
        'style',
        'nav',
        'header',
        'footer',
        'aside',
        'iframe',
        '.advertisement',
        '.ads',
        '.sidebar',
    ],
};

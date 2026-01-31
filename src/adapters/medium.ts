import type { SiteAdapter } from './base';

export const mediumAdapter: SiteAdapter = {
    name: 'Medium',
    urlPatterns: [
        'https://medium.com/*',
        'https://*.medium.com/*',
    ],
    contentSelectors: [
        'article',
        '[data-testid="storyContent"]',
    ],
    removeSelectors: [
        'header',
        'footer',
        '.metabar',
        '.postMetaInline',
        '[data-testid="storyReadTime"]',
    ],
    extractMetadata: (doc) => {
        const authorMeta = doc.querySelector('meta[property="author"]') as HTMLMetaElement;
        const tagsElements = doc.querySelectorAll('a[rel="tag"]');

        return {
            author: authorMeta?.content,
            tags: Array.from(tagsElements).map(el => el.textContent?.trim() || ''),
        };
    },
};

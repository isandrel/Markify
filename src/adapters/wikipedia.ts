import type { SiteAdapter } from './base';

export const wikipediaAdapter: SiteAdapter = {
    name: 'Wikipedia',
    urlPatterns: [
        'https://*.wikipedia.org/wiki/*',
    ],
    contentSelectors: [
        '#mw-content-text',
        '.mw-parser-output',
    ],
    removeSelectors: [
        '.mw-editsection',
        '.reference',
        '.navbox',
        '.infobox',
        '#toc',
        '.sidebar',
    ],
    extractMetadata: (doc) => {
        const title = doc.querySelector('#firstHeading')?.textContent?.trim();
        const categories = Array.from(doc.querySelectorAll('#mw-normal-catlinks a'))
            .slice(1) // Skip "Categories:" link
            .map(a => a.textContent?.trim() || '');

        return {
            title,
            tags: ['wikipedia', ...categories.slice(0, 5)], // Limit to 5 categories
        };
    },
};

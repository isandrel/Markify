import type { SiteAdapter } from './base';

export const substackAdapter: SiteAdapter = {
    name: 'Substack',
    urlPatterns: [
        'https://*.substack.com/p/*',
    ],
    contentSelectors: [
        '.post-content',
        '.body',
    ],
    removeSelectors: [
        '.subscription-widget-wrap',
        '.captioned-button-wrap',
        '.share-dialog',
    ],
    extractMetadata: (doc) => {
        const author = doc.querySelector('.author-name')?.textContent?.trim();
        const publishDate = doc.querySelector('time')?.getAttribute('datetime');

        return {
            author,
            date: publishDate ? new Date(publishDate).toISOString().split('T')[0] : undefined,
            tags: ['substack', 'newsletter'],
        };
    },
};

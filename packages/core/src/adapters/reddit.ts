import type { SiteAdapter } from './base';

export const redditAdapter: SiteAdapter = {
    name: 'Reddit',
    urlPatterns: [
        'https://www.reddit.com/r/*/comments/*',
        'https://old.reddit.com/r/*/comments/*',
    ],
    contentSelectors: [
        '[data-test-id="post-content"]',
        '.usertext-body',
        'div[slot="text-body"]',
    ],
    removeSelectors: [
        '.share-menu',
        '.awardings-bar',
    ],
    extractMetadata: (doc, url) => {
        const parsedUrl = new URL(url);
        const subreddit = parsedUrl.pathname.split('/')[2];
        const author = doc.querySelector('[data-testid="post_author_link"]')?.textContent?.trim();

        return {
            author: author ?? undefined,
            tags: ['reddit', subreddit],
        };
    },
};

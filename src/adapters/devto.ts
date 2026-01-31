import type { SiteAdapter } from './base';

export const devtoAdapter: SiteAdapter = {
    name: 'Dev.to',
    urlPatterns: [
        'https://dev.to/*/*',
    ],
    contentSelectors: [
        '#article-body',
        '.crayons-article__body',
    ],
    removeSelectors: [
        '.crayons-article__actions',
        '.crayons-sponsor',
    ],
    extractMetadata: (doc) => {
        const author = doc.querySelector('.crayons-article__header__author a')?.textContent?.trim();
        const tags = Array.from(doc.querySelectorAll('.crayons-tag')).map(
            el => el.textContent?.trim().replace('#', '') || ''
        );

        return {
            author,
            tags: ['dev.to', ...tags],
        };
    },
};

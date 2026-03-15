import type { SiteAdapter } from './base';

export const githubAdapter: SiteAdapter = {
    name: 'GitHub',
    urlPatterns: [
        'https://github.com/*/*',
    ],
    contentSelectors: [
        'article.markdown-body',
        '.repository-content',
        '#readme',
    ],
    removeSelectors: [
        '.js-discussion-sidebar',
        '.timeline-comment-actions',
    ],
    extractMetadata: (doc, url) => {
        const repoName = doc.querySelector('h1[itemprop="name"] a')?.textContent?.trim();
        const parsedUrl = new URL(url);
        const author = parsedUrl.pathname.split('/')[1];

        return {
            author,
            title: repoName ? `${author}/${repoName}` : undefined,
            tags: ['github', 'repository'],
        };
    },
};

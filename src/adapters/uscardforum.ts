import type { SiteAdapter } from './base';

/**
 * US Card Forum adapter
 * This site provides raw Markdown via API
 */
export const usCardForumAdapter: SiteAdapter = {
    name: 'US Card Forum',
    urlPatterns: [
        'https://www.uscardforum.com/t/*/*',
    ],
    extractMetadata: (doc) => {
        // Extract title and clean it
        const title = doc.title.replace(/\s-\s(美国信用卡指南|US Card Forum)$/, '').trim();
        const match = window.location.pathname.match(/\/t\/[^\/]+\/(\d+)/);
        const topicId = match ? match[1] : null;

        return {
            title,
            tags: ['uscardforum', 'forum', 'credit-cards'],
            source: topicId ? `https://www.uscardforum.com/t/${topicId}` : window.location.href,
        };
    },
};

/**
 * Fetch all pages of a US Card Forum topic
 * This fetches the COMPLETE topic - ALL posts across ALL pages!
 */
export async function fetchUSCardForumContent(topicId: string): Promise<string | null> {
    const pages: string[] = [];
    let page = 1;

    console.log('[Markify] Fetching US Card Forum topic (all pages)...');

    while (true) {
        const url = `https://www.uscardforum.com/raw/${topicId}?page=${page}`;

        try {
            const response = await fetch(url, { credentials: 'include' });

            if (!response.ok) {
                if (page === 1) {
                    throw new Error(`Failed to fetch content: ${response.status}`);
                }
                break; // End of pages
            }

            const text = await response.text();

            if (!text || text.trim().length === 0) {
                break; // No more content
            }

            pages.push(text);
            console.log(`[Markify] Fetched page ${page} (${text.length} characters)`);

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

            page++;
        } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
            if (page === 1) {
                return null;
            }
            break;
        }
    }

    console.log(`[Markify] Complete! Downloaded ${pages.length} pages, total ${pages.join('').length} characters`);
    return pages.join('\n\n---\n\n');
}

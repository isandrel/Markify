/**
 * USCardForum Batch Capability Implementation
 * Adds batch download support for USCardForum category/tag pages
 */

import type { BatchCapability, BatchItem } from '../batch/BatchDownloadManager';
import { fetchUSCardForumContent } from './uscardforum';
import { adapterLogger as logger } from '../utils/logger';
import type { FilenameContext } from '../utils/filename';

export class USCardForumBatchCapability implements BatchCapability {
    isListingPage(): boolean {
        const url = window.location.href;
        // Support category pages (/c/...) and tag pages (/tags/...)
        return (url.includes('/c/') || url.includes('/tag/') || url.includes('/tags/'))
            && !url.includes('/t/'); // Exclude individual topic pages
    }

    extractItems(): BatchItem[] {
        logger.debug('Extracting topic items from USCardForum page');
        const items: BatchItem[] = [];

        // Find all topic links - USCardForum uses various selectors
        const topicLinks = document.querySelectorAll('a.title[href*="/t/"], a[href*="/t/"].raw-topic-link');
        logger.debug(`Found ${topicLinks.length} topic link elements`);

        topicLinks.forEach((element) => {
            const anchor = element as HTMLAnchorElement;
            const href = anchor.getAttribute('href');

            if (href) {
                // Extract topic ID: /t/{slug}/{id}
                const match = href.match(/\/t\/[^\/]+\/(\d+)/);
                if (match) {
                    const topicId = match[1];
                    const title = anchor.textContent?.trim() || `Topic ${topicId}`;

                    items.push({
                        id: topicId,
                        title,
                        url: href.startsWith('http') ? href : `https://www.uscardforum.com${href}`,
                    });
                }
            }
        });

        logger.info(`Extracted ${items.length} valid topic items`);
        return items;
    }

    async fetchItem(itemId: string, onProgress?: (message: string) => void): Promise<string | null> {
        return fetchUSCardForumContent(itemId);
    }

    getFilenameContext(): FilenameContext {
        // Try to extract category or tag info from URL
        const categoryMatch = window.location.pathname.match(/\/c\/([^\/]+)/);
        const tagMatch = window.location.pathname.match(/\/tag[s]?\/([^\/]+)/);

        if (categoryMatch) {
            return {
                site: 'uscardforum',
                type: 'category',
                id: categoryMatch[1],
            };
        } else if (tagMatch) {
            return {
                site: 'uscardforum',
                type: 'tag',
                id: tagMatch[1],
            };
        } else {
            return {
                site: 'uscardforum',
                type: 'listing',
                id: '',
            };
        }
    }
}

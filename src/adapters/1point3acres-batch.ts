/**
 * 1Point3Acres Batch Capability Implementation
 * Implements the generic BatchCapability interface for 1point3acres forum listings
 */

import type { BatchCapability, BatchItem } from '../batch/BatchDownloadManager';
import { fetch1Point3AcresContent } from './1point3acres';
import { adapterLogger as logger } from '../utils/logger';

export class OnePoint3AcresBatchCapability implements BatchCapability {
    isListingPage(): boolean {
        const url = window.location.href;
        // Support both forum listings (/home/forum/xxx) and tag pages (/home/tag/xxx)
        return (url.includes('/home/forum/') || url.includes('/home/tag/'))
            && !url.includes('/pins/')
            && !url.includes('/thread-');
    }

    extractItems(): BatchItem[] {
        logger.debug('Extracting thread items from page');
        const items: BatchItem[] = [];
        const threadElements = document.querySelectorAll('a[href*="/home/pins/"]');
        logger.debug(`Found ${threadElements.length} thread link elements`);

        threadElements.forEach((element) => {
            const anchor = element as HTMLAnchorElement;
            const href = anchor.getAttribute('href');

            if (href) {
                const match = href.match(/\/pins\/(\d+)/);
                if (match) {
                    const threadId = match[1];
                    const title = anchor.textContent?.trim() || `Thread ${threadId}`;

                    items.push({
                        id: threadId,
                        title,
                        url: `https://www.1point3acres.com${href}`,
                    });
                }
            }
        });

        logger.info(`Extracted ${items.length} valid thread items`);
        return items;
    }

    async fetchItem(itemId: string, onProgress?: (message: string) => void): Promise<string | null> {
        return fetch1Point3AcresContent(itemId, onProgress);
    }

    getArchiveName(): string {
        const timestamp = new Date().toISOString().split('T')[0];

        // Check if it's a tag page
        const tagMatch = window.location.pathname.match(/\/tag\/(\d+)/);
        if (tagMatch) {
            return `1point3acres-tag-${tagMatch[1]}-${timestamp}`;
        }

        // Otherwise it's a forum page
        const forumId = window.location.pathname.match(/\/forum\/(\d+)/)?.[1] || 'forum';
        return `1point3acres-forum-${forumId}-${timestamp}`;
    }
}

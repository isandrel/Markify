/**
 * 1Point3Acres Batch Capability Implementation
 * Implements the generic BatchCapability interface for 1point3acres forum listings
 */

import type { BatchCapability, BatchItem } from '../batch/BatchDownloadManager';
import { fetch1Point3AcresContent } from './1point3acres';
import { adapterLogger as logger } from '../utils/logger';
import type { FilenameContext } from '../utils/filename';

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

    async getFilenameContext(): Promise<FilenameContext> {
        // Check if it's a tag page
        const tagMatch = window.location.pathname.match(/\/tag\/(\d+)/);
        if (tagMatch) {
            const tagId = tagMatch[1];
            const tagName = await this.fetchTagName(tagId);

            return {
                site: '1point3acres',
                type: 'tag',
                id: tagId,
                tagname: tagName || tagId, // Fallback to ID if name fetch fails
            };
        }

        // Otherwise it's a forum page
        const forumMatch = window.location.pathname.match(/\/forum\/(\d+)/);
        const forumId = forumMatch?.[1] || 'unknown';
        const forumName = await this.fetchForumName(forumId);

        return {
            site: '1point3acres',
            type: 'forum',
            id: forumId,
            tagname: forumName || forumId, // Fallback to ID if name fetch fails
        };
    }

    /**
     * Fetch tag name from 1Point3Acres API
     */
    private async fetchTagName(tagId: string): Promise<string | null> {
        try {
            const apiUrl = `https://api.1point3acres.com/api/tags/${tagId}`;
            logger.debug(`Fetching tag name from: ${apiUrl}`);

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.errno === 0 && data.data?.tagname) {
                logger.info(`Tag name: ${data.data.tagname}`);
                return data.data.tagname;
            }
        } catch (error) {
            logger.warn(`Failed to fetch tag name for ${tagId}:`, error);
        }
        return null;
    }

    /**
     * Fetch forum name from 1Point3Acres API (if available)
     */
    private async fetchForumName(forumId: string): Promise<string | null> {
        // Forum API might be different or unavailable
        // For now, return null and use ID as fallback
        logger.debug(`Forum name API not implemented, using ID: ${forumId}`);
        return null;
    }
}

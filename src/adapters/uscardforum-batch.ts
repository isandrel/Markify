/**
 * US Card Forum Batch Download Capability
 * Supports category pages (/c/...), tag pages (/tag/...), and search results (/search)
 * Configuration loaded from config/adapters/uscardforum.toml
 */

import type { BatchCapability, BatchItem } from '../batch/BatchDownloadManager';
import { fetchUSCardForumContent } from './uscardforum';
import type { FilenameContext } from '../utils/filename';
import { batchLogger as logger } from '../utils/logger';
import { adapterUSCardForum } from '../config';

export class USCardForumBatchCapability implements BatchCapability {
    isListingPage(): boolean {
        const url = window.location.href;
        const config = adapterUSCardForum as any;
        const patterns = config?.batch?.listing_patterns || ['/c/', '/tag/', '/tags/', '/search'];
        const excludePattern = config?.batch?.exclude_pattern || '/t/';

        // Check if URL matches any listing pattern and doesn't match exclude pattern
        return patterns.some((pattern: string) => url.includes(pattern)) && !url.includes(excludePattern);
    }

    extractItems(): BatchItem[] {
        logger.debug('Extracting topic items from USCardForum page');
        const items: BatchItem[] = [];
        const config = adapterUSCardForum as any;

        // Get selectors from config
        const topicSelector = config?.batch?.selectors?.topic_links || 'a.title[href*="/t/"], a[href*="/t/"].raw-topic-link';
        const searchSelector = config?.batch?.selectors?.search_links || 'a.search-link[href*="/t/"]';
        const titleSelector = config?.batch?.selectors?.search_title || '.topic-title > span';
        const topicIdPattern = config?.batch?.patterns?.topic_id || '/t/[^/]+/(\\d+)';
        const baseUrl = config?.site?.base_url || 'https://www.uscardforum.com';

        // Combine selectors
        const combinedSelector = `${topicSelector}, ${searchSelector}`;
        const topicLinks = document.querySelectorAll(combinedSelector);
        logger.debug(`Found ${topicLinks.length} topic link elements`);

        topicLinks.forEach((element) => {
            const anchor = element as HTMLAnchorElement;
            const href = anchor.getAttribute('href');

            if (href) {
                // Extract topic ID using pattern from config
                const regex = new RegExp(topicIdPattern);
                const match = href.match(regex);
                if (match) {
                    const topicId = match[1];

                    // For search results, extract title from nested element
                    let title = '';
                    const titleSpan = anchor.querySelector(titleSelector);
                    if (titleSpan) {
                        title = titleSpan.textContent?.trim() || '';
                    }
                    if (!title) {
                        title = anchor.textContent?.trim() || `Topic ${topicId}`;
                    }

                    items.push({
                        id: topicId,
                        title,
                        url: href.startsWith('http') ? href : `${baseUrl}${href}`,
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

    getContainerSelectors(): string[] {
        const config = adapterUSCardForum as any;
        const containers = config?.batch?.selectors?.containers;

        if (containers) {
            // Return all container selectors from config
            return [
                containers.search_result,
                containers.topic_row,
                containers.generic,
            ].filter(Boolean); // Remove any undefined values
        }

        // Fallback selectors if config not available
        return ['.fps-result', '.topic-list-item', '.ember-view'];
    }

    getFilenameContext(): FilenameContext {
        const config = adapterUSCardForum as any;
        const siteName = config?.site?.name || 'uscardforum';

        // Get patterns from config
        const categoryPattern = config?.batch?.patterns?.category || '/c/([^/]+)';
        const tagPattern = config?.batch?.patterns?.tag || '/tag[s]?/([^/]+)';
        const types = config?.batch?.types || { category: 'category', tag: 'tag', search: 'search', listing: 'listing' };

        // Try to extract category, tag, or search info from URL
        const categoryMatch = window.location.pathname.match(new RegExp(categoryPattern));
        const tagMatch = window.location.pathname.match(new RegExp(tagPattern));
        const isSearchPage = window.location.pathname.includes('/search');

        if (categoryMatch) {
            return {
                site: siteName,
                type: types.category,
                id: categoryMatch[1],
            };
        } else if (tagMatch) {
            return {
                site: siteName,
                type: types.tag,
                id: tagMatch[1],
            };
        } else if (isSearchPage) {
            // Extract search query from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q') || '';
            // Decode URL-encoded query for readable filename
            const decodedQuery = decodeURIComponent(query);

            return {
                site: siteName,
                type: types.search,
                id: decodedQuery || 'search',
            };
        } else {
            return {
                site: siteName,
                type: types.listing,
                id: '',
            };
        }
    }
}

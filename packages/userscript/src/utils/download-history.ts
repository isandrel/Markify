/**
 * Download History Tracking
 * Tracks downloaded posts/threads to prevent duplicates and show visual indicators
 */

export interface DownloadRecord {
    id: string;
    site: string;
    title: string;
    downloadedAt: string; // ISO timestamp
    type: 'single' | 'batch';
}

export interface DownloadHistory {
    [key: string]: DownloadRecord; // key: "{site}:{id}"
}

/**
 * Generate storage key for a download record
 */
function getStorageKey(id: string, site: string): string {
    return `${site}:${id}`;
}

/**
 * Get download history from storage
 */
export async function getDownloadHistory(): Promise<DownloadRecord[]> {
    const history = await GM.getValue('markify_download_history', {}) as DownloadHistory;
    return Object.values(history);
}

/**
 * Check if an item has been downloaded
 */
export async function isDownloaded(id: string, site: string): Promise<boolean> {
    const history = await GM.getValue('markify_download_history', {}) as DownloadHistory;
    const key = getStorageKey(id, site);
    return key in history;
}

/**
 * Mark an item as downloaded
 */
export async function markAsDownloaded(
    id: string,
    site: string,
    title: string,
    type: 'single' | 'batch'
): Promise<void> {
    const history = await GM.getValue('markify_download_history', {}) as DownloadHistory;
    const key = getStorageKey(id, site);

    history[key] = {
        id,
        site,
        title,
        downloadedAt: new Date().toISOString(),
        type,
    };

    await GM.setValue('markify_download_history', history);
}

/**
 * Remove an item from download history
 */
export async function removeDownload(id: string, site: string): Promise<void> {
    const history = await GM.getValue('markify_download_history', {}) as DownloadHistory;
    const key = getStorageKey(id, site);
    delete history[key];
    await GM.setValue('markify_download_history', history);
}

/**
 * Clear all download history
 */
export async function clearHistory(): Promise<void> {
    await GM.setValue('markify_download_history', {});
}

/**
 * Get download statistics
 */
export async function getDownloadStats(): Promise<{
    total: number;
    single: number;
    batch: number;
}> {
    const records = await getDownloadHistory();
    return {
        total: records.length,
        single: records.filter(r => r.type === 'single').length,
        batch: records.filter(r => r.type === 'batch').length,
    };
}

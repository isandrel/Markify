/**
 * Markify Userscript — Browser entry point
 *
 * This is the Tampermonkey/Violentmonkey userscript that provides
 * the browser UI (buttons, settings, notifications, batch downloads).
 *
 * Conversion logic is provided by @markify/core.
 */

import {
    convert,
    findSiteAdapter,
    builtInAdapters,
    formatDate,
    formatMessage,
    logger,
} from '@markify/core';
import type { HttpFetcher, SiteMetadata } from '@markify/core';
import { loadSettings, showSettings } from './settings';
import { theme, notifications, ui, pkg } from './config';

// Global button references for progress updates
let downloadButton: HTMLButtonElement | null = null;
let copyButton: HTMLButtonElement | null = null;
let activeButton: HTMLButtonElement | null = null;

/**
 * Create GM.xmlHttpRequest-based HTTP fetcher for browser environment
 */
function createGMFetcher(): HttpFetcher {
    return {
        get: async (url: string, opts?: any) => {
            return new Promise((resolve, reject) => {
                GM.xmlHttpRequest({
                    method: 'GET',
                    url,
                    onload: (res) => {
                        resolve({
                            status: res.status,
                            ok: res.status >= 200 && res.status < 300,
                            text: res.responseText,
                        });
                    },
                    onerror: () => reject(new Error('Network error')),
                });
            });
        },
    };
}

/**
 * Create fetch-based HTTP fetcher (with credentials)
 */
function createFetchFetcher(): HttpFetcher {
    return {
        get: async (url: string, opts?: any) => {
            const res = await fetch(url, { credentials: opts?.credentials ? 'include' : 'same-origin' });
            return { status: res.status, ok: res.ok, text: await res.text() };
        },
    };
}

/**
 * Convert current page to Markdown using @markify/core
 */
async function convertToMarkdown(): Promise<string> {
    const url = window.location.href;
    const adapter = findSiteAdapter(url, builtInAdapters);

    logger.info(`Using adapter: ${adapter?.name || 'None'}`);

    // Load templates from settings
    const templates = await GM.getValue('markify_templates', null) as any;

    // Handle progress for 1Point3Acres
    const onProgress = adapter?.name === '1Point3Acres'
        ? (progress: string) => { if (activeButton) activeButton.textContent = progress; }
        : undefined;

    // Determine which fetcher to use
    // US Card Forum uses regular fetch, 1Point3Acres uses GM.xmlHttpRequest
    const fetcher = adapter?.name === '1Point3Acres' ? createGMFetcher() : createFetchFetcher();

    if (adapter?.name === 'US Card Forum') {
        GM.notification({
            text: notifications?.messages?.api_fetching || 'Fetching content...',
            title: pkg?.package?.strings?.app_title || 'Markify',
            timeout: notifications?.timeouts?.short || 2000,
        });
    }

    const result = await convert({
        url,
        document: document as any,
        templates,
        fetcher,
        includeFrontmatter: true,
        conversion: {
            headingStyle: (ui?.conversion?.heading_style || 'atx') as any,
            codeBlockStyle: (ui?.conversion?.code_block_style || 'fenced') as any,
            emDelimiter: (ui?.conversion?.em_delimiter || '*') as any,
            strongDelimiter: (ui?.conversion?.strong_delimiter || '**') as any,
            linkStyle: (ui?.conversion?.link_style || 'inlined') as any,
            removeElements: ui?.conversion?.remove_elements?.tags || ['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe'],
        },
    });

    // Restore button text after completion
    if (activeButton && adapter?.name === '1Point3Acres') {
        activeButton.textContent = activeButton === downloadButton
            ? (ui?.ui?.buttons?.download_text || '📥 Markify')
            : (ui?.ui?.buttons?.copy_text || '📋 Copy');
        activeButton = null;
    }

    return result.markdown;
}

/**
 * Extract metadata for filename and download tracking
 */
async function getPageMetadata(): Promise<{ metadata: SiteMetadata; adapter: ReturnType<typeof findSiteAdapter> }> {
    const url = window.location.href;
    const adapter = findSiteAdapter(url, builtInAdapters);

    const metadata: SiteMetadata = {
        title: document.title || 'Untitled',
        url,
        date: formatDate(),
        downloaded: formatDate(),
    };

    if (adapter?.extractMetadata) {
        const customMetadata = await adapter.extractMetadata(document as any, url);
        Object.assign(metadata, customMetadata);
    } else {
        const authorMeta = document.querySelector('meta[name="author"]') as HTMLMetaElement;
        const descMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
        const keywordsMeta = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;

        if (authorMeta?.content) metadata.author = authorMeta.content;
        if (descMeta?.content) metadata.description = descMeta.content;

        const tags = keywordsMeta?.content
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0) || ['web-clip'];

        metadata.tags = tags;
    }

    if (adapter?.frontmatterFields) {
        Object.assign(metadata, adapter.frontmatterFields);
    }

    return { metadata, adapter };
}

/**
 * Download markdown content as a file
 */
function downloadMarkdown(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, notifications?.delays?.cleanup || 100);
}

/**
 * Extract ID from URL (site-specific)
 */
function extractIdFromUrl(): string | undefined {
    const pathname = window.location.pathname;

    // 1Point3Acres: /bbs/thread-{id}-1-1.html or /home/pins/{id}
    const threadMatch = pathname.match(/thread-(\d+)/);
    const pinsMatch = pathname.match(/\/pins\/(\d+)/);
    if (threadMatch) return threadMatch[1];
    if (pinsMatch) return pinsMatch[1];

    // USCardForum: /t/{slug}/{id}
    const uscfMatch = pathname.match(/\/t\/[^/]+\/(\d+)/);
    if (uscfMatch) return uscfMatch[1];

    return undefined;
}

/**
 * Handle download button click
 */
async function handleDownload(mode: 'download' | 'clipboard' = 'download') {
    try {
        const markdown = await convertToMarkdown();
        const { metadata, adapter } = await getPageMetadata();

        // Load filename template from settings
        const templates = await GM.getValue('markify_templates', null) as any;
        const filenameTemplate = templates?.filename?.single || '{title}';

        const { applyFilenameTemplate } = await import('@markify/core');
        const filename = applyFilenameTemplate(filenameTemplate, {
            title: metadata.title || document.title || 'untitled',
            id: extractIdFromUrl(),
            author: metadata.author,
            site: adapter?.name,
            date: formatDate(),
        }) + '.md';

        if (mode === 'clipboard') {
            await GM.setClipboard(markdown, 'text');
            GM.notification({
                text: notifications?.messages?.clipboard_success || 'Copied to clipboard!',
                title: pkg?.package?.strings?.app_title || 'Markify',
                timeout: notifications?.timeouts?.short || 2000,
            });
        } else {
            downloadMarkdown(markdown, filename);
            GM.notification({
                text: formatMessage(notifications?.messages?.download_success || 'Downloaded {filename}', { filename }),
                title: pkg?.package?.strings?.app_title || 'Markify',
                timeout: notifications?.timeouts?.medium || 3000,
            });

            const id = extractIdFromUrl();
            if (id && adapter) {
                const { markAsDownloaded } = await import('./utils/download-history');
                await markAsDownloaded(id, adapter.name, metadata.title || document.title || 'untitled', 'single');
                logger.info(`Marked ${id} as downloaded`);
            }
        }

        const stats = await GM.getValue('markify_stats', 0) as number;
        await GM.setValue('markify_stats', stats + 1);
    } catch (error) {
        console.error('Failed to convert page:', error);
        GM.notification({
            text: notifications?.messages?.conversion_failed || 'Failed to convert page',
            title: pkg?.package?.strings?.app_title || 'Markify',
            timeout: notifications?.timeouts?.long || 5000,
        });
    }
}

/**
 * Show download status indicator on current post page
 */
async function showDownloadStatus() {
    const id = extractIdFromUrl();
    const adapter = findSiteAdapter(window.location.href, builtInAdapters);
    if (!id || !adapter) return;

    const { isDownloaded } = await import('./utils/download-history');
    const downloaded = await isDownloaded(id, adapter.name);

    if (downloaded) {
        const titleElement = document.querySelector('h1.text-xl, h1.font-bold, h1') as HTMLElement;
        if (titleElement) {
            const indicator = document.createElement('span');
            indicator.textContent = ui?.ui?.indicators?.downloaded_icon || '✓';
            indicator.title = ui?.ui?.indicators?.downloaded_tooltip || 'Already downloaded';
            indicator.style.cssText = `
                color: ${theme?.colors?.success || '#22c55e'};
                font-size: ${ui?.ui?.indicators?.font_size_title || '1.2em'};
                margin-right: 6px;
                font-weight: bold;
            `;
            titleElement.insertBefore(indicator, titleElement.firstChild);
            logger.info('Download status indicator added to post page');
        }
    }
}

/**
 * Create and inject download buttons
 */
async function createDownloadButton() {
    const settings = await loadSettings();

    const container = document.createElement('div');
    container.id = 'markify-container';

    Object.assign(container.style, {
        position: 'fixed',
        top: ui?.ui?.position?.default_top || '20px',
        right: ui?.ui?.position?.default_right || '20px',
        zIndex: String(ui?.ui?.position?.z_index || 9999),
        display: 'flex',
        gap: ui?.ui?.buttons?.gap || '8px',
        flexDirection: 'row',
        cursor: 'move',
        userSelect: 'none',
    });

    // Make container draggable
    let isDragging = false;
    let currentX: number;
    let currentY: number;
    let initialX: number;
    let initialY: number;

    container.addEventListener('mousedown', (e) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON') return;
        isDragging = true;
        const rect = container.getBoundingClientRect();
        initialX = e.clientX - rect.left;
        initialY = e.clientY - rect.top;
        container.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        const maxX = window.innerWidth - container.offsetWidth;
        const maxY = window.innerHeight - container.offsetHeight;
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));
        container.style.left = currentX + 'px';
        container.style.top = currentY + 'px';
        container.style.right = 'auto';
        container.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            container.style.cursor = 'move';
            const rect = container.getBoundingClientRect();
            GM.setValue('markify_button_x', rect.left);
            GM.setValue('markify_button_y', rect.top);
        }
    });

    const savedX = await GM.getValue('markify_button_x', null) as number | null;
    const savedY = await GM.getValue('markify_button_y', null) as number | null;

    if (savedX !== null && savedY !== null) {
        container.style.left = savedX + 'px';
        container.style.top = savedY + 'px';
        container.style.right = 'auto';
    }

    const baseButtonStyle = {
        padding: ui?.ui?.style?.padding || '10px 18px',
        border: 'none',
        borderRadius: ui?.ui?.style?.border_radius || '8px',
        fontSize: ui?.ui?.style?.font_size || '14px',
        fontWeight: ui?.ui?.style?.font_weight || '600',
        cursor: 'pointer',
        transition: ui?.ui?.animations?.transition || 'all 0.2s ease',
        fontFamily: ui?.ui?.style?.font_family || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: 'white',
    };

    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = ui?.ui?.buttons?.download_text || '📥 Markify';
    downloadButton = downloadBtn;
    downloadBtn.id = 'markify-download-btn';
    Object.assign(downloadBtn.style, {
        ...baseButtonStyle,
        backgroundColor: theme?.colors?.primary || '#7c3aed',
        boxShadow: ui?.ui?.shadows?.button_default || '0 2px 4px rgba(0,0,0,0.1)',
    });

    downloadBtn.addEventListener('mouseenter', () => {
        downloadBtn.style.backgroundColor = theme?.colors?.primary_hover || '#6d28d9';
        downloadBtn.style.transform = ui?.ui?.animations?.hover_transform || 'translateY(-2px)';
        downloadBtn.style.boxShadow = ui?.ui?.shadows?.button_hover || '0 4px 8px rgba(0,0,0,0.2)';
    });
    downloadBtn.addEventListener('mouseleave', () => {
        downloadBtn.style.backgroundColor = theme?.colors?.primary || '#7c3aed';
        downloadBtn.style.transform = 'translateY(0)';
        downloadBtn.style.boxShadow = ui?.ui?.shadows?.button_default || '0 2px 4px rgba(0,0,0,0.1)';
    });
    downloadBtn.addEventListener('click', () => {
        activeButton = downloadBtn;
        handleDownload('download');
    });

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = ui?.ui?.buttons?.copy_text || '📋 Copy';
    copyButton = copyBtn;
    copyBtn.id = 'markify-copy-btn';
    Object.assign(copyBtn.style, {
        ...baseButtonStyle,
        backgroundColor: theme?.colors?.secondary || '#059669',
        boxShadow: ui?.ui?.shadows?.copy_default || '0 2px 4px rgba(0,0,0,0.1)',
    });

    copyBtn.addEventListener('mouseenter', () => {
        copyBtn.style.backgroundColor = theme?.colors?.secondary_hover || '#047857';
        copyBtn.style.transform = ui?.ui?.animations?.hover_transform || 'translateY(-2px)';
        copyBtn.style.boxShadow = ui?.ui?.shadows?.copy_hover || '0 4px 8px rgba(0,0,0,0.2)';
    });
    copyBtn.addEventListener('mouseleave', () => {
        copyBtn.style.backgroundColor = theme?.colors?.secondary || '#059669';
        copyBtn.style.transform = 'translateY(0)';
        copyBtn.style.boxShadow = ui?.ui?.shadows?.copy_default || '0 2px 4px rgba(0,0,0,0.1)';
    });
    copyBtn.addEventListener('click', () => {
        activeButton = copyBtn;
        handleDownload('clipboard');
    });

    container.appendChild(downloadBtn);
    container.appendChild(copyBtn);
    document.body.appendChild(container);
}

/**
 * Main entry point
 */
(async function main() {
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }

    // Always sync templates from build-time TOML config into GM storage.
    // This ensures adapter configs (API endpoints, field mappings, etc.)
    // stay current with each userscript update.
    if (typeof __MARKIFY_TEMPLATES__ !== 'undefined') {
        await GM.setValue('markify_templates', __MARKIFY_TEMPLATES__);
        console.log('[Markify] Templates synced from config');
    }

    // Register menu commands
    GM.registerMenuCommand(pkg?.package?.menu?.settings || '⚙️ Settings', () => {
        showSettings();
    });

    GM.registerMenuCommand(pkg?.package?.menu?.stats || '📊 View Stats', async () => {
        const count = await GM.getValue('markify_stats', 0) as number;
        const { getDownloadStats } = await import('./utils/download-history');
        const stats = await getDownloadStats();

        GM.notification({
            text: formatMessage(notifications?.messages?.stats_summary || 'Total: {total} | Single: {single} | Batch: {batch} | Tracked: {tracked}', {
                total: count,
                single: stats.single,
                batch: stats.batch,
                tracked: stats.total,
            }),
            title: pkg?.package?.strings?.app_title_stats || 'Markify Stats',
            timeout: notifications?.timeouts?.long || 5000,
        });
    });

    GM.registerMenuCommand(pkg?.package?.menu?.history || '📜 Download History', async () => {
        const { getDownloadHistory } = await import('./utils/download-history');
        const history = await getDownloadHistory();
        const recent = history.slice(-10).reverse();
        const summary = recent.map(r => `${r.title} (${r.site})`).join('\n');
        alert(`Download History (${history.length} items)\n\nRecent:\n${summary || 'No history yet'}`);
    });

    GM.registerMenuCommand(pkg?.package?.menu?.clear_history || '🗑️ Clear History', async () => {
        if (confirm(notifications?.messages?.clear_history_confirm || 'Clear download history?')) {
            const { clearHistory } = await import('./utils/download-history');
            await clearHistory();
            GM.notification({
                text: notifications?.messages?.history_cleared || 'History cleared',
                title: pkg?.package?.strings?.app_title || 'Markify',
                timeout: notifications?.timeouts?.short || 2000,
            });
        }
    });

    GM.registerMenuCommand(pkg?.package?.menu?.reset_stats || '🔄 Reset Stats', async () => {
        await GM.setValue('markify_stats', 0);
        GM.notification({
            text: notifications?.messages?.stats_reset || 'Stats reset',
            title: pkg?.package?.strings?.app_title || 'Markify',
            timeout: notifications?.timeouts?.short || 2000,
        });
    });

    // Create download button
    createDownloadButton();

    // Show download status indicator on post pages
    await showDownloadStatus();

    // Initialize batch download if on a listing page
    setTimeout(async () => {
        // Check 1Point3Acres
        const { OnePoint3AcresBatchCapability } = await import('./adapters/1point3acres-batch');
        const batchCapability1p3a = new OnePoint3AcresBatchCapability();
        if (batchCapability1p3a.isListingPage()) {
            logger.info('1Point3Acres listing page detected - initializing batch download');
            const { BatchDownloadManager } = await import('./batch/BatchDownloadManager');
            const batchManager = new BatchDownloadManager(batchCapability1p3a);
            batchManager.initializeUI();
        }

        // Check USCardForum
        const { USCardForumBatchCapability } = await import('./adapters/uscardforum-batch');
        const batchCapabilityUSCF = new USCardForumBatchCapability();
        if (batchCapabilityUSCF.isListingPage()) {
            logger.info('USCardForum listing page detected - initializing batch download');
            const { BatchDownloadManager } = await import('./batch/BatchDownloadManager');
            const batchManager = new BatchDownloadManager(batchCapabilityUSCF);
            batchManager.initializeUI();
        }
    }, notifications?.delays?.dom_stabilize || 1000);

    console.log('[Markify] Ready! Click the button to download this page as Markdown.');
    console.log('[Markify] Right-click the button to copy to clipboard instead.');
})();

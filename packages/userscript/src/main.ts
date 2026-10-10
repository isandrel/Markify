/**
 * Markify Userscript — Browser entry point
 *
 * This is the Tampermonkey/Violentmonkey userscript that provides
 * the browser UI (buttons, settings, notifications, batch downloads).
 *
 * Conversion logic is provided by @markify/core.
 */

import {
    applyFilenameTemplate,
    convert,
    classifyRegistryRoute,
    classifyRoute,
    createProfileAdapter,
    findProfileAdapter,
    findSiteAdapter,
    builtInAdapters,
    formatDate,
    formatMessage,
    logger,
} from '@markify/core';
import type { AdapterConfig, ConvertResult, SiteMetadata } from '@markify/core';
import { showSettings } from './settings';
import { compiledConfig, getProfiles, initializeConfig, loadOverrides, notifications, pkg, resetOverridesForSite, saveOverrides, templates, theme, ui } from './config';
import { createFetchFetcher, createProfileFetcher } from './http';
import { NavigationController } from './navigation';
import { ProfileBatchCapability } from './adapters/profile-batch';
import { BatchDownloadManager, initiateDownload } from './batch/BatchDownloadManager';
import { clearHistory, clearSiteHistory, configureHistoryProfiles, getDownloadHistory, markAsDownloaded, markManyAsDownloaded } from './utils/download-history';
import { AGENT_API_STORAGE_KEY, createAgentApi, installAgentApi, newAgentToken, normalizeAgentSettings, type AgentHost } from './agent-api';
import { downloadZip } from 'client-zip';

// Global button references for progress updates
let downloadButton: HTMLButtonElement | null = null;
let copyButton: HTMLButtonElement | null = null;
let activeButton: HTMLButtonElement | null = null;
let activeSingleAbort: AbortController | null = null;
let activeBatchManager: BatchDownloadManager | null = null;
let routeGeneration = 0;

type ActiveRoute = NonNullable<ReturnType<typeof classifyRegistryRoute>> & { pollMs: number };

async function configuredBatchDelay(signal: AbortSignal): Promise<void> {
    const delay = notifications?.delays?.batch_item;
    const min = typeof delay === 'object' ? delay.min_ms ?? 1000 : 1000;
    const max = typeof delay === 'object' ? delay.max_ms ?? 3000 : 3000;
    const jitter = typeof delay === 'object' ? delay.jitter ?? 0.25 : 0.25;
    const base = min + Math.random() * Math.max(0, max - min);
    const milliseconds = Math.max(0, Math.round(base * (1 + (Math.random() * 2 - 1) * jitter)));
    await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(finish, milliseconds);
        function finish() { signal.removeEventListener('abort', cancel); resolve(); }
        function cancel() { clearTimeout(timer); signal.removeEventListener('abort', cancel); reject(new DOMException('Download cancelled', 'AbortError')); }
        if (signal.aborted) cancel(); else signal.addEventListener('abort', cancel, { once: true });
    });
}

async function activateRoute(route: ActiveRoute | null, url: string): Promise<void> {
    const generation = ++routeGeneration;
    activeSingleAbort?.abort();
    activeBatchManager?.destroy();
    activeBatchManager = null;
    document.querySelector('[data-markify-owned="history"]')?.remove();
    const toolbar = document.querySelector<HTMLElement>('#markify-container');
    if (toolbar) toolbar.style.display = 'none';
    if (!route) return;
    const profile = getProfiles()[route.profileId];
    if (!profile) return;
    if (route.kind === 'thread') {
        if (toolbar) toolbar.style.display = 'flex';
        await showDownloadStatus(url, () => generation === routeGeneration && window.location.href === url);
        return;
    }
    if (route.kind !== 'listing' || generation !== routeGeneration) return;
    const contentAdapter = createProfileAdapter(profile);
    const capability = new ProfileBatchCapability(profile, async (_id, onProgress, signal, item) => {
        if (!item) throw new Error('Batch item URL is missing');
        return contentAdapter.fetchViaApi!(item.url, createProfileFetcher(profile), profile, { onProgress, signal });
    }, { document, url: () => window.location.href });
    const manager = new BatchDownloadManager(capability, {
        delay: configuredBatchDelay,
        notify: text => GM.notification({
            text,
            title: pkg?.package?.strings?.app_title_batch || 'Markify Batch Download',
            timeout: notifications?.timeouts?.long || 5000,
        }),
    });
    if (generation !== routeGeneration) { manager.destroy(); return; }
    activeBatchManager = manager;
    manager.initializeUI();
}

/**
 * Convert the captured page using an immutable profile and cancellation signal.
 */
async function convertToMarkdown(
    url: string,
    metadataSnapshot: SiteMetadata,
    profile: AdapterConfig | undefined,
    signal: AbortSignal,
): Promise<ConvertResult> {
    const adapter = findProfileAdapter(url) ?? findSiteAdapter(url, builtInAdapters);

    logger.info(`Using adapter: ${adapter?.name || 'None'}`);

    return convert({
        url,
        document: document as any,
        templates,
        fetcher: profile ? createProfileFetcher(profile) : createFetchFetcher(30000),
        adapterConfig: profile,
        metadataSnapshot,
        signal,
        onProgress: progress => { if (!signal.aborted && activeButton) activeButton.textContent = progress; },
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
}

/**
 * Extract metadata for filename and download tracking
 */
async function getPageMetadata(url: string): Promise<{ metadata: SiteMetadata; adapter: ReturnType<typeof findSiteAdapter> }> {
    const adapter = findProfileAdapter(url) ?? findSiteAdapter(url, builtInAdapters);

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
function routeFor(url: string) {
    return classifyRegistryRoute(url, getProfiles());
}

/**
 * Handle download button click
 */
async function handleDownload(mode: 'download' | 'clipboard' = 'download') {
    if (activeSingleAbort) return;
    const startUrl = window.location.href;
    const route = routeFor(startUrl);
    const profile = route ? getProfiles()[route.profileId] : undefined;
    const controller = new AbortController();
    activeSingleAbort = controller;
    try {
        const captured = await getPageMetadata(startUrl);
        const result = await convertToMarkdown(startUrl, captured.metadata, profile, controller.signal);
        if (controller.signal.aborted) return;
        const metadata = result.metadata;
        const adapter = captured.adapter;
        const filenameTemplate = profile?.filename.single ?? templates?.filename?.single ?? '{title}';

        const { applyFilenameTemplate } = await import('@markify/core');
        const filename = applyFilenameTemplate(filenameTemplate, {
            title: metadata.title || captured.metadata.title || 'untitled',
            id: route?.id,
            author: metadata.author,
            site: profile?.site.id ?? adapter?.name,
            date: formatDate(),
        }) + '.md';

        if (mode === 'clipboard') {
            await GM.setClipboard(result.markdown, 'text');
            GM.notification({
                text: notifications?.messages?.clipboard_success || 'Copied to clipboard!',
                title: pkg?.package?.strings?.app_title || 'Markify',
                timeout: notifications?.timeouts?.short || 2000,
            });
        } else {
            downloadMarkdown(result.markdown, filename);
            GM.notification({
                text: formatMessage(notifications?.messages?.download_success || 'Downloaded {filename}', { filename }),
                title: pkg?.package?.strings?.app_title || 'Markify',
                timeout: notifications?.timeouts?.medium || 3000,
            });

            if (route?.id && profile) {
                const { markAsDownloaded } = await import('./utils/download-history');
                await markAsDownloaded(route.id, profile.site.id, metadata.title || captured.metadata.title, 'single');
                logger.info(`Marked ${route.id} as downloaded`);
            }
        }

        const stats = await GM.getValue('markify_stats', 0) as number;
        await GM.setValue('markify_stats', stats + 1);
    } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to convert page:', error);
        GM.notification({
            text: notifications?.messages?.conversion_failed || 'Failed to convert page',
            title: pkg?.package?.strings?.app_title || 'Markify',
            timeout: notifications?.timeouts?.long || 5000,
        });
    } finally {
        if (activeSingleAbort === controller) activeSingleAbort = null;
        if (activeButton) {
            activeButton.textContent = activeButton === downloadButton
                ? (ui?.ui?.buttons?.download_text || '📥 Markify')
                : (ui?.ui?.buttons?.copy_text || '📋 Copy');
            activeButton = null;
        }
    }
}

/**
 * Show download status indicator on current post page
 */
async function showDownloadStatus(url = window.location.href, active: () => boolean = () => true) {
    document.querySelector('[data-markify-owned="history"]')?.remove();
    const route = routeFor(url);
    if (route?.kind !== 'thread' || !route.id) return;
    const profile = getProfiles()[route.profileId];

    const { isDownloaded } = await import('./utils/download-history');
    const downloaded = await isDownloaded(route.id, profile.site.id);
    if (!active()) return;

    if (downloaded) {
        const titleElement = document.querySelector('h1.text-xl, h1.font-bold, h1') as HTMLElement;
        if (titleElement) {
            const indicator = document.createElement('span');
            indicator.dataset.markifyOwned = 'history';
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
    container.style.display = 'none';

    // Make container draggable
    let isDragging = false;
    let currentX: number;
    let currentY: number;
    let initialX: number;
    let initialY: number;

    container.addEventListener('mousedown', (e) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON') return;
        // Without this, passing over a link starts a native drag and mouseup never arrives.
        e.preventDefault();
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
        if (activeSingleAbort) return;
        activeButton = downloadBtn;
        void handleDownload('download');
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
        if (activeSingleAbort) return;
        activeButton = copyBtn;
        void handleDownload('clipboard');
    });

    container.appendChild(downloadBtn);
    container.appendChild(copyBtn);
    document.body.appendChild(container);
}

/** The enabled profile whose origins include the current page. */
function currentProfile(): AdapterConfig | undefined {
    return Object.values(getProfiles()).find(profile => profile.enabled && profile.site.origins.includes(window.location.origin));
}

const agentHost: AgentHost = {
    version: pkg?.package?.version ?? 'dev',
    location: () => window.location.href,
    profile: currentProfile,
    async exportThread(url, options) {
        const profile = currentProfile()!;
        const route = classifyRoute(url, profile);
        const current = classifyRoute(window.location.href, profile);
        // The open thread page has the real title; other threads get what the API returns.
        const snapshot: SiteMetadata = current?.kind === 'thread' && current.id === route?.id
            ? (await getPageMetadata(window.location.href)).metadata
            : { title: options.title || 'Untitled', url, id: route?.id, tags: profile.metadata?.tags, date: formatDate(), downloaded: formatDate() };
        const result = await convertToMarkdown(url, { ...snapshot, url }, profile, options.signal ?? new AbortController().signal);
        const title = result.metadata.title || snapshot.title || 'untitled';
        const filename = applyFilenameTemplate(profile.filename.single, { title, id: route?.id, author: result.metadata.author, site: profile.site.id, date: formatDate() }) + '.md';
        if (options.download) {
            downloadMarkdown(result.markdown, filename);
            if (route?.id) await markAsDownloaded(route.id, profile.site.id, title, 'single');
        }
        return { markdown: result.markdown, filename, title, metadata: { ...result.metadata } };
    },
    async listRows() {
        const profile = currentProfile();
        if (!profile || classifyRoute(window.location.href, profile)?.kind !== 'listing') return null;
        const rows = new ProfileBatchCapability(profile, async () => null, { document, url: () => window.location.href }).extractRows();
        const done = new Set((await getDownloadHistory()).filter(record => record.site === profile.site.id).map(record => record.id));
        return rows.map(row => ({ id: row.id, title: row.title, url: row.url, downloaded: done.has(row.id) }));
    },
    async history(siteId) {
        return (await getDownloadHistory()).filter(record => record.site === siteId)
            .map(({ id, title, downloadedAt, type }) => ({ id, title, downloadedAt, type }));
    },
    async downloadZip(items) {
        const profile = currentProfile()!;
        const context = { site: profile.site.id, date: formatDate() };
        const used = new Set<string>();
        const files = items.map((item, index) => {
            const base = applyFilenameTemplate(profile.filename.batch_item, { ...context, id: item.id, title: item.title, index: String(index + 1).padStart(3, '0') });
            let name = `${base}.md`;
            if (used.has(name.toLowerCase())) name = `${base} [${item.id}].md`;
            used.add(name.toLowerCase());
            return { name, input: item.markdown };
        });
        const archive = `${applyFilenameTemplate(profile.filename.batch, context)}.zip`;
        initiateDownload(await downloadZip(files).blob(), archive);
        await markManyAsDownloaded(items.map(({ id, title }) => ({ id, title })), profile.site.id, 'batch');
        return archive;
    },
    delay: signal => configuredBatchDelay(signal ?? new AbortController().signal),
    async token(siteId) {
        return normalizeAgentSettings(await GM.getValue(AGENT_API_STORAGE_KEY, null)).sites[siteId]?.token;
    },
};
const agentApi = createAgentApi(agentHost);
let agentApiInstalled = false;

/** Defines window.markify on sites where the user enabled it (it stays until reload; a revoked token disables it). */
function installAgentApiOnce(): boolean {
    if (!agentApiInstalled) agentApiInstalled = installAgentApi(typeof unsafeWindow !== 'undefined' ? unsafeWindow : window, agentApi);
    return agentApiInstalled;
}

async function agentApiMenu(action: 'token' | 'disable', profile: AdapterConfig | undefined = currentProfile()): Promise<void> {
    if (!profile) {
        GM.notification({ text: 'Markify has no profile for this site.', title: 'Markify', timeout: 3000 });
        return;
    }
    const settings = normalizeAgentSettings(await GM.getValue(AGENT_API_STORAGE_KEY, null));
    if (action === 'disable') {
        delete settings.sites[profile.site.id];
        await GM.setValue(AGENT_API_STORAGE_KEY, settings);
        GM.notification({ text: `AI console API turned off for ${profile.site.name}; its token is revoked.`, title: 'Markify', timeout: 4000 });
        return;
    }
    // Never shown in the page (prompt/alert/DOM are readable by page scripts); it only goes to the clipboard.
    const token = settings.sites[profile.site.id]?.token ?? newAgentToken();
    settings.sites[profile.site.id] = { token, createdAt: settings.sites[profile.site.id]?.createdAt || new Date().toISOString() };
    await GM.setValue(AGENT_API_STORAGE_KEY, settings);
    agentApi.resetLock();
    // window.markify only exists on the site it is for; other sites get it on their next load.
    const installed = profile.site.id !== currentProfile()?.site.id || installAgentApiOnce();
    await GM.setClipboard(token, 'text');
    GM.notification({
        text: installed
            ? `AI console API on for ${profile.site.name}. Token copied; give it to your agent: await markify.connect(token)`
            : 'Token copied, but this page blocks window.markify. Reload and try again.',
        title: 'Markify',
        timeout: 6000,
    });
}

/** The settings page, wired to the real storage and actions. */
function openSettings(): Promise<void> {
    const builtIn = Object.values(compiledConfig.adapters);
    return showSettings({
        profiles: builtIn,
        // Also on a site the user turned off, so it can be turned back on.
        currentSiteId: builtIn.find(profile => profile.site.origins.includes(window.location.origin))?.site.id,
        loadOverrides,
        saveOverrides,
        agentEnabled: async siteId => !!(await agentHost.token(siteId)),
        agentCopyToken: siteId => agentApiMenu('token', getProfiles()[siteId] ?? compiledConfig.adapters[siteId]),
        agentRevoke: siteId => agentApiMenu('disable', getProfiles()[siteId] ?? compiledConfig.adapters[siteId]),
        history: getDownloadHistory,
        clearHistory: siteId => (siteId ? clearSiteHistory(siteId) : clearHistory()),
        async resetButtonPosition() {
            await GM.deleteValue('markify_button_x');
            await GM.deleteValue('markify_button_y');
            const toolbar = document.querySelector<HTMLElement>('#markify-container');
            if (toolbar) Object.assign(toolbar.style, { left: '', top: ui?.ui?.position?.default_top || '20px', right: ui?.ui?.position?.default_right || '20px' });
        },
        copy: text => GM.setClipboard(text, 'text'),
        notify: text => { GM.notification({ text, title: pkg?.package?.strings?.app_title || 'Markify', timeout: notifications?.timeouts?.short || 2000 }); },
        reload: () => window.location.reload(),
    });
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

    await initializeConfig();
    configureHistoryProfiles(Object.values(getProfiles()));

    // Register menu commands
    GM.registerMenuCommand(pkg?.package?.menu?.settings || '⚙️ Settings', () => {
        void openSettings().catch(error => console.error('[Markify] Settings failed to open', error));
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

    GM.registerMenuCommand('📤 Export Configuration', async () => {
        await GM.setClipboard(JSON.stringify(await loadOverrides(), null, 2), 'text');
        GM.notification({ text: 'Configuration copied to clipboard.', title: 'Markify', timeout: 2000 });
    });

    GM.registerMenuCommand('📥 Import Configuration', async () => {
        const value = prompt('Paste exported Markify configuration JSON:');
        if (!value) return;
        try {
            await saveOverrides(JSON.parse(value));
            GM.notification({ text: 'Configuration saved. Reloading the page.', title: 'Markify', timeout: 2000 });
            window.location.reload();
        } catch (error) {
            GM.notification({ text: `Invalid configuration: ${error instanceof Error ? error.message : String(error)}`, title: 'Markify', timeout: 5000 });
        }
    });

    GM.registerMenuCommand('↩️ Reset Current Site Configuration', async () => {
        const route = routeFor(window.location.href);
        if (!route) return;
        await resetOverridesForSite(route.profileId);
        GM.notification({ text: `Reset ${route.profileId} configuration. Reloading the page.`, title: 'Markify', timeout: 2000 });
        window.location.reload();
    });

    GM.registerMenuCommand('🤖 AI Console API: copy token (turns it on for this site)', () => agentApiMenu('token'));
    GM.registerMenuCommand('🤖 AI Console API: turn off and revoke token (this site)', () => agentApiMenu('disable'));
    const agentSite = currentProfile();
    if (agentSite && await agentHost.token(agentSite.site.id)) installAgentApiOnce();

    // Create download button
    await createDownloadButton();

    const navigation = new NavigationController<ActiveRoute>({
        window,
        resolve: url => {
            const route = classifyRegistryRoute(url, getProfiles());
            if (!route) return null;
            return { ...route, pollMs: getProfiles()[route.profileId].runtime.poll_ms };
        },
        onRoute: (route, url) => { void activateRoute(route, url).catch(error => console.error('[Markify] Route activation failed', error)); },
        onError: error => console.error('[Markify] Route classification failed', error),
    });
    navigation.start();

    console.log('[Markify] Ready! Click the button to download this page as Markdown.');
    console.log('[Markify] Right-click the button to copy to clipboard instead.');
})();

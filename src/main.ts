import TurndownService from 'turndown';
import {
    sanitizeFilename,
    formatDate,
    extractMainContent,
    generateFrontmatter,
    type FrontmatterOptions,
} from './utils';
import {
    findSiteAdapter,
    builtInAdapters,
    fetchUSCardForumContent,
    fetch1Point3AcresContent,
    OnePoint3AcresBatchCapability,
    type SiteAdapter,
    type SiteMetadata,
} from './adapters';
import {
    loadSettings,
    showSettings,
    type MarkifySettings,
} from './settings';
import { BatchDownloadManager } from './batch/BatchDownloadManager';
import { logger } from './utils/logger';

// Global button references for progress updates
let downloadButton: HTMLButtonElement | null = null;
let copyButton: HTMLButtonElement | null = null;
let activeButton: HTMLButtonElement | null = null; // Track which button was clicked

// Initialize Turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
    headingStyle: 'atx', // Use # style headings
    codeBlockStyle: 'fenced', // Use ``` for code blocks
    emDelimiter: '*', // Use * for emphasis
    strongDelimiter: '**', // Use ** for strong
    linkStyle: 'inlined', // Inline links instead of reference-style
});

// Configure Turndown rules for better Obsidian compatibility
turndownService.addRule('strikethrough', {
    filter: ['del', 's', 'strike'] as any,
    replacement: (content: string) => `~~${content}~~`,
});

// Remove unwanted elements before conversion
turndownService.remove(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe']);

/**
 * Extract metadata from the current page using site adapter if available
 */
async function extractMetadata(adapter: SiteAdapter | null): Promise<SiteMetadata> {
    const url = window.location.href;
    const date = formatDate();

    // Start with default metadata
    let metadata: Partial<SiteMetadata> = {
        title: document.title || 'Untitled',
        url,
        date,
        downloaded: formatDate(), // When this was saved
    };

    // Try adapter-specific metadata extraction
    if (adapter?.extractMetadata) {
        const customMetadata = await adapter.extractMetadata(document);
        metadata = { ...metadata, ...customMetadata };
    } else {
        // Fallback to meta tags
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

    // Merge adapter frontmatter fields
    if (adapter?.frontmatterFields) {
        metadata = { ...metadata, ...adapter.frontmatterFields };
    }

    return metadata as SiteMetadata;
}

/**
 * Extract content element using site adapter if available
 */
function extractContent(adapter: SiteAdapter | null): Element {
    // Try adapter-specific selectors first
    if (adapter?.contentSelectors) {
        for (const selector of adapter.contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }
    }

    // Fallback to default extraction
    return extractMainContent();
}

/**
 * Convert current page to Markdown with YAML frontmatter
 */
async function convertToMarkdown(): Promise<string> {
    // Find appropriate site adapter
    const adapter = findSiteAdapter(window.location.href, builtInAdapters);

    console.log(`[Markify] Using adapter: ${adapter?.name || 'None'}`);

    let markdown: string;

    // Special handling for US Card Forum (API-based)
    if (adapter?.name === 'US Card Forum') {
        const match = window.location.pathname.match(/\/t\/[^\/]+\/(\d+)/);
        const topicId = match ? match[1] : null;

        if (!topicId) {
            throw new Error('Could not extract topic ID from URL');
        }

        GM.notification({
            text: 'Fetching forum content via API...',
            title: 'Markify',
            timeout: 2000,
        });

        const rawMarkdown = await fetchUSCardForumContent(topicId);

        if (!rawMarkdown) {
            throw new Error('Failed to fetch forum content');
        }

        markdown = rawMarkdown;
    } else if (adapter?.name === '1Point3Acres') {
        // Special handling for 1Point3Acres (API-based)
        // Format 1: /bbs/thread-{tid}-1-1.html
        // Format 2: /home/pins/{tid}
        let threadId: string | null = null;

        const threadMatch = window.location.pathname.match(/thread-(\d+)/);
        const pinsMatch = window.location.pathname.match(/\/pins\/(\d+)/);

        if (threadMatch) {
            threadId = threadMatch[1];
        } else if (pinsMatch) {
            threadId = pinsMatch[1];
        }

        if (!threadId) {
            throw new Error('Could not extract thread ID from URL');
        }

        const markdownContent = await fetch1Point3AcresContent(threadId, (progress) => {
            // Update only the clicked button's text with progress
            if (activeButton) activeButton.textContent = progress;
        });

        // Restore button text after completion
        if (activeButton) {
            activeButton.textContent = activeButton === downloadButton ? '📥 Download' : '📋 Copy';
            activeButton = null;
        }

        if (!markdownContent) {
            throw new Error('Failed to fetch thread content from API');
        }

        // Content is already Markdown from templates, no need for Turndown
        markdown = markdownContent;
    } else {
        // Standard HTML-to-Markdown conversion
        let contentElement = extractContent(adapter);
        let contentClone = contentElement.cloneNode(true) as HTMLElement;

        // Remove unwanted elements based on adapter
        if (adapter?.removeSelectors) {
            for (const selector of adapter.removeSelectors) {
                contentClone.querySelectorAll(selector).forEach(el => el.remove());
            }
        }

        // Apply pre-processing if available
        if (adapter?.preProcess) {
            contentClone = adapter.preProcess(contentClone) as HTMLElement;
        }

        // Convert HTML to Markdown
        markdown = turndownService.turndown(contentClone);

        // Apply post-processing if available
        if (adapter?.postProcess) {
            markdown = adapter.postProcess(markdown);
        }
    }

    // Generate frontmatter (skip if adapter already includes it)
    let finalContent = markdown;
    let frontmatter = '';

    if (!adapter?.includesFrontmatter) {
        const metadata = await extractMetadata(adapter);
        frontmatter = generateFrontmatter(metadata);

        // Load templates from settings
        const templates = await GM.getValue('markify_templates', null) as any;

        // Apply content template (header, footer)
        if (templates?.content?.header) {
            finalContent = templates.content.header + finalContent;
        }
        if (templates?.content?.footer) {
            finalContent = finalContent + templates.content.footer;
        }

        // Apply document template if enabled
        if (templates?.document?.enabled && templates?.document?.template) {
            const { applyDocumentTemplate } = await import('./templates');
            return applyDocumentTemplate(templates.document.template, {
                frontmatter,
                content: finalContent,
                ...metadata, // Spread all metadata (includes title, url, date, author, etc.)
            });
        }
    }

    // Default: combine frontmatter and content (or just return markdown if adapter includes frontmatter)
    return frontmatter ? `${frontmatter}\n${finalContent}` : markdown;
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

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Handle download button click
 */
async function handleDownload(mode: 'download' | 'clipboard' = 'download') {
    try {
        // Convert to markdown
        const markdown = await convertToMarkdown();

        // Find adapter and extract metadata for filename context
        const adapter = findSiteAdapter(window.location.href, builtInAdapters);
        const metadata = await extractMetadata(adapter);

        // Extract ID from URL (site-specific)
        const extractIdFromUrl = (): string | undefined => {
            // 1Point3Acres: /bbs/thread-{id}-1-1.html or /home/pins/{id}
            const threadMatch = window.location.pathname.match(/thread-(\d+)/);
            const pinsMatch = window.location.pathname.match(/\/pins\/(\d+)/);
            if (threadMatch) return threadMatch[1];
            if (pinsMatch) return pinsMatch[1];

            // USCardForum: /t/{slug}/{id}
            const uscfMatch = window.location.pathname.match(/\/t\/[^\/]+\/(\d+)/);
            if (uscfMatch) return uscfMatch[1];

            return undefined;
        };

        // Load filename template from settings (default: {title})
        const templates = await GM.getValue('markify_templates', null) as any;
        const filenameTemplate = templates?.filename?.single || '{title}';

        // Apply template
        const { applyFilenameTemplate } = await import('./utils/filename');
        const filename = applyFilenameTemplate(filenameTemplate, {
            title: metadata.title || document.title || 'untitled',
            id: extractIdFromUrl(),
            author: metadata.author,
            site: adapter?.name,
            date: formatDate(),
        }) + '.md';

        if (mode === 'clipboard') {
            // Copy to clipboard
            await GM.setClipboard(markdown, 'text');
            GM.notification({
                text: 'Copied to clipboard!',
                title: 'Markify',
                timeout: 2000,
            });
        } else {
            // Download the file
            downloadMarkdown(markdown, filename);
            GM.notification({
                text: `Downloaded as ${filename}`,
                title: 'Markify',
                timeout: 3000,
            });
        }

        // Track stats
        const stats = await GM.getValue('markify_stats', 0) as number;
        await GM.setValue('markify_stats', stats + 1);
    } catch (error) {
        console.error('Failed to convert page:', error);
        GM.notification({
            text: 'Failed to convert page. Check console for details.',
            title: 'Markify',
            timeout: 5000,
        });
    }
}

/**
 * Create and inject download buttons
 */
async function createDownloadButton() {
    const settings = await loadSettings();

    // Container for both buttons
    const container = document.createElement('div');
    container.id = 'markify-container';

    // Style container - default: 25% from top, right side
    Object.assign(container.style, {
        position: 'fixed',
        top: '25%',
        right: '20px',
        zIndex: '10000',
        display: 'flex',
        gap: '10px',
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
        // Don't drag if clicking on buttons
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

        // Keep within viewport bounds
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

            // Save position to settings
            const rect = container.getBoundingClientRect();
            GM.setValue('markify_button_x', rect.left);
            GM.setValue('markify_button_y', rect.top);
        }
    });

    // Load saved position
    const savedX = await GM.getValue('markify_button_x', null) as number | null;
    const savedY = await GM.getValue('markify_button_y', null) as number | null;

    if (savedX !== null && savedY !== null) {
        container.style.left = savedX + 'px';
        container.style.top = savedY + 'px';
        container.style.right = 'auto';
    }

    // Common button styles
    const baseButtonStyle = {
        padding: '12px 20px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: 'white',
    };

    // Create Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '📥 Download';
    downloadButton = downloadBtn;  // Store global reference
    downloadBtn.id = 'markify-download-btn';
    Object.assign(downloadBtn.style, {
        ...baseButtonStyle,
        backgroundColor: '#7c3aed',
        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
    });

    downloadBtn.addEventListener('mouseenter', () => {
        downloadBtn.style.backgroundColor = '#6d28d9';
        downloadBtn.style.transform = 'translateY(-2px)';
        downloadBtn.style.boxShadow = '0 6px 16px rgba(124, 58, 237, 0.5)';
    });

    downloadBtn.addEventListener('mouseleave', () => {
        downloadBtn.style.backgroundColor = '#7c3aed';
        downloadBtn.style.transform = 'translateY(0)';
        downloadBtn.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.4)';
    });

    downloadBtn.addEventListener('click', () => {
        activeButton = downloadBtn;
        handleDownload('download');
    });

    // Create Copy button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copy';
    copyButton = copyBtn;  // Store global reference
    copyBtn.id = 'markify-copy-btn';
    Object.assign(copyBtn.style, {
        ...baseButtonStyle,
        backgroundColor: '#059669',
        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)',
    });

    copyBtn.addEventListener('mouseenter', () => {
        copyBtn.style.backgroundColor = '#047857';
        copyBtn.style.transform = 'translateY(-2px)';
        copyBtn.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.5)';
    });

    copyBtn.addEventListener('mouseleave', () => {
        copyBtn.style.backgroundColor = '#059669';
        copyBtn.style.transform = 'translateY(0)';
        copyBtn.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.4)';
    });

    copyBtn.addEventListener('click', () => {
        activeButton = copyBtn;
        handleDownload('clipboard');
    });

    // Add buttons to container
    container.appendChild(downloadBtn);
    container.appendChild(copyBtn);

    // Add container to page
    document.body.appendChild(container);
}

/**
 * Main entry point
 */
(async function main() {
    // Wait for page to be ready
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }

    // Initialize templates from TOML config (if not already set)
    const existingTemplates = await GM.getValue('markify_templates', null);
    if (!existingTemplates && typeof __MARKIFY_TEMPLATES__ !== 'undefined') {
        await GM.setValue('markify_templates', __MARKIFY_TEMPLATES__);
        console.log('[Markify] Templates loaded from config');
    }

    // Register menu commands
    GM.registerMenuCommand('⚙️ Settings', () => {
        showSettings();
    });

    GM.registerMenuCommand('📊 View Stats', async () => {
        const count = await GM.getValue('markify_stats', 0) as number;
        GM.notification({
            text: `You've converted ${count} ${count === 1 ? 'page' : 'pages'}!`,
            title: 'Markify Stats',
            timeout: 4000,
        });
    });

    GM.registerMenuCommand('🔄 Reset Stats', async () => {
        await GM.setValue('markify_stats', 0);
        GM.notification({
            text: 'Stats reset successfully',
            title: 'Markify',
            timeout: 2000,
        });
    });

    // Create download button
    createDownloadButton();

    // Initialize batch download if on a listing page
    // Add a small delay to ensure DOM is fully loaded (for dynamic content)
    setTimeout(async () => {
        // Check 1Point3Acres
        const batchCapability1p3a = new OnePoint3AcresBatchCapability();
        if (batchCapability1p3a.isListingPage()) {
            logger.info('1Point3Acres listing page detected - initializing batch download');
            const batchManager = new BatchDownloadManager(batchCapability1p3a);
            batchManager.initializeUI();
        }

        // Check USCardForum
        const { USCardForumBatchCapability } = await import('./adapters/uscardforum-batch');
        const batchCapabilityUSCF = new USCardForumBatchCapability();
        if (batchCapabilityUSCF.isListingPage()) {
            logger.info('USCardForum listing page detected - initializing batch download');
            const batchManager = new BatchDownloadManager(batchCapabilityUSCF);
            batchManager.initializeUI();
        }
    }, 1000); // 1 second delay for DOM to stabilize

    console.log('[Markify] Ready! Click the button to download this page as Markdown.');
    console.log('[Markify] Right-click the button to copy to clipboard instead.');
})();

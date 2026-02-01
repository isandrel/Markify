/**
 * Generic Batch Download System
 * Works with any adapter that implements the BatchCapability interface
 */

import { downloadZip } from 'client-zip';
import { sanitizeFilename } from '../utils';
import { batchLogger as logger } from '../utils/logger';

/**
 * Interface for sites that support batch downloading
 */
export interface BatchCapability {
    /**
     * Check if current page is a listing page that supports batch download
     */
    isListingPage(): boolean;

    /**
     * Extract thread/post items from the current listing page
     */
    extractItems(): BatchItem[];

    /**
     * Fetch content for a single item
     */
    fetchItem(itemId: string, onProgress?: (message: string) => void): Promise<string | null>;

    /**
     * Get the name for the ZIP file (without .zip extension)
     */
    getArchiveName(): string;
}

export interface BatchItem {
    id: string;
    title: string;
    url: string;
}

/**
 * Generic Batch Download Manager
 * Handles UI, ZIP creation, and download orchestration for any site
 */
export class BatchDownloadManager {
    private selectedItems: Set<string> = new Set();
    private adapter: BatchCapability;
    private batchButton: HTMLButtonElement | null = null;

    constructor(adapter: BatchCapability) {
        this.adapter = adapter;
    }

    /**
     * Initialize batch download UI on the page
     */
    initializeUI(): void {
        logger.debug('initializeUI called');

        if (!this.adapter.isListingPage()) {
            logger.debug('Not a listing page');
            return;
        }

        const items = this.adapter.extractItems();
        logger.info(`Found ${items.length} items`);

        if (items.length === 0) {
            logger.warn('No items found, aborting');
            return;
        }

        // Add checkboxes to each item
        this.addCheckboxes(items);

        // Create batch download panel
        this.createBatchPanel();
        logger.info('UI initialization complete');
    }

    /**
     * Add checkboxes to thread items
     */
    private addCheckboxes(items: BatchItem[]): void {
        logger.debug(`Adding checkboxes to ${items.length} items`);

        let successCount = 0;
        items.forEach((item, index) => {
            // Find the thread element by its URL
            const linkElement = document.querySelector(`a[href*="${item.id}"]`);
            if (!linkElement) {
                logger.warn(`Could not find link for item ${item.id}`);
                return;
            }

            // Find parent container - try multiple possible selectors
            let container = linkElement.closest('[data-sentry-component="HomeThreadItem"]');
            if (!container) {
                // Fallback: look for common thread item container patterns
                container = linkElement.closest('.border-b');
            }

            if (!container) {
                logger.warn(`Could not find container for item ${item.id}`);
                return;
            }

            // Make container position relative for absolute positioning
            (container as HTMLElement).style.position = 'relative';

            // Create checkbox wrapper with absolute positioning
            const checkboxWrapper = document.createElement('div');
            checkboxWrapper.className = 'markify-checkbox-wrapper';
            checkboxWrapper.style.cssText = `
                position: absolute;
                left: 8px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            // Create checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `markify-batch-${item.id}`;
            checkbox.className = 'markify-batch-checkbox';
            checkbox.style.cssText = `
                width: 18px;
                height: 18px;
                cursor: pointer;
                margin: 0;
            `;

            // Prevent click from propagating to parent link (but allow checkbox to work)
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                if (checkbox.checked) {
                    this.selectedItems.add(item.id);
                } else {
                    this.selectedItems.delete(item.id);
                }
                this.updateBatchButton();
            });

            // Add checkbox to wrapper and wrapper to container
            checkboxWrapper.appendChild(checkbox);
            container.appendChild(checkboxWrapper);

            // Add left padding to container content to make room for checkbox
            const containerElement = container as HTMLElement;
            const currentPadding = window.getComputedStyle(containerElement).paddingLeft;
            const currentPaddingValue = parseInt(currentPadding) || 0;
            containerElement.style.paddingLeft = `${currentPaddingValue + 32}px`;

            successCount++;

            if (index === 0) {
                logger.debug('Successfully added first checkbox');
            }
        });

        logger.info(`Successfully added ${successCount}/${items.length} checkboxes`);
    }

    /**
     * Create the batch download panel
     */
    private createBatchPanel(): void {
        const panel = document.createElement('div');
        panel.id = 'markify-batch-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 10001;
            background: rgba(30, 30, 46, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex;
            gap: 12px;
            align-items: center;
            transition: all 0.3s ease;
        `;

        // Select All checkbox
        const selectAll = document.createElement('input');
        selectAll.type = 'checkbox';
        selectAll.id = 'markify-select-all';
        selectAll.style.cssText = `
            width: 18px;
            height: 18px;
            cursor: pointer;
        `;
        selectAll.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.markify-batch-checkbox') as NodeListOf<HTMLInputElement>;
            checkboxes.forEach(cb => {
                cb.checked = selectAll.checked;
                if (selectAll.checked) {
                    const id = cb.id.replace('markify-batch-', '');
                    this.selectedItems.add(id);
                } else {
                    this.selectedItems.clear();
                }
            });
            this.updateBatchButton();
        });

        const selectAllLabel = document.createElement('label');
        selectAllLabel.htmlFor = 'markify-select-all';
        selectAllLabel.textContent = 'Select All';
        selectAllLabel.style.cssText = `
            color: #cdd6f4;
            font-size: 14px;
            cursor: pointer;
            user-select: none;
        `;

        // Batch download button
        this.batchButton = document.createElement('button');
        this.batchButton.textContent = '📥 Download Selected (0)';
        this.batchButton.disabled = true;
        this.batchButton.style.cssText = `
            padding: 10px 18px;
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            opacity: 0.5;
        `;

        this.batchButton.addEventListener('click', () => {
            this.downloadSelected();
        });

        panel.appendChild(selectAll);
        panel.appendChild(selectAllLabel);
        panel.appendChild(this.batchButton);
        document.body.appendChild(panel);
    }

    /**
     * Update batch button state
     */
    private updateBatchButton(): void {
        if (!this.batchButton) return;

        const count = this.selectedItems.size;
        this.batchButton.textContent = `📥 Download Selected (${count})`;
        this.batchButton.disabled = count === 0;
        this.batchButton.style.opacity = count === 0 ? '0.5' : '1';
        this.batchButton.style.cursor = count === 0 ? 'not-allowed' : 'pointer';
    }

    /**
     * Download selected items as ZIP
     */
    private async downloadSelected(): Promise<void> {
        const items = this.adapter.extractItems().filter(item => this.selectedItems.has(item.id));

        if (items.length === 0) {
            return;
        }

        const total = items.length;
        let processed = 0;
        const errors: string[] = [];
        const files: { name: string; input: string }[] = [];

        for (const item of items) {
            processed++;

            if (this.batchButton) {
                this.batchButton.textContent = `📥 Processing ${processed}/${total}...`;
            }

            try {
                logger.info(`Downloading ${processed}/${total}: ${item.title}`);

                const markdown = await this.adapter.fetchItem(item.id, (msg) => {
                    if (this.batchButton) {
                        this.batchButton.textContent = `${msg} (${processed}/${total})`;
                    }
                });

                if (markdown) {
                    const filename = sanitizeFilename(item.title) + '.md';
                    files.push({ name: filename, input: markdown });
                } else {
                    errors.push(item.title);
                }
            } catch (error) {
                errors.push(item.title);
                logger.error(`Error downloading ${item.title}:`, error);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Check if we have any files to zip
        logger.info(`Finished downloading. Got ${files.length} files`);

        if (files.length === 0) {
            logger.warn('No files to zip, aborting');
            if (this.batchButton) {
                this.batchButton.textContent = '❌ No Files';
            }
            GM.notification({
                text: 'No files were successfully downloaded',
                title: 'Markify Batch Download',
                timeout: 3000,
            });
            return;
        }

        // Generate and download ZIP
        try {
            logger.info(`Creating ZIP with ${files.length} files using client-zip...`);
            if (this.batchButton) {
                this.batchButton.textContent = '📦 Creating ZIP...';
            }


            // client-zip works instantly in userscript environments
            const zipBlob = await downloadZip(files).blob();

            logger.info(`ZIP created successfully (${(zipBlob.size / 1024 / 1024).toFixed(2)} MB)`);

            const zipFilename = this.adapter.getArchiveName() + '.zip';
            logger.info(`Downloading as: ${zipFilename}`);

            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = zipFilename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                logger.debug('Cleaned up download link');
            }, 100);

            logger.info('ZIP download initiated');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to generate or download ZIP:', error);
            if (this.batchButton) {
                this.batchButton.textContent = '❌ ZIP Failed';
            }
            GM.notification({
                text: `Failed to create ZIP: ${errorMessage}`,
                title: 'Markify Batch Download Error',
                timeout: 5000,
            });
            return;
        }

        // Reset UI
        this.selectedItems.clear();
        const checkboxes = document.querySelectorAll('.markify-batch-checkbox') as NodeListOf<HTMLInputElement>;
        checkboxes.forEach(cb => cb.checked = false);
        this.updateBatchButton();

        // Show result
        if (errors.length > 0) {
            GM.notification({
                text: `Downloaded ${total - errors.length}/${total} items. ${errors.length} failed.`,
                title: 'Markify Batch Download',
                timeout: 5000,
            });
        } else {
            GM.notification({
                text: `Successfully downloaded all ${total} items!`,
                title: 'Markify Batch Download',
                timeout: 3000,
            });
        }
    }
}

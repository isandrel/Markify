import { downloadZip } from 'client-zip';
import { applyFilenameTemplate } from '@markify/core';
import type { FilenameContext } from '@markify/core';
import { getDownloadHistory, markManyAsDownloaded, updateStatus, type DownloadRecord } from '../utils/download-history';

type HistoryRecord = Pick<DownloadRecord, 'id' | 'site'> & Partial<Pick<DownloadRecord, 'downloadedAt' | 'replies' | 'check'>>;

export interface BatchItem { id: string; title: string; url: string }
export interface BatchRow extends BatchItem {
    element: HTMLElement;
    link: HTMLAnchorElement;
    /** ISO time of the thread's last activity, when the listing shows it. */
    activity?: string;
}
export interface BatchCapability {
    readonly siteId: string;
    readonly pageKey: string;
    readonly debounceMs: number;
    readonly filename: { single: string; batch_item: string; batch: string };
    isListingPage(): boolean;
    extractRows(): BatchRow[];
    fetchItem(id: string, progress?: (message: string) => void, signal?: AbortSignal, item?: BatchItem): Promise<string | null>;
    getFilenameContext(): FilenameContext | Promise<FilenameContext>;
}
export interface BatchFile { name: string; input: string }
export interface BatchServices {
    document: Document;
    history: () => Promise<readonly HistoryRecord[]>;
    saveHistory: (items: readonly BatchItem[], site: string, active: () => boolean) => Promise<void>;
    zip: (files: BatchFile[]) => Promise<Blob>;
    download: (blob: Blob, filename: string) => void;
    delay: (signal: AbortSignal) => Promise<void>;
    notify: (message: string) => void;
}
interface OwnedRow { host: HTMLElement; row: BatchRow; wrapper: HTMLElement; checkbox: HTMLInputElement; position: string; padding: string }

/** Always release the object URL, including click failures. History has a separate failure boundary. */
export function initiateDownload(blob: Blob, filename: string, doc: Document = document): void {
    const url = URL.createObjectURL(blob);
    const anchor = doc.createElement('a');
    try {
        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = 'none';
        doc.body.appendChild(anchor);
        anchor.click();
    } finally {
        anchor.remove();
        // Allow the browser to consume the click before releasing the blob URL.
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
}

/** Owns exactly one listing generation. Adapters supply rows, never selector hints. */
export class BatchDownloadManager {
    private readonly services: BatchServices;
    private readonly startKey: string;
    private readonly rows = new Map<string, OwnedRow>();
    private readonly selected = new Set<string>();
    private panel: HTMLElement | null = null;
    private selectAll: HTMLInputElement | null = null;
    private button: HTMLButtonElement | null = null;
    private observer: MutationObserver | null = null;
    private timer: ReturnType<typeof setTimeout> | undefined;
    private generation = 0;
    private destroyed = false;
    private running = false;
    private refreshPromise: Promise<void> | null = null;
    private refreshAgain = false;
    private readonly abort = new AbortController();

    constructor(private readonly adapter: BatchCapability, services: Partial<BatchServices> = {}) {
        const doc = services.document ?? document;
        this.startKey = adapter.pageKey;
        this.services = {
            document: doc,
            history: getDownloadHistory,
            saveHistory: (items, site, active) => markManyAsDownloaded(items, site, 'batch', active),
            zip: files => downloadZip(files).blob(),
            download: (blob, filename) => initiateDownload(blob, filename, doc),
            delay: async () => undefined,
            notify: message => { GM.notification({ title: 'Markify Batch Download', text: message, timeout: 5000 }); },
            ...services,
        };
    }

    private active(generation = this.generation): boolean {
        return !this.destroyed && generation === this.generation && this.adapter.pageKey === this.startKey;
    }

    initializeUI(): void {
        if (!this.active() || !this.adapter.isListingPage() || this.panel) return;
        this.createPanel();
        const Observer = this.services.document.defaultView?.MutationObserver;
        if (Observer) {
            this.observer = new Observer(mutations => {
                const owned = (node: Node): boolean => {
                    const element = node.nodeType === 1 ? node as Element : node.parentElement;
                    return !!element?.closest('[data-markify-owned]');
                };
                if (mutations.every(m => owned(m.target) || (m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].every(owned)))) return;
                clearTimeout(this.timer);
                this.timer = setTimeout(() => { void this.refresh().catch(error => this.report(error)); }, this.adapter.debounceMs);
            });
            this.observer.observe(this.services.document.body, { childList: true, subtree: true, attributes: true, characterData: true, attributeFilter: ['href', 'data-sentry-component', 'aria-busy'] });
        }
        void this.refresh().catch(error => this.report(error));
    }

    refresh(): Promise<void> {
        if (!this.active()) return Promise.resolve();
        this.refreshAgain = true;
        if (this.refreshPromise) return this.refreshPromise;
        this.refreshPromise = this.reconcile().finally(() => { this.refreshPromise = null; });
        return this.refreshPromise;
    }

    private async reconcile(): Promise<void> {
        const generation = this.generation;
        while (this.refreshAgain && this.active(generation)) {
            this.refreshAgain = false;
            const discovered = this.adapter.extractRows();
            const records = await this.services.history();
            if (!this.active(generation)) return;
            const current = new Map(discovered.filter(row => row.element.isConnected).map(row => [row.id, row]));
            for (const [id, owned] of this.rows) {
                if (current.get(id)?.element !== owned.row.element || !owned.wrapper.isConnected) {
                    this.detach(owned);
                    this.rows.delete(id);
                }
                if (!current.has(id)) this.selected.delete(id);
            }
            for (const row of current.values()) {
                const existing = this.rows.get(row.id);
                if (existing) { existing.row = row; continue; }
                const record = records.find(entry => entry.site === this.adapter.siteId && entry.id === row.id);
                this.rows.set(row.id, this.attach(row, record));
            }
            this.updateControls();
        }
    }

    private attach(row: BatchRow, record?: HistoryRecord): OwnedRow {
        const doc = this.services.document;
        const wrapper = doc.createElement('div');
        wrapper.className = 'markify-checkbox-wrapper';
        wrapper.dataset.markifyOwned = 'row';
        wrapper.style.cssText = 'position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:20;display:flex;align-items:center;pointer-events:auto;';
        const checkbox = doc.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'markify-batch-checkbox';
        checkbox.dataset.itemId = row.id;
        checkbox.setAttribute('aria-label', `Select ${row.title}`);
        checkbox.style.cssText = 'width:18px;height:18px;margin:0;cursor:pointer;';
        checkbox.checked = this.selected.has(row.id);
        for (const event of ['click', 'pointerdown', 'keydown']) wrapper.addEventListener(event, e => e.stopPropagation());
        checkbox.addEventListener('change', e => {
            e.stopPropagation();
            if (this.running || !this.active()) { checkbox.checked = this.selected.has(row.id); return; }
            if (checkbox.checked) this.selected.add(row.id); else this.selected.delete(row.id);
            this.updateControls();
        });
        wrapper.appendChild(checkbox);
        if (record) {
            // Changed since download: the listing shows later activity, or a check found it.
            const listed = !!(row.activity && record.downloadedAt && Date.parse(row.activity) > Date.parse(record.downloadedAt));
            const changed = listed || (!!record.downloadedAt && updateStatus(record as DownloadRecord).changed);
            const indicator = doc.createElement('span');
            indicator.className = 'markify-history-indicator';
            indicator.dataset.markifyStatus = changed ? 'updated' : 'downloaded';
            indicator.textContent = changed ? '✓↻' : '✓';
            indicator.title = changed ? 'Downloaded; updated since' : 'Already downloaded';
            indicator.style.cssText = `color:${changed ? '#f59e0b' : '#22c55e'};margin-left:4px;`;
            wrapper.appendChild(indicator);
        }
        const host = row.element.tagName === 'TR' ? row.link.closest<HTMLElement>('td, th') ?? row.element : row.element;
        const owned = { host, row, wrapper, checkbox, position: host.style.position, padding: host.style.paddingLeft };
        const padding = Number.parseFloat(doc.defaultView?.getComputedStyle?.(host).paddingLeft ?? '') || 0;
        host.style.position = 'relative';
        host.style.paddingLeft = `${padding + 36}px`;
        host.appendChild(wrapper);
        return owned;
    }
    private detach(owned: OwnedRow): void {
        owned.wrapper.remove();
        owned.host.style.position = owned.position;
        owned.host.style.paddingLeft = owned.padding;
    }
    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.generation++;
        this.abort.abort();
        this.observer?.disconnect();
        clearTimeout(this.timer);
        for (const owned of this.rows.values()) this.detach(owned);
        this.rows.clear();
        this.selected.clear();
        this.panel?.remove();
        this.panel = this.button = this.selectAll = null;
    }

    private createPanel(): void {
        const doc = this.services.document;
        this.panel = doc.createElement('div');
        this.panel.id = 'markify-batch-panel';
        this.panel.dataset.markifyOwned = 'panel';
        this.panel.style.cssText = 'position:fixed;bottom:80px;right:20px;z-index:10001;background:#1e1e2e;color:#cdd6f4;border-radius:12px;padding:16px 20px;display:flex;gap:12px;align-items:center;';
        this.selectAll = doc.createElement('input');
        this.selectAll.type = 'checkbox';
        this.selectAll.id = 'markify-select-all';
        this.selectAll.addEventListener('change', () => {
            if (this.running || !this.active()) return;
            this.selected.clear();
            if (this.selectAll?.checked) for (const id of this.rows.keys()) this.selected.add(id);
            this.updateControls();
        });
        const label = doc.createElement('label');
        label.htmlFor = this.selectAll.id;
        label.textContent = 'Select All';
        this.button = doc.createElement('button');
        this.button.style.cssText = 'background:#7c3aed;color:white;border:0;border-radius:8px;padding:10px 18px;';
        this.button.addEventListener('click', () => { void this.downloadSelected(); });
        this.panel.append(this.selectAll, label, this.button);
        doc.body.append(this.panel);
        this.updateControls();
    }
    private updateControls(): void {
        if (this.button) {
            if (!this.running) this.button.textContent = `📥 Download Selected (${this.selected.size})`;
            this.button.disabled = this.running || !this.selected.size || !this.active();
        }
        if (this.selectAll) {
            this.selectAll.checked = this.rows.size > 0 && this.selected.size === this.rows.size;
            this.selectAll.indeterminate = this.selected.size > 0 && this.selected.size < this.rows.size;
            this.selectAll.disabled = this.running || !this.rows.size;
        }
        for (const [id, owned] of this.rows) {
            owned.checkbox.checked = this.selected.has(id);
            owned.checkbox.disabled = this.running;
        }
    }
    private report(error: unknown): void {
        if (this.active()) this.services.notify(error instanceof Error ? error.message : String(error));
    }

    async downloadSelected(): Promise<void> {
        if (this.running || !this.active()) return;
        const items = this.adapter.extractRows().filter(row => this.selected.has(row.id)).map(({ id, title, url }) => Object.freeze({ id, title, url }));
        if (!items.length) return;
        this.running = true;
        this.updateControls();
        const generation = this.generation;
        const active = (): boolean => this.active(generation);
        const filenames = { ...this.adapter.filename };
        const successful: BatchItem[] = [];
        const failures: string[] = [];
        try {
            const context = { ...await this.adapter.getFilenameContext() };
            if (!active()) return;
            const files: BatchFile[] = [];
            const usedNames = new Set<string>();
            for (const [index, item] of items.entries()) {
                if (!active()) return;
                if (this.button) this.button.textContent = `Processing ${index + 1}/${items.length}`;
                try {
                    const markdown = await this.adapter.fetchItem(item.id, message => { if (active() && this.button) this.button.textContent = message; }, this.abort.signal, item);
                    if (!active()) return;
                    if (!markdown?.trim()) throw new Error('No complete content returned');
                    const base = applyFilenameTemplate(filenames.batch_item, { ...context, id: item.id, title: item.title, index: String(index + 1).padStart(3, '0') });
                    let name = `${base}.md`;
                    let suffix = 1;
                    while (usedNames.has(name.toLowerCase())) name = `${base} [${item.id}${suffix++ > 1 ? `-${suffix - 1}` : ''}].md`;
                    usedNames.add(name.toLowerCase());
                    files.push({ name, input: markdown });
                    successful.push(item);
                } catch (error) {
                    if (!active()) return;
                    failures.push(`${item.title}: ${error instanceof Error ? error.message : String(error)}`);
                }
                if (index < items.length - 1) await this.services.delay(this.abort.signal);
            }
            if (!active()) return;
            if (!files.length) { this.services.notify(`No files downloaded. ${failures.join('; ')}`); return; }
            const blob = await this.services.zip(files);
            if (!active()) return;
            this.services.download(blob, `${applyFilenameTemplate(filenames.batch, context)}.zip`);
            if (!active()) return;
            try { await this.services.saveHistory(successful, this.adapter.siteId, active); }
            catch (error) { if (active()) this.services.notify(`ZIP download started, but history could not be saved: ${error instanceof Error ? error.message : String(error)}`); }
            if (!active()) return;
            for (const item of successful) this.selected.delete(item.id);
            this.services.notify(`Download started for ${successful.length}/${items.length} items.${failures.length ? ` ${failures.length} failed and remain selected. ${failures.join('; ')}` : ''}`);
        } catch (error) { this.report(error); }
        finally { this.running = false; if (active()) this.updateControls(); }
    }
}

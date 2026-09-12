import { classifyRoute } from '@markify/core';
import type { AdapterConfig, FilenameContext } from '@markify/core';
import type { BatchCapability, BatchRow, BatchItem } from '../batch/BatchDownloadManager';

export type BatchContentFetcher = (id: string, onProgress?: (message: string) => void, signal?: AbortSignal, item?: BatchItem) => Promise<string | null>;
export interface BatchEnvironment { document?: Document; url?: () => string }
export interface ExtractionDiagnostic {
    site: string;
    route?: string;
    layout?: string;
    status: 'ready' | 'empty' | 'loading' | 'unsupported';
    count: number;
}

/** DOM behavior is selected by a validated profile; protocols remain injected. */
export class ProfileBatchCapability implements BatchCapability {
    readonly document: Document;
    private readonly currentURL: () => string;
    diagnostic: ExtractionDiagnostic;

    constructor(readonly profile: AdapterConfig, private readonly fetchContent: BatchContentFetcher, environment: BatchEnvironment = {}) {
        this.document = environment.document ?? document;
        this.currentURL = environment.url ?? (() => window.location.href);
        this.diagnostic = { site: profile.site.id, status: 'unsupported', count: 0 };
    }

    get siteId(): string { return this.profile.site.id; }
    get debounceMs(): number { return this.profile.runtime.debounce_ms; }
    get filename(): AdapterConfig['filename'] { return this.profile.filename; }
    get pageKey(): string { return classifyRoute(this.currentURL(), this.profile)?.key ?? this.currentURL(); }
    isListingPage(): boolean { return classifyRoute(this.currentURL(), this.profile)?.kind === 'listing'; }

    extractRows(): BatchRow[] {
        const route = classifyRoute(this.currentURL(), this.profile);
        this.diagnostic = { site: this.siteId, route: route?.name, status: 'unsupported', count: 0 };
        if (route?.kind !== 'listing') return [];
        for (const layout of this.profile.batch.layouts) {
            if (!layout.route_names.includes(route.name)) continue;
            try {
                const roots = Array.from(this.document.querySelectorAll(layout.root_selector));
                if (!roots.length) continue;
                if (layout.loading_selector && roots.some(root => root.querySelector(layout.loading_selector!))) {
                    this.diagnostic = { ...this.diagnostic, layout: layout.name, status: 'loading' };
                    return [];
                }
                const rows: BatchRow[] = [];
                const seen = new Set<string>();
                for (const root of roots) {
                    for (const element of Array.from(root.querySelectorAll<HTMLElement>(layout.row_selector))) {
                        if (layout.exclude_selectors.some(selector => element.closest(selector))) continue;
                        for (const link of Array.from(element.querySelectorAll<HTMLAnchorElement>(layout.link_selector))) {
                            const href = link.getAttribute('href');
                            if (!href) continue;
                            let url: URL;
                            try { url = new URL(href, route.url); } catch { continue; }
                            const thread = classifyRoute(url.href, this.profile);
                            if (thread?.kind !== 'thread' || !thread.id || seen.has(thread.id)) continue;
                            const titleNode = layout.title_selector ? element.querySelector(layout.title_selector) : link;
                            const title = (layout.title_attribute
                                ? titleNode?.getAttribute(layout.title_attribute)?.trim() || titleNode?.textContent?.trim()
                                : titleNode?.textContent?.trim());
                            // Reject structural fallback rows without a verified title node.
                            if (!title) continue;
                            seen.add(thread.id);
                            rows.push({ id: thread.id, title, url: url.href, element, link });
                            break;
                        }
                    }
                }
                if (rows.length) {
                    this.diagnostic = { ...this.diagnostic, layout: layout.name, status: 'ready', count: rows.length };
                    return rows;
                }
                if (layout.empty_selector && roots.some(root => root.querySelector(layout.empty_selector!))) {
                    this.diagnostic = { ...this.diagnostic, layout: layout.name, status: 'empty' };
                    return [];
                }
            } catch (error) {
                throw new Error(`[${this.siteId}] batch.layouts.${layout.name}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return [];
    }

    fetchItem(id: string, onProgress?: (message: string) => void, signal?: AbortSignal, item?: BatchItem): Promise<string | null> {
        return this.fetchContent(id, onProgress, signal, item);
    }

    getFilenameContext(): FilenameContext {
        const route = classifyRoute(this.currentURL(), this.profile);
        if (route?.kind !== 'listing') throw new Error(`[${this.siteId}] Not a supported listing`);
        const id = route.id ?? route.url.searchParams.get('q') ?? route.name;
        const labelNode = this.profile.batch.label_selector ? this.document.querySelector(this.profile.batch.label_selector) : null;
        const label = (this.profile.batch.label_attribute ? labelNode?.getAttribute(this.profile.batch.label_attribute) : labelNode?.textContent)?.trim();
        return { site: this.siteId, type: route.name, id, tagname: label || id };
    }
}

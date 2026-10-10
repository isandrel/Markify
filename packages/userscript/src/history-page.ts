/**
 * Download history page (menu → 📜 Download History, or from Settings): every
 * downloaded thread, whether it changed since (new replies or activity after the
 * download), and checking, re-downloading or forgetting threads.
 *
 * Checks cost one light request per thread, run one at a time with a pause, and
 * only for the site of the open page: that is where the logged-in session and the
 * site's own transport work.
 */
import type { AdapterConfig } from '@markify/core';
import { DIALOG_STYLE, escape, mountDialog, t } from './dialog';
import { updateStatus, type DownloadRecord, type ThreadSnapshot } from './utils/download-history';

export interface HistoryHost {
    profiles: AdapterConfig[];
    currentSiteId?: string;
    history(): Promise<DownloadRecord[]>;
    /** The thread's state on the site (current site only). */
    check(siteId: string, id: string): Promise<ThreadSnapshot>;
    recordCheck(siteId: string, id: string, state: ThreadSnapshot): Promise<unknown>;
    redownload(record: DownloadRecord): Promise<void>;
    remove(siteId: string, id: string): Promise<void>;
    sourceUrl(siteId: string, id: string): string | undefined;
    /** Pause between checks. */
    delay(signal: AbortSignal): Promise<void>;
    notify(text: string): void;
}

const L = {
    title: t('Download history', '下载记录'),
    site: t('Site', '站点'),
    all: t('All sites', '所有站点'),
    show: t('Show', '显示'),
    every: t('All', '全部'),
    changed: t('Updated since download', '下载后有更新'),
    unchecked: t('Not checked', '未检查'),
    summary: (total: number, changed: number, unchecked: number) => t(`${total} threads · ${changed} updated · ${unchecked} not checked`, `共 ${total} 条 · ${changed} 条有更新 · ${unchecked} 条未检查`),
    check: t('Check for updates', '检查更新'),
    stop: t('Stop', '停止'),
    checking: (done: number, total: number) => t(`Checking ${done}/${total}…`, `检查中 ${done}/${total}…`),
    checkHere: (name: string) => t(`Open ${name} to check or re-download its threads.`, `打开 ${name} 的页面才能检查或重新下载它的帖子。`),
    upToDate: t('Up to date', '最新'),
    updated: (replies?: number) => replies ? t(`Updated · +${replies} replies`, `有更新 · +${replies} 条回复`) : t('Updated', '有更新'),
    failed: t('Check failed', '检查失败'),
    redownload: t('Download again', '重新下载'),
    remove: t('Remove', '删除'),
    empty: t('Nothing here yet.', '还没有记录。'),
    close: t('Close', '关闭'),
    downloaded: t('Downloaded', '下载于'),
    checkedAt: t('checked', '检查于'),
};

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');

const EXTRA_STYLE = `
.panel { width: min(860px, calc(100vw - 32px)); }
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 12px 0; }
.toolbar select { width: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
td { padding: 8px 6px; border-top: 1px solid #27272a; vertical-align: top; }
td.title a { color: #e4e4e7; text-decoration: none; }
td.title a:hover { text-decoration: underline; }
td.title .meta { color: #a1a1aa; font-size: 12px; margin-top: 2px; }
td.actions { white-space: nowrap; text-align: right; }
td.actions button { padding: 4px 10px; font-size: 12px; }
.chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; white-space: nowrap; }
.chip.changed { background: #451a03; color: #fdba74; }
.chip.fresh { background: #052e16; color: #86efac; }
.chip.unknown { background: #27272a; color: #a1a1aa; }
.chip.failed { background: #450a0a; color: #fca5a5; }
`;

export async function showHistory(host: HistoryHost): Promise<void> {
    const { root, close: unmount } = mountDialog('markify-history');
    let site = host.profiles.some(profile => profile.site.id === host.currentSiteId) ? host.currentSiteId! : '';
    let filter: 'all' | 'changed' | 'unchecked' = 'all';
    let records: DownloadRecord[] = [];
    const failures = new Map<string, string>();
    let checking: AbortController | undefined;
    const close = () => { checking?.abort(); unmount(); };
    const nameOf = (id: string) => host.profiles.find(profile => profile.site.id === id)?.site.name ?? id;
    const key = (record: DownloadRecord) => `${record.site}:${record.id}`;

    const visible = () => records
        .filter(record => !site || record.site === site)
        .filter(record => filter === 'all' || (filter === 'changed' ? updateStatus(record).changed : !updateStatus(record).checked))
        .sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt));

    function chip(record: DownloadRecord): string {
        if (failures.has(key(record))) return `<span class="chip failed" title="${escape(failures.get(key(record)))}">${L.failed}</span>`;
        const status = updateStatus(record);
        if (!status.checked) return `<span class="chip unknown">${L.unchecked}</span>`;
        return status.changed ? `<span class="chip changed">${L.updated(status.newReplies)}</span>` : `<span class="chip fresh">${L.upToDate}</span>`;
    }

    function row(record: DownloadRecord): string {
        const url = host.sourceUrl(record.site, record.id);
        const here = record.site === host.currentSiteId;
        return `<tr data-key="${escape(key(record))}">
            <td class="title">${url ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(record.title)}</a>` : escape(record.title)}
                <div class="meta">${site ? '' : `${escape(nameOf(record.site))} · `}${L.downloaded} ${escape(when(record.downloadedAt))}${record.check ? ` · ${L.checkedAt} ${escape(when(record.check.at))}` : ''}</div></td>
            <td>${chip(record)}</td>
            <td class="actions">${here ? `<button data-action="redownload">${L.redownload}</button> ` : ''}<button data-action="remove">${L.remove}</button></td>
        </tr>`;
    }

    async function render(): Promise<void> {
        records = await host.history();
        const ofSite = records.filter(record => !site || record.site === site);
        const changed = ofSite.filter(record => updateStatus(record).changed).length;
        const unchecked = ofSite.filter(record => !updateStatus(record).checked).length;
        const list = visible();
        const canCheck = !!site && site === host.currentSiteId;
        root.innerHTML = `<style>${DIALOG_STYLE}${EXTRA_STYLE}</style>
            <div class="overlay"><div class="panel" role="dialog" aria-modal="true" aria-label="${escape(L.title)}">
            <header><h2>📜 ${L.title}</h2></header>
            <main>
                <div class="toolbar">
                    <label class="check">${L.site}<select data-action="site"><option value="">${L.all}</option>
                        ${host.profiles.map(p => `<option value="${escape(p.site.id)}" ${p.site.id === site ? 'selected' : ''}>${escape(p.site.name)}</option>`).join('')}</select></label>
                    <label class="check">${L.show}<select data-action="filter">
                        <option value="all" ${filter === 'all' ? 'selected' : ''}>${L.every}</option>
                        <option value="changed" ${filter === 'changed' ? 'selected' : ''}>${L.changed}</option>
                        <option value="unchecked" ${filter === 'unchecked' ? 'selected' : ''}>${L.unchecked}</option></select></label>
                    ${canCheck ? `<button class="primary" data-action="check">${L.check}</button>` : ''}
                </div>
                <p class="hint" data-status="summary">${L.summary(ofSite.length, changed, unchecked)}</p>
                ${site && !canCheck ? `<p class="hint">${escape(L.checkHere(nameOf(site)))}</p>` : ''}
                ${list.length ? `<table><tbody>${list.map(row).join('')}</tbody></table>` : `<p class="hint">${L.empty}</p>`}
            </main>
            <footer><span class="error" role="alert"></span><button data-action="close">${L.close}</button></footer>
            </div></div>`;
    }

    const setStatus = (text: string) => {
        const status = root.querySelector('[data-status="summary"]');
        if (status) status.textContent = text;
    };

    /** Checks the shown threads one at a time, least recently checked first. */
    async function checkAll(): Promise<void> {
        const controller = new AbortController();
        checking = controller;
        const button = root.querySelector<HTMLButtonElement>('[data-action="check"]');
        if (button) { button.textContent = L.stop; button.dataset.action = 'stop'; }
        const queue = visible().sort((a, b) => (a.check?.at ?? '').localeCompare(b.check?.at ?? ''));
        try {
            for (const [index, record] of queue.entries()) {
                if (controller.signal.aborted) break;
                setStatus(L.checking(index + 1, queue.length));
                try {
                    await host.recordCheck(record.site, record.id, await host.check(record.site, record.id));
                    failures.delete(key(record));
                } catch (error) {
                    failures.set(key(record), error instanceof Error ? error.message : String(error));
                }
                if (index < queue.length - 1) await host.delay(controller.signal).catch(() => undefined);
            }
        } finally {
            if (checking === controller) checking = undefined;
        }
        if (!controller.signal.aborted) await render();
    }

    async function act(action: string, target: HTMLElement): Promise<void> {
        const record = records.find(entry => key(entry) === target.closest<HTMLElement>('tr')?.dataset.key);
        switch (action) {
            case 'close': close(); return;
            case 'check': await checkAll(); return;
            case 'stop': checking?.abort(); checking = undefined; await render(); return;
            case 'redownload': if (record) { await host.redownload(record); failures.delete(key(record)); } break;
            case 'remove': if (record) await host.remove(record.site, record.id); break;
            default: return;
        }
        await render();
    }

    const fail = (error: unknown) => {
        const box = root.querySelector('.error');
        if (box) box.textContent = error instanceof Error ? error.message : String(error);
    };
    root.addEventListener('click', event => {
        // Page scripts can reach an open shadow root; only a real user may act here.
        if (!event.isTrusted) return;
        const target = event.target as HTMLElement;
        if (target.classList.contains('overlay')) { close(); return; }
        const action = target.closest<HTMLElement>('button[data-action]')?.dataset.action;
        if (action) void act(action, target).catch(fail);
    });
    root.addEventListener('change', event => {
        const target = event.target as HTMLSelectElement;
        if (target.dataset.action === 'site') site = target.value;
        else if (target.dataset.action === 'filter') filter = target.value as typeof filter;
        else return;
        checking?.abort();
        void render().catch(fail);
    });
    root.addEventListener('keydown', event => { if ((event as KeyboardEvent).key === 'Escape') close(); });
    await render();
}

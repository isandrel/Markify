/**
 * Markify settings page: an in-page dialog (Tampermonkey menu → ⚙️ Settings)
 * for the options that actually drive exports. It edits the validated user
 * overrides (markify_overrides_v1): per site or for all sites, an empty field
 * inherits. It also manages the AI console API, download history and the
 * configuration file.
 *
 * The dialog lives in a shadow root so page styles cannot break it, and its
 * buttons ignore synthetic clicks, so page scripts cannot press them. No secret
 * is ever rendered: tokens only go to the clipboard.
 */
import { applyFilenameTemplate } from '@markify/core';
import type { AdapterConfig } from '@markify/core';
import type { UserOverrides } from '@markify/core/config';

export interface HistoryEntry { id: string; site: string; title: string; downloadedAt: string; type: string }

/** What the page needs from the userscript; main.ts supplies the real ones. */
export interface SettingsHost {
    /** Built-in profiles, before user overrides: the defaults fields fall back to. */
    profiles: AdapterConfig[];
    /** The site of the open page, selected first. */
    currentSiteId?: string;
    loadOverrides(): Promise<UserOverrides>;
    /** Validates and stores; throws with the reason when invalid. */
    saveOverrides(next: unknown): Promise<void>;
    agentEnabled(siteId: string): Promise<boolean>;
    agentCopyToken(siteId: string): Promise<void>;
    agentRevoke(siteId: string): Promise<void>;
    history(): Promise<HistoryEntry[]>;
    clearHistory(siteId?: string): Promise<void>;
    resetButtonPosition(): Promise<void>;
    copy(text: string): Promise<void>;
    notify(text: string): void;
    reload(): void;
}

type Layer = Record<string, any>;
const TEMPLATE_BLOCKS = ['document', 'frontmatter', 'comments_header', 'comment', 'reply', 'replies_gap'] as const;
const FILENAMES = ['single', 'batch_item', 'batch'] as const;
const SAMPLE = { title: '示例标题 Example', id: '12345', author: 'author', date: '2026-01-01', index: '001', type: 'category', tagname: 'tag' };

const zh = typeof navigator !== 'undefined' && /^zh\b/i.test(navigator.language);
const t = (english: string, chinese: string) => (zh ? chinese : english);
const L = {
    title: t('Markify Settings', 'Markify 设置'),
    scope: t('Applies to', '应用于'),
    allSites: t('All sites (defaults)', '所有站点（默认）'),
    thisSite: t('this page', '当前页面'),
    enabled: t('Enable Markify on this site', '在此站点启用 Markify'),
    enabledHint: t('Off: no buttons or checkboxes here until you turn it back on (the menu stays).', '关闭后此站点不显示按钮和复选框（菜单仍可用）。'),
    filenames: t('File names', '文件名'),
    single: t('Single thread', '单个帖子'),
    batchItem: t('File inside a ZIP', 'ZIP 内的文件'),
    batch: t('ZIP archive', 'ZIP 压缩包'),
    inherit: t('Empty = use', '留空 = 使用'),
    preview: t('Preview', '预览'),
    placeholders: t('Placeholders', '可用占位符'),
    network: t('Network', '网络'),
    timeout: t('Request timeout (seconds)', '请求超时（秒）'),
    templates: t('Templates (advanced)', '模板（高级）'),
    templatesHint: t('Empty = the built-in template shown in grey.', '留空 = 使用灰色显示的内置模板。'),
    agent: t('AI Console API', 'AI 控制台 API'),
    agentOn: t('On: agents with this site\'s token can export through window.markify.', '已开启：持有本站令牌的 AI 可通过 window.markify 导出。'),
    agentOff: t('Off.', '已关闭。'),
    agentCopy: t('Copy token (turns it on)', '复制令牌（同时开启）'),
    agentRevoke: t('Turn off and revoke', '关闭并吊销令牌'),
    history: t('Download history', '下载记录'),
    historyCount: (all: number, site?: number) => site === undefined ? t(`${all} downloads`, `共 ${all} 条`) : t(`${site} on this site, ${all} in total`, `本站 ${site} 条，共 ${all} 条`),
    clearSite: t('Clear this site', '清除本站记录'),
    clearAll: t('Clear all', '清除全部记录'),
    resetButton: t('Reset button position', '重置按钮位置'),
    config: t('Configuration', '配置'),
    export: t('Copy configuration (JSON)', '复制配置（JSON）'),
    import: t('Import', '导入'),
    importHint: t('Paste exported JSON here, then Import', '在此粘贴导出的 JSON，然后点导入'),
    resetSite: t('Reset this site', '重置本站设置'),
    resetAll: t('Reset everything', '重置全部设置'),
    cancel: t('Cancel', '取消'),
    save: t('Save and reload', '保存并刷新'),
    saved: t('Settings saved', '设置已保存'),
    confirmClearAll: t('Clear the whole download history?', '确定清除全部下载记录？'),
    confirmResetAll: t('Reset every setting to the defaults?', '确定将所有设置恢复默认？'),
    copied: t('Configuration copied to the clipboard', '配置已复制到剪贴板'),
    done: t('Done', '完成'),
};

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value ?? null));

/** Drops empty values so a layer only holds what the user actually set. */
function prune(layer: Layer): Layer {
    const out: Layer = {};
    for (const [key, value] of Object.entries(layer)) {
        if (value === undefined || value === '' || value === null) continue;
        if (typeof value === 'object' && !Array.isArray(value)) {
            const inner = prune(value);
            if (Object.keys(inner).length) out[key] = inner;
        } else out[key] = value;
    }
    return out;
}

const STYLE = `
:host { all: initial; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 2147483646;
  font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; color: #e5e7eb; }
.panel { background: #18181b; border: 1px solid #3f3f46; border-radius: 14px; width: min(680px, calc(100vw - 32px)); max-height: calc(100vh - 48px);
  display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,.5); }
header, footer { padding: 16px 20px; display: flex; gap: 12px; align-items: center; }
header { border-bottom: 1px solid #3f3f46; }
footer { border-top: 1px solid #3f3f46; justify-content: flex-end; }
h2 { margin: 0; font-size: 18px; color: #c4b5fd; flex: 1; }
main { padding: 4px 20px 16px; overflow-y: auto; }
section { padding: 14px 0; border-bottom: 1px solid #27272a; }
section:last-child { border-bottom: 0; }
h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #a1a1aa; }
label.row { display: grid; grid-template-columns: 170px 1fr; gap: 10px; align-items: center; margin: 8px 0; }
label.check { display: flex; gap: 8px; align-items: center; white-space: nowrap; }
input[type=text], input[type=number], select, textarea { box-sizing: border-box; width: 100%; padding: 7px 10px; border-radius: 8px; border: 1px solid #52525b;
  background: #27272a; color: #f4f4f5; font: inherit; }
textarea { min-height: 84px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
input::placeholder, textarea::placeholder { color: #71717a; }
.hint { color: #a1a1aa; font-size: 12px; margin: 4px 0 0; }
.preview { color: #a7f3d0; font-family: ui-monospace, monospace; font-size: 12px; }
.buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
button { padding: 8px 14px; border-radius: 8px; border: 1px solid #52525b; background: #3f3f46; color: #fafafa; font: inherit; cursor: pointer; }
button:hover { background: #52525b; }
button.primary { background: #7c3aed; border-color: #7c3aed; }
button.primary:hover { background: #6d28d9; }
button.danger { border-color: #7f1d1d; background: #450a0a; }
.error { color: #fca5a5; white-space: pre-wrap; flex: 1; font-size: 12px; }
details summary { cursor: pointer; color: #d4d4d8; }
@media (max-width: 560px) { label.row { grid-template-columns: 1fr; } }
`;

/** Opens the settings dialog; resolves once it is shown. */
export async function showSettings(host: SettingsHost): Promise<void> {
    document.getElementById('markify-settings')?.remove();
    const saved = await host.loadOverrides();
    const draft: { global: Layer; sites: Record<string, Layer> } = { global: clone(saved.global), sites: clone(saved.sites) };
    const profiles = host.profiles;
    let scope = profiles.some(profile => profile.site.id === host.currentSiteId) ? host.currentSiteId! : '';

    const element = document.createElement('div');
    element.id = 'markify-settings';
    element.setAttribute('data-markify-owned', 'settings');
    const root = element.attachShadow({ mode: 'open' });
    document.body.appendChild(element);
    const close = () => element.remove();

    const layerOf = (id: string): Layer => (id ? (draft.sites[id] ??= {}) : draft.global);
    const profileOf = (id: string) => profiles.find(profile => profile.site.id === id);

    /** What an empty field falls back to: the global override, then the profile default. */
    const inherited = (id: string, read: (layer: Layer) => unknown, fromProfile: (profile: AdapterConfig) => unknown): string => {
        if (id) {
            const global = read(draft.global);
            if (global !== undefined && global !== '') return String(global);
            return String(fromProfile(profileOf(id)!) ?? '');
        }
        const values = [...new Set(profiles.map(profile => String(fromProfile(profile) ?? '')))];
        return values.length === 1 ? values[0] : t('each site\'s default', '各站点默认值');
    };

    async function render(): Promise<void> {
        const layer = layerOf(scope);
        const profile = scope ? profileOf(scope) : undefined;
        const history = await host.history();
        const agentOn = scope ? await host.agentEnabled(scope) : false;

        const filenameRows = FILENAMES.map(key => {
            const label = { single: L.single, batch_item: L.batchItem, batch: L.batch }[key];
            const fallback = inherited(scope, l => l.filename?.[key], p => p.filename[key]);
            const keys = key === 'batch' ? 'site, type, id, date, tagname' : `title, author, id, date, site${key === 'batch_item' ? ', index' : ''}`;
            return `<label class="row"><span>${label}</span><span>
                <input type="text" data-field="filename.${key}" value="${escape(layer.filename?.[key])}" placeholder="${escape(`${L.inherit} ${fallback}`)}">
                <div class="hint">${L.placeholders}: ${keys.split(', ').map(k => `{${k}}`).join(' ')}</div>
                <div class="hint">${L.preview}: <span class="preview" data-preview="${key}"></span></div></span></label>`;
        }).join('');

        const blocks = profile ? TEMPLATE_BLOCKS.filter(block => (profile as any)[block]?.template) : [];
        const templates = blocks.length ? `<section><details><summary>${L.templates}</summary><p class="hint">${L.templatesHint}</p>
            ${blocks.map(block => `<label class="row"><span>${block}</span><textarea data-field="${block}.template" placeholder="${escape((profile as any)[block].template)}">${escape(layer[block]?.template)}</textarea></label>`).join('')}
            </details></section>` : '';

        const fallbackMs = inherited(scope, l => l.runtime?.timeout_ms, p => p.runtime.timeout_ms);
        const timeoutFallback = /^\d+$/.test(fallbackMs) ? String(Number(fallbackMs) / 1000) : fallbackMs;
        const siteCount = scope ? history.filter(entry => entry.site === scope).length : undefined;
        root.innerHTML = `<style>${STYLE}</style>
            <div class="overlay" part="overlay"><div class="panel" role="dialog" aria-modal="true" aria-label="${escape(L.title)}">
            <header><h2>⚙️ ${L.title}</h2>
                <label class="check">${L.scope}
                <select data-action="scope">
                    <option value="">${L.allSites}</option>
                    ${profiles.map(p => `<option value="${escape(p.site.id)}" ${p.site.id === scope ? 'selected' : ''}>${escape(p.site.name)}${p.site.id === host.currentSiteId ? ` (${L.thisSite})` : ''}</option>`).join('')}
                </select></label>
            </header>
            <main>
                ${scope ? `<section><label class="check"><input type="checkbox" data-field="enabled" ${layer.enabled === false ? '' : 'checked'}> ${L.enabled}</label>
                    <p class="hint">${L.enabledHint}</p></section>` : ''}
                <section><h3>${L.filenames}</h3>${filenameRows}</section>
                <section><h3>${L.network}</h3>
                    <label class="row"><span>${L.timeout}</span><input type="number" min="1" max="120" step="1" data-field="runtime.timeout_ms"
                        value="${layer.runtime?.timeout_ms ? layer.runtime.timeout_ms / 1000 : ''}" placeholder="${escape(`${L.inherit} ${timeoutFallback}`)}"></label>
                </section>
                ${scope ? `<section><h3>${L.agent}</h3><p class="hint" data-status="agent">${agentOn ? L.agentOn : L.agentOff}</p>
                    <div class="buttons"><button data-action="agent-copy">${L.agentCopy}</button>${agentOn ? `<button class="danger" data-action="agent-revoke">${L.agentRevoke}</button>` : ''}</div></section>` : ''}
                <section><h3>${L.history}</h3><p class="hint" data-status="history">${L.historyCount(history.length, siteCount)}</p>
                    <div class="buttons">${scope ? `<button data-action="clear-site">${L.clearSite}</button>` : ''}
                    <button class="danger" data-action="clear-all">${L.clearAll}</button><button data-action="reset-button">${L.resetButton}</button></div></section>
                ${templates}
                <section><h3>${L.config}</h3>
                    <div class="buttons"><button data-action="export">${L.export}</button>
                    ${scope ? `<button data-action="reset-site">${L.resetSite}</button>` : ''}<button class="danger" data-action="reset-all">${L.resetAll}</button></div>
                    <textarea data-input="import" placeholder="${escape(L.importHint)}"></textarea>
                    <div class="buttons"><button data-action="import">${L.import}</button></div>
                </section>
            </main>
            <footer><span class="error" role="alert"></span><button data-action="cancel">${L.cancel}</button><button class="primary" data-action="save">${L.save}</button></footer>
            </div></div>`;
        updatePreviews();
    }

    /** Copies the form into the draft layer of the current scope. */
    function collect(): void {
        const layer = layerOf(scope);
        for (const input of Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-field]'))) {
            const [group, key] = input.dataset.field!.split('.');
            let value: unknown = input instanceof HTMLInputElement && input.type === 'checkbox' ? (input.checked ? undefined : false) : input.value.trim();
            if (group === 'runtime' && value !== '') value = Math.round(Number(value) * 1000);
            if (key) layer[group] = { ...(layer[group] ?? {}), [key]: value };
            else layer[group] = value;
        }
        const pruned = prune(layer);
        if (scope) {
            if (Object.keys(pruned).length) draft.sites[scope] = pruned; else delete draft.sites[scope];
        } else draft.global = pruned;
    }

    function updatePreviews(): void {
        const site = scope || profiles[0]?.site.id || 'site';
        for (const key of FILENAMES) {
            const input = root.querySelector<HTMLInputElement>(`[data-field="filename.${key}"]`);
            const target = root.querySelector(`[data-preview="${key}"]`);
            if (!input || !target) continue;
            const template = input.value.trim() || (scope ? (draft.global.filename?.[key] || profileOf(scope)!.filename[key]) : profileOf(site)?.filename[key] ?? '{title}');
            try {
                target.textContent = applyFilenameTemplate(template, { ...SAMPLE, site }) + (key === 'batch' ? '.zip' : '.md');
            } catch (error) {
                target.textContent = error instanceof Error ? error.message : String(error);
            }
        }
    }

    const fail = (error: unknown) => {
        const box = root.querySelector('.error');
        if (box) box.textContent = error instanceof Error ? error.message : String(error);
    };
    const overrides = () => ({ schema_version: 1, global: prune(draft.global), sites: Object.fromEntries(Object.entries(draft.sites).map(([id, layer]) => [id, prune(layer)]).filter(([, layer]) => Object.keys(layer as Layer).length)) });

    async function act(action: string): Promise<void> {
        switch (action) {
            case 'cancel': close(); return;
            case 'save':
                collect();
                await host.saveOverrides(overrides());
                host.notify(L.saved);
                close();
                host.reload();
                return;
            case 'agent-copy': await host.agentCopyToken(scope); break;
            case 'agent-revoke': await host.agentRevoke(scope); break;
            case 'clear-site': await host.clearHistory(scope); break;
            case 'clear-all': if (!confirm(L.confirmClearAll)) return; await host.clearHistory(); break;
            case 'reset-button': await host.resetButtonPosition(); host.notify(L.done); return;
            case 'export': collect(); await host.copy(JSON.stringify(overrides(), null, 2)); host.notify(L.copied); return;
            case 'import': {
                const text = root.querySelector<HTMLTextAreaElement>('[data-input="import"]')!.value;
                const parsed = JSON.parse(text);
                await host.saveOverrides(parsed);
                host.notify(L.saved);
                close();
                host.reload();
                return;
            }
            case 'reset-site':
                // Only this site's stored settings go; unsaved edits elsewhere are dropped with the reload.
                await host.saveOverrides({ ...saved, sites: Object.fromEntries(Object.entries(saved.sites).filter(([id]) => id !== scope)) });
                host.notify(L.saved);
                close();
                host.reload();
                return;
            case 'reset-all':
                if (!confirm(L.confirmResetAll)) return;
                await host.saveOverrides({ schema_version: 1, global: {}, sites: {} });
                host.notify(L.saved);
                close();
                host.reload();
                return;
            default: return;
        }
        await render();
    }

    root.addEventListener('click', event => {
        // Page scripts can dispatch clicks into an open shadow root; only a real user may press these.
        if (!event.isTrusted) return;
        const target = event.target as HTMLElement;
        if (target.classList.contains('overlay')) { close(); return; }
        const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
        if (!action || action === 'scope') return;
        fail('');
        void act(action).catch(fail);
    });
    root.addEventListener('change', event => {
        // Switching the viewed site saves nothing, so it needs no isTrusted check.
        const target = event.target as HTMLElement;
        if (target.dataset.action !== 'scope') return;
        collect();
        scope = (target as HTMLSelectElement).value;
        void render().catch(fail);
    });
    root.addEventListener('input', () => updatePreviews());
    root.addEventListener('keydown', event => { if ((event as KeyboardEvent).key === 'Escape') close(); });

    await render();
}

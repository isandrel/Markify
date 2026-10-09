/**
 * Bridge from the MCP server to the user's own Chrome, where the Markify
 * userscript runs with the user's logins and has already passed bot checks.
 * It speaks the Chrome DevTools Protocol directly (no extra dependency) and
 * calls the token-gated `window.markify` in a tab of the site.
 *
 * Tokens come from the server's environment (MARKIFY_TOKENS), so the model
 * never sees them. One connection is kept (Chrome may ask the user to approve
 * each new one) and reopened when the browser restarts.
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { classifyRoute } from '@markify/core';
import type { AdapterConfig } from '@markify/core';

export class BrowserError extends Error {
    constructor(readonly code: string, message: string) { super(message); this.name = 'BrowserError'; }
}

export interface Tab { targetId: string; url: string; title: string }
export interface SiteTab extends Tab { site: AdapterConfig; route: ReturnType<typeof classifyRoute> }

/** "1point3acres=mfy_…,linuxdo=mfy_…" (commas, semicolons or newlines). */
export function parseTokens(value = ''): Record<string, string> {
    const tokens: Record<string, string> = {};
    for (const entry of value.split(/[,;\n]/)) {
        const match = entry.trim().match(/^([a-z0-9-]+)\s*=\s*(\S+)$/i);
        if (match) tokens[match[1].toLowerCase()] = match[2];
    }
    return tokens;
}

/** Chrome profile folders that hold DevToolsActivePort once remote debugging is on. */
function profileDirs(): string[] {
    const home = homedir();
    const local = process.env.LOCALAPPDATA ?? join(home, 'AppData', 'Local');
    switch (process.platform) {
        case 'darwin': return ['Google/Chrome', 'Google/Chrome Beta', 'Google/Chrome Canary', 'Chromium', 'Microsoft Edge']
            .map(dir => join(home, 'Library', 'Application Support', dir));
        case 'win32': return ['Google/Chrome/User Data', 'Google/Chrome Beta/User Data', 'Chromium/User Data', 'Microsoft/Edge/User Data']
            .map(dir => join(local, ...dir.split('/')));
        default: return ['google-chrome', 'google-chrome-beta', 'chromium', 'microsoft-edge']
            .map(dir => join(process.env.XDG_CONFIG_HOME ?? join(home, '.config'), dir));
    }
}

const HOW_TO_CONNECT = 'Turn on remote debugging in Chrome (chrome://inspect/#remote-debugging), '
    + 'or start Chrome with --remote-debugging-port=9222 --user-data-dir=<a separate profile>, '
    + 'or set MARKIFY_BROWSER to its DevTools URL (http://127.0.0.1:9222 or ws://…).';

/** The browser-level DevTools WebSocket URL for MARKIFY_BROWSER ("auto" by default). */
export async function resolveEndpoint(setting = 'auto'): Promise<string> {
    if (/^wss?:\/\//.test(setting)) return setting;
    const candidates = /^https?:\/\//.test(setting) ? [setting] : [];
    if (setting === 'auto') {
        for (const dir of profileDirs()) {
            const file = join(dir, 'DevToolsActivePort');
            if (!existsSync(file)) continue;
            const [port, path] = readFileSync(file, 'utf8').split(/\r?\n/);
            if (/^\d+$/.test(port ?? '') && path?.startsWith('/devtools/browser/')) return `ws://127.0.0.1:${port}${path}`;
        }
        candidates.push('http://127.0.0.1:9222');
    } else if (!candidates.length) {
        throw new BrowserError('NO_BROWSER', `MARKIFY_BROWSER must be "auto", an http(s) or a ws(s) URL, not "${setting}"`);
    }
    for (const base of candidates) {
        try {
            const response = await fetch(new URL('/json/version', base), { signal: AbortSignal.timeout(3000) });
            const url = (await response.json() as { webSocketDebuggerUrl?: string }).webSocketDebuggerUrl;
            if (url) return url;
        } catch { /* try the next one */ }
    }
    throw new BrowserError('NO_BROWSER', `No Chrome with remote debugging found. ${HOW_TO_CONNECT}`);
}

/** Minimal CDP client over one browser-level WebSocket (flattened sessions). */
class Cdp {
    closed = false;
    private nextId = 0;
    private readonly pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();

    private constructor(private readonly socket: WebSocket) {
        socket.addEventListener('message', event => {
            const message = JSON.parse(String(event.data)) as { id?: number; result?: unknown; error?: { message: string } };
            const call = message.id === undefined ? undefined : this.pending.get(message.id);
            if (!call) return;
            this.pending.delete(message.id!);
            if (message.error) call.reject(new BrowserError('CDP_ERROR', message.error.message));
            else call.resolve(message.result);
        });
        socket.addEventListener('close', () => {
            this.closed = true;
            for (const call of this.pending.values()) call.reject(new BrowserError('NO_BROWSER', 'The browser closed the DevTools connection'));
            this.pending.clear();
        });
    }

    static open(url: string): Promise<Cdp> {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(url);
            const timer = setTimeout(() => { socket.close(); reject(new BrowserError('NO_BROWSER', `Timed out connecting to ${url}. Approve the connection in Chrome if it asks.`)); }, 30_000);
            socket.addEventListener('open', () => { clearTimeout(timer); resolve(new Cdp(socket)); }, { once: true });
            socket.addEventListener('error', () => { clearTimeout(timer); reject(new BrowserError('NO_BROWSER', `Could not connect to ${url}. ${HOW_TO_CONNECT}`)); }, { once: true });
        });
    }

    send<T = any>(method: string, params: Record<string, unknown> = {}, sessionId?: string, timeoutMs = 30_000): Promise<T> {
        const id = ++this.nextId;
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => { this.pending.delete(id); reject(new BrowserError('TIMEOUT', `${method} took longer than ${Math.round(timeoutMs / 1000)}s`)); }, timeoutMs);
            this.pending.set(id, {
                resolve: value => { clearTimeout(timer); resolve(value); },
                reject: error => { clearTimeout(timer); reject(error); },
            });
            this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
        });
    }

    close(): void { this.socket.close(); }
}

export interface BridgeOptions {
    /** MARKIFY_BROWSER: "auto", http://host:port or a ws:// DevTools URL. */
    endpoint?: string;
    tokens: Record<string, string>;
    profiles: () => AdapterConfig[];
    /** Longest a single window.markify call may take. */
    timeoutMs?: number;
}

export class BrowserBridge {
    private cdp?: Promise<Cdp>;

    constructor(private readonly options: BridgeOptions) {}

    private async connect<T>(work: (cdp: Cdp) => Promise<T>): Promise<T> {
        const current = await this.cdp?.catch(() => undefined);
        if (!current || current.closed) {
            this.cdp = resolveEndpoint(this.options.endpoint).then(Cdp.open);
            this.cdp.catch(() => { this.cdp = undefined; });
        }
        return work(await this.cdp!);
    }

    private siteOf(url: string): AdapterConfig | undefined {
        let origin: string;
        try { origin = new URL(url).origin; } catch { return undefined; }
        return this.options.profiles().find(profile => profile.enabled && profile.site.origins.includes(origin));
    }

    /** Open tabs on Markify sites, most recently used first as Chrome reports them. */
    private async siteTabs(cdp: Cdp): Promise<SiteTab[]> {
        const { targetInfos } = await cdp.send<{ targetInfos: { targetId: string; type: string; url: string; title: string }[] }>('Target.getTargets');
        return targetInfos.filter(target => target.type === 'page').flatMap(target => {
            const site = this.siteOf(target.url);
            if (!site) return [];
            let route = null;
            try { route = classifyRoute(target.url, site); } catch { /* ambiguous route */ }
            return [{ targetId: target.targetId, url: target.url, title: target.title, site, route }];
        });
    }

    /** Runs one window.markify method in a tab and returns its value or throws its error code. */
    private async call(cdp: Cdp, tab: SiteTab, method: string, args: unknown[]): Promise<any> {
        const token = this.options.tokens[tab.site.site.id];
        if (!token) {
            throw new BrowserError('NO_TOKEN', `No token for ${tab.site.site.name}. In Chrome, open the Tampermonkey menu on ${tab.site.site.base_url}, `
                + `choose "🤖 AI Console API: copy token", and add ${tab.site.site.id}=<token> to MARKIFY_TOKENS in this MCP server's settings.`);
        }
        const expression = `(async () => {
            if (!window.markify) return { error: { code: 'NOT_INSTALLED', message: 'window.markify is missing: the Markify userscript is not running here, or its AI Console API is off for this site' } };
            try {
                const client = await window.markify.connect(${JSON.stringify(token)});
                return { value: await client[${JSON.stringify(method)}](...${JSON.stringify(args)}) };
            } catch (error) {
                return { error: error && typeof error.code === 'string' ? error : { code: 'PAGE_ERROR', message: String(error && error.message || error) } };
            }
        })()`;
        const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId: tab.targetId, flatten: true });
        try {
            const timeoutMs = this.options.timeoutMs ?? 600_000;
            const evaluated = await cdp.send<{ result: { value?: any }; exceptionDetails?: { text: string } }>(
                'Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: timeoutMs }, sessionId, timeoutMs + 5_000);
            if (evaluated.exceptionDetails) throw new BrowserError('PAGE_ERROR', evaluated.exceptionDetails.text);
            const outcome = evaluated.result.value as { value?: unknown; error?: { code: string; message: string } } | undefined;
            if (outcome?.error) throw new BrowserError(outcome.error.code, explain(outcome.error, tab));
            return outcome?.value;
        } finally {
            await cdp.send('Target.detachFromTarget', { sessionId }).catch(() => undefined);
        }
    }

    /** Picks the site for a target URL, an explicit site id, or the only site with a token. */
    private resolveSite(target?: unknown, siteId?: string): AdapterConfig {
        const profiles = this.options.profiles().filter(profile => profile.enabled);
        if (siteId) {
            const site = profiles.find(profile => profile.site.id === siteId || profile.site.aliases.includes(siteId));
            if (!site) throw new BrowserError('UNSUPPORTED_SITE', `Unknown site "${siteId}". Sites: ${profiles.map(profile => profile.site.id).join(', ')}`);
            return site;
        }
        if (typeof target === 'string' && /^https?:\/\//.test(target)) {
            const site = this.siteOf(target);
            if (!site) throw new BrowserError('UNSUPPORTED_SITE', `Markify has no profile for ${new URL(target).origin}`);
            return site;
        }
        const withTokens = profiles.filter(profile => this.options.tokens[profile.site.id]);
        if (withTokens.length === 1) return withTokens[0];
        throw new BrowserError('NEED_SITE', `Pass a full thread URL, or "site" (${profiles.map(profile => profile.site.id).join(', ')}) with a thread id`);
    }

    private async tabFor(cdp: Cdp, site: AdapterConfig, prefer: (tab: SiteTab) => boolean, tabFilter?: string): Promise<SiteTab> {
        const tabs = (await this.siteTabs(cdp)).filter(tab => tab.site.site.id === site.site.id && (!tabFilter || tab.url.includes(tabFilter)));
        const tab = tabs.find(prefer) ?? tabs[0];
        if (!tab) throw new BrowserError('NO_TAB', `No ${site.site.name} tab${tabFilter ? ` matching "${tabFilter}"` : ''} is open. Open ${site.site.base_url} in Chrome (logged in if needed) and try again.`);
        return tab;
    }

    /** Every open tab on a Markify site, with the API state there. */
    status(): Promise<Record<string, unknown>[]> {
        return this.connect(async cdp => {
            const results: Record<string, unknown>[] = [];
            for (const tab of await this.siteTabs(cdp)) {
                const base = { site: tab.site.site.id, url: tab.url, title: tab.title, page: tab.route ? { kind: tab.route.kind, id: tab.route.id ?? null } : null };
                try {
                    const status = await this.call(cdp, tab, 'status', []);
                    results.push({ ...base, api: 'ready', version: status?.version });
                } catch (error) {
                    results.push({ ...base, api: error instanceof BrowserError ? error.code : 'ERROR', detail: error instanceof Error ? error.message : String(error) });
                }
            }
            return results;
        });
    }

    exportThread(target: string, options: { site?: string; download?: boolean; title?: string; tab?: string } = {}): Promise<any> {
        const site = this.resolveSite(target, options.site);
        return this.connect(async cdp => {
            const id = /^\d+$/.test(target) ? target : (() => { try { return classifyRoute(target, site)?.id; } catch { return undefined; } })();
            const tab = await this.tabFor(cdp, site, candidate => candidate.route?.kind === 'thread' && candidate.route.id === id, options.tab);
            return this.call(cdp, tab, 'export', [/^\d+$/.test(target) ? Number(target) : target, { download: options.download === true, title: options.title }]);
        });
    }

    list(options: { site?: string; tab?: string } = {}): Promise<any> {
        const site = this.resolveSite(undefined, options.site);
        return this.connect(async cdp => {
            const tab = await this.tabFor(cdp, site, candidate => candidate.route?.kind === 'listing', options.tab);
            if (tab.route?.kind !== 'listing') throw new BrowserError('NOT_A_LISTING', `No ${site.site.name} listing tab is open (feed, category, tag, search or latest). Open one in Chrome first.`);
            return this.call(cdp, tab, 'list', []);
        });
    }

    exportMany(targets: string[], options: { site?: string; zip?: boolean; tab?: string } = {}): Promise<any> {
        const site = this.resolveSite(targets.find(target => /^https?:\/\//.test(target)), options.site);
        return this.connect(async cdp => {
            // A listing tab names the files of ids it shows.
            const tab = await this.tabFor(cdp, site, candidate => candidate.route?.kind === 'listing', options.tab);
            return this.call(cdp, tab, 'exportMany', [targets.map(target => (/^\d+$/.test(target) ? Number(target) : target)), { zip: options.zip === true }]);
        });
    }
}

function explain(error: { code: string; message: string }, tab: SiteTab): string {
    const site = tab.site.site;
    switch (error.code) {
        case 'DISABLED': return `The AI Console API is off for ${site.name}. In Chrome, choose "🤖 AI Console API: copy token" in the Tampermonkey menu on ${site.base_url}, then update MARKIFY_TOKENS.`;
        case 'UNAUTHORIZED': return `The ${site.id} token in MARKIFY_TOKENS is wrong or was revoked. Copy the current one from the Tampermonkey menu (🤖 AI Console API) and update MARKIFY_TOKENS.`;
        case 'LOCKED': return `Too many wrong tokens locked the API in that ${site.name} tab. Fix MARKIFY_TOKENS, then reload the tab.`;
        default: return error.message;
    }
}

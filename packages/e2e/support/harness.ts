/**
 * Runs the built userscript the way a userscript manager would: its metadata
 * block decides which pages it runs on, its @require list is executed first, and
 * a GM.* implementation backed by the test process provides storage, privileged
 * cross-origin requests, notifications, clipboard, and menu commands.
 */
import { test as base, expect, type BrowserContext, type Download, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';
import { respond, type FakeResponse } from '../fixtures';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, '../../..');
const require = createRequire(import.meta.url);

export const version = readFileSync(join(repoRoot, 'config/package.toml'), 'utf8').match(/^version\s*=\s*"([^"]+)"/m)![1];
export const userscriptPath = join(repoRoot, `packages/userscript/dist/markify-v${version}.user.js`);

export interface Metadata { matches: string[]; requires: string[]; grants: string[]; connects: string[] }

export function readMetadata(source: string): Metadata {
    const block = source.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
    if (!block) throw new Error('Userscript metadata block not found');
    const values = (key: string) => [...block[1].matchAll(new RegExp(`^// @${key}\\s+(.+)$`, 'gm'))].map(m => m[1].trim());
    return { matches: values('match'), requires: values('require'), grants: values('grant'), connects: values('connect') };
}

/** Userscript @match globs: `*` is the only wildcard. */
function matchPattern(glob: string): string {
    return `^${glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`;
}

/** @require sources resolve to the pinned local copy; data: URLs are decoded. */
function loadRequire(url: string): string {
    if (url.startsWith('data:')) return decodeURIComponent(url.slice(url.indexOf(',') + 1));
    const systemjs = url.match(/^https:\/\/cdn\.jsdelivr\.net\/npm\/systemjs@([\d.]+)\/(dist\/.+)$/);
    if (systemjs) {
        const installed = JSON.parse(readFileSync(require.resolve('systemjs/package.json'), 'utf8')).version;
        if (installed !== systemjs[1]) throw new Error(`@require pins systemjs@${systemjs[1]} but ${installed} is installed`);
        return readFileSync(join(dirname(require.resolve('systemjs/package.json')), systemjs[2]), 'utf8');
    }
    throw new Error(`No offline copy for @require ${url}`);
}

function shim(): void {
    const call = (op: string, payload?: unknown) => (window as any).__markifyGM(op, payload);
    const menu: Record<string, () => unknown> = {};
    (window as any).__markifyMenu = menu;
    (window as any).GM = {
        getValue: async (key: string, fallback?: unknown) => {
            const stored = await call('get', key);
            return stored === undefined ? fallback : stored.value;
        },
        setValue: (key: string, value: unknown) => call('set', { key, value }),
        deleteValue: (key: string) => call('delete', key),
        listValues: () => call('list'),
        notification: (details: unknown) => call('notify', details),
        setClipboard: (text: string, type?: unknown) => call('clipboard', { text, type }),
        openInTab: (url: string) => call('openInTab', url),
        registerMenuCommand: (name: string, fn: () => unknown) => { menu[name] = fn; return name; },
        xmlHttpRequest(details: any) {
            let aborted = false;
            call('xhr', { url: details.url, method: details.method, headers: details.headers ?? {}, anonymous: details.anonymous })
                .then((response: { status: number; responseText: string } | null) => {
                    if (aborted) return;
                    if (!response) details.onerror?.();
                    else details.onload?.(response);
                });
            return { abort() { if (aborted) return; aborted = true; call('xhrAbort', details.url); details.onabort?.(); } };
        },
    };
}

export function buildInjection(source = readFileSync(userscriptPath, 'utf8')): string {
    const metadata = readMetadata(source);
    const requires = metadata.requires.map(loadRequire).join('\n;\n');
    return `(() => {
        if (window.top !== window) return;
        const matches = ${JSON.stringify(metadata.matches.map(matchPattern))};
        if (!matches.some(pattern => new RegExp(pattern).test(location.href))) return;
        window.__markifyInjected = true;
        (${shim.toString()})();
        ${requires}
        ;
        ${source}
    })();`;
}

/** `fixtures` serves every host offline; `live` uses the real network (see tests/live). */
export type NetworkMode = 'fixtures' | 'live';

/** Titles of bot-protection interstitials (Cloudflare and similar), English and Chinese. */
const CHALLENGE = /just a moment|attention required|access denied|captcha|请稍候|请稍等|安全验证|正在验证/i;
export const BLOCKED = 'Blocked or unavailable';

/**
 * A live site refused us (bot protection or outage): skip the test, or fail it on
 * runners whose network the site should accept (MARKIFY_E2E_BLOCKED=fail).
 */
export function skipBlocked(reason: string): never {
    if (process.env.MARKIFY_E2E_BLOCKED === 'fail') throw new Error(reason);
    base.info().skip(true, reason);
    throw new Error(reason);
}

/**
 * Whether a live response is a bot-protection interstitial rather than the resource:
 * an HTML 403/503. A JSON or plain-text 403 is the site itself refusing (e.g. a
 * restricted topic), which is a real result.
 */
export function isChallenge(status: number, body: string): boolean {
    return (status === 403 || status === 503) && /^\s*<(!doctype|html)/i.test(body);
}

export interface RecordedRequest { via: 'page' | 'gm' | 'blocked'; url: string; method: string; headers: Record<string, string>; anonymous?: boolean }
/** Per-test replacement for a fixture response; 'hang' never answers. */
export type Override = (url: string) => FakeResponse | 'hang' | Promise<FakeResponse | 'hang'>;
export interface Notification { text: string; title?: string; timeout?: number }

export class MarkifyBrowser {
    readonly store = new Map<string, unknown>();
    readonly notifications: Notification[] = [];
    readonly clipboard: string[] = [];
    readonly requests: RecordedRequest[] = [];
    readonly pageErrors: string[] = [];
    readonly abortedRequests: string[] = [];
    private readonly overrides: { match: (url: string) => boolean; handler: Override }[] = [];
    private readonly connects: string[];
    private userAgent = '';
    private lastLiveRequest = 0;

    constructor(readonly context: BrowserContext, readonly page: Page, readonly network: NetworkMode = 'fixtures') {
        this.connects = readMetadata(readFileSync(userscriptPath, 'utf8')).connects;
    }

    async install(): Promise<void> {
        await this.context.exposeBinding('__markifyGM', async (source, op: string, payload: any) => {
            switch (op) {
                case 'get': return this.store.has(payload) ? { value: structuredClone(this.store.get(payload)) } : undefined;
                case 'set': this.store.set(payload.key, structuredClone(payload.value)); return undefined;
                case 'delete': this.store.delete(payload); return undefined;
                case 'list': return [...this.store.keys()];
                case 'notify': this.notifications.push(payload); return undefined;
                case 'clipboard': this.clipboard.push(payload.text); return undefined;
                case 'openInTab': return undefined;
                case 'xhr': {
                    this.requests.push({ via: 'gm', url: payload.url, method: payload.method, headers: payload.headers, anonymous: payload.anonymous });
                    // Like Tampermonkey: only @connect hosts (or the page's own host for "self").
                    const host = new URL(payload.url).hostname;
                    if (!this.connects.includes(host) && !(this.connects.includes('self') && host === new URL(source.page.url()).hostname)) return null;
                    const response = await this.resolve(payload.url, payload.headers);
                    if (response === 'hang') return new Promise(() => undefined);
                    return response ? { status: response.status, responseText: response.body } : null;
                }
                case 'xhrAbort': this.abortedRequests.push(payload); return undefined;
                default: throw new Error(`Unknown GM op ${op}`);
            }
        });
        if (this.network === 'live') {
            this.userAgent = await this.page.evaluate(() => navigator.userAgent);
            this.context.on('request', request => this.requests.push({ via: 'page', url: request.url(), method: request.method(), headers: request.headers() }));
            await this.context.addInitScript({ content: buildInjection() });
            return;
        }
        await this.context.route('**/*', async route => {
            const request = route.request();
            const response = await this.resolve(request.url());
            if (response === 'hang') return;
            if (!response) {
                this.requests.push({ via: 'blocked', url: request.url(), method: request.method(), headers: request.headers() });
                await route.abort('blockedbyclient');
                return;
            }
            this.requests.push({ via: 'page', url: request.url(), method: request.method(), headers: request.headers() });
            await route.fulfill({ status: response.status, body: response.body, contentType: response.contentType });
        });
        await this.context.addInitScript({ content: buildInjection() });
    }

    private async resolve(url: string, headers: Record<string, string> = {}): Promise<FakeResponse | 'hang' | null> {
        const override = [...this.overrides].reverse().find(entry => entry.match(url));
        if (override) return override.handler(url);
        return this.network === 'live' ? this.liveFetch(url, headers) : respond(url);
    }

    /** Real request from the test process, paced so a run stays gentle on the site. */
    private async liveFetch(url: string, headers: Record<string, string>): Promise<FakeResponse | null> {
        const wait = this.lastLiveRequest + 400 - Date.now();
        if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
        this.lastLiveRequest = Date.now();
        try {
            const response = await fetch(url, { headers: { 'User-Agent': this.userAgent, 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8', ...headers } });
            return { status: response.status, body: await response.text(), contentType: response.headers.get('content-type') ?? '' };
        } catch {
            return null;
        }
    }

    /** GET from the test process through the same fixture/live switch the userscript uses. */
    async get(url: string): Promise<{ status: number; text: string }> {
        const response = await this.resolve(url);
        if (!response || response === 'hang') throw new Error(`No response for ${url}`);
        return { status: response.status, text: response.body };
    }

    /** Replaces the fixture response for matching URLs (latest registration wins). */
    intercept(match: string | RegExp | ((url: string) => boolean), handler: Override): void {
        const test = typeof match === 'function' ? match : typeof match === 'string' ? (url: string) => url.startsWith(match) : (url: string) => match.test(url);
        this.overrides.push({ match: test, handler });
    }

    /** Holds matching requests until released; `reached` resolves when the first one arrives. */
    hold(match: string | RegExp | ((url: string) => boolean)): { reached: Promise<void>; release: () => void } {
        let release!: () => void;
        let hit!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const reached = new Promise<void>(resolve => { hit = resolve; });
        this.intercept(match, async url => { hit(); await gate; return respond(url)!; });
        return { reached, release };
    }

    /**
     * Opens a page and waits until the userscript has registered its menu. On the live
     * site a bot-protection page skips the test (MARKIFY_E2E_BLOCKED=fail makes it fail,
     * for runners whose network the site accepts).
     */
    async open(url: string): Promise<void> {
        const blocked = await this.tryOpen(url);
        if (blocked) skipBlocked(blocked);
    }

    /** Like open(), but returns the reason instead of throwing when the live site blocks the page. */
    async tryOpen(url: string): Promise<string | undefined> {
        let response;
        try {
            response = await this.page.goto(url);
        } catch (error) {
            if (this.network !== 'live') throw error;
            return `${BLOCKED}: ${url} could not be loaded (${String(error).split('\n')[0]})`;
        }
        if (this.network === 'live' && ((response && response.status() >= 400) || CHALLENGE.test(await this.page.title()))) {
            // Interstitial challenges often clear by themselves in a normal browser; give it time, nothing more.
            await this.page.waitForFunction(pattern => !new RegExp(pattern, 'i').test(document.title), CHALLENGE.source, { timeout: 20_000 }).catch(() => undefined);
            await this.page.waitForLoadState('domcontentloaded');
            const title = await this.page.title();
            if (CHALLENGE.test(title) || (!(await this.page.evaluate(() => (window as any).__markifyInjected)) && response && response.status() >= 400)) {
                return `${BLOCKED}: ${url} answered HTTP ${response?.status()} with title "${title}" (bot protection or outage, not a Markify failure)`;
            }
        }
        await this.ready();
        return undefined;
    }

    async ready(): Promise<void> {
        await expect.poll(() => this.page.evaluate(() => Object.keys((window as any).__markifyMenu ?? {}).length), { message: 'userscript menu registered' }).toBeGreaterThan(0);
    }

    async runMenu(name: string): Promise<void> {
        await this.page.evaluate(async label => {
            const menu = (window as any).__markifyMenu as Record<string, () => unknown>;
            const key = Object.keys(menu).find(item => item.includes(label));
            if (!key) throw new Error(`Menu command not found: ${label}. Have: ${Object.keys(menu).join(', ')}`);
            await menu[key]();
        }, name);
    }

    async download(trigger: () => Promise<unknown>): Promise<{ name: string; text: string; download: Download }> {
        const [download] = await Promise.all([this.page.waitForEvent('download'), trigger()]);
        const text = readFileSync((await download.path())!, 'utf8');
        return { name: download.suggestedFilename(), text, download };
    }

    async downloadZip(trigger: () => Promise<unknown>, timeout = 45_000): Promise<{ name: string; files: Record<string, string> }> {
        const [download] = await Promise.all([this.page.waitForEvent('download', { timeout }), trigger()]);
        const entries = unzipSync(new Uint8Array(readFileSync((await download.path())!)));
        const files = Object.fromEntries(Object.entries(entries).map(([name, bytes]) => [name, new TextDecoder().decode(bytes)]));
        return { name: download.suggestedFilename(), files };
    }

    apiRequests(prefix: string): RecordedRequest[] {
        return this.requests.filter(request => request.url.startsWith(prefix));
    }

    async lastNotification(match: RegExp | string): Promise<Notification> {
        await expect.poll(() => this.notifications.some(n => typeof match === 'string' ? n.text.includes(match) : match.test(n.text)), {
            message: `notification matching ${match}`, timeout: 45_000,
        }).toBe(true);
        return this.notifications.filter(n => typeof match === 'string' ? n.text.includes(match) : match.test(n.text)).at(-1)!;
    }
}

export const test = base.extend<{ markify: MarkifyBrowser; network: NetworkMode }>({
    network: ['fixtures', { option: true }],
    markify: async ({ context, page, network }, use) => {
        const harness = new MarkifyBrowser(context, page, network);
        await harness.install();
        page.on('pageerror', error => harness.pageErrors.push(error.stack ?? error.message));
        await use(harness);
        // A live site's own script errors are not ours to assert on.
        if (network === 'fixtures') expect(harness.pageErrors, 'uncaught page errors').toEqual([]);
    },
});

export { expect };

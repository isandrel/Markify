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
import { respond } from '../fixtures/sites';

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
            return { abort() { aborted = true; details.onabort?.(); } };
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

export interface RecordedRequest { via: 'page' | 'gm' | 'blocked'; url: string; method: string; headers: Record<string, string>; anonymous?: boolean }
export interface Notification { text: string; title?: string; timeout?: number }

export class MarkifyBrowser {
    readonly store = new Map<string, unknown>();
    readonly notifications: Notification[] = [];
    readonly clipboard: string[] = [];
    readonly requests: RecordedRequest[] = [];
    readonly pageErrors: string[] = [];

    constructor(readonly context: BrowserContext, readonly page: Page) {}

    async install(): Promise<void> {
        await this.context.exposeBinding('__markifyGM', async (_source, op: string, payload: any) => {
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
                    const response = respond(payload.url);
                    return response ? { status: response.status, responseText: response.body } : null;
                }
                default: throw new Error(`Unknown GM op ${op}`);
            }
        });
        await this.context.route('**/*', async route => {
            const request = route.request();
            const response = respond(request.url());
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

    /** Opens a page and waits until the userscript has registered its menu. */
    async open(url: string): Promise<void> {
        await this.page.goto(url);
        await this.ready();
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

export const test = base.extend<{ markify: MarkifyBrowser }>({
    markify: async ({ context, page }, use) => {
        const harness = new MarkifyBrowser(context, page);
        await harness.install();
        page.on('pageerror', error => harness.pageErrors.push(error.stack ?? error.message));
        await use(harness);
        expect(harness.pageErrors, 'uncaught page errors').toEqual([]);
    },
});

export { expect };

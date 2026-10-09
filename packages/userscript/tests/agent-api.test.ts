import { describe, expect, test } from 'bun:test';
import { loadConfigFromDisk } from '@markify/core/config/disk';
import type { AdapterConfig } from '@markify/core';
import {
    AgentApiError, MAX_BATCH, MAX_TOKEN_FAILURES, createAgentApi, installAgentApi, newAgentToken, normalizeAgentSettings, resolveTarget,
    type AgentHost,
} from '../src/agent-api';

const profiles = loadConfigFromDisk().adapters;
const p1p3a = profiles['1point3acres'];
const linuxdo = profiles.linuxdo;
const TOKEN = newAgentToken();

function host(overrides: Partial<AgentHost> & { url?: string; profile?: AdapterConfig; tokenValue?: string | undefined } = {}) {
    const calls: string[] = [];
    let token: string | undefined = 'tokenValue' in overrides ? overrides.tokenValue : TOKEN;
    const value: AgentHost = {
        version: '9.9.9',
        location: () => overrides.url ?? 'https://www.1point3acres.com/home/thread/1184303',
        profile: () => overrides.profile ?? p1p3a,
        async exportThread(url, options) {
            calls.push(`export ${url}${options.download ? ' download' : ''}`);
            if (url.includes('666')) throw Object.assign(new Error('请先登录'), { code: 'ACCESS_DENIED' });
            return { markdown: `# ${url}`, filename: 'x.md', title: options.title ?? 'T', metadata: {} };
        },
        listRows: async () => [{ id: '7', title: 'Seven', url: 'https://www.1point3acres.com/home/thread/7', downloaded: false }],
        history: async () => [],
        downloadZip: async items => { calls.push(`zip ${items.map(item => item.id).join(',')}`); return 'batch.zip'; },
        delay: async () => { calls.push('delay'); },
        token: async () => token,
        ...overrides,
    };
    return { value, calls, setToken: (next: string | undefined) => { token = next; } };
}

describe('agent tokens', () => {
    test('are 128 random bits, prefixed', () => {
        expect(TOKEN).toMatch(/^mfy_[0-9a-f]{32}$/);
        expect(newAgentToken()).not.toBe(TOKEN);
    });

    test('settings keep only well-formed tokens', () => {
        expect(normalizeAgentSettings(null)).toEqual({ sites: {} });
        expect(normalizeAgentSettings({ sites: { linuxdo: { token: 'short' }, uscardforum: { token: TOKEN, createdAt: 'now' } } }))
            .toEqual({ sites: { uscardforum: { token: TOKEN, createdAt: 'now' } } });
    });
});

describe('resolveTarget', () => {
    test('numeric ids become the site thread URL', () => {
        expect(resolveTarget(1184303, p1p3a, 'https://www.1point3acres.com/home/discover')).toEqual({ url: 'https://www.1point3acres.com/bbs/thread-1184303-1-1.html', id: '1184303' });
        expect(resolveTarget('42', linuxdo, 'https://linux.do/latest')).toEqual({ url: 'https://linux.do/t/42', id: '42' });
    });

    test('defaults to the current thread and rejects anything that is not a thread of this site', () => {
        expect(resolveTarget(undefined, linuxdo, 'https://linux.do/t/some-topic/42/3').id).toBe('42');
        expect(() => resolveTarget(undefined, linuxdo, 'https://linux.do/latest')).toThrow(AgentApiError);
        expect(() => resolveTarget('https://www.uscardforum.com/t/x/42', linuxdo, 'https://linux.do/latest')).toThrow(/Not a LINUX DO thread/);
        expect(() => resolveTarget({ id: 1 }, linuxdo, 'https://linux.do/latest')).toThrow(/thread URL or a numeric thread id/);
    });
});

describe('connect(token)', () => {
    test('rejects calls until the right token is given, then locks after repeated wrong ones', async () => {
        const { value, setToken } = host({ tokenValue: undefined });
        const api = createAgentApi(value);
        await expect(api.root.connect(TOKEN)).rejects.toMatchObject({ code: 'DISABLED' });
        setToken(TOKEN);
        for (let attempt = 0; attempt < MAX_TOKEN_FAILURES; attempt++) {
            await expect(api.root.connect(`mfy_${'0'.repeat(32)}`)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        }
        await expect(api.root.connect(TOKEN)).rejects.toMatchObject({ code: 'LOCKED' });
        api.resetLock();
        const client = await api.root.connect(TOKEN) as Record<string, (...args: any[]) => Promise<any>>;
        expect(await client.status()).toMatchObject({ version: '9.9.9', site: { id: '1point3acres' }, page: { kind: 'thread', id: '1184303' } });
    });

    test('help is open but carries no site data', async () => {
        const api = createAgentApi(host({ tokenValue: undefined }).value);
        const help = await api.root.help() as { usage: string; commands: { name: string }[] };
        expect(help.usage).toContain('markify.connect(token)');
        expect(help.commands.map(command => command.name)).toEqual(['status', 'export', 'list', 'exportMany', 'history']);
    });

    test('revoking the token disables clients that already connected', async () => {
        const { value, setToken } = host();
        const client = await createAgentApi(value).root.connect(TOKEN) as Record<string, (...args: any[]) => Promise<any>>;
        expect((await client.export()).ok).toBe(true);
        setToken(undefined);
        await expect(client.export()).rejects.toMatchObject({ code: 'DISABLED' });
        setToken(newAgentToken());
        await expect(client.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
});

describe('commands', () => {
    test('export reports failures as data and only downloads when asked', async () => {
        const { value, calls } = host();
        const client = await createAgentApi(value).root.connect(TOKEN) as Record<string, (...args: any[]) => Promise<any>>;
        expect(await client.export()).toMatchObject({ ok: true, site: '1point3acres', id: '1184303', markdown: '# https://www.1point3acres.com/home/thread/1184303' });
        expect(await client.export(666)).toMatchObject({ ok: false, id: '666', error: { code: 'ACCESS_DENIED', message: '请先登录' } });
        expect(await client.export('https://linux.do/t/1')).toMatchObject({ ok: false, error: { code: 'INVALID_TARGET' } });
        await client.export(5, { download: true });
        expect(calls).toEqual([
            'export https://www.1point3acres.com/home/thread/1184303',
            'export https://www.1point3acres.com/bbs/thread-666-1-1.html',
            'export https://www.1point3acres.com/bbs/thread-5-1-1.html download',
        ]);
    });

    test('exportMany runs in order with delays, uses listing titles and zips the successes', async () => {
        const { value, calls } = host();
        const client = await createAgentApi(value).root.connect(TOKEN) as Record<string, (...args: any[]) => Promise<any>>;
        const { results, zip } = await client.exportMany([7, 666, 8], { zip: true });
        expect(results.map((result: { ok: boolean }) => result.ok)).toEqual([true, false, true]);
        expect(results[0].title).toBe('Seven');
        expect(zip).toBe('batch.zip');
        expect(calls.filter(call => !call.startsWith('export'))).toEqual(['delay', 'delay', 'zip 7,8']);
        await expect(client.exportMany(Array.from({ length: MAX_BATCH + 1 }, (_, index) => index + 1))).rejects.toMatchObject({ code: 'TOO_MANY' });
    });

    test('list refuses pages that are not listings', async () => {
        const client = await createAgentApi(host({ listRows: async () => null }).value).root.connect(TOKEN) as Record<string, (...args: any[]) => Promise<any>>;
        await expect(client.list()).rejects.toMatchObject({ code: 'NOT_A_LISTING' });
    });
});

describe('installAgentApi', () => {
    test('defines a fixed window.markify that returns plain data', async () => {
        const page: any = {};
        const api = createAgentApi(host().value);
        expect(installAgentApi(page, api, {})).toBe(true);
        const descriptor = Object.getOwnPropertyDescriptor(page, 'markify')!;
        expect(descriptor).toMatchObject({ configurable: false, writable: false, enumerable: false });
        expect(Object.isFrozen(page.markify)).toBe(true);
        // Errors cross as { code, message } objects.
        await expect(page.markify.connect('nope')).rejects.toEqual({ code: 'UNAUTHORIZED', message: expect.any(String) });
        const client = await page.markify.connect(TOKEN);
        expect(Object.isFrozen(client)).toBe(true);
        expect(Object.keys(client).sort()).toEqual(['export', 'exportMany', 'help', 'history', 'list', 'status']);
        expect((await client.status()).url).toBe('https://www.1point3acres.com/home/thread/1184303');
        // A second install (or a page that defined it first) cannot replace it.
        expect(installAgentApi(page, api, {})).toBe(false);
    });

    test('registers WebMCP tools that require the token', async () => {
        const tools: Record<string, any> = {};
        const page: any = { navigator: { modelContext: { registerTool: (tool: any) => { tools[tool.name] = tool; } } } };
        installAgentApi(page, createAgentApi(host().value), {});
        expect(Object.keys(tools)).toEqual(['markify_status', 'markify_export', 'markify_list', 'markify_exportMany', 'markify_history']);
        expect(tools.markify_exportMany.inputSchema.required).toEqual(['token', 'targets']);
        const denied = JSON.parse((await tools.markify_status.execute({})).content[0].text);
        expect(denied).toMatchObject({ ok: false, error: { code: 'UNAUTHORIZED' } });
        const ok = JSON.parse((await tools.markify_export.execute({ token: TOKEN, target: 9 })).content[0].text);
        expect(ok).toMatchObject({ ok: true, id: '9' });
    });
});

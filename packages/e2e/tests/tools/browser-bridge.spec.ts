/**
 * The MCP server's browser_* tools against a real Chromium running the
 * userscript: the server connects over the DevTools Protocol, as it would to the
 * user's own Chrome, and calls the token-gated window.markify in an open tab.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { test, expect, repoRoot } from '../../support/harness';
import { mcpEntry, preload } from '../../support/processes';
import { LINUXDO, P3A, discoverFeed } from '../../fixtures';

const PORT = 9300 + Number(process.env.TEST_WORKER_INDEX ?? 0);
const TOKEN = `mfy_${'ab'.repeat(16)}`;
type ToolResult = { content: { type: string; text: string }[]; isError?: boolean };

test.use({ launchOptions: { env: { ...process.env, LANG: 'C.UTF-8' }, args: [`--remote-debugging-port=${PORT}`] } });

async function mcpServer(env: Record<string, string>) {
    const transport = new StdioClientTransport({
        command: 'bun',
        args: ['--preload', preload, mcpEntry],
        cwd: repoRoot,
        env: { ...process.env, JINA_TOKEN: '', MARKIFY_BROWSER: `http://127.0.0.1:${PORT}`, ...env } as Record<string, string>,
        stderr: 'pipe',
    });
    const client = new Client({ name: 'markify-e2e', version: '1.0.0' });
    await client.connect(transport);
    return {
        client,
        call: async (name: string, args: Record<string, unknown> = {}) => await client.callTool({ name, arguments: args }) as ToolResult,
        close: () => client.close(),
    };
}

function enable(store: Map<string, unknown>, site: string) {
    store.set('markify_agent_api_v1', { sites: { [site]: { token: TOKEN, createdAt: '2026-01-01T00:00:00.000Z' } } });
}

test.describe('MCP browser tools (window.markify over DevTools)', () => {
    test('exports, lists and batch-exports through the open tabs', async ({ markify, page }) => {
        enable(markify.store, '1point3acres');
        await markify.open(`${P3A}/home/thread/1001`);
        const mcp = await mcpServer({ MARKIFY_TOKENS: `1point3acres=${TOKEN}` });
        try {
            const { tools } = await mcp.client.listTools();
            expect(tools.map(tool => tool.name).filter(name => name.startsWith('browser_')).sort())
                .toEqual(['browser_export', 'browser_export_many', 'browser_list', 'browser_status']);

            const status = JSON.parse((await mcp.call('browser_status')).content[0].text);
            expect(status).toEqual([expect.objectContaining({ site: '1point3acres', url: `${P3A}/home/thread/1001`, page: { kind: 'thread', id: '1001' }, api: 'ready' })]);

            const open = await mcp.call('browser_export', { target: `${P3A}/home/thread/1001` });
            expect(open.isError).toBeFalsy();
            expect(open.content[0].text).toContain('| Filename | `Offer 比较- Google vs Meta.md` |');
            expect(open.content[0].text).toContain('# Offer 比较: Google vs Meta');
            expect(open.content[0].text).toContain('## Comments (30)');
            // By id: one site has a token, so "site" is optional.
            expect((await mcp.call('browser_export', { target: '1002' })).content[0].text).toContain('No replies yet.');
            const denied = await mcp.call('browser_export', { target: '1014' });
            expect(denied.isError).toBe(true);
            expect(denied.content[0].text).toContain('(thread 1014)');
            // Nothing was downloaded or recorded.
            expect(markify.store.get('markify_download_history')).toBeUndefined();

            // No listing tab yet.
            expect((await mcp.call('browser_list')).content[0].text).toMatch(/^NOT_A_LISTING: /);
            const listing = await page.context().newPage();
            await listing.goto(`${P3A}/home/discover/38`);
            await expect.poll(() => listing.locator('.markify-batch-checkbox').count()).toBe(20);
            const rows = JSON.parse((await mcp.call('browser_list')).content[0].text);
            expect(rows.items.map((item: { id: string }) => item.id)).toEqual(discoverFeed[1]);

            // The ZIP downloads in the listing tab the export ran in.
            const [download, many] = await Promise.all([listing.waitForEvent('download', { timeout: 45_000 }), mcp.call('browser_export_many', { targets: ['1001', '1007'], zip: true })]);
            expect(many.content[0].text).toContain(`# Browser export: 2/2 threads, ZIP ${download.suggestedFilename()}`);
            expect(many.content[0].text).toContain('## 2. Exactly one page of replies');
        } finally {
            await mcp.close();
        }
    });

    test('explains missing, wrong and revoked tokens and other sites', async ({ markify }) => {
        enable(markify.store, '1point3acres');
        await markify.open(`${P3A}/home/thread/1001`);

        const none = await mcpServer({ MARKIFY_TOKENS: '' });
        try {
            expect(JSON.parse((await none.call('browser_status')).content[0].text)[0]).toMatchObject({ api: 'NO_TOKEN' });
            const result = await none.call('browser_export', { target: `${P3A}/home/thread/1001` });
            expect(result.isError).toBe(true);
            expect(result.content[0].text).toMatch(/^NO_TOKEN: .*MARKIFY_TOKENS/);
            expect((await none.call('browser_export', { target: '1001' })).content[0].text).toMatch(/^NEED_SITE: /);
            expect((await none.call('browser_export', { target: `${LINUXDO}/t/topic/400001` })).content[0].text).toMatch(/^NO_TAB: No LINUX DO tab is open/);
            expect((await none.call('browser_export', { target: 'https://example.org/post/1' })).content[0].text).toMatch(/^UNSUPPORTED_SITE: /);
        } finally {
            await none.close();
        }

        const wrong = await mcpServer({ MARKIFY_TOKENS: `1point3acres=mfy_${'0'.repeat(32)}` });
        try {
            expect((await wrong.call('browser_export', { target: '1001' })).content[0].text).toMatch(/^UNAUTHORIZED: .*wrong or was revoked/);
        } finally {
            await wrong.close();
        }

        await markify.runMenu('AI Console API: turn off');
        const revoked = await mcpServer({ MARKIFY_TOKENS: `1point3acres=${TOKEN}` });
        try {
            expect((await revoked.call('browser_export', { target: '1001' })).content[0].text).toMatch(/^DISABLED: The AI Console API is off for 1Point3Acres/);
        } finally {
            await revoked.close();
        }
    });

    test('reports a browser without remote debugging', async ({ markify }) => {
        void markify;
        const mcp = await mcpServer({ MARKIFY_BROWSER: 'http://127.0.0.1:9', MARKIFY_TOKENS: `1point3acres=${TOKEN}` });
        try {
            const result = await mcp.call('browser_status');
            expect(result.isError).toBe(true);
            expect(result.content[0].text).toMatch(/^NO_BROWSER: No Chrome with remote debugging found\. Turn on remote debugging/);
        } finally {
            await mcp.close();
        }
    });
});

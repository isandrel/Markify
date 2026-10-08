import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { blogArticle, BLOG, P3A, USCF } from '../fixtures/sites';
import { mcpEntry, preload, readRequests, serve, tempDir } from '../support/processes';
import { repoRoot, version } from '../support/harness';

type ToolResult = { content: { type: string; text: string }[]; isError?: boolean };

/** One real stdio server per test; protocol noise on stdout fails the test. */
const test$ = test.extend<{ mcp: { client: Client; call: (name: string, args?: Record<string, unknown>) => Promise<ToolResult>; requests: () => ReturnType<typeof readRequests>; protocolErrors: string[] } }>({
    mcp: async ({}, use) => {
        const log = join(tempDir(), 'requests.jsonl');
        const transport = new StdioClientTransport({
            command: 'bun',
            args: ['--preload', preload, mcpEntry],
            cwd: repoRoot,
            env: { ...process.env, JINA_TOKEN: '', MARKIFY_E2E_REQUEST_LOG: log } as Record<string, string>,
            stderr: 'pipe',
        });
        const client = new Client({ name: 'markify-e2e', version: '1.0.0' });
        const protocolErrors: string[] = [];
        client.onerror = error => protocolErrors.push(error.message);
        await client.connect(transport);
        const call = async (name: string, args: Record<string, unknown> = {}) => await client.callTool({ name, arguments: args }) as ToolResult;
        await use({ client, call, requests: () => readRequests(log), protocolErrors });
        await client.close();
        expect(protocolErrors, 'non-JSON-RPC output on the server stdout').toEqual([]);
    },
});

test$.describe('markify MCP server (stdio)', () => {
    test$('advertises its identity and five tools', async ({ mcp }) => {
        expect(mcp.client.getServerVersion()).toMatchObject({ name: 'markify', version });
        const { tools } = await mcp.client.listTools();
        expect(tools.map(tool => tool.name).sort()).toEqual(['batch_convert', 'convert_html', 'convert_url', 'get_config', 'list_adapters']);
        const convertUrl = tools.find(tool => tool.name === 'convert_url')!;
        expect(Object.keys(convertUrl.inputSchema.properties ?? {}).sort()).toEqual(['adapter', 'include_frontmatter', 'strategy', 'url']);
    });

    test$('list_adapters and get_config', async ({ mcp }) => {
        const adapters = (await mcp.call('list_adapters')).content[0].text;
        expect(adapters).toContain('### 1Point3Acres (🔌 **API**)');
        expect(adapters).toContain('### US Card Forum (🔌 **API**)');
        expect(adapters).toContain('### Medium (📄 DOM)');

        const config = (await mcp.call('get_config', { section: 'adapters' })).content[0].text;
        expect(Object.keys(JSON.parse(config.replace(/^```json\n|\n```$/g, ''))).sort()).toEqual(['1point3acres', 'uscardforum']);
        expect((await mcp.call('get_config', { section: 'nope' })).content[0].text).toMatch(/Section \\"nope\\" not found\. Available: .*adapters/);
    });

    test$('convert_html converts a snippet without any network access', async ({ mcp }) => {
        const result = await mcp.call('convert_html', {
            html: '<article><h2>Hello</h2><p>Some <b>bold</b> and <s>struck</s> text.</p></article>',
            title: 'Snippet', url: 'https://example.org/snippet',
        });
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toMatch(/^---\ntitle: "Snippet"\nsource: https:\/\/example\.org\/snippet\n/);
        expect(result.content[0].text).toContain('## Hello\n\nSome **bold** and ~~struck~~ text.');
        expect(mcp.requests()).toEqual([]);
    });

    test$('convert_url through each site API', async ({ mcp }) => {
        const forum = (await mcp.call('convert_url', { url: `${P3A}/home/thread/1001` })).content[0].text;
        expect(forum).toContain('| Adapter | 1Point3Acres |');
        expect(forum).toContain('| Source | Site API (dedicated) |');
        expect(forum).toContain('| Filename | `Offer 比较- Google vs Meta.md` |');
        expect(forum).toContain('## Comments (25)');

        const topic = (await mcp.call('convert_url', { url: `${USCF}/t/amex-platinum-offer/2001` })).content[0].text;
        expect(topic).toContain('| Filename | `Amex Platinum offer.md` |');
        expect(topic).toContain('title: "Amex Platinum offer"');
        expect(topic).toContain('Second page reply.');
    });

    test$('convert_url via Jina Reader, DOM fallback and dom-only', async ({ mcp }) => {
        const jina = (await mcp.call('convert_url', { url: `${BLOG}/post` })).content[0].text;
        expect(jina).toContain('| Source | Jina Reader |');
        expect(jina).toContain('Reader rendered **markdown**');

        const fallback = (await mcp.call('convert_url', { url: `${BLOG}/jina-fails` })).content[0].text;
        expect(fallback).toContain('Markdown is **plain text**');

        const server = await serve({ '/a': blogArticle });
        try {
            const dom = await mcp.call('convert_url', { url: `${server.url}/a`, strategy: 'dom-only', include_frontmatter: false });
            expect(dom.content[0].text).toContain('| Source | DOM parsing |');
            expect(dom.content[0].text).toContain('---\n\n# A Field Guide to Markdown');
        } finally {
            await server.close();
        }

        const strict = await mcp.call('convert_url', { url: `${BLOG}/jina-fails`, strategy: 'api-only' });
        expect(strict.isError).toBe(true);
        expect(strict.content[0].text).toContain('No API available');
    });

    test$('batch_convert reports per-URL results and errors', async ({ mcp }) => {
        const result = (await mcp.call('batch_convert', { urls: [`${P3A}/home/thread/1002`, `${P3A}/home/thread/1003`] })).content[0].text;
        expect(result).toContain('**Total:** 2 URLs');
        expect(result).toContain('## 1. Visa timeline 2026.md');
        expect(result).toContain('## 2. Error: https://www.1point3acres.com/home/thread/1003');
        expect(result).toContain('HTTP 403 during thread');
    });

    test$('invalid arguments are rejected by the tool schema', async ({ mcp }) => {
        const result = await mcp.call('convert_url', { url: 'not a url' });
        expect(result.isError).toBe(true);
    });
});

#!/usr/bin/env bun
/**
 * Markify MCP Server
 *
 * Exposes Markify's page-to-markdown conversion as MCP tools
 * for AI agents (Claude Desktop, Cursor, Windsurf, etc.)
 *
 * Tools:
 *   convert_url     Convert a web page to Obsidian Markdown
 *   convert_html    Convert raw HTML string to Markdown
 *   batch_convert   Convert multiple URLs in one call
 *   list_adapters   List site adapters with API capabilities
 *   get_config      Show active TOML configuration
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { convert, listAdapters, hasSiteApi, getConfig, setConfig } from '@markify/core';
import type { HttpFetcher, MinimalDocument } from '@markify/core';
import { buildHeaders, humanDelay } from '@markify/core/utils/http';
import { loadConfigFromDisk } from '@markify/core/config/disk';

setConfig(loadConfigFromDisk());

// ─── HTTP fetcher with real User-Agent ───────────────────────────────

const mcpFetcher: HttpFetcher = {
    get: async (url: string, opts?: { headers?: Record<string, string> }) => {
        const headers = buildHeaders(opts?.headers);
        const res = await fetch(url, { headers });
        return { status: res.status, ok: res.ok, text: await res.text() };
    },
};

// ─── Server setup ────────────────────────────────────────────────────

const server = new McpServer({
    name: 'markify',
    version: String((getConfig().package as { package?: { version?: string } } | undefined)?.package?.version ?? 'unknown'),
    description:
        'Markify converts web pages to clean, Obsidian-compatible Markdown with YAML frontmatter. ' +
        'It uses a 3-tier conversion strategy: site-specific APIs for supported forums, ' +
        'Jina Reader AI for general pages, and DOM parsing as fallback. ' +
        'Ideal for research, archiving, and importing web content into knowledge bases.',
});

// ─── Helper: parse HTML for DOM-based conversion ─────────────────────

async function parseUrl(url: string): Promise<MinimalDocument | undefined> {
    const { parseHTML } = await import('linkedom');
    const headers = buildHeaders();
    const response = await fetch(url, { headers });
    const html = await response.text();
    const parsed = parseHTML(html);
    return parsed.document as unknown as MinimalDocument;
}

// ─── Tool: convert_url ──────────────────────────────────────────────

server.tool(
    'convert_url',
    'Convert a web page URL to Obsidian-formatted Markdown with YAML frontmatter.\n\n' +
    'This is the primary tool for converting web content to Markdown. It supports:\n' +
    '- **Forum threads** (US Card Forum, 1Point3Acres) via dedicated APIs\n' +
    '- **Any public URL** via Jina Reader AI (default)\n' +
    '- **DOM parsing** fallback for pages that block Jina\n\n' +
    'The output includes:\n' +
    '- YAML frontmatter with title, author, date, URL, and tags\n' +
    '- Clean Markdown content with preserved formatting\n' +
    '- Forum-specific extras: comments, view counts, etc.\n\n' +
    'Returns Markdown text on stdout. Use this when you need to:\n' +
    '- Save web articles for offline reading\n' +
    '- Import web content into Obsidian vaults\n' +
    '- Extract structured text from web pages\n' +
    '- Archive forum threads with full comment history',
    {
        url: z.string().url().describe(
            'Full URL of the web page to convert (e.g., "https://example.com/article")'
        ),
        adapter: z.string().optional().describe(
            'Force a specific site adapter by name. Use list_adapters to see options. ' +
            'If omitted, the adapter is auto-detected from the URL pattern.'
        ),
        include_frontmatter: z.boolean().default(true).describe(
            'Include YAML frontmatter (title, author, date, tags) at the top of the output'
        ),
        strategy: z.enum(['api-first', 'api-only', 'dom-only']).default('api-first').describe(
            'Conversion strategy:\n' +
            '- api-first (default): Try site API → Jina Reader → DOM fallback\n' +
            '- api-only: Only APIs, error if none available\n' +
            '- dom-only: Fetch raw HTML and parse with Turndown'
        ),
    },
    async ({ url, adapter, include_frontmatter, strategy }) => {
        try {
            let document: MinimalDocument | undefined;
            if (strategy === 'dom-only' || strategy === 'api-first') {
                document = await parseUrl(url);
            }

            const result = await convert({
                url,
                document,
                adapterName: adapter,
                includeFrontmatter: include_frontmatter,
                fetcher: mcpFetcher,
                strategy,
                readerConfig: { jinaToken: process.env.JINA_TOKEN },
            });

            const hasApi = hasSiteApi(url);
            const info = [
                `| Property | Value |`,
                `|----------|-------|`,
                `| Adapter | ${result.adapter} |`,
                `| Strategy | ${strategy} |`,
                `| Source | ${hasApi ? 'Site API (dedicated)' : strategy === 'dom-only' ? 'DOM parsing' : 'Jina Reader'} |`,
                `| Filename | \`${result.filename}.md\` |`,
            ].join('\n');

            return {
                content: [
                    { type: 'text' as const, text: `${info}\n\n---\n\n${result.markdown}` },
                ],
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                content: [{ type: 'text' as const, text: `Error converting URL: ${message}` }],
                isError: true,
            };
        }
    },
);

// ─── Tool: convert_html ──────────────────────────────────────────────

server.tool(
    'convert_html',
    'Convert raw HTML content to Obsidian-formatted Markdown.\n\n' +
    'Use this when you already have HTML content (e.g., from clipboard, API response, ' +
    'or a previous fetch). This tool always uses DOM parsing with Turndown — ' +
    'it does NOT call any external APIs.\n\n' +
    'Useful for:\n' +
    '- Processing HTML from API responses\n' +
    '- Converting HTML snippets to Markdown\n' +
    '- Cleaning up HTML content from other tools',
    {
        html: z.string().describe('The raw HTML content to convert to Markdown'),
        title: z.string().optional().describe('Page title (used in YAML frontmatter)'),
        url: z.string().optional().describe('Original URL (used in frontmatter source field)'),
    },
    async ({ html, title, url }) => {
        try {
            const { parseHTML } = await import('linkedom');
            const { document } = parseHTML(html);

            if (title) {
                (document as { title: string }).title = title;
            }

            const result = await convert({
                url: url ?? 'about:blank',
                document: document as unknown as MinimalDocument,
                includeFrontmatter: true,
                fetcher: mcpFetcher,
                strategy: 'dom-only',
            });

            return {
                content: [{ type: 'text' as const, text: result.markdown }],
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                content: [{ type: 'text' as const, text: `Error converting HTML: ${message}` }],
                isError: true,
            };
        }
    },
);

// ─── Tool: batch_convert ─────────────────────────────────────────────

server.tool(
    'batch_convert',
    'Convert multiple URLs to Obsidian Markdown in a single call.\n\n' +
    'Each URL is converted independently using the api-first strategy. ' +
    'Results include per-URL metadata and content. Human-like delays are ' +
    'applied between requests to avoid rate limiting.\n\n' +
    'Use this when you need to:\n' +
    '- Archive multiple articles at once\n' +
    '- Build a collection of Markdown files from a list of URLs\n' +
    '- Process research materials in bulk\n\n' +
    'Maximum 20 URLs per call. For larger jobs, call multiple times.',
    {
        urls: z.array(z.string().url()).min(1).max(20).describe(
            'List of URLs to convert (1-20). Each URL is processed sequentially with delays.'
        ),
        include_frontmatter: z.boolean().default(true).describe(
            'Include YAML frontmatter in each converted document'
        ),
    },
    async ({ urls, include_frontmatter }) => {
        const results: string[] = [];

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            try {
                let document: MinimalDocument | undefined;
                try { document = await parseUrl(url); } catch { /* fallback */ }

                const result = await convert({
                    url,
                    document,
                    includeFrontmatter: include_frontmatter,
                    fetcher: mcpFetcher,
                    strategy: 'api-first',
                    readerConfig: { jinaToken: process.env.JINA_TOKEN },
                });

                const source = hasSiteApi(url) ? 'Site API' : 'Jina Reader';
                results.push(
                    `## ${i + 1}. ${result.filename}.md\n` +
                    `**Adapter:** ${result.adapter} | **Source:** ${source}\n\n` +
                    `${result.markdown}\n\n---\n`
                );
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                results.push(`## ${i + 1}. Error: ${url}\n${message}\n\n---\n`);
            }

            // Human-like delay between requests (skip after last)
            if (i < urls.length - 1) {
                await humanDelay({ min_ms: 1000, max_ms: 3000, jitter: 0.25 });
            }
        }

        return {
            content: [{
                type: 'text' as const,
                text: `# Batch Conversion Results\n\n**Total:** ${urls.length} URLs\n\n---\n\n${results.join('\n')}`,
            }],
        };
    },
);

// ─── Tool: list_adapters ─────────────────────────────────────────────

server.tool(
    'list_adapters',
    'List all available Markify site adapters and their capabilities.\n\n' +
    'Shows which sites have dedicated API adapters for deterministic, ' +
    'high-quality conversion. Sites without adapters still work via Jina Reader.\n\n' +
    'Use this to discover which adapters are available before calling convert_url ' +
    'with a specific adapter name.',
    {},
    async () => {
        const adapters = listAdapters();

        const lines = adapters.map(a => {
            const badge = a.hasApi ? '🔌 **API**' : '📄 DOM';
            const patterns = a.patterns.map(p => `  - \`${p}\``).join('\n');
            return `### ${a.name} (${badge})\n${patterns}`;
        });

        return {
            content: [{
                type: 'text' as const,
                text: [
                    '# Available Markify Adapters\n',
                    ...lines,
                    '',
                    '---',
                    '**Legend:**',
                    '- 🔌 **API** — Uses site-specific API for deterministic, structured conversion',
                    '- 📄 **DOM** — Uses DOM parsing with adapter-specific selectors and cleanup',
                    '',
                    'Sites without a listed adapter use Jina Reader (api-first) or DOM fallback.',
                ].join('\n'),
            }],
        };
    },
);

// ─── Tool: get_config ────────────────────────────────────────────────

server.tool(
    'get_config',
    'Show the active Markify configuration loaded from TOML files.\n\n' +
    'Returns the merged configuration including adapter settings, ' +
    'templates, delays, and HTTP config. Useful for debugging ' +
    'or checking which TOML configs are loaded.',
    {
        section: z.string().optional().describe(
            'Optional: show only a specific config section (e.g., "adapters", "notifications", "templates")'
        ),
    },
    async ({ section }) => {
        const config = getConfig() as Record<string, unknown>;

        let output: unknown;
        if (section) {
            output = config[section] ?? `Section "${section}" not found. Available: ${Object.keys(config).join(', ')}`;
        } else {
            output = config;
        }

        return {
            content: [{
                type: 'text' as const,
                text: `\`\`\`json\n${JSON.stringify(output, null, 2)}\n\`\`\``,
            }],
        };
    },
);

// ─── Start server ────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);

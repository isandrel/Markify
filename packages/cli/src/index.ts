#!/usr/bin/env bun
/**
 * Markify CLI — Convert web pages to Obsidian-formatted Markdown
 *
 * Subcommands:
 *   markify convert <url>    Convert a single URL to Markdown
 *   markify batch <...urls>  Convert multiple URLs
 *   markify adapters         List available site adapters
 *   markify config           Show active configuration
 *
 * Run `markify <command> -h` for command-specific help.
 */

import { convert, listAdapters, hasSiteApi, getConfig, setConfig, routeLogsToStderr } from '@markify/core';
import type { HttpFetcher, ConvertStrategy } from '@markify/core';
import { buildHeaders } from '@markify/core/utils/http';
import { loadConfigFromDisk } from '@markify/core/config/disk';

routeLogsToStderr();
setConfig(loadConfigFromDisk());

const VERSION = String((getConfig().package as { package?: { version?: string } } | undefined)?.package?.version ?? 'unknown');

// ─── HTTP fetcher with real User-Agent ───────────────────────────────

const cliFetcher: HttpFetcher = {
    get: async (url: string, opts?: { headers?: Record<string, string> }) => {
        const headers = buildHeaders(opts?.headers);
        const res = await fetch(url, { headers });
        return { status: res.status, ok: res.ok, text: await res.text() };
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────

function bold(s: string): string { return `\x1b[1m${s}\x1b[0m`; }
function dim(s: string): string { return `\x1b[2m${s}\x1b[0m`; }
function green(s: string): string { return `\x1b[32m${s}\x1b[0m`; }
function cyan(s: string): string { return `\x1b[36m${s}\x1b[0m`; }
function yellow(s: string): string { return `\x1b[33m${s}\x1b[0m`; }

function stderr(...args: unknown[]): void { console.error(...args); }

function hasFlag(args: string[], ...flags: string[]): boolean {
    return flags.some(f => args.includes(f));
}

function getFlagValue(args: string[], ...flags: string[]): string | undefined {
    for (const flag of flags) {
        const idx = args.indexOf(flag);
        if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
    }
    return undefined;
}

// ─── Top-level help ──────────────────────────────────────────────────

function showMainHelp(): void {
    console.log(`
${bold('Markify')} ${dim(`v${VERSION}`)} — Convert web pages to Obsidian-formatted Markdown

${bold('USAGE')}
  ${cyan('markify')} <command> [options]

${bold('COMMANDS')}
  ${green('convert')} <url>       Convert a single URL to Markdown
  ${green('batch')}   <...urls>   Convert multiple URLs to Markdown files
  ${green('adapters')}            List available site adapters and their capabilities
  ${green('config')}              Show active configuration (loaded TOML values)

${bold('QUICK START')}
  ${dim('# Convert a URL and print to stdout')}
  markify convert https://example.com

  ${dim('# Save to file')}
  markify convert https://example.com -o output.md

  ${dim('# Convert multiple URLs to a directory')}
  markify batch https://example.com https://other.com -d ./output/

  ${dim('# Pipe-friendly: URL as first arg also works')}
  markify https://example.com

${bold('GLOBAL OPTIONS')}
  -h, --help       Show help (use with any command for details)
  -v, --version    Show version
  --verbose        Enable debug logging

${bold('ENVIRONMENT')}
  JINA_TOKEN       Jina Reader API token for higher rate limits

Run ${cyan('markify <command> -h')} for command-specific help.
`.trim());
}

// ─── Convert subcommand ──────────────────────────────────────────────

function showConvertHelp(): void {
    console.log(`
${bold('markify convert')} — Convert a single URL to Obsidian Markdown

${bold('USAGE')}
  ${cyan('markify convert')} <url> [options]

${bold('DESCRIPTION')}
  Fetches a web page and converts it to clean Obsidian-compatible Markdown
  with YAML frontmatter. Uses a 3-tier strategy by default:
    1. ${green('Site API')}     — Dedicated adapter (US Card Forum, 1Point3Acres, etc.)
    2. ${green('Jina Reader')}  — AI-powered reader API for any public URL
    3. ${green('DOM Parsing')}  — Fallback: fetch HTML, parse with Turndown

${bold('OPTIONS')}
  -o, --output <file>      Save output to a file instead of stdout
  -s, --strategy <mode>    Conversion strategy:
                             ${green('api-first')}  ${dim('(default)')} API → Jina → DOM fallback
                             ${green('api-only')}   API → Jina → error (no DOM)
                             ${green('dom-only')}   Fetch HTML → DOM → Turndown
  --adapter <name>         Force a specific site adapter by name
  --no-frontmatter         Omit YAML frontmatter from output
  --jina-token <token>     Jina Reader API token (overrides JINA_TOKEN env)

${bold('OUTPUT')}
  When no -o flag is set, Markdown is printed to stdout.
  Metadata (adapter used, strategy, filename) goes to stderr.
  This makes it pipe-friendly: ${dim('markify convert <url> | pbcopy')}

${bold('EXAMPLES')}
  ${dim('# Basic conversion')}
  markify convert https://www.uscardforum.com/t/some-topic/123

  ${dim('# Force DOM parsing')}
  markify convert https://example.com --strategy dom-only

  ${dim('# Save to file without frontmatter')}
  markify convert https://example.com -o notes.md --no-frontmatter
`.trim());
}

async function runConvert(args: string[]): Promise<void> {
    if (args.length === 0 || hasFlag(args, '-h', '--help')) {
        showConvertHelp();
        return;
    }

    const url = args[0];
    const outputFile = getFlagValue(args, '-o', '--output');
    const adapterName = getFlagValue(args, '--adapter');
    const jinaToken = getFlagValue(args, '--jina-token');
    const includeFrontmatter = !hasFlag(args, '--no-frontmatter');

    let strategy: ConvertStrategy = 'api-first';
    const strategyValue = getFlagValue(args, '-s', '--strategy');
    if (strategyValue === 'dom-only' || strategyValue === 'api-only' || strategyValue === 'api-first') {
        strategy = strategyValue;
    } else if (hasFlag(args, '--dom')) {
        strategy = 'dom-only'; // Legacy flag support
    } else if (hasFlag(args, '--api-only')) {
        strategy = 'api-only'; // Legacy flag support
    }

    stderr(`${bold('Converting:')} ${cyan(url)}`);
    stderr(`${bold('Strategy:')}   ${strategy}`);

    if (hasSiteApi(url)) {
        stderr(`${bold('API:')}        ${green('✓ Site-specific API detected')}`);
    }

    // Pre-fetch HTML for DOM-based strategies
    let document: unknown = undefined;
    if (strategy === 'dom-only' || strategy === 'api-first') {
        if (strategy === 'dom-only') stderr(dim('Fetching HTML for DOM parsing...'));
        const { parseHTML } = await import('linkedom');
        const response = await fetch(url);
        const html = await response.text();
        const parsed = parseHTML(html);
        document = parsed.document;
    }

    const result = await convert({
        url,
        document: document as import('@markify/core').MinimalDocument | undefined,
        adapterName,
        includeFrontmatter,
        fetcher: cliFetcher,
        strategy,
        readerConfig: { jinaToken },
    });

    stderr(`${bold('Adapter:')}    ${result.adapter}`);
    stderr(`${bold('Filename:')}   ${result.filename}.md`);

    if (outputFile) {
        await Bun.write(outputFile, result.markdown);
        stderr(`${green('✓')} Written to: ${outputFile}`);
    } else {
        console.log(result.markdown);
    }
}

// ─── Batch subcommand ────────────────────────────────────────────────

function showBatchHelp(): void {
    console.log(`
${bold('markify batch')} — Convert multiple URLs to Markdown files

${bold('USAGE')}
  ${cyan('markify batch')} <url1> <url2> ... [options]

${bold('DESCRIPTION')}
  Converts multiple URLs in sequence with human-like delays between
  requests. Each URL is saved to a separate .md file.

${bold('OPTIONS')}
  -d, --dir <directory>    Output directory (default: current directory)
  -s, --strategy <mode>    Conversion strategy (api-first, api-only, dom-only)
  --no-frontmatter         Omit YAML frontmatter from output
  --jina-token <token>     Jina Reader API token (overrides JINA_TOKEN env)

${bold('EXAMPLES')}
  ${dim('# Convert 3 URLs to ./output/')}
  markify batch https://a.com https://b.com https://c.com -d ./output/

  ${dim('# From a file (one URL per line)')}
  cat urls.txt | xargs markify batch -d ./output/
`.trim());
}

async function runBatch(args: string[]): Promise<void> {
    if (args.length === 0 || hasFlag(args, '-h', '--help')) {
        showBatchHelp();
        return;
    }

    const { humanDelay } = await import('@markify/core/utils/http');

    const outputDir = getFlagValue(args, '-d', '--dir') ?? '.';
    const jinaToken = getFlagValue(args, '--jina-token');
    const includeFrontmatter = !hasFlag(args, '--no-frontmatter');

    let strategy: ConvertStrategy = 'api-first';
    const strategyValue = getFlagValue(args, '-s', '--strategy');
    if (strategyValue === 'dom-only' || strategyValue === 'api-only' || strategyValue === 'api-first') {
        strategy = strategyValue;
    }

    // Collect URLs (non-flag arguments)
    const flagsWithValues = new Set(['-d', '--dir', '-s', '--strategy', '--jina-token']);
    const urls: string[] = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('-')) {
            if (flagsWithValues.has(args[i])) i++; // Skip value
            continue;
        }
        urls.push(args[i]);
    }

    if (urls.length === 0) {
        stderr('Error: No URLs provided');
        showBatchHelp();
        process.exit(1);
    }

    stderr(`${bold('Batch converting')} ${urls.length} URLs → ${outputDir}/`);

    // Ensure output directory exists
    const fs = await import('fs');
    const path = await import('path');
    fs.mkdirSync(outputDir, { recursive: true });

    let success = 0;
    let failed = 0;

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        stderr(`\n${dim(`[${i + 1}/${urls.length}]`)} ${cyan(url)}`);

        try {
            let document: unknown = undefined;
            if (strategy === 'dom-only' || strategy === 'api-first') {
                const { parseHTML } = await import('linkedom');
                const response = await fetch(url);
                const html = await response.text();
                document = parseHTML(html).document;
            }

            const result = await convert({
                url,
                document: document as import('@markify/core').MinimalDocument | undefined,
                includeFrontmatter,
                fetcher: cliFetcher,
                strategy,
                readerConfig: { jinaToken },
            });

            const filename = `${result.filename}.md`;
            const filepath = path.join(outputDir, filename);
            fs.writeFileSync(filepath, result.markdown, 'utf-8');
            stderr(`  ${green('✓')} ${filename} ${dim(`(${result.adapter})`)}`);
            success++;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            stderr(`  ${yellow('✗')} Failed: ${message}`);
            failed++;
        }

        // Human-like delay between requests (skip after last)
        if (i < urls.length - 1) {
            const waited = await humanDelay({ min_ms: 1000, max_ms: 3000, jitter: 0.25 });
            stderr(dim(`  ⏳ ${waited}ms delay`));
        }
    }

    stderr(`\n${bold('Done:')} ${green(`${success} succeeded`)}${failed > 0 ? `, ${yellow(`${failed} failed`)}` : ''}`);
}

// ─── Adapters subcommand ─────────────────────────────────────────────

function showAdaptersHelp(): void {
    console.log(`
${bold('markify adapters')} — List available site adapters

${bold('USAGE')}
  ${cyan('markify adapters')} [options]

${bold('DESCRIPTION')}
  Shows all built-in site adapters, their URL patterns, and whether
  they support dedicated API access.

  Adapters with API support (🔌) use site-specific endpoints for
  deterministic, high-quality conversion. All other sites fall through
  to the Jina Reader API.

${bold('OPTIONS')}
  --json      Output as JSON (for scripting)
  -h, --help  Show this help
`.trim());
}

function runAdapters(args: string[]): void {
    if (hasFlag(args, '-h', '--help')) {
        showAdaptersHelp();
        return;
    }

    const adapters = listAdapters();

    if (hasFlag(args, '--json')) {
        console.log(JSON.stringify(adapters, null, 2));
        return;
    }

    console.log(`\n${bold('Available site adapters:')}\n`);
    for (const adapter of adapters) {
        const badge = adapter.hasApi ? ` ${green('🔌 API')}` : '';
        console.log(`  ${bold(adapter.name)}${badge}`);
        for (const pattern of adapter.patterns) {
            console.log(`    ${dim(pattern)}`);
        }
        console.log();
    }
    console.log(dim('Adapters with 🔌 use dedicated APIs for deterministic conversion.'));
    console.log(dim('All other URLs use Jina Reader (api-first) or DOM parsing (dom-only).\n'));
}

// ─── Config subcommand ───────────────────────────────────────────────

function showConfigHelp(): void {
    console.log(`
${bold('markify config')} — Show active configuration

${bold('USAGE')}
  ${cyan('markify config')} [options]

${bold('DESCRIPTION')}
  Shows the merged configuration loaded from config/*.toml files.
  Useful for debugging which adapter configs, templates, and settings
  are active.

${bold('OPTIONS')}
  --json      Output as JSON
  --adapters  Show only adapter configurations
  -h, --help  Show this help
`.trim());
}

function runConfig(args: string[]): void {
    if (hasFlag(args, '-h', '--help')) {
        showConfigHelp();
        return;
    }

    const config = getConfig();

    if (hasFlag(args, '--adapters')) {
        if (hasFlag(args, '--json')) {
            console.log(JSON.stringify(config.adapters, null, 2));
        } else {
            console.log(`\n${bold('Loaded adapter configs:')}\n`);
            for (const [name, adapterConfig] of Object.entries(config.adapters)) {
                const ac = adapterConfig as Record<string, unknown>;
                const site = ac.site as Record<string, string> | undefined;
                console.log(`  ${bold(site?.name ?? name)}`);
                console.log(`    ${dim('Base URL:')} ${site?.base_url ?? 'N/A'}`);
                const api = ac.api as Record<string, unknown> | undefined;
                if (api) {
                    console.log(`    ${dim('API:')}      ${green('✓')} Configured`);
                }
                console.log();
            }
        }
        return;
    }

    if (hasFlag(args, '--json')) {
        console.log(JSON.stringify(config, null, 2));
    } else {
        console.log(`\n${bold('Active Markify configuration:')}\n`);
        console.log(`  ${dim('Adapters loaded:')} ${Object.keys(config.adapters).length}`);
        for (const key of Object.keys(config)) {
            if (key !== 'adapters') {
                console.log(`  ${dim(`${key}:`)} loaded`);
            }
        }
        console.log(`\n  ${dim('Use --json for full output or --adapters for adapter details.')}\n`);
    }
}

// ─── Main router ─────────────────────────────────────────────────────

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    // Version (only if first arg)
    if (args[0] === '-v' || args[0] === '--version') {
        console.log(`markify v${VERSION}`);
        return;
    }

    // Top-level help (only if first arg is -h/--help, or no args)
    if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
        showMainHelp();
        return;
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    switch (command) {
        case 'convert':
            await runConvert(commandArgs);
            break;
        case 'batch':
            await runBatch(commandArgs);
            break;
        case 'adapters':
            runAdapters(commandArgs);
            break;
        case 'config':
            runConfig(commandArgs);
            break;
        default:
            // If first arg looks like a URL, treat as implicit `convert`
            if (command.startsWith('http://') || command.startsWith('https://')) {
                await runConvert(args);
            } else {
                stderr(`Unknown command: ${command}`);
                stderr(`Run ${cyan('markify -h')} for available commands.`);
                process.exit(1);
            }
    }
}

main().catch(err => {
    stderr(`${yellow('Error:')} ${err.message}`);
    process.exit(1);
});

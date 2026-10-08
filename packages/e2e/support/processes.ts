import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { repoRoot } from './harness';

export const preload = join(repoRoot, 'packages/e2e/support/offline-fetch.ts');
export const cliEntry = join(repoRoot, 'packages/cli/src/index.ts');
export const mcpEntry = join(repoRoot, 'packages/mcp/src/index.ts');

export function tempDir(): string {
    return mkdtempSync(join(tmpdir(), 'markify-e2e-'));
}

export interface RunResult { status: number | null; stdout: string; stderr: string; requests: { url: string; headers: Record<string, string> }[] }

/** Strips ANSI colour codes so assertions read like the terminal does. */
export function plain(text: string): string {
    return text.replace(/\x1b\[[0-9;]*m/g, '');
}

export function readRequests(file: string): RunResult['requests'] {
    return existsSync(file) ? readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];
}

/** Runs the CLI exactly as `bun <bin>` would, with network access replaced by fixtures. */
export function runCli(args: string[], options: { cwd?: string; env?: Record<string, string> } = {}): Promise<RunResult> {
    const log = join(tempDir(), 'requests.jsonl');
    // Asynchronous on purpose: loopback servers in this process must keep answering.
    const child = spawn('bun', ['--preload', preload, cliEntry, ...args], {
        cwd: options.cwd ?? repoRoot,
        env: { ...process.env, JINA_TOKEN: '', MARKIFY_E2E_REQUEST_LOG: log, ...options.env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
    return new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('close', status => resolve({ status, stdout: plain(stdout), stderr: plain(stderr), requests: readRequests(log) }));
    });
}

/** Serves a page over real loopback HTTP for DOM-strategy conversions. */
export async function serve(routes: Record<string, string>): Promise<{ url: string; close: () => Promise<void> }> {
    const server: Server = createServer((request, response) => {
        const body = routes[request.url ?? '/'];
        response.writeHead(body ? 200 : 404, { 'content-type': 'text/html; charset=utf-8' });
        response.end(body ?? 'not found');
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    return { url: `http://127.0.0.1:${port}`, close: () => new Promise(resolve => server.close(() => resolve())) };
}


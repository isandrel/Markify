/**
 * Bun --preload for CLI/MCP subprocesses: serves the fixture sites (and the Jina
 * Reader stand-in) through global fetch, passes loopback through to real local
 * servers, and refuses everything else so no test reaches the network.
 */
import { appendFileSync } from 'node:fs';
import { respond } from '../fixtures';

const realFetch = globalThis.fetch;
const log = process.env.MARKIFY_E2E_REQUEST_LOG;

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const headers = Object.fromEntries(new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)));
    if (log) appendFileSync(log, `${JSON.stringify({ url, headers })}\n`);
    const { hostname } = new URL(url);
    if (hostname === '127.0.0.1' || hostname === 'localhost') return realFetch(input, init);
    const response = respond(url);
    if (!response) throw new TypeError(`offline-fetch: no fixture for ${url}`);
    return new Response(response.body, { status: response.status, headers: { 'content-type': response.contentType } });
}) as typeof fetch;

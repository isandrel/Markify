import { describe, expect, test } from 'bun:test';
import { createFetchFetcher, createGMFetcher, type RequestDetails } from '../src/http';

describe('browser HTTP transports', () => {
    test('GM forwards options and resolves only once', async () => {
        let details!: RequestDetails;
        const client = createGMFetcher(5000, input => { details = input; return {}; });
        const result = client.get('https://example.test/thread', { headers: { Accept: 'application/json' }, credentials: true });
        expect(details.headers).toEqual({ Accept: 'application/json' });
        expect(details.anonymous).toBe(false);
        expect(details.timeout).toBe(5000);
        details.onload({ status: 200, responseText: 'body' });
        details.onerror();
        expect(await result).toEqual({ ok: true, status: 200, text: 'body' });
    });
    test('GM cancellation aborts request and ignores late load', async () => {
        const controller = new AbortController();
        let details!: RequestDetails;
        let aborted = false;
        const client = createGMFetcher(5000, input => { details = input; return { abort() { aborted = true; } }; });
        const promise = client.get('https://example.test/thread', { signal: controller.signal });
        controller.abort();
        details.onload({ status: 200, responseText: 'late' });
        await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
        expect(aborted).toBe(true);
    });
    test('GM timeout rejects and pre-aborted request never starts', async () => {
        let details!: RequestDetails;
        let calls = 0;
        const client = createGMFetcher(5000, input => { calls++; details = input; return {}; });
        const pending = client.get('https://example.test');
        details.ontimeout();
        await expect(pending).rejects.toThrow('timed out');
        await expect(client.get('https://example.test', { signal: AbortSignal.abort() })).rejects.toMatchObject({ name: 'AbortError' });
        expect(calls).toBe(1);
    });
    test('fetch forwards headers/credentials and cancellation', async () => {
        let received!: RequestInit;
        const client = createFetchFetcher(5000, (async (_url, options) => {
            received = options!;
            return new Response('ok');
        }) as typeof fetch);
        expect((await client.get('https://example.test', { credentials: false, headers: { Accept: 'text/plain' } })).text).toBe('ok');
        expect(received.credentials).toBe('omit');
        expect(received.headers).toEqual({ Accept: 'text/plain' });
        const slow = createFetchFetcher(5, ((_url, options) => new Promise((_resolve, reject) => {
            options!.signal!.addEventListener('abort', () => reject(options!.signal!.reason));
        })) as typeof fetch);
        await expect(slow.get('https://example.test')).rejects.toThrow('timed out');
    });
});

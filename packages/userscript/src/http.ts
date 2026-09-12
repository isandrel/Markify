import type { FetchOptions, FetchResponse, HttpFetcher } from '@markify/core';

export interface RequestDetails {
    method: 'GET';
    url: string;
    headers?: Record<string, string>;
    timeout: number;
    anonymous: boolean;
    onload: (response: { status: number; responseText: string }) => void;
    onerror: () => void;
    ontimeout: () => void;
    onabort: () => void;
}
export type Request = (details: RequestDetails) => { abort?: () => void };

function abortError(): DOMException {
    return new DOMException('Download cancelled', 'AbortError');
}

/** Transport owns browser APIs; content engines receive only HttpFetcher. */
export function createGMFetcher(timeoutMs: number, request: Request = details => GM.xmlHttpRequest(details)): HttpFetcher {
    return {
        get(url: string, options: FetchOptions = {}): Promise<FetchResponse> {
            return new Promise((resolve, reject) => {
                if (options.signal?.aborted) { reject(abortError()); return; }
                let settled = false;
                let handle: ReturnType<Request> | undefined;
                const finish = (response?: FetchResponse, error?: Error) => {
                    if (settled) return;
                    settled = true;
                    options.signal?.removeEventListener('abort', cancel);
                    if (error) reject(error);
                    else resolve(response!);
                };
                const cancel = () => {
                    finish(undefined, abortError());
                    handle?.abort?.();
                };
                options.signal?.addEventListener('abort', cancel, { once: true });
                try {
                    handle = request({
                        method: 'GET', url, headers: options.headers,
                        timeout: options.timeoutMs ?? timeoutMs,
                        anonymous: options.credentials === false,
                        onload: response => finish({
                            status: response.status,
                            ok: response.status >= 200 && response.status < 300,
                            text: response.responseText,
                        }),
                        onerror: () => finish(undefined, new Error('Network request failed')),
                        ontimeout: () => finish(undefined, new Error('Request timed out')),
                        onabort: () => finish(undefined, abortError()),
                    });
                    if (options.signal?.aborted && !settled) cancel();
                } catch (error) {
                    finish(undefined, error instanceof Error ? error : new Error(String(error)));
                }
            });
        },
    };
}

export function createFetchFetcher(timeoutMs: number, fetchImpl: typeof fetch = fetch): HttpFetcher {
    return {
        async get(url, options = {}) {
            if (options.signal?.aborted) throw abortError();
            const controller = new AbortController();
            const cancel = () => controller.abort(options.signal?.reason);
            options.signal?.addEventListener('abort', cancel, { once: true });
            const timer = setTimeout(() => controller.abort(new Error('Request timed out')), options.timeoutMs ?? timeoutMs);
            try {
                const response = await fetchImpl(url, {
                    headers: options.headers,
                    credentials: options.credentials === true ? 'include' : options.credentials === false ? 'omit' : 'same-origin',
                    signal: controller.signal,
                });
                return { status: response.status, ok: response.ok, text: await response.text() };
            } finally {
                clearTimeout(timer);
                options.signal?.removeEventListener('abort', cancel);
            }
        },
    };
}

export function createProfileFetcher(profile: { transport: 'gm' | 'fetch'; runtime: { timeout_ms: number } }): HttpFetcher {
    return profile.transport === 'gm' ? createGMFetcher(profile.runtime.timeout_ms) : createFetchFetcher(profile.runtime.timeout_ms);
}

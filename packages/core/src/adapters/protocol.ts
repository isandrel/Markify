import { ConversionError, assertNotAborted } from '../errors';
import type { ApiConversionContext, FetchOptions, FetchResponse, HttpFetcher } from '../types';

export type JsonRecord = Record<string, unknown>;

/** Deliberately limited property-path reader; no expressions or prototype traversal. */
export function readPath(value: unknown, path: string): unknown {
    for (const key of path.split('.')) {
        if (!key || ['__proto__', 'prototype', 'constructor'].includes(key) || !isRecord(value) || !Object.prototype.hasOwnProperty.call(value, key)) return undefined;
        value = value[key];
    }
    return value;
}

export function isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function record(value: unknown, path: string): JsonRecord {
    if (!isRecord(value)) throw new ConversionError('INVALID_RESPONSE', `Expected object at ${path}`);
    return value;
}

export function field(data: unknown, key: string, mapping: JsonRecord): unknown {
    const path = mapping[key];
    if (typeof path !== 'string') throw new ConversionError('CONFIG_INVALID', `Missing field mapping: ${key}`);
    return readPath(data, path);
}

export function textField(value: unknown, path: string, allowEmpty = false): string {
    if (typeof value !== 'string' || (!allowEmpty && !value.trim())) throw new ConversionError('INVALID_RESPONSE', `Expected ${allowEmpty ? '' : 'nonempty '}string at ${path}`);
    return value;
}

export function numberField(value: unknown, path: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new ConversionError('INVALID_RESPONSE', `Expected nonnegative number at ${path}`);
    return value;
}

export function dateField(value: unknown, path: string): string {
    const date = new Date(numberField(value, path) * 1000);
    if (!Number.isFinite(date.getTime())) throw new ConversionError('INVALID_RESPONSE', `Invalid timestamp at ${path}`);
    return date.toISOString();
}

export function parseJson(text: string, responseConfig: JsonRecord, stage: string): JsonRecord {
    let parsed: unknown;
    try { parsed = JSON.parse(text); }
    catch { throw new ConversionError('INVALID_RESPONSE', `Malformed JSON during ${stage}`, { stage }); }
    const result = record(parsed, stage);
    if (typeof responseConfig.success_field === 'string' && readPath(result, responseConfig.success_field) !== responseConfig.success_value) {
        throw new ConversionError('API_REJECTED', `API success check failed during ${stage}`, { stage });
    }
    return result;
}

export function requestOptions(config: JsonRecord, context: ApiConversionContext): FetchOptions {
    const api = record(config.api, 'api');
    const request = isRecord(api.request) ? api.request : {};
    const runtime = isRecord(config.runtime) ? config.runtime : {};
    return {
        // Unset means the transport default (GM: logged-in session; fetch: same-origin), not anonymous.
        credentials: typeof request.credentials === 'boolean' ? request.credentials : undefined,
        headers: typeof request.accept === 'string' ? { Accept: request.accept } : {},
        timeoutMs: typeof runtime.timeout_ms === 'number' ? runtime.timeout_ms : 30000,
        signal: context.signal,
    };
}

/** Portable default transport; profile request deadlines are enforced by request(). */
export const fetchHttpFetcher: HttpFetcher = {
    async get(url, options) {
        const response = await fetch(url, {
            credentials: options?.credentials ? 'include' : 'same-origin',
            headers: options?.headers, signal: options?.signal,
        });
        return { ok: response.ok, status: response.status, text: await response.text() };
    },
};

/** Exactly one settlement, even for transports that ignore abort signals. */
export async function request(
    fetcher: HttpFetcher,
    url: string,
    options: FetchOptions,
    details: { stage: string; adapterId?: string; page?: number },
): Promise<FetchResponse> {
    assertNotAborted(options.signal);
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let rejectAbort: (error: ConversionError) => void = () => {};
    const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
    const cancel = () => {
        rejectAbort(new ConversionError('ABORTED', 'Export cancelled', details));
        controller.abort();
    };
    options.signal?.addEventListener('abort', cancel, { once: true });
    timeout = setTimeout(() => {
        rejectAbort(new ConversionError('TIMEOUT', `Request timed out during ${details.stage}`, details));
        controller.abort();
    }, options.timeoutMs ?? 30000);
    try {
        const response = await Promise.race([
            fetcher.get(url, { ...options, signal: controller.signal }), aborted,
        ]);
        assertNotAborted(options.signal);
        return response;
    } catch (error) {
        if (error instanceof ConversionError) throw error;
        assertNotAborted(options.signal);
        throw new ConversionError('NETWORK_ERROR', `Request failed during ${details.stage}`, details);
    } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener('abort', cancel);
    }
}

export function requireOk(response: FetchResponse, stage: string): void {
    if (!response.ok) throw new ConversionError(
        response.status === 401 || response.status === 403 ? 'ACCESS_DENIED' : 'HTTP_ERROR',
        `HTTP ${response.status} during ${stage}`, { stage, status: response.status },
    );
}

export async function pageDelay(api: JsonRecord, signal?: AbortSignal): Promise<void> {
    assertNotAborted(signal);
    const config = isRecord(api.page_delay) ? api.page_delay : {};
    const min = typeof config.min_ms === 'number' ? config.min_ms : 0;
    const max = typeof config.max_ms === 'number' ? config.max_ms : min;
    const jitter = typeof config.jitter === 'number' ? config.jitter : 0;
    const duration = Math.max(0, Math.round((min + Math.random() * (max - min)) * (1 + (Math.random() * 2 - 1) * jitter)));
    if (!duration) return;
    await new Promise<void>((resolve, reject) => {
        const finish = () => { signal?.removeEventListener('abort', cancel); resolve(); };
        const timer = setTimeout(finish, duration);
        const cancel = () => {
            clearTimeout(timer);
            signal?.removeEventListener('abort', cancel);
            reject(new ConversionError('ABORTED', 'Export cancelled'));
        };
        signal?.addEventListener('abort', cancel, { once: true });
    });
}

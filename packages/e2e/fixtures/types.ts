export interface FakeResponse {
    status: number;
    body: string;
    contentType: string;
}

/** One stand-in website. Adding a site = one module exporting this + a registry entry. */
export interface FakeSite {
    /** Exact origins served, or a URL prefix for path-addressed services such as Jina Reader. */
    origins: string[];
    respond(url: URL): FakeResponse;
}

export function html(title: string, body: string, head = ''): string {
    return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${head}</head><body>${body}</body></html>`;
}

export function json(value: unknown, status = 200): FakeResponse {
    return { status, body: JSON.stringify(value), contentType: 'application/json; charset=utf-8' };
}

export function page(body: string, status = 200): FakeResponse {
    return { status, body, contentType: 'text/html; charset=utf-8' };
}

export function text(body: string, status = 200): FakeResponse {
    return { status, body, contentType: 'text/plain; charset=utf-8' };
}

/** 2026-01-01T00:00:00Z — forum APIs use Unix seconds. */
export const EPOCH = 1767225600;
export const EPOCH_ISO = '2026-01-01T00:00:00.000Z';

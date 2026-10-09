/**
 * `window.markify`: a small, read-only console API for AI agents driving the
 * user's own logged-in browser (Chrome DevTools MCP `evaluate_script`, Claude in
 * Chrome, Playwright attached to the profile, …). The browser already holds the
 * session and has passed bot protection, so agents get Markdown without scraping.
 *
 * Page scripts (including ads) can call anything on `window`, so:
 * - it is off until the user enables it for a site from the userscript menu;
 * - every call needs that site's secret token (`markify.connect(token)`), which
 *   only the menu reveals (copied to the clipboard) and which page scripts never
 *   see; a few wrong tokens lock the API until the page reloads;
 * - the surface is narrow: same-site thread exports and listing reads only, every
 *   target validated against the site profile, no generic fetch, no settings or
 *   history writes (except an explicit `download: true`), one export at a time.
 *
 * The token stops drive-by use by scripts on the page. It cannot protect an agent
 * that hands it to a page already hostile to it, so tokens are per site and the
 * menu revokes them.
 */
import { classifyRoute, interpolate } from '@markify/core';
import type { AdapterConfig } from '@markify/core';

export const AGENT_API_STORAGE_KEY = 'markify_agent_api_v1';
export const MAX_BATCH = 50;
/** Marks the object connect() returns, so it reaches the page as methods rather than data. */
const AGENT_CLIENT = Symbol('markify.client');
/** Wrong tokens tolerated per page load before the API locks. */
export const MAX_TOKEN_FAILURES = 5;

/** Per-site tokens in userscript storage; a site without one has the API off. */
export interface AgentApiSettings { sites: Record<string, { token: string; createdAt: string }> }

export function normalizeAgentSettings(value: unknown): AgentApiSettings {
    const sites: AgentApiSettings['sites'] = {};
    const raw = (value as { sites?: unknown } | null)?.sites;
    if (raw && typeof raw === 'object') {
        for (const [site, entry] of Object.entries(raw as Record<string, any>)) {
            if (typeof entry?.token === 'string' && entry.token.length >= 32) sites[site] = { token: entry.token, createdAt: String(entry.createdAt ?? '') };
        }
    }
    return { sites };
}

/** 128 random bits, hex encoded. */
export function newAgentToken(random: (bytes: Uint8Array<ArrayBuffer>) => Uint8Array = bytes => crypto.getRandomValues(bytes)): string {
    return `mfy_${Array.from(random(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

/** Compares without exiting early on the first differing character. */
function sameToken(given: string, expected: string): boolean {
    let diff = given.length ^ expected.length;
    for (let index = 0; index < expected.length; index++) diff |= (given.charCodeAt(index) || 0) ^ expected.charCodeAt(index);
    return diff === 0;
}

export interface AgentItem { id: string; title: string; url: string; downloaded: boolean }
export interface ExportOutcome {
    markdown: string;
    filename: string;
    title: string;
    metadata: Record<string, unknown>;
}
export type ExportResult =
    | ({ ok: true; site: string; id: string; url: string } & ExportOutcome)
    | { ok: false; site: string; id?: string; url?: string; error: { code: string; message: string } };

/** Browser-side capabilities the API is built on; main.ts supplies the real ones. */
export interface AgentHost {
    version: string;
    location(): string;
    /** The profile whose origins include the current page. */
    profile(): AdapterConfig | undefined;
    exportThread(url: string, options: { title?: string; download: boolean; signal?: AbortSignal }): Promise<ExportOutcome>;
    /** Rows of the current listing page, or null when the page is not a listing. */
    listRows(): Promise<AgentItem[] | null>;
    history(siteId: string): Promise<{ id: string; title: string; downloadedAt: string; type: string }[]>;
    /** Downloads a ZIP named like a batch download, records history, returns the archive name. */
    downloadZip(items: { id: string; title: string; markdown: string }[]): Promise<string>;
    delay(signal?: AbortSignal): Promise<void>;
    /** The site's current token, or undefined when the API is off for it. Read on every call, so the menu revokes at once. */
    token(siteId: string): Promise<string | undefined>;
}

interface Command {
    name: string;
    description: string;
    input: Record<string, unknown>;
    run(args: Record<string, any>): Promise<unknown>;
}

const tokenSchema = { type: 'string', description: 'Secret token from the Markify menu (🤖 AI Console API)' };
const targetSchema = {
    oneOf: [{ type: 'string', description: 'Thread URL on this site, or a numeric thread id' }, { type: 'integer', minimum: 1 }],
};

export class AgentApiError extends Error {
    constructor(readonly code: string, message: string) { super(message); this.name = 'AgentApiError'; }
}

function errorOf(error: unknown): { code: string; message: string } {
    if (error instanceof AgentApiError) return { code: error.code, message: error.message };
    const code = typeof (error as { code?: unknown })?.code === 'string' ? (error as { code: string }).code
        : (error as { name?: string })?.name === 'AbortError' ? 'ABORTED' : 'EXPORT_FAILED';
    return { code, message: error instanceof Error ? error.message : String(error) };
}

/** Resolves a target to a canonical thread URL and id on the current site, or throws INVALID_TARGET. */
export function resolveTarget(target: unknown, profile: AdapterConfig, currentUrl: string): { url: string; id: string } {
    let url: string;
    if (target === undefined || target === null || target === '') {
        url = currentUrl;
    } else if ((typeof target === 'number' && Number.isInteger(target) && target > 0) || (typeof target === 'string' && /^\d+$/.test(target))) {
        const template = profile.metadata?.source_url;
        if (!template) throw new AgentApiError('INVALID_TARGET', `${profile.site.name} has no thread URL template; pass a full URL`);
        url = interpolate(template, { base_url: profile.site.base_url, thread_id: String(target), topic_id: String(target) });
    } else if (typeof target === 'string') {
        url = target;
    } else {
        throw new AgentApiError('INVALID_TARGET', 'Target must be a thread URL or a numeric thread id');
    }
    let route;
    try { route = classifyRoute(url, profile); } catch { route = null; }
    if (route?.kind !== 'thread' || !route.id) {
        throw new AgentApiError('INVALID_TARGET', target === undefined || target === null || target === ''
            ? 'This page is not a thread; pass a thread id or URL'
            : `Not a ${profile.site.name} thread: ${String(target)}`);
    }
    return { url, id: route.id };
}

export function createAgentApi(host: AgentHost) {
    let queue: Promise<unknown> = Promise.resolve();
    /** One export at a time, so an agent cannot turn the session into a crawler. */
    const serial = <T>(task: () => Promise<T>): Promise<T> => {
        const next = queue.catch(() => undefined).then(task);
        queue = next;
        return next;
    };
    const site = (): AdapterConfig => {
        const profile = host.profile();
        if (!profile) throw new AgentApiError('UNSUPPORTED_SITE', 'Markify has no enabled profile for this site');
        return profile;
    };

    async function exportOne(target: unknown, options: { download?: boolean; title?: string } = {}): Promise<ExportResult> {
        let profile: AdapterConfig | undefined;
        let resolved: { url: string; id: string } | undefined;
        try {
            profile = site();
            resolved = resolveTarget(target, profile, host.location());
            const outcome = await host.exportThread(resolved.url, { title: options.title, download: options.download === true });
            return { ok: true, site: profile.site.id, id: resolved.id, url: resolved.url, ...outcome };
        } catch (error) {
            return { ok: false, site: profile?.site.id ?? 'unknown', id: resolved?.id, url: resolved?.url, error: errorOf(error) };
        }
    }

    const commands: Command[] = [
        {
            name: 'status',
            description: 'Where the browser is: site, page kind (thread, listing, entry) and thread id, plus the API version.',
            input: { type: 'object', properties: {}, additionalProperties: false },
            async run() {
                const profile = host.profile();
                let route = null;
                try { route = profile ? classifyRoute(host.location(), profile) : null; } catch { /* ambiguous */ }
                return {
                    version: host.version, url: host.location(),
                    site: profile ? { id: profile.site.id, name: profile.site.name } : null,
                    page: route ? { kind: route.kind, route: route.name, id: route.id ?? null } : null,
                };
            },
        },
        {
            name: 'export',
            description: 'Convert one thread to Markdown (with frontmatter and comments) using the logged-in session. Defaults to the current thread page. Returns the Markdown; only downloads a file when download is true.',
            input: {
                type: 'object',
                properties: {
                    target: targetSchema,
                    download: { type: 'boolean', default: false, description: 'Also save the .md file and record it in download history' },
                    title: { type: 'string', description: 'Title to use when the site API has none and the thread is not the open page' },
                },
                additionalProperties: false,
            },
            run: args => serial(() => exportOne(args.target, { download: args.download, title: typeof args.title === 'string' ? args.title : undefined })),
        },
        {
            name: 'list',
            description: 'Threads shown on the current listing page (feed, category, tag, search, latest), with whether each was downloaded before.',
            input: { type: 'object', properties: {}, additionalProperties: false },
            async run() {
                const profile = site();
                const items = await host.listRows();
                if (!items) throw new AgentApiError('NOT_A_LISTING', 'This page is not a listing; open a feed, category, tag or search page');
                return { site: profile.site.id, url: host.location(), items };
            },
        },
        {
            name: 'exportMany',
            description: `Convert several threads (at most ${MAX_BATCH}) one after another with polite delays. Returns one result per target, in order; failures do not stop the rest. With zip true, also downloads a ZIP of the successes.`,
            input: {
                type: 'object',
                properties: {
                    targets: { type: 'array', items: targetSchema, minItems: 1, maxItems: MAX_BATCH },
                    zip: { type: 'boolean', default: false, description: 'Also download a ZIP of the successful exports and record them in history' },
                },
                required: ['targets'],
                additionalProperties: false,
            },
            run: args => serial(async () => {
                const targets = args.targets;
                if (!Array.isArray(targets) || !targets.length) throw new AgentApiError('INVALID_TARGET', 'targets must be a non-empty array');
                if (targets.length > MAX_BATCH) throw new AgentApiError('TOO_MANY', `At most ${MAX_BATCH} targets per call`);
                // Titles from the current listing name files when the API has none (Discourse /raw/).
                const titles = new Map((await host.listRows().catch(() => null) ?? []).map(item => [item.id, item.title]));
                const results: ExportResult[] = [];
                for (const [index, target] of targets.entries()) {
                    const id = typeof target === 'number' || /^\d+$/.test(String(target)) ? String(target) : undefined;
                    results.push(await exportOne(target, { title: id ? titles.get(id) : undefined }));
                    if (index < targets.length - 1) await host.delay();
                }
                if (args.zip) {
                    const ok = results.filter((result): result is Extract<ExportResult, { ok: true }> => result.ok);
                    if (ok.length) {
                        const zip = await host.downloadZip(ok.map(result => ({ id: result.id, title: result.title, markdown: result.markdown })));
                        return { results, zip };
                    }
                }
                return { results };
            }),
        },
        {
            name: 'history',
            description: 'Threads of the current site already downloaded with Markify (read-only).',
            input: { type: 'object', properties: {}, additionalProperties: false },
            async run() {
                const profile = site();
                return { site: profile.site.id, items: await host.history(profile.site.id) };
            },
        },
    ];

    let failures = 0;
    /** Throws unless `token` is the current site's token. */
    async function authorize(token: unknown): Promise<void> {
        if (failures >= MAX_TOKEN_FAILURES) throw new AgentApiError('LOCKED', 'Too many wrong tokens; reload the page and copy the token from the Markify menu');
        const profile = site();
        const expected = await host.token(profile.site.id);
        if (!expected) throw new AgentApiError('DISABLED', `The AI console API is off for ${profile.site.name}; enable it from the Markify menu (🤖 AI Console API)`);
        if (typeof token !== 'string' || !sameToken(token, expected)) {
            failures++;
            throw new AgentApiError('UNAUTHORIZED', 'Wrong or revoked token; copy the current one from the Markify menu (🤖 AI Console API)');
        }
    }

    const help = () => ({
        name: 'markify',
        version: host.version,
        usage: 'The user copies a token from the Markify menu (🤖 AI Console API). Then: const m = await markify.connect(token); await m.export() on a thread page, '
            + 'or await m.exportMany((await m.list()).items.slice(0, 5).map(i => i.id)). Every command returns a Promise of plain JSON.',
        commands: commands.map(command => ({ name: command.name, description: command.description, input: command.input })),
        errors: ['DISABLED', 'UNAUTHORIZED', 'LOCKED', 'UNSUPPORTED_SITE', 'INVALID_TARGET', 'NOT_A_LISTING', 'TOO_MANY',
            'ACCESS_DENIED', 'HTTP_ERROR', 'TIMEOUT', 'REPEATED_PAGE', 'PAGE_LIMIT', 'EXPORT_FAILED'],
    });

    /** Runs a command by name once the token checks out. */
    async function call(token: unknown, name: string, args: Record<string, unknown> = {}): Promise<unknown> {
        await authorize(token);
        const command = commands.find(entry => entry.name === name);
        if (!command) throw new AgentApiError('UNKNOWN_COMMAND', `No command ${name}`);
        return command.run(args);
    }

    /** Positional-argument methods bound to one token; each call checks it again, so revoking takes effect at once. */
    const client = (token: string): Record<string, AgentMethod> => ({
        [AGENT_CLIENT]: true,
        help: async () => help(),
        status: () => call(token, 'status'),
        export: (target?: unknown, options: Record<string, unknown> = {}) => call(token, 'export', { ...options, target }),
        list: () => call(token, 'list'),
        exportMany: (targets: unknown, options: Record<string, unknown> = {}) => call(token, 'exportMany', { ...options, targets }),
        history: () => call(token, 'history'),
    });

    return {
        help,
        commands,
        call,
        /** Clears the wrong-token lock (the user just enabled or rotated the token). */
        resetLock: () => { failures = 0; },
        /** The page-facing `markify` object: help() is open, everything else needs connect(token). */
        root: {
            help: async () => help(),
            connect: async (token: unknown) => {
                await authorize(token);
                return client(token as string);
            },
        } as Record<string, AgentMethod>,
    };
}

type AgentMethod = (...args: any[]) => Promise<unknown>;
export type AgentApi = ReturnType<typeof createAgentApi>;

/** Plain data only crosses into the page. */
const plain = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

/**
 * Defines `markify` on the page window, once per page: it is not configurable, so
 * page scripts cannot swap it for a look-alike that collects tokens afterwards.
 * Turning the API off revokes the token instead of removing the object.
 * Firefox userscript sandboxes need exportFunction/cloneInto for anything the page
 * touches; Chromium managers (page or isolated world via unsafeWindow) take plain objects.
 */
export function installAgentApi(target: any, api: AgentApi, scope: any = globalThis): boolean {
    const exportFunction = typeof scope.exportFunction === 'function' ? scope.exportFunction : undefined;
    const cloneInto = typeof scope.cloneInto === 'function' ? scope.cloneInto : undefined;
    const pageWindow = target.wrappedJSObject ?? target;
    const toPage = (value: unknown) => (cloneInto ? cloneInto(value, target) : value);

    const expose = (methods: Record<string, AgentMethod>): object => {
        const object = exportFunction ? new target.Object() : {};
        for (const [name, method] of Object.entries(methods)) {
            const call = (...args: unknown[]) => {
                const result = Promise.resolve()
                    .then(() => method(...args.map(plain)))
                    .then(
                        value => ((value as Record<symbol, unknown> | undefined)?.[AGENT_CLIENT]
                            ? expose(value as Record<string, AgentMethod>)
                            : toPage(plain(value))),
                        error => { throw toPage(plain(errorOf(error))); },
                    );
                if (!exportFunction) return result;
                return new target.Promise(exportFunction((resolve: (v: unknown) => void, reject: (v: unknown) => void) => { result.then(resolve, reject); }, target));
            };
            if (exportFunction) exportFunction(call, object, { defineAs: name });
            else (object as Record<string, unknown>)[name] = call;
        }
        if (!exportFunction) Object.freeze(object);
        return object;
    };

    try {
        Object.defineProperty(pageWindow, 'markify', { value: expose(api.root), configurable: false, enumerable: false, writable: false });
    } catch (error) {
        console.warn('[Markify] This page already defines window.markify; the AI console API is unavailable here', error);
        return false;
    }

    // WebMCP (draft): the same commands as tools for in-browser agents, when the browser offers it. Each call carries the token.
    const modelContext = target.navigator?.modelContext;
    if (typeof modelContext?.registerTool === 'function') {
        for (const command of api.commands) {
            try {
                modelContext.registerTool({
                    name: `markify_${command.name}`,
                    description: command.description,
                    inputSchema: {
                        ...command.input,
                        properties: { token: tokenSchema, ...(command.input.properties as object) },
                        required: ['token', ...((command.input.required as string[] | undefined) ?? [])],
                    },
                    execute: async (input: Record<string, unknown>) => {
                        const { token, ...args } = plain(input ?? {});
                        let text: string;
                        try { text = JSON.stringify(await api.call(token, command.name, args)); }
                        catch (error) { text = JSON.stringify({ ok: false, error: errorOf(error) }); }
                        return { content: [{ type: 'text', text }] };
                    },
                });
            } catch (error) {
                console.warn('[Markify] WebMCP tool registration failed', command.name, error);
            }
        }
    }
    return true;
}

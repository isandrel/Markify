import { z } from 'zod';

const text = z.string().min(1);
const origin = z.url().refine(value => { const u = new URL(value); return u.origin === value && u.protocol === 'https:'; }, 'Expected an HTTPS origin without path');
const path = text.regex(/^[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)*$/, 'Expected a simple property path');
const pattern = text.refine(value => { try { new RegExp(value); return value.startsWith('^') && value.endsWith('$'); } catch { return false; } }, 'Expected a valid anchored regular expression');
const template = (keys: string[]) => text.refine(value => [...value.matchAll(/\{(\w+)\}/g)].every(m => keys.includes(m[1])), `Allowed placeholders: ${keys.join(', ')}`);
export const filenameSchema = z.strictObject({
    single: template(['title', 'author', 'id', 'date', 'site']),
    batch_item: template(['title', 'author', 'id', 'date', 'site', 'index']),
    batch: template(['site', 'type', 'id', 'date', 'tagname']),
});
const runtimeFields = {
    poll_ms: z.number().int().min(100).max(10000),
    debounce_ms: z.number().int().min(10).max(2000),
    timeout_ms: z.number().int().min(1000).max(120000),
};
export const runtimeSchema = z.strictObject({
    poll_ms: runtimeFields.poll_ms.default(500),
    debounce_ms: runtimeFields.debounce_ms.default(100),
    timeout_ms: runtimeFields.timeout_ms.default(30000),
});
/** For overrides: no defaults, so setting one value never resets the profile's others. */
export const runtimeOverrideSchema = z.strictObject({
    poll_ms: runtimeFields.poll_ms.optional(),
    debounce_ms: runtimeFields.debounce_ms.optional(),
    timeout_ms: runtimeFields.timeout_ms.optional(),
});
export const routeSchema = z.strictObject({
    name: text, kind: z.enum(['listing', 'thread', 'entry']), pattern,
    id_group: z.number().int().min(1).max(20).optional(),
    origins: z.array(origin).min(1).optional(), query_keys: z.array(text).optional(),
});
export const layoutSchema = z.strictObject({
    name: text, route_names: z.array(text).default([]), root_selector: text,
    row_selector: text, link_selector: text, title_selector: text.optional(),
    title_attribute: text.optional(), exclude_selectors: z.array(text).default([]),
    empty_selector: text.optional(), loading_selector: text.optional(),
});
const bodyVars = ['title', 'author', 'posted_at', 'updated_at', 'downloaded_at', 'url', 'views', 'replies', 'favorites', 'frontmatter', 'date', 'content', 'comments', 'index', 'delimiter', 'count', 'nested', 'missing', 'reason'];
export const templateBlockSchema = z.strictObject({ template: template(bodyVars) });
const endpoint = template(['base_url', 'topic_id', 'thread_id', 'post_id', 'page', 'page_size', 'order']);
export const profileSchema = z.strictObject({
    schema_version: z.literal(1),
    engine: z.enum(['forum-json', 'discourse-raw']), transport: z.enum(['gm', 'fetch']), enabled: z.boolean().default(true),
    site: z.strictObject({ id: text.regex(/^[a-z0-9][a-z0-9-]*$/), name: text, base_url: origin, origins: z.array(origin).min(1), aliases: z.array(text).default([]) }),
    activation: z.strictObject({ matches: z.array(text).min(1), connect: z.array(text).default([]) }),
    routes: z.array(routeSchema).min(1),
    batch: z.strictObject({ layouts: z.array(layoutSchema).default([]), label_selector: text.optional(), label_attribute: text.optional() }).default({ layouts: [] }),
    runtime: runtimeSchema.prefault({}),
    api: z.strictObject({
        raw_endpoint: endpoint.optional(), json_endpoint: endpoint.optional(), thread_endpoint: endpoint.optional(), posts_endpoint: endpoint.optional(),
        /** forum-json: full nested replies of one post, when the comments page only carries a preview. */
        nested_endpoint: endpoint.optional(),
        max_pages: z.number().int().min(1).max(1000).default(100), page_size: z.number().int().min(1).max(1000).default(20),
        page_delay: z.strictObject({ min_ms: z.number().min(0).max(60000).default(100), max_ms: z.number().min(0).max(60000).default(100), jitter: z.number().min(0).max(1).default(0) }).optional(),
        order: z.enum(['time_asc', 'time_desc', 'hot_desc']).optional(), content_format: z.enum(['bbcode', 'html', 'markdown']).optional(),
        request: z.strictObject({ credentials: z.boolean().optional(), accept: text.optional() }).optional(),
        id_extraction: z.strictObject({ patterns: z.array(text) }).optional(),
        response: z.strictObject({ success_field: path.optional(), success_value: z.union([z.number(), z.string(), z.boolean()]).optional(), data_field: path.optional(), posts_field: path.optional(), nested_posts_field: path.optional() }).optional(),
        fields: z.record(z.string(), z.union([path, z.record(z.string(), path)])).optional(),
    }),
    metadata: z.strictObject({
        title_cleanup: text.optional(),
        /** Elements holding the clean title, tried in order before document.title + title_cleanup. */
        title_selectors: z.array(text).optional(),
        tags: z.array(text).optional(), source_url: endpoint.optional(),
    }).optional(),
    http: z.strictObject({ user_agent: text.optional() }).optional(),
    page_separator: z.string().optional(), delimiter: z.string().default('---'),
    frontmatter: templateBlockSchema.optional(), document: templateBlockSchema.optional(), comment: templateBlockSchema.optional(), comments_header: templateBlockSchema.optional(),
    reply: templateBlockSchema.optional(), replies_gap: templateBlockSchema.optional(),
    filename: filenameSchema.prefault({ single: '[{id}] {title}', batch_item: '{index} - [{id}] {title}', batch: '[{date}] [{site}] [{type}] [{id}] {tagname}' }),
}).superRefine((p, ctx) => {
    const fail = (key: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path: key, message });
    if (!p.site.origins.includes(p.site.base_url)) fail(['site', 'origins'], 'Must include site.base_url');
    const names = new Set<string>();
    for (const [i, route] of p.routes.entries()) {
        if (names.has(route.name)) fail(['routes', i, 'name'], 'Duplicate route name');
        names.add(route.name);
        if (route.kind === 'thread' && !route.id_group) fail(['routes', i, 'id_group'], 'Thread route requires an ID capture');
        if (route.origins?.some(o => !p.site.origins.includes(o))) fail(['routes', i, 'origins'], 'Route origins must belong to site.origins');
    }
    for (const [i, layout] of p.batch.layouts.entries()) if (layout.route_names.some(n => !names.has(n))) fail(['batch', 'layouts', i, 'route_names'], 'Unknown route name');
    const required = p.engine === 'forum-json' ? ['thread_endpoint', 'posts_endpoint'] as const : ['raw_endpoint'] as const;
    for (const key of required) if (!p.api[key]) fail(['api', key], `Required for ${p.engine}`);
    if (p.engine === 'forum-json') {
        for (const key of ['success_field', 'success_value', 'data_field', 'posts_field'] as const) if (p.api.response?.[key] === undefined) fail(['api', 'response', key], 'Required for forum-json');
        for (const key of ['title', 'author', 'content', 'posted_at', 'updated_at', 'views', 'replies', 'favorites']) if (typeof p.api.fields?.[key] !== 'string') fail(['api', 'fields', key], 'Required property path for forum-json');
        const post = p.api.fields?.post;
        for (const key of ['id', 'author', 'content', 'posted_at']) if (!post || typeof post === 'string' || typeof post[key] !== 'string') fail(['api', 'fields', 'post', key], 'Required property path for forum-json');
        if (!p.api.content_format) fail(['api', 'content_format'], 'Required for forum-json');
        if (!p.metadata?.source_url) fail(['metadata', 'source_url'], 'Required for forum-json');
        for (const key of ['frontmatter', 'document', 'comment', 'comments_header'] as const) if (!p[key]) fail([key], 'Required for forum-json');
    }
    if (p.engine === 'forum-json' && !p.api.thread_endpoint?.includes('{thread_id}')) fail(['api', 'thread_endpoint'], 'Must include {thread_id}');
    if (p.engine === 'discourse-raw' && !p.api.raw_endpoint?.includes('{topic_id}')) fail(['api', 'raw_endpoint'], 'Must include {topic_id}');
    if (p.api.page_delay && p.api.page_delay.min_ms > p.api.page_delay.max_ms) fail(['api', 'page_delay'], 'min_ms must not exceed max_ms');
    if (p.api.nested_endpoint && !p.api.nested_endpoint.includes('{post_id}')) fail(['api', 'nested_endpoint'], 'Must include {post_id}');
    for (const key of ['raw_endpoint', 'json_endpoint', 'thread_endpoint', 'posts_endpoint', 'nested_endpoint'] as const) {
        if (!p.api[key]) continue;
        try {
            const url = new URL(p.api[key]!.replace('{base_url}', p.site.base_url).replace(/\{\w+\}/g, '1'));
            if (url.protocol !== 'https:') fail(['api', key], 'Expected an HTTPS endpoint');
            if (!p.site.origins.includes(url.origin) && !p.activation.connect.includes(url.hostname)) fail(['activation', 'connect'], `Missing endpoint host ${url.hostname}`);
        } catch { fail(['api', key], 'Invalid endpoint URL'); }
    }
});

export type AdapterConfig = z.infer<typeof profileSchema>;
export type ResolvedAdapterProfile = AdapterConfig;
export type RouteConfig = z.infer<typeof routeSchema>;
export type LayoutConfig = z.infer<typeof layoutSchema>;

export class ConfigError extends Error {
    readonly code = 'INVALID_CONFIG';
    constructor(public readonly source: string, message: string) { super(`${source}: ${message}`); this.name = 'ConfigError'; }
}
export function deepFreeze<T>(value: T): T {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child);
    }
    return value;
}
export function normalizeProfile(input: unknown, source = 'profile'): AdapterConfig {
    const result = profileSchema.safeParse(input);
    if (!result.success) throw new ConfigError(source, result.error.issues.map(i => `${i.path.join('.') || '<root>'}: ${i.message}`).join('; '));
    return deepFreeze(result.data);
}
export function resolveProfiles(inputs: Record<string, unknown>): Record<string, AdapterConfig> {
    const profiles: Record<string, AdapterConfig> = Object.create(null);
    const aliases = new Map<string, string>();
    for (const [source, input] of Object.entries(inputs).sort(([a], [b]) => a.localeCompare(b))) {
        const p = normalizeProfile(input, source);
        if (profiles[p.site.id]) throw new ConfigError(source, `Duplicate site.id ${p.site.id}`);
        for (const alias of [p.site.id, p.site.name, ...p.site.aliases]) {
            const previous = aliases.get(alias.toLowerCase());
            if (previous && previous !== p.site.id) throw new ConfigError(source, `Alias collision: ${alias} (${previous})`);
            aliases.set(alias.toLowerCase(), p.site.id);
        }
        profiles[p.site.id] = p;
    }
    return deepFreeze(profiles);
}
export function profileMetadata(profiles: Record<string, AdapterConfig>) {
    return { matches: [...new Set(Object.values(profiles).flatMap(p => p.activation.matches))].sort(), connect: [...new Set(Object.values(profiles).flatMap(p => p.activation.connect))].sort() };
}

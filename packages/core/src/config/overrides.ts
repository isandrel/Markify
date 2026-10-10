import { z } from 'zod';
import { ConfigError, deepFreeze, filenameSchema, normalizeProfile, runtimeOverrideSchema, templateBlockSchema, type AdapterConfig } from './schema';

/** Deliberately limited: endpoint/route/layout updates belong to reviewed profiles. */
export const profileOverrideSchema = z.strictObject({
    enabled: z.boolean().optional(),
    document: templateBlockSchema.optional(), frontmatter: templateBlockSchema.optional(),
    comment: templateBlockSchema.optional(), comments_header: templateBlockSchema.optional(),
    reply: templateBlockSchema.optional(), replies_gap: templateBlockSchema.optional(),
    filename: filenameSchema.partial().optional(),
    runtime: runtimeOverrideSchema.optional(),
});
export const userOverridesSchema = z.strictObject({
    schema_version: z.literal(1),
    global: profileOverrideSchema.default({}),
    sites: z.record(z.string(), profileOverrideSchema).default({}),
});
export type ProfileOverrides = z.infer<typeof profileOverrideSchema>;
export type UserOverrides = z.infer<typeof userOverridesSchema>;
export const OVERRIDES_STORAGE_KEY = 'markify_overrides_v1';
export const LEGACY_BACKUP_STORAGE_KEY = 'markify_templates_backup_v1';
export function parseUserOverrides(input: unknown): UserOverrides {
    const parsed = userOverridesSchema.safeParse(input);
    if (!parsed.success) throw new ConfigError('user overrides', parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '));
    return deepFreeze(parsed.data);
}
export function resolveProfile(profile: AdapterConfig, layers: ProfileOverrides[] = []): AdapterConfig {
    let result = structuredClone(profile);
    for (const input of layers) {
        const layer = profileOverrideSchema.parse(input);
        result = { ...result, ...layer, filename: { ...result.filename, ...layer.filename }, runtime: { ...result.runtime, ...layer.runtime } };
    }
    return normalizeProfile(result, profile.site.id);
}
export function applyUserOverrides(profiles: Record<string, AdapterConfig>, input: unknown, invocation: ProfileOverrides = {}): Record<string, AdapterConfig> {
    const overrides = parseUserOverrides(input);
    for (const id of Object.keys(overrides.sites)) if (!Object.hasOwn(profiles, id)) throw new ConfigError(`user overrides.sites.${id}`, 'Unknown stable site ID');
    return deepFreeze(Object.fromEntries(Object.entries(profiles).map(([id, p]) => [id, resolveProfile(p, [overrides.global, overrides.sites[id] ?? {}, invocation])])));
}
export function resetSiteOverrides(input: unknown, siteId: string): UserOverrides {
    const parsed = parseUserOverrides(input);
    const sites = { ...parsed.sites }; delete sites[siteId];
    return parseUserOverrides({ ...parsed, sites });
}
/** Idempotent pure migration. Caller persists backup before validated overrides. */
export function migrateLegacyOverrides(legacy: unknown, existing?: unknown): { overrides: UserOverrides; backup?: unknown; warnings: string[] } {
    if (existing !== undefined && existing !== null) return { overrides: parseUserOverrides(existing), warnings: [] };
    const candidate = legacy && typeof legacy === 'object' ? (legacy as Record<string, unknown>).filename : undefined;
    let filename: ProfileOverrides['filename'];
    const warnings: string[] = [];
    if (candidate !== undefined) {
        const result = filenameSchema.partial().safeParse(candidate);
        if (result.success) {
            // Before migration, global.single controlled batch entries as well.
            filename = { ...result.data, ...(result.data.single ? { batch_item: result.data.single } : {}) };
            warnings.push('Legacy filename values preserved; their origin as defaults or user customizations is unknown.');
        } else warnings.push('Legacy filenames failed validation; retained in backup for manual recovery.');
    }
    return { overrides: parseUserOverrides({ schema_version: 1, global: filename ? { filename } : {}, sites: {} }), backup: structuredClone(legacy), warnings };
}

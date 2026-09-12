import {
    setConfig, getConfig, applyUserOverrides, migrateLegacyOverrides,
    parseUserOverrides, OVERRIDES_STORAGE_KEY, LEGACY_BACKUP_STORAGE_KEY,
    resetSiteOverrides,
    type UserOverrides,
} from '@markify/core/config';

export const theme = __MARKIFY_THEME__;
export const notifications = __MARKIFY_NOTIFICATIONS__;
export const ui = __MARKIFY_UI__;
export const pkg = { package: __MARKIFY_PACKAGE__ };
export const templates = __MARKIFY_TEMPLATES__;
export const compiledConfig = __MARKIFY_CONFIG__;

export async function initializeConfig(): Promise<void> {
    const existing = await GM.getValue(OVERRIDES_STORAGE_KEY, null);
    const legacy = await GM.getValue('markify_templates', null);
    const migration = migrateLegacyOverrides(legacy, existing);
    if (existing === null) {
        if (migration.backup != null && await GM.getValue(LEGACY_BACKUP_STORAGE_KEY, null) === null) {
            await GM.setValue(LEGACY_BACKUP_STORAGE_KEY, migration.backup);
        }
        applyUserOverrides(compiledConfig.adapters, migration.overrides);
        await GM.setValue(OVERRIDES_STORAGE_KEY, migration.overrides);
    }
    for (const warning of migration.warnings) console.warn('[Markify config]', warning);
    setConfig({ ...compiledConfig, adapters: applyUserOverrides(compiledConfig.adapters, migration.overrides) });
}

export async function loadOverrides(): Promise<UserOverrides> {
    return parseUserOverrides(await GM.getValue(OVERRIDES_STORAGE_KEY, { schema_version: 1, global: {}, sites: {} }));
}

export async function saveOverrides(input: unknown): Promise<void> {
    const overrides = parseUserOverrides(input);
    applyUserOverrides(compiledConfig.adapters, overrides);
    await GM.setValue(OVERRIDES_STORAGE_KEY, overrides);
    // Reload applies preferences to new jobs; in-flight jobs keep their snapshot.
}

export async function resetOverridesForSite(siteId: string): Promise<void> {
    await saveOverrides(resetSiteOverrides(await loadOverrides(), siteId));
}

export function getProfiles() { return getConfig().adapters; }

export function formatMessage(template: string, values: Record<string, unknown>): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] !== undefined ? String(values[key]) : match);
}

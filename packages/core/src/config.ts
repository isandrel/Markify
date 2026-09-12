/** Pure configuration boundary shared by browser, CLI and build. Disk loading is explicit in ./config/disk. */
import { resolveProfiles, deepFreeze, type AdapterConfig } from './config/schema';
export * from './config/schema';
export * from './config/overrides';
export * from './adapters/routes';

export interface MarkifyConfig {
    [key: string]: unknown;
    adapters: Record<string, AdapterConfig>;
    templates?: Record<string, unknown>;
}
let cachedConfig: MarkifyConfig = deepFreeze({ adapters: {} });
export function getConfig(): MarkifyConfig { return cachedConfig; }
export function setConfig(config: { adapters: Record<string, unknown>; [key: string]: unknown }): void {
    cachedConfig = deepFreeze({ ...structuredClone(config), adapters: resolveProfiles(config.adapters) });
}
export function getAdapterConfig(name: string): AdapterConfig | undefined {
    const alias = name.toLowerCase();
    return Object.values(cachedConfig.adapters).find(p => [p.site.id, p.site.name, ...p.site.aliases].some(n => n.toLowerCase() === alias));
}
export function extractIdFromUrl(input: string, patterns: string[]): string | null {
    let url: URL;
    try { url = new URL(input); } catch { return null; }
    for (const value of [url.pathname, url.href]) for (const pattern of patterns) {
        const match = new RegExp(pattern).exec(value);
        if (match?.[1]) return match[1];
    }
    return null;
}
export function interpolate(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key]?.toString() ?? `{${key}}`);
}

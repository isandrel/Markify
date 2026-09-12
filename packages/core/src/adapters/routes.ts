import type { AdapterConfig, RouteConfig } from '../config/schema';

export interface RouteMatch {
    profileId: string;
    name: string;
    kind: RouteConfig['kind'];
    id?: string;
    url: URL;
    /** Relevant page/filter query state only; hash and tracking parameters are ignored. */
    key: string;
}
const compiled = new WeakMap<AdapterConfig, Array<{ route: RouteConfig; regex: RegExp }>>();
export function classifyRoute(input: string, profile: AdapterConfig): RouteMatch | null {
    let url: URL;
    try { url = new URL(input); } catch { return null; }
    if (url.username || url.password || !profile.site.origins.includes(url.origin)) return null;
    let rules = compiled.get(profile);
    if (!rules) { rules = profile.routes.map(route => ({ route, regex: new RegExp(route.pattern) })); compiled.set(profile, rules); }
    const matches: RouteMatch[] = [];
    for (const { route, regex } of rules) {
        if (route.origins && !route.origins.includes(url.origin)) continue;
        const match = regex.exec(url.pathname);
        if (!match) continue;
        const id = route.id_group ? match[route.id_group] : undefined;
        if (route.kind === 'thread' && !id) throw new Error(`INVALID_ROUTE_CAPTURE: ${profile.site.id}/${route.name}`);
        const query = new URLSearchParams();
        for (const key of [...new Set(route.query_keys ?? url.searchParams.keys())].sort()) for (const value of url.searchParams.getAll(key)) query.append(key, value);
        matches.push({ profileId: profile.site.id, name: route.name, kind: route.kind, id, url,
            key: `${profile.site.id}:${route.name}:${url.pathname.replace(/\/$/, '')}?${query}` });
    }
    if (matches.length > 1) throw new Error(`AMBIGUOUS_ROUTE: ${profile.site.id}: ${matches.map(m => m.name).join(', ')}`);
    return matches[0] ?? null;
}
export function classifyRegistryRoute(input: string, profiles: Record<string, AdapterConfig>): RouteMatch | null {
    const matches = Object.values(profiles).filter(p => p.enabled).map(p => classifyRoute(input, p)).filter((m): m is RouteMatch => m !== null);
    if (matches.length > 1) throw new Error(`AMBIGUOUS_PROFILE: ${matches.map(m => m.profileId).join(', ')}`);
    return matches[0] ?? null;
}

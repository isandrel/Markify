import type { AdapterConfig } from '../config';
import { getConfig } from '../config';
import type { ApiConversionContext, HttpFetcher, ThreadState } from '../types';
import { pageTitle } from './title';
export { pageTitle };
import type { SiteAdapter } from './base';
import { classifyRoute, classifyRegistryRoute } from './routes';
import { fetchForumApiContent, fetchForumThreadState } from './1point3acres';
import { fetchDiscourseRawContent, fetchDiscourseThreadState } from './uscardforum';
import { ConversionError } from '../errors';

type Engine = (id: string, fetcher: HttpFetcher, profile: AdapterConfig, context?: ApiConversionContext) => Promise<string>;

/** Adding a protocol changes this registry; adding a site only adds a profile. */
export const contentEngines: Record<AdapterConfig['engine'], Engine> = {
    'forum-json': (id, fetcher, profile, context) => fetchForumApiContent(id, fetcher, profile, context?.onProgress, context),
    'discourse-raw': fetchDiscourseRawContent,
};

/** One light request per thread: its reply count and last activity, without exporting it. */
export const stateEngines: Record<AdapterConfig['engine'], (id: string, fetcher: HttpFetcher, profile: AdapterConfig, context?: ApiConversionContext) => Promise<ThreadState>> = {
    'forum-json': fetchForumThreadState,
    'discourse-raw': fetchDiscourseThreadState,
};

export function fetchThreadState(id: string, fetcher: HttpFetcher, profile: AdapterConfig, context?: ApiConversionContext): Promise<ThreadState> {
    const engine = stateEngines[profile.engine];
    if (!engine) throw new ConversionError('CONFIG_INVALID', `Unknown engine: ${profile.engine}`);
    return engine(id, fetcher, profile, context);
}

export function createProfileAdapter(profile: AdapterConfig): SiteAdapter {
    return {
        id: profile.site.id, name: profile.site.name, config: profile,
        urlPatterns: profile.activation.matches,
        matchesUrl: url => classifyRoute(url, profile)?.kind === 'thread',
        hasApi: true, includesFrontmatter: profile.engine === 'forum-json',
        extractMetadata(doc, url) {
            const route = classifyRoute(url, profile);
            return { title: pageTitle(doc, profile), url, id: route?.id, tags: profile.metadata?.tags };
        },
        async fetchViaApi(url, fetcher, override, context) {
            const resolved = (override ?? profile) as AdapterConfig;
            const route = classifyRoute(url, resolved);
            if (route?.kind !== 'thread' || !route.id) throw new ConversionError('UNSUPPORTED_ROUTE', `Expected ${resolved.site.id} thread route`);
            const engine = contentEngines[resolved.engine];
            if (!engine) throw new ConversionError('CONFIG_INVALID', `Unknown engine: ${resolved.engine}`);
            return engine(route.id, fetcher, resolved, context);
        },
    };
}

export function getProfileAdapters(): SiteAdapter[] {
    return Object.values(getConfig().adapters).filter(p => p.enabled).map(createProfileAdapter);
}

export function findProfileAdapter(url: string): SiteAdapter | null {
    const profiles = getConfig().adapters;
    const route = classifyRegistryRoute(url, profiles);
    return route?.kind === 'thread' ? createProfileAdapter(profiles[route.profileId]) : null;
}

// Export types and utilities
export * from './base';

// Export adapters
export { mediumAdapter } from './medium';
export { substackAdapter } from './substack';
export { wikipediaAdapter } from './wikipedia';
export { githubAdapter } from './github';
export { redditAdapter } from './reddit';
export { devtoAdapter } from './devto';
export { usCardForumAdapter, fetchDiscourseRawContent, fetchDiscourseRawContent as fetchUSCardForumContent } from './uscardforum';
export { onePoint3AcresAdapter, fetchForumApiContent, fetchForumApiContent as fetch1Point3AcresContent } from './1point3acres';
export { defaultAdapter } from './default';

// Import for array export
import { mediumAdapter } from './medium';
import { substackAdapter } from './substack';
import { wikipediaAdapter } from './wikipedia';
import { githubAdapter } from './github';
import { redditAdapter } from './reddit';
import { devtoAdapter } from './devto';
import { defaultAdapter } from './default';
import type { SiteAdapter } from './base';
import { getProfileAdapters } from './engines';

/**
 * All built-in adapters (order matters — more specific first)
 * NOTE: Batch capabilities are in @markify/userscript (browser-only)
 */
export const builtInAdapters: SiteAdapter[] = [
    mediumAdapter,
    substackAdapter,
    wikipediaAdapter,
    githubAdapter,
    redditAdapter,
    devtoAdapter,
    defaultAdapter, // Always last as fallback
];

/** Resolved profile adapters are discovered without editing this registry. */
export function getBuiltInAdapters(): SiteAdapter[] {
    return [...getProfileAdapters(), ...builtInAdapters];
}

/**
 * Get adapter info for listing/display purposes
 */
export function listAdapters(): Array<{ name: string; patterns: string[]; hasApi: boolean }> {
    return getBuiltInAdapters()
        .filter(a => a.name !== 'Default')
        .map(a => ({
            name: a.name,
            patterns: a.urlPatterns.map(p => p instanceof RegExp ? p.source : p),
            hasApi: a.hasApi ?? false,
        }));
}

// Export types and utilities
export * from './base';

// Export adapters
export { mediumAdapter } from './medium';
export { substackAdapter } from './substack';
export { wikipediaAdapter } from './wikipedia';
export { githubAdapter } from './github';
export { redditAdapter } from './reddit';
export { devtoAdapter } from './devto';
export { usCardForumAdapter, fetchUSCardForumContent } from './uscardforum';
export { defaultAdapter } from './default';

// Import for array export
import { mediumAdapter } from './medium';
import { substackAdapter } from './substack';
import { wikipediaAdapter } from './wikipedia';
import { githubAdapter } from './github';
import { redditAdapter } from './reddit';
import { devtoAdapter } from './devto';
import { usCardForumAdapter } from './uscardforum';
import { defaultAdapter } from './default';
import type { SiteAdapter } from './base';

/**
 * All built-in adapters (order matters - more specific first)
 */
export const builtInAdapters: SiteAdapter[] = [
    mediumAdapter,
    substackAdapter,
    wikipediaAdapter,
    githubAdapter,
    redditAdapter,
    devtoAdapter,
    usCardForumAdapter,
    defaultAdapter, // Always last as fallback
];

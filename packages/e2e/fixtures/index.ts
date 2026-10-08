/**
 * Offline stand-ins for every remote host Markify talks to. The same handler
 * serves Playwright routes, GM.xmlHttpRequest and the CLI/MCP fetch preload, so
 * every surface sees identical pages and APIs and no test touches the network.
 */
import type { FakeResponse, FakeSite } from './types';
import { onePoint3Acres } from './sites/1point3acres';
import { usCardForum } from './sites/uscardforum';
import { genericWeb } from './sites/generic';

export const sites: FakeSite[] = [onePoint3Acres, usCardForum, genericWeb];

/** Returns null for hosts outside the fake internet so callers can fail loudly. */
export function respond(input: string): FakeResponse | null {
    const url = new URL(input);
    const site = sites.find(candidate => candidate.origins.some(origin => origin.endsWith('/') ? url.href.startsWith(origin) : url.origin === origin));
    return site ? site.respond(url) : null;
}

export * from './types';
export * from './sites/1point3acres';
export * from './sites/uscardforum';
export * from './sites/generic';

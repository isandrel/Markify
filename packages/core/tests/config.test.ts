import { describe, expect, test } from 'bun:test';
import { loadConfigFromDisk } from '../src/config/disk';
import { applyUserOverrides, classifyRegistryRoute, classifyRoute, getAdapterConfig, migrateLegacyOverrides, normalizeProfile, parseUserOverrides, profileMetadata, resetSiteOverrides, resolveProfile, resolveProfiles, setConfig } from '../src/config';
import { hasSiteApi } from '../src/reader';

const profiles = loadConfigFromDisk().adapters;
const acres = profiles['1point3acres'];
const uscf = profiles.uscardforum;
const copy = () => structuredClone(acres);

describe('configured routes', () => {
    test.each([
        ['/home/discover/38', 'discover', '38'], ['/home/forum/38/?page=2', 'forum', '38'],
        ['/home/tag/jobs', 'tag', 'jobs'], ['/home/thread/1184303?source=feed', 'thread', '1184303'],
        ['/home/pins/123/', 'pins', '123'], ['/bbs/thread-123-1-1.html', 'bbs-thread', '123'],
    ])('%s', (path, name, id) => {
        expect(classifyRoute(`https://www.1point3acres.com${path}`, acres)).toMatchObject({ name, id });
    });
    test('instant origin and no host/credentials/path confusion', () => {
        expect(classifyRoute('https://instant.1point3acres.com/thread/123', acres)?.id).toBe('123');
        for (const url of ['https://www.1point3acres.com.evil.test/home/thread/123', 'https://instant.1point3acres.com/home/thread/123', 'http://www.1point3acres.com/home/thread/123', 'https://u:p@www.1point3acres.com/home/thread/123', 'not a URL']) expect(classifyRoute(url, acres)).toBeNull();
    });
    test('discourse thread forms and all listing categories', () => {
        for (const path of ['/t/hello/123', '/t/123', '/t/hello/123/4']) expect(classifyRoute(`https://www.uscardforum.com${path}`, uscf)?.id).toBe('123');
        for (const [path, name] of [['/c/credit-cards/10', 'category'], ['/tag/cards', 'tag'], ['/tags/cards', 'tag'], ['/search?q=card', 'search']]) expect(classifyRoute(`https://www.uscardforum.com${path}`, uscf)?.name).toBe(name);
    });
    test('query state is deterministic with omission and explicit keys', () => {
        const base = 'https://www.1point3acres.com/home/discover/38';
        expect(classifyRoute(base+'?page=2&utm_source=x', acres)?.key).toBe(classifyRoute(base+'?utm_source=y&page=2', acres)?.key);
        expect(classifyRoute(base+'?page=2', acres)?.key).not.toBe(classifyRoute(base+'?page=1', acres)?.key);
        const custom = copy(); delete custom.routes[0].query_keys;
        expect(classifyRoute(base+'?custom=1', normalizeProfile(custom))?.key).not.toBe(classifyRoute(base+'?custom=2', normalizeProfile(custom))?.key);
        custom.routes[0].query_keys = [];
        expect(classifyRoute(base+'?custom=1', normalizeProfile(custom))?.key).toBe(classifyRoute(base+'?custom=2', normalizeProfile(custom))?.key);
    });
    test('ambiguous rules fail instead of selecting first', () => {
        const custom = copy(); custom.routes.push({ ...custom.routes[0], name: 'duplicate' });
        expect(() => classifyRoute('https://www.1point3acres.com/home/discover/38', normalizeProfile(custom))).toThrow('AMBIGUOUS_ROUTE');
    });
});

describe('profile contracts', () => {
    test('TOML delimiter, API config, aliases and metadata derive from one registry', () => {
        expect(acres.delimiter).toBe('---'); expect(uscf.page_separator).toBe('\n\n---\n\n');
        expect(acres.api.response?.posts_field).toBe('posts');
        setConfig({ adapters: profiles });
        expect(getAdapterConfig('USCardForum')?.site.id).toBe('uscardforum');
        expect(getAdapterConfig('1Point3Acres')?.site.id).toBe('1point3acres');
        expect(profileMetadata(profiles).matches).toContain('https://www.1point3acres.com/home/*');
        expect(profileMetadata(profiles).connect).toContain('api.1point3acres.com');
    });
    test('site API capability is limited to configured thread routes', () => {
        setConfig({ adapters: profiles });
        expect(hasSiteApi('https://www.1point3acres.com/home/discover/38')).toBe(false);
        expect(hasSiteApi('https://www.1point3acres.com/home/thread/1184303')).toBe(true);
        expect(hasSiteApi('https://www.uscardforum.com/c/credit-cards')).toBe(false);
        expect(hasSiteApi('https://www.uscardforum.com/t/example/123')).toBe(true);
    });
    test('all profile and nested objects are frozen', () => {
        expect(Object.isFrozen(acres)).toBe(true); expect(Object.isFrozen(acres.filename)).toBe(true); expect(Object.isFrozen(acres.batch.layouts)).toBe(true);
    });
    test('invalid schema, engine, regex, endpoint, aliases and placeholder errors identify fields', () => {
        for (const [field, edit] of [
            ['schema_version', (p: any) => p.schema_version = 2], ['engine', (p: any) => p.engine = 'unknown'],
            ['routes.0.pattern', (p: any) => p.routes[0].pattern = '['], ['filename.single', (p: any) => p.filename.single = '{typo}'],
            ['api.thread_endpoint', (p: any) => p.api.thread_endpoint = 'http://example.com/{thread_id}'],
            ['runtime.timeout_ms', (p: any) => p.runtime.timeout_ms = 0], ['<root>', (p: any) => p.unknown = true],
            ['api.response.posts_field', (p: any) => delete p.api.response.posts_field],
        ] as const) { const p = copy(); edit(p); expect(() => normalizeProfile(p, 'test.toml')).toThrow(field); }
        const duplicate = structuredClone(uscf); duplicate.site.aliases.push('1Point3Acres');
        expect(() => resolveProfiles({ a: acres, b: duplicate })).toThrow('Alias collision');
    });
    test('synthetic third site needs only a profile and fixture URLs', () => {
        const third = structuredClone(uscf);
        third.site = { id: 'third-forum', name: 'Third Forum', base_url: 'https://forum.example.com', origins: ['https://forum.example.com'], aliases: [] };
        third.activation.matches = ['https://forum.example.com/*'];
        third.batch.layouts[0].row_selector = '.new-topic-row';
        const registry = resolveProfiles({ ...profiles, third });
        expect(classifyRegistryRoute('https://forum.example.com/t/welcome/42', registry)).toMatchObject({ profileId: 'third-forum', id: '42' });
        expect(registry['third-forum'].batch.layouts[0].row_selector).toBe('.new-topic-row');
        expect(profileMetadata(registry).matches).toContain('https://forum.example.com/*');
    });
});

describe('overrides and migration', () => {
    test('global -> site -> invocation, immutable prior snapshots, site reset', () => {
        const input = { schema_version: 1, global: { filename: { single: 'global-{title}' }, runtime: { timeout_ms: 5000 } }, sites: { '1point3acres': { filename: { single: 'site-{title}' } } } };
        const first = applyUserOverrides(profiles, input);
        const second = applyUserOverrides(profiles, input, { filename: { single: 'invocation-{title}' } });
        expect(first['1point3acres'].filename.single).toBe('site-{title}');
        expect(second['1point3acres'].filename.single).toBe('invocation-{title}');
        expect(first.uscardforum.filename.single).toBe('global-{title}');
        expect(acres.filename.single).toBe('{title}');
        expect(applyUserOverrides(profiles, resetSiteOverrides(input, '1point3acres'))['1point3acres'].filename.single).toBe('global-{title}');
        expect(first['1point3acres'].runtime.timeout_ms).toBe(5000);
        // Overriding one runtime value keeps the profile's others and stores only that value.
        const custom = resolveProfile({ ...acres, runtime: { ...acres.runtime, poll_ms: 1500 } }, [{ runtime: { timeout_ms: 7000 } }]);
        expect(custom.runtime).toMatchObject({ poll_ms: 1500, timeout_ms: 7000 });
        expect(parseUserOverrides({ schema_version: 1, global: { runtime: { timeout_ms: 7000 } } }).global).toEqual({ runtime: { timeout_ms: 7000 } });
        expect(resolveProfile(acres, [{ comment: { template: '{author}: {content}' } }]).comment?.template).toBe('{author}: {content}');
    });
    test('unknown key, unknown site, null, invalid field and endpoint overrides fail', () => {
        for (const global of [{ typo: true }, { filename: { single: null } }, { runtime: { timeout_ms: 999999 } }, { api: { raw_endpoint: 'https://evil.test' } }]) expect(() => parseUserOverrides({ schema_version: 1, global })).toThrow();
        expect(() => applyUserOverrides(profiles, { schema_version: 1, sites: { nonexistent: {} } })).toThrow('Unknown stable site ID');
    });
    test('migration preserves old effective batch-item filenames and is idempotent', () => {
        const legacy = { filename: { single: '[{id}] {title}', batch_item: '{index}-{title}', batch: '{site}-{date}' } };
        const first = migrateLegacyOverrides(legacy);
        expect(first.backup).toEqual(legacy); expect(first.warnings.length).toBe(1);
        expect(first.overrides.global.filename?.batch_item).toBe('[{id}] {title}');
        const next = migrateLegacyOverrides({ filename: { single: 'changed' } }, first.overrides);
        expect(next.overrides).toEqual(first.overrides); expect(next.backup).toBeUndefined();
    });
    test('invalid legacy config is backed up without blocking validated defaults', () => {
        const invalid = { filename: { single: '{typo}' } };
        const migrated = migrateLegacyOverrides(invalid);
        expect(migrated.backup).toEqual(invalid); expect(migrated.warnings[0]).toContain('failed validation');
        expect(migrated.overrides.global).toEqual({});
    });
});

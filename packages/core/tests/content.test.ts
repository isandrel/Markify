import { beforeEach, describe, expect, test } from 'bun:test';
import { applyFilenameTemplate, convert, ConversionError, createProfileAdapter, setConfig } from '../src';
import { loadConfigFromDisk } from '../src/config/disk';
import { normalizeProfile, resolveProfiles } from '../src/config';
import { fetchForumApiContent } from '../src/adapters/1point3acres';
import type { HttpFetcher } from '../src/types';

const profiles = loadConfigFromDisk().adapters;
const acres = profiles['1point3acres'];
beforeEach(() => setConfig({ adapters: profiles }));

function thread(replies = 1) {
    return {
        errno: 0,
        thread: {
            subject: 'Title: "quoted"', author: 'Alice', message_bbcode: '[b]bold[/b] and [i]italic[/i]',
            dateline: 1, lastpost: 2, views: 3, replies, favtimes: 0,
        },
    };
}

function fetcher(overrides: { postsStatus?: number; posts?: unknown[] } = {}): HttpFetcher {
    return { get: async url => url.includes('nested-posts')
        ? { status: overrides.postsStatus ?? 200, ok: (overrides.postsStatus ?? 200) < 300,
            text: JSON.stringify({ errno: 0, posts: overrides.posts ?? [{ pid: 8, author: 'Bob', message_bbcode: '[b]reply[/b]', dateline: 3 }] }) }
        : { status: 200, ok: true, text: JSON.stringify(thread()) } };
}

describe('forum JSON content engine', () => {
    test('emits Markdown, valid escaped frontmatter, comments, and metadata', async () => {
        let metadata: Record<string, unknown> = {};
        const result = await fetchForumApiContent('123', fetcher(), acres, undefined, {
            onMetadata: value => { metadata = value; },
        });
        expect(result).toContain('**bold** and *italic*');
        expect(result).toContain('**reply**');
        expect(result).not.toContain('<span');
        expect(result).toContain('title: "Title: \\"quoted\\""');
        expect(metadata).toMatchObject({ title: 'Title: "quoted"', id: '123', commentsExported: 1, commentsPages: 1 });
    });

    test('comment HTTP failure is explicit and cannot return a partial document', async () => {
        await expect(fetchForumApiContent('123', fetcher({ postsStatus: 500 }), acres)).rejects.toMatchObject({ code: 'HTTP_ERROR' });
    });

    test('repeated full pages and page-limit exhaustion fail explicitly', async () => {
        const profile = structuredClone(acres);
        profile.api.max_pages = 1;
        profile.api.page_size = 1;
        await expect(fetchForumApiContent('123', fetcher(), normalizeProfile(profile))).rejects.toMatchObject({ code: 'PAGE_LIMIT' });
    });

    test('abort is preserved as a typed failure', async () => {
        await expect(fetchForumApiContent('123', fetcher(), acres, undefined, { signal: AbortSignal.abort() }))
            .rejects.toEqual(expect.objectContaining<Partial<ConversionError>>({ code: 'ABORTED' }));
    });
});

describe('profile extension and filenames', () => {
    test('a synthetic site on an existing engine converts without registry edits', async () => {
        const third = structuredClone(profiles.uscardforum);
        third.site = { id: 'third-forum', name: 'Third Forum', base_url: 'https://forum.example.com', origins: ['https://forum.example.com'], aliases: [] };
        third.activation = { matches: ['https://forum.example.com/*'], connect: ['self'] };
        third.api.max_pages = 2;
        const registry = resolveProfiles({ existing: profiles['1point3acres'], uscf: profiles.uscardforum, third });
        setConfig({ adapters: registry });
        expect(createProfileAdapter(registry['third-forum']).id).toBe('third-forum');
        let page = 0;
        const result = await convert({
            url: 'https://forum.example.com/t/welcome/42',
            metadataSnapshot: { title: 'Welcome', url: 'https://forum.example.com/t/welcome/42', date: '2026-01-01' },
            fetcher: { get: async () => ({ status: 200, ok: true, text: page++ === 0 ? '# Body' : '' }) },
            strategy: 'api-only',
        });
        expect(result.adapter).toBe('Third Forum');
        expect(result.markdown).toContain('# Body');
        expect(result.filename).toBe('Welcome');
    });

    test('filename templates support index and preserve literal replacement tokens', () => {
        expect(applyFilenameTemplate('{index} - [{id}] {title}', { index: '001', id: '4', title: '$& {id}' }))
            .toBe('001 - [4] $& {id}');
    });
});

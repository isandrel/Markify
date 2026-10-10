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
            // No topic JSON: metadata is best effort, the raw pages still export.
            fetcher: { get: async (url: string) => (url.includes('/raw/') ? { status: 200, ok: true, text: page++ === 0 ? '# Body' : '' } : { status: 404, ok: false, text: '' }) },
            strategy: 'api-only',
        });
        expect(result.adapter).toBe('Third Forum');
        expect(result.markdown).toContain('# Body');
        expect(result.filename).toBe('Welcome');
    });

    test('Discourse topic JSON fills title, author, date, topic tags and counts', async () => {
        setConfig({ adapters: profiles });
        let page = 0;
        const topic = { title: 'He said "hi": a #test', created_at: '2026-02-01T08:00:00.000Z', views: 120, posts_count: 4, like_count: 9,
            tags: ['docker', { id: 3, name: 'dns', slug: 'dns' }], details: { created_by: { username: 'neo' } } };
        const result = await convert({
            url: 'https://linux.do/t/topic/7',
            fetcher: { get: async (url: string) => (url.endsWith('/t/7.json')
                ? { status: 200, ok: true, text: JSON.stringify(topic) }
                : { status: 200, ok: true, text: page++ === 0 ? 'neo | 2026-02-01 | #1\n\nhi' : '' }) },
            strategy: 'api-only',
        });
        // Quotes, colons and # are escaped, so the YAML stays valid.
        expect(result.markdown).toContain('title: "He said \\"hi\\": a #test"\nsource: https://linux.do/t/topic/7\ndate: 2026-02-01T08:00:00.000Z\n');
        expect(result.markdown).toContain('author: "neo"\ntags:\n  - linuxdo\n  - forum\n  - docker\n  - dns\n');
        expect(result.markdown).toMatch(/\nviews: 120\n(?:.*\n)*replies: 3\nlikes: 9\n/);
        expect(result.filename).toBe('He said -hi- a #test');
    });

    test('filename templates support index and preserve literal replacement tokens', () => {
        expect(applyFilenameTemplate('{index} - [{id}] {title}', { index: '001', id: '4', title: '$& {id}' }))
            .toBe('001 - [4] $& {id}');
    });
});

describe('BBCode bodies', () => {
    test('keep line breaks and paragraphs, fence code, and map strike/list/quote', async () => {
        const { bodyToMarkdown } = await import('../src/markdown');
        expect(bodyToMarkdown('line 1\r\nline 2\n\npara [s]old[/s] [b][i]both[/i][/b]', 'bbcode')).toBe('line 1  \nline 2  \n  \npara ~~old~~ ***both***');
        expect(bodyToMarkdown('[code]a < b\n  c[/code]', 'bbcode')).toBe('```\na < b\n  c\n```');
        expect(bodyToMarkdown('[list]\n[*]one\n[*]two\n[/list]\nafter', 'bbcode')).toBe('*   one\n*   two\n\nafter');
        expect(bodyToMarkdown('[quote]q1\nq2[/quote]\nafter', 'bbcode')).toBe('> q1  \n> q2\n\nafter');
        // HTML bodies are unaffected: their newlines are insignificant whitespace.
        expect(bodyToMarkdown('<p>a\nb</p>', 'html')).toBe('a b');
    });

    test('attachments become images or links, and [email] becomes a mailto link', async () => {
        const { bodyToMarkdown } = await import('../src/markdown');
        const files = new Map([
            ['626734', { url: 'https://oss.example/a.png', image: true }],
            ['7', { url: 'https://oss.example/r.pdf', name: 'resume [v2].pdf', image: false }],
        ]);
        expect(bodyToMarkdown('see [attach]626734[/attach] and [attach]7[/attach]', 'bbcode', files))
            .toBe('see ![](https://oss.example/a.png) and [resume v2.pdf](https://oss.example/r.pdf)');
        // Unknown or unmapped attachments are named, not left as a bare number.
        expect(bodyToMarkdown('[attach]99[/attach]', 'bbcode', files)).toBe('*attachment 99*');
        expect(bodyToMarkdown('[attach]99[/attach]', 'bbcode')).toBe('*attachment 99*');
        expect(bodyToMarkdown('[email]ho@example.com[/email] or [email=hr@example.com]HR[/email]', 'bbcode'))
            .toBe('[ho@example.com](mailto:ho@example.com) or [HR](mailto:hr@example.com)');
    });
});

describe('nested replies (楼中楼)', () => {
    const top = (pid: number, replies?: { count: number; data: unknown[] }) => ({ pid, author: `top${pid}`, message_bbcode: `post ${pid}`, dateline: pid, ...(replies ? { replies } : {}) });
    const child = (pid: number) => ({ pid, author: `child${pid}`, message_bbcode: `reply ${pid}\nsecond line`, dateline: pid });

    function nestedFetcher(nested: (url: string) => { status: number; body: unknown }): HttpFetcher {
        return { get: async url => {
            if (url.includes('/api/posts/')) { const r = nested(url); return { status: r.status, ok: r.status < 300, text: JSON.stringify(r.body) }; }
            if (url.includes('nested-posts')) return { status: 200, ok: true, text: JSON.stringify({ errno: 0, posts: [top(10, { count: 3, data: [child(11), child(12)] }), top(20)] }) };
            return { status: 200, ok: true, text: JSON.stringify(thread(5)) };
        } };
    }

    test('fetches replies beyond the preview and renders them quoted under their post', async () => {
        let metadata: Record<string, unknown> = {};
        const result = await fetchForumApiContent('123', nestedFetcher(() => ({ status: 200, body: { errno: 0, posts: [child(11), child(12), child(13)] } })), acres, undefined, {
            onMetadata: value => { metadata = value; },
        });
        expect(result).toContain('## Comments (5)');
        expect(result.indexOf('post 10')).toBeLessThan(result.indexOf('reply 11'));
        expect(result.indexOf('reply 13')).toBeLessThan(result.indexOf('post 20'));
        expect(result).toContain('> **child11**');
        expect(result).toContain('> reply 11  \n> second line');
        expect(result).not.toContain('more replies are not included');
        expect(metadata).toMatchObject({ commentsExported: 5, commentsMissing: 0 });
    });

    test('a login-only remainder is noted visibly instead of dropped or failing the export', async () => {
        let metadata: Record<string, unknown> = {};
        let asked = 0;
        const result = await fetchForumApiContent('123', nestedFetcher(() => { asked++; return { status: 401, body: { errno: -1, msg: '请先登录' } }; }), acres, undefined, {
            onMetadata: value => { metadata = value; },
        });
        expect(result).toContain('## Comments (4)');
        expect(result).toContain('> *1 more replies are not included (login required).*');
        expect(metadata).toMatchObject({ commentsExported: 4, commentsMissing: 1 });
        expect(asked).toBe(1);
    });

    test('after a login refusal, later posts are noted without asking again', async () => {
        let asked = 0;
        const fetcher: HttpFetcher = { get: async url => {
            if (url.includes('/api/posts/')) { asked++; return { status: 401, ok: false, text: '{"errno":-1,"msg":"请先登录"}' }; }
            if (url.includes('nested-posts')) return { status: 200, ok: true, text: JSON.stringify({ errno: 0, posts: [top(10, { count: 3, data: [child(11)] }), top(20, { count: 5, data: [] })] }) };
            return { status: 200, ok: true, text: JSON.stringify(thread(10)) };
        } };
        const result = await fetchForumApiContent('123', fetcher, acres);
        expect(asked).toBe(1);
        expect(result).toContain('> *2 more replies are not included (login required).*');
        expect(result).toContain('> *5 more replies are not included (login required).*');
    });

    test('cancellation while fetching replies still aborts the export', async () => {
        const controller = new AbortController();
        const fetcher = nestedFetcher(() => { controller.abort(); return { status: 200, body: { errno: 0, posts: [] } }; });
        await expect(fetchForumApiContent('123', fetcher, acres, undefined, { signal: controller.signal })).rejects.toMatchObject({ code: 'ABORTED' });
    });
});

describe('page titles', () => {
    test('title element first, then document.title without the site suffix', async () => {
        const { pageTitle } = await import('../src/adapters/title');
        const profile = profiles.uscardforum;
        const doc = (title: string, body = '') => ({ title, querySelector: (selector: string) => selector === '#topic-title .fancy-title' && body ? { textContent: body } : null }) as any;
        expect(pageTitle(doc('Amex offer - 信用卡 - 美国信用卡指南', '  Amex\n offer '), profile)).toBe('Amex offer');
        expect(pageTitle(doc('Amex offer - 美国信用卡指南'), profile)).toBe('Amex offer');
        expect(pageTitle(doc('Topic - 开发调优 - LINUX DO', '[开源] Topic'), profiles.linuxdo)).toBe('[开源] Topic');
    });
});

describe('Discourse raw Markdown', () => {
    test('uploads, quotes, details, spoilers and polls become portable Markdown; code is untouched', async () => {
        const { discourseToMarkdown } = await import('../src/adapters/discourse-markdown');
        const base = 'https://linux.do';
        expect(discourseToMarkdown('![shot|690x388](upload://aBc123.png) [log.txt|attachment](upload://xYz.txt) (123 KB)', base))
            .toBe('![shot|690x388](https://linux.do/uploads/short-url/aBc123.png) [log.txt](https://linux.do/uploads/short-url/xYz.txt) (123 KB)');
        expect(discourseToMarkdown('before\n[quote="neo, post:3, topic:42"]\nouter\n[quote="trinity, post:1, topic:42, full:true"]\ninner $&\n[/quote]\n[/quote]\nafter', base))
            .toBe('before\n\n> **neo** [#3](https://linux.do/t/42/3):\n>\n> outer\n>\n> > **trinity** [#1](https://linux.do/t/42/1):\n> >\n> > inner $&\n\nafter');
        expect(discourseToMarkdown('[quote]\nanon\n[/quote]', base)).toBe('\n> anon\n');
        expect(discourseToMarkdown('[details="配置"]\nline 1\nline 2\n[/details]', base))
            .toBe('<details>\n<summary>配置</summary>\n\nline 1\nline 2\n\n</details>');
        expect(discourseToMarkdown('答案是 [spoiler]42[/spoiler]。\n[spoiler]\nblock\n[/spoiler]', base))
            .toBe('答案是 42。\n<details>\n<summary>Spoiler</summary>\n\nblock\n\n</details>');
        expect(discourseToMarkdown('[poll type=regular results=always]\n* A\n* B\n[/poll]', base)).toBe('**Poll:**\n\n* A\n* B');
        // Code shows the syntax literally.
        const code = '```\n[quote="x"]\n![a](upload://k.png)\n```\nand `[details]` inline';
        expect(discourseToMarkdown(code, base)).toBe(code);
    });
});

describe('Discourse raw Markdown around code', () => {
    test('details and quotes may wrap fenced code', async () => {
        const { discourseToMarkdown } = await import('../src/adapters/discourse-markdown');
        expect(discourseToMarkdown('[details="compose"]\n```yaml\na: [quote]\n```\n[/details]', 'https://linux.do'))
            .toBe('<details>\n<summary>compose</summary>\n\n```yaml\na: [quote]\n```\n\n</details>');
        expect(discourseToMarkdown('[quote="neo"]\nsee:\n```\nline 1\nline 2\n```\n[/quote]', 'https://linux.do'))
            .toBe('\n> **neo**:\n>\n> see:\n> ```\n> line 1\n> line 2\n> ```\n');
    });
});

describe('thread state checks', () => {
    test('one light request per engine: reply count and last activity', async () => {
        const { fetchThreadState } = await import('../src/adapters/engines');
        const calls: string[] = [];
        const discourse = await fetchThreadState('7', { get: async (url: string) => { calls.push(url); return { status: 200, ok: true, text: JSON.stringify({ posts_count: 5, last_posted_at: '2026-03-01T00:00:00.000Z' }) }; } }, profiles.linuxdo);
        expect(discourse).toEqual({ replies: 4, updated: '2026-03-01T00:00:00.000Z' });
        const forum = await fetchThreadState('9', { get: async (url: string) => { calls.push(url); return { status: 200, ok: true, text: JSON.stringify({ errno: 0, thread: { replies: 12, lastpost: 1767229200 } }) }; } }, profiles['1point3acres']);
        expect(forum).toEqual({ replies: 12, updated: '2026-01-01T01:00:00.000Z' });
        expect(calls).toEqual(['https://linux.do/t/7.json', 'https://api.1point3acres.com/api/v3/home-threads/9']);
        await expect(fetchThreadState('8', { get: async () => ({ status: 404, ok: false, text: '' }) }, profiles.linuxdo)).rejects.toMatchObject({ code: 'HTTP_ERROR' });
    });
});

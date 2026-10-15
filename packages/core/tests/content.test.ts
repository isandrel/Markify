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

describe('V2EX', () => {
    const v2ex = () => profiles.v2ex;
    const topic = { id: 42, title: 'Title "quoted"', replies: 3, created: 1767225600, last_touched: 1767229200, member: { username: 'livid' }, node: { title: '问与答' },
        content_rendered: '<p>Hello <a href="/member/alice">alice</a></p>\n<pre><code>x = 1</code></pre>' };
    // The replies API lags: it misses the newest reply.
    const apiReplies = [
        { id: 2, created: 1767225720, member: { username: 'bob' }, content_rendered: 'second' },
        { id: 1, created: 1767225660, member: { username: 'alice' }, content_rendered: 'first' },
    ];
    const reply = (floor: number, author: string, body: string, stamp = '2026-01-01 08:0' + floor + ':00 +08:00') => `<div id="r_${floor}00" class="cell"><table><tr><td><img class="avatar" alt="${author}" /></td>`
        + `<td><div class="fr"> &nbsp; <span class="no">${floor}</span></div><div class="sep3"></div><strong><a href="/member/${author}" class="dark">${author}</a></strong> &nbsp; <div class="badges"></div>`
        + `<span class="ago" title="${stamp}">1 天前</span><div class="sep5"></div><div class="reply_content">${body}</div></td></tr></table></div>`;
    const pages: Record<string, string> = {
        1: `<div class="topic_content"><div class="markdown_body"><p>body</p></div></div>
        <div class="subtle"><span class="fade">第 1 条附言 &nbsp;·&nbsp; <span title="2026-01-01 10:00:00 +08:00">1 天前</span></span>
        <div class="sep5"></div><div class="topic_content"><div class="markdown_body"><p>Update: <b>fixed</b></p><div>nested</div></div></div></div>
        <div class="box"><div class="cell"><a href="/tag/%E6%B5%8B%E8%AF%95" class="tag"><li class="fa fa-tag"></li> 测试</a><a href="/tag/node" class="tag">node</a></div>
        <input type="number" class="page_input" autocomplete="off" value="1" min="1" max="2" />
        ${reply(1, 'alice', '<a target="_blank" href="https://i.imgur.com/a.png" rel="nofollow noopener"><img src="https://i.imgur.com/a.png" class="embedded_image" /></a>')}
        ${reply(2, 'bob', '@<a href="/member/alice">alice</a> second<br /><br />line')}</div>`,
        2: `<input type="number" class="page_input" value="2" min="1" max="2" />${reply(3, 'carol', 'third')}`,
    };
    const site = (overrides: { topic?: unknown; status?: Record<string, number>; pages?: Record<string, string>; replies?: unknown } = {}): HttpFetcher & { calls: string[] } => {
        const calls: string[] = [];
        return { calls, get: async url => {
            calls.push(url);
            if (url.includes('/api/topics/show.json')) return { status: 200, ok: true, text: JSON.stringify(overrides.topic ?? [topic]) };
            if (url.includes('/api/replies/show.json')) return { status: 200, ok: true, text: JSON.stringify(overrides.replies ?? apiReplies) };
            const page = new URL(url).searchParams.get('p') ?? '1';
            const status = overrides.status?.[page] ?? 200;
            return { status, ok: status < 300, text: (overrides.pages ?? pages)[page] ?? '' };
        } };
    };

    test('topic from the API; supplements, tags and every reply from the pages, with absolute links', async () => {
        const { fetchV2exContent } = await import('../src/adapters/v2ex');
        const fetcher = site();
        let metadata: Record<string, unknown> = {};
        const markdown = await fetchV2exContent('42', fetcher, v2ex(), { onMetadata: value => { metadata = value; } });
        expect(fetcher.calls).toEqual(['https://www.v2ex.com/api/topics/show.json?id=42', 'https://www.v2ex.com/t/42?p=1', 'https://www.v2ex.com/t/42?p=2']);
        expect(markdown).toBe([
            'Hello [alice](https://www.v2ex.com/member/alice)', '```\nx = 1\n```',
            '### Supplement 1 · *2026-01-01T02:00:00.000Z*', 'Update: **fixed**\n\nnested',
            '---', '## Replies (3)',
            '**#1 alice** · *2026-01-01T00:01:00.000Z*', '![](https://i.imgur.com/a.png)',
            '**#2 bob** · *2026-01-01T00:02:00.000Z*', '@[alice](https://www.v2ex.com/member/alice) second  \n\nline',
            '**#3 carol** · *2026-01-01T00:03:00.000Z*', 'third',
        ].join('\n\n') + '\n');
        expect(metadata).toEqual({ title: 'Title "quoted"', author: 'livid', date: '2026-01-01T00:00:00.000Z', updated: '2026-01-01T01:00:00.000Z', replies: 3, tags: ['v2ex', 'forum', '问与答', '测试', 'node'] });
    });

    test('without the pages, replies come from the API and the export says what is missing', async () => {
        const { fetchV2exContent } = await import('../src/adapters/v2ex');
        const unreachable = site({ status: { 1: 503 } });
        const markdown = await fetchV2exContent('42', unreachable, v2ex());
        expect(unreachable.calls.at(-1)).toBe('https://www.v2ex.com/api/replies/show.json?topic_id=42');
        expect(markdown).toContain('> *The topic page could not be loaded (HTTP 503 during page): supplements are missing, and replies come from the API, which can lag behind the site.*');
        expect(markdown).toContain('## Replies (2)\n\n**#1 alice** · *2026-01-01T00:01:00.000Z*\n\nfirst\n\n**#2 bob**');
        // A page layout without recognisable replies: the same fallback, said differently.
        const changed = await fetchV2exContent('42', site({ pages: { 1: '<div id="Main">new layout</div>' } }), v2ex());
        expect(changed).toContain('> *No replies were found on the topic page; they come from the API, which can lag behind the site.*');
        expect(changed).toContain('**#2 bob**');
        // A later page failing fails the export: the list would look complete.
        await expect(fetchV2exContent('42', site({ status: { 2: 500 } }), v2ex())).rejects.toMatchObject({ code: 'HTTP_ERROR' });
    });

    test('API errors; a topic without replies needs only its first page', async () => {
        const { fetchV2exContent } = await import('../src/adapters/v2ex');
        await expect(fetchV2exContent('43', site({ topic: [] }), v2ex())).rejects.toMatchObject({ code: 'API_REJECTED', message: 'Topic not found, or it needs a login to view' });
        await expect(fetchV2exContent('42', site({ topic: { message: 'Rate Limit Exceeded' } }), v2ex())).rejects.toMatchObject({ code: 'API_REJECTED', message: 'Rate Limit Exceeded' });
        const quiet = site({ topic: [{ ...topic, replies: 0 }], pages: { 1: '<div class="topic_content">body</div>' } });
        expect(await fetchV2exContent('42', quiet, v2ex())).not.toContain('## Replies');
        expect(quiet.calls).toEqual(['https://www.v2ex.com/api/topics/show.json?id=42', 'https://www.v2ex.com/t/42?p=1']);
    });

    test('routes on both hosts; state from the topic endpoint', async () => {
        const { classifyRoute } = await import('../src/adapters/routes');
        const { fetchThreadState } = await import('../src/adapters/engines');
        for (const url of ['https://www.v2ex.com/t/42', 'https://v2ex.com/t/42#reply3', 'https://www.v2ex.com/t/42?p=2']) expect(classifyRoute(url, v2ex())).toMatchObject({ kind: 'thread', id: '42' });
        for (const [path, name] of [['/go/qna', 'node'], ['/tag/claude', 'tag'], ['/recent?p=2', 'recent'], ['/member/livid/topics', 'member'], ['/?tab=tech', 'home']]) expect(classifyRoute(`https://www.v2ex.com${path}`, v2ex())?.name).toBe(name);
        expect(await fetchThreadState('42', site(), v2ex())).toEqual({ replies: 3, updated: '2026-01-01T01:00:00.000Z' });
    });
});

describe('Reddit', () => {
    const reddit = (maxPages = 20) => {
        const profile = structuredClone(profiles.reddit) as any;
        profile.api.page_delay = { min_ms: 0, max_ms: 0, jitter: 0 };
        profile.api.max_pages = maxPages;
        return profile;
    };
    const listing = (children: unknown[]) => ({ kind: 'Listing', data: { children } });
    const comment = (id: string, parent: string, extra: Record<string, unknown> = {}) => ({ kind: 't1', data: { id, author: `a${id}`, body: `body ${id}`, score: 1, created_utc: 1767225600, parent_id: parent, replies: '', ...extra } });
    const ids = Array.from({ length: 150 }, (_, index) => `m${index}`);
    const thread = [
        listing([{ kind: 't3', data: { id: 'p1', title: 'Post', author: 'op', subreddit: 'test', created_utc: 1767225600, score: 5, num_comments: 153, is_self: true, selftext: 'Hi' } }]),
        listing([
            comment('c1', 't3_p1', { replies: listing([{ kind: 'more', data: { count: 0, id: '_', parent_id: 't1_c1', children: [] } }]) }),
            { kind: 'more', data: { count: 150, parent_id: 't3_p1', children: ids } },
        ]),
    ];
    const site = (status: Record<string, number> = {}): HttpFetcher & { calls: string[] } => {
        const calls: string[] = [];
        return { calls, get: async url => {
            calls.push(url);
            const path = new URL(url).pathname;
            const code = status[path] ?? 200;
            if (code !== 200) return { status: code, ok: false, text: JSON.stringify({ reason: 'quarantined', error: code }) };
            if (path === '/comments/p1.json') return { status: 200, ok: true, text: JSON.stringify(thread) };
            if (path === '/by_id/t3_p1.json') return { status: 200, ok: true, text: JSON.stringify(thread[0]) };
            if (path === '/comments/p1/_/c1.json') return { status: 200, ok: true, text: JSON.stringify([thread[0], listing([comment('c1', 't3_p1', { replies: listing([comment('d1', 't1_c1')]) })])]) };
            const asked = (new URL(url).searchParams.get('children') ?? '').split(',');
            return { status: 200, ok: true, text: JSON.stringify({ json: { errors: [], data: { things: asked.map(id => comment(id, 't3_p1')) } } }) };
        } };
    };

    test('held-back comments in batches of 100, then "continue this thread", within the request budget', async () => {
        const { fetchRedditContent } = await import('../src/adapters/reddit');
        const all = site();
        const markdown = await fetchRedditContent('p1', all, reddit());
        // Top-level gaps first: 100 ids, the other 50, then the deeper thread.
        expect(all.calls.map(url => new URL(url).pathname)).toEqual(['/comments/p1.json', '/api/morechildren.json', '/api/morechildren.json', '/comments/p1/_/c1.json']);
        expect(new URL(all.calls[1]).searchParams.get('children')!.split(',')).toHaveLength(100);
        expect(markdown).toContain('## Comments (152)');
        expect(markdown).toContain('**u/ac1** · 1 points · *2026-01-01T00:00:00.000Z*\n\nbody c1\n\n> **u/ad1** · 1 points');
        expect(markdown).not.toContain('not included');

        const capped = await fetchRedditContent('p1', site(), reddit(1));
        expect(capped).toContain('## Comments (101)');
        expect(capped).toContain('> *1 more reply not included (over this export\'s limit of 1 extra requests).*');
        expect(capped).toContain('*50 more replies not included (over this export\'s limit of 1 extra requests).*');
    });

    test('a failed follow-up costs only its comments; a refused post says why; state is the comment count', async () => {
        const { fetchRedditContent } = await import('../src/adapters/reddit');
        const { fetchThreadState } = await import('../src/adapters/engines');
        const partial = await fetchRedditContent('p1', site({ '/comments/p1/_/c1.json': 500 }), reddit());
        expect(partial).toContain('> *1 more reply not included (HTTP 500 during thread).*');
        expect(partial).toContain('## Comments (151)');
        await expect(fetchRedditContent('p1', site({ '/comments/p1.json': 403 }), reddit())).rejects.toMatchObject({ code: 'ACCESS_DENIED', message: 'The community is quarantined: open it on Reddit and opt in first' });
        const empty: HttpFetcher = { get: async () => ({ status: 200, ok: true, text: JSON.stringify([listing([]), listing([])]) }) };
        await expect(fetchRedditContent('p1', empty, reddit())).rejects.toMatchObject({ code: 'API_REJECTED' });
        expect(await fetchThreadState('p1', site(), reddit())).toEqual({ replies: 153 });
    });
});

describe('Discuz!', () => {
    test('forum times in the forum\'s zone; anything else kept as shown', async () => {
        const { parseForumDate } = await import('../src/adapters/discuz');
        expect(parseForumDate('2026-10-15 12:58')).toBe('2026-10-15T04:58:00.000Z');
        expect(parseForumDate('发表于 2022-5-5 21:44:42')).toBe('2022-05-05T13:44:42.000Z');
        expect(parseForumDate('2026-10-15', '+00:00')).toBe('2026-10-15T00:00:00.000Z');
        expect(parseForumDate('昨天 12:58')).toBe('昨天 12:58');
    });

    test('GBK pages decode by their declared charset', async () => {
        const { responseText } = await import('../src/utils/http');
        // "论坛" in GBK.
        const gbk = new Uint8Array([0xc2, 0xdb, 0xcc, 0xb3]);
        expect(await responseText(new Response(gbk, { headers: { 'content-type': 'text/html; charset=gbk' } }))).toBe('论坛');
        const meta = new Uint8Array([...new TextEncoder().encode('<meta charset="gb2312">'), ...gbk]);
        expect(await responseText(new Response(meta, { headers: { 'content-type': 'text/html' } }))).toBe('<meta charset="gb2312">论坛');
        expect(await responseText(new Response('论坛', { headers: { 'content-type': 'text/plain' } }))).toBe('论坛');
    });

    test('query routes: the id from a parameter, only when the other parameters match', async () => {
        const { classifyRoute } = await import('../src/adapters/routes');
        const right = profiles.right;
        expect(classifyRoute('https://www.right.com.cn/forum/forum.php?mod=viewthread&tid=42&extra=page%3D1', right)).toMatchObject({ name: 'viewthread', kind: 'thread', id: '42' });
        expect(classifyRoute('https://www.right.com.cn/forum/forum.php?mod=forumdisplay&fid=49', right)).toMatchObject({ name: 'forumdisplay', id: '49' });
        for (const url of ['https://www.right.com.cn/forum/forum.php', 'https://www.right.com.cn/forum/forum.php?mod=viewthread', 'https://www.right.com.cn/forum/forum.php?mod=viewthread&tid=abc', 'https://www.right.com.cn/thread-1-1-1.html'])
            expect(classifyRoute(url, right)).toBeNull();
        expect(() => normalizeProfile({ ...structuredClone(right), routes: [{ name: 't', kind: 'thread', pattern: '^/x$' }] })).toThrow('Thread route requires an ID capture or id_param');
    });

    test('a notice instead of the thread is the forum\'s refusal; posts without floors keep page order', async () => {
        const { parseDiscuzPage } = await import('../src/adapters/discuz');
        expect(() => parseDiscuzPage('<div id="messagetext" class="alert_info"><p>休息下，一会见</p></div>', 'https://x.test/')).toThrow('休息下，一会见');
        const page = parseDiscuzPage('<div id="post_1"><div id="favatar1"><div class="pi"><div class="authi">anon</div></div></div><em id="authorposton1">发表于 3 天前</em>'
            + '<div class="locked">提示: <em>该帖被管理员或版主屏蔽</em></div></div><div id="post_2"><td class="t_f" id="postmessage_2">hi <a href="space-uid-1.html">u</a></td></div>', 'https://x.test/bbs/thread-1-1-1.html');
        expect(page.posts.map(post => [post.floor, post.author, post.date])).toEqual([[0, 'anon', '3 天前'], [0, '', '']]);
        expect(page.posts[0].html).toContain('该帖被管理员或版主屏蔽');
        expect(page.posts[1].html).toBe('hi <a href="https://x.test/bbs/space-uid-1.html">u</a>');
        expect(page.pages).toBe(1);
    });
});

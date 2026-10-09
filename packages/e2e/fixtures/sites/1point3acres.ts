/**
 * 1Point3Acres stand-in, modelled on the live evidence in
 * docs/plans/1point3acres-layout-repair.md: a Next.js-style SPA whose discover
 * feed has 20 `ForumThreadItem` rows plus category cards, an ad row and a hot
 * section (26 thread anchors in total), full-row title overlays, client-side
 * pagination/sort, and the api.1point3acres.com thread + nested-posts JSON API.
 */
import { EPOCH, html, json, page, type FakeResponse, type FakeSite } from '../types';

export const P3A = 'https://www.1point3acres.com';
export const P3A_INSTANT = 'https://instant.1point3acres.com';
export const P3A_API = 'https://api.1point3acres.com';

export interface P3AThread {
    subject: string;
    author: string;
    bbcode: string;
    /** Advertised reply count (thread.replies). */
    replies: number;
    /** Posts the comments endpoint actually returns; defaults to `replies` (nested replies make them differ). */
    posts?: number;
    /** Failure modes of the thread endpoint. */
    status?: number;
    errno?: number;
    malformed?: boolean;
    missingSubject?: boolean;
    /** Comments endpoint ignores `pg`, returning page 1 forever. */
    repeatPages?: boolean;
}

export const RICH_BODY = [
    '[b]面经[/b]: Google L4 onsite, [i]bay area[/i].',
    '',
    'Timeline:',
    '[list=1]',
    '[*]电面 in January',
    '[*]Onsite in [s]February[/s] March',
    '[/list]',
    '[quote]Recruiter: "We will get back to you."',
    'Two weeks later.[/quote]',
    '[code]def solve(nums):',
    '    return sorted(nums)[/code]',
    'Prep: [url=https://example.org/guide]the guide[/url]',
    '[img]https://example.org/offer.png[/img]',
    'Literal tokens: $& $1 {title} 😀',
].join('\n');

export const p3aThreads: Record<string, P3AThread> = {
    // 25 top-level posts plus 5 nested replies (楼中楼): post 2 has 4 (preview shows 2), post 5 has 1.
    '1001': { subject: 'Offer 比较: Google vs Meta', author: 'alice', bbcode: RICH_BODY, replies: 30, posts: 25 },
    '1002': { subject: 'Visa timeline 2026', author: 'bob', bbcode: 'No replies yet.', replies: 0 },
    '1003': { subject: 'Members only thread', author: 'carol', bbcode: 'hidden', replies: 0, status: 403 },
    '1004': { subject: 'Hot sidebar thread', author: 'hot', bbcode: 'hot', replies: 0 },
    '1007': { subject: 'Exactly one page of replies', author: 'gina', bbcode: 'Twenty replies.', replies: 20 },
    '1008': { subject: 'Nested replies thread', author: 'hank', bbcode: 'Advertises 30, returns 22 top-level.', replies: 30, posts: 22 },
    '1009': { subject: 'API repeats pages', author: 'ivan', bbcode: 'Broken pagination.', replies: 40, repeatPages: true },
    '1010': { subject: 'Legacy pinned post', author: 'frank', bbcode: 'Pinned body.', replies: 0 },
    '1011': { subject: 'Errno failure', author: 'judy', bbcode: 'x', replies: 0, errno: 1 },
    '1012': { subject: 'Malformed JSON', author: 'ken', bbcode: 'x', replies: 0, malformed: true },
    '1013': { subject: 'Missing subject', author: 'lee', bbcode: 'x', replies: 0, missingSubject: true },
    '1014': { subject: 'Login required', author: 'mia', bbcode: 'x', replies: 0, status: 401 },
    '1015': { subject: 'Server error', author: 'ned', bbcode: 'x', replies: 0, status: 500 },
    '1016': { subject: 'He said "a: b" / c? $& {title}', author: 'o"neil', bbcode: 'Quoted.', replies: 0 },
    '1021': { subject: 'Same title', author: 'pat', bbcode: 'First of two.', replies: 0 },
    '1022': { subject: 'Same title', author: 'quinn', bbcode: 'Second of two.', replies: 0 },
    '10011': { subject: 'Substring id collision', author: 'rob', bbcode: 'Not 1001.', replies: 0 },
};

/** Feed filler: any id in 1200–1499 is an ordinary zero-reply thread. */
export function p3aThread(id: string): P3AThread | undefined {
    if (p3aThreads[id]) return p3aThreads[id];
    const number = Number(id);
    if (number >= 1200 && number < 1500) return { subject: `Filler thread ${id}`, author: `filler${id}`, bbcode: `Body of ${id}.`, replies: 0 };
    return undefined;
}

const range = (start: number, count: number) => Array.from({ length: count }, (_, i) => String(start + i));

/** Discover/38: 20 feed rows per page; sort=popular reverses page 1. */
export const discoverFeed = {
    1: ['1001', '1002', '1003', '1007', '1008', '10011', ...range(1201, 14)],
    2: range(1301, 20),
};
export const hotIds = ['1004', ...range(1401, 5)];
export const AD_ID = '1499';

function rowHtml(id: string, options: { absolute?: boolean } = {}): string {
    const thread = p3aThread(id)!;
    const href = `${options.absolute ? P3A : ''}/home/thread/${id}`;
    return `<div data-sentry-component="ForumThreadItem" class="row">`
        + `<a class="title" href="${href}"><h3 title="${thread.subject.replace(/"/g, '&quot;')}">${thread.subject.slice(0, 10)}…</h3></a>`
        + `<div class="meta">by ${thread.author} · <a href="/home/thread/${id}#comments">${thread.replies} replies</a></div></div>`;
}

export function p3aRows(ids: string[]): string {
    return ids.map(id => rowHtml(id, { absolute: id === '1008' })).join('');
}

const styles = `<style>
  body { font: 14px sans-serif; margin: 0; }
  main { max-width: 760px; margin: 0 auto; }
  .row { position: relative; padding: 12px 16px; border-bottom: 1px solid #ddd; }
  /* Live site: the title anchor's ::after covers the whole row. */
  .row a.title::after { content: ''; position: absolute; inset: 0; }
  .row .meta { position: relative; }
</style>`;

/** Soft navigation like the live SPA: URL first, DOM replaced after a delay. */
function spaScript(): void {
    const w = window as any;
    w.__spaNavigations = 0;
    async function go(href: string, push: boolean) {
        if (push) history.pushState({}, '', href);
        w.__spaNavigations++;
        const response = await fetch(href);
        const next = new DOMParser().parseFromString(await response.text(), 'text/html');
        await new Promise(resolve => setTimeout(resolve, w.__spaDelay ?? 200));
        if (location.href !== new URL(href, location.href).href) return;
        document.title = next.title;
        document.querySelector('main')!.replaceWith(next.querySelector('main')!);
    }
    w.__spaGo = (href: string) => go(href, true);
    document.addEventListener('click', event => {
        const anchor = (event.target as Element).closest('a');
        if (!anchor || event.defaultPrevented || !anchor.href.startsWith(`${location.origin}/home/`)) return;
        event.preventDefault();
        void go(anchor.href, true);
    });
    window.addEventListener('popstate', () => { void go(location.href, false); });
}

function shell(title: string, main: string, extra = ''): FakeResponse {
    return page(html(title, `<header><nav><a href="/home/">首页</a></nav></header>${main}<aside><h2>Sidebar</h2>`
        + `<div data-sentry-component="ForumThreadItem"><a href="/home/thread/1004"><h3>Sidebar copy</h3></a></div></aside>`
        + `<script>(${spaScript.toString()})();</script>${extra}`, styles));
}

function discover(url: URL): FakeResponse {
    const pageNumber = Number(url.searchParams.get('page') ?? '1');
    let ids = [...(discoverFeed[pageNumber as 1 | 2] ?? [])];
    if (url.searchParams.get('sort') === 'popular') ids.reverse();
    const ad = `<div data-ad="1" data-sentry-component="ForumThreadItem" class="row"><a class="title" href="/home/thread/${AD_ID}"><h3>Sponsored</h3></a></div>`;
    const feed = p3aRows(ids.slice(0, 3)) + ad + p3aRows(ids.slice(3));
    const hot = hotIds.map(id => `<a href="/home/thread/${id}"><h3>${p3aThread(id)!.subject}</h3></a>`).join('');
    return shell('发现 - 求职 | 一亩三分地', `<main>
        <div class="category-cards"><a href="/home/forum/27"><h3>Legacy board</h3></a><a href="/home/forum/145"><h3>Small board</h3></a></div>
        <h1>求职</h1>
        <div class="sort"><a id="sort-latest" href="/home/discover/38?sort=latest">最新</a><a id="sort-popular" href="/home/discover/38?sort=popular">热门</a></div>
        <section id="feed">${feed}</section>
        <nav class="pagination"><a id="page-1" href="/home/discover/38?page=1">1</a><a id="page-2" href="/home/discover/38?page=2">2</a></nav>
        <section data-sentry-component="HotThreads"><h2>热门讨论</h2>${hot}</section>
    </main>`);
}

/** Small listing for batch scenarios; ids come from `?ids=` so each test picks its rows. */
function forum(url: URL, id: string): FakeResponse {
    if (id === '27') {
        // Legacy markup: only the fallback layout (HomeThreadItem + /home/pins/ links) matches.
        return shell('Legacy | 一亩三分地', `<main><h1>Legacy board</h1>`
            + `<div data-sentry-component="HomeThreadItem"><a href="/home/pins/1010"><h3>${p3aThreads['1010'].subject}</h3></a></div></main>`);
    }
    const ids = (url.searchParams.get('ids') ?? '1001,1002,1003').split(',');
    return shell(`Board ${id} | 一亩三分地`, `<main><h1>Board ${id}</h1><section id="feed">${p3aRows(ids)}</section></main>`);
}

/** Tag pages hydrate late: the feed is empty and busy, rows arrive after 600 ms. */
function tag(): FakeResponse {
    const rows = JSON.stringify(p3aRows(['1002', '1007']));
    return shell('面经 | 一亩三分地', `<main><h1>面经</h1><section id="feed" aria-busy="true"><div class="skeleton">Loading…</div></section></main>`,
        `<script>setTimeout(() => { const feed = document.querySelector('#feed'); feed.innerHTML = ${rows}; feed.removeAttribute('aria-busy'); }, 600);</script>`);
}

function threadPage(id: string): FakeResponse {
    const thread = p3aThread(id);
    if (!thread) return page(html('Not found', '<h1>404</h1>'), 404);
    return shell(`${thread.subject} | 一亩三分地`, `<main><h1 class="text-xl font-bold">${thread.subject}</h1>`
        + `<article data-sentry-component="MainThread"><p>${thread.bbcode}</p></article>`
        + `<section data-sentry-component="ThreadPosts"><a href="/home/thread/1002"><h3>Related</h3></a></section></main>`);
}

function site(url: URL): FakeResponse {
    let match: RegExpMatchArray | null;
    if ((match = url.pathname.match(/^\/home\/(?:thread|pins)\/(\d+)\/?$/))) return threadPage(match[1]);
    if ((match = url.pathname.match(/^\/bbs\/thread-(\d+)-\d+-\d+\.html$/))) return threadPage(match[1]);
    if (url.pathname === '/home/discover/38') return discover(url);
    if ((match = url.pathname.match(/^\/home\/forum\/(\d+)\/?$/))) return forum(url, match[1]);
    if (url.pathname.startsWith('/home/tag/')) return tag();
    if (url.pathname === '/home' || url.pathname === '/home/') return shell('一亩三分地', '<main><h1>Home</h1><a href="/home/discover/38">求职</a></main>');
    return page(html('Not found', '<h1>404</h1>'), 404);
}

function instant(url: URL): FakeResponse {
    const match = url.pathname.match(/^\/thread\/(\d+)\/?$/);
    return match ? threadPage(match[1]) : page(html('Not found', '<h1>404</h1>'), 404);
}

/** Nested replies per top-level post (thread 1001 only), as the live API models them. */
export const NESTED: Record<number, number> = { 2: 4, 5: 1 };
const NESTED_PREVIEW = 2;

export function p3aChild(parentPid: number, k: number) {
    return {
        pid: parentPid * 10 + k,
        author: `nested${k}`,
        message_bbcode: `Nested reply ${k} to ${parentPid}`,
        dateline: EPOCH + 5000 + k,
    };
}

export function p3aPost(threadId: string, index: number) {
    const pid = Number(threadId) * 1000 + index;
    const nested = threadId === '1001' ? NESTED[index] : undefined;
    return {
        pid,
        author: `user${index}`,
        message_bbcode: `Reply number ${index} with [b]emphasis ${index}[/b]`,
        dateline: EPOCH + index * 60,
        ...(nested ? { replies: { count: nested, data: Array.from({ length: Math.min(nested, NESTED_PREVIEW) }, (_, k) => p3aChild(pid, k + 1)) } } : {}),
    };
}

function api(url: URL): FakeResponse {
    let match: RegExpMatchArray | null;
    if ((match = url.pathname.match(/^\/api\/v3\/home-threads\/(\d+)$/))) {
        const data = p3aThread(match[1]);
        if (!data) return json({ errno: 404, msg: 'not found' }, 404);
        if (data.status) return json({ errno: data.status, msg: 'denied' }, data.status);
        if (data.malformed) return { status: 200, body: '{"errno":0,"thread":', contentType: 'application/json' };
        const thread: Record<string, unknown> = {
            subject: data.subject, author: data.author, message_bbcode: data.bbcode,
            dateline: EPOCH, lastpost: EPOCH + 3600, views: 4321, replies: data.replies, favtimes: 7,
        };
        if (data.missingSubject) delete thread.subject;
        return json({ errno: data.errno ?? 0, thread });
    }
    if ((match = url.pathname.match(/^\/api\/threads\/(\d+)\/nested-posts$/))) {
        const data = p3aThread(match[1]);
        const size = Number(url.searchParams.get('ps'));
        const number = data?.repeatPages ? 1 : Number(url.searchParams.get('pg'));
        const start = (number - 1) * size;
        const count = Math.max(0, Math.min(size, (data?.posts ?? data?.replies ?? 0) - start));
        return json({ errno: 0, posts: Array.from({ length: count }, (_, i) => p3aPost(match![1], start + i + 1)) });
    }
    // Full nested replies of one post (the live API wants a logged-in session here).
    if ((match = url.pathname.match(/^\/api\/posts\/(\d+)\/nested-posts$/))) {
        const pid = Number(match[1]);
        const count = Number(String(pid).slice(0, 4)) === 1001 ? NESTED[pid % 1000] ?? 0 : 0;
        const size = Number(url.searchParams.get('ps'));
        const start = (Number(url.searchParams.get('pg')) - 1) * size;
        return json({ errno: 0, posts: Array.from({ length: Math.max(0, Math.min(size, count - start)) }, (_, i) => p3aChild(pid, start + i + 1)) });
    }
    return json({ errno: 404 }, 404);
}

export const onePoint3Acres: FakeSite = {
    origins: [P3A, P3A_INSTANT, P3A_API],
    respond: url => url.origin === P3A_API ? api(url) : url.origin === P3A_INSTANT ? instant(url) : site(url),
};

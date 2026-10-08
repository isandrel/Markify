/**
 * Offline stand-ins for every remote host Markify talks to. The same handler
 * serves Playwright routes, GM.xmlHttpRequest, and the CLI/MCP fetch preload, so
 * every surface sees identical pages and APIs and no test touches the network.
 */

export interface FakeResponse {
    status: number;
    body: string;
    contentType: string;
}

export const P3A = 'https://www.1point3acres.com';
export const P3A_API = 'https://api.1point3acres.com';
export const USCF = 'https://www.uscardforum.com';
export const BLOG = 'https://blog.example.com';
export const JINA = 'https://r.jina.ai';

/** 2026-01-01T00:00:00Z — API timestamps are Unix seconds. */
export const EPOCH = 1767225600;
export const EPOCH_ISO = '2026-01-01T00:00:00.000Z';

interface P3AThread {
    subject: string;
    author: string;
    bbcode: string;
    replies: number;
    status?: number;
}

/** Thread 1001 spans two comment pages (20 + 5); 1003 is denied by the API. */
export const p3aThreads: Record<string, P3AThread> = {
    '1001': {
        subject: 'Offer 比较: Google vs Meta',
        author: 'alice',
        bbcode: 'Intro with [b]bold text[/b] and [i]italic text[/i]. See [url=https://example.org/guide]the guide[/url].',
        replies: 25,
    },
    '1002': { subject: 'Visa timeline 2026', author: 'bob', bbcode: 'No replies yet.', replies: 0 },
    '1003': { subject: 'Members only thread', author: 'carol', bbcode: 'hidden', replies: 0, status: 403 },
    '1005': { subject: 'Page two first', author: 'dave', bbcode: 'Second page row one.', replies: 0 },
    '1006': { subject: 'Page two second', author: 'erin', bbcode: 'Second page row two.', replies: 0 },
    '1010': { subject: 'Legacy pinned post', author: 'frank', bbcode: 'Pinned body.', replies: 0 },
};

/** Discourse raw pages; an empty body is the terminal page. 2003 fails with 500. */
export const uscfTopics: Record<string, { title: string; pages: string[]; status?: number }> = {
    '2001': {
        title: 'Amex Platinum offer',
        pages: [
            'alice | 2026-01-01 00:00:00 UTC | #1\n\nFirst page **post** about the offer.',
            'bob | 2026-01-02 00:00:00 UTC | #21\n\nSecond page reply.',
        ],
    },
    '2002': { title: 'Chase 5/24 rule', pages: ['carol | 2026-01-03 | #1\n\nSingle page topic.'] },
    '2003': { title: 'Broken topic', pages: [], status: 500 },
};

function html(title: string, body: string): string {
    return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${body}</body></html>`;
}

function json(value: unknown, status = 200): FakeResponse {
    return { status, body: JSON.stringify(value), contentType: 'application/json; charset=utf-8' };
}

function page(body: string, status = 200): FakeResponse {
    return { status, body, contentType: 'text/html; charset=utf-8' };
}

export function p3aListingRows(ids: string[]): string {
    return ids.map(id => `<div data-sentry-component="ForumThreadItem" class="row">`
        + `<a href="/home/thread/${id}"><h3 title="${p3aThreads[id].subject}">${p3aThreads[id].subject.slice(0, 8)}…</h3></a>`
        + `<span>by ${p3aThreads[id].author}</span></div>`).join('');
}

function p3aPost(threadId: string, index: number) {
    return {
        pid: Number(threadId) * 1000 + index,
        author: `user${index}`,
        message_bbcode: `Reply number ${index} with [b]emphasis ${index}[/b]`,
        dateline: EPOCH + index * 60,
    };
}

function p3aApi(url: URL): FakeResponse {
    const thread = url.pathname.match(/^\/api\/v3\/home-threads\/(\d+)$/);
    if (thread) {
        const data = p3aThreads[thread[1]];
        if (!data) return json({ errno: 404, msg: 'not found' }, 404);
        if (data.status) return json({ errno: data.status }, data.status);
        return json({
            errno: 0,
            thread: {
                subject: data.subject, author: data.author, message_bbcode: data.bbcode,
                dateline: EPOCH, lastpost: EPOCH + 3600, views: 4321, replies: data.replies, favtimes: 7,
            },
        });
    }
    const posts = url.pathname.match(/^\/api\/threads\/(\d+)\/nested-posts$/);
    if (posts) {
        const data = p3aThreads[posts[1]];
        const size = Number(url.searchParams.get('ps'));
        const number = Number(url.searchParams.get('pg'));
        const start = (number - 1) * size;
        const count = Math.max(0, Math.min(size, (data?.replies ?? 0) - start));
        return json({ errno: 0, posts: Array.from({ length: count }, (_, i) => p3aPost(posts[1], start + i + 1)) });
    }
    return json({ errno: 404 }, 404);
}

function p3aSite(url: URL): FakeResponse {
    const thread = url.pathname.match(/^\/home\/(?:thread|pins)\/(\d+)\/?$/);
    if (thread && p3aThreads[thread[1]]) {
        const data = p3aThreads[thread[1]];
        return page(html(`${data.subject} - 一亩三分地`, `<main><h1 class="text-xl">${data.subject}</h1><article>${data.bbcode}</article></main>`));
    }
    if (url.pathname === '/home/discover/38') {
        return page(html('求职 - 一亩三分地', `<main><h1>求职</h1><section id="feed">${p3aListingRows(['1001', '1002', '1003'])}</section></main>`
            + `<aside><div data-sentry-component="ForumThreadItem"><a href="/home/thread/1004"><h3>Sidebar hot thread</h3></a></div></aside>`));
    }
    if (url.pathname === '/home/forum/27') {
        // Legacy markup: only the fallback layout (HomeThreadItem + /home/pins/ links) matches.
        return page(html('Legacy - 一亩三分地', `<main><h1>Legacy board</h1>`
            + `<div data-sentry-component="HomeThreadItem"><a href="/home/pins/1010"><h3>${p3aThreads['1010'].subject}</h3></a></div></main>`));
    }
    if (url.pathname === '/home' || url.pathname === '/home/') return page(html('一亩三分地', '<main><h1>Home</h1></main>'));
    return page(html('Not found', '<h1>404</h1>'), 404);
}

function uscfSite(url: URL): FakeResponse {
    const raw = url.pathname.match(/^\/raw\/(\d+)$/);
    if (raw) {
        const topic = uscfTopics[raw[1]];
        if (!topic) return { status: 404, body: 'not found', contentType: 'text/plain' };
        if (topic.status) return { status: topic.status, body: 'error', contentType: 'text/plain' };
        const index = Number(url.searchParams.get('page') ?? '1') - 1;
        return { status: 200, body: topic.pages[index] ?? '', contentType: 'text/plain; charset=utf-8' };
    }
    const topic = url.pathname.match(/^\/t\/(?:[^/]+\/)?(\d+)/);
    if (topic && uscfTopics[topic[1]]) {
        const data = uscfTopics[topic[1]];
        return page(html(`${data.title} - 美国信用卡指南`, `<div id="main-outlet"><h1>${data.title}</h1><div class="cooked"><p>${data.title} body</p></div></div>`));
    }
    const row = (id: string) => `<tr class="topic-list-item"><td class="main-link"><a class="title raw-topic-link" href="/t/slug-${id}/${id}">${uscfTopics[id].title}</a></td><td>3</td></tr>`;
    if (url.pathname === '/c/credit-cards/5') {
        return page(html('Credit Cards - 美国信用卡指南', `<div id="main-outlet"><h1>Credit Cards</h1><table><tbody>${['2001', '2002', '2003'].map(row).join('')}</tbody></table></div>`
            + `<aside><table><tbody>${row('2002')}</tbody></table></aside>`));
    }
    if (url.pathname === '/search') {
        const results = ['2001', '2002'].map(id => `<div class="fps-result"><a class="search-link" href="/t/slug-${id}/${id}"><span class="topic-title">${uscfTopics[id].title}</span></a></div>`).join('');
        return page(html('Search - 美国信用卡指南', `<div id="main-outlet"><h1>Search results</h1>${results}</div>`));
    }
    if (url.pathname === '/latest' || url.pathname === '/') return page(html('Latest - 美国信用卡指南', '<div id="main-outlet"><h1>Latest</h1></div>'));
    return page(html('Not found', '<h1>404</h1>'), 404);
}

export const blogArticle = html('A Field Guide to Markdown', `<nav>Site navigation</nav>
<article>
  <h1>A Field Guide to Markdown</h1>
  <p>Markdown is <strong>plain text</strong> with <em>light</em> syntax and <del>no</del> fuss.</p>
  <h2>Code</h2>
  <pre><code>const answer = 42;</code></pre>
  <ul><li>First item</li><li>Second item</li></ul>
  <p>Read <a href="https://example.org/spec">the spec</a>.</p>
  <script>window.leaked = 'script content';</script>
</article>
<footer>Footer links</footer>`).replace('<head>', '<head><meta name="author" content="Grace Hopper"><meta name="description" content="How to write Markdown"><meta name="keywords" content="markdown, writing">');

function blogSite(url: URL): FakeResponse {
    if (url.pathname === '/post' || url.pathname === '/jina-fails') return page(blogArticle);
    return page(html('Not found', '<h1>404</h1>'), 404);
}

/** Jina Reader stand-in: `/jina-fails` exercises the DOM fallback. */
function jina(url: URL): FakeResponse {
    const target = url.href.slice(`${JINA}/`.length);
    if (target.includes('/jina-fails')) return { status: 503, body: 'unavailable', contentType: 'text/plain' };
    return json({
        code: 200,
        data: {
            title: 'Reader Title',
            url: target,
            description: 'Reader description',
            content: `# Reader Title\n\nReader rendered **markdown** for ${target}`,
        },
    });
}

/** Returns null for hosts outside the fake internet so callers can fail loudly. */
export function respond(input: string): FakeResponse | null {
    const url = new URL(input);
    if (url.href.startsWith(`${JINA}/`)) return jina(url);
    switch (url.origin) {
        case P3A: return p3aSite(url);
        case P3A_API: return p3aApi(url);
        case USCF: return uscfSite(url);
        case BLOG: return blogSite(url);
        default: return null;
    }
}

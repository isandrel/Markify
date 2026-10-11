/**
 * V2EX stand-in: topic pages (title "Topic - V2EX", supplements, tags, 100 replies
 * a page as `?p=N`), the public v1 API (`/api/topics/show.json`, a list either way;
 * `/api/replies/show.json` lags like the real one and misses the newest reply) and
 * topic lists (node, recent, tag, member, home), on www.v2ex.com and v2ex.com.
 */
import { EPOCH, html, json, page, type FakeResponse, type FakeSite } from '../types';

export const V2EX = 'https://www.v2ex.com';
export const V2EX_BARE = 'https://v2ex.com';

export interface V2exReply { author: string; html: string; minutes: number }
export interface V2exTopic {
    title: string;
    node: { name: string; title: string };
    author: string;
    html: string;
    supplements?: Array<{ html: string; at: string }>;
    tags?: string[];
    replies: V2exReply[];
    /** Last reply time (listing rows and last_touched); defaults to EPOCH + 1h. */
    touched?: number;
    /** The API answers [] (deleted, or a node that needs a login). */
    hidden?: boolean;
}

export const v2exTopics: Record<string, V2exTopic> = {
    '900001': {
        title: '分享一个把网页转成 Markdown 的油猴脚本 [开源]',
        node: { name: 'create', title: '分享创造' },
        author: 'livid',
        html: '<div class="markdown_body"><h2>功能</h2>\n<ul>\n<li>一键导出</li>\n<li>批量 ZIP</li>\n</ul>\n<pre><code class="language-js">console.log("hi")\n</code></pre>\n<p>源码见 <a href="/t/900002">这里</a></p></div>',
        supplements: [
            { html: '<div class="markdown_body"><p>已支持 <strong>V2EX</strong></p></div>', at: '2026-01-01 10:00:00 +08:00' },
            { html: '修复了附言导出', at: '2026-01-01 12:30:00 +08:00' },
        ],
        tags: ['油猴', 'Markdown'],
        replies: [
            { author: 'alice', html: '感谢分享 <img src="//cdn.v2ex.com/static/img/emoji.png" />', minutes: 1 },
            { author: 'bob', html: '@<a href="/member/alice">alice</a> #1 同感 <a target="_blank" href="https://i.imgur.com/shot.png" rel="nofollow noopener"><img src="https://i.imgur.com/shot.png" class="embedded_image" rel="noreferrer" /></a>', minutes: 2 },
            { author: 'livid', html: '<a href="https://github.com/isandrel/Markify" target="_blank" rel="nofollow noopener">https://github.com/isandrel/Markify</a>', minutes: 3 },
        ],
    },
    '900002': { title: '求推荐 Linux 发行版', node: { name: 'create', title: '分享创造' }, author: 'carol', html: '<p>新手，主要写代码。</p>', replies: [] },
    '900003': { title: '登录可见的帖子', node: { name: 'create', title: '分享创造' }, author: 'dave', html: '<p>secret</p>', replies: [], hidden: true },
    '900004': {
        title: 'Docker 容器无法访问外网',
        node: { name: 'qna', title: '问与答' }, author: 'erin', html: '<p>试试 <code>--dns 1.1.1.1</code>。</p>',
        replies: [{ author: 'frank', html: '重启 docker 服务', minutes: 5 }],
        touched: EPOCH + 86400 * 60,
    },
    '900005': { title: 'MacBook 电池续航怎么样', node: { name: 'qna', title: '问与答' }, author: 'grace', html: '<p>大概多久？</p>', replies: [{ author: 'heidi', html: '十个小时', minutes: 7 }] },
    // Two pages of replies.
    '900006': {
        title: '每日签到楼', node: { name: 'qna', title: '问与答' }, author: 'ivan', html: '<p>签到</p>',
        replies: Array.from({ length: 120 }, (_, index) => ({ author: `user${index + 1}`, html: `第 ${index + 1} 天`, minutes: index + 1 })),
    },
};
export const V2EX_PAGE_SIZE = 100;

export const v2exLists = {
    node: { name: 'create', ids: ['900001', '900002', '900003'] },
    recent: ['900004', '900001', '900002'],
    tag: { name: 'Markdown', ids: ['900001'] },
    member: { name: 'livid', ids: ['900001'] },
};

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const touched = (topic: V2exTopic) => topic.touched ?? EPOCH + 3600;
/** V2EX shows times like "2026-01-01 08:00:00 +08:00" in title attributes. */
const shanghai = (seconds: number) => new Date((seconds + 8 * 3600) * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' +08:00';

function apiTopic(id: string, topic: V2exTopic) {
    return {
        id: Number(id), title: topic.title, url: `${V2EX}/t/${id}`, content: 'raw', content_rendered: topic.html,
        replies: topic.replies.length, created: EPOCH, last_modified: EPOCH, last_touched: touched(topic), last_reply_by: topic.replies.at(-1)?.author ?? '',
        member: { id: 1, username: topic.author, url: `${V2EX}/u/${topic.author}` },
        node: { id: 1, name: topic.node.name, title: topic.node.title, url: `${V2EX}/go/${topic.node.name}` },
    };
}

/** One topic row, as on home, recent, tag and member pages (`.cell.item`) or node pages (`.cell`). */
export function v2exRow(id: string, item = true): string {
    const topic = v2exTopics[id];
    return `<div class="cell${item ? ' item' : ` from_1 t_${id}`}"><table><tr><td width="48"><a href="/member/${topic.author}"><img class="avatar" alt="${topic.author}"></a></td>`
        + `<td><span class="item_title"><a href="/t/${id}#reply${topic.replies.length}" class="topic-link" id="topic-link-${id}">${escape(topic.title)}</a></span>`
        + `<div class="sep5"></div><span class="topic_info">${item ? `<a class="node" href="/go/${topic.node.name}">${topic.node.title}</a> &nbsp;•&nbsp; ` : ''}`
        + `<strong><a href="/member/${topic.author}">${topic.author}</a></strong> &nbsp;•&nbsp; <span title="${shanghai(touched(topic))}">1 天前</span></span></td>`
        + `<td width="70" align="right">${topic.replies.length ? `<a href="/t/${id}#reply${topic.replies.length}" class="count_livid">${topic.replies.length}</a>` : ''}</td></tr></table></div>`;
}

/** Hot topics in the right bar repeat topic links; they must never get checkboxes. */
const rightbar = `<div id="Rightbar"><div class="box"><div class="cell item"><span class="item_hot_topic_title"><a href="/t/900004" class="topic-link">${v2exTopics['900004'].title}</a></span></div></div></div>`;

function layout(title: string, main: string): FakeResponse {
    return page(html(`${title}`, `<div id="Wrapper"><div class="content">${rightbar}<div id="Main">${main}</div></div></div>`));
}

function list(heading: string, ids: string[]): FakeResponse {
    return layout(`V2EX › ${heading}`, `<div class="box"><div class="header"><a href="/">V2EX</a> › ${escape(heading)}</div>${ids.map(id => v2exRow(id)).join('')}</div>`);
}

function topicPage(id: string, topic: V2exTopic, page: number): FakeResponse {
    const supplements = (topic.supplements ?? []).map((supplement, index) => `<div class="subtle"><span class="fade">第 ${index + 1} 条附言 &nbsp;·&nbsp; <span title="${supplement.at}">1 天前</span></span>`
        + `<div class="sep5"></div><div class="topic_content">${supplement.html}</div></div>`).join('');
    const tags = (topic.tags ?? []).map(tag => `<a href="/tag/${encodeURIComponent(tag)}" class="tag"><li class="fa fa-tag"></li> ${escape(tag)}</a>`).join('');
    const pages = Math.max(1, Math.ceil(topic.replies.length / V2EX_PAGE_SIZE));
    const pager = pages > 1 ? `<div class="cell ps_container"><input type="number" class="page_input" autocomplete="off" value="${page}" min="1" max="${pages}" /></div>` : '';
    const replies = topic.replies.slice((page - 1) * V2EX_PAGE_SIZE, page * V2EX_PAGE_SIZE).map((reply, index) => {
        const floor = (page - 1) * V2EX_PAGE_SIZE + index + 1;
        return `<div id="r_${Number(id) * 1000 + floor}" class="cell"><table><tr><td width="48"><img class="avatar" alt="${reply.author}" /></td><td width="auto">`
            + `<div class="fr"> &nbsp; &nbsp; <span class="no">${floor}</span></div><div class="sep3"></div>`
            + `<strong><a href="/member/${reply.author}" class="dark">${reply.author}</a></strong> &nbsp; <div class="badges"></div>&nbsp; &nbsp;<span class="ago" title="${shanghai(EPOCH + reply.minutes * 60)}">1 天前</span>`
            + `<div class="sep5"></div><div class="reply_content">${reply.html}</div></td></tr></table></div>`;
    }).join('');
    return layout(`${topic.title} - V2EX`, `<div class="box"><div class="header"><a href="/">V2EX</a> › <a href="/go/${topic.node.name}">${topic.node.title}</a>`
        + `<div class="sep10"></div><h1>${escape(topic.title)}</h1><small class="gray"><a href="/member/${topic.author}">${topic.author}</a> · 1 天前 · 100 次点击</small></div>`
        + `<div class="cell"><div class="topic_content">${topic.html}</div></div>${supplements}</div>`
        + `<div class="box"><div class="cell"><div class="fr">${tags}</div><span class="gray">${topic.replies.length} 条回复</span></div>${pager}${replies}${pager}</div>`);
}

function respond(url: URL): FakeResponse {
    if (url.pathname === '/api/topics/show.json') {
        const id = url.searchParams.get('id') ?? '';
        const topic = v2exTopics[id];
        return json(topic && !topic.hidden ? [apiTopic(id, topic)] : []);
    }
    if (url.pathname === '/api/topics/latest.json') return json(Object.entries(v2exTopics).filter(([, topic]) => !topic.hidden).map(([id, topic]) => apiTopic(id, topic)));
    if (url.pathname === '/api/replies/show.json') {
        const id = url.searchParams.get('topic_id') ?? '';
        const topic = v2exTopics[id];
        if (!topic || topic.hidden) return json([]);
        return json(topic.replies.slice(0, -1).map((reply, index) => ({
            id: Number(id) * 100 + index, topic_id: Number(id), member_id: index, created: EPOCH + reply.minutes * 60, last_modified: EPOCH,
            content: 'raw', content_rendered: reply.html, member: { id: index, username: reply.author },
        })));
    }
    const topic = url.pathname.match(/^\/t\/(\d+)$/);
    if (topic) {
        const found = v2exTopics[topic[1]];
        if (!found) return page(html('V2EX', '<div id="Main">404</div>'), 404);
        // Logged out, a hidden topic redirects to the sign-in page; the fixture serves that page.
        return found.hidden ? layout('V2EX › 登录', '<div class="box"><div class="header">登录</div></div>') : topicPage(topic[1], found, Number(url.searchParams.get('p') ?? 1));
    }
    const node = url.pathname.match(/^\/go\/([^/]+)$/);
    const nodeIds = node ? Object.keys(v2exTopics).filter(id => v2exTopics[id].node.name === node[1]) : [];
    if (nodeIds.length) {
        const { title } = v2exTopics[nodeIds[0]].node;
        return layout(`V2EX › ${title}`, `<div class="box box-title node-header"><div class="cell page-content-header"><div class="title"><div class="node-breadcrumb"><a href="/">V2EX</a> › ${title}</div></div></div></div>`
            + `<div class="box"><div id="TopicsNode">${nodeIds.map(id => v2exRow(id, false)).join('')}</div></div>`);
    }
    if (url.pathname === '/recent') return list('最近的主题', v2exLists.recent);
    if (url.pathname === `/tag/${v2exLists.tag.name}`) return list(v2exLists.tag.name, v2exLists.tag.ids);
    if (url.pathname === `/member/${v2exLists.member.name}/topics`) return list(`${v2exLists.member.name} › 全部主题`, v2exLists.member.ids);
    if (url.pathname === '/') return list('技术', v2exLists.recent);
    return page(html('V2EX', '<div id="Main">not found</div>'), 404);
}

export const v2ex: FakeSite = { origins: [V2EX, V2EX_BARE], respond };

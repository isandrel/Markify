/**
 * Discourse stand-in shared by every Discourse forum (US Card Forum, LINUX DO, …):
 * topic pages titled "Topic - Category - Site" with the clean title in
 * #topic-title, `/raw/{id}?page=N` Markdown pages ending in an empty page,
 * topic lists (latest/new/top, categories, tags) and full-page search.
 * A new Discourse site is one `discourseSite({...})` call.
 */
import { html, json, page, text, type FakeResponse, type FakeSite } from '../types';

export interface DiscourseTopic {
    title: string;
    category: string;
    /** Raw Markdown pages; an empty body follows the last one. */
    pages: string[];
    /** HTTP status of /raw/ (403 restricted category, 404 deleted, 429 rate limited). */
    status?: number;
}

export interface DiscourseSpec {
    origin: string;
    siteTitle: string;
    topics: Record<string, DiscourseTopic>;
    /** Category path (as in /c/<path>), its heading, and topics. */
    category: { path: string; name: string; ids: string[] };
    tag: { name: string; ids: string[] };
    latest: string[];
    search: { query: string; ids: string[] };
}

const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'topic';
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Current Discourse topic-list row markup. */
export function discourseRows(spec: DiscourseSpec, ids: string[]): string {
    return ids.map(id => {
        const topic = spec.topics[id];
        return `<tr data-topic-id="${id}" class="topic-list-item category-${slug(topic.category)}">`
            + `<td class="main-link topic-list-data"><span class="link-top-line">`
            + `<a href="/t/${slug(topic.title)}/${id}" class="title raw-link raw-topic-link" data-topic-id="${id}">${escape(topic.title)}</a>`
            + `</span><div class="link-bottom-line"><span class="badge-category__name">${escape(topic.category)}</span></div></td>`
            + `<td class="num posts-map">${topic.pages.length * 20}</td></tr>`;
    }).join('');
}

function list(spec: DiscourseSpec, title: string, heading: string, ids: string[]): FakeResponse {
    // Sidebar copies of topics must never get checkboxes.
    const sidebar = `<aside class="sidebar"><table><tbody>${discourseRows(spec, ids.slice(0, 1))}</tbody></table></aside>`;
    return page(html(`${title} - ${spec.siteTitle}`, `${sidebar}<div id="main-outlet">${heading}`
        + `<table class="topic-list"><tbody class="topic-list-body">${discourseRows(spec, ids)}</tbody></table></div>`));
}

export function discourseSite(spec: DiscourseSpec): FakeSite {
    const respond = (url: URL): FakeResponse => {
        const raw = url.pathname.match(/^\/raw\/(\d+)$/);
        if (raw) {
            const topic = spec.topics[raw[1]];
            if (!topic) return text('not found', 404);
            if (topic.status) return text(topic.status === 429 ? 'You have performed this action too many times.' : 'error', topic.status);
            return text(topic.pages[Number(url.searchParams.get('page') ?? '1') - 1] ?? '');
        }
        const thread = url.pathname.match(/^\/t\/(?:[^/]+\/)?(\d+)(?:\/\d+)?\/?$/);
        if (thread && spec.topics[thread[1]]) {
            const topic = spec.topics[thread[1]];
            return page(html(`${topic.title} - ${topic.category} - ${spec.siteTitle}`, `<div id="main-outlet"><div id="topic-title">`
                + `<h1 data-topic-id="${thread[1]}"><a href="/t/${slug(topic.title)}/${thread[1]}" class="fancy-title">${escape(topic.title)}</a></h1>`
                + `<div class="topic-category"><span class="badge-category__name">${escape(topic.category)}</span></div></div>`
                + `<div class="post-stream"><article class="topic-post"><div class="cooked"><p>${escape(topic.title)} body</p></div></article></div></div>`));
        }
        if (url.pathname === `/c/${spec.category.path}`) return list(spec, spec.category.name, `<h1>${escape(spec.category.name)}</h1>`, spec.category.ids);
        if (url.pathname === `/tag/${spec.tag.name}`) return list(spec, `Topics tagged ${spec.tag.name}`, `<h1>${escape(spec.tag.name)}</h1>`, spec.tag.ids);
        if (url.pathname === '/latest.json') {
            return json({ topic_list: { topics: spec.latest.map(id => ({ id: Number(id), title: spec.topics[id].title, slug: slug(spec.topics[id].title), posts_count: spec.topics[id].pages.length * 20 })) } });
        }
        if (/^\/(latest|new|top|hot)\/?$/.test(url.pathname)) return list(spec, 'Latest topics', '', spec.latest);
        if (url.pathname === '/search') {
            const results = spec.search.ids.map(id => `<div class="fps-result"><div class="topic"><a class="search-link" href="/t/${slug(spec.topics[id].title)}/${id}">`
                + `<span class="topic-title">${escape(spec.topics[id].title)}</span></a></div></div>`).join('');
            return page(html(`Search results for ${url.searchParams.get('q')} - ${spec.siteTitle}`, `<div id="main-outlet"><h1>Search results</h1><div class="search-results">${results}</div></div>`));
        }
        if (url.pathname === '/' || url.pathname === '/categories') return page(html(spec.siteTitle, '<div id="main-outlet"><table class="category-list"></table></div>'));
        return page(html('Not found', '<h1>404</h1>'), 404);
    };
    return { origins: [spec.origin], respond };
}

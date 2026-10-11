/**
 * Reddit stand-in on www.reddit.com and old.reddit.com: `{post}.json` (the post
 * and a comment tree with "load more comments" and "continue this thread" stubs),
 * `api/morechildren.json`, `comments/{post}/_/{comment}.json`, `by_id/t3_{post}.json`,
 * post pages, and subreddit feeds in the new (shreddit) and old layouts.
 */
import { EPOCH, html, json, page, type FakeResponse, type FakeSite } from '../types';

export const REDDIT = 'https://www.reddit.com';
export const OLD_REDDIT = 'https://old.reddit.com';

type Json = Record<string, unknown>;
/** A comment; `more` lists replies held back behind "load more comments", `deep` behind "continue this thread". */
export interface RedditComment { id: string; author: string; body: string; score?: number; minutes: number; replies?: RedditComment[]; more?: RedditComment[]; deep?: RedditComment[] }
export interface RedditPost {
    title: string;
    subreddit: string;
    author: string;
    /** Post JSON fields beyond the basics (selftext, url, gallery_data, …). */
    fields?: Json;
    comments: RedditComment[];
    /** Top-level comments held back behind "load more comments". */
    more?: RedditComment[];
    /** HTTP status of the post JSON (403: private community). */
    status?: number;
}

const c = (id: string, author: string, body: string, minutes: number, extra: Partial<RedditComment> = {}): RedditComment => ({ id, author, body, minutes, score: 10 - minutes, ...extra });

export const redditPosts: Record<string, RedditPost> = {
    abc001: {
        title: 'Markify: export any thread to Markdown',
        subreddit: 'programming', author: 'neo',
        fields: {
            is_self: true, link_flair_text: 'Show-off',
            selftext: 'It converts **threads** to Markdown.\n\n![diagram](img1)\n\n```js\nconsole.log("hi")\n```',
            media_metadata: { img1: { status: 'valid', e: 'Image', s: { u: 'https://preview.redd.it/img1.png?width=640&s=abc', x: 640, y: 480 } } },
        },
        comments: [
            c('c1', 'trinity', 'Nice work.', 1, {
                replies: [c('c1a', 'neo', 'Thanks!', 2, {
                    replies: [c('c1a1', 'morpheus', 'Deep thoughts', 3, { deep: [c('c1a1x', 'oracle', 'Deeper still', 4)] })],
                })],
            }),
            c('c2', 'smith', 'Does it do **old.reddit**?', 5, { more: [c('c2a', 'neo', 'Yes, both.', 6)] }),
        ],
        more: [c('c3', 'tank', 'Third top-level', 7, { replies: [c('c3a', 'dozer', 'Reply to third', 8)] }), c('c4', 'mouse', 'Fourth top-level', 9)],
    },
    abc002: {
        title: 'An article about Markdown', subreddit: 'programming', author: 'carol',
        fields: { is_self: false, url: 'https://blog.example/markdown', post_hint: 'link' }, comments: [],
    },
    abc003: {
        title: 'Two screenshots', subreddit: 'pics', author: 'dave',
        fields: {
            is_self: false, url: 'https://www.reddit.com/gallery/abc003', is_gallery: true, over_18: false,
            gallery_data: { items: [{ media_id: 'g1', caption: 'First [1]' }, { media_id: 'g2' }] },
            media_metadata: { g1: { s: { u: 'https://preview.redd.it/g1.jpg' } }, g2: { s: { gif: 'https://preview.redd.it/g2.gif' } } },
        },
        comments: [c('p1', 'erin', 'Pretty', 1)],
    },
    abc004: { title: 'Private community post', subreddit: 'secret', author: 'frank', comments: [], status: 403 },
};

export const redditFeed = { subreddit: 'programming', ids: ['abc001', 'abc002'] };

const total = (comments: RedditComment[] = []): number => comments.reduce((sum, comment) => sum + 1 + total(comment.replies) + total(comment.more) + total(comment.deep), 0);
const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
const permalink = (id: string) => `/r/${redditPosts[id].subreddit}/comments/${id}/${slug(redditPosts[id].title)}/`;
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const listing = (children: unknown[]) => ({ kind: 'Listing', data: { after: null, before: null, children } });

function postData(id: string): Json {
    const post = redditPosts[id];
    return {
        id, name: `t3_${id}`, title: post.title, author: post.author, subreddit: post.subreddit, subreddit_name_prefixed: `r/${post.subreddit}`,
        created_utc: EPOCH, score: 42, upvote_ratio: 0.97, num_comments: total(post.comments) + total(post.more),
        permalink: permalink(id), selftext: '', is_self: true, over_18: false, ...post.fields,
    };
}

function commentThing(comment: RedditComment, parent: string, depth: number): Json {
    const replies: Json[] = (comment.replies ?? []).map(reply => commentThing(reply, `t1_${comment.id}`, depth + 1));
    if (comment.more?.length) replies.push(moreThing(comment.more, `t1_${comment.id}`));
    // "continue this thread": a stub with no ids, whose replies need the comment's own page.
    if (comment.deep?.length) replies.push({ kind: 'more', data: { count: 0, name: 't1__', id: '_', parent_id: `t1_${comment.id}`, depth: depth + 1, children: [] } });
    return {
        kind: 't1',
        data: {
            id: comment.id, name: `t1_${comment.id}`, author: comment.author, body: comment.body, score: comment.score ?? 1,
            created_utc: EPOCH + comment.minutes * 60, parent_id: parent, depth, replies: replies.length ? listing(replies) : '',
        },
    };
}

function moreThing(comments: RedditComment[], parent: string): Json {
    const ids = comments.map(comment => comment.id);
    return { kind: 'more', data: { count: total(comments), name: `t1_${ids[0]}`, id: ids[0], parent_id: parent, children: ids } };
}

/** Every held-back comment by id, with its parent fullname. */
function heldBack(): Map<string, { comment: RedditComment; parent: string; post: string }> {
    const found = new Map<string, { comment: RedditComment; parent: string; post: string }>();
    const walk = (comments: RedditComment[] = [], parent: string, post: string, held: boolean) => {
        for (const comment of comments) {
            if (held) found.set(comment.id, { comment, parent, post });
            walk(comment.replies, `t1_${comment.id}`, post, false);
            walk(comment.more, `t1_${comment.id}`, post, true);
            walk(comment.deep, `t1_${comment.id}`, post, false);
        }
    };
    for (const [id, post] of Object.entries(redditPosts)) { walk(post.comments, `t3_${id}`, id, false); walk(post.more, `t3_${id}`, id, true); }
    return found;
}

function findComment(comments: RedditComment[] = [], id: string): RedditComment | undefined {
    for (const comment of comments) {
        if (comment.id === id) return comment;
        const found = findComment([...(comment.replies ?? []), ...(comment.more ?? []), ...(comment.deep ?? [])], id);
        if (found) return found;
    }
    return undefined;
}

/** Current www.reddit.com feed markup: an <article> around each <shreddit-post>. */
export function shredditRows(ids: string[]): string {
    return ids.map(id => {
        const post = redditPosts[id];
        return `<article class="w-full m-0" aria-label="${escape(post.title)}"><shreddit-post id="t3_${id}" permalink="${permalink(id)}" post-title="${escape(post.title)}" author="${post.author}" comment-count="${total(post.comments) + total(post.more)}">`
            + `<a slot="full-post-link" href="${permalink(id)}"><faceplate-screen-reader-content>${escape(post.title)}</faceplate-screen-reader-content></a>`
            + `<a slot="title" href="${permalink(id)}">${escape(post.title)}</a></shreddit-post></article>`;
    }).join('');
}

function oldRows(ids: string[]): string {
    return ids.map(id => {
        const post = redditPosts[id];
        const href = post.fields?.is_self === false && typeof post.fields.url === 'string' ? post.fields.url : permalink(id);
        return `<div class="thing link" data-fullname="t3_${id}" data-permalink="${permalink(id)}"><p class="title"><a class="title" href="${href}">${escape(post.title)}</a></p>`
            + `<ul class="flat-list buttons"><li class="first"><a class="comments" href="${OLD_REDDIT}${permalink(id)}">${total(post.comments)} comments</a></li></ul></div>`;
    }).join('');
}

function respond(url: URL): FakeResponse {
    const old = url.origin === OLD_REDDIT;
    const thread = url.pathname.match(/^\/comments\/([a-z0-9]+)\.json$/);
    if (thread) {
        const post = redditPosts[thread[1]];
        if (!post) return json({ message: 'Not Found', error: 404 }, 404);
        if (post.status) return json({ reason: 'private', message: 'Forbidden', error: post.status }, post.status);
        const comments: Json[] = post.comments.map(comment => commentThing(comment, `t3_${thread[1]}`, 0));
        if (post.more?.length) comments.push(moreThing(post.more, `t3_${thread[1]}`));
        return json([listing([{ kind: 't3', data: postData(thread[1]) }]), listing(comments)]);
    }
    const deep = url.pathname.match(/^\/comments\/([a-z0-9]+)\/_\/([a-z0-9]+)\.json$/);
    if (deep) {
        const root = findComment([...(redditPosts[deep[1]]?.comments ?? []), ...(redditPosts[deep[1]]?.more ?? [])], deep[2]);
        if (!root) return json({ message: 'Not Found', error: 404 }, 404);
        const replies = (root.deep ?? []).map(reply => commentThing(reply, `t1_${root.id}`, 1));
        const thing = commentThing({ ...root, replies: [], deep: undefined, more: undefined }, 't3_x', 0);
        (thing.data as Json).replies = listing(replies);
        return json([listing([{ kind: 't3', data: postData(deep[1]) }]), listing([thing])]);
    }
    if (url.pathname === `/r/${redditFeed.subreddit}/hot.json`) return json(listing(redditFeed.ids.map(id => ({ kind: 't3', data: postData(id) }))));
    const byId = url.pathname.match(/^\/by_id\/t3_([a-z0-9]+)\.json$/);
    if (byId) return json(listing(redditPosts[byId[1]] && !redditPosts[byId[1]].status ? [{ kind: 't3', data: postData(byId[1]) }] : []));
    if (url.pathname === '/api/morechildren.json') {
        const held = heldBack();
        const things: Json[] = [];
        for (const id of (url.searchParams.get('children') ?? '').split(',')) {
            const entry = held.get(id);
            if (!entry) continue;
            // Flat, in tree order, each naming its parent.
            const flatten = (comment: RedditComment, parent: string) => {
                const thing = commentThing({ ...comment, replies: [] }, parent, 0);
                (thing.data as Json).replies = '';
                things.push(thing);
                for (const reply of comment.replies ?? []) flatten(reply, `t1_${comment.id}`);
            };
            flatten(entry.comment, entry.parent);
        }
        return json({ json: { errors: [], data: { things } } });
    }
    const postPage = url.pathname.match(/^\/(?:r\/[^/]+\/)?comments\/([a-z0-9]+)(?:\/.*)?$/);
    if (postPage && redditPosts[postPage[1]]) {
        const post = redditPosts[postPage[1]];
        const heading = old ? `<div class="top-matter"><p class="title"><a class="title" href="${permalink(postPage[1])}">${escape(post.title)}</a></p></div>`
            : `<shreddit-post post-title="${escape(post.title)}"><h1 slot="title">${escape(post.title)}</h1></shreddit-post>`;
        return page(html(`${post.title} : ${old ? '' : 'r/'}${post.subreddit}`, `<main>${heading}</main>`));
    }
    const feed = url.pathname.match(/^\/r\/([^/]+)(?:\/(?:hot|new|top))?\/?$/) ?? (url.pathname === '/' ? [url.pathname, redditFeed.subreddit] : null);
    if (feed && feed[1] === redditFeed.subreddit) {
        // A sidebar repeats a post; it must never get a checkbox.
        if (old) {
            const ad = `<div class="thing link promoted"><a class="title" href="https://ads.example/">Ad</a><a class="comments" href="${OLD_REDDIT}${permalink('abc003')}">0 comments</a></div>`;
            return page(html(`${redditFeed.subreddit}`, `<div class="side"><div class="thing link"><a class="comments" href="${OLD_REDDIT}${permalink('abc003')}">c</a><a class="title">Side</a></div></div><div id="siteTable">${ad}${oldRows(redditFeed.ids)}</div>`));
        }
        return page(html(`r/${redditFeed.subreddit}`, `<main><shreddit-feed>${shredditRows(redditFeed.ids)}</shreddit-feed></main><div id="right-sidebar-container">${shredditRows(['abc003'])}</div>`));
    }
    return page(html('Reddit', '<main>not found</main>'), 404);
}

export const reddit: FakeSite = { origins: [REDDIT, OLD_REDDIT], respond };

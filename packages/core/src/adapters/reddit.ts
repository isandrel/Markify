/**
 * Reddit JSON protocol: a post and its comment tree from `{post}.json`, then the
 * comments Reddit leaves out of that first response ("load more comments" and
 * "continue this thread"), within the profile's request budget. Comments the
 * budget or the site does not give are reported where they belong, never dropped
 * silently. Endpoints, templates and limits belong to the profile.
 */
import type { ApiConversionContext, HttpFetcher, SiteMetadata, ThreadState } from '../types';
import { interpolate } from '../config';
import { ConversionError, assertNotAborted } from '../errors';
import { renderTemplate } from '../markdown';
import { record, isRecord, textField, dateField, requestOptions, request, requireOk, pageDelay, type JsonRecord } from './protocol';

const DEFAULT_COMMENT = '**u/{author}** · {score} points · *{date}*\n\n{content}\n';
const DEFAULT_HEADER = '\n\n{delimiter}\n\n## Comments ({count})\n';
/** morechildren takes at most 100 ids a request. */
const MORE_BATCH = 100;

interface Comment { id: string; data: JsonRecord; replies: Node[] }
interface More { more: true; parent: string; ids: string[]; count: number; reason?: string }
type Node = Comment | More;
const isMore = (node: Node): node is More => 'more' in node;

function vars(config: JsonRecord, threadId: string, extra: Record<string, string | number> = {}) {
    return { base_url: String(record(config.site, 'site').base_url), thread_id: threadId, topic_id: threadId, ...extra };
}

function parseJson(text: string, stage: string): unknown {
    try { return JSON.parse(text); } catch { throw new ConversionError('INVALID_RESPONSE', `Malformed JSON during ${stage}`, { stage }); }
}

/** Children of a Listing (`{kind: 'Listing', data: {children}}`), or [] for Reddit's empty-string "no replies". */
function listing(value: unknown): JsonRecord[] {
    if (!isRecord(value) || !isRecord(value.data) || !Array.isArray(value.data.children)) return [];
    return value.data.children.filter(isRecord);
}

/** Comments and "more" stubs of a listing, as a tree; `index` maps fullnames (t1_…) to comments. */
function buildTree(things: JsonRecord[], index: Map<string, Comment>, parent: string): Node[] {
    const nodes: Node[] = [];
    for (const thing of things) {
        const data = isRecord(thing.data) ? thing.data : undefined;
        if (!data) continue;
        if (thing.kind === 't1' && typeof data.id === 'string') {
            const comment: Comment = { id: data.id, data, replies: [] };
            index.set(`t1_${data.id}`, comment);
            comment.replies = buildTree(listing(data.replies), index, `t1_${data.id}`);
            nodes.push(comment);
        } else if (thing.kind === 'more') {
            const ids = Array.isArray(data.children) ? data.children.filter((id): id is string => typeof id === 'string') : [];
            const count = typeof data.count === 'number' ? data.count : ids.length;
            nodes.push({ more: true, parent: typeof data.parent_id === 'string' ? data.parent_id : parent, ids, count });
        }
    }
    return nodes;
}

const count = (nodes: Node[]): number => nodes.reduce((total, node) => total + (isMore(node) ? 0 : 1 + count(node.replies)), 0);

/** Every unresolved stub with the list holding it, breadth first: top-level gaps before deep ones. */
function stubs(nodes: Node[]): Array<{ list: Node[]; stub: More }> {
    const found: Array<{ list: Node[]; stub: More }> = [];
    const queue: Node[][] = [nodes];
    while (queue.length) {
        const list = queue.shift()!;
        for (const node of list) {
            if (isMore(node)) { if (!node.reason) found.push({ list, stub: node }); } else queue.push(node.replies);
        }
    }
    return found;
}

/**
 * Replaces a stub with what Reddit returned for it. Things come flat, in tree
 * order, each naming its parent: the stub's parent takes them at the stub's place,
 * anything deeper goes under the comment it names.
 */
function splice(list: Node[], stub: More, things: JsonRecord[], index: Map<string, Comment>): void {
    const placed: Node[] = [];
    for (const thing of things) {
        const parentId = isRecord(thing.data) && typeof thing.data.parent_id === 'string' ? thing.data.parent_id : stub.parent;
        const [node] = buildTree([thing], index, parentId);
        if (!node) continue;
        const parent = parentId === stub.parent ? undefined : index.get(parentId);
        if (parent) parent.replies.push(node); else placed.push(node);
    }
    list.splice(list.indexOf(stub), 1, ...placed);
}

/** Markdown of a post's own content: self text, link, image, gallery, video, poll or crosspost. */
function postBody(post: JsonRecord): string {
    const media = isRecord(post.media_metadata) ? post.media_metadata : {};
    const mediaUrl = (id: string): string | undefined => {
        const item = media[id];
        if (!isRecord(item) || !isRecord(item.s)) return undefined;
        const url = item.s.u ?? item.s.gif ?? item.s.mp4;
        return typeof url === 'string' ? url : undefined;
    };
    const parts: string[] = [];
    if (typeof post.selftext === 'string' && post.selftext.trim()) {
        // Inline images in self posts reference media_metadata by id.
        parts.push(post.selftext.replace(/!\[([^\]]*)\]\(([A-Za-z0-9_|-]+)\)/g, (whole, alt: string, id: string) => {
            const url = mediaUrl(id);
            return url ? `![${alt}](${url})` : whole;
        }).trim());
    }
    const gallery = isRecord(post.gallery_data) && Array.isArray(post.gallery_data.items) ? post.gallery_data.items.filter(isRecord) : [];
    for (const item of gallery) {
        const url = typeof item.media_id === 'string' ? mediaUrl(item.media_id) : undefined;
        if (url) parts.push(`![${typeof item.caption === 'string' ? item.caption.replace(/[[\]]/g, '') : ''}](${url})`);
    }
    const video = isRecord(post.media) && isRecord(post.media.reddit_video) ? post.media.reddit_video.fallback_url : undefined;
    if (typeof video === 'string') parts.push(`[Video](${video})`);
    if (isRecord(post.poll_data) && Array.isArray(post.poll_data.options)) {
        parts.push(['**Poll:**', '', ...post.poll_data.options.filter(isRecord).map(option =>
            `- ${String(option.text ?? '')}${typeof option.vote_count === 'number' ? ` (${option.vote_count})` : ''}`)].join('\n'));
    }
    const url = typeof post.url_overridden_by_dest === 'string' ? post.url_overridden_by_dest : typeof post.url === 'string' ? post.url : undefined;
    if (!post.is_self && url && !gallery.length && typeof video !== 'string') {
        parts.push(post.post_hint === 'image' || /\.(?:png|jpe?g|gif|webp)(?:\?|$)/i.test(url) ? `![](${url})` : `[${url}](${url})`);
    }
    const crosspost = Array.isArray(post.crosspost_parent_list) ? post.crosspost_parent_list.find(isRecord) : undefined;
    if (crosspost) {
        const from = typeof crosspost.subreddit_name_prefixed === 'string' ? crosspost.subreddit_name_prefixed : 'another subreddit';
        const link = typeof crosspost.permalink === 'string' ? `https://www.reddit.com${crosspost.permalink}` : '';
        const body = postBody({ ...crosspost, crosspost_parent_list: undefined });
        parts.push(`> Crossposted from ${link ? `[${from}](${link})` : from}${body ? `\n>\n${body.split('\n').map(line => (line ? `> ${line}` : '>')).join('\n')}` : ''}`);
    }
    return parts.join('\n\n');
}

function profileTags(config: JsonRecord): string[] {
    return isRecord(config.metadata) && Array.isArray(config.metadata.tags) ? config.metadata.tags.filter((tag): tag is string => typeof tag === 'string') : [];
}

/** Reddit explains a refusal in its JSON body; that beats a bare status. */
function requirePost(response: { ok: boolean; status: number; text: string }, stage: string): void {
    if (response.ok) return;
    let reason: unknown;
    try { reason = (JSON.parse(response.text) as JsonRecord).reason; } catch { /* not JSON: a block page or an outage */ }
    const why: Record<string, string> = {
        private: 'The community is private',
        quarantined: 'The community is quarantined: open it on Reddit and opt in first',
        banned: 'The community is banned',
        gold_only: 'The community is for Reddit Premium members only',
    };
    if (typeof reason === 'string' && why[reason]) throw new ConversionError('ACCESS_DENIED', why[reason], { stage, status: response.status });
    requireOk(response, stage);
}

/** The post itself, from the first Listing of `{post}.json` or `by_id`. */
function postOf(value: unknown, stage: string): JsonRecord {
    const listings = Array.isArray(value) ? value : [value];
    const post = listing(listings[0]).find(thing => thing.kind === 't3');
    if (!post || !isRecord(post.data)) throw new ConversionError('API_REJECTED', 'Post not found, removed, or in a private or quarantined community', { stage });
    return post.data;
}

/** Comment count and nothing else: Reddit lists no last-activity time for a post. */
export async function fetchRedditThreadState(threadId: string, fetcher: HttpFetcher, config: JsonRecord, context: ApiConversionContext = {}): Promise<ThreadState> {
    const api = record(config.api, 'api');
    const response = await request(fetcher, interpolate(textField(api.json_endpoint, 'api.json_endpoint'), vars(config, threadId)), requestOptions(config, context), { stage: 'post' });
    requirePost(response, 'post');
    const post = postOf(parseJson(response.text, 'post'), 'post');
    return { replies: typeof post.num_comments === 'number' ? post.num_comments : undefined };
}

export async function fetchRedditContent(threadId: string, fetcher: HttpFetcher, config: JsonRecord, context: ApiConversionContext = {}): Promise<string> {
    const api = record(config.api, 'api');
    const options = requestOptions(config, context);
    const delimiter = typeof config.delimiter === 'string' ? config.delimiter : '---';
    const template = (key: string, fallback: string) => (isRecord(config[key]) && typeof config[key].template === 'string' ? config[key].template : fallback);
    const budget = typeof api.max_pages === 'number' ? api.max_pages : 20;

    context.onProgress?.('Fetching post');
    const response = await request(fetcher, interpolate(textField(api.thread_endpoint, 'api.thread_endpoint'), vars(config, threadId)), options, { stage: 'post' });
    requirePost(response, 'post');
    const parsed = parseJson(response.text, 'post');
    if (!Array.isArray(parsed) || parsed.length < 2) throw new ConversionError('INVALID_RESPONSE', 'Expected the post and its comments', { stage: 'post' });
    const post = postOf(parsed, 'post');
    const title = textField(post.title, 'post.title');
    const index = new Map<string, Comment>();
    const tree = buildTree(listing(parsed[1]), index, `t3_${threadId}`);

    // Fill in what the first response left out, top-level gaps first, within the budget.
    let requests = 0;
    for (let pending = stubs(tree); pending.length; pending = stubs(tree)) {
        const { list, stub } = pending[0];
        if (requests >= budget) {
            for (const entry of pending) entry.stub.reason = `over this export's limit of ${budget} extra requests`;
            break;
        }
        assertNotAborted(context.signal);
        await pageDelay(api, context.signal);
        requests++;
        try {
            if (stub.ids.length && typeof api.posts_endpoint === 'string') {
                // "load more comments": up to 100 ids a request; the rest stay a stub.
                const ids = stub.ids.slice(0, MORE_BATCH);
                context.onProgress?.(`Fetching more comments (${requests})`);
                const more = await request(fetcher, interpolate(api.posts_endpoint, vars(config, threadId, { children: ids.join(',') })), options, { stage: 'comments', page: requests });
                requireOk(more, 'comments');
                const body = parseJson(more.text, 'comments');
                const things = isRecord(body) && isRecord(body.json) && isRecord(body.json.data) && Array.isArray(body.json.data.things) ? body.json.data.things.filter(isRecord) : undefined;
                if (!things) throw new ConversionError('INVALID_RESPONSE', 'Unexpected "more comments" response', { stage: 'comments' });
                const rest: More | undefined = stub.ids.length > MORE_BATCH ? { ...stub, ids: stub.ids.slice(MORE_BATCH), count: Math.max(0, stub.count - ids.length) } : undefined;
                splice(list, stub, things, index);
                if (rest) list.push(rest);
            } else if (!stub.ids.length && stub.parent.startsWith('t1_') && typeof api.nested_endpoint === 'string') {
                // "continue this thread": the parent comment's own page holds its replies.
                context.onProgress?.(`Fetching a deeper thread (${requests})`);
                const deeper = await request(fetcher, interpolate(api.nested_endpoint, vars(config, threadId, { post_id: stub.parent.slice(3) })), options, { stage: 'thread', page: requests });
                requireOk(deeper, 'thread');
                const page = parseJson(deeper.text, 'thread');
                const root = Array.isArray(page) ? listing(page[1]).find(thing => thing.kind === 't1') : undefined;
                const replies = root && isRecord(root.data) ? listing(root.data.replies) : [];
                list.splice(list.indexOf(stub), 1, ...buildTree(replies, index, stub.parent));
            } else {
                stub.reason = 'not offered by Reddit';
            }
        } catch (error) {
            if (error instanceof ConversionError && error.code === 'ABORTED') throw error;
            stub.reason = error instanceof Error ? error.message : String(error);
        }
    }
    assertNotAborted(context.signal);

    const commentTemplate = template('comment', DEFAULT_COMMENT);
    const quote = (text: string, depth: number) => (depth ? text.split('\n').map(line => `${'> '.repeat(depth)}${line}`.trimEnd()).join('\n') : text);
    const render = (nodes: Node[], depth: number): string[] => nodes.flatMap(node => {
        if (isMore(node)) {
            const n = Math.max(node.count, node.ids.length, 1);
            return [quote(`*${n} more ${n === 1 ? 'reply' : 'replies'} not included (${node.reason ?? 'not loaded'}).*`, depth)];
        }
        const data = node.data;
        const entry = renderTemplate(commentTemplate, {
            author: typeof data.author === 'string' ? data.author : '[deleted]',
            score: typeof data.score === 'number' ? data.score : '',
            date: typeof data.created_utc === 'number' ? dateField(data.created_utc, 'comment.created_utc') : '',
            content: typeof data.body === 'string' ? data.body.trim() : '',
            delimiter,
        }).trim();
        return [quote(entry, depth), ...render(node.replies, depth + 1)];
    });
    const exported = count(tree);
    const parts = [postBody(post)];
    if (tree.length) parts.push(renderTemplate(template('comments_header', DEFAULT_HEADER), { count: exported, delimiter }).trim(), ...render(tree, 0));
    const markdown = parts.map(part => part.trim()).filter(Boolean).join('\n\n');

    const subreddit = typeof post.subreddit === 'string' ? post.subreddit : undefined;
    const flair = typeof post.link_flair_text === 'string' && post.link_flair_text.trim() ? post.link_flair_text.trim() : undefined;
    const metadata: Partial<SiteMetadata> = {
        title,
        tags: [...new Set([...profileTags(config), ...(subreddit ? [`r/${subreddit}`] : []), ...(flair ? [flair] : [])])],
    };
    if (typeof post.author === 'string') metadata.author = post.author;
    if (typeof post.created_utc === 'number') metadata.date = dateField(post.created_utc, 'post.created_utc');
    if (typeof post.score === 'number') metadata.score = post.score;
    if (typeof post.num_comments === 'number') metadata.replies = post.num_comments;
    if (post.over_18 === true) metadata.nsfw = true;
    context.onMetadata?.(metadata);
    return `${markdown}\n`;
}

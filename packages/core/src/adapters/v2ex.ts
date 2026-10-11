/**
 * V2EX: the public API (v1) for the topic, and the topic's web pages for what the
 * API leaves out or serves stale (supplements, tags, replies; 100 replies a page).
 * Endpoints, templates and limits belong to the profile.
 */
import type { ApiConversionContext, HttpFetcher, SiteMetadata, ThreadState } from '../types';
import { interpolate } from '../config';
import { ConversionError, assertNotAborted } from '../errors';
import { bodyToMarkdown, renderTemplate } from '../markdown';
import { record, isRecord, textField, numberField, dateField, requestOptions, request, requireOk, pageDelay, type JsonRecord } from './protocol';

const DEFAULT_COMMENT = '\n**#{index} {author}** · *{date}*\n\n{content}\n';
const DEFAULT_HEADER = '\n\n{delimiter}\n\n## Replies ({count})\n';
const DEFAULT_SUPPLEMENT = '\n\n### Supplement {index} · *{date}*\n\n{content}\n';

function endpoint(config: JsonRecord, key: string, threadId: string): string {
    const api = record(config.api, 'api');
    const site = record(config.site, 'site');
    return interpolate(textField(api[key], `api.${key}`), { base_url: String(site.base_url), thread_id: threadId, topic_id: threadId });
}

function parseList(text: string, stage: string): unknown[] {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new ConversionError('INVALID_RESPONSE', `Malformed JSON during ${stage}`, { stage }); }
    // The API answers a rate limit or a bad request with an object carrying a message.
    if (isRecord(parsed) && typeof parsed.message === 'string') throw new ConversionError('API_REJECTED', parsed.message, { stage });
    if (!Array.isArray(parsed)) throw new ConversionError('INVALID_RESPONSE', `Expected a list during ${stage}`, { stage });
    return parsed;
}

async function fetchTopic(threadId: string, fetcher: HttpFetcher, config: JsonRecord, context: ApiConversionContext): Promise<JsonRecord> {
    const response = await request(fetcher, endpoint(config, 'thread_endpoint', threadId), requestOptions(config, context), { stage: 'topic' });
    requireOk(response, 'topic');
    const [topic] = parseList(response.text, 'topic');
    // Deleted topics and topics in nodes that need a login both come back as [].
    if (!isRecord(topic)) throw new ConversionError('API_REJECTED', 'Topic not found, or it needs a login to view', { stage: 'topic' });
    return topic;
}

/** The topic's reply count and last activity, from the topic endpoint alone. */
export async function fetchV2exThreadState(threadId: string, fetcher: HttpFetcher, config: JsonRecord, context: ApiConversionContext = {}): Promise<ThreadState> {
    const topic = await fetchTopic(threadId, fetcher, config, context);
    return {
        replies: typeof topic.replies === 'number' ? topic.replies : undefined,
        updated: typeof topic.last_touched === 'number' ? dateField(topic.last_touched, 'topic.last_touched') : undefined,
    };
}

/**
 * Rendered HTML uses site-relative links (@mentions, nodes, stickers) and wraps
 * each image in a link to itself, which would export as `[![](x)](x)`.
 */
function absolute(html: string, base: string): string {
    return html
        .replace(/(\s(?:href|src)=")(\/\/|\/)/g, (_, attr: string, prefix: string) => `${attr}${prefix === '//' ? 'https://' : `${base}/`}`)
        .replace(/<a\b[^>]*\shref="([^"]+)"[^>]*>\s*(<img\b[^>]*\ssrc="([^"]+)"[^>]*>)\s*<\/a>/gi, (whole, href: string, image: string, src: string) => (href === src ? image : whole));
}

// Consecutive <br>s become lines of spaces; keep them as blank lines.
const html = (body: string, base: string) => bodyToMarkdown(absolute(body, base), 'html').replace(/^[ \t]+$/gm, '').trim();

/** The inside of the element whose opening tag ends at `start`, by counting nested divs. */
function innerDiv(source: string, start: number): string | undefined {
    const tag = /<(\/?)div\b[^>]*>/gi;
    tag.lastIndex = start;
    let depth = 1;
    for (let match = tag.exec(source); match; match = tag.exec(source)) {
        depth += match[1] ? -1 : 1;
        if (!depth) return source.slice(start, match.index);
    }
    return undefined;
}

/** One reply as the page shows it; `floor` is the number replies refer to as #N. */
export interface V2exReply { floor: number; author: string; date: string; html: string }
export interface V2exPageDetails { supplements: Array<{ date: string; html: string }>; tags: string[]; replies: V2exReply[]; pages: number }

const decode = (value: string) => { try { return decodeURIComponent(value); } catch { return value; } };

/** "2026-10-10 15:04:07 +08:00" → ISO; anything else is kept as shown. */
function stampDate(stamp: string | undefined): string {
    const time = stamp ? Date.parse(stamp) : NaN;
    return Number.isFinite(time) ? new Date(time).toISOString() : (stamp ?? '');
}

/** Each element opening with `opening`, as its inner HTML. */
function blocks(source: string, opening: RegExp): Array<{ match: RegExpExecArray; inner: string }> {
    const found: Array<{ match: RegExpExecArray; inner: string }> = [];
    for (let match = opening.exec(source); match; match = opening.exec(source)) {
        const inner = innerDiv(source, match.index + match[0].length);
        if (inner !== undefined) found.push({ match, inner });
    }
    return found;
}

function innerOf(block: string, opening: RegExp): string | undefined {
    const match = opening.exec(block);
    return match ? innerDiv(block, match.index + match[0].length) : undefined;
}

/**
 * One page of a topic: supplements (附言) and tags, which the API lacks, and its
 * replies (100 a page), which the API serves from a cache that can lag behind.
 */
export function parseV2exPage(source: string): V2exPageDetails {
    const supplements: V2exPageDetails['supplements'] = [];
    for (const { inner } of blocks(source, /<div class="subtle">/g)) {
        const body = innerOf(inner, /<div class="topic_content">/);
        if (body !== undefined) supplements.push({ date: stampDate(/<span title="([^"]+)"/.exec(inner)?.[1]), html: body });
    }
    const replies: V2exReply[] = [];
    for (const { inner } of blocks(source, /<div id="r_\d+" class="[^"]*\bcell\b[^"]*">/g)) {
        const body = innerOf(inner, /<div class="reply_content">/);
        const floor = Number(/<span class="no">(\d+)<\/span>/.exec(inner)?.[1]);
        if (body === undefined || !Number.isInteger(floor)) continue;
        const author = /<strong><a href="\/member\/([^"]+)"/.exec(inner)?.[1] ?? '';
        replies.push({ floor, author: decode(author), date: stampDate(/<span class="ago" title="([^"]+)"/.exec(inner)?.[1]), html: body });
    }
    const tags = [...source.matchAll(/<a href="\/tag\/([^"]+)" class="tag">/g)].map(([, name]) => decode(name));
    const pages = Number(/<input type="number" class="page_input"[^>]*\smax="(\d+)"/.exec(source)?.[1] ?? 1);
    return { supplements, tags: [...new Set(tags)], replies, pages: Number.isInteger(pages) && pages > 0 ? pages : 1 };
}

/** Every reply from the topic's pages, or a reason the pages could not give them. */
async function pageReplies(threadId: string, fetcher: HttpFetcher, config: JsonRecord, context: ApiConversionContext): Promise<{ first?: V2exPageDetails; replies?: V2exReply[]; error?: string }> {
    const api = record(config.api, 'api');
    const options = { ...requestOptions(config, context), headers: { Accept: 'text/html' } };
    const maxPages = typeof api.max_pages === 'number' ? api.max_pages : 100;
    const load = async (page: number) => {
        context.onProgress?.(`Fetching topic page ${page}`);
        const url = interpolate(textField(api.html_endpoint, 'api.html_endpoint'), { base_url: String(record(config.site, 'site').base_url), thread_id: threadId, topic_id: threadId, page });
        const response = await request(fetcher, url, options, { stage: 'page', page });
        requireOk(response, 'page');
        return parseV2exPage(response.text);
    };
    let first: V2exPageDetails;
    try { first = await load(1); } catch (error) {
        if (error instanceof ConversionError && error.code === 'ABORTED') throw error;
        return { error: error instanceof Error ? error.message : String(error) };
    }
    if (first.pages > maxPages) throw new ConversionError('PAGE_LIMIT', `Topic has ${first.pages} pages; the limit is ${maxPages}`, { stage: 'page', page: maxPages });
    const byFloor = new Map(first.replies.map(reply => [reply.floor, reply]));
    // A later page that fails fails the export: a partial reply list would look complete.
    for (let page = 2; page <= first.pages; page++) {
        await pageDelay(api, context.signal);
        for (const reply of (await load(page)).replies) byFloor.set(reply.floor, reply);
    }
    return { first, replies: [...byFloor.values()].sort((a, b) => a.floor - b.floor) };
}

/** Replies from the API, oldest first, numbered in order; the fallback when the pages give none. */
async function apiReplies(threadId: string, fetcher: HttpFetcher, config: JsonRecord, context: ApiConversionContext): Promise<V2exReply[]> {
    context.onProgress?.('Fetching replies');
    const response = await request(fetcher, endpoint(config, 'posts_endpoint', threadId), requestOptions(config, context), { stage: 'replies' });
    requireOk(response, 'replies');
    const replies = parseList(response.text, 'replies').filter(isRecord).sort((a, b) => Number(a.created) - Number(b.created));
    return replies.map((reply, index) => ({
        floor: index + 1,
        author: isRecord(reply.member) && typeof reply.member.username === 'string' ? reply.member.username : '',
        date: dateField(reply.created, 'reply.created'),
        html: typeof reply.content_rendered === 'string' ? reply.content_rendered : '',
    }));
}

/**
 * Topic body, supplements, then every reply numbered by floor (#1, #2, … as
 * replies refer to each other). The frontmatter comes from the reported metadata.
 * Replies come from the topic's pages, which are always current; the replies API
 * is only the fallback when the pages can't be read.
 */
export async function fetchV2exContent(threadId: string, fetcher: HttpFetcher, config: JsonRecord, context: ApiConversionContext = {}): Promise<string> {
    const api = record(config.api, 'api');
    const base = String(record(config.site, 'site').base_url);
    const template = (key: string, fallback: string) => (isRecord(config[key]) && typeof config[key].template === 'string' ? config[key].template : fallback);
    const delimiter = typeof config.delimiter === 'string' ? config.delimiter : '---';

    context.onProgress?.('Fetching topic');
    const topic = await fetchTopic(threadId, fetcher, config, context);
    const title = textField(topic.title, 'topic.title');
    const replyCount = numberField(topic.replies ?? 0, 'topic.replies');

    const notes: string[] = [];
    let page: V2exPageDetails | undefined;
    let replies: V2exReply[] | undefined;
    if (typeof api.html_endpoint === 'string') {
        assertNotAborted(context.signal);
        const result = await pageReplies(threadId, fetcher, config, context);
        page = result.first;
        replies = result.replies;
        // Visible, not silent: supplements can carry the topic's most important update.
        if (result.error) notes.push(`> *The topic page could not be loaded (${result.error}): supplements are missing, and replies come from the API, which can lag behind the site.*`);
        // The page showing no replies to a topic that has some means its layout changed.
        else if (!replies?.length && replyCount > 0) { replies = undefined; notes.push('> *No replies were found on the topic page; they come from the API, which can lag behind the site.*'); }
    }
    if (!replies && replyCount > 0) replies = await apiReplies(threadId, fetcher, config, context);
    assertNotAborted(context.signal);

    const author = isRecord(topic.member) && typeof topic.member.username === 'string' ? topic.member.username : undefined;
    const node = isRecord(topic.node) && typeof topic.node.title === 'string' ? topic.node.title : undefined;
    // Each block is trimmed and joined by a blank line: TOML drops a template's leading newline.
    const parts = [typeof topic.content_rendered === 'string' ? html(topic.content_rendered, base) : ''];
    page?.supplements.forEach((supplement, index) => parts.push(renderTemplate(template('supplement', DEFAULT_SUPPLEMENT), {
        index: index + 1, date: supplement.date, content: html(supplement.html, base), delimiter,
    })));
    parts.push(...notes);
    if (replies?.length) {
        parts.push(renderTemplate(template('comments_header', DEFAULT_HEADER), { count: replies.length, delimiter }));
        for (const reply of replies) parts.push(renderTemplate(template('comment', DEFAULT_COMMENT), {
            index: reply.floor, author: reply.author, date: reply.date, content: html(reply.html, base), delimiter,
        }));
    }
    const markdown = parts.map(part => part.trim()).filter(Boolean).join('\n\n');

    const profileTags = isRecord(config.metadata) && Array.isArray(config.metadata.tags) ? config.metadata.tags.filter((tag): tag is string => typeof tag === 'string') : [];
    const metadata: Partial<SiteMetadata> = {
        title,
        tags: [...new Set([...profileTags, ...(node ? [node] : []), ...(page?.tags ?? [])])],
        replies: replyCount,
    };
    if (author) metadata.author = author;
    if (typeof topic.created === 'number') metadata.date = dateField(topic.created, 'topic.created');
    if (typeof topic.last_touched === 'number') metadata.updated = dateField(topic.last_touched, 'topic.last_touched');
    context.onMetadata?.(metadata);
    return `${markdown}\n`;
}

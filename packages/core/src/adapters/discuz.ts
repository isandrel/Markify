/**
 * Discuz! X forums (Hostloc, 恩山, 卡饭, …): every page of a thread, read from
 * the thread's own HTML, which every Discuz! site serves (its mobile JSON API
 * is often switched off). The page layout is Discuz!'s standard one: post blocks
 * `#post_{pid}`, bodies `td.t_f#postmessage_{pid}`, floors, "发表于" times and
 * "共 N 页". Endpoints, time zone, templates and limits belong to the profile.
 */
import type { ApiConversionContext, HttpFetcher, SiteMetadata, ThreadState } from '../types';
import { interpolate } from '../config';
import { ConversionError, assertNotAborted } from '../errors';
import { bodyToMarkdown, renderTemplate } from '../markdown';
import { record, isRecord, textField, requestOptions, request, requireOk, pageDelay, type JsonRecord } from './protocol';

const DEFAULT_COMMENT = '**#{index} {author}** · *{date}*\n\n{content}\n';
const DEFAULT_HEADER = '{delimiter}\n\n## Replies ({count})\n';

/** One post as the page shows it. */
export interface DiscuzPost { pid: string; floor: number; author: string; date: string; html: string }
export interface DiscuzPage {
    title?: string;
    /** The board the thread is in (breadcrumb). */
    forum?: string;
    tags: string[];
    views?: number;
    replies?: number;
    pages: number;
    posts: DiscuzPost[];
}

/** The inside of the element whose opening tag ends at `start`, counting nested tags of the same name. */
function inner(source: string, start: number, tag: string): string | undefined {
    const pattern = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    pattern.lastIndex = start;
    let depth = 1;
    for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
        depth += match[1] ? -1 : 1;
        if (!depth) return source.slice(start, match.index);
    }
    return undefined;
}

/** Removes every element opening with `opening` (and its contents). */
function removeAll(source: string, opening: RegExp, tag: string): string {
    let out = source;
    for (let match = opening.exec(out); match; match = opening.exec(out)) {
        const body = inner(out, match.index + match[0].length, tag);
        if (body === undefined) break;
        const end = out.indexOf('>', match.index + match[0].length + body.length) + 1;
        out = out.slice(0, match.index) + out.slice(end);
        opening.lastIndex = match.index;
    }
    return out;
}

const decodeEntities = (text: string) => text
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code))).replace(/&amp;/g, '&');
const textOf = (html: string) => decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

/**
 * "2026-10-15 12:58" or "2022-5-5 21:44:42", in the forum's time zone, to ISO.
 * Anything else ("昨天 12:58", "3 天前") is kept as the site showed it.
 */
export function parseForumDate(text: string, utcOffset = '+08:00'): string {
    const match = /(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(text);
    if (!match) return text.trim();
    const [, y, mo, d, h = '0', mi = '0', s = '0'] = match;
    const pad = (value: string) => value.padStart(2, '0');
    const time = Date.parse(`${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}${utcOffset}`);
    return Number.isFinite(time) ? new Date(time).toISOString() : text.trim();
}

/** Post bodies use lazy images, code blocks, anti-copy noise and hidden pop-ups; make them plain HTML. */
function cleanBody(html: string, pageUrl: string): string {
    let body = html
        .replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
        // Anti-copy noise some forums insert between words.
        .replace(/<font class="jammer">[\s\S]*?<\/font>/gi, '')
        .replace(/<span style="display:\s*none">[\s\S]*?<\/span>/gi, '')
        .replace(/<\/?ignore_js_op>/gi, '');
    // Download/zoom pop-ups beside attachments.
    body = removeAll(body, /<div[^>]*class="tip tip_4[^"]*"[^>]*>/gi, 'div');
    body = removeAll(body, /<div[^>]*style="display:\s*none;?"[^>]*>/gi, 'div');
    // [code]: one <li> per line.
    body = body.replace(/<div class="blockcode">([\s\S]*?)<em[^>]*>[^<]*<\/em>\s*<\/div>/gi, (_, code: string) => {
        const lines = [...code.matchAll(/<li>([\s\S]*?)(?=<li>|<\/ol>)/gi)].map(([, line]) => decodeEntities(line.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '')).replace(/\s+$/, ''));
        return `<pre><code>${lines.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code></pre>`;
    });
    // Smilies would become noise images.
    body = body.replace(/<img[^>]*\ssmilieid="[^"]*"[^>]*>/gi, '');
    // Lazy images: the real file is in zoomfile/file; src is a placeholder.
    body = body.replace(/<img\b[^>]*>/gi, image => {
        const real = /\szoomfile="([^"]+)"/i.exec(image)?.[1] ?? /\sfile="([^"]+)"/i.exec(image)?.[1];
        return real ? image.replace(/\ssrc="[^"]*"/i, '').replace(/^<img/i, `<img src="${real}"`) : image;
    });
    // Site-relative links and images, against the page they came from.
    return body.replace(/(\s(?:href|src)=")([^"]+)"/gi, (whole, attr: string, url: string) => {
        if (/^(?:[a-z]+:|#)/i.test(url)) return whole;
        try { return `${attr}${new URL(decodeEntities(url), pageUrl).href}"`; } catch { return whole; }
    });
}

/** One thread page. Throws the forum's own message when it shows one instead (no permission, rate limit, deleted). */
export function parseDiscuzPage(source: string, pageUrl: string, utcOffset?: string): DiscuzPage {
    const notice = /<div id="messagetext"[^>]*>([\s\S]*?)<\/div>/i.exec(source);
    if (notice && !/id="postlist"/.test(source)) {
        const message = textOf(/<p>([\s\S]*?)<\/p>/i.exec(notice[1])?.[1] ?? notice[1]) || 'The forum refused the page';
        throw new ConversionError('ACCESS_DENIED', message, { stage: 'thread' });
    }
    const posts: DiscuzPost[] = [];
    // A post runs to the next one: templates and signatures leave divs unclosed, so their nesting can't be trusted.
    const starts = [...source.matchAll(/<div id="post_(\d+)"[^>]*>/g)];
    for (const [index, match] of starts.entries()) {
        const pid = match[1];
        const end = starts[index + 1]?.index ?? source.indexOf('id="postlistreply"', match.index!);
        const block = source.slice(match.index! + match[0].length, end > match.index! ? end : undefined);
        const message = new RegExp(`<td[^>]*id="postmessage_${pid}"[^>]*>`, 'i').exec(block);
        let html = message ? inner(block, message.index + message[0].length, 'td') ?? '' : '';
        // A post hidden by a moderator, or behind a reading permission, shows a notice instead.
        if (!message) html = /<div class="locked">([\s\S]*?)<\/div>/i.exec(block)?.[1] ?? '';
        // Attachments listed under the post body.
        const attachments = /<div class="pattl">/i.exec(block);
        if (attachments) html += inner(block, attachments.index + attachments[0].length, 'div') ?? '';
        const floor = Number(new RegExp(`id="postnum${pid}"[^>]*>\\s*<em>(\\d+)</em>`, 'i').exec(block)?.[1]);
        const authorBlock = /id="favatar\d+"[\s\S]*?<div class="authi">([\s\S]*?)<\/div>/i.exec(block)?.[1];
        const posted = new RegExp(`<em id="authorposton${pid}">([\\s\\S]*?)</em>`, 'i').exec(block)?.[1] ?? '';
        const stamp = /<span title="([^"]+)"/i.exec(posted)?.[1] ?? textOf(posted).replace(/^发表于\s*/, '');
        posts.push({
            pid, floor: Number.isInteger(floor) && floor > 0 ? floor : 0,
            author: authorBlock ? textOf(authorBlock) : '',
            date: parseForumDate(stamp, utcOffset),
            html: cleanBody(html, pageUrl),
        });
    }
    const crumbs = /<div id="pt"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i.exec(source)?.[1] ?? '';
    const boards = [...crumbs.matchAll(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].filter(([, href]) => /forum-\d+-\d+\.html|mod=forumdisplay/.test(href));
    const count = (label: string) => {
        const value = new RegExp(`${label}:?</span>\\s*<span[^>]*>\\s*(\\d+)`).exec(source)?.[1];
        return value ? Number(value) : undefined;
    };
    const pageCount = Number(/title="共\s*(\d+)\s*页"/.exec(source)?.[1] ?? 1);
    return {
        title: (() => { const raw = /<span id="thread_subject"[^>]*>([\s\S]*?)<\/span>/i.exec(source)?.[1]; return raw ? textOf(raw) : undefined; })(),
        forum: boards.length ? textOf(boards[boards.length - 1][2]) : undefined,
        tags: [...new Set([...(/<div class="ptg[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(source)?.[1] ?? '').matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)].map(([, tag]) => textOf(tag)).filter(Boolean))],
        views: count('查看'),
        replies: count('回复'),
        pages: Number.isInteger(pageCount) && pageCount > 0 ? pageCount : 1,
        posts,
    };
}

function profileOf(config: JsonRecord) {
    const api = record(config.api, 'api');
    const metadata = isRecord(config.metadata) ? config.metadata : {};
    return {
        api,
        endpoint: textField(api.html_endpoint, 'api.html_endpoint'),
        base: String(record(config.site, 'site').base_url),
        offset: typeof metadata.utc_offset === 'string' ? metadata.utc_offset : '+08:00',
        tags: Array.isArray(metadata.tags) ? metadata.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    };
}

async function loadPage(threadId: string, page: number, fetcher: HttpFetcher, config: JsonRecord, context: ApiConversionContext): Promise<DiscuzPage> {
    const { endpoint, base, offset } = profileOf(config);
    const url = interpolate(endpoint, { base_url: base, thread_id: threadId, topic_id: threadId, page });
    const options = requestOptions(config, context);
    const response = await request(fetcher, url, { ...options, headers: { Accept: 'text/html' } }, { stage: 'thread', page });
    requireOk(response, 'thread');
    return parseDiscuzPage(response.text, url, offset);
}

/** The reply count from the first page; Discuz! shows no thread-wide last-reply time there. */
export async function fetchDiscuzThreadState(threadId: string, fetcher: HttpFetcher, config: JsonRecord, context: ApiConversionContext = {}): Promise<ThreadState> {
    const first = await loadPage(threadId, 1, fetcher, config, context);
    return { replies: first.replies };
}

export async function fetchDiscuzContent(threadId: string, fetcher: HttpFetcher, config: JsonRecord, context: ApiConversionContext = {}): Promise<string> {
    const { api, tags } = profileOf(config);
    const delimiter = typeof config.delimiter === 'string' ? config.delimiter : '---';
    const template = (key: string, fallback: string) => (isRecord(config[key]) && typeof config[key].template === 'string' ? config[key].template : fallback);
    const maxPages = typeof api.max_pages === 'number' ? api.max_pages : 100;

    context.onProgress?.('Fetching thread page 1');
    const first = await loadPage(threadId, 1, fetcher, config, context);
    if (!first.posts.length) throw new ConversionError('INCOMPLETE_CONTENT', 'No posts found on the thread page', { stage: 'thread', page: 1 });
    if (first.pages > maxPages) throw new ConversionError('PAGE_LIMIT', `Thread has ${first.pages} pages; the limit is ${maxPages}`, { stage: 'thread', page: maxPages });
    const posts = new Map(first.posts.map(post => [post.pid, post]));
    // Every page or none: a missing page would look like a complete thread.
    for (let page = 2; page <= first.pages; page++) {
        await pageDelay(api, context.signal);
        assertNotAborted(context.signal);
        context.onProgress?.(`Fetching thread page ${page} of ${first.pages}`);
        for (const post of (await loadPage(threadId, page, fetcher, config, context)).posts) posts.set(post.pid, post);
    }
    // Floors from the page; a template without them falls back to page order.
    const ordered = [...posts.values()].map((post, index) => ({ ...post, floor: post.floor || index + 1 })).sort((a, b) => a.floor - b.floor);
    const [opening, ...replies] = ordered;

    const parts = [bodyToMarkdown(opening.html, 'html').trim()];
    if (replies.length) {
        parts.push(renderTemplate(template('comments_header', DEFAULT_HEADER), { count: replies.length, delimiter }).trim());
        for (const reply of replies) parts.push(renderTemplate(template('comment', DEFAULT_COMMENT), {
            index: reply.floor, author: reply.author, date: reply.date, content: bodyToMarkdown(reply.html, 'html').trim(), delimiter,
        }).trim());
    }
    // <br> leaves hard-break spaces at the end of paragraphs, where they mean nothing.
    const markdown = parts.map(part => part.replace(/^[ \t]+$/gm, '').replace(/[ \t]+(?=\n\n|\n?$)/g, '').replace(/\n{3,}/g, '\n\n').trim()).filter(Boolean).join('\n\n');

    const metadata: Partial<SiteMetadata> = {
        tags: [...new Set([...tags, ...(first.forum ? [first.forum] : []), ...first.tags])],
    };
    if (first.title) metadata.title = first.title;
    if (opening.author) metadata.author = opening.author;
    if (opening.date) metadata.date = opening.date;
    if (typeof first.views === 'number') metadata.views = first.views;
    metadata.replies = first.replies ?? replies.length;
    const last = ordered[ordered.length - 1];
    if (/^\d{4}-\d{2}-\d{2}T/.test(last.date)) metadata.updated = last.date;
    context.onMetadata?.(metadata);
    return `${markdown}\n`;
}

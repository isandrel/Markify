/** Configured forum JSON protocol. Site endpoints and mappings live in profiles. */
import type { SiteAdapter } from './base';
import type { ApiConversionContext, HttpFetcher } from '../types';
import { getAdapterConfig, interpolate } from '../config';
import { classifyRoute } from './routes';
import { ConversionError, assertNotAborted } from '../errors';
import { bodyToMarkdown, renderFrontmatter, renderTemplate } from '../markdown';
import {
    field, readPath, record, textField, numberField, dateField, parseJson,
    requestOptions, request, requireOk, pageDelay, type JsonRecord,
} from './protocol';

/** Compatibility export; dynamic registry uses the same protocol for every profile. */
export const onePoint3AcresAdapter: SiteAdapter = {
    name: '1Point3Acres',
    get urlPatterns() { return getAdapterConfig('1point3acres')?.activation.matches ?? []; },
    matchesUrl(url) {
        const config = getAdapterConfig('1point3acres');
        return !!config && classifyRoute(url, config)?.kind === 'thread';
    },
    hasApi: true,
    includesFrontmatter: true,
    async fetchViaApi(url, fetcher, override, context) {
        const config = override ?? getAdapterConfig('1point3acres');
        if (!config) throw new ConversionError('CONFIG_INVALID', 'Missing forum profile');
        const route = classifyRoute(url, config as import('../config').AdapterConfig);
        if (route?.kind !== 'thread' || !route.id) throw new ConversionError('UNSUPPORTED_ROUTE', 'Expected a thread route');
        return fetchForumApiContent(route.id, fetcher, config, context?.onProgress, context);
    },
};

/**
 * Exports only after every page validates and pagination terminates. Reply totals
 * are metadata, not a stopping condition: nested replies can affect their meaning.
 * The optional fourth callback is retained for existing callers.
 */
export async function fetchForumApiContent(
    threadId: string,
    fetcher: HttpFetcher,
    config: Record<string, unknown>,
    onProgress?: (message: string) => void,
    context: ApiConversionContext = {},
): Promise<string> {
    const api = record(config.api, 'api');
    const fields = record(api.fields, 'api.fields');
    const postFields = record(fields.post, 'api.fields.post');
    const responseConfig = record(api.response, 'api.response');
    const options = requestOptions(config, context);
    const progress = onProgress ?? context.onProgress;
    const endpoint = textField(api.thread_endpoint, 'api.thread_endpoint');
    const response = await request(fetcher, interpolate(endpoint, { thread_id: threadId }), options, { stage: 'thread' });
    requireOk(response, 'thread');
    const parsed = parseJson(response.text, responseConfig, 'thread');
    const dataPath = textField(responseConfig.data_field, 'api.response.data_field');
    const thread = record(readPath(parsed, dataPath), dataPath);
    const title = textField(field(thread, 'title', fields), 'thread.title');
    const author = textField(field(thread, 'author', fields), 'thread.author');
    const content = textField(field(thread, 'content', fields), 'thread.content');
    const postedAt = dateField(field(thread, 'posted_at', fields), 'thread.posted_at');
    const updatedAt = dateField(field(thread, 'updated_at', fields), 'thread.updated_at');
    const views = numberField(field(thread, 'views', fields), 'thread.views');
    const replies = numberField(field(thread, 'replies', fields), 'thread.replies');
    const favorites = numberField(field(thread, 'favorites', fields) ?? 0, 'thread.favorites');
    const format = textField(api.content_format, 'api.content_format');
    const delimiter = typeof config.delimiter === 'string' ? config.delimiter : '---';
    const metadata = record(config.metadata, 'metadata');
    const site = record(config.site, 'site');
    const source = interpolate(textField(metadata.source_url, 'metadata.source_url'), {
        thread_id: threadId, base_url: String(site.base_url),
    });
    const allPosts: JsonRecord[] = [];
    const seen = new Set<string>();
    const signatures = new Set<string>();
    let complete = replies === 0;
    let pageCount = 0;

    if (replies > 0) {
        const maxPages = numberField(api.max_pages, 'api.max_pages');
        const pageSize = numberField(api.page_size, 'api.page_size');
        if (!Number.isInteger(maxPages) || maxPages < 1 || !Number.isInteger(pageSize) || pageSize < 1) throw new ConversionError('CONFIG_INVALID', 'Pagination limits must be positive integers');
        const postsEndpoint = textField(api.posts_endpoint, 'api.posts_endpoint');
        const postsPath = textField(responseConfig.posts_field, 'api.response.posts_field');
        for (let page = 1; page <= maxPages; page++) {
            assertNotAborted(context.signal);
            progress?.(`Fetching comments page ${page}`);
            const url = interpolate(postsEndpoint, {
                thread_id: threadId, page_size: pageSize, order: String(api.order), page,
            });
            const postsResponse = await request(fetcher, url, options, { stage: 'comments', page });
            requireOk(postsResponse, 'comments');
            const pageData = parseJson(postsResponse.text, responseConfig, 'comments');
            const posts = readPath(pageData, postsPath);
            if (!Array.isArray(posts)) throw new ConversionError('INVALID_RESPONSE', `Expected array at ${postsPath}`, { stage: 'comments', page });
            const ids: string[] = [];
            let newCount = 0;
            for (const value of posts) {
                const post = record(value, 'post');
                const id = field(post, 'id', postFields);
                if ((typeof id !== 'string' && typeof id !== 'number') || String(id) === '') throw new ConversionError('INVALID_RESPONSE', 'Missing post ID', { stage: 'comments', page });
                const key = String(id);
                ids.push(key);
                if (!seen.has(key)) { seen.add(key); allPosts.push(post); newCount++; }
            }
            const signature = JSON.stringify(ids);
            if (posts.length && (signatures.has(signature) || newCount === 0)) throw new ConversionError('REPEATED_PAGE', 'Comments pagination returned no new posts', { stage: 'comments', page });
            signatures.add(signature);
            pageCount = page;
            // Offset pagination ends on a short or empty page, independent of reply totals.
            if (posts.length < pageSize) { complete = true; break; }
            if (page < maxPages) await pageDelay(api, context.signal);
        }
        if (!complete) throw new ConversionError('PAGE_LIMIT', 'Comments page limit reached before a terminal page', { stage: 'comments', page: pageCount });
    }
    assertNotAborted(context.signal);
    let comments = '';
    if (allPosts.length) {
        const commentTemplate = textField(record(config.comment, 'comment').template, 'comment.template');
        const headerTemplate = textField(record(config.comments_header, 'comments_header').template, 'comments_header.template');
        comments = renderTemplate(headerTemplate, { count: allPosts.length, delimiter });
        if (api.order === 'time_desc') allPosts.reverse();
        allPosts.forEach((post, index) => {
            comments += renderTemplate(commentTemplate, {
                author: textField(field(post, 'author', postFields), 'post.author'),
                date: dateField(field(post, 'posted_at', postFields), 'post.posted_at'),
                content: bodyToMarkdown(textField(field(post, 'content', postFields), 'post.content'), format),
                index: index + 1, delimiter,
            });
        });
    }
    const downloadedAt = new Date().toISOString();
    const values = {
        title, author, posted_at: postedAt, updated_at: updatedAt, downloaded_at: downloadedAt,
        url: `[${title.replace(/([\[\]])/g, '\\$1')}](${source})`,
        views, replies, favorites,
    };
    const frontmatter = renderFrontmatter(textField(record(config.frontmatter, 'frontmatter').template, 'frontmatter.template'), values);
    const result = renderTemplate(textField(record(config.document, 'document').template, 'document.template'), {
        ...values, frontmatter, content: bodyToMarkdown(content, format), comments, delimiter, date: postedAt,
    });
    context.onMetadata?.({
        title, author, id: threadId, source, date: postedAt, downloaded: downloadedAt,
        commentsExported: allPosts.length, commentsPages: pageCount,
    });
    return result;
}

export { fetchForumApiContent as fetch1Point3AcresContent };

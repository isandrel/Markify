/** Discourse raw Markdown protocol; endpoints and limits belong to the profile. */
import type { SiteAdapter } from './base';
import type { ApiConversionContext, HttpFetcher } from '../types';
import { getAdapterConfig, interpolate } from '../config';
import { classifyRoute } from './routes';
import { pageTitle } from './title';
import { ConversionError, assertNotAborted } from '../errors';
import { record, isRecord, textField, numberField, requestOptions, request, requireOk, pageDelay, fetchHttpFetcher, type JsonRecord } from './protocol';
import { discourseToMarkdown } from './discourse-markdown';
import type { SiteMetadata } from '../types';

/** Compatibility export. Matching is compiled from the current profile. */
export const usCardForumAdapter: SiteAdapter = {
    name: 'US Card Forum',
    get urlPatterns() { return getAdapterConfig('uscardforum')?.activation.matches ?? []; },
    matchesUrl(url) {
        const config = getAdapterConfig('uscardforum');
        return !!config && classifyRoute(url, config)?.kind === 'thread';
    },
    hasApi: true,
    extractMetadata(doc, url) {
        const config = getAdapterConfig('uscardforum');
        return { title: config ? pageTitle(doc, config) : doc.title, url, tags: config?.metadata?.tags };
    },
    async fetchViaApi(url, fetcher, override, context) {
        const config = override ?? getAdapterConfig('uscardforum');
        if (!config) throw new ConversionError('CONFIG_INVALID', 'Missing Discourse profile');
        const route = classifyRoute(url, config as import('../config').AdapterConfig);
        if (route?.kind !== 'thread' || !route.id) throw new ConversionError('UNSUPPORTED_ROUTE', 'Expected a thread route');
        return fetchDiscourseRawContent(route.id, fetcher, config, context);
    },
};

/**
 * Title, author, date, topic tags and counts from the topic JSON (`api.json_endpoint`).
 * Best effort: the raw pages are the export, so a failure here only costs metadata.
 */
async function topicMetadata(topicId: string, fetcher: HttpFetcher, config: Record<string, unknown>, options: ReturnType<typeof requestOptions>): Promise<Partial<SiteMetadata>> {
    const api = record(config.api, 'api');
    const site = record(config.site, 'site');
    if (typeof api.json_endpoint !== 'string') return {};
    try {
        const url = interpolate(api.json_endpoint, { base_url: String(site.base_url), topic_id: topicId });
        const response = await request(fetcher, url, { ...options, headers: { ...options.headers, Accept: 'application/json' } }, { stage: 'topic-json' });
        if (!response.ok) return {};
        const topic = JSON.parse(response.text) as JsonRecord;
        const metadata: Partial<SiteMetadata> = {};
        if (typeof topic.title === 'string' && topic.title.trim()) metadata.title = topic.title;
        const creator = isRecord(topic.details) && isRecord(topic.details.created_by) ? topic.details.created_by.username : undefined;
        if (typeof creator === 'string') metadata.author = creator;
        if (typeof topic.created_at === 'string') metadata.date = topic.created_at;
        // Newer Discourse versions send tags as objects.
        const tags = Array.isArray(topic.tags) ? topic.tags.map(tag => (isRecord(tag) ? tag.name : tag)).filter((tag): tag is string => typeof tag === 'string' && !!tag) : [];
        const profileTags = isRecord(config.metadata) && Array.isArray(config.metadata.tags) ? config.metadata.tags.filter((tag): tag is string => typeof tag === 'string') : [];
        if (tags.length) metadata.tags = [...new Set([...profileTags, ...tags])];
        if (typeof topic.views === 'number') metadata.views = topic.views;
        if (typeof topic.posts_count === 'number') metadata.replies = Math.max(0, topic.posts_count - 1);
        if (typeof topic.like_count === 'number') metadata.likes = topic.like_count;
        return metadata;
    } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError' || (error as { code?: string })?.code === 'ABORTED') throw error;
        return {};
    }
}

/**
 * Discourse PostsController#markdown_for_topic returns an empty successful body
 * when the requested page has no visible posts. An HTTP failure is not that signal.
 */
export async function fetchDiscourseRawContent(
    topicId: string,
    fetcher: HttpFetcher | undefined,
    config: Record<string, unknown>,
    context: ApiConversionContext = {},
): Promise<string> {
    const api = record(config.api, 'api');
    const site = record(config.site, 'site');
    const rawEndpoint = textField(api.raw_endpoint, 'api.raw_endpoint');
    const maxPages = numberField(api.max_pages, 'api.max_pages');
    const options = requestOptions(config, context);
    const separator = typeof config.page_separator === 'string' ? config.page_separator : '\n\n---\n\n';
    const pages: string[] = [];
    const seen = new Set<string>();
    const baseUrl = String(site.base_url);
    if (context.onMetadata) {
        context.onProgress?.('Fetching topic details');
        const metadata = await topicMetadata(topicId, fetcher ?? fetchHttpFetcher, config, options);
        if (Object.keys(metadata).length) context.onMetadata(metadata);
    }
    for (let page = 1; page <= maxPages; page++) {
        assertNotAborted(context.signal);
        context.onProgress?.(`Fetching topic page ${page}`);
        const url = interpolate(rawEndpoint, { base_url: baseUrl, topic_id: topicId, page });
        const response = await request(fetcher ?? fetchHttpFetcher, url, options, { stage: 'topic', page });
        requireOk(response, 'topic');
        if (!response.text.trim()) {
            if (!pages.length) throw new ConversionError('INCOMPLETE_CONTENT', 'Topic response contains no content', { stage: 'topic', page });
            return pages.map(text => discourseToMarkdown(text, baseUrl)).join(separator);
        }
        if (seen.has(response.text)) throw new ConversionError('REPEATED_PAGE', 'Topic pagination returned a repeated page', { stage: 'topic', page });
        seen.add(response.text);
        pages.push(response.text);
        if (page < maxPages) await pageDelay(api, context.signal);
    }
    throw new ConversionError('PAGE_LIMIT', 'Topic page limit reached before an empty terminal page', { stage: 'topic', page: maxPages });
}

export { fetchDiscourseRawContent as fetchUSCardForumContent };

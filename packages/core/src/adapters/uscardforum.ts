/** Discourse raw Markdown protocol; endpoints and limits belong to the profile. */
import type { SiteAdapter } from './base';
import type { ApiConversionContext, HttpFetcher } from '../types';
import { getAdapterConfig, interpolate } from '../config';
import { classifyRoute } from './routes';
import { ConversionError, assertNotAborted } from '../errors';
import { record, textField, numberField, requestOptions, request, requireOk, pageDelay, fetchHttpFetcher } from './protocol';

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
        const title = config?.metadata?.title_cleanup ? doc.title.replace(new RegExp(config.metadata.title_cleanup), '').trim() : doc.title;
        return { title, url, tags: config?.metadata?.tags };
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
    for (let page = 1; page <= maxPages; page++) {
        assertNotAborted(context.signal);
        context.onProgress?.(`Fetching topic page ${page}`);
        const url = interpolate(rawEndpoint, { base_url: String(site.base_url), topic_id: topicId, page });
        const response = await request(fetcher ?? fetchHttpFetcher, url, options, { stage: 'topic', page });
        requireOk(response, 'topic');
        if (!response.text.trim()) {
            if (!pages.length) throw new ConversionError('INCOMPLETE_CONTENT', 'Topic response contains no content', { stage: 'topic', page });
            return pages.join(separator);
        }
        if (seen.has(response.text)) throw new ConversionError('REPEATED_PAGE', 'Topic pagination returned a repeated page', { stage: 'topic', page });
        seen.add(response.text);
        pages.push(response.text);
        if (page < maxPages) await pageDelay(api, context.signal);
    }
    throw new ConversionError('PAGE_LIMIT', 'Topic page limit reached before an empty terminal page', { stage: 'topic', page: maxPages });
}

export { fetchDiscourseRawContent as fetchUSCardForumContent };

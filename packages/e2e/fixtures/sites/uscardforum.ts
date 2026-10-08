/** US Card Forum (Discourse) stand-in: topic pages, /raw/ pages, category and search listings. */
import { html, page, text, type FakeResponse, type FakeSite } from '../types';

export const USCF = 'https://www.uscardforum.com';

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

function respond(url: URL): FakeResponse {
    const raw = url.pathname.match(/^\/raw\/(\d+)$/);
    if (raw) {
        const topic = uscfTopics[raw[1]];
        if (!topic) return text('not found', 404);
        if (topic.status) return text('error', topic.status);
        return text(topic.pages[Number(url.searchParams.get('page') ?? '1') - 1] ?? '');
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

export const usCardForum: FakeSite = { origins: [USCF], respond };

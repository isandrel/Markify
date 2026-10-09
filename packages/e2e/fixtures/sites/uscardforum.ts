/** US Card Forum: a Discourse site. */
import { discourseSite, type DiscourseSpec } from './discourse';

export const USCF = 'https://www.uscardforum.com';

export const uscfSpec: DiscourseSpec = {
    origin: USCF,
    siteTitle: '美国信用卡指南',
    topics: {
        '2001': {
            title: 'Amex Platinum offer',
            category: '信用卡',
            pages: [
                'alice | 2026-01-01 00:00:00 UTC | #1\n\nFirst page **post** about the offer.',
                'bob | 2026-01-02 00:00:00 UTC | #21\n\nSecond page reply.',
            ],
        },
        '2002': { title: 'Chase 5/24 rule', category: '信用卡', pages: ['carol | 2026-01-03 | #1\n\nSingle page topic.'] },
        '2003': { title: 'Broken topic', category: '信用卡', pages: [], status: 500 },
        '2004': { title: 'Members lounge', category: '会员专区', pages: [], status: 403 },
        '2005': { title: 'Hot deal thread', category: '羊毛', pages: [], status: 429 },
    },
    category: { path: 'credit-cards/5', name: 'Credit Cards', ids: ['2001', '2002', '2003'] },
    tag: { name: 'amex', ids: ['2001', '2005'] },
    latest: ['2002', '2001', '2004'],
    search: { query: 'amex', ids: ['2001', '2002'] },
};

/** Kept for existing callers. */
export const uscfTopics = uscfSpec.topics;

export const usCardForum = discourseSite(uscfSpec);

import { parse as parseYaml } from 'yaml';
import { test, expect, type MarkifyBrowser } from '../../support/harness';
import { EPOCH_ISO, P3A, P3A_API, P3A_INSTANT, p3aThreads } from '../../fixtures';

const threadApi = (id: string) => `${P3A_API}/api/v3/home-threads/${id}`;
const postsApi = (id: string, page: number) => `${P3A_API}/api/threads/${id}/nested-posts?ps=20&order=time_asc&pg=${page}`;

function frontmatter(markdown: string): Record<string, unknown> {
    const block = markdown.match(/^---\n([\s\S]*?)\n---\n/);
    expect(block, 'document starts with a YAML frontmatter block').not.toBeNull();
    return parseYaml(block![1]);
}

async function expectNoExport(markify: MarkifyBrowser, statsBefore: unknown = undefined) {
    expect(markify.store.get('markify_download_history') ?? {}).toEqual({});
    expect(markify.store.get('markify_stats')).toBe(statsBefore);
    expect(markify.notifications.some(n => n.text.startsWith('Downloaded as'))).toBe(false);
}

test.describe('single thread export', () => {
    test('Download: frontmatter, BBCode body and every comment page', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1001`);
        await expect(page.locator('#markify-container')).toBeVisible();
        await expect(page.locator('#markify-batch-panel')).toHaveCount(0);

        const { name, text } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(name).toBe('Offer 比较- Google vs Meta.md');

        const meta = frontmatter(text);
        expect(meta).toMatchObject({
            title: 'Offer 比较: Google vs Meta', author: 'alice',
            posted_at: EPOCH_ISO, updated_at: '2026-01-01T01:00:00.000Z',
            source: `[Offer 比较: Google vs Meta](${P3A}/bbs/thread-1001-1-1.html)`,
            views: 4321, replies: 25, favorites: 7, tags: ['1point3acres', 'forum'],
        });
        expect(Date.parse(meta.downloaded_at as string)).toBeGreaterThan(Date.now() - 60_000);

        expect(text).toContain(`# Offer 比较: Google vs Meta\n\n**Author:** alice | **Date:** ${EPOCH_ISO}`);
        expect(text).toContain('**Views:** 4321 | **Replies:** 25 | **Favorites:** 7');
        // BBCode: paragraphs and line breaks survive, block structures become Markdown.
        expect(text).toContain('**面经**: Google L4 onsite, *bay area*.  \n  \nTimeline:');
        expect(text).toContain('1.  电面 in January\n2.  Onsite in ~~February~~ March');
        expect(text).toContain('> Recruiter: "We will get back to you."  \n> Two weeks later.');
        expect(text).toContain('```\ndef solve(nums):\n    return sorted(nums)\n```');
        expect(text).toContain('Prep: [the guide](https://example.org/guide)');
        expect(text).toContain('![](https://example.org/offer.png)');
        expect(text).toContain('Literal tokens: $& $1 {title} 😀');

        expect(text).toContain('## Comments (25)');
        const replies = [...text.matchAll(/Reply number (\d+) with \*\*emphasis \1\*\*/g)].map(m => Number(m[1]));
        expect(replies).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
        expect(text).toContain(`**user1** - *${EPOCH_ISO.replace('00:00:00', '00:01:00')}*`);

        const api = markify.apiRequests(P3A_API);
        expect(api.map(r => r.url)).toEqual([threadApi('1001'), postsApi('1001', 1), postsApi('1001', 2)]);
        // Privileged GM requests that carry the logged-in session (not anonymous).
        expect(api.every(r => r.via === 'gm' && r.anonymous === false)).toBe(true);

        expect((await markify.lastNotification('Downloaded as')).text).toBe('Downloaded as Offer 比较- Google vs Meta.md');
        await expect(page.locator('#markify-download-btn')).toHaveText('📥 Download');
        expect(markify.store.get('markify_stats')).toBe(1);
        await expect.poll(() => markify.store.get('markify_download_history')).toMatchObject({
            '1point3acres:1001': { id: '1001', site: '1point3acres', type: 'single', title: 'Offer 比较: Google vs Meta' },
        });
    });

    for (const [label, url] of [
        ['current thread route with trailing slash, query and hash', `${P3A}/home/thread/1002/?from=feed#reply-3`],
        ['pins route', `${P3A}/home/pins/1002`],
        ['legacy BBS route', `${P3A}/bbs/thread-1002-1-1.html`],
        ['instant subdomain', `${P3A_INSTANT}/thread/1002`],
    ]) {
        test(`every thread route exports the same thread: ${label}`, async ({ markify, page }) => {
            await markify.open(url);
            await expect(page.locator('#markify-container')).toBeVisible();
            const { name, text } = await markify.download(() => page.locator('#markify-download-btn').click());
            expect(name).toBe('Visa timeline 2026.md');
            expect(frontmatter(text).source).toBe(`[Visa timeline 2026](${P3A}/bbs/thread-1002-1-1.html)`);
            expect(markify.apiRequests(P3A_API).map(r => r.url)).toEqual([threadApi('1002')]);
            await expect.poll(() => Object.keys(markify.store.get('markify_download_history') as object ?? {})).toEqual(['1point3acres:1002']);
        });
    }

    test('Copy puts the Markdown on the clipboard without download or history', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1002`);
        let downloads = 0;
        page.on('download', () => downloads++);
        await page.locator('#markify-copy-btn').click();
        await markify.lastNotification('Copied to clipboard!');
        expect(markify.clipboard).toHaveLength(1);
        expect(frontmatter(markify.clipboard[0]).title).toBe('Visa timeline 2026');
        expect(markify.clipboard[0]).toContain('No replies yet.');
        expect(markify.clipboard[0]).not.toContain('## Comments');
        await expect(page.locator('#markify-copy-btn')).toHaveText('📋 Copy');
        expect(downloads).toBe(0);
        expect(markify.store.get('markify_download_history')).toBeUndefined();
    });

    test('titles with quotes, colons, slashes and $-tokens stay valid YAML and safe filenames', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1016`);
        const { name, text } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(name).toBe('He said -a- b- - c- $& {title}.md');
        const meta = frontmatter(text);
        expect(meta.title).toBe(p3aThreads['1016'].subject);
        expect(meta.author).toBe('o"neil');
        expect(text).toContain(`# ${p3aThreads['1016'].subject}`);
    });

    test('a page of exactly 20 replies needs the empty terminal page', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1007`);
        const { text } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(text).toContain('## Comments (20)');
        expect(markify.apiRequests(P3A_API).map(r => r.url)).toEqual([threadApi('1007'), postsApi('1007', 1), postsApi('1007', 2)]);
    });

    test('nested replies: fewer top-level posts than advertised still completes', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1008`);
        const { text } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(frontmatter(text).replies).toBe(30);
        expect(text).toContain('## Comments (22)');
        expect(text.match(/Reply number \d+ with/g)).toHaveLength(22);
    });

    const failures: [string, string, (markify: MarkifyBrowser) => void][] = [
        ['HTTP 403 (no access)', '1003', () => undefined],
        ['HTTP 401 (logged out)', '1014', () => undefined],
        ['HTTP 500', '1015', () => undefined],
        ['errno ≠ 0 with HTTP 200', '1011', () => undefined],
        ['malformed JSON', '1012', () => undefined],
        ['missing required field', '1013', () => undefined],
        ['comments API repeating the same page', '1009', () => undefined],
        ['comments page failing mid-thread', '1001', markify => markify.intercept(postsApi('1001', 2), () => ({ status: 502, body: 'bad gateway', contentType: 'text/plain' }))],
        ['request timeout', '1002', markify => {
            markify.store.set('markify_overrides_v1', { schema_version: 1, global: {}, sites: { '1point3acres': { runtime: { timeout_ms: 1000 } } } });
            markify.intercept(threadApi('1002'), () => 'hang');
        }],
    ];
    for (const [label, id, arrange] of failures) {
        test(`failure is explicit and leaves no partial export: ${label}`, async ({ markify, page }) => {
            arrange(markify);
            await markify.open(`${P3A}/home/thread/${id}`);
            let downloads = 0;
            page.on('download', () => downloads++);
            await page.locator('#markify-download-btn').click();
            await markify.lastNotification('Failed to convert page');
            await expect(page.locator('#markify-download-btn')).toHaveText('📥 Download');
            expect(downloads).toBe(0);
            await expectNoExport(markify);
            if (id === '1009') expect(markify.apiRequests(`${P3A_API}/api/threads/1009/`).map(r => r.url)).toEqual([postsApi('1009', 1), postsApi('1009', 2)]);
        });
    }

    test('progress is shown, a second click is ignored, and the button recovers', async ({ markify, page }) => {
        const held = markify.hold(postsApi('1001', 2));
        await markify.open(`${P3A}/home/thread/1001`);
        const button = page.locator('#markify-download-btn');
        const download = page.waitForEvent('download');
        await button.click();
        await held.reached;
        await expect(button).toHaveText('Fetching comments page 2');
        await button.click();
        await page.locator('#markify-copy-btn').click();
        held.release();
        await download;
        await expect(button).toHaveText('📥 Download');
        expect(markify.apiRequests(threadApi('1001'))).toHaveLength(1);
        expect(markify.clipboard).toEqual([]);
    });

    test('navigating away mid-export cancels it without download, history or stale UI', async ({ markify, page }) => {
        const held = markify.hold(postsApi('1001', 2));
        await markify.open(`${P3A}/home/thread/1001`);
        let downloads = 0;
        page.on('download', () => downloads++);
        await page.locator('#markify-download-btn').click();
        await held.reached;
        await page.evaluate(() => (window as any).__spaGo('/home/thread/1002'));
        await expect(page.locator('h1')).toHaveText('Visa timeline 2026');
        await expect.poll(() => markify.abortedRequests).toContain(postsApi('1001', 2));
        held.release();
        await page.waitForTimeout(500);
        expect(downloads).toBe(0);
        expect(markify.notifications).toEqual([]);
        await expectNoExport(markify);
        await expect(page.locator('#markify-download-btn')).toHaveText('📥 Download');

        // The new page exports its own thread.
        const { name } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(name).toBe('Visa timeline 2026.md');
    });
});

test.describe('download history on thread pages', () => {
    test('a downloaded thread is marked on the next visit', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1002`);
        await expect(page.locator('[data-markify-owned="history"]')).toHaveCount(0);
        await markify.download(() => page.locator('#markify-download-btn').click());
        await expect.poll(() => markify.store.has('markify_download_history')).toBe(true);
        await page.reload();
        await markify.ready();
        await expect(page.locator('h1 [data-markify-owned="history"]')).toHaveText('✓ ');
        await expect(page.locator('h1 [data-markify-owned="history"]')).toHaveAttribute('title', 'Already downloaded');
    });

    test('records saved under the legacy "1Point3Acres" name are still recognised', async ({ markify, page }) => {
        markify.store.set('markify_download_history', {
            '1Point3Acres:1002': { id: '1002', site: '1Point3Acres', title: 'Visa timeline 2026', downloadedAt: '2025-06-01T00:00:00Z', type: 'single' },
        });
        await markify.open(`${P3A}/home/thread/1002`);
        await expect(page.locator('h1 [data-markify-owned="history"]')).toHaveCount(1);
        await markify.open(`${P3A}/home/thread/1001`);
        await expect(page.locator('h1 [data-markify-owned="history"]')).toHaveCount(0);
    });
});

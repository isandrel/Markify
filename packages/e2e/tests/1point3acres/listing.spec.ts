import { test, expect } from '../../support/harness';
import { AD_ID, P3A, P3A_API, discoverFeed, hotIds } from '../../fixtures';

const threadApi = (id: string) => `${P3A_API}/api/v3/home-threads/${id}`;
const today = () => new Date().toISOString().slice(0, 10);
const boxIds = (page: import('@playwright/test').Page) => page.locator('.markify-batch-checkbox')
    .evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId));

test.describe('discover feed extraction', () => {
    test('one checkbox per feed row: ads, hot section, sidebar and category cards excluded', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/discover/38`);
        await expect(page.locator('#markify-container')).toBeHidden();
        await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
        await expect.poll(() => boxIds(page)).toEqual(discoverFeed[1]);
        for (const id of [AD_ID, ...hotIds]) await expect(page.locator(`[data-item-id="${id}"]`)).toHaveCount(0);
        // 1001 and 10011 are distinct rows; the absolute-URL row (1008) is recognised.
        await expect(page.locator('[data-item-id="1001"]')).toHaveCount(1);
        await expect(page.locator('[data-item-id="10011"]')).toHaveCount(1);
        await expect(page.locator('[data-item-id="1008"]')).toHaveCount(1);
        // Full titles come from the h3 title attribute, not the truncated text.
        await expect(page.locator('[data-item-id="1001"]')).toHaveAttribute('aria-label', 'Select Offer 比较: Google vs Meta');
        // Each control is placed in its own row.
        await expect(page.locator('[data-sentry-component="ForumThreadItem"]:not([data-ad]) > .markify-checkbox-wrapper')).toHaveCount(20);
    });

    test('ticking a checkbox (mouse or keyboard) never opens the thread under the row overlay', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/discover/38`);
        const box = page.locator('[data-item-id="1002"]');
        await box.click();
        await expect(box).toBeChecked();
        await box.press('Space');
        await expect(box).not.toBeChecked();
        await box.press('Space');
        await expect(box).toBeChecked();
        expect(page.url()).toBe(`${P3A}/home/discover/38`);
        expect(await page.evaluate(() => (window as any).__spaNavigations)).toBe(0);
        // The row itself is still a link.
        await page.locator('[data-sentry-component="ForumThreadItem"]', { hasText: 'by bob' }).click({ position: { x: 400, y: 10 } });
        await expect(page).toHaveURL(`${P3A}/home/thread/1002`);
    });

    test('Select All reflects partial, full and empty selection', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/discover/38`);
        const all = page.locator('#markify-select-all');
        const button = page.locator('#markify-batch-panel button');
        await expect(button).toHaveText('📥 Download Selected (0)');
        await expect(button).toBeDisabled();
        await page.locator('[data-item-id="1001"]').check();
        expect(await all.evaluate(el => (el as HTMLInputElement).indeterminate)).toBe(true);
        await all.check();
        await expect(button).toHaveText('📥 Download Selected (20)');
        expect(await all.evaluate(el => (el as HTMLInputElement).indeterminate)).toBe(false);
        await page.locator('[data-item-id="1001"]').uncheck();
        await expect(all).not.toBeChecked();
        await expect(button).toHaveText('📥 Download Selected (19)');
        await all.check();
        await all.uncheck();
        await expect(button).toHaveText('📥 Download Selected (0)');
    });
});

test.describe('batch download', () => {
    test('ZIP holds only complete successes; failures stay selected and out of history', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/discover/38`);
        for (const id of ['1001', '1003', '1007']) await page.locator(`[data-item-id="${id}"]`).check();
        const button = page.locator('#markify-batch-panel button');
        await expect(button).toHaveText('📥 Download Selected (3)');

        const zip = await markify.downloadZip(async () => {
            await button.click();
            // Controls are locked while the job runs.
            await expect(button).toBeDisabled();
            await expect(page.locator('#markify-select-all')).toBeDisabled();
            await expect(page.locator('[data-item-id="1002"]')).toBeDisabled();
        });
        expect(zip.name).toBe(`1point3acres-discover-求职-${today()}.zip`);
        expect(Object.keys(zip.files).sort()).toEqual(['1001 - Offer 比较- Google vs Meta.md', '1007 - Exactly one page of replies.md']);
        expect(zip.files['1001 - Offer 比较- Google vs Meta.md']).toContain('## Comments (25)');
        expect(zip.files['1007 - Exactly one page of replies.md']).toContain('## Comments (20)');

        const notice = await markify.lastNotification('Download started for');
        expect(notice.text).toContain('2/3 items. 1 failed and remain selected. Members only thread: HTTP 403 during thread');
        await expect(page.locator('[data-item-id="1003"]')).toBeChecked();
        await expect(page.locator('[data-item-id="1001"]')).not.toBeChecked();
        await expect(button).toHaveText('📥 Download Selected (1)');
        await expect(button).toBeEnabled();

        const history = markify.store.get('markify_download_history') as Record<string, { type: string }>;
        expect(Object.keys(history).sort()).toEqual(['1point3acres:1001', '1point3acres:1007']);
        expect(Object.values(history).every(record => record.type === 'batch')).toBe(true);

        // Retry of the remaining selection now succeeds.
        markify.intercept(threadApi('1003'), url => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ errno: 0, thread: {
            subject: 'Members only thread', author: 'carol', message_bbcode: 'Now visible.', dateline: 1767225600, lastpost: 1767225600, views: 1, replies: 0, favtimes: 0 } }) }));
        const retry = await markify.downloadZip(() => button.click());
        expect(Object.keys(retry.files)).toEqual(['1003 - Members only thread.md']);
        await expect(button).toHaveText('📥 Download Selected (0)');

        await page.reload();
        await markify.ready();
        await expect(page.locator('.markify-checkbox-wrapper:has(span[title="Already downloaded"]) input')).toHaveCount(3);
    });

    test('when every item fails there is no ZIP, no history and a clear message', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/forum/145?ids=1003,1014`);
        let downloads = 0;
        page.on('download', () => downloads++);
        await page.locator('#markify-select-all').check();
        await page.locator('#markify-batch-panel button').click();
        const notice = await markify.lastNotification('No files downloaded');
        expect(notice.text).toContain('HTTP 403 during thread');
        expect(notice.text).toContain('HTTP 401 during thread');
        expect(downloads).toBe(0);
        expect(markify.store.get('markify_download_history')).toBeUndefined();
        await expect(page.locator('.markify-batch-checkbox:checked')).toHaveCount(2);
    });

    test('a second click while running does not start another job', async ({ markify, page }) => {
        const held = markify.hold(threadApi('1002'));
        await markify.open(`${P3A}/home/forum/145?ids=1002`);
        await page.locator('[data-item-id="1002"]').check();
        const button = page.locator('#markify-batch-panel button');
        await button.click();
        await held.reached;
        await button.dispatchEvent('click');
        held.release();
        await markify.lastNotification('Download started for 1/1 items.');
        expect(markify.apiRequests(threadApi('1002'))).toHaveLength(1);
    });

    test('navigating during a batch cancels it: no ZIP, no history, fresh panel', async ({ markify, page }) => {
        const held = markify.hold(threadApi('1002'));
        await markify.open(`${P3A}/home/discover/38`);
        for (const id of ['1001', '1002']) await page.locator(`[data-item-id="${id}"]`).check();
        let downloads = 0;
        page.on('download', () => downloads++);
        await page.locator('#markify-batch-panel button').click();
        await held.reached;
        await page.locator('#page-2').click();
        await expect.poll(() => boxIds(page)).toEqual(discoverFeed[2]);
        await expect.poll(() => markify.abortedRequests).toContain(threadApi('1002'));
        held.release();
        await page.waitForTimeout(1500);
        expect(downloads).toBe(0);
        expect(markify.store.get('markify_download_history')).toBeUndefined();
        expect(markify.notifications.filter(n => n.text.includes('Download started'))).toEqual([]);
        await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
        await expect(page.locator('#markify-batch-panel button')).toHaveText('📥 Download Selected (0)');
        await expect(page.locator('#markify-batch-panel button')).toBeDisabled();
    });

    test('identical sanitized names are disambiguated with the thread id', async ({ markify, page }) => {
        markify.store.set('markify_overrides_v1', { schema_version: 1, global: {}, sites: { '1point3acres': { filename: { batch_item: '{title}', batch: '{site} {tagname}' } } } });
        await markify.open(`${P3A}/home/forum/145?ids=1021,1022`);
        await page.locator('#markify-select-all').check();
        const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click());
        expect(zip.name).toBe('1point3acres Board 145.zip');
        expect(Object.keys(zip.files).sort()).toEqual(['Same title [1022].md', 'Same title.md']);
        expect(zip.files['Same title.md']).toContain('First of two.');
        expect(zip.files['Same title [1022].md']).toContain('Second of two.');
    });

    test('legacy layout fallback: HomeThreadItem rows linking to /home/pins/', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/forum/27`);
        await expect.poll(() => boxIds(page)).toEqual(['1010']);
        await page.locator('#markify-select-all').check();
        const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click());
        expect(zip.name).toBe(`1point3acres-forum-Legacy board-${today()}.zip`);
        expect(Object.keys(zip.files)).toEqual(['1010 - Legacy pinned post.md']);
    });
});

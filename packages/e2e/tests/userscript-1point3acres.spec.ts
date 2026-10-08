import { test, expect } from '../support/harness';
import { EPOCH_ISO, P3A, P3A_API, p3aListingRows, p3aThreads } from '../fixtures/sites';

test.describe('1Point3Acres thread page', () => {
    test('Download exports the thread with every comment page via GM transport', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1001`);
        await expect(page.locator('#markify-container')).toBeVisible();
        await expect(page.locator('#markify-batch-panel')).toHaveCount(0);

        const { name, text } = await markify.download(() => page.locator('#markify-download-btn').click());

        expect(name).toBe('Offer 比较- Google vs Meta.md');
        expect(text).toMatch(/^---\ntitle: "Offer 比较: Google vs Meta"\nauthor: "alice"\nposted_at: "2026-01-01T00:00:00.000Z"/);
        expect(text).toContain(`source: "[Offer 比较: Google vs Meta](${P3A}/bbs/thread-1001-1-1.html)"`);
        expect(text).toContain('views: 4321');
        expect(text).toContain('replies: 25');
        expect(text).toContain('# Offer 比较: Google vs Meta');
        expect(text).toContain(`**Author:** alice | **Date:** ${EPOCH_ISO}`);
        // BBCode body rendered to Markdown.
        expect(text).toContain('Intro with **bold text** and *italic text*. See [the guide](https://example.org/guide).');
        // Both comment pages, in ascending order, nothing duplicated.
        expect(text).toContain('## Comments (25)');
        expect(text.match(/Reply number \d+ with/g)).toHaveLength(25);
        expect(text.indexOf('Reply number 1 with **emphasis 1**')).toBeLessThan(text.indexOf('Reply number 25 with **emphasis 25**'));

        const api = markify.apiRequests(P3A_API);
        expect(api.map(r => r.url)).toEqual([
            `${P3A_API}/api/v3/home-threads/1001`,
            `${P3A_API}/api/threads/1001/nested-posts?ps=20&order=time_asc&pg=1`,
            `${P3A_API}/api/threads/1001/nested-posts?ps=20&order=time_asc&pg=2`,
        ]);
        expect(api.every(r => r.via === 'gm')).toBe(true);

        const notice = await markify.lastNotification('Downloaded as');
        expect(notice.text).toBe('Downloaded as Offer 比较- Google vs Meta.md');
        await expect(page.locator('#markify-download-btn')).toHaveText('📥 Download');
        expect(markify.store.get('markify_stats')).toBe(1);
    });

    test('download is recorded in history and shown on the next visit', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1001`);
        await expect(page.locator('[data-markify-owned="history"]')).toHaveCount(0);
        await markify.download(() => page.locator('#markify-download-btn').click());
        await expect.poll(() => Object.keys((markify.store.get('markify_download_history') ?? {}) as object)).toEqual(['1point3acres:1001']);

        await page.reload();
        await markify.ready();
        await expect(page.locator('h1 [data-markify-owned="history"]')).toHaveText('✓ ');
    });

    test('Copy puts the same Markdown on the clipboard without downloading', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1002`);
        let downloads = 0;
        page.on('download', () => downloads++);
        await page.locator('#markify-copy-btn').click();
        await markify.lastNotification('Copied to clipboard!');
        expect(markify.clipboard).toHaveLength(1);
        expect(markify.clipboard[0]).toContain('# Visa timeline 2026');
        expect(markify.clipboard[0]).toContain('No replies yet.');
        expect(markify.clipboard[0]).not.toContain('## Comments');
        // Zero replies: only the thread request, no comment pages.
        expect(markify.apiRequests(P3A_API).map(r => r.url)).toEqual([`${P3A_API}/api/v3/home-threads/1002`]);
        expect(downloads).toBe(0);
        expect(markify.store.get('markify_download_history')).toBeUndefined();
    });

    test('an API rejection surfaces a failure notification and leaves no history', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1003`);
        await page.locator('#markify-download-btn').click();
        await markify.lastNotification('Failed to convert page');
        expect(markify.store.get('markify_download_history')).toBeUndefined();
        await expect(page.locator('#markify-download-btn')).toHaveText('📥 Download');
    });
});

test.describe('1Point3Acres listing pages', () => {
    test('one checkbox per feed row, sidebar excluded, batch ZIP holds only successes', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/discover/38`);
        await expect(page.locator('#markify-container')).toBeHidden();
        await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
        const boxes = page.locator('.markify-batch-checkbox');
        await expect(boxes).toHaveCount(3);
        expect(await boxes.evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId))).toEqual(['1001', '1002', '1003']);
        await expect(page.locator('aside .markify-batch-checkbox')).toHaveCount(0);

        const button = page.locator('#markify-batch-panel button');
        await expect(button).toHaveText('📥 Download Selected (0)');
        await expect(button).toBeDisabled();
        await page.locator('#markify-select-all').check();
        await expect(button).toHaveText('📥 Download Selected (3)');

        const zip = await markify.downloadZip(() => button.click());
        const today = new Date().toISOString().slice(0, 10);
        expect(zip.name).toBe(`1point3acres-discover-求职-${today}.zip`);
        expect(Object.keys(zip.files).sort()).toEqual(['1001 - Offer 比较- Google vs Meta.md', '1002 - Visa timeline 2026.md']);
        expect(zip.files['1001 - Offer 比较- Google vs Meta.md']).toContain('## Comments (25)');
        expect(zip.files['1002 - Visa timeline 2026.md']).toContain('# Visa timeline 2026');

        const notice = await markify.lastNotification('Download started for');
        expect(notice.text).toContain('2/3 items');
        expect(notice.text).toContain('1 failed and remain selected');
        expect(notice.text).toContain('HTTP 403 during thread');
        // The failed row stays selected for retry; successes are cleared.
        await expect(page.locator('[data-item-id="1003"]')).toBeChecked();
        await expect(page.locator('[data-item-id="1001"]')).not.toBeChecked();
        await expect(button).toHaveText('📥 Download Selected (1)');
        expect(markify.apiRequests(`${P3A_API}/api/v3/home-threads/1004`)).toHaveLength(0);

        const history = markify.store.get('markify_download_history') as Record<string, { type: string }>;
        expect(Object.keys(history).sort()).toEqual(['1point3acres:1001', '1point3acres:1002']);
        expect(Object.values(history).every(record => record.type === 'batch')).toBe(true);

        await page.reload();
        await markify.ready();
        await expect(page.locator('.markify-checkbox-wrapper span[title="Already downloaded"]')).toHaveCount(2);
    });

    test('SPA pagination replaces rows, resets selection, and keeps one panel', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/discover/38`);
        await expect(page.locator('.markify-batch-checkbox')).toHaveCount(3);
        await page.locator('[data-item-id="1001"]').check();
        await expect(page.locator('#markify-batch-panel button')).toHaveText('📥 Download Selected (1)');

        await page.evaluate(rows => {
            history.pushState({}, '', '/home/discover/38?page=2');
            document.querySelector('#feed')!.innerHTML = rows;
        }, p3aListingRows(['1005', '1006']));

        await expect.poll(() => page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId))).toEqual(['1005', '1006']);
        await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
        await expect(page.locator('#markify-batch-panel button')).toHaveText('📥 Download Selected (0)');
        await expect(page.locator('.markify-batch-checkbox:checked')).toHaveCount(0);

        // Rows rendered late on the same route are picked up by the observer.
        await page.evaluate(rows => document.querySelector('#feed')!.insertAdjacentHTML('beforeend', rows), p3aListingRows(['1002']));
        await expect(page.locator('.markify-batch-checkbox')).toHaveCount(3);
        await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
    });

    test('client-side navigation from listing to thread swaps batch panel for toolbar', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/discover/38`);
        await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
        await page.evaluate(title => {
            history.pushState({}, '', '/home/thread/1002');
            document.querySelector('main')!.innerHTML = `<h1>${title}</h1>`;
        }, p3aThreads['1002'].subject);
        await expect(page.locator('#markify-batch-panel')).toHaveCount(0);
        await expect(page.locator('.markify-checkbox-wrapper')).toHaveCount(0);
        await expect(page.locator('#markify-container')).toBeVisible();
        const { name } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(name).toBe('Visa timeline 2026.md');

        await page.goBack();
        await expect(page.locator('#markify-container')).toBeHidden();
        await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
    });

    test('fallback layout handles legacy HomeThreadItem rows linking to /home/pins/', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/forum/27`);
        await expect(page.locator('.markify-batch-checkbox')).toHaveCount(1);
        await page.locator('#markify-select-all').check();
        const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click());
        expect(zip.name).toMatch(/^1point3acres-forum-Legacy board-\d{4}-\d{2}-\d{2}\.zip$/);
        expect(Object.keys(zip.files)).toEqual(['1010 - Legacy pinned post.md']);
        await markify.lastNotification('Download started for 1/1 items.');
    });

    test('entry route shows neither toolbar nor batch panel', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/`);
        await expect(page.locator('#markify-container')).toBeHidden();
        await expect(page.locator('#markify-batch-panel')).toHaveCount(0);
    });
});


import { test, expect } from '../support/harness';
import { USCF } from '../fixtures/sites';

test.describe('US Card Forum thread page', () => {
    test('Download joins every raw page until the empty terminal page', async ({ markify, page }) => {
        await markify.open(`${USCF}/t/amex-platinum-offer/2001`);
        await expect(page.locator('#markify-container')).toBeVisible();

        const { name, text } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(name).toBe('Amex Platinum offer.md');
        // Frontmatter comes from the page (title cleanup + profile tags), body from /raw/.
        expect(text).toMatch(/^---\ntitle: "Amex Platinum offer"\nsource: https:\/\/www\.uscardforum\.com\/t\/amex-platinum-offer\/2001\n/);
        expect(text).toContain('tags:\n  - uscardforum\n  - forum\n  - credit-cards\n');
        expect(text).toContain('First page **post** about the offer.\n\n---\n\nbob | 2026-01-02 00:00:00 UTC | #21\n\nSecond page reply.');

        // Same-origin fetch transport (not GM), Accept header from the profile, stops at the empty page.
        const raw = markify.apiRequests(`${USCF}/raw/`);
        expect(raw.map(r => r.url)).toEqual([1, 2, 3].map(n => `${USCF}/raw/2001?page=${n}`));
        expect(raw.every(r => r.via === 'page' && r.headers.accept === 'text/plain')).toBe(true);

        await expect.poll(() => Object.keys((markify.store.get('markify_download_history') ?? {}) as object)).toEqual(['uscardforum:2001']);
    });

    test('post-number permalinks and slugless topic URLs resolve the topic id', async ({ markify, page }) => {
        await markify.open(`${USCF}/t/topic/2002/5`);
        const { name, text } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(name).toBe('Chase 5-24 rule.md');
        expect(text).toContain('Single page topic.');
        expect(markify.apiRequests(`${USCF}/raw/`).map(r => r.url)).toEqual([`${USCF}/raw/2002?page=1`, `${USCF}/raw/2002?page=2`]);

        await markify.open(`${USCF}/t/2002`);
        expect((await markify.download(() => page.locator('#markify-download-btn').click())).name).toBe('Chase 5-24 rule.md');
    });

    test('home route keeps every Markify control hidden', async ({ markify, page }) => {
        await markify.open(`${USCF}/latest`);
        await expect(page.locator('#markify-container')).toBeHidden();
        await expect(page.locator('#markify-batch-panel')).toHaveCount(0);
    });
});

test.describe('US Card Forum listing pages', () => {
    test('category batch: table rows get checkboxes, failures stay selected', async ({ markify, page }) => {
        await markify.open(`${USCF}/c/credit-cards/5`);
        const boxes = page.locator('.markify-batch-checkbox');
        await expect(boxes).toHaveCount(3);
        // Checkbox lives in the title cell, not as a stray child of <tr>.
        await expect(page.locator('td.main-link .markify-checkbox-wrapper')).toHaveCount(3);
        await expect(page.locator('aside .markify-batch-checkbox')).toHaveCount(0);

        await page.locator('#markify-select-all').check();
        const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click());
        const today = new Date().toISOString().slice(0, 10);
        expect(zip.name).toBe(`uscardforum-category-Credit Cards-${today}.zip`);
        expect(Object.keys(zip.files).sort()).toEqual(['2001 - Amex Platinum offer.md', '2002 - Chase 5-24 rule.md']);
        expect(zip.files['2001 - Amex Platinum offer.md']).toContain('Second page reply.');

        const notice = await markify.lastNotification('Download started for');
        expect(notice.text).toContain('2/3 items');
        expect(notice.text).toContain('Broken topic: HTTP 500 during topic');
        await expect(page.locator('[data-item-id="2003"]')).toBeChecked();
        await expect(page.locator('#markify-batch-panel button')).toHaveText('📥 Download Selected (1)');
    });

    test('search results batch uses the search layout and query as archive id', async ({ markify, page }) => {
        await markify.open(`${USCF}/search?q=amex`);
        await expect(page.locator('.markify-batch-checkbox')).toHaveCount(2);
        await page.locator('#markify-select-all').check();
        const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click());
        expect(zip.name).toMatch(/^uscardforum-search-Search results-\d{4}-\d{2}-\d{2}\.zip$/);
        expect(Object.keys(zip.files).sort()).toEqual(['2001 - Amex Platinum offer.md', '2002 - Chase 5-24 rule.md']);
        await markify.lastNotification('Download started for 2/2 items.');
    });

    test('previously downloaded topics are marked on the listing', async ({ markify, page }) => {
        await markify.open(`${USCF}/t/slug/2002`);
        await markify.download(() => page.locator('#markify-download-btn').click());
        await expect.poll(() => markify.store.has('markify_download_history')).toBe(true);
        await markify.open(`${USCF}/c/credit-cards/5`);
        await expect(page.locator('.markify-batch-checkbox')).toHaveCount(3);
        const marked = page.locator('.markify-checkbox-wrapper:has(span[title="Already downloaded"]) input');
        await expect(marked).toHaveCount(1);
        await expect(marked).toHaveAttribute('data-item-id', '2002');
    });
});

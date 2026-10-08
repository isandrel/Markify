import { test, expect } from '../../support/harness';
import { P3A, discoverFeed, p3aRows } from '../../fixtures';

type Page = import('@playwright/test').Page;
const boxIds = (page: Page) => page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId));
const selected = (page: Page) => page.locator('#markify-batch-panel button');

async function expectSingleUi(page: Page) {
    expect(await page.locator('#markify-batch-panel').count()).toBeLessThanOrEqual(1);
    await expect(page.locator('#markify-container')).toHaveCount(1);
    // Every row hosts at most one control.
    expect(await page.locator('[data-sentry-component] > .markify-checkbox-wrapper + .markify-checkbox-wrapper').count()).toBe(0);
}

test.describe('client-side navigation', () => {
    test('pagination: page 1 → 2 → back → forward keeps one panel and resets selection', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/discover/38`);
        await page.locator('[data-item-id="1001"]').check();
        await expect(selected(page)).toHaveText('📥 Download Selected (1)');

        await page.locator('#page-2').click();
        await expect.poll(() => boxIds(page)).toEqual(discoverFeed[2]);
        await expect(selected(page)).toHaveText('📥 Download Selected (0)');
        await expectSingleUi(page);

        await page.goBack();
        await expect.poll(() => boxIds(page)).toEqual(discoverFeed[1]);
        await expect(page.locator('.markify-batch-checkbox:checked')).toHaveCount(0);
        await expectSingleUi(page);

        await page.goForward();
        await expect.poll(() => boxIds(page)).toEqual(discoverFeed[2]);
        await expectSingleUi(page);
    });

    test('sort change re-binds rows in the new order and clears selection', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/discover/38`);
        await page.locator('#markify-select-all').check();
        await page.locator('#sort-popular').click();
        await expect.poll(() => boxIds(page)).toEqual([...discoverFeed[1]].reverse());
        await expect(selected(page)).toHaveText('📥 Download Selected (0)');
        // Irrelevant query parameters do not count as a new listing.
        await page.evaluate(() => history.pushState({}, '', `${location.pathname}${location.search}&utm_source=x#top`));
        await page.waitForTimeout(800);
        await page.locator('[data-item-id="1001"]').check();
        await page.waitForTimeout(800);
        await expect(selected(page)).toHaveText('📥 Download Selected (1)');
    });

    test('home → discover → thread → back swaps between panel and toolbar without duplicates', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/`);
        await expect(page.locator('#markify-container')).toBeHidden();
        await expect(page.locator('#markify-batch-panel')).toHaveCount(0);

        await page.locator('main a', { hasText: '求职' }).click();
        await expect.poll(() => boxIds(page)).toEqual(discoverFeed[1]);
        await expect(page.locator('#markify-container')).toBeHidden();

        await page.locator('[data-sentry-component="ForumThreadItem"]', { hasText: 'by bob' }).click({ position: { x: 400, y: 10 } });
        await expect(page.locator('h1')).toHaveText('Visa timeline 2026');
        await expect(page.locator('#markify-batch-panel')).toHaveCount(0);
        await expect(page.locator('.markify-checkbox-wrapper')).toHaveCount(0);
        await expect(page.locator('#markify-container')).toBeVisible();
        const { name } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(name).toBe('Visa timeline 2026.md');

        await page.goBack();
        await expect.poll(() => boxIds(page)).toEqual(discoverFeed[1]);
        await expect(page.locator('#markify-container')).toBeHidden();
        await expectSingleUi(page);
        // The thread just exported is marked on the listing.
        await expect(page.locator('.markify-checkbox-wrapper:has(span[title="Already downloaded"]) input')).toHaveAttribute('data-item-id', '1002');
    });

    test('URL changes before the DOM: the new page ends up with only its own rows', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/discover/38`);
        await page.evaluate(() => { (window as any).__spaDelay = 1500; });
        await page.locator('#page-2').click();
        await page.waitForTimeout(700);
        // Old rows are still rendered; whatever is ticked in this window must not survive.
        await page.locator('#markify-select-all').check({ force: true }).catch(() => undefined);
        await expect.poll(() => boxIds(page), { timeout: 5000 }).toEqual(discoverFeed[2]);
        await expect(selected(page)).toHaveText('📥 Download Selected (0)');
        await expectSingleUi(page);
    });

    test('late hydration: an empty, busy feed gets controls once rows render', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/tag/${encodeURIComponent('面经')}`);
        await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
        await expect(selected(page)).toBeDisabled();
        await expect.poll(() => boxIds(page)).toEqual(['1002', '1007']);
        await page.locator('#markify-select-all').check();
        const zip = await markify.downloadZip(() => selected(page).click());
        expect(zip.name).toMatch(/^1point3acres-tag-面经-\d{4}-\d{2}-\d{2}\.zip$/);
        expect(Object.keys(zip.files).sort()).toEqual(['1002 - Visa timeline 2026.md', '1007 - Exactly one page of replies.md']);
    });

    test('appended rows join unselected; selection on existing rows survives', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/forum/145?ids=1001,1002`);
        await page.locator('[data-item-id="1001"]').check();
        await page.evaluate(rows => document.querySelector('#feed')!.insertAdjacentHTML('beforeend', rows), p3aRows(['1007']));
        await expect.poll(() => boxIds(page)).toEqual(['1001', '1002', '1007']);
        await expect(page.locator('[data-item-id="1001"]')).toBeChecked();
        await expect(page.locator('[data-item-id="1007"]')).not.toBeChecked();
        await expect(selected(page)).toHaveText('📥 Download Selected (1)');
    });

    test('re-rendering identical rows rebinds once without stacking padding', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/forum/145?ids=1001,1002`);
        await expect.poll(() => boxIds(page)).toEqual(['1001', '1002']);
        const padding = () => page.locator('[data-sentry-component="ForumThreadItem"]').first().evaluate(el => getComputedStyle(el).paddingLeft);
        const before = await padding();
        for (let i = 0; i < 3; i++) {
            await page.evaluate(rows => { document.querySelector('#feed')!.innerHTML = rows; }, p3aRows(['1001', '1002']));
            await page.waitForTimeout(300);
        }
        await expect.poll(() => boxIds(page)).toEqual(['1001', '1002']);
        expect(await padding()).toBe(before);
        await expectSingleUi(page);
    });

    test('pages outside @match (lookalike host, bare /home) never load the script', async ({ markify, page }) => {
        for (const url of [`${P3A}/home`, 'https://www.1point3acres.com.evil.example/home/discover/38']) {
            markify.intercept(url, () => ({ status: 200, contentType: 'text/html', body: '<main><h1>x</h1></main>' }));
            await page.goto(url);
            expect(await page.evaluate(() => (window as any).__markifyInjected ?? false), url).toBe(false);
        }
    });

    test('a disabled 1Point3Acres profile shows no controls anywhere on the site', async ({ markify, page }) => {
        markify.store.set('markify_overrides_v1', { schema_version: 1, global: {}, sites: { '1point3acres': { enabled: false } } });
        await markify.open(`${P3A}/home/thread/1002`);
        await expect(page.locator('#markify-container')).toBeHidden();
        await markify.open(`${P3A}/home/discover/38`);
        await page.waitForTimeout(800);
        await expect(page.locator('#markify-batch-panel')).toHaveCount(0);
    });
});

/**
 * The settings page (menu → ⚙️ Settings): real options that drive exports, per
 * site or for all sites, plus the AI console API, history and configuration.
 */
import type { Page } from '@playwright/test';
import { test, expect, type MarkifyBrowser } from '../../support/harness';
import { LINUXDO, P3A } from '../../fixtures';

const KEY = 'markify_overrides_v1';
const dialog = (page: Page) => page.locator('#markify-settings [role="dialog"]');
const field = (page: Page, name: string) => page.locator(`#markify-settings [data-field="${name}"]`);
const button = (page: Page, action: string) => page.locator(`#markify-settings [data-action="${action}"]`);

async function openSettings(markify: MarkifyBrowser, page: Page) {
    await markify.runMenu('Settings');
    await expect(dialog(page)).toBeVisible();
}

async function saveAndReload(markify: MarkifyBrowser, page: Page, action = 'save') {
    await Promise.all([page.waitForEvent('load'), button(page, action).click()]);
    await markify.ready();
}

test.describe('settings page', () => {
    test('file names and timeout per site and for all sites; the site wins, and resetting it falls back', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1002`);
        await openSettings(markify, page);
        await expect(page.locator('#markify-settings [data-action="scope"]')).toHaveValue('1point3acres');
        // Empty fields show what they inherit.
        await expect(field(page, 'filename.single')).toHaveAttribute('placeholder', 'Empty = use {title}');
        await field(page, 'filename.single').fill('P3A {id} {title}');
        await expect(page.locator('#markify-settings [data-preview="single"]')).toHaveText('P3A 12345 示例标题 Example.md');
        await field(page, 'runtime.timeout_ms').fill('45');
        await saveAndReload(markify, page);
        await markify.lastNotification('Settings saved');
        expect(markify.store.get(KEY)).toEqual({ schema_version: 1, global: {}, sites: { '1point3acres': { filename: { single: 'P3A {id} {title}' }, runtime: { timeout_ms: 45000 } } } });
        expect((await markify.download(() => page.locator('#markify-download-btn').click())).name).toBe('P3A 1002 Visa timeline 2026.md');

        // All sites: the site's own value still wins.
        await openSettings(markify, page);
        await expect(field(page, 'filename.single')).toHaveValue('P3A {id} {title}');
        await page.locator('#markify-settings [data-action="scope"]').selectOption('');
        await field(page, 'filename.single').fill('{site} - {title}');
        await saveAndReload(markify, page);
        expect(markify.store.get(KEY)).toMatchObject({ global: { filename: { single: '{site} - {title}' } } });
        expect((await markify.download(() => page.locator('#markify-download-btn').click())).name).toBe('P3A 1002 Visa timeline 2026.md');

        await openSettings(markify, page);
        await expect(field(page, 'filename.single')).toHaveValue('P3A {id} {title}');
        await saveAndReload(markify, page, 'reset-site');
        expect(markify.store.get(KEY)).toEqual({ schema_version: 1, global: { filename: { single: '{site} - {title}' } }, sites: {} });
        expect((await markify.download(() => page.locator('#markify-download-btn').click())).name).toBe('1point3acres - Visa timeline 2026.md');
    });

    test('invalid values are explained in place and nothing is stored', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1002`);
        await openSettings(markify, page);
        await field(page, 'filename.single').fill('{title} {views}');
        await button(page, 'save').click();
        await expect(page.locator('#markify-settings .error')).toContainText('Allowed placeholders: title, author, id, date, site');
        await expect(dialog(page)).toBeVisible();
        expect(markify.store.get(KEY)).toEqual({ schema_version: 1, global: {}, sites: {} });

        await page.locator('#markify-settings [data-input="import"]').fill('{ not json');
        await button(page, 'import').click();
        await expect(page.locator('#markify-settings .error')).not.toBeEmpty();
        await page.keyboard.press('Escape');
        await expect(page.locator('#markify-settings')).toHaveCount(0);
    });

    test('a site can be turned off and back on from the page itself', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1002`);
        await openSettings(markify, page);
        await field(page, 'enabled').uncheck();
        await saveAndReload(markify, page);
        expect(markify.store.get(KEY)).toEqual({ schema_version: 1, global: {}, sites: { '1point3acres': { enabled: false } } });
        await expect(page.locator('#markify-container')).toBeHidden();

        await openSettings(markify, page);
        await expect(page.locator('#markify-settings [data-action="scope"]')).toHaveValue('1point3acres');
        await expect(field(page, 'enabled')).not.toBeChecked();
        await field(page, 'enabled').check();
        await saveAndReload(markify, page);
        await expect(page.locator('#markify-container')).toBeVisible();
    });

    test('AI console API, history, button position and configuration export', async ({ markify, page }) => {
        markify.store.set('markify_download_history', {
            '1point3acres:1001': { id: '1001', site: '1point3acres', title: 'A', downloadedAt: '2026-01-01T00:00:00.000Z', type: 'single' },
            'linuxdo:400001': { id: '400001', site: 'linuxdo', title: 'B', downloadedAt: '2026-01-01T00:00:00.000Z', type: 'single' },
        });
        markify.store.set('markify_button_x', 5);
        markify.store.set('markify_button_y', 6);
        await markify.open(`${P3A}/home/thread/1002`);
        await openSettings(markify, page);

        const status = page.locator('#markify-settings [data-status="history"]');
        await expect(status).toHaveText('1 on this site, 2 in total');
        await button(page, 'clear-site').click();
        await expect(status).toHaveText('0 on this site, 1 in total');
        expect(Object.keys(markify.store.get('markify_download_history') as object)).toEqual(['linuxdo:400001']);

        const agent = page.locator('#markify-settings [data-status="agent"]');
        await expect(agent).toHaveText('Off.');
        await button(page, 'agent-copy').click();
        await expect(agent).toContainText('On:');
        const token = markify.clipboard.at(-1)!;
        expect(token).toMatch(/^mfy_[0-9a-f]{32}$/);
        // The token is only on the clipboard, never in the page.
        expect(await page.evaluate(value => document.documentElement.outerHTML.includes(value)
            || document.querySelector('#markify-settings')!.shadowRoot!.innerHTML.includes(value), token)).toBe(false);
        await button(page, 'agent-revoke').click();
        await expect(agent).toHaveText('Off.');
        expect(markify.store.get('markify_agent_api_v1')).toEqual({ sites: {} });

        await button(page, 'reset-button').click();
        await expect.poll(() => markify.store.has('markify_button_x')).toBe(false);

        await field(page, 'filename.batch').fill('{site}-{date}');
        await button(page, 'export').click();
        // Export includes unsaved edits, as the page shows them.
        expect(JSON.parse(markify.clipboard.at(-1)!)).toEqual({ schema_version: 1, global: {}, sites: { '1point3acres': { filename: { batch: '{site}-{date}' } } } });
    });

    test('page scripts cannot press its buttons', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1002`);
        await openSettings(markify, page);
        await field(page, 'filename.single').fill('Hijacked {title}');
        await page.evaluate(() => {
            const root = document.querySelector('#markify-settings')!.shadowRoot!;
            (root.querySelector('[data-action="save"]') as HTMLElement).click();
            (root.querySelector('[data-action="reset-all"]') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        await expect(dialog(page)).toBeVisible();
        expect(markify.store.get(KEY)).toEqual({ schema_version: 1, global: {}, sites: {} });
    });

    test('other sites can be configured from any supported page', async ({ markify, page }) => {
        await markify.open(`${LINUXDO}/t/topic/400001`);
        await openSettings(markify, page);
        await expect(page.locator('#markify-settings [data-action="scope"] option:checked')).toHaveText('LINUX DO (this page)');
        await page.locator('#markify-settings [data-action="scope"]').selectOption('1point3acres');
        await field(page, 'filename.single').fill('[{id}] {title}');
        await saveAndReload(markify, page);
        expect(markify.store.get(KEY)).toEqual({ schema_version: 1, global: {}, sites: { '1point3acres': { filename: { single: '[{id}] {title}' } } } });
    });
});

test.describe('settings page in Chinese', () => {
    test.use({ locale: 'zh-CN' });
    test('follows the browser language', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1002`);
        await openSettings(markify, page);
        await expect(page.locator('#markify-settings h2')).toHaveText('⚙️ Markify 设置');
        await expect(button(page, 'save')).toHaveText('保存并刷新');
    });
});

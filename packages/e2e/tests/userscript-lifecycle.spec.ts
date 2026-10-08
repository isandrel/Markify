import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, readMetadata, repoRoot, userscriptPath } from '../support/harness';
import { BLOG, P3A, USCF } from '../fixtures/sites';

test.describe('userscript metadata', () => {
    const source = readFileSync(userscriptPath, 'utf8');
    const metadata = readMetadata(source);

    test('activation, connect hosts and grants are generated from the profiles', () => {
        expect(metadata.matches).toEqual([
            'https://instant.1point3acres.com/thread/*',
            'https://www.1point3acres.com/bbs/thread-*',
            'https://www.1point3acres.com/home/*',
            'https://www.uscardforum.com/*',
        ]);
        expect(metadata.connects).toEqual(['api.1point3acres.com', 'self']);
        const used = [...new Set([...source.matchAll(/\bGM\.(\w+)\(/g)].map(m => `GM.${m[1]}`))];
        expect(used.filter(api => !metadata.grants.includes(api)), 'GM APIs used without @grant').toEqual([]);
    });

    test('does not run on pages outside its @match list', async ({ markify, page }) => {
        await page.goto(`${BLOG}/post`);
        expect(await page.evaluate(() => (window as any).__markifyInjected ?? false)).toBe(false);
        await expect(page.locator('#markify-container')).toHaveCount(0);
        // The forum home ("/home" without a trailing slash) is outside "home/*" too.
        await page.goto(`${P3A}/home`);
        expect(await page.evaluate(() => (window as any).__markifyInjected ?? false)).toBe(false);
        void markify; // Installs the fixture routes these navigations rely on.
    });
});

test.describe('toolbar and configuration', () => {
    test('toolbar uses the configured labels and default position', async ({ markify, page }) => {
        await markify.open(`${USCF}/t/slug/2001`);
        const ui = readFileSync(join(repoRoot, 'config/ui.toml'), 'utf8');
        const configured = (key: string) => ui.match(new RegExp(`^${key}\\s*=\\s*"(.*)"`, 'm'))![1];
        await expect(page.locator('#markify-download-btn')).toHaveText(configured('download_text'));
        await expect(page.locator('#markify-copy-btn')).toHaveText(configured('copy_text'));
        expect(await page.locator('#markify-container').evaluate(el => el.style.top)).toBe(configured('default_top'));
        expect(await page.locator('#markify-container').evaluate(el => el.style.right)).toBe(configured('default_right'));
    });

    test('dragging the toolbar persists its position across reloads', async ({ markify, page }) => {
        await markify.open(`${USCF}/t/slug/2001`);
        const container = page.locator('#markify-container');
        const box = (await container.boundingBox())!;
        // Grab the gap between the two buttons; pressing on a button must not drag.
        const download = (await page.locator('#markify-download-btn').boundingBox())!;
        const copy = (await page.locator('#markify-copy-btn').boundingBox())!;
        const grip = { x: (download.x + download.width + copy.x) / 2, y: box.y + box.height / 2 };
        expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, grip)).toBe('markify-container');
        await page.mouse.move(grip.x, grip.y);
        await page.mouse.down();
        await page.mouse.move(200, 300, { steps: 5 });
        await page.mouse.up();
        const expected = { x: 200 - (grip.x - box.x), y: 300 - (grip.y - box.y) };
        await expect.poll(() => markify.store.has('markify_button_y')).toBe(true);
        // Sub-pixel rounding of mouse coordinates is allowed.
        expect(Math.abs((markify.store.get('markify_button_x') as number) - expected.x)).toBeLessThanOrEqual(1);
        expect(Math.abs((markify.store.get('markify_button_y') as number) - expected.y)).toBeLessThanOrEqual(1);

        await page.reload();
        await markify.ready();
        const moved = (await container.boundingBox())!;
        expect(Math.abs(moved.x - (markify.store.get('markify_button_x') as number))).toBeLessThanOrEqual(1);
        expect(Math.abs(moved.y - (markify.store.get('markify_button_y') as number))).toBeLessThanOrEqual(1);
    });

    test('menu commands are registered with readable labels', async ({ markify, page }) => {
        await markify.open(`${USCF}/t/slug/2001`);
        const names = await page.evaluate(() => Object.keys((window as any).__markifyMenu));
        expect(names).toHaveLength(8);
        for (const name of names) expect(name, `menu label ${JSON.stringify(name)}`).not.toContain('�');
    });

    test('stats, history, clear history and reset stats menus', async ({ markify, page }) => {
        await markify.open(`${USCF}/t/slug/2001`);
        await markify.download(() => page.locator('#markify-download-btn').click());
        await expect.poll(() => markify.store.has('markify_download_history')).toBe(true);

        await markify.runMenu('Stats');
        const stats = await markify.lastNotification(/1 single/i);
        expect(stats.text).toMatch(/1 total/i);

        const dialogs: string[] = [];
        page.on('dialog', dialog => { dialogs.push(`${dialog.type()}:${dialog.message()}`); void dialog.accept(); });
        await markify.runMenu('Download History');
        expect(dialogs.at(-1)).toContain('alert:Download History (1 items)');
        expect(dialogs.at(-1)).toContain('Amex Platinum offer (uscardforum)');

        await markify.runMenu('Clear History');
        expect(dialogs.at(-1)).toMatch(/^confirm:/);
        await markify.lastNotification(/history cleared/i);
        expect(markify.store.get('markify_download_history')).toEqual({});

        await markify.runMenu('Reset Stats');
        await markify.lastNotification(/stats reset/i);
        expect(markify.store.get('markify_stats')).toBe(0);
    });

    test('settings dialog saves preferences and reloads', async ({ markify, page }) => {
        await markify.open(`${USCF}/t/slug/2001`);
        await markify.runMenu('Settings');
        await expect(page.locator('#markify-settings-panel')).toBeVisible();
        await page.locator('#markify-settings #include-tags').uncheck();
        await Promise.all([page.waitForEvent('load'), page.locator('#markify-save').click()]);
        await markify.ready();
        expect(JSON.parse(markify.store.get('markify_settings') as string)).toMatchObject({ includeTags: false });
        await markify.lastNotification('Settings saved successfully!');

        await markify.runMenu('Settings');
        await expect(page.locator('#markify-settings #include-tags')).not.toBeChecked();
        await page.locator('#markify-close').click();
        await expect(page.locator('#markify-settings')).toHaveCount(0);
    });

    test('export, import and per-site reset of configuration overrides', async ({ markify, page }) => {
        await markify.open(`${USCF}/t/slug/2002`);
        await markify.runMenu('Export Configuration');
        expect(JSON.parse(markify.clipboard.at(-1)!)).toEqual({ schema_version: 1, global: {}, sites: {} });

        const override = { schema_version: 1, global: {}, sites: { uscardforum: { filename: { single: 'USCF {id} {title}' } } } };
        page.once('dialog', dialog => void dialog.accept(JSON.stringify(override)));
        await Promise.all([page.waitForEvent('load'), markify.runMenu('Import Configuration')]);
        await markify.ready();
        expect(markify.store.get('markify_overrides_v1')).toEqual(override);
        expect((await markify.download(() => page.locator('#markify-download-btn').click())).name).toBe('USCF 2002 Chase 5-24 rule.md');

        await Promise.all([page.waitForEvent('load'), markify.runMenu('Reset Current Site Configuration')]);
        await markify.ready();
        expect(markify.store.get('markify_overrides_v1')).toEqual({ schema_version: 1, global: {}, sites: {} });
        expect((await markify.download(() => page.locator('#markify-download-btn').click())).name).toBe('Chase 5-24 rule.md');
    });

    test('invalid imported configuration is rejected without being stored', async ({ markify, page }) => {
        await markify.open(`${USCF}/t/slug/2002`);
        page.once('dialog', dialog => void dialog.accept(JSON.stringify({ schema_version: 1, sites: { unknown: { enabled: false } }, global: { api: {} } })));
        await markify.runMenu('Import Configuration');
        await markify.lastNotification('Invalid configuration');
        expect(markify.store.get('markify_overrides_v1')).toEqual({ schema_version: 1, global: {}, sites: {} });
    });

    test('site override can disable a profile entirely', async ({ markify, page }) => {
        markify.store.set('markify_overrides_v1', { schema_version: 1, global: {}, sites: { uscardforum: { enabled: false } } });
        await markify.open(`${USCF}/t/slug/2001`);
        await expect(page.locator('#markify-container')).toBeHidden();
        await markify.open(`${P3A}/home/thread/1002`);
        await expect(page.locator('#markify-container')).toBeVisible();
    });

    test('legacy template filename settings migrate once with a backup', async ({ markify, page }) => {
        const legacy = { filename: { single: 'Legacy {title}' } };
        markify.store.set('markify_templates', legacy);
        await markify.open(`${P3A}/home/thread/1002`);
        expect(markify.store.get('markify_templates_backup_v1')).toEqual(legacy);
        expect(markify.store.get('markify_overrides_v1')).toEqual({
            schema_version: 1, sites: {},
            global: { filename: { single: 'Legacy {title}', batch_item: 'Legacy {title}' } },
        });
        expect((await markify.download(() => page.locator('#markify-download-btn').click())).name).toBe('Legacy Visa timeline 2026.md');
    });
});

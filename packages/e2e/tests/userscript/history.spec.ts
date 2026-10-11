/**
 * Download history: each download keeps the thread's state, so Markify can tell
 * which downloaded threads changed since (thread page, listings, history page).
 */
import type { Page } from '@playwright/test';
import { test, expect, type MarkifyBrowser } from '../../support/harness';
import { DEFAULT_UPDATED, LINUXDO, P3A } from '../../fixtures';

const HISTORY = 'markify_download_history';
/** The 1Point3Acres fixture's lastpost (EPOCH + 1h). */
const P3A_UPDATED = '2026-01-01T01:00:00.000Z';
type Seed = { site: string; id: string; title: string; downloadedAt: string; replies?: number; updated?: string };

function seed(markify: MarkifyBrowser, records: Seed[]) {
    markify.store.set(HISTORY, Object.fromEntries(records.map(record => [`${record.site}:${record.id}`, { type: 'single', ...record }])));
}
const records = (markify: MarkifyBrowser) => markify.store.get(HISTORY) as Record<string, Record<string, any>>;
const history = (page: Page) => page.locator('#markify-history');
const rowOf = (page: Page, key: string) => history(page).locator(`tr[data-key="${key}"]`);

test.describe('download history and updates', () => {
    test('a download keeps the thread state; the thread page marks threads that changed since', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1001`);
        await markify.download(() => page.locator('#markify-download-btn').click());
        await expect.poll(() => records(markify)?.['1point3acres:1001']).toMatchObject({ replies: 30, updated: P3A_UPDATED });

        // Nothing happened after the download.
        await markify.open(`${P3A}/home/thread/1001`);
        await expect(page.locator('[data-markify-owned="history"]')).toHaveAttribute('data-markify-status', 'downloaded');
        await expect.poll(() => records(markify)['1point3acres:1001'].check).toMatchObject({ replies: 30, updated: P3A_UPDATED });

        // Downloaded before the last post, with fewer replies.
        seed(markify, [{ site: '1point3acres', id: '1001', title: 'Offer', downloadedAt: '2025-12-31T00:00:00.000Z', replies: 20 }]);
        await markify.open(`${P3A}/home/thread/1001`);
        const indicator = page.locator('[data-markify-owned="history"]');
        await expect(indicator).toHaveAttribute('data-markify-status', 'updated');
        await expect(indicator).toHaveText('✓ ↻ +10');
        await expect(indicator).toHaveAttribute('title', 'Downloaded; 10 new replies since');

        // Records from older versions have no snapshot: later activity alone counts.
        seed(markify, [{ site: '1point3acres', id: '1002', title: 'Visa', downloadedAt: '2025-12-31T00:00:00.000Z' }]);
        await markify.open(`${P3A}/home/thread/1002`);
        await expect(page.locator('[data-markify-owned="history"]')).toHaveText('✓ ↻');
    });

    test('Discourse listings mark downloaded topics with activity after the download, without requests', async ({ markify, page }) => {
        seed(markify, [
            { site: 'linuxdo', id: '400001', title: 'A', downloadedAt: '2026-01-15T00:00:00.000Z' },
            { site: 'linuxdo', id: '400002', title: 'B', downloadedAt: '2026-03-01T00:00:00.000Z' },
        ]);
        await markify.open(`${LINUXDO}/latest`);
        const status = (id: string) => page.locator(`.markify-batch-checkbox[data-item-id="${id}"] ~ .markify-history-indicator`);
        await expect(status('400001')).toHaveAttribute('data-markify-status', 'updated');
        await expect(status('400001')).toHaveText('✓↻');
        await expect(status('400002')).toHaveAttribute('data-markify-status', 'downloaded');
        await expect(status('400004')).toHaveCount(0);
        expect(markify.apiRequests(`${LINUXDO}/t/`)).toEqual([]);

        // A batch download keeps each topic's state too.
        await page.locator('.markify-batch-checkbox[data-item-id="400004"]').uncheck();
        await page.locator('.markify-batch-checkbox[data-item-id="400002"]').check();
        await markify.downloadZip(() => page.locator('#markify-batch-panel button').click());
        await expect.poll(() => records(markify)['linuxdo:400002']).toMatchObject({ type: 'batch', replies: 19, updated: DEFAULT_UPDATED });
    });

    test('history page: check for updates, filter, download again, remove; other sites are read-only here', async ({ markify, page }) => {
        seed(markify, [
            { site: '1point3acres', id: '1001', title: 'Offer 比较: Google vs Meta', downloadedAt: '2025-12-31T00:00:00.000Z', replies: 20 },
            { site: '1point3acres', id: '1002', title: 'Visa timeline 2026', downloadedAt: '2026-06-01T00:00:00.000Z', replies: 0 },
            { site: 'linuxdo', id: '400001', title: 'LINUX DO topic', downloadedAt: '2026-06-01T00:00:00.000Z' },
        ]);
        await markify.open(`${P3A}/home/thread/1007`);
        await markify.runMenu('Download History');
        const summary = history(page).locator('[data-status="summary"]');
        await expect(summary).toHaveText('2 threads · 0 updated · 2 not checked');
        await expect(rowOf(page, '1point3acres:1001').locator('.chip')).toHaveText('Not checked');
        await expect(rowOf(page, '1point3acres:1001').locator('a')).toHaveAttribute('href', `${P3A}/bbs/thread-1001-1-1.html`);

        await history(page).locator('[data-action="check"]').click();
        await expect(summary).toHaveText('2 threads · 1 updated · 0 not checked', { timeout: 20_000 });
        await expect(rowOf(page, '1point3acres:1001').locator('.chip')).toHaveText('Updated · +10 replies');
        await expect(rowOf(page, '1point3acres:1002').locator('.chip')).toHaveText('Up to date');
        expect(records(markify)['1point3acres:1001'].check).toMatchObject({ replies: 30, updated: P3A_UPDATED });

        await history(page).locator('[data-action="filter"]').selectOption('changed');
        await expect(history(page).locator('tbody tr')).toHaveCount(1);
        const { name } = await markify.download(() => rowOf(page, '1point3acres:1001').locator('[data-action="redownload"]').click());
        expect(name).toBe('Offer 比较- Google vs Meta.md');
        // Downloaded again: up to date, so the "updated" filter is empty now.
        await expect(history(page).locator('tbody tr')).toHaveCount(0);
        expect(records(markify)['1point3acres:1001']).toMatchObject({ replies: 30, updated: P3A_UPDATED });

        await history(page).locator('[data-action="filter"]').selectOption('all');
        await rowOf(page, '1point3acres:1002').locator('[data-action="remove"]').click();
        await expect(rowOf(page, '1point3acres:1002')).toHaveCount(0);
        expect(Object.keys(records(markify)).sort()).toEqual(['1point3acres:1001', 'linuxdo:400001']);

        await history(page).locator('[data-action="site"]').selectOption('linuxdo');
        await expect(history(page)).toContainText('Open LINUX DO to check or re-download its threads.');
        await expect(history(page).locator('[data-action="check"]')).toHaveCount(0);
        await expect(rowOf(page, 'linuxdo:400001').locator('[data-action="redownload"]')).toHaveCount(0);
    });

    test('a thread that can no longer be checked says so on its row', async ({ markify, page }) => {
        seed(markify, [{ site: '1point3acres', id: '1014', title: 'Login required', downloadedAt: '2026-06-01T00:00:00.000Z' }]);
        await markify.open(`${P3A}/home/thread/1007`);
        await markify.runMenu('Download History');
        await history(page).locator('[data-action="check"]').click();
        await expect(rowOf(page, '1point3acres:1014').locator('.chip')).toHaveText('Check failed', { timeout: 20_000 });
    });

    test('backup: export to a file, import into another browser; settings and history refuse each other\'s files', async ({ markify, page }) => {
        seed(markify, [
            { site: '1point3acres', id: '1001', title: 'Offer', downloadedAt: '2026-01-02T00:00:00.000Z', replies: 20 },
            { site: 'linuxdo', id: '400001', title: 'LINUX DO topic', downloadedAt: '2026-01-03T00:00:00.000Z' },
        ]);
        await markify.open(`${P3A}/home/thread/1007`);
        await markify.runMenu('Download History');
        await expect(history(page).locator('.backup')).toContainText('not part of the settings backup');
        const { name, text } = await markify.download(() => history(page).locator('[data-action="export-file"]').click());
        expect(name).toBe(`markify-download-history-${new Date().toISOString().slice(0, 10)}.json`);
        const backup = JSON.parse(text);
        expect(backup).toMatchObject({ kind: 'markify-download-history', version: 1 });
        expect(backup.records.map((record: Seed) => `${record.site}:${record.id}`)).toEqual(['1point3acres:1001', 'linuxdo:400001']);
        await expect(history(page).locator('[data-status="backup"]')).toHaveText('Exported 2 threads');

        // Another browser: one thread of its own, and an older download of one in the file.
        seed(markify, [
            { site: '1point3acres', id: '1002', title: 'Visa', downloadedAt: '2026-01-01T00:00:00.000Z' },
            { site: '1point3acres', id: '1001', title: 'Offer', downloadedAt: '2025-12-01T00:00:00.000Z' },
        ]);
        await markify.open(`${P3A}/home/thread/1007`);
        await markify.runMenu('Download History');
        const file = (body: string) => ({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(body) });
        await history(page).locator('[data-input="import-file"]').setInputFiles(file(text));
        await expect(history(page).locator('[data-status="backup"]')).toHaveText('Imported: 1 new, 1 updated, 0 already here');
        await expect(history(page).locator('[data-status="summary"]')).toHaveText('2 threads · 0 updated · 2 not checked');
        expect(Object.keys(records(markify)).sort()).toEqual(['1point3acres:1001', '1point3acres:1002', 'linuxdo:400001']);
        expect(records(markify)['1point3acres:1001']).toMatchObject({ downloadedAt: '2026-01-02T00:00:00.000Z', replies: 20 });

        // A settings backup is not a history, and the other way round.
        await history(page).locator('[data-input="import-file"]').setInputFiles(file(JSON.stringify({ schema_version: 1, global: {}, sites: {} })));
        await expect(history(page).locator('.error')).toHaveText('This is a settings backup, not a download history. Import it in Settings.');
        await page.keyboard.press('Escape');
        await markify.runMenu('Settings');
        await expect(page.locator('#markify-settings')).toContainText('The download history is backed up separately');
        await page.locator('#markify-settings [data-input="import"]').fill(text);
        await page.locator('#markify-settings [data-action="import"]').click();
        await expect(page.locator('#markify-settings .error')).toHaveText('This is a download history backup, not settings. Import it on the Download History page.');
        expect(markify.store.get('markify_overrides_v1') ?? {}).not.toHaveProperty('kind');
    });

    test('settings link to the history page', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1007`);
        await markify.runMenu('Settings');
        await page.locator('#markify-settings [data-action="open-history"]').first().click();
        await expect(page.locator('#markify-settings')).toHaveCount(0);
        await expect(history(page).locator('[role="dialog"]')).toBeVisible();
    });
});

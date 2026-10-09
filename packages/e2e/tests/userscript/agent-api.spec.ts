/**
 * window.markify, the token-gated console API for AI agents driving the user's
 * own browser (DevTools MCP evaluate_script and similar). Off until the menu turns
 * it on for a site; every call needs that site's token.
 */
import type { Page } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { test, expect, type MarkifyBrowser } from '../../support/harness';
import { LINUXDO, P3A, discoverFeed } from '../../fixtures';

const TOKEN = `mfy_${'ab'.repeat(16)}`;
const KEY = 'markify_agent_api_v1';

/** What an agent's evaluate_script does: connect with the token, then call one method. */
function agent(page: Page, token: string, method: string, ...args: unknown[]): Promise<{ value?: any; error?: { code: string; message: string } }> {
    return page.evaluate(async ([token, method, args]) => {
        try {
            const client = await (window as any).markify.connect(token);
            return { value: await client[method](...args) };
        } catch (error) {
            return { error: error as { code: string; message: string } };
        }
    }, [token, method, args] as const);
}

function enable(markify: MarkifyBrowser, site: string, token = TOKEN) {
    markify.store.set(KEY, { sites: { [site]: { token, createdAt: '2026-01-01T00:00:00.000Z' } } });
}

test.describe('AI console API (window.markify)', () => {
    test('is off by default; the menu turns it on and puts the token only on the clipboard', async ({ markify, page }) => {
        await markify.open(`${P3A}/home/thread/1001`);
        expect(await page.evaluate(() => typeof (window as any).markify)).toBe('undefined');

        await markify.runMenu('AI Console API: copy token');
        const token = markify.clipboard.at(-1)!;
        expect(token).toMatch(/^mfy_[0-9a-f]{32}$/);
        expect(markify.store.get(KEY)).toMatchObject({ sites: { '1point3acres': { token } } });
        expect(markify.notifications.at(-1)!.text).toContain('AI console API on for 1Point3Acres');
        for (const notification of markify.notifications) expect(notification.text).not.toContain(token);
        expect(await page.evaluate(value => document.documentElement.outerHTML.includes(value), token)).toBe(false);

        // Asking again copies the same token rather than silently rotating it.
        await markify.runMenu('AI Console API: copy token');
        expect(markify.clipboard.at(-1)).toBe(token);

        expect((await page.evaluate(() => (window as any).markify.help())).usage).toContain('markify.connect(token)');
        expect((await agent(page, `mfy_${'0'.repeat(32)}`, 'status')).error?.code).toBe('UNAUTHORIZED');
        expect((await agent(page, token, 'status')).value).toMatchObject({ site: { id: '1point3acres' }, page: { kind: 'thread', id: '1001' } });

        // Export returns the same Markdown the button produces, without downloading or touching history.
        const { value } = await agent(page, token, 'export');
        expect(value).toMatchObject({ ok: true, site: '1point3acres', id: '1001', title: 'Offer 比较: Google vs Meta', filename: 'Offer 比较- Google vs Meta.md' });
        expect(parseYaml(value.markdown.match(/^---\n([\s\S]*?)\n---\n/)[1])).toMatchObject({ title: 'Offer 比较: Google vs Meta', replies: 30 });
        expect(value.markdown).toContain('# Offer 比较: Google vs Meta');
        expect(markify.store.get('markify_download_history')).toBeUndefined();
        const { text } = await markify.download(() => page.locator('#markify-download-btn').click());
        const strip = (markdown: string) => markdown.replace(/^downloaded_at: .*$/m, '');
        expect(strip(value.markdown)).toBe(strip(text));
    });

    test('other threads by id, failures as data, other sites refused', async ({ markify, page }) => {
        enable(markify, '1point3acres');
        await markify.open(`${P3A}/home/thread/1001`);
        const other = (await agent(page, TOKEN, 'export', 1002)).value;
        expect(other).toMatchObject({ ok: true, id: '1002', title: 'Visa timeline 2026' });
        expect(other.markdown).toContain('No replies yet.');
        expect((await agent(page, TOKEN, 'export', '1014')).value).toMatchObject({ ok: false, id: '1014', error: { code: expect.any(String) } });
        expect((await agent(page, TOKEN, 'export', `${LINUXDO}/t/400001`)).value).toMatchObject({ ok: false, error: { code: 'INVALID_TARGET' } });
        // Only same-site threads: no generic fetch reached another host.
        expect(markify.requests.filter(request => request.url.startsWith(LINUXDO))).toEqual([]);
    });

    test('listing: list rows with history, then exportMany into a ZIP', async ({ markify, page }) => {
        enable(markify, '1point3acres');
        markify.store.set('markify_download_history', { '1point3acres:1002': { id: '1002', site: '1point3acres', title: 'Visa timeline 2026', downloadedAt: '2026-01-01T00:00:00.000Z', type: 'single' } });
        await markify.open(`${P3A}/home/discover/38`);
        await expect.poll(() => page.locator('.markify-batch-checkbox').count()).toBe(20);

        const { value: listing } = await agent(page, TOKEN, 'list');
        expect(listing.items.map((item: { id: string }) => item.id)).toEqual(discoverFeed[1]);
        expect(listing.items[1]).toEqual({ id: '1002', title: 'Visa timeline 2026', url: `${P3A}/home/thread/1002`, downloaded: true });
        expect((await agent(page, TOKEN, 'history')).value.items.map((item: { id: string }) => item.id)).toEqual(['1002']);

        let result: Awaited<ReturnType<typeof agent>> | undefined;
        const zip = await markify.downloadZip(async () => { result = await agent(page, TOKEN, 'exportMany', ['1001', '1003', '1007'], { zip: true }); });
        expect(result!.value.results.map((item: { ok: boolean }) => item.ok)).toEqual([true, false, true]);
        expect(result!.value.zip).toBe(zip.name);
        expect(Object.keys(zip.files).sort()).toEqual(['1001 - Offer 比较- Google vs Meta.md', '1007 - Exactly one page of replies.md']);
        expect(zip.files['1001 - Offer 比较- Google vs Meta.md']).toContain('# Offer 比较: Google vs Meta');
        await expect.poll(() => Object.keys(markify.store.get('markify_download_history') as object).sort())
            .toEqual(['1point3acres:1001', '1point3acres:1002', '1point3acres:1007']);
    });

    test('turning it off revokes the token for clients already connected', async ({ markify, page }) => {
        enable(markify, '1point3acres');
        await markify.open(`${P3A}/home/thread/1001`);
        await page.evaluate(async token => { (window as any).agentClient = await (window as any).markify.connect(token); }, TOKEN);
        await markify.runMenu('AI Console API: turn off');
        expect(markify.store.get(KEY)).toEqual({ sites: {} });
        expect(await page.evaluate(() => (window as any).agentClient.status().catch((error: { code: string }) => error.code))).toBe('DISABLED');
    });

    test('page scripts cannot replace it, and wrong tokens lock it', async ({ markify, page }) => {
        enable(markify, '1point3acres');
        await markify.open(`${P3A}/home/thread/1001`);
        const tampering = await page.evaluate(() => {
            const original = (window as any).markify;
            const results: string[] = [];
            try { (window as any).markify = { connect: () => 'fake' }; } catch { results.push('assign threw'); }
            try { Object.defineProperty(window, 'markify', { value: 1 }); } catch { results.push('define threw'); }
            const connect = original.connect;
            try { original.connect = () => 'fake'; } catch { results.push('method threw'); }
            return { results, same: (window as any).markify === original && original.connect === connect, keys: Object.keys(original).sort() };
        });
        expect(tampering).toEqual({ results: ['define threw'], same: true, keys: ['connect', 'help'] });

        for (let attempt = 0; attempt < 5; attempt++) expect((await agent(page, `mfy_${String(attempt).repeat(32)}`, 'status')).error?.code).toBe('UNAUTHORIZED');
        expect((await agent(page, TOKEN, 'status')).error?.code).toBe('LOCKED');
        // Copying the token from the menu again unlocks it.
        await markify.runMenu('AI Console API: copy token');
        expect((await agent(page, TOKEN, 'status')).value.site.id).toBe('1point3acres');
    });

    test('Discourse (LINUX DO): the open topic keeps its page title; other topics use the listing title', async ({ markify, page }) => {
        enable(markify, 'linuxdo');
        await markify.open(`${LINUXDO}/t/topic/400001`);
        const current = (await agent(page, TOKEN, 'export')).value;
        expect(current).toMatchObject({ ok: true, site: 'linuxdo', id: '400001', title: '[开源] 把网页转成 Markdown 的油猴脚本' });
        expect(current.markdown).toContain('第二页：感谢分享');
        // Tokens are per site.
        expect((await agent(page, `mfy_${'cd'.repeat(16)}`, 'status')).error?.code).toBe('UNAUTHORIZED');

        await markify.open(`${LINUXDO}/latest`);
        await expect.poll(() => page.locator('.markify-batch-checkbox').count()).toBeGreaterThan(0);
        const { value } = await agent(page, TOKEN, 'exportMany', [400002, 400004]);
        expect(value.results[0]).toMatchObject({ ok: true, id: '400002', title: '求助：Docker 容器无法访问外网 / DNS 问题' });
        expect(value.results[0].markdown).toContain('--dns 1.1.1.1');
        expect(value.results[1]).toMatchObject({ ok: false, id: '400004' });
    });
});

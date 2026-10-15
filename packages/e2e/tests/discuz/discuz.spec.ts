/**
 * Discuz! forums: every page of a thread read from its own HTML, both URL styles,
 * board and guide lists, the forum's own refusal notices, times in the forum's
 * time zone. 恩山 lives under /forum; 卡饭 at the root.
 */
import { parse as parseYaml } from 'yaml';
import { test, expect } from '../../support/harness';
import { KAFAN, RIGHT, rightSpec } from '../../fixtures';

const today = () => new Date().toISOString().slice(0, 10);
const boxIds = (page: import('@playwright/test').Page) => page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId));
const frontmatter = (text: string) => parseYaml(text.match(/^---\n([\s\S]*?)\n---\n/)![1]);
const HISTORY = 'markify_download_history';
const thread = rightSpec.threads['700001'];
const fileTitle = '[固件] 小米路由器 4A 刷机教程 -OpenWrt';

test.describe('discuz: thread page', () => {
    test('Download: every page, in floor order, as portable Markdown, with the board and tags', async ({ markify, page }) => {
        await markify.open(`${RIGHT}/forum/thread-700001-1-1.html`);
        await expect(page.locator('#markify-container')).toBeVisible();
        const { name, text } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(name).toBe(`${fileTitle}.md`);
        expect(frontmatter(text)).toMatchObject({
            title: thread.title, author: 'neo', date: '2026-10-01T00:30:00.000Z',
            tags: ['right', 'forum', '路由器交流', '小米', 'OpenWrt'], views: 1234, replies: 6, updated: '2026-10-15T04:58:00.000Z',
        });
        for (const fragment of [
            '*本帖最后由 neo 于 2026-10-01 10:00 编辑*  \n固件下载见附件。\n\n> trinity 发表于 2026-09-30  \n> 原帖内容\n\n```',
            '```\nnvram set a=1\nreboot && echo <ok>\n```',
            `![](${RIGHT}/forum/data/attachment/forum/202610/01/shot.png)`,
            `[firmware.bin](${RIGHT}/forum/forum.php?mod=attachment&aid=MTA=)`,
            '---\n\n## Replies (6)',
            '**#2 trinity** · *2026-10-01T01:00:00.000Z*\n\n感谢分享',
            // Page 2; a recent post's time comes from its title.
            '**#6 morpheus** · *2026-10-14T13:05:09.000Z*\n\n第二页的回复',
            '**#7 smith** · *2026-10-15T04:58:00.000Z*\n\n最后一楼',
        ]) expect(text).toContain(fragment);
        expect(text).not.toMatch(/x7Q2|smile\.gif|none\.gif|下载次数|复制代码/);
        expect(text.indexOf('#5 user5')).toBeLessThan(text.indexOf('#6 morpheus'));
        expect(markify.requests.filter(r => r.via === 'gm').map(r => r.url.replace(RIGHT, ''))).toEqual(['/forum/thread-700001-1-1.html', '/forum/thread-700001-2-1.html']);
        await expect.poll(() => (markify.store.get(HISTORY) as Record<string, unknown>)?.['right:700001']).toMatchObject({ replies: 6, updated: '2026-10-15T04:58:00.000Z' });
    });

    test('the dynamic URL is the same thread; Copy works there', async ({ markify, page }) => {
        await markify.open(`${RIGHT}/forum/forum.php?mod=viewthread&tid=700002&extra=page%3D1`);
        await page.locator('#markify-copy-btn').click();
        await markify.lastNotification('Copied to clipboard!');
        expect(markify.clipboard[0]).toContain('title: "求助：路由器无法上网"');
        expect(markify.clipboard[0]).toContain('**#2 dave** · *2026-10-02T03:00:00.000Z*\n\n重启试试');
    });

    test('the forum\'s own notice (a reading permission) fails the export, without history', async ({ markify, page }) => {
        await markify.open(`${RIGHT}/forum/thread-700003-1-1.html`);
        let downloads = 0;
        page.on('download', () => downloads++);
        await page.locator('#markify-download-btn').click();
        await markify.lastNotification('Failed to convert page');
        expect(downloads).toBe(0);
        expect(markify.store.get(HISTORY)).toBeUndefined();
    });

    test('a downloaded thread with more replies since is marked as updated', async ({ markify, page }) => {
        markify.store.set(HISTORY, { 'right:700001': { site: 'right', id: '700001', title: thread.title, type: 'single', downloadedAt: '2026-10-15T06:00:00.000Z', replies: 4 } });
        await markify.open(`${RIGHT}/forum/thread-700001-1-1.html`);
        await expect(page.locator('[data-markify-owned="history"]')).toHaveText('✓ ↻ +2');
    });

    test('卡饭 at the site root: times without padding, recent times from their title', async ({ markify, page }) => {
        await markify.open(`${KAFAN}/thread-800002-1-1.html`);
        const old = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(frontmatter(old.text)).toMatchObject({ title: '论坛账户问题', date: '2022-05-05T13:44:42.000Z', tags: ['kafan', 'forum', '卡巴斯基'] });
        await markify.open(`${KAFAN}/forum.php?mod=viewthread&tid=800001`);
        const recent = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(recent.text).toContain('**#2 kernel32** · *2026-10-15T01:47:02.000Z*');
    });
});

test.describe('discuz: lists', () => {
    test('board list: normal threads only (no sticky, no sidebar); failures stay selected', async ({ markify, page }) => {
        await markify.open(`${RIGHT}/forum/forum-49-1.html`);
        await expect.poll(() => boxIds(page)).toEqual(rightSpec.board.ids);
        await expect(page.locator('#sd .markify-batch-checkbox')).toHaveCount(0);
        await page.locator('#markify-select-all').check();
        const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click(), 60_000);
        expect(zip.name).toBe(`right-forum-49-${today()}.zip`);
        expect(Object.keys(zip.files).sort()).toEqual([`700001 - ${fileTitle}.md`, '700002 - 求助：路由器无法上网.md']);
        expect(frontmatter(zip.files[`700001 - ${fileTitle}.md`])).toMatchObject({ title: thread.title, replies: 6 });
        const notice = await markify.lastNotification('Download started for');
        expect(notice.text).toContain('VIP 专区帖子: 抱歉，本帖要求阅读权限高于 50 才能浏览');
        await expect(page.locator('[data-item-id="700003"]')).toBeChecked();
    });

    test('the dynamic board URL and the guide; last-reply times mark downloaded threads as updated', async ({ markify, page }) => {
        markify.store.set(HISTORY, {
            // Last reply 2026-10-15 12:58 (+08:00) shown in a title; 10-02 11:00 shown as text.
            'right:700001': { site: 'right', id: '700001', title: 'a', type: 'single', downloadedAt: '2026-10-15T04:00:00.000Z' },
            'right:700002': { site: 'right', id: '700002', title: 'b', type: 'single', downloadedAt: '2026-10-02T02:00:00.000Z' },
        });
        await markify.open(`${RIGHT}/forum/forum.php?mod=forumdisplay&fid=49`);
        await expect.poll(() => boxIds(page)).toEqual(rightSpec.board.ids);
        await markify.open(`${RIGHT}/forum/forum.php?mod=guide&view=new`);
        await expect.poll(() => boxIds(page)).toEqual(rightSpec.guide);
        const status = (id: string) => page.locator(`.markify-batch-checkbox[data-item-id="${id}"] ~ .markify-history-indicator`);
        await expect(status('700001')).toHaveAttribute('data-markify-status', 'updated');
        await expect(status('700002')).toHaveAttribute('data-markify-status', 'updated');
        expect(markify.apiRequests(`${RIGHT}/forum/thread-`)).toEqual([]);
    });
});

/**
 * V2EX: topics through the public API (topic + every reply) plus the topic page
 * for supplements and tags; batch downloads from topic lists; www and bare host.
 */
import { parse as parseYaml } from 'yaml';
import { test, expect } from '../../support/harness';
import { EPOCH_ISO, V2EX, V2EX_BARE, v2exLists, v2exRow, v2exTopics } from '../../fixtures';

const today = () => new Date().toISOString().slice(0, 10);
const boxIds = (page: import('@playwright/test').Page) => page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId));
const frontmatter = (text: string) => parseYaml(text.match(/^---\n([\s\S]*?)\n---\n/)![1]);
const HISTORY = 'markify_download_history';
const rich = v2exTopics['900001'];

test.describe('v2ex: topic page', () => {
    test('Download: topic, supplements and numbered replies, with node and topic tags', async ({ markify, page }) => {
        await markify.open(`${V2EX}/t/900001#reply3`);
        await expect(page.locator('#markify-container')).toBeVisible();
        const { name, text } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(name).toBe(`${rich.title}.md`);
        expect(frontmatter(text)).toMatchObject({
            title: rich.title, source: `${V2EX}/t/900001#reply3`, author: 'livid', date: EPOCH_ISO,
            tags: ['v2ex', 'forum', '分享创造', '油猴', 'Markdown'], replies: 3, updated: '2026-01-01T01:00:00.000Z',
        });
        for (const fragment of [
            '## 功能',
            '```js\nconsole.log("hi")\n```',
            `源码见 [这里](${V2EX}/t/900002)`,
            '### Supplement 1 · *2026-01-01T02:00:00.000Z*\n\n已支持 **V2EX**',
            '### Supplement 2 · *2026-01-01T04:30:00.000Z*\n\n修复了附言导出',
            '---\n\n## Replies (3)',
            '**#1 alice** · *2026-01-01T00:01:00.000Z*\n\n感谢分享 ![](https://cdn.v2ex.com/static/img/emoji.png)',
            `**#2 bob** · *2026-01-01T00:02:00.000Z*\n\n@[alice](${V2EX}/member/alice) #1 同感 ![](https://i.imgur.com/shot.png)`,
            '**#3 livid**',
        ]) expect(text).toContain(fragment);
        // The topic from the API, everything else from its page (the replies API lags); all through GM.
        expect(markify.requests.filter(r => r.via === 'gm').map(r => r.url)).toEqual([`${V2EX}/api/topics/show.json?id=900001`, `${V2EX}/t/900001?p=1`]);
        await expect.poll(() => (markify.store.get(HISTORY) as Record<string, unknown>)?.['v2ex:900001']).toMatchObject({ replies: 3, updated: '2026-01-01T01:00:00.000Z' });
    });

    test('on v2ex.com too: Copy reaches the API on www.v2ex.com', async ({ markify, page }) => {
        await markify.open(`${V2EX_BARE}/t/900004`);
        await page.locator('#markify-copy-btn').click();
        await markify.lastNotification('Copied to clipboard!');
        expect(markify.clipboard[0]).toContain('title: "Docker 容器无法访问外网"');
        expect(markify.clipboard[0]).toContain('试试 `--dns 1.1.1.1`。');
        expect(markify.clipboard[0]).toContain('**#1 frank**');
        expect(markify.requests.filter(r => r.url.startsWith(V2EX)).filter(r => r.via === 'gm').map(r => r.url)).toEqual([`${V2EX}/api/topics/show.json?id=900004`, `${V2EX}/t/900004?p=1`]);
    });

    test('replies on several pages are all exported, in floor order', async ({ markify, page }) => {
        await markify.open(`${V2EX}/t/900006?p=2`);
        const { text } = await markify.download(() => page.locator('#markify-download-btn').click());
        const floors = [...text.matchAll(/^\*\*#(\d+) user(\d+)\*\*/gm)];
        expect(floors.map(match => Number(match[1]))).toEqual(Array.from({ length: 120 }, (_, index) => index + 1));
        expect(floors.every(match => match[1] === match[2])).toBe(true);
        expect(text).toContain('## Replies (120)');
        expect(markify.apiRequests(`${V2EX}/t/900006`).map(r => r.url)).toEqual([`${V2EX}/t/900006?p=2`, `${V2EX}/t/900006?p=1`, `${V2EX}/t/900006?p=2`]);
    });

    test('a topic without replies makes no replies request', async ({ markify, page }) => {
        await markify.open(`${V2EX}/t/900002`);
        const { text } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(text).toContain('新手，主要写代码。');
        expect(text).not.toContain('## Replies');
        expect(markify.apiRequests(`${V2EX}/api/replies/`)).toEqual([]);
    });

    test('a topic the API does not return fails visibly, without history', async ({ markify, page }) => {
        await markify.open(`${V2EX}/t/900003`);
        let downloads = 0;
        page.on('download', () => downloads++);
        await page.locator('#markify-download-btn').click();
        await markify.lastNotification('Failed to convert page');
        expect(downloads).toBe(0);
        expect(markify.store.get(HISTORY)).toBeUndefined();
    });

    test('pages that are not topics or topic lists show no Markify controls', async ({ markify, page }) => {
        await markify.open(`${V2EX}/planes`);
        await expect(page.locator('#markify-container')).toBeHidden();
        await expect(page.locator('#markify-batch-panel')).toHaveCount(0);
    });
});

test.describe('v2ex: topic lists', () => {
    test('node page: only its own rows; the ZIP keeps every topic that exported, failures stay selected', async ({ markify, page }) => {
        await markify.open(`${V2EX}/go/create`);
        await expect.poll(() => boxIds(page)).toEqual(v2exLists.node.ids);
        await expect(page.locator('#Rightbar .markify-batch-checkbox')).toHaveCount(0);

        await page.locator('#markify-select-all').check();
        const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click());
        expect(zip.name).toBe(`v2ex-node-create-${today()}.zip`);
        expect(Object.keys(zip.files).sort()).toEqual(['900001 - 分享一个把网页转成 Markdown 的油猴脚本 [开源].md', '900002 - 求推荐 Linux 发行版.md']);
        const entry = zip.files['900001 - 分享一个把网页转成 Markdown 的油猴脚本 [开源].md'];
        expect(frontmatter(entry)).toMatchObject({ title: rich.title, author: 'livid', tags: ['v2ex', 'forum', '分享创造', '油猴', 'Markdown'], replies: 3 });
        expect(entry).toContain('### Supplement 2');
        const notice = await markify.lastNotification('Download started for');
        expect(notice.text).toContain('2/3 items');
        expect(notice.text).toContain('登录可见的帖子: Topic not found, or it needs a login to view');
        await expect(page.locator('[data-item-id="900003"]')).toBeChecked();
        expect(Object.keys(markify.store.get(HISTORY) as object).sort()).toEqual(['v2ex:900001', 'v2ex:900002']);
    });

    test('recent, tag, member and home lists; rows added later join the list', async ({ markify, page }) => {
        await markify.open(`${V2EX}/recent`);
        await expect.poll(() => boxIds(page)).toEqual(v2exLists.recent);
        await page.evaluate(row => document.querySelector('#Main .box')!.insertAdjacentHTML('beforeend', row), v2exRow('900005'));
        await expect.poll(() => boxIds(page)).toEqual([...v2exLists.recent, '900005']);

        await markify.open(`${V2EX}/tag/${v2exLists.tag.name}`);
        await expect.poll(() => boxIds(page)).toEqual(v2exLists.tag.ids);
        await markify.open(`${V2EX}/member/${v2exLists.member.name}/topics`);
        await expect.poll(() => boxIds(page)).toEqual(v2exLists.member.ids);
        await markify.open(`${V2EX_BARE}/?tab=tech`);
        await expect.poll(() => boxIds(page)).toEqual(v2exLists.recent);
        await page.locator(`[data-item-id="${v2exLists.recent[0]}"]`).check();
        const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click());
        expect(zip.name).toBe(`v2ex-home-home-${today()}.zip`);
    });

    test('downloaded topics with a later reply are marked as updated, from the row alone', async ({ markify, page }) => {
        markify.store.set(HISTORY, {
            'v2ex:900004': { site: 'v2ex', id: '900004', title: 'Docker', type: 'single', downloadedAt: '2026-01-15T00:00:00.000Z' },
            'v2ex:900001': { site: 'v2ex', id: '900001', title: 'Script', type: 'single', downloadedAt: '2026-01-15T00:00:00.000Z' },
        });
        await markify.open(`${V2EX}/recent`);
        const status = (id: string) => page.locator(`.markify-batch-checkbox[data-item-id="${id}"] ~ .markify-history-indicator`);
        await expect(status('900004')).toHaveAttribute('data-markify-status', 'updated');
        await expect(status('900001')).toHaveAttribute('data-markify-status', 'downloaded');
        expect(markify.apiRequests(`${V2EX}/api/`)).toEqual([]);
    });
});

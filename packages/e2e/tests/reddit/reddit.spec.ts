/**
 * Reddit: a post and every comment from the JSON API, including those behind
 * "load more comments" and "continue this thread"; www and old Reddit; feeds in
 * both layouts; update checks from the comment count.
 */
import { parse as parseYaml } from 'yaml';
import { test, expect } from '../../support/harness';
import { OLD_REDDIT, REDDIT, redditFeed, redditPosts, shredditRows } from '../../fixtures';

const today = () => new Date().toISOString().slice(0, 10);
const boxIds = (page: import('@playwright/test').Page) => page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId));
const frontmatter = (text: string) => parseYaml(text.match(/^---\n([\s\S]*?)\n---\n/)![1]);
const HISTORY = 'markify_download_history';
const post = redditPosts.abc001;
const fileTitle = 'Markify- export any thread to Markdown';

test.describe('reddit: post page', () => {
    test('Download: the post and every comment, nested by reply depth, with the held-back ones filled in', async ({ markify, page }) => {
        await markify.open(`${REDDIT}/r/programming/comments/abc001/markify_export/`);
        await expect(page.locator('#markify-container')).toBeVisible();
        const { name, text } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(name).toBe(`${fileTitle}.md`);
        expect(frontmatter(text)).toMatchObject({ title: post.title, author: 'neo', date: '2026-01-01T00:00:00.000Z', tags: ['reddit', 'r/programming', 'Show-off'], score: 42, replies: 9 });
        for (const fragment of [
            'It converts **threads** to Markdown.\n\n![diagram](https://preview.redd.it/img1.png?width=640&s=abc)\n\n```js\nconsole.log("hi")\n```',
            '---\n\n## Comments (9)',
            '**u/trinity** · 9 points · *2026-01-01T00:01:00.000Z*\n\nNice work.',
            '> **u/neo** · 8 points · *2026-01-01T00:02:00.000Z*\n>\n> Thanks!',
            '> > **u/morpheus** · 7 points',
            // "continue this thread"
            '> > > **u/oracle** · 6 points · *2026-01-01T00:04:00.000Z*\n> > >\n> > > Deeper still',
            // "load more comments" under a comment, and at the top level, with a reply of its own
            '**u/smith** · 5 points',
            '> **u/neo** · 4 points · *2026-01-01T00:06:00.000Z*\n>\n> Yes, both.',
            '**u/tank** · 3 points',
            '> **u/dozer** · 2 points',
            '**u/mouse** · 1 points',
        ]) expect(text).toContain(fragment);
        expect(text.indexOf('u/oracle')).toBeLessThan(text.indexOf('u/smith'));
        expect(text.indexOf('u/smith')).toBeLessThan(text.indexOf('u/tank'));
        expect(text).not.toContain('not included');
        expect(markify.requests.filter(r => r.via === 'gm').map(r => r.url.replace(REDDIT, ''))).toEqual([
            '/comments/abc001.json?raw_json=1&limit=500',
            '/api/morechildren.json?api_type=json&raw_json=1&link_id=t3_abc001&children=c3,c4',
            '/api/morechildren.json?api_type=json&raw_json=1&link_id=t3_abc001&children=c2a',
            '/comments/abc001/_/c1a1.json?raw_json=1&limit=500',
        ]);
        await expect.poll(() => (markify.store.get(HISTORY) as Record<string, unknown>)?.['reddit:abc001']).toMatchObject({ replies: 9 });
    });

    test('old.reddit.com: Copy reads the JSON on www.reddit.com; galleries become images', async ({ markify, page }) => {
        await markify.open(`${OLD_REDDIT}/r/pics/comments/abc003/two_screenshots/`);
        await page.locator('#markify-copy-btn').click();
        await markify.lastNotification('Copied to clipboard!');
        const text = markify.clipboard[0];
        expect(text).toContain('title: "Two screenshots"');
        expect(text).toContain('![First 1](https://preview.redd.it/g1.jpg)\n\n![](https://preview.redd.it/g2.gif)');
        expect(text).toContain('**u/erin** · 9 points');
        expect(markify.requests.filter(r => r.via === 'gm').map(r => r.url)).toEqual([`${REDDIT}/comments/abc003.json?raw_json=1&limit=500`]);
    });

    test('a link post exports its link; a short /comments/ URL works too', async ({ markify, page }) => {
        await markify.open(`${REDDIT}/comments/abc002`);
        const { text } = await markify.download(() => page.locator('#markify-download-btn').click());
        expect(text).toContain('[https://blog.example/markdown](https://blog.example/markdown)');
        expect(text).not.toContain('## Comments');
    });

    test('a private community fails visibly, without history', async ({ markify, page }) => {
        await markify.open(`${REDDIT}/r/secret/comments/abc004/private/`);
        let downloads = 0;
        page.on('download', () => downloads++);
        await page.locator('#markify-download-btn').click();
        await markify.lastNotification('Failed to convert page');
        expect(downloads).toBe(0);
        expect(markify.store.get(HISTORY)).toBeUndefined();
    });

    test('a downloaded post with more comments since is marked as updated', async ({ markify, page }) => {
        markify.store.set(HISTORY, { 'reddit:abc001': { site: 'reddit', id: 'abc001', title: post.title, type: 'single', downloadedAt: '2026-01-02T00:00:00.000Z', replies: 5 } });
        await markify.open(`${REDDIT}/r/programming/comments/abc001/markify_export/`);
        await expect(page.locator('[data-markify-owned="history"]')).toHaveText('✓ ↻ +4');
        expect(markify.apiRequests(`${REDDIT}/by_id/`).map(r => r.url)).toEqual([`${REDDIT}/by_id/t3_abc001.json?raw_json=1`]);
    });

    test('pages that are neither posts nor feeds show no Markify controls', async ({ markify, page }) => {
        await markify.open(`${REDDIT}/r/programming/wiki/index`);
        await expect(page.locator('#markify-container')).toBeHidden();
        await expect(page.locator('#markify-batch-panel')).toHaveCount(0);
    });
});

test.describe('reddit: feeds', () => {
    test('new Reddit: feed posts only, not the sidebar; posts loaded later join; ZIP with frontmatter', async ({ markify, page }) => {
        await markify.open(`${REDDIT}/r/programming/`);
        await expect.poll(() => boxIds(page)).toEqual(redditFeed.ids);
        await expect(page.locator('#right-sidebar-container .markify-batch-checkbox')).toHaveCount(0);
        await page.evaluate(rows => document.querySelector('shreddit-feed')!.insertAdjacentHTML('beforeend', rows), shredditRows(['abc003']));
        await expect.poll(() => boxIds(page)).toEqual([...redditFeed.ids, 'abc003']);

        await page.locator('[data-item-id="abc001"]').check();
        await page.locator('[data-item-id="abc003"]').check();
        const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click(), 60_000);
        expect(zip.name).toBe(`reddit-subreddit-programming-${today()}.zip`);
        expect(Object.keys(zip.files).sort()).toEqual([`abc001 - ${fileTitle}.md`, 'abc003 - Two screenshots.md']);
        expect(frontmatter(zip.files[`abc001 - ${fileTitle}.md`])).toMatchObject({ title: post.title, tags: ['reddit', 'r/programming', 'Show-off'], replies: 9 });
        expect(zip.files[`abc001 - ${fileTitle}.md`]).toContain('Deeper still');
        await expect.poll(() => Object.keys((markify.store.get(HISTORY) ?? {}) as object).sort()).toEqual(['reddit:abc001', 'reddit:abc003']);
    });

    test('old Reddit: rows by their comments link (link posts point away), without ads or the sidebar', async ({ markify, page }) => {
        await markify.open(`${OLD_REDDIT}/r/programming/`);
        await expect.poll(() => boxIds(page)).toEqual(redditFeed.ids);
        await page.locator('#markify-select-all').check();
        const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click(), 60_000);
        expect(Object.keys(zip.files).sort()).toEqual([`abc001 - ${fileTitle}.md`, 'abc002 - An article about Markdown.md']);
    });
});

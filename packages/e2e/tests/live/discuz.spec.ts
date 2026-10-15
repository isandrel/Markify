/**
 * Real-site checks for Discuz! forums, logged out, public threads only. Threads
 * are found on the guide page ("最新发表") through a plain HTTP client, as the
 * CLI reads them. A forum that answers with a block page or its own "come back
 * later" notice is reported as a skip with that reason (MARKIFY_E2E_BLOCKED=fail
 * fails instead), never worked around. `live-dryrun` runs the same checks
 * against the fixtures.
 */
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { test, expect, skipBlocked, type MarkifyBrowser } from '../../support/harness';
import { runCli, tempDir } from '../../support/processes';
import { KAFAN, RIGHT } from '../../fixtures';

interface Thread { id: string; title: string; replies: number }
const sites = [
    { id: 'right', base: `${RIGHT}/forum`, name: '恩山无线论坛' },
    { id: 'kafan', base: KAFAN, name: '卡饭论坛' },
];
const attach = (name: string, body: string) => test.info().attach(name, { body: body.slice(0, 200_000), contentType: 'text/markdown' });
function frontmatter(markdown: string): Record<string, any> {
    const block = markdown.match(/^---\n([\s\S]*?)\n---\n/);
    expect(block, 'export starts with YAML frontmatter').not.toBeNull();
    return parseYaml(block![1]);
}

for (const site of sites) {
    test.describe(`${site.id} live site (logged out)`, () => {
        let discovered: Thread[] | undefined;

        async function get(markify: MarkifyBrowser, url: string): Promise<{ status: number; text: string }> {
            if (markify.network !== 'live') return markify.get(url);
            const response = await fetch(url);
            // Some Discuz! forums are GBK; Response.text() would garble them.
            const charset = /charset=([\w-]+)/i.exec(response.headers.get('content-type') ?? '')?.[1]?.toLowerCase() ?? 'utf-8';
            return { status: response.status, text: new TextDecoder(charset === 'gbk' || charset === 'gb2312' ? 'gb18030' : charset).decode(await response.arrayBuffer()) };
        }

        async function discover(markify: MarkifyBrowser): Promise<Thread[]> {
            if (discovered) return discovered;
            const { status, text } = await get(markify, `${site.base}/forum.php?mod=guide&view=new`);
            const notice = /<div id="messagetext"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/.exec(text)?.[1]?.replace(/<[^>]+>/g, '').trim();
            if (status === 403 || status === 503 || notice) skipBlocked(`${site.name} answered HTTP ${status}${notice ? ` with "${notice}"` : ''}`);
            expect(status, 'guide page').toBe(200);
            const threads = [...text.matchAll(/<tbody id="normalthread_(\d+)"[^>]*>([\s\S]*?)<\/tbody>/g)].map(([, id, row]) => ({
                id,
                title: /class="[^"]*\bxst\b[^"]*"[^>]*>([^<]*)</.exec(row)?.[1] ?? '',
                replies: Number(/<td class="num"><a[^>]*>(\d+)<\/a>/.exec(row)?.[1] ?? 0),
            }));
            expect(threads.length, 'threads on the guide page').toBeGreaterThanOrEqual(1);
            // A few replies, on one page: guests may not read later pages on some forums.
            discovered = [...threads.filter(thread => thread.replies > 0 && thread.replies < 10), ...threads].slice(0, 3);
            return discovered;
        }

        test('CLI converts a real thread end to end', async ({ markify }) => {
            const [thread] = await discover(markify);
            const out = join(tempDir(), `${thread.id}.md`);
            const result = await runCli(['convert', `${site.base}/thread-${thread.id}-1-1.html`, '-o', out]);
            expect(result.status, result.stderr).toBe(0);
            expect(result.stderr).toContain(`Adapter:    ${site.name}`);
            const text = readFileSync(out, 'utf8');
            await attach(`cli-${thread.id}.md`, text);
            const meta = frontmatter(text);
            expect(meta.tags).toEqual(expect.arrayContaining([site.id, 'forum']));
            expect(meta.date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
            expect(text).not.toMatch(/�/);
            if (thread.replies) expect(text).toMatch(/^\*\*#2 .+\*\* · \*/m);
        });

        test('thread page: Download in the browser', async ({ markify, page }) => {
            const [thread] = await discover(markify);
            await markify.open(`${site.base}/thread-${thread.id}-1-1.html`);
            await expect(page.locator('#markify-container')).toBeVisible({ timeout: 30_000 });
            const { text } = await markify.download(() => page.locator('#markify-download-btn').dispatchEvent('click'));
            await attach(`export-${thread.id}.md`, text);
            expect(frontmatter(text)).toMatchObject({ tags: expect.arrayContaining([site.id]) });
        });

        test('guide list: threads get checkboxes', async ({ markify, page }) => {
            const threads = await discover(markify);
            await markify.open(`${site.base}/forum.php?mod=guide&view=new`);
            await expect.poll(() => page.locator('.markify-batch-checkbox').count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(1);
            const ids = await page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId));
            expect(ids).toContain(threads[0].id);
        });
    });
}

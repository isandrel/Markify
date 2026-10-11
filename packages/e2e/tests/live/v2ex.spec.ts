/**
 * Real-site checks for V2EX, logged out, public topics only. Topics are found
 * through the public API the userscript uses. The API allows
 * about 600 requests an hour per IP, so the run stays at a few dozen. A bot
 * check is reported as a skip (MARKIFY_E2E_BLOCKED=fail fails instead), never
 * worked around. `live-dryrun` runs the same checks against the fixtures.
 */
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { test, expect, isChallenge, skipBlocked, type MarkifyBrowser } from '../../support/harness';
import { runCli, tempDir } from '../../support/processes';
import { V2EX } from '../../fixtures';

type Json = Record<string, any>;
interface Topic { id: string; title: string; replies: number; node: string }

const LONG_AGO = '2000-01-01T00:00:00.000Z';
const attach = (name: string, body: string) => test.info().attach(name, { body: body.slice(0, 200_000), contentType: name.endsWith('.html') ? 'text/html' : 'text/markdown' });
function frontmatter(markdown: string): Json {
    const block = markdown.match(/^---\n([\s\S]*?)\n---\n/);
    expect(block, 'export starts with YAML frontmatter').not.toBeNull();
    return parseYaml(block![1]);
}

test.describe('v2ex live site (logged out)', () => {
    let discovered: Topic[] | undefined;
    const history = (markify: MarkifyBrowser) => (markify.store.get('markify_download_history') ?? {}) as Record<string, Json>;

    /**
     * Topics with a few replies, from the public API through a plain HTTP client with
     * its own default identity, as the CLI makes it. (The site challenges the headless
     * browser, whose user agent says HeadlessChrome; the browser checks then skip.)
     */
    async function discover(markify: MarkifyBrowser): Promise<Topic[]> {
        if (discovered) return discovered;
        const url = `${V2EX}/api/topics/latest.json`;
        const response = markify.network === 'live' ? await fetch(url).then(async r => ({ status: r.status, text: await r.text() })) : await markify.get(url);
        if (isChallenge(response.status, response.text)) skipBlocked(`${V2EX}/api answered with a bot check (HTTP ${response.status})`);
        expect(response.status, 'latest topics API').toBe(200);
        const topics: Topic[] = (JSON.parse(response.text) as Json[]).map(topic => ({ id: String(topic.id), title: topic.title, replies: topic.replies, node: `/go/${topic.node.name}` }));
        expect(topics.length, 'latest topics').toBeGreaterThanOrEqual(3);
        // Replied topics first, small enough to stay quick.
        discovered = [...topics.filter(topic => topic.replies > 0 && topic.replies <= 300), ...topics.filter(topic => !topic.replies)].slice(0, 4);
        return discovered;
    }

    test('recent list: rows get checkboxes; the last-reply time marks downloaded topics as updated', async ({ markify, page }) => {
        await discover(markify);
        await markify.open(`${V2EX}/recent`);
        await expect.poll(() => page.locator('.markify-batch-checkbox').count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(3);
        await expect(page.locator('#Rightbar .markify-batch-checkbox')).toHaveCount(0);
        const [first, second] = await page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId!));
        markify.store.set('markify_download_history', {
            [`v2ex:${first}`]: { site: 'v2ex', id: first, title: first, type: 'single', downloadedAt: LONG_AGO },
            [`v2ex:${second}`]: { site: 'v2ex', id: second, title: second, type: 'single', downloadedAt: new Date(Date.now() + 86_400_000).toISOString() },
        });
        await markify.open(`${V2EX}/recent`);
        const marker = (id: string) => page.locator(`.markify-batch-checkbox[data-item-id="${id}"] ~ .markify-history-indicator`);
        await expect(marker(first)).toHaveAttribute('data-markify-status', 'updated', { timeout: 30_000 });
        await expect(marker(second)).toHaveAttribute('data-markify-status', 'downloaded');
    });

    test('topic export: API topic; supplements, tags and every reply from its pages; Copy matches', async ({ markify, page }) => {
        const [topic] = await discover(markify);
        await markify.open(`${V2EX}/t/${topic.id}`);
        await expect(page.locator('#markify-container')).toBeVisible({ timeout: 30_000 });
        const { name, text } = await markify.download(() => page.locator('#markify-download-btn').dispatchEvent('click'));
        await attach(`export-${topic.id}.md`, text);
        const [api] = JSON.parse((await markify.get(`${V2EX}/api/topics/show.json?id=${topic.id}`)).text);

        const meta = frontmatter(text);
        expect(name).toMatch(/\.md$/);
        expect(meta).toMatchObject({ title: api.title, author: api.member.username, replies: expect.any(Number), updated: expect.any(String) });
        expect(meta.tags).toEqual(expect.arrayContaining(['v2ex', 'forum', api.node.title]));
        const floors = [...text.matchAll(/^\*\*#(\d+) /gm)].map(match => Number(match[1]));
        expect(floors.length, 'replies exported').toBeGreaterThan(0);
        expect(floors).toEqual([...floors].sort((a, b) => a - b));
        expect(text).toContain(`## Replies (${floors.length})`);
        expect(text).not.toMatch(/\]\(\/(?!\/)/);
        const supplements = await page.locator('#Main .subtle .topic_content').count();
        expect([...text.matchAll(/^### Supplement \d+/gm)]).toHaveLength(supplements);
        // The topic from the API, then its pages (100 replies each); the lagging replies API is not needed.
        const pages = Math.max(1, Math.ceil(floors.at(-1)! / 100));
        expect(markify.requests.filter(r => r.via === 'gm').map(r => r.url.replace(V2EX, ''))).toEqual([
            `/api/topics/show.json?id=${topic.id}`, ...Array.from({ length: pages }, (_, index) => `/t/${topic.id}?p=${index + 1}`),
        ]);

        await page.locator('#markify-copy-btn').dispatchEvent('click');
        await markify.lastNotification('Copied to clipboard!');
        const strip = (markdown: string) => markdown.replace(/^downloaded(?:_at)?: .*$/m, '');
        expect(strip(markify.clipboard.at(-1)!)).toBe(strip(text));
    });

    test('node page: a ZIP of two topics, each with frontmatter; history keeps their state', async ({ markify, page }) => {
        const [topic] = await discover(markify);
        await markify.open(`${V2EX}${topic.node}`);
        await expect.poll(() => page.locator('.markify-batch-checkbox').count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(2);
        const ids = (await page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId!))).slice(0, 2);
        for (const id of ids) await page.locator(`.markify-batch-checkbox[data-item-id="${id}"]`).check();
        const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click(), 120_000);
        expect(Object.keys(zip.files)).toHaveLength(2);
        for (const text of Object.values(zip.files)) expect(frontmatter(text).tags).toEqual(expect.arrayContaining(['v2ex']));
        await expect.poll(() => history(markify)[`v2ex:${ids[0]}`]).toMatchObject({ type: 'batch', replies: expect.any(Number), updated: expect.any(String) });
    });

    test('thread page: update check against the topic API', async ({ markify, page }) => {
        const [first] = await discover(markify);
        markify.store.set('markify_download_history', { [`v2ex:${first.id}`]: { site: 'v2ex', id: first.id, title: first.title, type: 'single', downloadedAt: LONG_AGO, replies: 0 } });
        await markify.open(`${V2EX}/t/${first.id}`);
        await expect(page.locator('[data-markify-owned="history"]')).toHaveAttribute('data-markify-status', 'updated', { timeout: 30_000 });
        expect(history(markify)[`v2ex:${first.id}`].check).toMatchObject({ replies: expect.any(Number), updated: expect.any(String) });
    });

    test('CLI converts a real topic end to end', async ({ markify }) => {
        const [topic] = await discover(markify);
        const out = join(tempDir(), `${topic.id}.md`);
        const result = await runCli(['convert', `${V2EX}/t/${topic.id}`, '-o', out]);
        expect(result.status, result.stderr).toBe(0);
        expect(result.stderr).toContain('Adapter:    V2EX');
        const text = readFileSync(out, 'utf8');
        expect(frontmatter(text).tags).toEqual(expect.arrayContaining(['v2ex', 'forum']));
        expect(text).toMatch(/^\*\*#1 /m);
    });
});

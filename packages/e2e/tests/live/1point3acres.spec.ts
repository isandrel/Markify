/**
 * Real-site checks for 1Point3Acres, logged out and public content only.
 *
 * Project `live-1point3acres` runs this against www.1point3acres.com (scheduled
 * in .github/workflows/live-e2e.yml); project `live-dryrun` runs the same file
 * against the offline fixtures so the spec itself stays correct in normal CI.
 * Every request is paced and a run touches about a dozen threads.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseToml } from '@iarna/toml';
import { parse as parseYaml } from 'yaml';
import { test, expect, repoRoot, type MarkifyBrowser } from '../../support/harness';
import { P3A } from '../../fixtures';

type Page = import('@playwright/test').Page;
type Json = Record<string, any>;

const profile = parseToml(readFileSync(join(repoRoot, 'config/adapters/1point3acres.toml'), 'utf8')) as Json;
const api = profile.api as Json;
const DISCOVER = `${P3A}/home/discover/38`;
const threadUrl = (id: string) => api.thread_endpoint.replace('{thread_id}', id);
const postsUrl = (id: string, page = 1) => api.posts_endpoint.replace('{thread_id}', id)
    .replace('{page_size}', String(api.page_size)).replace('{order}', api.order).replace('{page}', String(page));

const boxIds = (page: Page) => page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId!));

/** Script-level actions; a site popup over the page must not decide the result. */
const press = (page: Page, selector: string) => page.locator(selector).dispatchEvent('click');
const tick = (page: Page, selector: string) => page.locator(selector).evaluate(el => {
    (el as HTMLInputElement).checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
});

interface Readable { id: string; thread: Json }
let feedCache: string[] | undefined;
let readableCache: Readable[] | undefined;

async function feedIds(markify: MarkifyBrowser): Promise<string[]> {
    if (!feedCache) {
        await markify.open(DISCOVER);
        await expect.poll(async () => (await boxIds(markify.page)).length, { message: 'feed rows bound', timeout: 30_000 }).toBeGreaterThanOrEqual(5);
        feedCache = await boxIds(markify.page);
    }
    return feedCache;
}

/** Feed threads whose thread endpoint answers anonymously, preferring a few replies. */
async function readableThreads(markify: MarkifyBrowser): Promise<Readable[]> {
    if (readableCache) return readableCache;
    const found: Readable[] = [];
    const statuses: string[] = [];
    for (const id of (await feedIds(markify)).slice(0, 10)) {
        const response = await markify.get(threadUrl(id));
        let body: Json | undefined;
        try { body = JSON.parse(response.text); } catch { /* reported below */ }
        statuses.push(`${id}: HTTP ${response.status}${body ? ` ${api.response.success_field}=${body[api.response.success_field]}` : ' (not JSON)'}`);
        if (response.status === 200 && body && body[api.response.success_field] === api.response.success_value) found.push({ id, thread: body[api.response.data_field] });
        if (found.length >= 4) break;
    }
    expect(found.length, `No feed thread readable without login. ${statuses.join('; ')}`).toBeGreaterThan(0);
    found.sort((a, b) => score(a) - score(b));
    readableCache = found;
    return found;
}

/** Some replies but a single comments page keeps exports quick. */
function score(item: Readable): number {
    const replies = item.thread[api.fields.replies];
    return typeof replies === 'number' && replies > 0 && replies < api.page_size ? 0 : 1;
}

function frontmatter(markdown: string): Json {
    const block = markdown.match(/^---\n([\s\S]*?)\n---\n/);
    expect(block, 'export starts with YAML frontmatter').not.toBeNull();
    return parseYaml(block![1]);
}

async function attach(name: string, body: string) {
    await test.info().attach(name, { body: body.slice(0, 200_000), contentType: name.endsWith('.json') ? 'application/json' : 'text/html' });
}

test.describe('1Point3Acres live site (logged out)', () => {
    test('discover feed: one checkbox per feed row, nothing outside the feed', async ({ markify, page }) => {
        const ids = await feedIds(markify);
        await attach('discover-main.html', await page.locator('main').evaluate(el => el.outerHTML));
        expect(new Set(ids).size, 'thread ids are unique').toBe(ids.length);
        expect(ids.every(id => /^\d+$/.test(id))).toBe(true);
        expect(ids.length).toBeLessThanOrEqual(30);
        await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
        await expect(page.locator('#markify-container')).toBeHidden();
        const misplaced = await page.locator('.markify-checkbox-wrapper').evaluateAll(list =>
            list.filter(el => !el.closest('main [data-sentry-component]') || el.closest('aside')).length);
        expect(misplaced, 'checkboxes outside feed rows').toBe(0);
        for (const label of await page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => box.getAttribute('aria-label') ?? ''))) {
            expect(label.replace(/^Select /, '').trim(), 'row has a title').not.toBe('');
        }
    });

    test('thread and comments APIs still match the profile field mapping', async ({ markify }) => {
        const [{ id, thread }] = await readableThreads(markify);
        await attach('thread.json', JSON.stringify({ ...thread, [api.fields.content]: String(thread[api.fields.content]).slice(0, 500) }, null, 2));
        const types: Record<string, string> = { title: 'string', author: 'string', content: 'string', posted_at: 'number', updated_at: 'number', views: 'number', replies: 'number' };
        for (const [field, type] of Object.entries(types)) expect(typeof thread[api.fields[field]], `thread.${api.fields[field]} (${field})`).toBe(type);
        expect(['number', 'undefined']).toContain(typeof thread[api.fields.favorites]);

        const response = await markify.get(postsUrl(id));
        expect(response.status, `comments endpoint for ${id}`).toBe(200);
        const body = JSON.parse(response.text);
        expect(body[api.response.success_field]).toBe(api.response.success_value);
        const posts = body[api.response.posts_field];
        expect(Array.isArray(posts), `${api.response.posts_field} is an array`).toBe(true);
        await attach('posts.json', JSON.stringify(posts.slice(0, 3).map((post: Json) => ({ ...post, [api.fields.post.content]: String(post[api.fields.post.content]).slice(0, 300) })), null, 2));
        for (const post of posts) {
            expect(['number', 'string']).toContain(typeof post[api.fields.post.id]);
            expect(typeof post[api.fields.post.author]).toBe('string');
            expect(typeof post[api.fields.post.content]).toBe('string');
            expect(typeof post[api.fields.post.posted_at]).toBe('number');
        }
    });

    test('single thread export produces readable Markdown', async ({ markify, page }) => {
        const [{ id, thread }] = await readableThreads(markify);
        await markify.open(`${P3A}/home/thread/${id}`);
        await expect(page.locator('#markify-container')).toBeVisible();
        const { name, text } = await markify.download(() => press(page, '#markify-download-btn'));
        expect(name).toMatch(/\.md$/);
        const meta = frontmatter(text);
        expect(meta.title).toBe(thread[api.fields.title]);
        expect(meta.author).toBe(thread[api.fields.author]);
        expect(meta.source).toContain(`thread-${id}-1-1.html`);
        expect(text).toContain(`# ${thread[api.fields.title]}`);
        expect(text).not.toMatch(/\[\/?(?:b|i|url|quote|code|list|img)\]/i);
        if (thread[api.fields.replies] > 0) expect(text).toMatch(/## Comments \(\d+\)/);
        expect(markify.notifications.some(n => /failed/i.test(n.text))).toBe(false);
        await expect.poll(() => Object.keys(markify.store.get('markify_download_history') as object ?? {})).toEqual([`1point3acres:${id}`]);
    });

    test('legacy BBS thread URL is recognised', async ({ markify, page }) => {
        const [{ id }] = await readableThreads(markify);
        await markify.open(`${P3A}/bbs/thread-${id}-1-1.html`);
        await expect(page.locator('#markify-container')).toBeVisible();
    });

    test('batch export of two feed rows produces a ZIP of both', async ({ markify, page }) => {
        const picks = (await readableThreads(markify)).slice(0, 2);
        await markify.open(DISCOVER);
        for (const { id } of picks) await tick(page, `[data-item-id="${id}"]`);
        await expect(page.locator('#markify-batch-panel button')).toHaveText(`📥 Download Selected (${picks.length})`);
        const zip = await markify.downloadZip(() => press(page, '#markify-batch-panel button'), 90_000);
        expect(zip.name).toMatch(/^1point3acres-discover-.+\.zip$/);
        expect(Object.keys(zip.files).sort()).toEqual(picks.map(({ id }) => expect.stringMatching(new RegExp(`^${id} - .+\\.md$`))).sort());
        for (const content of Object.values(zip.files)) expect(frontmatter(content).title).toBeTruthy();
    });

    test('client-side pagination rebinds rows under a single panel', async ({ markify, page }) => {
        await markify.open(DISCOVER);
        const first = await feedIds(markify);
        await expect.poll(async () => (await boxIds(page)).length).toBeGreaterThan(0);
        const next = page.locator('main a[href*="page=2"]').first();
        test.skip(await next.count() === 0, 'No page-2 link rendered for logged-out visitors');
        await tick(page, `[data-item-id="${first[0]}"]`);
        await next.dispatchEvent('click');
        await expect.poll(async () => (await boxIds(page))[0], { timeout: 30_000 }).not.toBe(first[0]);
        await expect.poll(async () => (await boxIds(page)).length).toBeGreaterThanOrEqual(5);
        await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
        await expect(page.locator('#markify-batch-panel button')).toHaveText('📥 Download Selected (0)');
    });
});

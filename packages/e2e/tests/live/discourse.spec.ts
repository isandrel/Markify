/**
 * Real-site checks for the Discourse forums (US Card Forum, LINUX DO), logged
 * out, public topics only: every userscript feature against the live site.
 *
 * Topics are found in the page itself, and data is read the way the userscript
 * reads it, from inside the page (same origin, the browser's cookies). From
 * data-centre IPs the sites may let the page load yet challenge its data
 * requests (/raw/, *.json): then the checks that only need the page still run,
 * and those that need data are skipped with that reason (MARKIFY_E2E_BLOCKED=fail
 * fails them instead). Nothing tries to get past a challenge.
 * `live-dryrun` runs the same checks against the fixtures.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { test, expect, isChallenge, skipBlocked, type MarkifyBrowser } from '../../support/harness';
import { runCli, tempDir } from '../../support/processes';
import { LINUXDO, USCF } from '../../fixtures';

type Json = Record<string, any>;
interface Topic { id: string; title: string; posts: number; tags: string[] }
/** Topics from the /latest page; whether data requests are answered or challenged. */
interface Discovery { topics: Topic[]; category?: string; blocked?: string }

const sites = [
    { id: 'uscardforum', origin: USCF },
    { id: 'linuxdo', origin: LINUXDO },
];
const TOKEN = `mfy_${'ab'.repeat(16)}`;
const LONG_AGO = '2000-01-01T00:00:00.000Z';

/** Same-origin request from inside the page, as the userscript makes it. */
function inPage(page: Page, path: string, accept = 'application/json'): Promise<{ status: number; text: string; type: string }> {
    return page.evaluate(async ([path, accept]) => {
        const response = await fetch(path, { headers: { Accept: accept }, redirect: 'manual', credentials: 'include' });
        return { status: response.status, text: response.type === 'opaqueredirect' ? '' : await response.text(), type: response.type };
    }, [path, accept] as const);
}
async function pageJson(page: Page, path: string): Promise<{ status: number; body: Json | null }> {
    const { status, text } = await inPage(page, path);
    try { return { status, body: JSON.parse(text) }; } catch { return { status, body: null }; }
}

function frontmatter(markdown: string): Json {
    const block = markdown.match(/^---\n([\s\S]*?)\n---\n/);
    expect(block, 'export starts with YAML frontmatter').not.toBeNull();
    return parseYaml(block![1]);
}
/** Text outside fenced code, where Discourse-only syntax must not remain. */
const prose = (markdown: string) => markdown.replace(/```[\s\S]*?```/g, '');
const note = (type: string, description: string) => test.info().annotations.push({ type, description });
const attach = (name: string, body: string) => test.info().attach(name, { body: body.slice(0, 200_000), contentType: name.endsWith('.html') ? 'text/html' : 'text/markdown' });

for (const site of sites) {
    test.describe(`${site.id} live site (logged out)`, () => {
        let discovered: Discovery | undefined;
        const history = (markify: MarkifyBrowser) => (markify.store.get('markify_download_history') ?? {}) as Record<string, Json>;
        const seed = (markify: MarkifyBrowser, records: { id: string; title: string; downloadedAt: string }[]) =>
            markify.store.set('markify_download_history', Object.fromEntries(records.map(record => [`${site.id}:${record.id}`, { site: site.id, type: 'single', ...record }])));

        /** Public topics and a category, read from the /latest page; then one data request to see if data is answered. */
        async function discover(markify: MarkifyBrowser, page: Page): Promise<Discovery> {
            if (discovered) return discovered;
            await markify.open(`${site.origin}/latest`);
            await expect.poll(() => page.locator('#main-outlet tr.topic-list-item[data-topic-id]').count(), { message: 'topic rows on /latest', timeout: 30_000 }).toBeGreaterThanOrEqual(3);
            const found = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll<HTMLElement>('#main-outlet tr.topic-list-item[data-topic-id]'));
                return {
                    topics: rows.filter(row => !/\b(pinned|closed|archived)\b/.test(row.className)).map(row => ({
                        id: row.dataset.topicId!,
                        title: row.querySelector('a.title, a.raw-topic-link')?.textContent?.trim() ?? '',
                        posts: Number(row.querySelector('.posts-map .number, td.posts-map')?.textContent?.replace(/\D/g, '') || 0) + 1,
                        tags: Array.from(row.querySelectorAll('.discourse-tag, a[href^="/tag/"]')).map(tag => tag.textContent!.trim()).filter(Boolean),
                    })).filter(topic => topic.title),
                    category: document.querySelector<HTMLAnchorElement>('#main-outlet a[href^="/c/"]')?.getAttribute('href')?.replace(/^\/c\//, ''),
                };
            });
            expect(found.topics.length, 'public topics on /latest').toBeGreaterThanOrEqual(2);
            const probe = await inPage(page, `/t/${found.topics[0].id}.json`);
            const blocked = isChallenge(probe.status, probe.text)
                ? `${site.origin} serves pages but answers data requests (/raw/, *.json) with a bot challenge (HTTP ${probe.status})` : undefined;
            if (!blocked) expect(probe.status, 'topic JSON').toBe(200);
            const category = found.category ?? (blocked ? undefined : ((await pageJson(page, '/categories.json')).body?.category_list?.categories as Json[] | undefined)?.filter(entry => entry.slug && entry.id).map(entry => `${entry.slug}/${entry.id}`)[0]);
            discovered = { topics: found.topics.slice(0, 4), category, blocked };
            return discovered;
        }
        /** For checks that read data: skip with the reason when the site challenges data requests. */
        async function withData(markify: MarkifyBrowser, page: Page): Promise<Discovery> {
            const found = await discover(markify, page);
            if (found.blocked) skipBlocked(found.blocked);
            return found;
        }

        test('latest list: rows get checkboxes; listing activity marks downloaded topics as updated', async ({ markify, page }) => {
            const { topics: [first, second] } = await discover(markify, page);
            seed(markify, [
                { id: first.id, title: first.title, downloadedAt: LONG_AGO },
                { id: second.id, title: second.title, downloadedAt: new Date(Date.now() + 86_400_000).toISOString() },
            ]);
            await markify.open(`${site.origin}/latest`);
            await expect.poll(() => page.locator('.markify-batch-checkbox').count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(2);
            await attach('latest-main.html', await page.locator('#main-outlet').evaluate(el => el.outerHTML));
            // The real list's activity cell is what tells "updated", with no request.
            const marker = (id: string) => page.locator(`.markify-batch-checkbox[data-item-id="${id}"] ~ .markify-history-indicator`);
            await expect(marker(first.id)).toHaveAttribute('data-markify-status', 'updated');
            await expect(marker(second.id)).toHaveAttribute('data-markify-status', 'downloaded');
            await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
        });

        test('batch: a ZIP of two topics, each with frontmatter; history keeps their state', async ({ markify, page }) => {
            const { topics: [first, second] } = await withData(markify, page);
            await markify.open(`${site.origin}/latest`);
            await expect.poll(() => page.locator('.markify-batch-checkbox').count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(2);
            for (const topic of [first, second]) await page.locator(`.markify-batch-checkbox[data-item-id="${topic.id}"]`).check();
            const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click(), 120_000);
            expect(Object.keys(zip.files)).toHaveLength(2);
            for (const text of Object.values(zip.files)) {
                expect(frontmatter(text).tags).toEqual(expect.arrayContaining([site.id]));
                expect(text).toMatch(/ \| .+ \| #1\b/);
            }
            await expect.poll(() => history(markify)[`${site.id}:${first.id}`]).toMatchObject({ type: 'batch', replies: expect.any(Number), updated: expect.any(String) });
        });

        test('category, tag and search listings bind their rows', async ({ markify, page }) => {
            const { topics, category, blocked } = await discover(markify, page);
            const listings: [string, string | undefined][] = [
                ['category', category && `${site.origin}/c/${category}`],
                ['tag', topics.find(topic => topic.tags.length) && `${site.origin}/tag/${encodeURIComponent(topics.find(topic => topic.tags.length)!.tags[0])}`],
                // Results come from a data request.
                ['search', blocked ? undefined : `${site.origin}/search?q=${encodeURIComponent(topics[0].title.slice(0, 20))}`],
            ];
            for (const [kind, url] of listings) {
                if (!url) { note('not checked', kind === 'search' && blocked ? `search: ${blocked}` : `${kind}: none found on /latest`); continue; }
                await markify.open(url);
                await expect.poll(() => page.locator('.markify-batch-checkbox').count(), { message: `${kind} rows`, timeout: 30_000 }).toBeGreaterThanOrEqual(1);
                await expect(page.locator('#markify-batch-panel')).toHaveCount(1);
            }
        });

        test('topic export: clean title, topic details, every raw page, portable Markdown; Copy matches', async ({ markify, page }) => {
            const { topics } = await withData(markify, page);
            // Prefer a topic long enough for a second /raw/ page, but not huge.
            const topic = [...topics].sort((a, b) => b.posts - a.posts).find(entry => entry.posts <= 400) ?? topics[0];
            await markify.open(`${site.origin}/t/topic/${topic.id}`);
            const details = (await pageJson(page, `/t/${topic.id}.json`)).body!;
            const { name, text } = await markify.download(() => page.locator('#markify-download-btn').dispatchEvent('click'));
            await attach(`export-${topic.id}.md`, text);

            const meta = frontmatter(text);
            expect(meta.title).toBe(details.title);
            expect(name).toMatch(/\.md$/);
            expect(meta.author).toBe(details.details.created_by.username);
            expect(meta.tags).toEqual(expect.arrayContaining([site.id]));
            expect(typeof meta.views).toBe('number');
            expect(meta.replies).toBeGreaterThanOrEqual(details.posts_count - 1);
            expect(text).toMatch(/ \| .+ \| #1\b/);
            expect(prose(text)).not.toMatch(/\]\(upload:\/\/|\[quote=|\[\/quote\]|\[details=|\[\/?spoiler\]/);

            const second = (await inPage(page, `/raw/${topic.id}?page=2`, 'text/plain')).text.trim();
            if (second) expect(text).toContain(second.split('\n')[0]);
            else note('single raw page', `${topic.id} has ${topic.posts} posts`);

            const uploads = [...text.matchAll(/\]\(((?:https?:)?[^)\s]*\/uploads\/short-url\/[^)\s]+)\)/g)].map(match => new URL(match[1], site.origin).pathname).slice(0, 2);
            for (const upload of uploads) {
                const response = await inPage(page, upload, '*/*');
                expect(response.status === 200 || response.type === 'opaqueredirect', `${upload} resolves`).toBe(true);
            }
            if (!uploads.length) note('no uploads', `${topic.id} has no images or attachments`);

            await page.locator('#markify-copy-btn').dispatchEvent('click');
            await markify.lastNotification('Copied to clipboard!');
            const strip = (markdown: string) => markdown.replace(/^downloaded(?:_at)?: .*$/m, '');
            expect(strip(markify.clipboard.at(-1)!)).toBe(strip(text));
        });

        test('list → topic navigation in the single-page app brings the toolbar', async ({ markify, page }) => {
            const { topics: [first] } = await discover(markify, page);
            await markify.open(`${site.origin}/latest`);
            await expect(page.locator('#markify-container')).toBeHidden();
            await page.locator(`#main-outlet tr[data-topic-id="${first.id}"] a.raw-topic-link, #main-outlet tr[data-topic-id="${first.id}"] a.title`).first().click();
            await expect(page).toHaveURL(new RegExp(`/t/[^/]+/${first.id}`), { timeout: 30_000 });
            await expect(page.locator('#markify-container')).toBeVisible({ timeout: 30_000 });
            await expect(page.locator('#markify-batch-panel')).toHaveCount(0);
        });

        test('thread page: downloaded mark and update check against the topic JSON', async ({ markify, page }) => {
            const { topics: [first, second] } = await withData(markify, page);
            seed(markify, [
                { id: first.id, title: first.title, downloadedAt: LONG_AGO },
                { id: second.id, title: second.title, downloadedAt: new Date(Date.now() + 86_400_000).toISOString() },
            ]);
            await markify.open(`${site.origin}/t/topic/${first.id}`);
            await expect(page.locator('[data-markify-owned="history"]')).toHaveAttribute('data-markify-status', 'updated', { timeout: 30_000 });
            expect(history(markify)[`${site.id}:${first.id}`].check).toMatchObject({ updated: expect.any(String) });
            await markify.open(`${site.origin}/t/topic/${second.id}`);
            await expect.poll(() => history(markify)[`${site.id}:${second.id}`]?.check, { timeout: 30_000 }).toBeTruthy();
            await expect(page.locator('[data-markify-owned="history"]')).toHaveAttribute('data-markify-status', 'downloaded');
        });

        test('AI console API: connect, status, list and export from the browser console', async ({ markify, page }) => {
            const { topics: [first], blocked } = await discover(markify, page);
            markify.store.set('markify_agent_api_v1', { sites: { [site.id]: { token: TOKEN, createdAt: LONG_AGO } } });
            await markify.open(`${site.origin}/latest`);
            await expect.poll(() => page.locator('.markify-batch-checkbox').count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(2);
            const result = await page.evaluate(async ([token, id, exportToo]) => {
                const m = await (window as any).markify.connect(token);
                return { status: await m.status(), list: await m.list(), exported: exportToo ? await m.export(Number(id)) : undefined };
            }, [TOKEN, first.id, !blocked] as const);
            expect(result.status).toMatchObject({ site: { id: site.id }, page: { kind: 'listing' } });
            expect(result.list.items.map((item: { id: string }) => item.id)).toContain(first.id);
            if (blocked) { note('export not checked', blocked); return; }
            expect(result.exported).toMatchObject({ ok: true, site: site.id, id: first.id });
            expect(result.exported.markdown).toMatch(/ \| .+ \| #1\b/);
        });

        test('settings: a per-site file name is stored and the page reloads with it', async ({ markify, page }) => {
            const { topics: [first], blocked } = await discover(markify, page);
            await markify.open(`${site.origin}/t/topic/${first.id}`);
            await markify.runMenu('Settings');
            await expect(page.locator('#markify-settings [data-action="scope"]')).toHaveValue(site.id);
            await page.locator('#markify-settings [data-field="filename.single"]').fill('{site}-{id}');
            await Promise.all([page.waitForEvent('load'), page.locator('#markify-settings [data-action="save"]').click()]);
            await markify.ready();
            expect(markify.store.get('markify_overrides_v1')).toMatchObject({ sites: { [site.id]: { filename: { single: '{site}-{id}' } } } });
            await expect(page.locator('#markify-container')).toBeVisible({ timeout: 30_000 });
            if (blocked) { note('download not checked', blocked); return; }
            const { name } = await markify.download(() => page.locator('#markify-download-btn').dispatchEvent('click'));
            expect(name).toBe(`${site.id}-${first.id}.md`);
        });

        test('history page checks downloaded topics against the site', async ({ markify, page }) => {
            const { topics: [first, second] } = await withData(markify, page);
            seed(markify, [
                { id: first.id, title: first.title, downloadedAt: LONG_AGO },
                { id: second.id, title: second.title, downloadedAt: new Date(Date.now() + 86_400_000).toISOString() },
            ]);
            await markify.open(`${site.origin}/latest`);
            await markify.runMenu('Download History');
            const row = (id: string) => page.locator(`#markify-history tr[data-key="${site.id}:${id}"] .chip`);
            await page.locator('#markify-history [data-action="check"]').click();
            await expect(row(first.id)).toHaveText(/^Updated/, { timeout: 30_000 });
            await expect(row(second.id)).toHaveText('Up to date', { timeout: 30_000 });
        });

        test('CLI converts a real topic end to end', async ({ markify, page }) => {
            const { topics: [topic] } = await discover(markify, page);
            // The CLI is a plain HTTP client: data-centre IPs get the bot challenge there.
            const probe = await markify.get(`${site.origin}/raw/${topic.id}?page=1`);
            if (isChallenge(probe.status, probe.text)) skipBlocked(`/raw/ answered HTTP ${probe.status} to a plain HTTP client`);
            const out = join(tempDir(), `${topic.id}.md`);
            const result = await runCli(['convert', `${site.origin}/t/topic/${topic.id}`, '-o', out]);
            expect(result.status, result.stderr).toBe(0);
            const text = readFileSync(out, 'utf8');
            expect(frontmatter(text).tags).toContain(site.id);
            expect(text).toMatch(/ \| .+ \| #1\b/);
        });
    });
}

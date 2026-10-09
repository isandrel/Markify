/**
 * The userscript contract every Discourse site must meet, derived from its fixture
 * spec. A site's spec file is a single `discourseSuite(...)` call.
 */
import { test, expect } from './harness';
import { discourseRows, type DiscourseSpec } from '../fixtures';

type Page = import('@playwright/test').Page;

export interface DiscourseSite {
    /** Stable profile id (config/adapters/<id>.toml). */
    id: string;
    spec: DiscourseSpec;
    /** Profile metadata tags expected in frontmatter. */
    tags: string[];
}

/** Mirrors core's filename sanitising for the characters these fixtures use. */
const fileName = (title: string) => title.replace(/[<>:"/\\|?*]/g, '-').replace(/-+/g, '-').trim();
const today = () => new Date().toISOString().slice(0, 10);
const boxIds = (page: Page) => page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId));

export function discourseSuite({ id, spec, tags }: DiscourseSite): void {
    const origin = spec.origin;
    const entries = Object.entries(spec.topics);
    const [multiId, multi] = entries.find(([, topic]) => !topic.status && topic.pages.length > 1)!;
    const [singleId, single] = entries.find(([, topic]) => !topic.status && topic.pages.length === 1)!;
    const failing = entries.filter(([, topic]) => topic.status);
    const ok = (ids: string[]) => ids.filter(topic => !spec.topics[topic].status);

    test.describe(`${id}: topic page`, () => {
        test('Download joins every raw page, with the clean topic title and profile tags', async ({ markify, page }) => {
            await markify.open(`${origin}/t/some-slug/${multiId}`);
            await expect(page.locator('#markify-container')).toBeVisible();
            // The page title carries the category too; the export must not.
            expect(await page.title()).toBe(`${multi.title} - ${multi.category} - ${spec.siteTitle}`);

            const { name, text } = await markify.download(() => page.locator('#markify-download-btn').click());
            expect(name).toBe(`${fileName(multi.title)}.md`);
            expect(text.startsWith(`---\ntitle: "${multi.title}"\nsource: ${origin}/t/some-slug/${multiId}\n`)).toBe(true);
            expect(text).toContain(`tags:\n${tags.map(tag => `  - ${tag}`).join('\n')}\n`);
            expect(text).toContain(`${multi.pages[0]}\n\n---\n\n${multi.pages[1]}`);

            const raw = markify.apiRequests(`${origin}/raw/`);
            expect(raw.map(r => r.url)).toEqual(Array.from({ length: multi.pages.length + 1 }, (_, i) => `${origin}/raw/${multiId}?page=${i + 1}`));
            expect(raw.every(r => r.via === 'page' && r.headers.accept === 'text/plain')).toBe(true);
            await expect.poll(() => Object.keys((markify.store.get('markify_download_history') ?? {}) as object)).toEqual([`${id}:${multiId}`]);
        });

        test('Copy, slugless and post-number URLs resolve the same topic', async ({ markify, page }) => {
            await markify.open(`${origin}/t/topic/${singleId}/5`);
            await page.locator('#markify-copy-btn').click();
            await markify.lastNotification('Copied to clipboard!');
            expect(markify.clipboard[0]).toContain(single.pages[0]);
            expect(markify.clipboard[0]).toContain(`title: "${single.title}"`);

            await markify.open(`${origin}/t/${singleId}`);
            expect((await markify.download(() => page.locator('#markify-download-btn').click())).name).toBe(`${fileName(single.title)}.md`);
        });

        for (const [topicId, topic] of failing) {
            test(`HTTP ${topic.status} from /raw/ fails visibly without history`, async ({ markify, page }) => {
                await markify.open(`${origin}/t/x/${topicId}`);
                let downloads = 0;
                page.on('download', () => downloads++);
                await page.locator('#markify-download-btn').click();
                await markify.lastNotification('Failed to convert page');
                expect(downloads).toBe(0);
                expect(markify.store.get('markify_download_history')).toBeUndefined();
                await expect(page.locator('#markify-download-btn')).toHaveText('📥 Download');
            });
        }

        test('categories home shows no Markify controls', async ({ markify, page }) => {
            await markify.open(`${origin}/categories`);
            await expect(page.locator('#markify-container')).toBeHidden();
            await expect(page.locator('#markify-batch-panel')).toHaveCount(0);
        });
    });

    test.describe(`${id}: listings`, () => {
        test('category batch: rows in the topic list only; failures stay selected', async ({ markify, page }) => {
            await markify.open(`${origin}/c/${spec.category.path}`);
            await expect.poll(() => boxIds(page)).toEqual(spec.category.ids);
            await expect(page.locator('td.main-link .markify-checkbox-wrapper')).toHaveCount(spec.category.ids.length);
            await expect(page.locator('aside .markify-batch-checkbox')).toHaveCount(0);

            await page.locator('#markify-select-all').check();
            const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click());
            expect(zip.name).toBe(`${id}-category-${spec.category.name}-${today()}.zip`);
            const succeeded = ok(spec.category.ids);
            expect(Object.keys(zip.files).sort()).toEqual(succeeded.map(topic => `${topic} - ${fileName(spec.topics[topic].title)}.md`).sort());
            const failed = spec.category.ids.filter(topic => spec.topics[topic].status);
            const notice = await markify.lastNotification('Download started for');
            expect(notice.text).toContain(`${succeeded.length}/${spec.category.ids.length} items`);
            for (const topic of failed) {
                expect(notice.text).toContain(`${spec.topics[topic].title}: HTTP ${spec.topics[topic].status} during topic`);
                await expect(page.locator(`[data-item-id="${topic}"]`)).toBeChecked();
            }
            const history = Object.keys(markify.store.get('markify_download_history') as object).sort();
            expect(history).toEqual(succeeded.map(topic => `${id}:${topic}`).sort());
        });

        test('latest: rows loaded by infinite scroll join the selection list', async ({ markify, page }) => {
            await markify.open(`${origin}/latest`);
            await expect.poll(() => boxIds(page)).toEqual(spec.latest);
            await page.locator(`[data-item-id="${spec.latest[0]}"]`).check();
            const more = Object.keys(spec.topics).filter(topic => !spec.latest.includes(topic)).slice(0, 1);
            await page.evaluate(rows => document.querySelector('#main-outlet .topic-list-body')!.insertAdjacentHTML('beforeend', rows), discourseRows(spec, more));
            await expect.poll(() => boxIds(page)).toEqual([...spec.latest, ...more]);
            await expect(page.locator(`[data-item-id="${spec.latest[0]}"]`)).toBeChecked();
            await expect(page.locator('#markify-batch-panel button')).toHaveText('📥 Download Selected (1)');
            const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click());
            expect(zip.name).toBe(`${id}-latest-latest-${today()}.zip`);
            expect(Object.keys(zip.files)).toEqual([`${spec.latest[0]} - ${fileName(spec.topics[spec.latest[0]].title)}.md`]);
        });

        test('tag and search listings use their own layouts', async ({ markify, page }) => {
            await markify.open(`${origin}/tag/${spec.tag.name}`);
            await expect.poll(() => boxIds(page)).toEqual(spec.tag.ids);

            await markify.open(`${origin}/search?q=${spec.search.query}`);
            await expect.poll(() => boxIds(page)).toEqual(spec.search.ids);
            await page.locator('#markify-select-all').check();
            const zip = await markify.downloadZip(() => page.locator('#markify-batch-panel button').click());
            expect(zip.name).toBe(`${id}-search-Search results-${today()}.zip`);
            expect(Object.keys(zip.files).sort()).toEqual(ok(spec.search.ids).map(topic => `${topic} - ${fileName(spec.topics[topic].title)}.md`).sort());
        });

        test('topics already downloaded are marked on listings', async ({ markify, page }) => {
            await markify.open(`${origin}/t/x/${singleId}`);
            await markify.download(() => page.locator('#markify-download-btn').click());
            await expect.poll(() => markify.store.has('markify_download_history')).toBe(true);
            await markify.open(`${origin}/c/${spec.category.path}`);
            const marked = page.locator('.markify-checkbox-wrapper:has(span[title="Already downloaded"]) input');
            await expect(marked).toHaveCount(1);
            await expect(marked).toHaveAttribute('data-item-id', singleId);
        });
    });
}

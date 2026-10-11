/**
 * Real-site checks for Reddit, logged out, public posts only. Posts are found
 * through the subreddit's JSON with a plain HTTP client, as the CLI reads it.
 * Reddit blocks many data-centre IPs outright ("You've been blocked by network
 * security", HTTP 403); then every check skips with that reason
 * (MARKIFY_E2E_BLOCKED=fail fails instead), never worked around.
 * `live-dryrun` runs the same checks against the fixtures.
 */
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { test, expect, isChallenge, skipBlocked, type MarkifyBrowser } from '../../support/harness';
import { runCli, tempDir } from '../../support/processes';
import { REDDIT } from '../../fixtures';

type Json = Record<string, any>;
interface Post { id: string; title: string; comments: number; permalink: string }
const SUBREDDIT = 'programming';
const attach = (name: string, body: string) => test.info().attach(name, { body: body.slice(0, 200_000), contentType: 'text/markdown' });
function frontmatter(markdown: string): Json {
    const block = markdown.match(/^---\n([\s\S]*?)\n---\n/);
    expect(block, 'export starts with YAML frontmatter').not.toBeNull();
    return parseYaml(block![1]);
}

test.describe('reddit live site (logged out)', () => {
    let discovered: Post[] | undefined;

    async function discover(markify: MarkifyBrowser): Promise<Post[]> {
        if (discovered) return discovered;
        const url = `${REDDIT}/r/${SUBREDDIT}/hot.json?limit=15&raw_json=1`;
        const response = markify.network === 'live' ? await fetch(url).then(async r => ({ status: r.status, text: await r.text() })) : await markify.get(url);
        if (isChallenge(response.status, response.text)) skipBlocked(`${REDDIT} answered HTTP ${response.status} with a block page`);
        expect(response.status, 'subreddit JSON').toBe(200);
        const posts: Post[] = (JSON.parse(response.text).data.children as Json[]).filter(({ data }) => !data.stickied)
            .map(({ data }) => ({ id: data.id, title: data.title, comments: data.num_comments, permalink: data.permalink }));
        expect(posts.length, 'posts in the subreddit').toBeGreaterThanOrEqual(2);
        // Posts with some comments first, small enough to stay within the request budget.
        discovered = [...posts.filter(post => post.comments > 0 && post.comments <= 200), ...posts.filter(post => !post.comments)].slice(0, 3);
        return discovered;
    }

    test('CLI converts a real post end to end', async ({ markify }) => {
        const [post] = await discover(markify);
        const out = join(tempDir(), `${post.id}.md`);
        const result = await runCli(['convert', `${REDDIT}${post.permalink}`, '-o', out]);
        expect(result.status, result.stderr).toBe(0);
        expect(result.stderr).toContain('Adapter:    Reddit');
        const text = readFileSync(out, 'utf8');
        await attach(`cli-${post.id}.md`, text);
        expect(frontmatter(text)).toMatchObject({ title: post.title, tags: expect.arrayContaining(['reddit', `r/${SUBREDDIT}`]) });
        if (post.comments) expect(text).toMatch(/^## Comments \(\d+\)$/m);
    });

    test('post page: Download exports the post and its comments', async ({ markify, page }) => {
        const [post] = await discover(markify);
        await markify.open(`${REDDIT}${post.permalink}`);
        await expect(page.locator('#markify-container')).toBeVisible({ timeout: 30_000 });
        const { text } = await markify.download(() => page.locator('#markify-download-btn').dispatchEvent('click'));
        await attach(`export-${post.id}.md`, text);
        expect(frontmatter(text)).toMatchObject({ title: post.title, replies: expect.any(Number), tags: expect.arrayContaining(['reddit', `r/${SUBREDDIT}`]) });
        if (post.comments) expect(text).toMatch(/^\*\*u\/.+\*\* · -?\d+ points · \*/m);
    });

    test('subreddit feed: posts get checkboxes', async ({ markify, page }) => {
        const posts = await discover(markify);
        await markify.open(`${REDDIT}/r/${SUBREDDIT}/`);
        await expect.poll(() => page.locator('.markify-batch-checkbox').count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(2);
        const ids = await page.locator('.markify-batch-checkbox').evaluateAll(list => list.map(box => (box as HTMLInputElement).dataset.itemId));
        expect(ids.some(id => posts.some(post => post.id === id)), 'a hot post among the checkboxes').toBe(true);
    });
});

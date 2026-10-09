/**
 * Real-site checks for the Discourse forums (US Card Forum, LINUX DO), logged out.
 *
 * Both sites put pages, JSON and /raw/ behind a bot challenge for data-centre
 * IPs, so on GitHub-hosted runners these checks skip with that reason; on a runner
 * the sites accept (LIVE_RUNNER, MARKIFY_E2E_BLOCKED=fail) they run for real.
 * `live-dryrun` runs them against the fixtures.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { test, expect, isChallenge, skipBlocked, type MarkifyBrowser } from '../../support/harness';
import { runCli, tempDir } from '../../support/processes';
import { LINUXDO, USCF } from '../../fixtures';

type Json = Record<string, any>;
interface Topic { id: string; title: string }

const sites = [
    { id: 'uscardforum', origin: USCF },
    { id: 'linuxdo', origin: LINUXDO },
];

for (const site of sites) {
    test.describe(`${site.id} live site (logged out)`, () => {
        let topics: Topic[] | undefined;

        /** Public topics from /latest.json, or a skip when the site challenges us. */
        async function latest(markify: MarkifyBrowser): Promise<Topic[]> {
            if (topics) return topics;
            const response = await markify.get(`${site.origin}/latest.json`);
            if (isChallenge(response.status, response.text)) skipBlocked(`${site.origin}/latest.json answered HTTP ${response.status} with a bot challenge`);
            expect(response.status, '/latest.json').toBe(200);
            const list = JSON.parse(response.text).topic_list?.topics as Json[] | undefined;
            expect(Array.isArray(list), 'topic_list.topics').toBe(true);
            topics = list!.filter(topic => typeof topic.id === 'number' && typeof topic.title === 'string').slice(0, 5)
                .map(topic => ({ id: String(topic.id), title: topic.title }));
            expect(topics.length).toBeGreaterThan(0);
            return topics;
        }

        test('/raw/ serves Discourse Markdown pages that end with an empty page', async ({ markify }) => {
            const [topic] = await latest(markify);
            const first = await markify.get(`${site.origin}/raw/${topic.id}?page=1`);
            if (isChallenge(first.status, first.text)) skipBlocked(`/raw/ answered HTTP ${first.status} with a bot challenge`);
            expect(first.status).toBe(200);
            // "username | 2026-01-01 00:00:00 UTC | #1" heads every post.
            expect(first.text).toMatch(/^\S.* \| .+ \| #1\b/m);
            const beyond = await markify.get(`${site.origin}/raw/${topic.id}?page=9999`);
            expect(beyond.status).toBe(200);
            expect(beyond.text.trim()).toBe('');
        });

        test('CLI converts a real topic end to end', async ({ markify }) => {
            const [topic] = await latest(markify);
            const out = join(tempDir(), `${topic.id}.md`);
            // Default strategy: /raw/ for the body, the topic page for title and tags (raw has neither).
            const result = await runCli(['convert', `${site.origin}/t/topic/${topic.id}`, '-o', out]);
            expect(result.status, result.stderr).toBe(0);
            const text = readFileSync(out, 'utf8');
            await test.info().attach(`export-${site.id}-${topic.id}.md`, { body: text.slice(0, 20_000), contentType: 'text/markdown' });
            const meta = parseYaml(text.match(/^---\n([\s\S]*?)\n---\n/)![1]);
            expect(meta.tags).toContain(site.id);
            expect(meta.title).toBe(topic.title);
            expect(text).toMatch(/ \| .+ \| #1\b/);
        });

        test('browser: latest list gets checkboxes and a topic exports with its clean title', async ({ markify, page }) => {
            const [topic] = await latest(markify);
            await markify.open(`${site.origin}/latest`);
            await expect.poll(() => page.locator('.markify-batch-checkbox').count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(1);
            await test.info().attach('latest-main.html', { body: (await page.locator('#main-outlet').evaluate(el => el.outerHTML)).slice(0, 200_000), contentType: 'text/html' });

            await markify.open(`${site.origin}/t/topic/${topic.id}`);
            const { text } = await markify.download(() => page.locator('#markify-download-btn').dispatchEvent('click'));
            expect(parseYaml(text.match(/^---\n([\s\S]*?)\n---\n/)![1]).title).toBe(topic.title);
        });
    });
}

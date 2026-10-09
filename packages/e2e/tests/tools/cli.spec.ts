import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { blogArticle, BLOG, JINA, P3A, P3A_API, P3A_INSTANT, USCF } from '../../fixtures';
import { runCli, serve, tempDir } from '../../support/processes';
import { repoRoot, version } from '../../support/harness';

const UA = readFileSync(join(repoRoot, 'config/notifications.toml'), 'utf8').match(/^user_agent\s*=\s*"(.+)"/m)![1];

test.describe('markify CLI', () => {
    test('version, help and unknown commands', async () => {
        expect((await runCli(['--version'])).stdout.trim()).toBe(`markify v${version}`);
        const help = await runCli(['--help']);
        expect(help.status).toBe(0);
        for (const command of ['convert', 'batch', 'adapters', 'config']) expect(help.stdout).toContain(command);
        for (const command of ['convert', 'batch', 'adapters', 'config']) {
            const sub = await runCli([command, '--help']);
            expect(sub.status).toBe(0);
            expect(sub.stdout).toContain(`markify ${command}`);
        }
        const unknown = await runCli(['frobnicate']);
        expect(unknown.status).toBe(1);
        expect(unknown.stderr).toContain('Unknown command: frobnicate');
    });

    test('adapters and config are listed from the profile registry', async () => {
        const adapters = JSON.parse((await runCli(['adapters', '--json'])).stdout) as { name: string; hasApi: boolean; patterns: string[] }[];
        expect(adapters.filter(a => a.hasApi).map(a => a.name)).toEqual(['1Point3Acres', 'US Card Forum']);
        expect(adapters.map(a => a.name)).toEqual(expect.arrayContaining(['Medium', 'Substack', 'Wikipedia', 'GitHub', 'Reddit', 'Dev.to']));
        expect(adapters.map(a => a.name)).not.toContain('Default');

        const profiles = JSON.parse((await runCli(['config', '--adapters', '--json'])).stdout);
        expect(Object.keys(profiles).sort()).toEqual(['1point3acres', 'uscardforum']);
        const config = JSON.parse((await runCli(['config', '--json'])).stdout);
        expect(Object.keys(config)).toEqual(expect.arrayContaining(['adapters', 'package', 'templates', 'ui', 'notifications']));
        expect((await runCli(['config'])).stdout).toContain('Adapters loaded: 2');
    });

    test('config is found when run from outside the repository', async () => {
        const result = await runCli(['config', '--adapters', '--json'], { cwd: tempDir() });
        expect(result.status).toBe(0);
        expect(Object.keys(JSON.parse(result.stdout))).toHaveLength(2);
    });

    test('convert: 1Point3Acres thread through the forum JSON API', async () => {
        const result = await runCli(['convert', `${P3A}/home/thread/1001`]);
        expect(result.status).toBe(0);
        expect(result.stderr).toContain('Site-specific API detected');
        expect(result.stderr).toContain('Adapter:    1Point3Acres');
        expect(result.stderr).toContain('Filename:   Offer 比较- Google vs Meta.md');
        expect(result.stdout).toContain('title: "Offer 比较: Google vs Meta"');
        expect(result.stdout).toContain('## Comments (30)');
        expect(result.stdout).toContain('Reply number 25 with **emphasis 25**');
        const api = result.requests.filter(r => r.url.startsWith(P3A_API));
        // Thread, two comment pages, and the nested replies of one post.
        expect(api).toHaveLength(4);
        expect(api.every(r => r.headers['user-agent'] === UA)).toBe(true);
        expect(result.requests.some(r => r.url.startsWith(JINA))).toBe(false);
    });

    for (const url of [`${P3A}/bbs/thread-1001-1-1.html`, `${P3A}/home/pins/1001`, `${P3A_INSTANT}/thread/1001`]) {
        test(`convert: 1Point3Acres legacy/alternate route ${new URL(url).host}${new URL(url).pathname}`, async () => {
            const result = await runCli(['convert', url]);
            expect(result.status).toBe(0);
            expect(result.stderr).toContain('Filename:   Offer 比较- Google vs Meta.md');
            expect(result.stdout).toContain('```\ndef solve(nums):\n    return sorted(nums)\n```');
            expect(result.requests.filter(r => r.url.startsWith(P3A_API)).map(r => r.url)[0]).toBe(`${P3A_API}/api/v3/home-threads/1001`);
        });
    }

    test('convert: 1Point3Acres API failure exits non-zero with the reason', async () => {
        const result = await runCli(['convert', `${P3A}/home/thread/1003`]);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('HTTP 403 during thread');
        expect(result.stdout).toBe('');
    });

    test('convert: US Card Forum topic gets page title, tags and every raw page', async () => {
        const result = await runCli(['convert', `${USCF}/t/amex-platinum-offer/2001`]);
        expect(result.status).toBe(0);
        expect(result.stderr).toContain('Filename:   Amex Platinum offer.md');
        expect(result.stdout).toMatch(/^---\ntitle: "Amex Platinum offer"\n/);
        expect(result.stdout).toContain('  - credit-cards');
        expect(result.stdout).toContain('Second page reply.');
        const raw = result.requests.filter(r => r.url.startsWith(`${USCF}/raw/`));
        expect(raw.map(r => r.url)).toEqual([1, 2, 3].map(n => `${USCF}/raw/2001?page=${n}`));
        expect(raw.every(r => r.headers.accept === 'text/plain')).toBe(true);
    });

    test('convert: generic page via Jina Reader, honouring --jina-token', async () => {
        const result = await runCli(['convert', `${BLOG}/post`, '--jina-token', 'secret-token']);
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('title: "Reader Title"');
        expect(result.stdout).toContain('description: "Reader description"');
        expect(result.stdout).toContain(`Reader rendered **markdown** for ${BLOG}/post`);
        const jina = result.requests.find(r => r.url === `${JINA}/${BLOG}/post`)!;
        expect(jina.headers.authorization).toBe('Bearer secret-token');
        expect(jina.headers['x-target-selector']).toContain('article');
    });

    test('convert: falls back to DOM parsing when Jina Reader fails', async () => {
        const result = await runCli(['convert', `${BLOG}/jina-fails`]);
        expect(result.status).toBe(0);
        expect(result.stderr).toContain('falling back to DOM parsing');
        expect(result.stdout).toContain('title: "A Field Guide to Markdown"');
        expect(result.stdout).toContain('author: "Grace Hopper"');
        expect(result.stdout).toContain('Markdown is **plain text** with *light* syntax and ~~no~~ fuss.');
    });

    test('convert --strategy api-only fails instead of falling back', async () => {
        const result = await runCli(['convert', `${BLOG}/jina-fails`, '--strategy', 'api-only']);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('No API available');
    });

    test('convert --strategy dom-only over real HTTP, -o file, --no-frontmatter', async () => {
        const server = await serve({ '/article': blogArticle });
        try {
            const out = join(tempDir(), 'note.md');
            const result = await runCli(['convert', `${server.url}/article`, '-s', 'dom-only', '-o', out, '--no-frontmatter']);
            expect(result.status).toBe(0);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain(`Written to: ${out}`);
            const markdown = readFileSync(out, 'utf8');
            expect(markdown.startsWith('# A Field Guide to Markdown')).toBe(true);
            expect(markdown).toContain('```\nconst answer = 42;\n```');
            expect(markdown).toContain('*   First item');
            expect(markdown).toContain('[the spec](https://example.org/spec)');
            for (const removed of ['Site navigation', 'Footer links', 'script content']) expect(markdown).not.toContain(removed);
            expect(result.requests.some(r => r.url.startsWith(JINA))).toBe(false);
        } finally {
            await server.close();
        }
    });

    test('implicit convert when the first argument is a URL', async () => {
        const result = await runCli([`${P3A}/home/thread/1002`]);
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('# Visa timeline 2026');
    });

    test('batch writes one file per URL and reports failures', async () => {
        const dir = join(tempDir(), 'out');
        const result = await runCli(['batch', `${P3A}/home/thread/1002`, `${USCF}/t/slug/2002`, `${P3A}/home/thread/1003`, '-d', dir]);
        expect(result.status).toBe(0);
        expect(readdirSync(dir).sort()).toEqual(['Chase 5-24 rule.md', 'Visa timeline 2026.md']);
        expect(readFileSync(join(dir, 'Chase 5-24 rule.md'), 'utf8')).toContain('Single page topic.');
        expect(result.stderr).toContain('Done: 2 succeeded, 1 failed');
        expect(result.stderr).toContain('HTTP 403 during thread');
    });
});

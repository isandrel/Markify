import { defineConfig, devices } from '@playwright/test';
import type { NetworkMode } from './support/harness';

/**
 * One project per site, plus site-independent userscript behaviour, the
 * CLI/MCP tools, and the real-site checks. Run a single site with
 * `--project=<site id>`; a new site adds a fixture module, a tests/<site id>/
 * folder and an entry here.
 *
 * `live` reaches the real sites, so it only exists when
 * MARKIFY_E2E_LIVE=1 (scheduled workflow); `live-dryrun` runs the same spec
 * offline in every normal run.
 */
const live = process.env.MARKIFY_E2E_LIVE === '1';

export default defineConfig<{ network: NetworkMode }>({
    testDir: './tests',
    timeout: 90_000,
    expect: { timeout: 10_000 },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI
        ? [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]]
        : 'list',
    use: {
        browserName: 'chromium',
        acceptDownloads: true,
        trace: 'retain-on-failure',
        // Without a UTF-8 locale Chromium renames non-ASCII downloads to "download".
        launchOptions: { env: { ...process.env, LANG: 'C.UTF-8' } },
    },
    projects: [
        { name: '1point3acres', testDir: './tests/1point3acres' },
        { name: 'uscardforum', testDir: './tests/uscardforum' },
        { name: 'linuxdo', testDir: './tests/linuxdo' },
        { name: 'userscript', testDir: './tests/userscript' },
        { name: 'tools', testDir: './tests/tools' },
        { name: 'live-dryrun', testDir: './tests/live', fullyParallel: false, use: { network: 'fixtures' } },
        ...(live ? [{
            name: 'live',
            testDir: './tests/live',
            fullyParallel: false,
            timeout: 180_000,
            // The real network is the only flaky part; a second failure is reported.
            retries: 1,
            use: {
                network: 'live' as const,
                userAgent: devices['Desktop Chrome'].userAgent,
                locale: 'zh-CN',
                timezoneId: 'America/Los_Angeles',
                navigationTimeout: 60_000,
                trace: 'retain-on-failure' as const,
            },
        }] : []),
    ],
});

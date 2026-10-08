import { defineConfig } from '@playwright/test';

/**
 * One project per site, plus site-independent userscript behaviour and the
 * CLI/MCP tools. Run a single site with `--project=<site id>`; a new site adds
 * a fixture module, a tests/<site id>/ folder and an entry here.
 */
export default defineConfig({
    testDir: './tests',
    timeout: 90_000,
    expect: { timeout: 10_000 },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
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
        { name: 'userscript', testDir: './tests/userscript' },
        { name: 'tools', testDir: './tests/tools' },
    ],
});

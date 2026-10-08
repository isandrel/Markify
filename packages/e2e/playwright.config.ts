import { defineConfig } from '@playwright/test';

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
});

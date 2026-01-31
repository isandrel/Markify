import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import { readFileSync } from 'fs';
import { parse } from '@iarna/toml';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load and merge all config files
const configDir = join(__dirname, 'config');
const configFiles = ['package.toml', 'userscript.toml', 'templates.toml', 'ui.toml', 'sites.toml'];

let config: any = {};

for (const file of configFiles) {
    const filePath = join(configDir, file);
    try {
        const content = readFileSync(filePath, 'utf-8');
        const parsed = parse(content);

        // Merge configs (templates go into templates key)
        if (file === 'templates.toml') {
            config.templates = parsed;
        } else {
            config = { ...config, ...parsed };
        }
    } catch (error) {
        console.warn(`Warning: Could not load ${file}`, error);
    }
}

export default defineConfig({
    plugins: [
        monkey({
            entry: 'src/main.ts',
            userscript: {
                name: config.package.name,
                namespace: config.package.repository,
                version: config.package.version,
                description: config.package.description,
                author: config.package.author,
                match: config.userscript.match,
                grant: config.userscript.grant.permissions,
                icon: config.userscript.icon,
                downloadURL: `${config.package.repository}/raw/main/dist/markify-v${config.package.version}.user.js`,
                updateURL: `${config.package.repository}/raw/main/dist/markify-v${config.package.version}.user.js`,
            },
            build: {
                fileName: `markify-v${config.package.version}.user.js`,
                externalGlobals: {},
                metaFileName: false,
            },
            server: {
                open: false, // Don't auto-open browser
            },
        }),
    ],
    server: {
        port: 5173,
    },
    define: {
        // Make TOML templates available at runtime
        __MARKIFY_TEMPLATES__: JSON.stringify(config.templates || {}),
    },
});

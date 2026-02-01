import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import { readFileSync, readdirSync } from 'fs';
import { parse } from '@iarna/toml';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load and merge all config files
const configDir = join(__dirname, 'config');
const configFiles = [
    'package.toml',
    'userscript.toml',
    'templates.toml',
    'ui.toml',
    'sites.toml',
    'theme.toml',
    'notifications.toml',
];


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

// Load adapter-specific configs from config/adapters/
const adaptersDir = join(configDir, 'adapters');
try {
    const adapterFiles = readdirSync(adaptersDir).filter(f => f.endsWith('.toml'));

    if (!config.templates) {
        config.templates = {};
    }

    for (const adapterFile of adapterFiles) {
        const adapterName = adapterFile.replace('.toml', '');
        const adapterPath = join(adaptersDir, adapterFile);

        try {
            const content = readFileSync(adapterPath, 'utf-8');
            const parsed = parse(content);

            // Merge adapter config under its name
            config.templates[adapterName] = parsed;
            console.log(`Loaded adapter config: ${adapterName}`);
        } catch (error) {
            console.warn(`Warning: Could not load adapter ${adapterFile}`, error);
        }
    }
} catch (error) {
    console.warn('Warning: Could not load adapter configs', error);
}

export default defineConfig({
    plugins: [
        monkey({
            entry: 'src/main.ts',
            userscript: {
                name: config.package.name,
                namespace: config.userscript.namespace,
                version: config.package.version,
                description: config.package.description,
                author: config.package.author,
                license: config.userscript.license,
                match: config.userscript.match,
                grant: config.userscript.grant.permissions,
                icon: config.userscript.icon,
                supportURL: config.userscript.supportURL,
                homepageURL: config.userscript.homepageURL,
                downloadURL: `${config.package.repository}/raw/main/dist/markify.user.js`,
                updateURL: `${config.package.repository}/raw/main/dist/markify.user.js`,
                compatible: config.userscript.compatible?.browsers || [],
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
        // Make TOML configs available at runtime as global constants
        __MARKIFY_TEMPLATES__: JSON.stringify(config.templates || {}),
        __MARKIFY_THEME__: JSON.stringify(config.theme || {}),
        __MARKIFY_NOTIFICATIONS__: JSON.stringify(config.notifications || {}),
        __MARKIFY_UI__: JSON.stringify(config.ui || {}),
        __MARKIFY_PACKAGE__: JSON.stringify(config.package || {}),
    },
});

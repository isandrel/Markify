import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import { readFileSync, readdirSync } from 'fs';
import { parse } from '@iarna/toml';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { profileMetadata, resolveProfiles } from '../core/src/config/schema.ts';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Config directory is at repo root
const configDir = join(__dirname, '../../config');
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
// Runtime constants keep each file's own shape (ui.ui.buttons, theme.colors, notifications.messages).
const files: Record<string, any> = {};

for (const file of configFiles) {
    const filePath = join(configDir, file);
    try {
        const content = readFileSync(filePath, 'utf-8');
        const parsed = parse(content);
        files[file.replace(/\.toml$/, '')] = parsed;

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

// Adapter profiles have one validated loader shared with CLI/MCP.
const rawProfiles = Object.fromEntries(
    readdirSync(join(configDir, 'adapters'))
        .filter(file => file.endsWith('.toml'))
        .sort()
        .map(file => [file, parse(readFileSync(join(configDir, 'adapters', file), 'utf-8'))]),
);
const compiledConfig = { adapters: resolveProfiles(rawProfiles) };
const adapterMetadata = profileMetadata(compiledConfig.adapters);
const userscriptMatches = [...new Set([...(config.userscript.match ?? []), ...adapterMetadata.matches])].sort();

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
                match: userscriptMatches,
                connect: adapterMetadata.connect,
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
                open: false,
            },
        }),
    ],
    server: {
        port: 5173,
    },
    define: {
        // Make TOML configs available at runtime as global constants
        __MARKIFY_TEMPLATES__: JSON.stringify(config.templates || {}),
        __MARKIFY_THEME__: JSON.stringify(files.theme || {}),
        __MARKIFY_NOTIFICATIONS__: JSON.stringify(files.notifications || {}),
        __MARKIFY_UI__: JSON.stringify(files.ui || {}),
        __MARKIFY_PACKAGE__: JSON.stringify(config.package || {}),
        __MARKIFY_CONFIG__: JSON.stringify({ adapters: compiledConfig.adapters, templates: config.templates || {} }),
    },
});

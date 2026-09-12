/** Node/Bun only. Never imported by browser entrypoints. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@iarna/toml';
import { resolveProfiles } from './schema';
import { type MarkifyConfig } from '../config';

export function loadConfigFromDisk(configDir?: string): MarkifyConfig {
    if (!configDir) {
        let directory = process.cwd();
        while (true) {
            if (existsSync(join(directory, 'config', 'adapters'))) { configDir = join(directory, 'config'); break; }
            const parent = dirname(directory); if (parent === directory) break; directory = parent;
        }
        configDir ??= resolve(dirname(fileURLToPath(import.meta.url)), '../../../../config');
    }
    const adaptersDir = join(configDir, 'adapters');
    if (!existsSync(adaptersDir)) throw new Error(`CONFIG_NOT_FOUND: ${adaptersDir}`);
    const raw: Record<string, unknown> = {};
    for (const file of readdirSync(adaptersDir).filter(f => f.endsWith('.toml')).sort()) raw[file] = parse(readFileSync(join(adaptersDir, file), 'utf8'));
    const config: MarkifyConfig = { adapters: resolveProfiles(raw) };
    for (const name of ['package', 'templates', 'sites', 'theme', 'notifications', 'ui']) {
        const file = join(configDir, `${name}.toml`);
        if (existsSync(file)) config[name] = parse(readFileSync(file, 'utf8'));
    }
    return config;
}

/**
 * Configuration loader — reads TOML config files at runtime.
 *
 * Both CLI and MCP use this to load adapter configs from the filesystem.
 * The userscript gets config injected at build time via Vite `define`.
 *
 * The config is lazy-loaded and cached — first call reads from disk,
 * subsequent calls return the cached value.
 */

import { logger } from './utils/logger';

/** Parsed adapter config from TOML */
export interface AdapterConfig {
    [key: string]: unknown; // Index signature for Record<string, unknown> compatibility
    site: {
        name: string;
        base_url: string;
    };
    url_patterns?: string[];
    api?: {
        // Discourse-like sites
        raw_endpoint?: string;
        json_endpoint?: string;
        // 1Point3Acres-like sites
        thread_endpoint?: string;
        posts_endpoint?: string;
        // Common
        max_pages?: number;
        page_size?: number;
        page_delay?: { min_ms?: number; max_ms?: number; jitter?: number };
        order?: string;
        content_format?: string;
        request?: {
            credentials?: boolean;
            accept?: string;
        };
        id_extraction?: {
            patterns: string[];
        };
        response?: {
            success_field?: string;
            success_value?: number;
            data_field?: string;
        };
        fields?: Record<string, string | Record<string, string>>;
    };
    metadata?: {
        title_cleanup?: string;
        tags?: string[];
        source_url?: string;
    };
    http?: {
        user_agent?: string;
    };
    page_separator?: string;
    delimiter?: string;
    frontmatter?: { template?: string };
    document?: { template?: string };
    comment?: { template?: string };
    comments_header?: { template?: string };
    filename?: {
        single?: string;
        batch_item?: string;
        batch?: string;
    };
    batch?: Record<string, unknown>;
}

/** Full config object */
export interface MarkifyConfig {
    [key: string]: unknown; // Index signature for dynamic TOML keys
    adapters: Record<string, AdapterConfig>;
    templates?: Record<string, unknown>;
}

// ─── In-memory config cache ──────────────────────────────────────────

let cachedConfig: MarkifyConfig | null = null;

/**
 * Get the full Markify config.
 *
 * Loading order:
 *   1. Previously set via `setConfig()` (userscript injects at build time)
 *   2. Load from filesystem (CLI/MCP runtime)
 *   3. Empty defaults
 */
export function getConfig(): MarkifyConfig {
    if (cachedConfig) return cachedConfig;

    // Try loading from filesystem (CLI/MCP)
    try {
        cachedConfig = loadConfigFromDisk();
        return cachedConfig;
    } catch {
        // No filesystem access (e.g. browser) — return empty config
        cachedConfig = { adapters: {} };
        return cachedConfig;
    }
}

/**
 * Set config directly (used by userscript which gets config from Vite define)
 */
export function setConfig(config: MarkifyConfig): void {
    cachedConfig = config;
}

/**
 * Get adapter config by adapter name (case-insensitive lookup)
 */
export function getAdapterConfig(adapterName: string): AdapterConfig | undefined {
    const config = getConfig();

    // Try exact match first, then lowercase
    const key = Object.keys(config.adapters).find(
        k => k.toLowerCase() === adapterName.toLowerCase()
            || config.adapters[k]?.site?.name?.toLowerCase() === adapterName.toLowerCase()
    );

    return key ? config.adapters[key] : undefined;
}

/**
 * Extract an ID from a URL using patterns from adapter config.
 *
 * Tries each pattern in order and returns the first capturing group match.
 */
export function extractIdFromUrl(url: string, patterns: string[]): string | null {
    const pathname = new URL(url).pathname;

    for (const pattern of patterns) {
        const regex = new RegExp(pattern);
        const match = pathname.match(regex);
        if (match?.[1]) return match[1];
    }

    // Also try the full URL (some patterns may include the domain)
    for (const pattern of patterns) {
        const regex = new RegExp(pattern);
        const match = url.match(regex);
        if (match?.[1]) return match[1];
    }

    return null;
}

/**
 * Interpolate placeholders in a template string.
 *
 * Supports: {base_url}, {topic_id}, {thread_id}, {page}, {page_size}, {order}
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
        return vars[key]?.toString() ?? `{${key}}`;
    });
}

// ─── Filesystem config loader ────────────────────────────────────────

/**
 * Load config from config/ directory on disk.
 * Uses dynamic imports so it doesn't break in browser context.
 */
function loadConfigFromDisk(): MarkifyConfig {
    // Dynamic require for fs/path — only available in Node/Bun
    const fs = require('fs');
    const path = require('path');

    // Find config dir — try common locations
    const candidates = [
        path.resolve(process.cwd(), 'config'),
        path.resolve(__dirname, '../../config'),
        path.resolve(__dirname, '../../../config'),
        path.resolve(__dirname, '../../../../config'),
    ];

    let configDir: string | null = null;
    for (const dir of candidates) {
        if (fs.existsSync(dir)) {
            configDir = dir;
            break;
        }
    }

    if (!configDir) {
        logger.warn('Config directory not found, using defaults');
        return { adapters: {} };
    }

    logger.info(`Loading config from: ${configDir}`);

    // We need a TOML parser — use simple line-based parsing for simple values,
    // or require @iarna/toml if available
    let parseTOML: (content: string) => any;
    try {
        parseTOML = require('@iarna/toml').parse;
    } catch {
        // Fallback — try Bun's native TOML (if running in Bun)
        try {
            // Bun doesn't have built-in TOML, use a simple JSON fallback
            logger.warn('TOML parser not available, adapter configs will not be loaded');
            return { adapters: {} };
        } catch {
            return { adapters: {} };
        }
    }

    const config: MarkifyConfig = { adapters: {} };

    // Load adapter configs from config/adapters/
    const adaptersDir = path.join(configDir, 'adapters');
    if (fs.existsSync(adaptersDir)) {
        const files: string[] = fs.readdirSync(adaptersDir).filter((f: string) => f.endsWith('.toml'));
        for (const file of files) {
            const name = file.replace('.toml', '');
            try {
                const content = fs.readFileSync(path.join(adaptersDir, file), 'utf-8');
                config.adapters[name] = parseTOML(content);
                logger.info(`Loaded adapter config: ${name}`);
            } catch (error) {
                logger.warn(`Failed to load adapter config ${file}:`, error);
            }
        }
    }

    // Load main config files
    const mainFiles = ['templates.toml', 'sites.toml', 'theme.toml', 'notifications.toml', 'ui.toml'];
    for (const file of mainFiles) {
        const filePath = path.join(configDir, file);
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const key = file.replace('.toml', '');
                config[key] = parseTOML(content);
            } catch (error) {
                logger.warn(`Failed to load ${file}:`, error);
            }
        }
    }

    return config;
}

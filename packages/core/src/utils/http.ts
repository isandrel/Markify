/**
 * Human-like request behavior — randomized delays and realistic User-Agent
 *
 * Makes automated requests less detectable by:
 * - Using the real browser UA (userscript) or a realistic UA from config (CLI/MCP)
 * - Adding random jitter to delays (e.g., 500-1500ms instead of flat 1000ms)
 * - Supporting configurable delay ranges via TOML
 */

// ─── User-Agent ──────────────────────────────────────────────────────

/**
 * Get a User-Agent string that looks like a real browser.
 *
 * Priority:
 *   1. Explicit override (from adapter TOML http.user_agent)
 *   2. Real browser UA (navigator.userAgent — userscript runs in an actual browser)
 *   3. Global config UA from notifications.toml [http] user_agent (CLI/MCP)
 *
 * NEVER returns a bot-like or framework-identifying UA string.
 * The TOML config (notifications.toml) ships with a real Chrome UA as default.
 */
export function getUserAgent(override?: string): string {
    // 1. Explicit override from caller (adapter-specific TOML http.user_agent)
    if (override) return override;

    // 2. Real browser UA (userscript — this IS the real thing). Bun and Node also
    //    define navigator ("Bun/1.x", "Node.js/22"), so require a DOM as well.
    const nav = (globalThis as Record<string, unknown>).navigator as { userAgent?: string } | undefined;
    if (nav?.userAgent && typeof (globalThis as Record<string, unknown>).document !== 'undefined') {
        return nav.userAgent;
    }

    // 3. Read from global config (CLI/MCP loads from notifications.toml [http] section)
    try {
        // Lazy import to avoid circular deps — config.ts loads TOML from disk
        const { getConfig } = require('../config');
        const config = getConfig();
        const ua = (config as Record<string, unknown>)?.notifications as Record<string, unknown> | undefined;
        const httpConfig = (ua?.http ?? config?.http) as Record<string, string> | undefined;
        if (httpConfig?.user_agent) {
            return httpConfig.user_agent;
        }
    } catch {
        // Config not available yet — fall through
    }

    // 4. Last resort — still a real-looking UA, never "Markify/x.y.z"
    return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
}

// ─── Human-like delays ───────────────────────────────────────────────

export interface DelayConfig {
    /** Minimum delay in ms (default: 800) */
    min_ms?: number;
    /** Maximum delay in ms (default: 2500) */
    max_ms?: number;
    /** Add extra jitter: ±percentage (default: 0.2 = ±20%) */
    jitter?: number;
}

/**
 * Sleep for a human-like randomized duration.
 *
 * Instead of a fixed delay, uses a random value between min and max,
 * with optional jitter. This mimics natural reading/clicking patterns.
 *
 * @param config - Delay range configuration
 * @returns The actual delay used (in ms)
 */
export async function humanDelay(config?: DelayConfig): Promise<number> {
    const min = config?.min_ms ?? 800;
    const max = config?.max_ms ?? 2500;
    const jitter = config?.jitter ?? 0.2;

    // Base delay: random between min and max
    let delay = min + Math.random() * (max - min);

    // Apply jitter
    if (jitter > 0) {
        const jitterAmount = delay * jitter;
        delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    // Ensure we don't go below a reasonable minimum
    delay = Math.max(200, Math.round(delay));

    await new Promise(resolve => setTimeout(resolve, delay));
    return delay;
}

/**
 * Sleep for a specific duration (non-randomized).
 */
export async function sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build common request headers with a real User-Agent.
 * Merges with any existing headers.
 *
 * @param existing - Headers to merge with
 * @param config - Optional config with user_agent override (from TOML http section)
 */
export function buildHeaders(
    existing?: Record<string, string>,
    config?: { user_agent?: string },
): Record<string, string> {
    return {
        'User-Agent': getUserAgent(config?.user_agent),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(existing ?? {}),
    };
}

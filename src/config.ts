/**
 * Configuration utility
 * Provides centralized access to TOML configurations
 */

// Load configs from global constants injected by Vite
export const theme = __MARKIFY_THEME__;
export const notifications = __MARKIFY_NOTIFICATIONS__;
export const ui = __MARKIFY_UI__;
export const pkg = __MARKIFY_PACKAGE__;
export const templates = __MARKIFY_TEMPLATES__;

/**
 * Helper to interpolate placeholders in notification messages
 */
export function formatMessage(template: string, values: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return values[key] !== undefined ? String(values[key]) : match;
    });
}

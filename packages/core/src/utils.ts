/**
 * Sanitize filename for cross-platform compatibility
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-') // Replace invalid characters
        .replace(/-+/g, '-') // Remove duplicate hyphens
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 200); // Limit length
}

/**
 * Format current date as YYYY-MM-DD
 */
export function formatDate(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
}

/** A YAML scalar: plain when that is unambiguous, otherwise a JSON (double-quoted YAML) string. */
const yamlItem = (value: unknown): string => (typeof value === 'string' && !/^[\p{L}\p{N}_][\p{L}\p{N}_ ./+-]*$/u.test(value) ? JSON.stringify(value) : String(value));

/**
 * Generate YAML frontmatter for Obsidian. Strings are always quoted and
 * escaped, so titles with quotes, colons or # stay valid YAML.
 */
export function generateFrontmatter(metadata: Record<string, any>): string {
    const lines = ['---'];

    // Always include core fields
    if (metadata.title) lines.push(`title: ${JSON.stringify(String(metadata.title))}`);
    if (metadata.url) lines.push(`source: ${metadata.url}`);
    if (metadata.date) lines.push(`date: ${metadata.date}`);
    if (metadata.downloaded) lines.push(`downloaded: ${metadata.downloaded}`);

    // Optional fields
    if (metadata.author) lines.push(`author: ${JSON.stringify(String(metadata.author))}`);
    if (metadata.description) lines.push(`description: ${JSON.stringify(String(metadata.description))}`);

    // Tags (as YAML list)
    if (metadata.tags && metadata.tags.length > 0) {
        lines.push('tags:');
        metadata.tags.forEach((tag: string) => lines.push(`  - ${yamlItem(tag)}`));
    }

    // Add any other custom fields
    Object.keys(metadata).forEach(key => {
        if (!['title', 'url', 'date', 'downloaded', 'author', 'description', 'tags', 'source'].includes(key)) {
            const value = metadata[key];
            if (value === undefined || value === null) return;
            if (typeof value === 'string') {
                lines.push(`${key}: ${JSON.stringify(value)}`);
            } else if (Array.isArray(value)) {
                lines.push(`${key}:`);
                value.forEach(item => lines.push(`  - ${yamlItem(item)}`));
            } else {
                lines.push(`${key}: ${value}`);
            }
        }
    });

    lines.push('---');
    return lines.join('\n');
}

/**
 * Extract main content from a document using common selectors
 * Works with both browser DOM and minimal DOM implementations
 */
export function extractMainContent(doc: { querySelector(s: string): any; body: any }): any {
    const selectors = [
        'article',
        '[role="main"]',
        'main',
        '.post-content',
        '.article-content',
        '.entry-content',
        '#content',
        '.content',
    ];

    for (const selector of selectors) {
        const element = doc.querySelector(selector);
        if (element) {
            return element;
        }
    }

    // Fallback to body
    return doc.body;
}

/**
 * Helper to interpolate placeholders in template/message strings
 */
export function formatMessage(template: string, values: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return values[key] !== undefined ? String(values[key]) : match;
    });
}

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

/**
 * Generate YAML frontmatter for Obsidian
 */
export function generateFrontmatter(metadata: Record<string, any>): string {
    const lines = ['---'];

    // Always include core fields
    if (metadata.title) lines.push(`title: "${metadata.title}"`);
    if (metadata.url) lines.push(`source: ${metadata.url}`);
    if (metadata.date) lines.push(`date: ${metadata.date}`);
    if (metadata.downloaded) lines.push(`downloaded: ${metadata.downloaded}`);

    // Optional fields
    if (metadata.author) lines.push(`author: "${metadata.author}"`);
    if (metadata.description) lines.push(`description: "${metadata.description}"`);

    // Tags (as YAML list)
    if (metadata.tags && metadata.tags.length > 0) {
        lines.push('tags:');
        metadata.tags.forEach((tag: string) => lines.push(`  - ${tag}`));
    }

    // Add any other custom fields
    Object.keys(metadata).forEach(key => {
        if (!['title', 'url', 'date', 'downloaded', 'author', 'description', 'tags', 'source'].includes(key)) {
            const value = metadata[key];
            if (typeof value === 'string') {
                lines.push(`${key}: "${value}"`);
            } else if (Array.isArray(value)) {
                lines.push(`${key}:`);
                value.forEach(item => lines.push(`  - ${item}`));
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

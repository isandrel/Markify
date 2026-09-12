import { sanitizeFilename, formatDate } from '../utils';

/**
 * Context for filename template placeholders
 */
export interface FilenameContext {
    title?: string;
    id?: string;
    author?: string;
    site?: string;
    type?: string;  // "tag", "forum", "category", etc.
    tagname?: string; // Tag/category name (e.g., "Capital One")
    date?: string;  // YYYY-MM-DD
    index?: string; // For batch: "001", "002", etc.
}

/**
 * Apply filename template with placeholder replacement
 * 
 * Supported placeholders:
 * - {date} - Date in YYYY-MM-DD format (defaults to today)
 * - {title} - Post/thread title
 * - {id} - Post/thread ID
 * - {author} - Author name
 * - {site} - Site name (e.g., "1point3acres", "uscardforum")
 * - {type} - Content type (e.g., "tag", "forum", "category")
 * - {tagname} - Tag/category name (e.g., "Capital One", "Deals")
 * 
 * @example
 * applyFilenameTemplate("[{id}] {title}", { 
 *   id: "123456",
 *   title: "My Post" 
 * })
 * // Returns: "[123456] My Post"
 */
export function applyFilenameTemplate(
    template: string,
    context: FilenameContext
): string {
    const values: Record<string, string> = {
        date: context.date || formatDate(),
        title: context.title || 'untitled',
        id: context.id || '',
        author: context.author || '',
        site: context.site || '',
        type: context.type || '',
        tagname: context.tagname || '',
        index: context.index || '',
    };
    // One callback pass preserves literal dollar tokens and braces in user text.
    let result = template.replace(/\{(\w+)\}/g, (match, key: string) =>
        Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match);

    // Remove any empty placeholder remnants (e.g., " - " when id is empty)
    result = result.replace(/\s*-\s*-\s*/g, ' - '); // Collapse multiple separators
    result = result.replace(/^[\s-]+|[\s-]+$/g, ''); // Trim leading/trailing separators

    // Sanitize for filesystem compatibility
    return sanitizeFilename(result);
}

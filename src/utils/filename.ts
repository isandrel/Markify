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
    let result = template;

    // Replace placeholders with context values or defaults
    result = result.replace(/{date}/g, context.date || formatDate());
    result = result.replace(/{title}/g, context.title || 'untitled');
    result = result.replace(/{id}/g, context.id || '');
    result = result.replace(/{author}/g, context.author || '');
    result = result.replace(/{site}/g, context.site || '');
    result = result.replace(/{type}/g, context.type || '');
    result = result.replace(/{tagname}/g, context.tagname || '');

    // Remove any empty placeholder remnants (e.g., " - " when id is empty)
    result = result.replace(/\s*-\s*-\s*/g, ' - '); // Collapse multiple separators
    result = result.replace(/^[\s-]+|[\s-]+$/g, ''); // Trim leading/trailing separators

    // Sanitize for filesystem compatibility
    return sanitizeFilename(result);
}

/**
 * Markdown template configuration
 */
export interface MarkdownTemplates {
    // Document-level template
    document: {
        enabled: boolean;
        // Template for entire document
        // Variables: {frontmatter}, {content}, {title}, {url}, {date}
        template: string;
    };

    // Frontmatter template
    frontmatter: {
        enabled: boolean;
        fields: string[]; // Which fields to include
        customFields?: Record<string, string>; // Custom key-value pairs
    };

    // Main content template
    content: {
        header?: string; // Header before content
        footer?: string; // Footer after content
        separator: string; // Separator between sections/pages
    };

    // Comment/post template (for forums)
    comment: {
        enabled: boolean;
        // Template for each comment
        // Variables: {author}, {date}, {content}, {index}
        template: string;
    };
}

export const defaultTemplates: MarkdownTemplates = {
    document: {
        enabled: false,
        template: '{frontmatter}\n\n{content}',
    },
    frontmatter: {
        enabled: true,
        fields: ['title', 'source', 'date', 'downloaded', 'author', 'tags'],
    },
    content: {
        separator: '\n\n---\n\n',
    },
    comment: {
        enabled: false,
        template: '## Comment {index} - {author}\n**Posted:** {date}\n\n{content}',
    },
};

/**
 * Replace placeholders in template string
 */
export function replacePlaceholders(
    template: string,
    data: Record<string, any>
): string {
    let result = template;

    for (const [key, value] of Object.entries(data)) {
        const placeholder = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(placeholder, String(value || ''));
    }

    return result;
}

/**
 * Apply template to comment/post
 */
export function applyCommentTemplate(
    template: string,
    data: {
        author?: string;
        date?: string;
        content: string;
        index?: number;
    }
): string {
    return replacePlaceholders(template, {
        author: data.author || 'Unknown',
        date: data.date || '',
        content: data.content,
        index: String(data.index || 0),
    });
}

/**
 * Apply document template
 */
export function applyDocumentTemplate(
    template: string,
    data: {
        frontmatter: string;
        content: string;
        title?: string;
        url?: string;
        date?: string;
        [key: string]: any;
    }
): string {
    return replacePlaceholders(template, data);
}

/**
 * Parse US Card Forum raw markdown to extract individual posts
 */
export function parseForumPosts(rawMarkdown: string): Array<{
    author?: string;
    date?: string;
    content: string;
}> {
    const posts: Array<{ author?: string; date?: string; content: string }> = [];

    // Split by common forum post markers
    // US Card Forum uses headers or specific patterns
    const sections = rawMarkdown.split(/\n(?=#{1,3}\s)/); // Split on headers

    for (const section of sections) {
        if (section.trim().length === 0) continue;

        // Extract author from header if present
        const authorMatch = section.match(/^#{1,3}\s*(.+?)(?:\s*-\s*(.+?))?$/m);
        const author = authorMatch ? authorMatch[1].trim() : undefined;
        const date = authorMatch && authorMatch[2] ? authorMatch[2].trim() : undefined;

        posts.push({
            author,
            date,
            content: section,
        });
    }

    return posts.length > 0 ? posts : [{ content: rawMarkdown }];
}

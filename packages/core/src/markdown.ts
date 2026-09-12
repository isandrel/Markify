import TurndownService from 'turndown';
import bbob from '@bbob/html';
import presetHTML5 from '@bbob/preset-html5';
import type { ConversionConfig } from './types';

/** One fragment converter for API bodies and DOM exports. */
export function createTurndownService(config?: ConversionConfig): TurndownService {
    const service = new TurndownService({
        headingStyle: 'atx', codeBlockStyle: 'fenced', emDelimiter: '*',
        strongDelimiter: '**', linkStyle: 'inlined', ...config,
    });
    service.addRule('strikethrough', {
        filter: ['del', 's', 'strike'] as any, replacement: content => `~~${content}~~`,
    });
    // @bbob/preset-html5 expresses [b]/[i] as styled spans, not semantic tags.
    service.addRule('bbcodeEmphasis', {
        filter: node => node.nodeName === 'SPAN' && /(?:font-weight\s*:\s*(?:bold|[6-9]00)|font-style\s*:\s*italic)/i.test(node.getAttribute('style') ?? ''),
        replacement: (content, node) => {
            const style = (node as HTMLElement).getAttribute('style') ?? '';
            const marker = `${/font-weight\s*:\s*(?:bold|[6-9]00)/i.test(style) ? '**' : ''}${/font-style\s*:\s*italic/i.test(style) ? '*' : ''}`;
            return content.trim() ? `${marker}${content}${marker}` : content;
        },
    });
    service.remove((config?.removeElements ?? ['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe']) as any);
    return service;
}

export function bodyToMarkdown(body: string, format: string): string {
    if (format === 'markdown') return body;
    const html = format === 'bbcode' ? bbob(body, presetHTML5()) : body;
    return createTurndownService().turndown(html);
}

/** One pass preserves literal dollar tokens and placeholders inside supplied values. */
export function renderTemplate(template: string, values: Record<string, unknown>): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) =>
        Object.prototype.hasOwnProperty.call(values, key) ? String(values[key] ?? '') : match);
}

/**
 * Scalar-only template expansion. Existing quoted and unquoted scalar placeholders
 * are both serialized as JSON strings, which are valid YAML double-quoted scalars.
 * A composite scalar is rendered first and then quoted as a whole.
 */
export function renderFrontmatter(template: string, values: Record<string, unknown>): string {
    return template.split('\n').map(line => {
        if (!/\{\w+\}/.test(line)) return line;
        const match = line.match(/^(\s*(?:[^:#]+:\s*|-\s+))(.*)$/);
        if (!match) return renderTemplate(line, values);
        let scalar = match[2];
        if ((scalar.startsWith('"') && scalar.endsWith('"')) || (scalar.startsWith("'") && scalar.endsWith("'"))) scalar = scalar.slice(1, -1);
        const exact = scalar.match(/^\{(\w+)\}$/);
        const value = exact && Object.prototype.hasOwnProperty.call(values, exact[1])
            ? values[exact[1]] : renderTemplate(scalar, values);
        return match[1] + JSON.stringify(value ?? '');
    }).join('\n');
}

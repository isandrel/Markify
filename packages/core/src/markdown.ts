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
    // @bbob/preset-html5 expresses [b]/[i]/[s] as styled spans, not semantic tags.
    const bold = /font-weight\s*:\s*(?:bold|[6-9]00)/i;
    const italic = /font-style\s*:\s*italic/i;
    const strike = /text-decoration\s*:\s*line-through/i;
    service.addRule('bbcodeEmphasis', {
        filter: node => node.nodeName === 'SPAN' && [bold, italic, strike].some(style => style.test(node.getAttribute('style') ?? '')),
        replacement: (content, node) => {
            const style = (node as HTMLElement).getAttribute('style') ?? '';
            const open = `${strike.test(style) ? '~~' : ''}${bold.test(style) ? '**' : ''}${italic.test(style) ? '*' : ''}`;
            return content.trim() ? `${open}${content}${[...open].reverse().join('')}` : content;
        },
    });
    service.remove((config?.removeElements ?? ['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe']) as any);
    return service;
}

const BLOCK_TAG = /\n*(<\/?(?:blockquote|p|pre|ul|ol|li|table|thead|tbody|tr|td|th|h[1-6])\b[^>]*>)\n*/g;

/** A post attachment, keyed by the id that `[attach]id[/attach]` refers to. */
export interface Attachment { url: string; name?: string; image?: boolean }

/** Forum-specific tags @bbob has no rule for, rewritten into ones it has. */
function expandForumTags(body: string, attachments?: ReadonlyMap<string, Attachment>): string {
    return body
        .replace(/\[attach\]\s*(\d+)\s*\[\/attach\]/gi, (_, id: string) => {
            const file = attachments?.get(id);
            if (!file) return `[i]attachment ${id}[/i]`;
            return file.image ? `[img]${file.url}[/img]` : `[url=${file.url}]${file.name?.replace(/[[\]]/g, '') || `attachment ${id}`}[/url]`;
        })
        .replace(/\[email\]([^\[\]\s]+)\[\/email\]/gi, '[url=mailto:$1]$1[/url]')
        .replace(/\[email=([^\]\s]+)\]([\s\S]*?)\[\/email\]/gi, '[url=mailto:$1]$2[/url]');
}

/**
 * BBCode line breaks are content, unlike HTML whitespace. Keep them as <br> in
 * text, drop the ones that only separate block tags, and fence [code] blocks.
 */
function bbcodeToHtml(body: string, attachments?: ReadonlyMap<string, Attachment>): string {
    const html = bbob(expandForumTags(body.replace(/\r\n?/g, '\n'), attachments), presetHTML5());
    return html.split(/(<pre>[\s\S]*?<\/pre>)/).map(part => part.startsWith('<pre>')
        ? part.replace(/^<pre>([\s\S]*)<\/pre>$/, '<pre><code>$1</code></pre>')
        : part.replace(BLOCK_TAG, '$1').replace(/\n/g, '<br>')).join('');
}

export function bodyToMarkdown(body: string, format: string, attachments?: ReadonlyMap<string, Attachment>): string {
    if (format === 'markdown') return body;
    const html = format === 'bbcode' ? bbcodeToHtml(body, attachments) : body;
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

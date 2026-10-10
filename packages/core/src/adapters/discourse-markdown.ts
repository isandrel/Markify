/**
 * Discourse /raw/ output is the posts' source, which still carries Discourse-only
 * syntax that renders nowhere else. Turns it into portable Markdown; fenced and
 * inline code is left exactly as written.
 */

/** Fenced blocks (with the newline before them) and inline code spans. */
const CODE = /(^|\n)(```|~~~)[^\n]*\n[\s\S]*?\n\2[ \t]*(?=\n|$)|`[^`\n]+`/g;

/**
 * Applies `transform` with code hidden behind placeholders, so syntax that wraps
 * code ([details] around a fence) still pairs up and code itself is never changed.
 * A fence that ends up inside a quote gets the quote marker on every line.
 */
function outsideCode(text: string, transform: (part: string) => string): string {
    const codes: string[] = [];
    // Private-use characters do not occur in forum text.
    const hidden = text.replace(CODE, (match, lead: string | undefined) => `${lead ?? ''}\uE000${codes.push(match.slice((lead ?? '').length)) - 1}\uE001`);
    return transform(hidden).replace(/\uE000(\d+)\uE001/g, (_, index: string, offset: number, whole: string) => {
        const code = codes[Number(index)];
        const prefix = whole.slice(whole.lastIndexOf('\n', offset - 1) + 1, offset);
        return /^(?:> ?)+$/.test(prefix) ? code.replace(/\n/g, `\n${prefix}`) : code;
    });
}

const quoteLines = (body: string) => body.trim().split('\n').map(line => (line ? `> ${line}` : '>')).join('\n');

/** [quote="name, post:3, topic:123, full:true"]…[/quote] → a blockquote naming and linking its source. */
function quoteHeader(attributes: string | undefined, baseUrl: string): string {
    if (!attributes) return '';
    const [name, ...rest] = attributes.split(',').map(part => part.trim());
    const fields = Object.fromEntries(rest.map(part => part.split(':').map(value => value.trim())).filter(pair => pair.length === 2));
    const link = fields.topic && /^\d+$/.test(fields.topic)
        ? ` [#${fields.post ?? 1}](${baseUrl}/t/${fields.topic}${fields.post && /^\d+$/.test(fields.post) ? `/${fields.post}` : ''})`
        : '';
    return name ? `**${name}**${link}:\n\n` : '';
}

export function discourseToMarkdown(raw: string, baseUrl: string): string {
    return outsideCode(raw, text => {
        let out = text
            // upload://<sha>.<ext> only resolves inside Discourse; /uploads/short-url/ redirects to the file.
            .replace(/\]\(upload:\/\/([A-Za-z0-9]+(?:\.[A-Za-z0-9]+)?)\)/g, `](${baseUrl}/uploads/short-url/$1)`)
            // [name.pdf|attachment](upload://…): the marker is Discourse's, not part of the name.
            .replace(/\[([^\]\n|]+)\|attachment\]\(/g, '[$1](');
        // Innermost quote first, so nested quotes nest.
        const quote = /\[quote(?:="([^"\]]*)")?\]\s*\n?((?:(?!\[quote[=\]])[\s\S])*?)\n?\s*\[\/quote\]/i;
        for (let match = out.match(quote); match; match = out.match(quote)) {
            const block = `\n${quoteLines(quoteHeader(match[1], baseUrl) + match[2])}\n`;
            out = out.replace(match[0], () => block);
        }
        return out
            .replace(/\[details(?:=(?:"([^"\]]*)"|([^\]]*)))?\]\s*\n?([\s\S]*?)\n?\s*\[\/details\]/gi,
                (_, quoted: string | undefined, bare: string | undefined, body: string) => `<details>\n<summary>${(quoted ?? bare ?? 'Details').trim() || 'Details'}</summary>\n\n${body.trim()}\n\n</details>`)
            // A block spoiler hides behind a toggle; an inline one is just its text.
            .replace(/\[spoiler\]\s*\n([\s\S]*?)\n\s*\[\/spoiler\]/gi, (_, body: string) => `<details>\n<summary>Spoiler</summary>\n\n${body.trim()}\n\n</details>`)
            .replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, '$1')
            // Poll options are already a Markdown list.
            .replace(/\[poll\b[^\]]*\]\s*\n?/gi, '**Poll:**\n\n')
            .replace(/\n?\s*\[\/poll\]/gi, '')
            .replace(/\n{3,}/g, '\n\n');
    });
}

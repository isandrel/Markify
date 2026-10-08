/** A generic article site plus a Jina Reader stand-in, for non-forum conversions. */
import { html, json, page, text, type FakeResponse, type FakeSite } from '../types';

export const BLOG = 'https://blog.example.com';
export const JINA = 'https://r.jina.ai';

export const blogArticle = html('A Field Guide to Markdown', `<nav>Site navigation</nav>
<article>
  <h1>A Field Guide to Markdown</h1>
  <p>Markdown is <strong>plain text</strong> with <em>light</em> syntax and <del>no</del> fuss.</p>
  <h2>Code</h2>
  <pre><code>const answer = 42;</code></pre>
  <ul><li>First item</li><li>Second item</li></ul>
  <p>Read <a href="https://example.org/spec">the spec</a>.</p>
  <script>window.leaked = 'script content';</script>
</article>
<footer>Footer links</footer>`, '<meta name="author" content="Grace Hopper"><meta name="description" content="How to write Markdown"><meta name="keywords" content="markdown, writing">');

function respond(url: URL): FakeResponse {
    if (url.href.startsWith(`${JINA}/`)) {
        // Jina Reader: `/jina-fails` exercises the DOM fallback.
        const target = url.href.slice(`${JINA}/`.length);
        if (target.includes('/jina-fails')) return text('unavailable', 503);
        return json({
            code: 200,
            data: { title: 'Reader Title', url: target, description: 'Reader description', content: `# Reader Title\n\nReader rendered **markdown** for ${target}` },
        });
    }
    if (url.pathname === '/post' || url.pathname === '/jina-fails') return page(blogArticle);
    return page(html('Not found', '<h1>404</h1>'), 404);
}

export const genericWeb: FakeSite = { origins: [BLOG, `${JINA}/`], respond };

# Markify

Convert web pages to Obsidian-formatted Markdown with YAML frontmatter using a Tampermonkey userscript.

## Features

- 📥 **Dual Action Buttons** - Separate Download and Copy buttons for convenience
- 🎯 **Draggable UI** - Move buttons anywhere on screen (position auto-saved)
- 📝 **Configurable Templates** - Customize markdown output with placeholders
- 🎨 **Site Adapters** - Smart content extraction for different websites
- ⚙️ **Settings page** - Per-site or all-site file names, timeout, templates, on/off, AI console token, config import/export (Tampermonkey menu → Settings)
- 📜 **Download history with update checks** - Each download keeps the thread's reply count and last activity. Thread pages, Discourse listings and the history page mark threads that changed since; check, re-download or remove them
- 🔧 **Modular Config** - Organized TOML files in `config/` directory
- 🤖 **AI Console API** - Opt-in, token-gated `window.markify` so an AI agent driving your logged-in browser can export threads

## Installation

### Prerequisites

- [Bun](https://bun.sh/) - Fast JavaScript runtime
- [Tampermonkey](https://www.tampermonkey.net/) - Browser extension

### Build from Source

```bash
# Clone repository
git clone https://github.com/isandrel/Markify.git
cd Markify

# Install dependencies
bun install

# Validate, test, and build userscript
bun run validate

# Versioned output
open packages/userscript/dist/markify-v0.0.4.user.js

# Stage the stable update artifact at dist/markify.user.js
bun run stage:release -- 0.0.4
```

### Install in Tampermonkey

1. Copy contents of `packages/userscript/dist/markify-v0.0.4.user.js` (or the staged `dist/markify.user.js`)
2. Open Tampermonkey Dashboard → Create new script
3. Paste and save

## Usage

1. **Visit any webpage** matching your configured patterns
2. **Drag the buttons** to your preferred position (25% from top by default)
3. Click **📥 Download** to save as `.md` file
4. Click **📋 Copy** to copy to clipboard

## For AI agents: `window.markify`

Sites like 1Point3Acres hide content behind login and bot protection, which a local AI tool can't get past. An agent that drives **your own browser** can. Tools that do this include Chrome DevTools MCP (`evaluate_script`), Claude in Chrome, and Playwright attached to your profile. Markify then gives the agent Markdown directly, so it doesn't have to scrape the page.

It is **off by default**, and each site has its own **secret token**:

1. On the site, open the Tampermonkey menu and choose **🤖 AI Console API: copy token (turns it on for this site)**. The token goes to your clipboard and is never shown in the page.
2. Give the token to your agent. The agent runs:

```js
const m = await markify.connect('mfy_…');   // markify.help() lists the commands
await m.status();                            // site, page kind, thread id
await m.export();                            // the open thread → { ok, markdown, title, filename, metadata }
await m.export(1184303);                     // another thread on this site, by id or URL
const { items } = await m.list();            // rows of the open listing page, with `downloaded`
await m.exportMany(items.slice(0, 5).map(i => i.id), { zip: true });
await m.history();
```

Limits:

- Exports return Markdown. A file is saved, and recorded in history, only with `{ download: true }` or `{ zip: true }`.
- It only reaches threads on the current site.
- Exports run one at a time, at most 50 per batch, with the usual batch delays.
- Failures come back as `{ ok: false, error: { code, message } }`. A call without a valid token is rejected with `DISABLED`, `UNAUTHORIZED`, or `LOCKED`. Five wrong tokens lock the API until you copy the token from the menu again or reload the page.
- **🤖 AI Console API: turn off and revoke token** stops it at once, including for agents that already connected. Turning it on again issues a new token.

Page scripts (including ads) can see `window.markify` once it is on. They can't use it without the token, and they can't replace it. Only give the token to agents you trust, and only on sites you use them on. Where the browser supports [WebMCP](https://github.com/webmachinelearning/webmcp), the same commands are also registered as `markify_*` tools, and each one takes the token as an input.

### From Claude Desktop, Claude Code and other MCP clients

Markify's MCP server (`packages/mcp`) can use your Chrome the same way. Its `browser_*` tools connect to Chrome over the DevTools Protocol and call `window.markify` in a tab of the site. The tokens live in the server's settings, so the AI never sees them.

| Tool | What it does |
| --- | --- |
| `browser_status` | Open tabs on Markify sites, and whether the API answers there |
| `browser_export` | One thread (URL, or id plus `site`) as Markdown |
| `browser_list` | Threads on the open listing tab |
| `browser_export_many` | Up to 50 threads, optionally downloaded as a ZIP |

Setup:

1. **Let the server reach Chrome.** Either:
   - turn on remote debugging at `chrome://inspect/#remote-debugging`; Chrome asks you to approve each connection; or
   - start a separate Chrome profile with `--remote-debugging-port=9222 --user-data-dir=<folder>`, and log in to the sites there.

   While remote debugging is on, any program on your computer can control that browser. Turn it off when you're done.
2. **Copy each site's token** with **🤖 AI Console API: copy token** in the Tampermonkey menu.
3. **Add the server** to your client, with the tokens in its environment:

   ```json
   {
     "mcpServers": {
       "markify": {
         "command": "bun",
         "args": ["run", "/path/to/Markify/packages/mcp/src/index.ts"],
         "env": { "MARKIFY_TOKENS": "1point3acres=mfy_…,linuxdo=mfy_…" }
       }
     }
   }
   ```

   For Claude Code: `claude mcp add markify --env MARKIFY_TOKENS=1point3acres=mfy_… -- bun run /path/to/Markify/packages/mcp/src/index.ts`.

The server finds Chrome by itself. To point it somewhere else, set `MARKIFY_BROWSER` to `http://127.0.0.1:<port>` or a `ws://` DevTools URL. Keep a tab of the site open; listings need a listing tab. When a tool fails, its message starts with a code (`NO_BROWSER`, `NO_TAB`, `NO_TOKEN`, `DISABLED`, `UNAUTHORIZED`) and says what to do.

## Configuration

All configuration is in the `config/` directory:

```
config/
├── package.toml      # Package metadata
├── userscript.toml   # Global GM permissions
├── templates.toml    # Markdown templates
├── ui.toml           # UI settings & conversion options
└── adapters/         # Validated site profiles: routes, layouts, APIs, templates
```

Site profiles are the extension point. A profile declares a stable site ID, activation origins, routes, ordered DOM layout variants, API engine, field mappings, timing limits, and filename templates. The shared lifecycle, batch manager, transport, and history services do not contain site selectors or hostnames. Run `bun run validate` after changing a profile; invalid routes, selectors, endpoints, aliases, and placeholders fail before a userscript is built.

The userscript menu includes configuration export/import and reset for the current site. Imported overrides are schema-validated and applied on the next page load; in-flight jobs keep their immutable configuration snapshot.

### Templates

Edit `config/templates.toml` or use **⚙️ Settings** menu:

```toml
[document]
enabled = true
template = """{frontmatter}

{content}
"""

[comment]
enabled = true
template = """
## Comment {index} - {author}
**Posted:** {date}

{content}
"""
```

**Available placeholders:**
- Document: `{frontmatter}`, `{content}`, `{title}`, `{url}`, `{date}`, `{author}`
- Comment: `{index}`, `{author}`, `{date}`, `{content}`

### URL Patterns

Edit `config/userscript.toml`:

```toml
match = [
    "https://www.uscardforum.com/t/*/*",
    "https://*.medium.com/*",
    "https://*.substack.com/*"
]
```

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Auto-refresh development workflow
- Config file structure
- Creating custom adapters
- Build process

## Project Structure

```
.
├── config/           # Configuration files
│   ├── package.toml
│   ├── userscript.toml
│   ├── templates.toml
│   ├── ui.toml
│   └── sites.toml
├── src/
│   ├── adapters/     # Site-specific extractors
│   ├── main.ts       # Entry point
│   ├── settings.ts   # Settings UI
│   ├── templates.ts  # Template system
│   ├── ui.ts         # UI utilities
│   └── utils.ts      # Helper functions
├── dist/             # Built userscript
└── vite.config.ts    # Build configuration
```

## Built-in Site Adapters

- Medium
- Substack
- Wikipedia
- GitHub
- Reddit
- Dev.to
- US Card Forum and LINUX DO (Discourse):
  - every page of a topic;
  - author, date, topic tags, views and likes;
  - images and attachments with real links;
  - quotes, `[details]`, spoilers and polls converted to plain Markdown
- 1Point3Acres (thread API with nested replies)
- Default fallback for other sites

## License

MIT License - see [LICENSE](LICENSE) file

## Contributing

Issues and pull requests welcome!

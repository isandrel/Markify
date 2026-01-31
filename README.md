# Markify

Convert web pages to Obsidian-formatted Markdown with YAML frontmatter using a Tampermonkey userscript.

## Features

- 📥 **Dual Action Buttons** - Separate Download and Copy buttons for convenience
- 🎯 **Draggable UI** - Move buttons anywhere on screen (position auto-saved)
- 📝 **Configurable Templates** - Customize markdown output with placeholders
- 🎨 **Site Adapters** - Smart content extraction for different websites
- ⚙️ **Settings UI** - Configure templates and preferences via Tampermonkey menu
- 🔧 **Modular Config** - Organized TOML files in `config/` directory

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

# Build userscript
bun run build

# Output: dist/markify.user.js
open dist/markify.user.js
```

### Install in Tampermonkey

1. Copy contents of `dist/markify.user.js`
2. Open Tampermonkey Dashboard → Create new script
3. Paste and save

## Usage

1. **Visit any webpage** matching your configured patterns
2. **Drag the buttons** to your preferred position (25% from top by default)
3. Click **📥 Download** to save as `.md` file
4. Click **📋 Copy** to copy to clipboard

## Configuration

All configuration is in the `config/` directory:

```
config/
├── package.toml      # Package metadata
├── userscript.toml   # GM permissions & URL patterns  
├── templates.toml    # Markdown templates
├── ui.toml           # UI settings & conversion options
└── sites.toml        # Custom site adapters
```

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
- US Card Forum (with pagination)
- Default fallback for other sites

## License

MIT License - see [LICENSE](LICENSE) file

## Contributing

Issues and pull requests welcome!
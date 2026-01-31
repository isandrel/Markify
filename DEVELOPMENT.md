# 🔄 Auto-Refresh Development Workflow

Markify uses **vite-plugin-monkey** which provides **automatic hot-reloading** for userscript development!

## Setup

### 1. Start Dev Server
```bash
bun run dev
```

This starts Vite in dev mode at `http://localhost:5173`

### 2. Install from Dev Server

In Tampermonkey/Violentmonkey, install the script from:
```
http://localhost:5173/markify.user.js
```

### 3. Auto-Reload Magic! ✨

Now whenever you save any file (`src/main.ts`, `src/adapters.ts`, etc.), the script automatically:
1. **Rebuilds** (Vite compiles in ~100-200ms)
2. **Reloads** in your browser
3. **Re-runs** on the current page

**No manual refresh needed!** It's like HMR for userscripts.

## Example Workflow

```bash
# Terminal 1: Start dev server
cd /Users/neo/Documents/Git/Markify
bun run dev

# Terminal 2: Edit code
# Open src/main.ts in your editor
# Make changes and save
# → Script auto-reloads in browser immediately!
```

## Production Build

When ready to release:

```bash
bun run build
# Creates dist/markify.user.js (production-optimized)
```

---

## TOML Configuration

As of now, `vite.config.ts` loads all metadata from `markify.toml`:

### markify.toml (Single Source of Truth)
```toml
[package]
name = "Markify"
version = "0.0.1"
description = "Convert web pages to Obsidian-formatted Markdown"
author = "isandrel"
repository = "https://github.com/isandrel/Markify"

[userscript]
match = ["*://*/*"]
icon = "https://..."

[userscript.grant]
permissions = [
  "GM.getValue",
  "GM.setValue",
  # ... etc
]
```

### vite.config.ts (Loads from TOML)
```typescript
import { readFileSync } from 'fs';
import { parse } from '@iarna/toml';

const config = parse(readFileSync('markify.toml', 'utf-8'));

export default defineConfig({
  plugins: [
    monkey({
      userscript: {
        name: config.package.name,
        version: config.package.version,
        // All metadata from TOML!
      }
    })
  ]
});
```

**Benefits**:
- ✅ Single source of truth (no duplicate config)
- ✅ Easy version bumps (just edit TOML)
- ✅ User-friendly format (vs JSON/TS)
- ✅ Can add custom site configs without touching code

---

## Tips

### View Console Logs
Open browser DevTools to see:
```
[Markify] Using adapter: Medium
[Markify] Ready! Click the button to download...
```

### Test on Different Sites
1. Navigate to Medium, Reddit, GitHub, etc.
2. Click the Markify button
3. Check the console to see which adapter was used

### Debug Adapters
```typescript
// In src/adapters.ts
export const myAdapter: SiteAdapter = {
  name: 'My Site',
  extractMetadata: (doc) => {
    console.log('My adapter running!');
    return { /* ... */ };
  },
};
```

Save → auto-reload → see logs!

---

## Common Issues

### "Script not updating?"
1. Check the dev server is still running
2. Refresh the Tampermonkey dashboard
3. Re-install from `http://localhost:5173/markify.user.js`

### "TOML parse error?"
Check `markify.toml` syntax:
- Use `=` not `:`
- Strings need quotes: `"value"`
- Arrays: `["item1", "item2"]`

---

## Next Steps

Try editing:
- Add a new site adapter in `src/adapters.ts`
- Customize button style in `src/main.ts`
- Add frontmatter fields in `src/utils.ts`

Every save triggers instant reload! 🚀

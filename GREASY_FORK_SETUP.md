# Greasy Fork Setup Guide

## Automatic Sync from GitHub

Greasy Fork can automatically update your userscript when you create GitHub releases.

### 1. Publish to Greasy Fork (First Time)

1. Go to [Greasy Fork](https://greasyfork.org/)
2. Sign in / Create account
3. Click **Import from GitHub**
4. Paste this URL:
   ```
   https://github.com/isandrel/Markify/releases/latest/download/markify.user.js
   ```
5. Complete script details
6. Publish

### 2. Auto-Update Configuration

Greasy Fork will check for updates from the GitHub release URL:
- **Check frequency**: Once per day (or via webhook)
- **URL pattern**: `https://github.com/USER/REPO/releases/latest/download/script.user.js`

### 3. Create Releases via Tags

To publish a new version:

```bash
# Update version in config/package.toml
# Then create and push a git tag

git tag v0.0.2
git push origin v0.0.2
```

This triggers:
1. GitHub Actions builds the script
2. Creates a GitHub release with `dist/markify.user.js`
3. Greasy Fork syncs from the release URL

### 4. Optional: Webhook Setup

For instant updates (instead of daily checks):

1. Greasy Fork → Script Settings → **Webhook**
2. Copy the webhook URL
3. GitHub → Settings → Webhooks → **Add webhook**
4. Paste Greasy Fork webhook URL
5. Select **Just the push event**
6. Save

Now Greasy Fork updates immediately on push!

---

## Version Workflow

```bash
# 1. Make changes
git add .
git commit -m "feat: new feature"

# 2. Update version in config/package.toml
# Change: version = "0.0.2"

# 3. Create tag
git tag v0.0.2
git push origin main
git push origin v0.0.2

# 4. GitHub Actions automatically:
#    - Builds script
#    - Creates release
#    - Greasy Fork syncs (within 24h or instant via webhook)
```

## Release URL Pattern

```
https://github.com/isandrel/Markify/releases/download/v0.0.2/markify.user.js
```

Greasy Fork uses this URL to check for updates.

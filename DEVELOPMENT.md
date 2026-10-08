# Markify development

Markify is a Bun/Nx workspace. The browser package is a Tampermonkey userscript; core contains the platform-independent route, profile, protocol, and Markdown code.

## Local workflow

```bash
bun install
bun run test
bun run typecheck
bun run build
```

The installable versioned file is written to `packages/userscript/dist/markify-v<version>.user.js`. The release staging command validates the version and copies it to `dist/markify.user.js` for the stable update URL:

```bash
bun run stage:release -- 0.0.4
```

For a local Tampermonkey development script, enable **Allow access to file URLs** and use a stub whose `@require` points to the absolute versioned file, for example:

```text
file:///Users/neo/Documents/Git/Markify/packages/userscript/dist/markify-v0.0.4.user.js
```

Rebuild after source or profile changes, then reload the target page. The `@match` and `@connect` metadata are generated from validated profiles during the userscript build.

## Configuration and extension

Each `config/adapters/*.toml` file is a validated profile. It declares:

- stable identity and aliases used by history;
- HTTPS origins, activation matches, and route patterns;
- named listing layouts with feed roots, row/link/title selectors, and exclusions;
- a typed protocol engine (`forum-json` or `discourse-raw`);
- endpoint templates, field paths, response checks, pagination, and delays;
- runtime polling/debounce/timeout values and export filename templates.

The profile schema is implemented in `packages/core/src/config/schema.ts`. Disk loading is explicit through `packages/core/src/config/disk.ts`; browser builds receive the validated registry through Vite. Do not add site-specific branches to the batch manager, navigation controller, transport, or history module.

To add a site using an existing protocol, add one profile and sanitized route/layout/API fixtures. To add a new protocol, add a typed engine to `packages/core/src/adapters/engines.ts` and register it once. A synthetic third-site profile is covered by the core extension test.

User overrides are limited to schema-approved enablement, runtime bounds, and templates. Their precedence is bundled defaults, site profile, global override, site override, then invocation override. Legacy template state is migrated once to `markify_overrides_v1` with a backup at `markify_templates_backup_v1`; a fresh install does not invent a legacy override.

## Tests and browser smoke checks

Core tests cover profile validation/migration, route ambiguity, synthetic profile conversion, API failures, comment pagination, Markdown conversion, and filename rendering. Userscript tests cover GM transport cancellation, route lifecycle, exact current-layout extraction, selection cleanup, partial batches, cancellation, and history aliases.

End-to-end tests (`packages/e2e`, Playwright) exercise the shipped artifacts offline against fixture sites, one Playwright project per site. 1Point3Acres has the deepest coverage: every thread route, BBCode, comment pagination, API failure modes, cancellation, listings, batch ZIPs and SPA navigation. The CLI and MCP server run as real subprocesses. See `packages/e2e/README.md` for the harness and how to add a site.

```bash
bun run test:e2e        # build, then all projects
bun run test:e2e:1p3a   # build, then only 1Point3Acres
```

For live checks, use a logged-in browser and verify:

1. `/home/discover/38` gets one panel and one checkbox per rendered feed row, with sidebar links excluded.
2. Pagination replaces rows, resets selection, and keeps one panel.
3. `/home/thread/<id>` shows the single toolbar and Copy/Download produce readable Markdown.
4. A selected batch produces an observed ZIP containing only successful files; failures remain retryable and are absent from history.

The live API may expose nested replies differently from the advertised reply count. The JSON engine stops only at a verified terminal page and fails on repeated pages or page-limit exhaustion; do not claim complete comment coverage without checking the captured page count.

## Release

The tag workflow runs the full validation/build chain, checks every package version against `config/package.toml`, stages the versioned and stable artifacts, and publishes the versioned userscript. Publishing, tagging, and pushing are separate release actions; local development only builds and stages files.

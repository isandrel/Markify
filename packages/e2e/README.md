# Markify end-to-end tests

Playwright tests for the shipped artifacts, run fully offline:

- **userscript**: the built `packages/userscript/dist/markify-v<version>.user.js` runs in Chromium. `support/harness.ts` acts as the userscript manager. Its `@match` decides where the script runs, its `@require` list loads first, and the test process backs `GM.*` (storage, `xmlHttpRequest`, notifications, clipboard, menu commands).
- **tools**: the CLI and MCP server run as real `bun` subprocesses. `support/offline-fetch.ts` is preloaded so `fetch` hits the fixtures.

Every remote host is replaced by a fixture module in `fixtures/sites/`. Requests to any other host fail the test.

```bash
bun run test:e2e        # from the repo root: build, then every project
bun run test:e2e:1p3a   # build, then only the 1Point3Acres project
cd packages/e2e && ./node_modules/.bin/playwright test --project=1point3acres -g "batch"
```

Use the local `./node_modules/.bin/playwright`, not a global `npx playwright`. Two Playwright copies break `test.describe`.

## Projects

| Project | Folder | Covers |
| --- | --- | --- |
| `1point3acres` | `tests/1point3acres/` | Thread export on every route, BBCode, comment pagination, API failure modes, cancellation, discover/forum/tag listings, batch ZIPs, SPA navigation, history |
| `uscardforum` | `tests/uscardforum/` | Thread export and category/search batch (smoke level) |
| `userscript` | `tests/userscript/` | Site-independent behaviour: metadata, toolbar, drag, menus, settings, config import/export/migration |
| `tools` | `tests/tools/` | CLI subcommands and MCP tools |

## Adding a site

A site on an existing protocol (`forum-json` or `discourse-raw`) needs no harness changes:

1. Add the profile in `config/adapters/<site>.toml`, as described in `DEVELOPMENT.md`.
2. Add `fixtures/sites/<site>.ts`. It exports a `FakeSite` (`origins` plus `respond(url)`) serving the pages, listings and API responses the profile uses. Start from `uscardforum.ts` for a small example, or `1point3acres.ts` for SPA navigation and failure modes.
3. Register it in `fixtures/index.ts` (`sites` array) and re-export its constants.
4. Add `tests/<site>/*.spec.ts` using `test`/`expect` from `support/harness`, and a project entry in `playwright.config.ts`.

Harness helpers available to every site:

- `markify.open(url)` opens a page and waits for the userscript to start.
- `markify.download(fn)` returns the file name and text. `markify.downloadZip(fn)` returns the archive name and unzipped files.
- `markify.store` holds GM storage (seed it before `open`). `markify.notifications` and `markify.clipboard` record GM output. `markify.requests` and `markify.apiRequests(prefix)` record traffic, including `via: 'gm'` and `anonymous`.
- `markify.intercept(url, handler)` replaces a response for one test, and `'hang'` never answers. `markify.hold(url)` pauses a request until `release()`. `markify.abortedRequests` lists cancelled GM requests.
- `markify.runMenu(label)` invokes a registered menu command.

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
| `1point3acres` | `tests/1point3acres/` | Thread export on every route, BBCode, nested replies, comment pagination, API failure modes, cancellation, discover/forum/tag listings, batch ZIPs, SPA navigation, history |
| `uscardforum` | `tests/uscardforum/` | The shared Discourse suite (`support/discourse-suite.ts`) for US Card Forum |
| `linuxdo` | `tests/linuxdo/` | The same Discourse suite for LINUX DO |
| `userscript` | `tests/userscript/` | Site-independent behaviour: metadata, toolbar, drag, menus, settings, config import/export/migration, and the token-gated `window.markify` console API |
| `tools` | `tests/tools/` | CLI subcommands and MCP tools |
| `live-dryrun` | `tests/live/` | The real-site specs run against the fixtures, which keeps them correct in every run |
| `live` | `tests/live/` | The same specs against the real sites, logged out (only when `MARKIFY_E2E_LIVE=1`) |

The Discourse suite covers raw-page joining, the clean topic title (Discourse page titles are "Topic - Category - Site"), slugless and post-number URLs, Copy, 403/404/429/500 failures, category/latest/tag/search batches, infinite-scroll rows, and history markers.

## Real-site checks

`.github/workflows/live-e2e.yml` runs the `live` project daily and on pushes or PRs that touch site profiles or site code. It uses public content only.

- **1Point3Acres:**
  - the thread and comments API against the profile's field mapping;
  - real threads converted end to end by the CLI, where every reply must be either exported or noted as missing (nested replies behind login);
  - in the browser: discover feed, single and batch export, the legacy BBS URL and pagination.
- **US Card Forum, LINUX DO:**
  - `/latest.json` and the `/raw/` page contract;
  - a real topic converted by the CLI;
  - in the browser: the latest list and a topic export.

Data-centre IPs (GitHub-hosted runners, cloud sandboxes) get bot-protection pages ("请稍候…" / "Just a moment…", HTTP 403) from www.1point3acres.com, and from **every** URL of both Discourse sites. 1Point3Acres' API still answers, so its API checks run. Everything that's challenged is **skipped** with that reason, never bypassed. To run it all, register a runner on a network the sites accept (for example your own machine as a [self-hosted runner](https://docs.github.com/actions/hosting-your-own-runners)) and set these repository variables:

- `LIVE_RUNNER`: the runner label, for example `self-hosted`. On such a runner a blocked page fails instead of skipping.
- `LIVE_THREAD_IDS` (optional): comma-separated public 1Point3Acres thread ids, used when the group listing API is unavailable. The default is `1184303`.

Results:

- A failing scheduled or `main` run opens a `live-e2e` issue, which is commented on only when the failures change. The next passing run closes it.
- The run summary lists skipped checks and notes (e.g. replies behind login).
- The `live-e2e-report` artifact holds traces plus page, API and export samples, so a site change can be turned into an updated profile and fixture.
- To run locally (needs internet): `bun run --filter @markify/e2e test:e2e:live`. Add `MARKIFY_E2E_BLOCKED=fail` to treat blocked pages as failures.

## Adding a site

**Another Discourse forum** needs no new test code:

1. Add `config/adapters/<site>.toml`, copied from `linuxdo.toml`, with the new origin, title cleanup and tags.
2. Add `fixtures/sites/<site>.ts` with one `discourseSite({...})` call describing a few topics, a category, a tag, the latest list and a search, and register it in `fixtures/index.ts`.
3. Add `tests/<site>/<site>.spec.ts` with one line: `discourseSuite({ id, spec, tags })`. Then add a project in `playwright.config.ts` and an entry in `tests/live/discourse.spec.ts`.

**A site on another protocol** (`forum-json`, or a new engine) also needs no harness changes:

1. Add the profile in `config/adapters/<site>.toml`, as described in `DEVELOPMENT.md`.
2. Add `fixtures/sites/<site>.ts`. It exports a `FakeSite` (`origins` plus `respond(url)`) serving the pages, listings and API responses the profile uses. `1point3acres.ts` is the example for SPA navigation and failure modes.
3. Register it in `fixtures/index.ts` (`sites` array) and re-export its constants.
4. Add `tests/<site>/*.spec.ts` using `test`/`expect` from `support/harness`, and a project entry in `playwright.config.ts`.

Harness helpers available to every site:

- `markify.open(url)` opens a page and waits for the userscript to start.
- `markify.download(fn)` returns the file name and text. `markify.downloadZip(fn)` returns the archive name and unzipped files.
- `markify.store` holds GM storage (seed it before `open`). `markify.notifications` and `markify.clipboard` record GM output. `markify.requests` and `markify.apiRequests(prefix)` record traffic, including `via: 'gm'` and `anonymous`.
- `markify.intercept(url, handler)` replaces a response for one test, and `'hang'` never answers. `markify.hold(url)` pauses a request until `release()`. `markify.abortedRequests` lists cancelled GM requests.
- `markify.runMenu(label)` invokes a registered menu command.
- In live specs, `markify.get(url)` fetches through the same fixture/live switch. `isChallenge()` and `skipBlocked()` apply the shared bot-protection policy.

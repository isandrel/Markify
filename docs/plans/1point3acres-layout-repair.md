# 1Point3Acres current-layout repair: detailed implementation plan

Status: implementation completed on branch `codex/configurable-forum-layout-repair`; no commit, tag, push, or release has been made.

Baseline: `a30ee37`, inspected 2026-09-11 (America/Los_Angeles).
Target: [Discover / 求职](https://www.1point3acres.com/home/discover/38).

## 1. Outcome and scope

Restore single-thread and current-page batch export on the current 1Point3Acres UI. Direct entry, delayed rendering, pagination, and client-side navigation must all work. A successful export must contain the selected thread's content and correct metadata; failed exports must remain retryable and must not appear in download history.

The implementation will include the shared batch-manager fixes needed to support this behavior, repair the US Card Forum integration affected by that manager, establish working type checks, and prepare an installable userscript. It will not add automatic multi-page crawling, cross-page selection queues, a new scraping service, access-gate bypasses, or a general UI redesign.

Selected behavior:

- Batch selection applies to the current rendered feed. New appended rows do not automatically become selected. Page/filter transitions clear selection.
- ZIP downloads continue across individual item failures and include only complete successful items. Failed items remain selected when still on the same page.
- If the user navigates during an active batch, the old manager stops scheduling further work and discards late responses. No automatic download or history write is triggered after that manager is destroyed.
- The single Download/Copy action captures its starting URL and metadata; navigation cannot relabel the result as a different thread.
- Keep the configured legacy BBS source URL in exported documents for this repair. Input URLs can use either the current or legacy routes.
- Preserve current user settings and existing history. Use compatibility reads when normalizing history keys.

### Architecture requirements: configurable, extensible, maintainable

These are acceptance requirements for the repair, not optional follow-up work. The goal is for the next route or layout change to require an adapter-profile update and a fixture, while a new supported site reuses the same lifecycle and download code.

- **Configurable:** site identity, routes, ordered layout selectors, API mappings, transport choice, pagination limits, timing, filename templates, and supported user preferences have a documented configuration owner and validated defaults.
- **Extensible:** a site using an existing extraction/API protocol can be added with a profile and fixtures. A genuinely new protocol adds a typed engine implementation and one registry entry. Neither case requires changing the batch manager, navigation controller, or history implementation.
- **Maintainable:** core remains independent of browser globals; site profiles contain site-specific strings; shared modules own behavior; schemas, diagnostics, migration rules, and contract tests make failures visible.
- Keep operational settings configurable, while correctness rules remain invariants: exact host/row matching, deduplication, one active job, no false success/history, deterministic cleanup, and no implicit access-gate bypass.
- Implement only behavior used by 1Point3Acres and US Card Forum in this repair. Configuration cannot name an engine, pagination mode, or policy that has not been implemented and tested.

### Ownership and extension boundaries

| Layer | Responsibility | Must not contain |
| --- | --- | --- |
| `config/adapters/*.toml` | Stable site ID/aliases, hosts, activation patterns, routes, layout variants, endpoint/field mappings, site defaults | Executable JavaScript, credentials, arbitrary expressions |
| Core configuration | Parse, migrate, validate, resolve defaults/overrides, compile routes, report diagnostics | GM storage, window/document access, site-name conditionals |
| Core protocol engines | Fetch/validate/convert content using normalized config and injected transport | Browser cookies, DOM controls, hardcoded endpoint URLs |
| Browser adapter layer | Select configured layout, extract exact rows, resolve labels, provide browser-only capability hooks | ZIP creation, download-history writes, navigation ownership |
| Shared browser services | Lifecycle, transport implementations, selection, batch jobs, artifact download, history | 1Point3Acres/USCF selectors, route fragments, aliases, special-case names |
| Application entrypoints | Load resolved registry, inject platform services, initialize/tear down | Lists of `if (adapter.name === ...)` branches |
| Build/release | Validate config, compile registry/metadata, stage versioned artifacts | A second independent list of adapter URL rules |

### One resolved profile and registry

Use a generic route classifier under `packages/core/src/adapters/routes.ts`. Introduce a schema and normalization boundary under `packages/core/src/config/`; keep the current `config.ts` public exports as a compatibility facade during migration.

1. Assign stable IDs such as `1point3acres` and `uscardforum`; keep display names separate. Define legacy history/config names as aliases in their profiles.
2. Discover all profile files at build/runtime load time and validate them through the same schema. Produce normalized, immutable profiles, indexed by stable ID, plus a deterministic alias lookup.
3. For these two migrated sites, derive core URL matching and userscript capabilities from the resolved profiles. Remove their duplicated static `urlPatterns` arrays. Existing generic adapters can remain registered alongside them until separately migrated.
4. Derive userscript activation/connect metadata from the union of validated profile declarations and explicitly retained generic match rules. Activation patterns can be broader than thread routes for SPA entry; they are distinct fields with one owner, not duplicated hand-maintained lists.
5. Resolve an engine key through a small compiled engine registry. Start with the protocols already implemented: `forum-json` and `discourse-raw`. Browser extraction uses ordered DOM-layout profiles, with a typed hook only where a fixture proves the generic extractor is insufficient.
6. Reject unknown engine IDs, duplicate stable IDs/aliases, and invalid config before generating an installable artifact. Detect ambiguous route matches against the fixture corpus at build time and reject multiple matches at runtime; do not claim to prove arbitrary regexes disjoint. Browser startup isolates a corrupt optional profile and reports its ID/field path; it must not silently use another site's fallback.
7. Keep filesystem loading in the CLI/build boundary and browser loading in the compiled-config boundary. Both call the same pure normalizer/resolver. A browser path must not attempt `require('fs')` and use an exception as its initialization strategy.

### Configuration contract

The following is the target field contract. Exact serialized names should be finalized in T1 and then documented/generated from the schema. It replaces inconsistent ad hoc keys rather than creating another layer of competing defaults.

| Group | Configurable values | Validation and ownership |
| --- | --- | --- |
| Version/identity | `schema_version`, `site.id`, `site.name`, `site.aliases`, allowed origins | Supported version, unique stable IDs/aliases, explicit origins |
| Activation | Userscript match patterns and connect hosts | Build validates coverage of supported routes and permitted request origins |
| Routes | Route name, kind, anchored path pattern, ID capture, allowed origin, relevant query keys | Compile regex once; fixture coverage; ambiguity is an error |
| Layouts | Ordered named variants, supported route names, feed root, row selector, exclusions, link selector, title selector/attribute, optional empty/loading markers | Select the first verified matching layout; report its name; no cross-variant mixing |
| Labels/context | Configured DOM label sources with ID fallback; filename context fields | Full text/attribute extraction through a finite set of supported operations |
| Content engine | Engine ID, endpoint templates, request options, content encoding, response/field mappings | Discriminated schema per engine; validate required placeholders and data fields |
| Pagination | Supported mode, page/query keys, item path, ID path, page size, maximum pages, inter-page delay | Positive bounded values; mode must have tests; incomplete retrieval cannot become success |
| Access/error evidence | Explicit API status/field checks and optional verified page markers | No broad ambient-keyword heuristics; unsupported evidence produces an explicit unknown outcome |
| Runtime defaults | URL poll interval, mutation debounce, request timeout, retry limits for retryable GETs | Bounded settings; retry transient failures only; default retry count zero until enabled/tested |
| Export defaults | Document/frontmatter/comment templates, single/batch-item/archive filenames, formatting options | Allowed placeholder sets; escaping rules; no unresolved placeholders |
| User preferences | Enabled sites, supported template/format overrides, bounded timing overrides | Stored separately from bundled profile cache; only schema-approved paths are editable |

Use a single runtime schema as the source for TypeScript types and field documentation. A schema dependency belongs directly to core if core imports it; do not rely on MCP's transitive dependencies. Validate at build time, disk-config load, override import/save, and migration output. Compile CSS selectors against a DOM fixture/browser, since syntax-only config validation cannot prove a selector matches the intended feed.

API mappings support simple property paths such as `thread.subject` or `posts`, implemented by a small property-path reader. Do not add JSONPath, arbitrary expressions, embedded code, or a general-purpose configuration language. When a protocol needs more than this contract, add a named typed engine/hook with tests.

### Defaults, overrides, and migration

Resolve in this order, from lowest to highest priority: schema defaults → bundled global defaults → bundled site profile → explicit stored global user overrides → explicit stored per-site overrides → supported invocation overrides. Invocation overrides are useful for CLI/MCP; the userscript need not expose a new override UI for this repair.

- Merge typed objects by approved field; replace arrays atomically. Reject unknown keys and unsupported values. Define omission as inheritance; do not overload null/empty strings to mean undocumented resets.
- Normalize to one `ResolvedAdapterProfile` before use. Downstream code receives resolved values and does not add local `||` defaults or reopen GM storage mid-job.
- Freeze the resolved profile for the duration of a conversion/batch. Save/reload changes affect the next job and cannot alter endpoints, templates, or filenames halfway through a run.
- Give overrides their own versioned GM key. Treat `markify_templates` as legacy bundled/cache state unless a value is demonstrably a user customization. Startup must stop overwriting explicit user overrides.
- Migration must preserve the current effective filenames. The old manager prioritizes global templates over adapter templates; encode the equivalent initial resolved settings when moving to site-specific precedence instead of silently changing output names.
- Back up legacy stored configuration before migration, run migration idempotently, and write the new version only after validation. If the origin of a legacy custom value is uncertain, retain the backup and surface that uncertainty rather than discard it.
- Read legacy history aliases from profile data; store new records under stable IDs. Keep settings migration separate from history normalization.
- Ship documentation and an import/export/reset mechanism for supported override fields. Validate imported data before replacing settings, and make per-site reset remove that site's overrides so defaults are inherited again. An advanced selector/regex editor is not required.

### Diagnostics and extension workflow

Diagnostics should identify adapter ID, route/layout variant, config version, extraction count, request stage, and a stable error code. For configuration errors, include file/key path and expected type; for extraction, distinguish loading, configured empty state, and unsupported layout. Do not log credentials or full post bodies. Make resolved configuration inspectable with credentials omitted and clearly identify whether a value came from defaults, a profile, or an override.

To update a layout: add/update one ordered variant in its profile, add a minimal fixture, run profile/extraction tests, build, and perform live smoke. To add a site on an existing protocol: create one profile and fixtures; automatic profile discovery supplies registration and activation metadata. To add a new protocol: implement the typed engine contract, register it once, then follow the same profile/fixture workflow. Central UI and history code remain unchanged.

Maintainability acceptance tests:

- A synthetic third-site profile using an existing engine and DOM layout runs through extraction/export with no shared-service edits.
- Changing only a selector/route/filename in TOML changes runtime behavior and invalidates relevant build caches.
- Both migrated sites run with the same lifecycle, manager, transport interfaces, and history service; shared modules contain no site hostnames or route/selectors.
- Invalid regex, selector, engine ID, alias collision, unknown key, unsupported schema version, and bad template placeholders produce actionable diagnostics.
- Override precedence and idempotent migration preserve explicit user choices and the previous effective filenames.
- A config change during a batch cannot change that job's snapshot, and rollback to the saved config leaves history intact.

## 2. Evidence and current execution paths

### Live page evidence already collected

The page title is “发现 - 求职 | 一亩三分地”. It has category cards above the feed, latest/popular controls, a central thread list, numbered pagination, and separate popular-topic/comment sections.

| Observation | Evidence |
| --- | --- |
| Current row identity | `main [data-sentry-component="ForumThreadItem"]` |
| Current title/link | Each sampled row contains an `h3` inside an anchor to `/home/thread/{id}` |
| Page 1 counts | 20 feed rows; 26 current thread anchors across the whole document; zero `/home/pins/` anchors |
| Page 2 counts | 20 feed rows; zero old pins anchors |
| Pagination | `/home/discover/38?page=2`, followed by page 3 and later pages |
| Container compatibility | Old `HomeThreadItem` count was zero; existing `.border-b` fallback does match sampled current rows |
| Click behavior to preserve | The title anchor uses an absolute `::after` overlay covering the row |
| Site listing request observed | `/api/forums/38/threads?includes=images,last_reply,topic_tag&is_groupid=1&ps=20&with_total=1&pg=1` |
| Single-thread page inspected | `/home/thread/1184303`; components included `Thread`, `MainThread`, `ThreadPosts`, `PagedPosts`, and `PostItem` |
| Markify UI | No `#markify-container` was present on inspected discover and new-thread pages |

The configured thread and comments endpoints returned HTTP 200 and `errno: 0` for sampled thread `1184303`. Thread field types matched the adapter mapping; the comments endpoint returned 20 posts. These were credentialed browser-fetch checks, not a test of the installed userscript's GM request permissions or complete comment coverage.

The site listing API is evidence of pagination behavior, not a reason to add a new listing-API dependency. The repaired batch UI will operate on rendered rows.

### Code paths read

| Path | Current flow |
| --- | --- |
| Build/config | Root TOML → Vite config loader → `__MARKIFY_*__` constants → userscript config exports → startup stores templates in GM |
| Startup | DOMContentLoaded → template sync/menu registration → Download/Copy controls → history indicator → one delayed batch initialization |
| Listing | `isListingPage()` → `extractItems()` → `BatchDownloadManager.initializeUI()` → checkboxes/panel → observer |
| Batch download | Re-extract selected IDs → fetch each thread → append nonempty documents to ZIP files → create blob → click download link → mark every original selected item downloaded |
| Single download | Match adapter → choose fetcher → `convert()` → independently read current DOM metadata → filename/download/copy → history/statistics |
| Core conversion | All strategies try the matched site API first; non-null results bypass Turndown; null can fall through to DOM or Jina depending on strategy |
| 1Point3Acres API | Load config → fetch thread → map fields → BBCode to HTML → fetch comments → interpolate document/frontmatter strings |
| Release | Tag workflow builds packages but copies and publishes files from the old root `dist/` path |

Important correction: despite the name and some type comments, `strategy: 'dom-only'` currently still tries a dedicated site API. This repair should preserve that runtime behavior rather than redesign conversion strategies.

### Confirmed code defects and implications

| ID | Code location | Finding | Required treatment |
| --- | --- | --- | --- |
| F01 | [userscript matches](/Users/neo/Documents/Git/Markify/config/userscript.toml:6) | Discover and new-thread routes are omitted. | Correct activation scope. |
| F02 | [batch adapter](/Users/neo/Documents/Git/Markify/packages/userscript/src/adapters/1point3acres-batch.ts:11) | Only forum/tag listings and pins anchors are recognized; constructed URLs blindly prepend the origin. | Shared route parsing and row-scoped URL normalization. |
| F03 | [core adapter](/Users/neo/Documents/Git/Markify/packages/core/src/adapters/1point3acres.ts:51) | New-thread URLs match Default. Core's existing `/thread/(\\d+)` ID pattern already handles the numeric ID. | Add routing support, without redundant ID expressions. |
| F04 | [manager initialization](/Users/neo/Documents/Git/Markify/packages/userscript/src/batch/BatchDownloadManager.ts:67) | Empty initial extraction returns before observation; asynchronous checkbox insertion is not awaited. | Observe from startup and serialize reconciliation. |
| F05 | [manager row binding](/Users/neo/Documents/Git/Markify/packages/userscript/src/batch/BatchDownloadManager.ts:115) | ID-substring lookup can select the wrong link; permanent processed-ID set prevents reattachment to replacement nodes; padding is incremented. | Bind exact row elements; track element ownership and restore styles. |
| F06 | [manager observer](/Users/neo/Documents/Git/Markify/packages/userscript/src/batch/BatchDownloadManager.ts:229) | Observer only detects pins anchors, even for US Card Forum; destroy only disconnects it. | Adapter-neutral refresh and full cleanup. |
| F07 | [startup](/Users/neo/Documents/Git/Markify/packages/userscript/src/main.ts:499) | Only one delayed initialization, no route lifecycle. | Add a route controller with one active manager. |
| F08 | [batch export](/Users/neo/Documents/Git/Markify/packages/userscript/src/batch/BatchDownloadManager.ts:378) | No in-flight guard; filename context is repeatedly read from the changing page. | Freeze the queue/context and reject duplicate starts. |
| F09 | [batch history](/Users/neo/Documents/Git/Markify/packages/userscript/src/batch/BatchDownloadManager.ts:488) | All selected items are marked downloaded even when some fetches failed. Single and batch 1Point3Acres names have different case. | Record only included successful items; normalize site identity compatibly. |
| F10 | [filename helper](/Users/neo/Documents/Git/Markify/packages/core/src/utils/filename.ts:36) | Manager uses `filename.single`, ignoring `batch_item`; helper never replaces `{index}`. | Honor configured batch templates and support index. |
| F11 | [GM fetcher](/Users/neo/Documents/Git/Markify/packages/userscript/src/main.ts:30) | GM wrapper ignores options; batch duplicates it; neither has timeout/abort handlers. Single progress callback is created but never passed to conversion. | Shared typed transport and progress plumbing. |
| F12 | [API adapter](/Users/neo/Documents/Git/Markify/packages/core/src/adapters/1point3acres.ts:163) | BBCode becomes HTML inserted into a purported Markdown document; comment errors are swallowed; outer failures return null. | Convert body fragments to Markdown and fail explicitly on incomplete retrieval. |
| F13 | [config loader/types](/Users/neo/Documents/Git/Markify/packages/core/src/config.ts:15) | Type describes root `url_patterns`, but TOML stores `site.url_patterns`; delimiter is accidentally inside metadata. Browser never calls `setConfig()`. | Align shapes and initialize core config from compiled adapter profiles. |
| F14 | [US Card Forum batch](/Users/neo/Documents/Git/Markify/packages/userscript/src/adapters/uscardforum-batch.ts:74) | Calls a function requiring three arguments with only its ID. | Pass fetcher and adapter config explicitly. |
| F15 | [release workflow](/Users/neo/Documents/Git/Markify/.github/workflows/release.yml:34) | Copies `dist/markify-vVERSION.user.js`, while actual output is under `packages/userscript/dist/`; builds twice. | Repair artifact staging and version checks before publication. |

### Baseline verification

- `bun run build:userscript` passed and generated `packages/userscript/dist/markify-v0.0.3.user.js`.
- `bun run build` passed for four projects, with three results from Nx cache. It is not a fresh all-package validation.
- The pinned userscript TypeScript check initially reported TS6305 because referenced core declarations had not been emitted. After emitting core declarations into ignored build output, it exposed:
  - TS2554 in `uscardforum-batch.ts:75`: expected three arguments, received one.
  - TS2559 in `BatchDownloadManager.ts:435`: declared numeric delay passed to `DelayConfig`.
  - TS2322 in `ui.ts:52`: Sonner's toast handle returned as generic promise value.
- Mock API probe: a comments HTTP 500 still returned a nonempty document with no comment-failure notice.
- BBCode probe: `[b]bold[/b]` was emitted as an HTML span, not Markdown bold.
- Filename probe: `{index} - [{id}] {title}` became `{index} - [123] Example`.
- Parsed TOML confirmed `site.url_patterns`, no root `url_patterns`, and `metadata.delimiter` rather than a root delimiter.
- No tracked tests or test scripts were found. The release workflow is the only tracked workflow inspected.

## 3. Implementation design

### A. Route and configuration contracts

Files: [adapter TOML](/Users/neo/Documents/Git/Markify/config/adapters/1point3acres.toml), [core config](/Users/neo/Documents/Git/Markify/packages/core/src/config.ts), [userscript config](/Users/neo/Documents/Git/Markify/packages/userscript/src/config.ts), [Vite config](/Users/neo/Documents/Git/Markify/packages/userscript/vite.config.ts), [globals](/Users/neo/Documents/Git/Markify/packages/userscript/src/globals.d.ts).
New modules: `packages/core/src/adapters/routes.ts` and focused schema/resolution modules under `packages/core/src/config/`. Their boundaries and configuration precedence follow section 1.

- Define a pure classifier receiving a URL and resolved adapter profile, returning a discriminated route with kind, configured route name, parameters, and canonical site ID. Discover/forum/tag are profile route names, not hardcoded shared-code cases.
- Validate hostname, scheme, and anchored pathname. Query strings do not change thread identity. Normalize trailing slashes.
- Migrate the existing configured thread ID extraction patterns into the normalized route contract; generate adapter matching from the same profile and test registry/metadata consistency.
- Cover the currently supported legacy BBS thread, pins, and instant-thread routes. Classic forum listing and interview product routes are not newly promised.
- Declare `https://www.1point3acres.com/home/*` in that profile's activation patterns and generate userscript metadata, with internal route gating; retain BBS/instant and US Card Forum rules. Home entry initializes the route watcher without showing thread-specific controls.
- A discover listing stays a listing; never route it to the thread API.
- Define typed batch configuration for listing routes, row/title/link selectors, legacy selectors, and refresh timings.
- Initialize `setConfig({ adapters: ... })` once using validated, resolved profiles before metadata extraction or conversion. Migrate the legacy GM template cache and preserve explicit overrides using section 1's versioned migration rules.
- Make `AdapterConfig.site.url_patterns` reflect the actual TOML. Move delimiter to the root before TOML tables, with a compatibility read for legacy nested config if necessary.
- Correct `NotificationConfig.delays.batch_item` to `DelayConfig`, and reconcile the `PackageConfig` wrapper with the actual injected value. Vite injects `config.package`, while consumers currently read `pkg.package`; choose a consistently wrapped export and test it.
- Fix build-time adapter access for both sites; use injected browser config and the explicit disk loader in their respective platforms. Drive `main.ts` activation, fetcher selection, and progress from registry capabilities, removing site-name branches.

Completion: classifier tests pass, all exported config shapes agree, and generated metadata covers direct entry to the target URL.

### B. Feed extraction and row ownership

Files: [1Point3Acres batch adapter](/Users/neo/Documents/Git/Markify/packages/userscript/src/adapters/1point3acres-batch.ts), [batch manager](/Users/neo/Documents/Git/Markify/packages/userscript/src/batch/BatchDownloadManager.ts), [US Card Forum batch adapter](/Users/neo/Documents/Git/Markify/packages/userscript/src/adapters/uscardforum-batch.ts).
New module: `packages/userscript/src/batch/types.ts`.

Proposed browser-only contracts:

- `BatchItem`: immutable ID, full title, canonical URL.
- `BatchRow`: one item plus its exact row element and title anchor.
- `BatchCapability`: stable site key, resolved profile, listing detection, row extraction, filename context, and item fetch with progress/cancellation. Construct it through the browser registry with injected services.
- Keep DOM elements in the userscript package; do not add them to core conversion types.

Algorithm:

1. Reject unsupported route/host.
2. Select the first matching configured layout variant and find rows within its feed root. The current variant uses `main [data-sentry-component="ForumThreadItem"]`; legacy support is another ordered profile variant, not a site-name branch in the extractor.
3. For each row, resolve its configured title anchor, validate and normalize its URL, and read the configured title attribute/text source. The current profile prefers the full `h3` title attribute with heading text as fallback.
4. Deduplicate by canonical thread ID, binding the first eligible row. Ignore category cards, ads, popular sidebars, and unrelated anchors.
5. Return row references with the items so the manager never searches by ID substring.

For a fallback without Sentry attributes, verify a structural selector against sanitized current markup and a browser fixture before enabling it. It must stay inside the central feed and require a title heading plus valid thread route. If boundaries cannot be established, return an explicit unsupported-layout state rather than select arbitrary document links.

Bind controls through a map keyed by the actual row element. Preserve original inline position/padding values; apply a single owned class or deterministic offset and restore it on cleanup. Replacing a row with the same thread ID must create one new control. Add an accessible checkbox label and stop the click reaching the full-row link overlay without breaking native checkbox toggling.

Completion: captured discover fixture yields 20 rows, not 26; ID collisions, duplicate links, and unrelated anchors cannot bind controls to the wrong row.

### C. Lifecycle, rendering, and selection

Files: [main startup](/Users/neo/Documents/Git/Markify/packages/userscript/src/main.ts), [batch manager](/Users/neo/Documents/Git/Markify/packages/userscript/src/batch/BatchDownloadManager.ts).
New module: `packages/userscript/src/navigation.ts`.

- Replace the fixed-delay initialization with a controller owning one active route key, one manager, and a generation counter.
- Normalize the route key from hostname, pathname, and configured relevant query parameters in sorted order; default to all query parameters if a profile does not narrow them. Observe popstate/hashchange and perform a cheap URL comparison using the resolved poll interval (default 500 ms) to catch history changes across userscript execution worlds. Do not repeatedly scan the DOM from the URL timer.
- Start a scoped/debounced DOM observer immediately, including when the feed is initially empty. Default debounce: 100 ms, configurable. Detect row additions/removals and relevant href/title mutations; ignore Markify-owned insertions.
- On route changes, clear selection and invalidate old async work before the next scan. On same-route replacement of feed rows, remove detached bindings and prune selection; clear selection on feed replacement/filter changes, preserving it only for surviving rows during ordinary appends.
- Serialize refreshes. If a mutation arrives during an asynchronous refresh, schedule one follow-up reconciliation instead of overlapping insertions.
- Compare generation and element connectivity after every await before modifying DOM.
- Keep one panel, one toolbar, one history indicator per active page. Select All operates on the manager's row map, not global checkboxes; checked/indeterminate states reflect current selection.
- On destroy: disconnect observer, cancel timers, invalidate generation, detach controls/panel/listeners, restore styles, clear maps. Prevent late work from re-creating destroyed UI.
- During hydration, keep the panel disabled until a coherent current feed is present. Test transitions where the URL changes before the old rows are replaced.

Completion: direct load, empty-to-populated rendering, page 1 → 2 → back, latest/popular changes, and home → discover → thread → back all work without duplicate UI.

### D. Batch job integrity, filenames, and history

Files: [batch manager](/Users/neo/Documents/Git/Markify/packages/userscript/src/batch/BatchDownloadManager.ts), [history](/Users/neo/Documents/Git/Markify/packages/userscript/src/utils/download-history.ts), [filename helper](/Users/neo/Documents/Git/Markify/packages/core/src/utils/filename.ts), [template types](/Users/neo/Documents/Git/Markify/packages/core/src/templates.ts).

- Add `isDownloading`, guard the handler, and disable selection/download controls while a run is active. Reset state in finally on success, error, and cancellation.
- Freeze selected item metadata and listing filename context once at click time. Use stable ordering from the current row list.
- Track successful items alongside their file entries. ZIP and history must derive from that same list.
- Use resolved `filename.batch_item` for entries, falling back to resolved `filename.single` only if absent. Apply section 1's precedence/migration rules once in the resolver; preserve previous effective filenames during migration instead of implementing competing fallback orders in the manager.
- Replace `{index}` with the provided padded index. Use callback replacements so literal dollar replacement sequences in titles cannot corrupt output.
- Ensure duplicate sanitized filenames are disambiguated deterministically with thread ID/suffix.
- Discover context is `site=1point3acres`, `type=discover`, `id=38`, with the current category label if confidently available; use ID fallback, never `forum/unknown`.
- Canonicalize history keys through the profile registry's alias map. For example, the 1Point3Acres profile includes legacy `1Point3Acres` and `1point3acres`; the shared history service contains no hardcoded alias list. Merge duplicate logical records in statistics without deleting unrelated records.
- Write successful batch history in one read/merge/write operation after ZIP creation and download initiation. Retain failed selections for retry on the same page.
- Always revoke object URLs and remove temporary anchors even if history persistence fails. Report history-write failure separately from ZIP creation failure.
- Browser-triggered download initiation does not prove the file was saved to disk. Automated smoke testing must additionally observe the download and inspect the archive.
- On navigation during a batch, generation invalidation prevents further scheduling, final ZIP creation, or history writes. Abort the transport if supported; otherwise ignore the outstanding response and return a cancellation outcome.

Completion: a three-item batch with one failure creates exactly two files and two history records, with the failed item retryable. Double-click cannot start another run.

### E. API transport, Markdown, and explicit failures

Files: [1Point3Acres core adapter](/Users/neo/Documents/Git/Markify/packages/core/src/adapters/1point3acres.ts), [converter](/Users/neo/Documents/Git/Markify/packages/core/src/converter.ts), [core types](/Users/neo/Documents/Git/Markify/packages/core/src/types.ts), [adapter interface](/Users/neo/Documents/Git/Markify/packages/core/src/adapters/base.ts), [main](/Users/neo/Documents/Git/Markify/packages/userscript/src/main.ts).
New modules: `packages/userscript/src/http.ts`, `packages/core/src/markdown.ts`, and a small typed conversion-error module if needed.

Transport:

- Share a typed GM fetcher between single and batch exports. Forward supported headers/options, use the resolved finite timeout, and reject on error/timeout/abort exactly once. The browser registry selects GM or same-origin fetch from each profile; protocol engines only receive `HttpFetcher`.
- Do not manually copy cookies or auth tokens. Use the browser/userscript session and verify behavior in Tampermonkey.
- Declare the required `api.1point3acres.com` connect host in TOML and emit it through Vite.
- Preserve browser restrictions on request headers; verify what is actually needed instead of requiring a spoofed User-Agent.
- Pass config/request credentials consistently. Keep same-origin fetch for US Card Forum and pass its required config explicitly.
- Thread an optional progress callback through ConvertOptions and the adapter call. Restore button state in finally.

Content and failure semantics:

- Retain the existing endpoints. Validate response status, JSON shape, API success marker, and required thread fields before formatting.
- Validate each comments page's success marker and posts shape. Deduplicate comments by post ID; guard repeated-page responses and configured maximum-page truncation.
- Do not equate advertised reply count with number of top-level posts without checking nested-reply semantics. Inspect multi-page/nested samples before claiming all replies are exported.
- Treat HTTP failure, malformed response, access denial, repeated pages, and exhausted page limits as explicit incomplete/failure outcomes. For this repair, fail the affected item rather than silently exporting a partial document.
- Recognize access gates only from explicit response evidence or verified page markers. Ambient 大米/积分/购买鳄梨 UI is not a gate. Unknown restricted-content formats remain a documented verification limit.
- The configured `forum-json` engine throws a typed error for an attempted conversion that failed. Preserve null for unsupported/no-API cases. This stops the current silent fallback from turning a thread failure into a generic whole-page export without adding a site-name check to the converter.
- Keep the public string-returning API shape where practical. Do not require an unrelated rewrite of CLI/MCP or all site adapters.
- Convert only thread/comment body fragments: BBCode → HTML → shared Turndown rules → Markdown, then assemble the document. Never pass the complete YAML/document template through Turndown.
- Add BBCode-compatible rules for bold/italic spans produced by the BBCode library; test links, lists, quotes, code, images, and Unicode.
- Escape YAML scalar substitutions and use callback placeholder substitution for untrusted title/author/body values. Preserve existing configured frontmatter keys and source policy.
- For single export, capture starting URL/title/ID before awaiting conversion and use them for filename/history. Progress updates and completion cannot update a later page's controls.
- The existing core API result metadata reports Untitled; fixing all CLI/MCP metadata is a follow-up unless the implementation reuses a small compatible metadata hook. It must not block correct userscript filenames.

Completion: API failures never produce success notifications/history, Markdown fixtures contain the intended formatting, and a successful real thread export includes the expected body and validated comment coverage.

### F. Shared-site and type-check repairs

Files: [US Card Forum batch adapter](/Users/neo/Documents/Git/Markify/packages/userscript/src/adapters/uscardforum-batch.ts), [globals](/Users/neo/Documents/Git/Markify/packages/userscript/src/globals.d.ts), [UI helper](/Users/neo/Documents/Git/Markify/packages/userscript/src/ui.ts), package scripts/tsconfigs.

- Supply all three arguments to `fetchUSCardForumContent(id, fetcher, config)`.
- Apply hostname-aware listing classification so both batch capabilities cannot activate on an unrelated site's similarly shaped path.
- Adapt US Card Forum row discovery to the new BatchRow contract; cover category, tag, and search fixtures.
- Fix the declared delay object shape to match TOML.
- For `showPromiseToast<T>`, register the toast and await/return the supplied promise, rather than returning Sonner's toast handle as T.
- Make core emit declaration output before userscript reference checking. Add dedicated typecheck scripts using pinned package TypeScript, without changing browser source exports solely to satisfy checks.
- Add userscript typecheck to the validation workflow; Vite compilation alone is insufficient.
- Verify core declaration output and Nx outputs are declared so cache hits restore the files required by downstream checks.

Completion: pinned core/userscript checks pass on a clean build, and shared-manager fixtures cover both sites.

### G. Build, cache, and distribution

Files: [Nx config](/Users/neo/Documents/Git/Markify/nx.json), [release workflow](/Users/neo/Documents/Git/Markify/.github/workflows/release.yml), [Vite config](/Users/neo/Documents/Git/Markify/packages/userscript/vite.config.ts), [README](/Users/neo/Documents/Git/Markify/README.md), [development guide](/Users/neo/Documents/Git/Markify/DEVELOPMENT.md), [package metadata](/Users/neo/Documents/Git/Markify/config/package.toml).

- Inspect effective Nx project inputs; `namedInputs.config` exists but is not explicitly connected to the shown build target. Add root TOML and relevant shared inputs to build hashing where missing. Test a config-only change rather than assuming cache invalidation.
- Keep local output at `packages/userscript/dist/markify-vVERSION.user.js`.
- Preserve the existing automatic-update URL at root `dist/markify.user.js` by explicitly staging a static copy there in the release workflow. Point release assets at the actual package output.
- Build once from the tagged commit; check tag/config version agreement before staging. Stage artifacts before switching any checkout used for the existing static-file publication step.
- Restrict any existing main-branch publication step to the staged static artifact; do not rebuild from a newer main commit and label it as the tag.
- Use frozen-lockfile installation in CI, run validation before publishing, and list the actual versioned/static artifact paths in docs.
- Bump to the next patch version at implementation/release preparation time and synchronize package metadata consistently. Do not create a tag merely to test paths.
- Preserve the previous installable artifact for rollback. Build/test the staged layout locally before any external release.
- Publishing, pushing, and tagging are later actions; this planning request does not perform them.

Completion: a dry staging check finds the versioned and static artifacts, their contents match, and generated metadata/version/URLs are internally consistent.

## 4. Work breakdown and dependencies

| Task | Depends on | Deliverable | Exit condition |
| --- | --- | --- | --- |
| T0 Baseline fixtures/test harness | None | Sanitized discover/legacy/USCF HTML, API fixtures, package-local Bun test setup | Fixtures reproduce old extractor returning zero and failed comments appearing successful |
| T1 Route/config contracts | T0 | Versioned schema, pure resolver/classifier, generated registry/metadata, overrides migration, core initialization | Route/config/migration tests pass; no duplicated matching source; new thread resolves to 1Point3Acres |
| T2 Row extraction and ownership | T1 | BatchRow contract and both adapters | Exact feed extraction, stable controls, excluded sidebar tests pass |
| T3 Lifecycle controller | T2 | Navigation watcher, serialized observer, cleanup | Hydration/page replacement/back-forward tests pass |
| T4 Job/history/filenames | T2, T3 | Frozen queue, run guard, correct successes/history | Partial-batch, retry, index, collision, cancellation tests pass |
| T5 Content/transport behavior | T1 | Shared GM fetcher, Markdown conversion, explicit errors | API/format/timeout tests pass; errors do not fall back silently |
| T6 Typecheck/shared-site fixes | T1–T5 | Working declaration/typecheck chain, USCF call fixes, extension contract test | Pinned type checks, both sites' fixtures, and synthetic third-site profile pass without shared-service edits |
| T7 Distribution preparation | T6 | Correct workflow paths/cache inputs/docs/versioned build | Clean build and dry artifact staging pass |
| T8 Real browser smoke | T7 | Recorded download evidence for target and regressions | All release acceptance checks below pass |

T1–T3 restore the UI. T4–T6 establish reliable downloads. T7–T8 establish that users can install and use the repaired artifact. Do not report completion after only the selector changes.

## 5. Test matrix

Use Bun's test runner for pure functions and DOM fixtures, with a DOM dependency declared in the package that owns the tests. The repository's CLI already uses linkedom, but do not depend on a sibling package's undeclared dependency. Use a real browser fixture for layout, clicks, and navigation behavior. Mock GM/network/download hooks for deterministic tests; reserve real credentials for a small manual smoke set.

| Suite | Cases | Assertions |
| --- | --- | --- |
| Routes | Discover/forum/tag, new thread, pins, BBS, instant, trailing slash/query, hostile lookalike host | Correct discriminant/ID; unsupported origins never activate |
| Config | Parsed TOML, schema versions, aliases, root delimiter, generated registry, engine/route validation | One resolved profile shape; actionable errors; both adapters resolve without browser fs |
| Overrides/migration | Global/site/invocation precedence, array replacement, unknown keys, repeated migration, reset, mid-job changes | Explicit choices retained; effective filenames preserved; immutable job config; valid fallback after reset |
| Extension contract | Synthetic third site on an existing protocol and layout; config-only selector/route update | Profile plus fixtures is sufficient; central UI/history/lifecycle unchanged |
| Extraction | 20 feed + 6 sidebar links, ads, duplicate IDs, absolute links, ID substring collision | Exact feed items, full titles, canonical URLs, exact row ownership |
| DOM lifecycle | Initial empty state, delayed rows, append, replace with same IDs, rapid mutations | One checkbox per row; no missed initialization; no duplicate padding |
| Navigation | Page/query/filter change, URL before DOM, back/forward, home → listing → thread | Old selection/UI removed; one manager; late work cannot mutate new page |
| Controls | Mouse/keyboard checkbox, Select All, indeterminate, full-row overlay | No thread navigation; count equals actual selected current items |
| Batch | All success, one failure, all fail, double-click, navigation during fetch, ZIP failure | Exact files/history; no duplicate job; finally restores controls; cancellation suppresses late side effects |
| Names/history | Index template, duplicate sanitized names, quotes/dollar tokens, legacy mixed-case keys | No unresolved placeholders; deterministic unique filenames; old downloads remain recognized |
| API | Valid response, 401/403/500, errno failure, malformed JSON, missing fields, timeout/abort | Typed failures and no success/download history for failed items |
| Comments | Multiple pages, final empty page, duplicate/repeated page, nested replies, max limit | Correct order/deduplication; truncation never silently succeeds |
| Markdown | Bold/italic spans, link, quote, list, code, image, Unicode, YAML quotes | Readable Markdown, valid frontmatter, no placeholder corruption |
| Single export | Capture URL then navigate; Download/Copy error; progress | Correct original title/ID/source; restored state; no new-page indicator |
| US Card Forum | Category/tag/search extraction, appended rows, fetch call contract | Correct host gating, explicit config/fetcher, shared manager compatibility |
| Build/release | Clean declarations/checks, TOML-only invalidation, version/path staging | No hidden type errors; cache reacts to config; intended artifact installed |

Suggested locations: core tests under `packages/core/tests/`, userscript unit/DOM tests under `packages/userscript/tests/`, and browser fixtures under `packages/userscript/tests/browser/`. Add explicit test scripts and package-local dependencies. Keep captured auth state, extension tokens, and full private post bodies out of fixtures.

## 6. Validation commands and acceptance gates

Already run against the baseline:

- Root `rtk proxy bun run build:userscript`: passed.
- Root `rtk proxy bun run build`: passed, with three cached targets.
- In core: `rtk proxy bun node_modules/typescript/bin/tsc -p tsconfig.json --emitDeclarationOnly`: passed.
- In userscript: `rtk proxy bun node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`: failed with the three remaining errors listed above.

Implementation commands to add/use once scripts exist:

1. Run core and userscript package test scripts with Bun.
2. Run the declaration/typecheck dependency chain from a clean build state.
3. Run `rtk proxy bunx nx run-many --target=build --all --skip-nx-cache` for a fresh final build.
4. Inspect generated userscript metadata and compare staged static/versioned artifact bytes.
5. Run the browser fixture suite.
6. Install the exact generated userscript and perform the live checks below.

Live acceptance:

- Direct load of discover/38 produces one toolbar/panel and one checkbox per current feed row, with none on ads/category cards/sidebar entries.
- Page 2 and back, latest/popular switch, and navigation from home work without reload or stale selection.
- Selecting a checkbox does not open a thread.
- New-thread single Download and Copy produce the correct body/metadata and restore button state.
- A small batch of accessible threads produces an observed ZIP download with exactly the selected successful entries; open/extract it to verify content and filenames.
- Injected/mocked failure paths produce explicit errors, correct retry state, and no incorrect history. Do not depend on finding a real inaccessible post.
- Verify multi-page/nested comments on a suitable accessible sample before claiming complete reply export.
- Exercise legacy route recognition and US Card Forum batch behavior with fixtures, plus live smoke where a session is available.
- Confirm installed version matches the tested artifact. A successful build or direct fetch alone does not close this gate.
- Confirm a config-only profile change is consumed by the generated registry and invalidates the build cache, and that supported user overrides survive userscript startup/update.

## 7. Remaining uncertainties and follow-up boundaries

- The installed userscript version/enabled state and GM permissions have not been inspected.
- The Sentry-free structural row fallback, sort-state attributes, and rapid transition behavior still require browser fixture/live validation.
- API gate formats and nested-comment completeness are not fully established by the single sampled request. Explicit failures can be handled now; do not invent an unsupported gate taxonomy.
- Universal CLI/MCP metadata improvement, generic conversion-strategy cleanup, and unrelated UI library redesign are follow-up work.
- Automatic-update URLs and Greasy Fork synchronization have not been live-verified; only their local workflow/path inconsistency is confirmed.
- The generated v0.0.4 bundle was smoke-tested by injecting it into a logged-in browser page with a GM-compatible test transport. The user's currently installed local stub still needs its `@require` path updated from v0.0.3 to v0.0.4 before it will load this bundle.
- No commit, tag, push, or external release has occurred. This document remains the execution record and acceptance criteria.

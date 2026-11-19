# Cortex project review and cleanup plan

Reviewed: 16 November 2026 · Baseline: `main` at `b2fa740`

Status: implementation completed locally on `codex/project-cleanup-responsive-pwa`. This document preserves the baseline review. See [implementation results and deployment gates](CLEANUP_IMPLEMENTATION.md) for current behavior, validation, and rollout requirements. Production configuration/data operations remain separate.

This file lives under `notes/` deliberately: the current content generator publishes almost every Markdown file outside its exclusion list into the reference library. Both the generator and Vercel deployment exclude `notes/`. Move maintenance documentation into a dedicated documentation directory after replacing that publication policy with an explicit content manifest.

## Assessment

The project has a useful foundation: strict client TypeScript, parameterized SQL, a coherent curriculum registry, tested graph algorithms, Markdown rendered without a raw HTML plugin, and an existing local persistence layer. Keep those assets.

The main cleanup should address ownership and state transitions first. The highest risks sit in curriculum writes, public workspace copies, account changes, synchronization, and annotation history. Large components and verbose copy are symptoms of duplicated behavior and unfinished feature integration. Fix those boundaries, then simplify the interface around a small set of reusable components.

Recommended order:

1. Contain security exposures and make save failures visible.
2. Establish shared data contracts and reliable account-scoped persistence.
3. Repair synchronization, deletion, and concurrent writes.
4. Stabilize ink and protect existing annotations from layout changes.
5. Simplify UI copy, navigation, reading, and graph controls.
6. Reduce loading cost, complete offline behavior, and enforce quality checks.

Shell, dashboard, settings, and library copy can be polished independently of annotation migrations. Lecture layout changes must respect existing ink coordinates.

## Scope and evidence

The review covered application composition and routes; the 48 TypeScript/TSX files under `src/`; authentication, sync, graph, storage, and database code under `api/`; all ten test suites; CSS; package/build/PWA/deployment configuration; content generation; and project documentation. Curriculum structure and sample educational content were inspected. This was not a mathematical verification of every lecture or every cited theorem.

The production preview was inspected in the browser across the dashboard, topics, lecture reader, knowledge graph, notebook, library, study path, search, and settings. A narrow viewport was used to inspect lecture reading, then reset. No Google account was connected and no live cloud write or database migration was performed.

| Check | Baseline result | Meaning |
| --- | --- | --- |
| `npm test` | 10 suites, 74 tests passed | Existing unit and rendering checks pass; account lifecycle and actual API concurrency are not covered. |
| `npm run build` | Passed, with a chunk-size warning | Main JS: 1,736.24 kB, 502.94 kB gzip; CSS: 61.05 kB. These are build sizes, not measured network or interaction timings. |
| Additional strict API typecheck | Passed | The server currently typechecks, but the standard build does not include it. |
| Additional unused-symbol check | Failed with 102 diagnostics | Includes unused imports, props, state, and unfinished feature wiring. This check is not enabled in the normal build. |
| `npm audit --json` | 15 affected packages: 5 high, 4 moderate, 6 low | Includes transitive and build-time dependencies; counts are not 15 independently exploitable application flaws. |
| In-memory model probes | Reproduced deletion resurrection, restored bookmarks/completion, invalid dates reaching date formatting, and fresh objects on unchanged merges | No repository test files were added and no application data was used. |
| Stubbed tokeninfo responses | Reproduced acceptance without configured audience, and acceptance of wrong `aud` when `azp` matches | Tests the local verification policy; this does not establish that forged signatures bypass Google's tokeninfo service. |
| Browser checks | Reproduced topic/hash mismatch, search remaining open after Escape, and graph status controls leaving the default graph unchanged | These are observable behavior issues, not only code-style findings. |

Cloud configuration, current public Blob objects, production logs, real provider outages, installed-PWA updates, and physical stylus behavior remain unverified. Source-backed risks below should be tested in an isolated integration environment during implementation.

## Findings: security and data integrity

Priorities: **P0** = contain before further release; **P1** = correctness/security work before broad refactoring; **P2** = feature completion and maintainability. Conditional exposure is identified explicitly.

### S1 — P0: the browser can write the shared curriculum without authentication

Evidence: `api/graph.ts:18`, `api/lib/db.ts:299`, `src/lib/graphStore.ts:98`, `src/components/KnowledgeGraphView.tsx:34`.

`POST /api/graph` accepts client-supplied topics, lectures, and dependencies without verifying identity or authority. Payload checking only verifies truthiness. Opening the graph triggers this write from every client. When the database graph version needs initialization or refresh, an unauthenticated caller can supply the shared dataset; the version gate can then treat that dataset as current. Parameterized SQL prevents SQL interpolation here, but does not authorize the data being written.

Plan: serve the static curriculum from the application and move any required database seeding to a deployment/migration command with trusted source data. Remove the client write effect and public write route, or require a separate administrative authorization policy if a runtime editor is actually needed. Keep public reads only if there is a real consumer. Return generic server errors instead of database exception messages.

Acceptance: unauthenticated requests cannot change curriculum tables; opening a graph performs no database mutation; graph version and data are committed together from trusted inputs.

### S2 — P0: private workspaces are mirrored into public Blob objects

Evidence: `api/lib/storage.ts:54`, especially `access: 'public'` at line 71.

If `BLOB_READ_WRITE_TOKEN` is configured, every save attempts a public JSON upload containing the workspace, even after a successful Neon save. This is a mirror, not merely an outage fallback. `addRandomSuffix: false` also makes paths deterministic within the store. Anyone possessing a public object URL can read it without the app's authentication. Whether such objects exist in production was not checked.

Plan: stop writing private workspace data to public storage. Prefer one durable primary backend; use authenticated private Blob storage only if a separate backup requirement justifies it. If public objects already exist, inventory and securely back them up, migrate and verify private copies, then remove the public copies through a controlled cleanup. Verify cache behavior as part of that process. Changing future uploads alone does not remove existing exposure.

Acceptance: no private workspace has an unauthenticated read URL; a successful primary save does not create an additional public copy. Vercel explicitly distinguishes public URL access from authenticated private storage. [Vercel Blob security](https://vercel.com/docs/vercel-blob/security)

### S3 — P1: authentication does not fail closed on audience configuration

Evidence: `api/lib/auth.ts:36`, `api/lib/auth.ts:56`, `src/lib/auth.tsx:106`.

Audience verification is skipped when all client-ID environment variables are absent. When configured, `aud === clientId || azp === clientId` allows a matching authorized-party claim to substitute for the intended audience. Expiration validation is conditional rather than requiring a finite valid expiry. Client identity is restored by decoding localStorage claims before server verification, and expired sessions are not actively transitioned when a sync request returns 401.

Plan: require a valid configured audience; verify signature, issuer, audience, subject, and expiry with a supported verification library; do not use `azp` as an alternative audience check. Share client-ID configuration parsing. Establish verified identity before enabling cloud writes, and handle expiry/re-authentication explicitly. Revisit token persistence together with the session model; if adopting HttpOnly session cookies, include the corresponding CSRF controls. Separate ordinary sign-out from revoking Google's grant.

Acceptance: missing configuration, wrong audience, invalid expiry, and expired sessions cannot enter authenticated cloud state. Google recommends a client/JWT verification library for production and describes tokeninfo as a development/debugging option. [Google ID token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)

### S4 — P1: untrusted data crosses API, backup, and ink boundaries without a complete schema

Evidence: `api/sync.ts:87`, `src/lib/model.ts:78`, `src/lib/ink.ts:130`, `src/lib/ink.ts:204`.

The sync endpoint accepts arbitrary workspace objects and merges them without validation. Backup validation accepts invalid timestamp strings, arbitrary progress status values, unbounded strings, and unchecked serialized ink. An accepted invalid date causes `Intl.DateTimeFormat` in note lists/previews to throw. Ink deserialization accepts malformed point and annotation objects, which rendering assumes are valid. SVG export escapes text content but interpolates colors, coordinates, and other attributes directly; malicious imported attributes can create unsafe standalone exported SVG files.

Plan: introduce shared runtime schemas with finite numeric values, real timestamps, valid enums, unique/bounded IDs, collection and byte limits, color validation, and explicit legacy migrations. Distinguish strict API input from tolerant backup migration. Validate decoded ink, not merely its enclosing string. Escape all SVG attributes or construct exports with a safe serializer. Render math fallback through React text instead of interpolated HTML. Add HTTP method checks, request limits, timeouts, consistent error responses, and an explicit same-origin/CORS policy. Rate-limit expensive authenticated operations at the appropriate deployment boundary.

Acceptance: malformed imports fail with a recoverable message; corrupt data cannot crash the whole app; unsafe SVG attributes cannot survive export; invalid API bodies cause no database writes. Reflecting Origin is hardening work, not proof of authentication bypass by itself.

### D1 — P1: account switching can persist or merge the wrong workspace

Evidence: `src/lib/workspace.tsx:52`, `src/lib/workspace.tsx:82`, `src/lib/workspace.tsx:119`, `src/lib/workspace.tsx:170`.

Identity changes and workspace loading happen in separate effects. On a render with a new identity, the persistence effect can queue the previous workspace under the new user's key before that user's cached workspace has loaded. On logout, the same pattern can queue the previous signed-in workspace under anonymous `main`. Account-cache reads and POST sync responses lack a session-generation check, so late results can update state after switching users. Workspace bootstrap also does not wait for auth restoration. These are source-backed race paths; they were not exercised against real accounts.

Plan: model workspace state as an identity-bound session with explicit `loading`, `ready`, and `error` phases. Suspend persistence/sync until the intended account is loaded. Capture user ID and generation on every operation; abort or discard stale results. Keep anonymous data in a separate workspace and provide an explicit action to move it into an account. Quarantine corrupt caches instead of silently replacing and then overwriting them with an empty workspace.

Acceptance: A → sign out → B, rapid A → B → A, late reads, late POST replies, and expired sessions never show, upload, or overwrite another workspace. Test the real provider and storage boundary, not independently constructed objects.

### D2 — P1: sync acknowledgements can trigger another sync indefinitely

Evidence: `src/lib/workspace.tsx:188`, `src/lib/workspace.tsx:229`, `src/lib/model.ts:191`.

Every successful POST calls `setData(prev => mergeWorkspace(prev, canonical))`. The merger always constructs a fresh object and arrays, even when nothing changed. The data-dependent effect schedules another POST after 2.5 seconds, whose response repeats the cycle. This also queues unnecessary IndexedDB writes. The initial GET handler starts a network request from inside a state updater, which should remain pure.

Plan: track local dirty revisions or pending operations separately from server acknowledgements. Sync local mutations, not receipt of identical canonical data. Keep state updaters pure, coalesce requests, cancel stale requests, and retry on meaningful network/session changes with bounded backoff.

Acceptance: once pending changes are acknowledged, no more sync requests or local writes occur until another actual change; acknowledging a save does not restart a debounce loop.

### D3 — P1: deletion and reversible progress changes do not survive merging

Evidence: `src/lib/model.ts:191`, `api/sync.ts:5`, `src/components/NotebookView.tsx:68`.

Both mergers union note collections without deletion records. Deleted notes return from the server, and SQL never removes them. Unions also restore removed bookmarks, unread state, and uncompleted lectures. `Math.max(currentWeek)` prevents a lower selected pack from surviving a later merge. Client and server mergers disagree on note timestamp ties, preference updates, and path handling.

Plan: define one versioned sync contract with explicit update/remove semantics, note tombstones, and conflict rules for mutable progress and preferences. Keep backup-import merging as a separate operation with a deliberately different policy. Use revisions and deterministic tie-breaking rather than trusting device clocks alone. Preserve the public lecture/note IDs during migration.

Acceptance: delete, unbookmark, mark unread, undo completion, and select an earlier pack all survive sync and a second device; stale offline data cannot resurrect a deletion; equal-timestamp conflicts have a documented deterministic result.

### D4 — P1: durable-save success is not trustworthy

Evidence: `api/lib/storage.ts:54`, `api/lib/storage.ts:83`, `api/lib/storage.ts:99`, `api/sync.ts:96`, `src/components/SettingsModal.tsx:173`.

`saveUserData` returns `saved || true`, so total durable-storage failure still reports success. KV writes do not check HTTP/application errors. Server memory is process-local and ephemeral. Multiple storage tiers are written independently, while reads select the first nonempty result; recovery of a previously failing primary can make stale data authoritative again. The manual sync UI always toasts success, and signed-in state is labeled as active cloud sync regardless of result.

Plan: make Neon the default authoritative cloud store. Treat local IndexedDB as a separate offline save destination. Return a typed result only after a durable commit; unavailable cloud storage should retain local pending changes and report a recoverable failure. If retaining other adapters, select one explicitly and design controlled recovery instead of silently switching authorities. Keep memory storage test/development-only.

Acceptance: failed database/KV/Blob writes cannot return a durable-success response; the UI distinguishes saving, local-only, pending, synced, and failed; retries preserve local work.

### D5 — P1: cloud writes are non-atomic and can lose concurrent updates

Evidence: `api/sync.ts:76`, `api/sync.ts:94`, `api/lib/db.ts:210`, `api/lib/db.ts:258`.

The API performs a read/merge/write without a shared transaction or revision condition. Two devices can read the same snapshot and overwrite each other's workspace-level changes. The workspace row and each note are then saved through separate statements, allowing partial commits. User upsert is started without awaiting it, despite workspace/note foreign keys referencing the user row.

Plan: await identity/profile creation where required, and commit each sync transaction atomically. Use optimistic workspace revisions or a per-user database lock for conflict detection. Batch note operations and use database timestamps/acknowledgements consistently. Move schema creation out of ordinary requests into migrations.

Acceptance: overlapping device writes preserve both independent edits; a forced failure halfway through saving leaves no partially committed workspace; first-time user sync cannot race a missing user row.

### D6 — P2: database persistence is not a complete Workspace round trip

Evidence: `api/lib/db.ts:192`, `api/lib/db.ts:210`, `src/lib/model.ts:36`.

Neon reconstruction omits `path`, resets `completedSessions`, and has defaults that differ from the client (`pack-4h` and a different active path ID). The global `note_id` primary key rejects same-ID notes belonging to different users, despite the additional composite index. Its conflict guard protects existing owners from overwrite, but the second user's colliding note can be silently skipped.

Plan: explicitly persist or migrate every supported Workspace field; align defaults and legacy names; migrate note identity to `(user_id, note_id)` or another genuinely tenant-scoped key. Verify round trips for a realistic populated workspace.

Acceptance: save/load preserves all supported fields and two users can import the same backup note IDs independently without interference.

## Findings: ink, interface, and feature completion

### I1 — P1: canvas state and history can move between notes or be lost

Evidence: `src/components/InkCanvas.tsx:82`, `src/components/NotebookView.tsx:413`, `src/components/reader/LectureScratchpadPanel.tsx:110`, `src/components/ink/useInkState.ts:48`.

`InkCanvas` only resets when `initialData` is truthy. Switching from a drawn note to a blank note can retain the previous drawing, and the next stroke can save the combined drawing to the new note. History is not scoped/reset consistently. Both redo implementations append snapshots but restore from the front rather than the most recent end. The document hook resets redo whenever echoed `initialData` changes, so ordinary parent persistence can wipe redo after undo. Clear history excludes deleted text annotations; erasing is not a complete undoable operation.

Plan: share a document-scoped annotation reducer/history model, with snapshots or commands for strokes and text. Reset by document identity, distinguish external revisions from acknowledgement of the current edit, and restore redo in the proper order. Treat clear, erase, and text changes consistently. Keep callbacks outside state updater side effects.

Acceptance: drawn A → blank B shows blank B; undo/redo survives parent saves and handles multiple strokes, erase, text edits, and clear; no annotation operation writes to the previously selected note.

### I2 — P1: layout changes can detach existing ink from its text

Evidence: `src/components/DocumentInkOverlay.tsx:100`, `src/lib/ink.ts:55`, `src/styles.css:297`, `src/components/reader/LectureMarginGutter.tsx:17`.

Ink uses absolute page coordinates in a fixed 960 px sheet. Font-size changes, subtitle removal, collapsed sections, content corrections, or delayed layout changes can move text without moving existing marks. Legacy dimensions are parsed but are not used as a complete display migration. Margin section markers use fixed pixel spacers rather than section positions. A canonical width alone does not make annotations stable under vertical reflow.

Plan: version the rendered content/layout associated with annotation payloads. Preserve the legacy renderer for existing ink until a verified migration is available. Prefer block-relative anchors for new annotations; do not rescale all marks globally to compensate for arbitrary reflow. Offer a reviewable migration path where automatic alignment cannot be guaranteed. Derive margin positions from actual content blocks.

Acceptance: existing annotated lectures remain aligned after the release, a font change, panel open/close, viewport changes, and content edits; v1/v2 imports have visual compatibility checks, not only serialization checks.

### I3 — P2: drawing and scrolling behavior is inconsistent

Evidence: `src/components/DocumentInkOverlay.tsx:100`, `src/components/InkCanvas.tsx:102`, `src/components/DocumentInkOverlay.tsx:231`.

Document drawing mode prevents wheel and touchmove globally, while its palm-rejection tooltip says fingers scroll. Standalone drawing does not implement the same palm-rejection policy. Pointer cancellation/lost capture are not handled explicitly, and neither surface isolates an active pointer ID. Every move appends points and rerenders previously completed paths.

Plan: define one pointer/tool policy shared by both surfaces; scope gesture interception to the canvas; support pen drawing with intentional finger navigation; handle cancel/lost capture and competing pointers. Profile on a real stylus device before changing the rendering engine. Cache completed stroke paths and consider frame-batched previews only if profiling warrants it.

Acceptance: stylus, mouse, touch scroll, cancellation, and multi-pointer interactions behave predictably; changing tools or opening a modal cannot leave the page stuck; a large drawing remains responsive.

### U1 — P2: navigation and reading progress have inconsistent sources of truth

Evidence: `src/components/TopicBrowser.tsx:20`, `src/components/LectureReader.tsx:33`, `src/components/LectureReader.tsx:103`, `src/components/Dashboard.tsx:31`, `src/App.tsx:230`.

Topic selection always initializes to Topic 1 and ignores links such as `/topics#clifford-operations`; this was reproduced. Unknown lecture IDs silently display Lecture 1, and mismatching topic IDs are ignored. Opening a lecture immediately creates an empty notebook entry. Dashboard resume chooses the first unfinished lecture in the selected pack rather than last-read state; a completed pack falls back to its first lecture. Next navigation also marks the current lecture complete. Only seven of ten topics appear in the sidebar, without an explanation or expansion affordance.

Plan: make topic selection URL-driven, validate lecture/topic pairs, show recoverable missing-page states, and centralize resume/completion selectors and actions. Create a lecture note on the first actual edit. Decide explicitly whether advancing completes a lecture, and express that action accurately. Give all topics a reachable, compact navigation path.

Acceptance: deep links, refresh, Back/Forward, missing IDs, completed packs, first-time study, and resume-after-reload all behave consistently; opening a lecture alone does not clutter the notebook.

### U2 — P2: graph controls promise behavior that most views do not implement

Evidence: `src/components/KnowledgeGraphView.tsx:118`, `src/components/KnowledgeGraphView.tsx:208`, `src/components/InteractiveDagCanvas.tsx:38`, `src/components/InteractiveDagCanvas.tsx:60`.

Only the stratified view receives the shared filtered IDs. The default hierarchical view has its own unrelated search, and canvas ignores `focusedTopicId`. Selecting “Mastered (0)” leaves all default graph topics visible; this was reproduced. The canvas palette contains outdated topic names for several current topic numbers. Completion updates from the graph change the completed array but not the same progress record updated by the reader. Multiple technical views, duplicate searches, and invariant statistics dominate the screen.

Plan: use one graph query/selection model across views and shared progress actions; derive palette labels from `TOPICS`; either implement a filter consistently or show it only where supported. Use a single useful default view, with advanced views in a compact menu. Put rank, cycle checks, dependency counts, and algorithm diagnostics in an optional details area. Keep the tested layout/query algorithms.

Acceptance: search/topic/status selection has consistent documented results in every exposed view; clear filters and empty states work; topic labels match the curriculum; completion agrees with the reader and study path.

### U3 — P2: theme and responsive reading are unfinished

Evidence: `src/lib/workspace.tsx:154`, `src/styles.css:1`, `src/styles.css:297`, inline styles throughout page components.

The settings UI persists dark/system selection and the provider sets `data-theme`, but the stylesheet has no theme selectors. Many surfaces hard-code white or pale backgrounds. CSS contains 75 `!important` declarations and extensive compressed rules followed by overrides. In the narrow browser viewport, the lecture text column remained 640 px wide inside the scrolling 960 px sheet, requiring horizontal reading. The existing bottom navigation remains hidden by CSS.

Plan: implement semantic light/dark tokens and migrate hard-coded colors. Organize CSS by base, layout, components, and deliberate responsive rules; remove overrides after visual comparison. Provide a readable narrow-screen mode while keeping a clearly intentional canonical annotation mode. Coordinate this with I2 rather than reflowing old ink silently. Use one compact mobile navigation model and collapse low-value toolbar labels.

Acceptance: theme controls visibly work across all surfaces; ordinary reading is comfortable at narrow widths; annotation mode preserves existing geometry; 200% zoom, tablet portrait/landscape, and open notes panels have no inaccessible controls.

### U4 — P2: modal, keyboard, and status behavior needs a shared contract

Evidence: `src/components/SearchModal.tsx:46`, `src/components/SettingsModal.tsx:163`, `src/components/PdfEmbedViewer.tsx:30`, `src/components/graph/NodeCard.tsx:27`, `src/App.tsx:101`.

Search renders `<dialog open>` instead of opening a modal dialog; Escape does not close it, as reproduced. Its close button lacks a descriptive accessible name. PDF uses a custom overlay without consistent focus trapping/restoration; its error state is set but never rendered. Clickable graph divs lack keyboard equivalents. Resize handles are pointer-only. The reader's N shortcut does not guard modifiers, contenteditable, or active dialogs. Local save errors exist in context but are unused by the shell, while notebook and scratchpad status can still imply success.

Plan: share dialog lifecycle and focus behavior, status presentation, and typed notifications. Use actual links/buttons for interactive graph cards, labels for fields, selected/expanded semantics for controls, and keyboard resizing where exposed. Scope shortcuts to appropriate contexts. Present concise actionable save and auth errors. Ensure PDF fallback actions remain available without claiming a guaranteed preview. Validate external URL schemes/hosts where appropriate and disclose the third-party viewer choice when it matters.

Acceptance: keyboard-only search, settings, PDF, graph selection, and note editing work; Escape closes the top dialog and focus returns to its trigger; failures never display a success toast. Evaluate contrast and touch targets in visual QA, not only markup tests.

### U5 — P2: verbose copy repeatedly competes with the user's task

Evidence: `src/App.tsx`, `Dashboard.tsx`, `KnowledgeGraphView.tsx`, `NotebookView.tsx`, reader panels, `SettingsModal.tsx`, and `ReferenceLibrary.tsx`.

Repeated uppercase eyebrows, noun-heavy subtitles, curriculum marketing, invented “mastery” claims, and implementation details add many layers before useful content. Navigation uses several names for the same destinations. The concrete copy pass is specified below.

Acceptance: each page has one clear title, at most one useful supporting sentence, and an obvious primary action. Remove redundant copy instead of replacing every sentence with a shorter sentence. Retain explanations needed for recovery, an unfamiliar interaction, or a real choice.

## Findings: build, content, and maintenance

### M1 — P1/P2: publication and secret-file defaults are too permissive

Evidence: `.gitignore`, `scripts/content.mjs:6`, `scripts/content.mjs:26`, `README.md` environment instructions.

`.env` and `.env.production` are not ignored, although README tells developers to create `.env`. No tracked real environment file was found; this is a prevention gap, not a confirmed secret leak. Markdown generation walks almost the entire repository and relies on a short exclusion list. A new root review or internal documentation file can silently become public study content.

Plan: ignore environment/secrets files while preserving `.env.example`; add a secret scan appropriate to the repository. Generate public study content from an allowlist/manifest. Keep application maintenance docs outside that manifest. Reject malformed URI decoding and validate internal document/anchor targets.

Acceptance: maintenance/security documents and personal notes cannot enter generated public content by default; local credentials cannot be added through ordinary broad staging; known study links still resolve.

### M2 — P2: loading and offline claims exceed the implementation

Evidence: `src/App.tsx` eager imports, `src/lib/curriculum.ts:671`, `index.html:12`, `vite.config.ts:20`, `src/App.tsx:117`, `src/components/SettingsModal.tsx:325`.

All major routes and the full curriculum are imported eagerly. KaTeX CSS is loaded both from npm and an older external CDN URL. Font formats are emitted but not included in the service worker precache glob, so first-use offline math fonts are not guaranteed. PWA update callbacks set `needRefresh` and `refresh`, but neither is rendered. Settings says “Offline ready” even when readiness is false. A chunk-size warning limit of 1500 kB hides some growth without fixing loading cost.

Plan: split heavy routes and separate curriculum metadata from bodies where useful; measure the initial route before setting a bundle budget. Remove duplicate external KaTeX styling and align supported nested versions. Cache required local fonts and offline route/content chunks deliberately. Show update availability and refresh only after local writes are safe. Derive offline status from actual cache readiness, with distinct treatment for external PDFs and sign-in.

Acceptance: heavy graph/PDF routes do not load on initial dashboard render; a fresh installed cache supports offline lecture math and navigation; updates are discoverable and preserve unsent changes; no readiness label precedes readiness.

### M3 — P2: tests and quality gates do not target the riskiest behavior

Evidence: `package.json`, `tsconfig.json:8`, `tests/security.test.ts:140`, `tests/sync.test.ts:104`, `tests/content_verification.test.ts`.

The tenant-isolation test constructs separate objects and checks they differ; it never mounts the provider or simulates an account switch. Storage tests accept memory-only success. Content tests check length, fields, and balanced braces, which cannot establish mathematical authenticity or source accuracy. The build typechecks `src` and Vite config, excluding `api` and tests. There is no checked-in CI workflow or lint script. Tests import ignored generated content, but `npm test` does not prepare it on a clean checkout. A TypeScript build-info artifact is tracked.

Plan: add meaningful API, provider, and browser regressions listed below; prepare content deterministically before tests; typecheck client/server/tests with appropriate configurations; enable unused checks and React hook checks after resolving current diagnostics. Add CI with clean-install, typecheck, tests, build, and dependency/secret review. Stop tracking generated build metadata. Avoid snapshot tests for every copy edit.

Acceptance: a clean checkout can run the documented checks; regressions in identity, failure handling, concurrency, and deletion are detected; new dead code and hook misuse are rejected.

### M4 — P2: dependencies need a reviewed upgrade pass

Evidence: `npm audit --json` from this review, `package.json`, `package-lock.json`.

The audit reports the Blob → OIDC → CLI config → Zod chain, Sharp, Workbox/glob/minimatch/deepmerge, and nested KaTeX versions. The top-level KaTeX version alone does not remove older nested copies. Sharp is currently used by the trusted repository icon build, which limits the exposed input surface compared with a public image-upload service.

Plan: triage by runtime/build exposure and update compatible dependency paths with the lockfile. Remove unused `@vercel/kv` if the selected storage architecture no longer needs it. Do not run `npm audit fix --force` blindly: the current suggestions include downgrades across major versions. Verify each proposed change against official release/advisory information and rerun the relevant build/offline checks. The Sharp maintainer's reviewed advisory identifies `>=0.35.5` as patched for its librsvg issue. [Sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w)

Acceptance: high findings are fixed or have an explicit, evidence-backed disposition; resolved transitive versions are verified; build-generated assets and PWA output still work.

### M5 — P2: curriculum and documentation contain overlapping or misleading fallback paths

Evidence: `src/lib/curriculum.ts:671`, `src/lib/curriculumData.ts`, `src/lib/content.ts`, `SETUP.md`, `README.md`, `PLAN.md`.

The app carries full lecture records, a second partial lecture registry, generated fallback prose/citations, legacy session metadata, Sunday aliases, and multiple path/default identifiers. Missing records can silently become generic “rigorous” content with placeholder exercises. The published library mixes old four-session guides, developer setup, templates, and the 60-lecture path. The setup simulator ignores gate instructions and returns all-zero samples, so it is an architecture stub rather than a simulation implementation. README calls timestamp/union merging conflict-free, which the current implementation does not support.

Plan: use one explicit curriculum registry, derive counts/packs/palettes, and fail content validation for missing required lectures instead of fabricating educational prose. Migrate legacy fields at boundaries. Curate the library into useful categories and label illustrative code accurately. Keep pedagogical formulas, citations, and relevant explanations; verify scholarly claims separately from the UI-copy pass. Rename the educational architecture map if its filename continues to imply it describes this React codebase.

Acceptance: removing a required lecture record fails validation; titles/counts agree across views; examples clearly distinguish runnable behavior from a stub; documentation accurately describes persistence and offline limits.

## UI copy and information hierarchy specification

### Copy rules

- Use stable names: **Dashboard**, **Topics**, **Knowledge map**, **Study path**, **Notebook**, **Library**, **Settings**.
- Use **lecture**, **pack**, **note**, and **annotation** consistently. Reserve specialized graph terminology for relevant details.
- Use **Done** / **Mark done** for a manually checked lecture. “Mastered” implies an assessment the app does not perform.
- Remove decorative eyebrows that repeat the title or destination. Show counts once where they help scanning.
- Prefer action labels such as **Continue**, **New note**, **Open PDF**, **Export backup**, and **Sync now**.
- Keep duration, progress, citations, and meaningful subject descriptions; do not remove useful educational content simply because it is long.
- Show help at the point of need or behind a small help control. Use persistent text for real errors and state, not for slogans.
- Keep implementation terms such as IndexedDB, PWA, Kahn's algorithm, and “strict DAG” out of the ordinary workflow unless the user has opened a relevant technical explanation.
- Do not change layout around existing lecture ink until I2's compatibility path exists.

### Concrete removal/replacement inventory

| Surface / file | Current copy or pattern | Planned treatment |
| --- | --- | --- |
| App sidebar | `OPEN STUDY PLATFORM` | Remove. |
| App sidebar | `TOPIC NAVIGATION` | Remove or use `Topics` only when needed for grouping. |
| App navigation | `10 Topics`, `Knowledge DAG`, `Notebook & Ink`, `Reference Shelf`, `Settings & Sync` | `Topics`, `Knowledge map`, `Notebook`, `Library`, `Settings`. |
| App topbar | `AINotes · Symplectic & Quantum Systems Guide` | Remove; use current-page context only if needed. |
| App search trigger | `Search 60 lectures & notes` | `Search`; keep an accessible name that describes scope. Show the correct platform shortcut. |
| App loading | `Opening your study room…` | `Loading…`. |
| App footer | Platform slogan and `Theory ↔ Systems Architecture ↔ Derivations` | Remove the repeated slogan block. |
| Dashboard sign-in banner | Long tablet/PC synchronization explanation | A compact account action; optional `Sign in to sync your notes.` |
| Dashboard hero | Subject eyebrow, large marketing hero, long coverage subtitle, decorative matrix caption | Replace with a compact study overview and meaningful Continue/Start action. Retain topic identity where useful. |
| Dashboard primary action | `Resume Pack N: [long lecture title]` | `Continue` or `Start learning`, with the lecture title beside it. Derive the label from actual history. |
| Dashboard pack header | `ACTIVE STUDY BLOCK: PACK N OF 15` plus pack title and repeated theme | One pack title and `x/4 done`; optional useful theme in details. |
| Dashboard topics header | `COMPLETE KNOWLEDGE GRAPH` / `All 10 Core Topics` | `Topics`. |
| Dashboard note badge | `Stylus Drawing Attached` | A drawing icon with an accessible label, or `Drawing`. |
| Dashboard empty preview | `An open reflection with your personal derivations.` | Omit or use `Empty note`. |
| Topics | `TOPIC DIRECTORY` plus page title and counts in multiple places | `Topics`, one count, selected topic and its lectures. |
| Topic lecture cards | Repeated full core-question subtitles | Hide in compact lists; keep questions in lecture content or optional details. |
| Study path | `STUDY SCHEDULE`, `15 Four-Hour Mastery Packs`, repeated explanatory subtitle | `Study path`, with one compact `15 packs · 60 lectures` summary. |
| Study path current pack | `ACTIVE TIMELINE`, `Currently Studying: Pack N of 15` | `Current pack` and selected pack title. |
| Pack cards | `4-HOUR MASTERY PACK N OF 15`, repeated theme, `CURRENT FOCUS`, `PACK COMPLETED` | Pack number/title, duration once, `Current` or `Done` when relevant. |
| Pack actions | `Start Slot`, `Set as Active Pack` | `Start lecture`, `Study this pack`. |
| Knowledge graph heading | `MATHEMATICAL CURRICULUM ARCHITECTURE · STRICT DAG` | Remove. |
| Knowledge graph heading | `Knowledge Tree & Dependency DAG` | `Knowledge map`. |
| Knowledge graph introduction | Monothematic/acyclic/Kahn/contamination paragraph | Remove from primary view; optional short help: `See prerequisites and what to study next.` |
| Graph statistics | `DAG INVARIANT`, `0 Cycles Detected`, `Strict Topological Order`, `Cross-Disciplinary Insight` | Move diagnostics into details; primary view keeps useful progress/readiness only. |
| Graph view tabs | `Topic DAG (Expandable)`, `2D Graph Canvas`, `Ramifications`, `Stratified Tiers` | `Topics`, `Graph`, `Connections`, `Levels`; advanced choices in a menu if all remain useful. |
| Graph detail drawer | `MONOTHEMATIC CORE QUESTION` | `Key question`, only if useful in this context. |
| Notebook header | `NOTES & DERIVATIONS` and descriptive subtitle | Remove; keep `Notebook`. |
| Notebook creation | `New Scratchpad Note`, `General Scratchpad Note`, `Create Scratchpad Note` | `New note`, default `Untitled note`. |
| Notebook search/title | `Search derivations & formulas...`, `Give this thought or derivation a title` | `Search notes`, `Note title`; retain explicit accessible labels. |
| Notebook editor | `PEN / STYLUS DRAWING SURFACE:`, `TYPED REFLECTIONS & LATEX EQUATIONS:` | `Drawing`, `Notes`, or omit where the active tab already conveys it. |
| Notebook template | `+ Add Reflection Template` | `Insert template`. |
| Notebook lecture association | Long association and fluid-annotation callouts linking twice to the same lecture | One concise lecture link, with an annotation indicator when present. |
| Scratchpad panel | `STYLUS & PEN SCRATCHPAD`, `Test Your Understanding`, `Auto-collected` | One heading: `Notes`. Association is implicit or shown as a compact lecture link. |
| Scratchpad footer | `Auto-saved & synced across devices` | Actual persistence status: `Saving…`, `Saved on this device`, `Syncing…`, `Synced`, or actionable failure. |
| Lecture metadata | `60 min true effort` | `60 min` or `About 60 min` if this is an estimate. |
| Lecture intro | Generic lecture subtitle plus repeated `CORE QUESTION` callout | Remove generic subtitle; retain a useful learning question once. Apply only after annotation compatibility work. |
| Lecture sections | `Motivation & Mathematical Invariants`, `Theory & Formal Derivations`, `Step-by-Step Worked Example`, `Systems & Implementation Architecture`, `Primary Literature & Research Papers`, `Paper & Pencil Exercise — Test Your Understanding` | `Overview`, `Theory`, `Worked example`, `Implementation`, `Reading`, `Exercise`. Keep section numbering only if useful. |
| Lecture dependency panel | Long rank/prerequisite/unlock headings before the lesson | Compact optional `Prerequisites` / `Related lectures`; technical rank in details. |
| Lecture/margin | Preserved-margin tutorial and fixed section-marker prose | Remove repeated instructions; context help once, actual annotations and reliable section alignment. |
| Lecture controls | `Open Scratchpad & Stylus`, `Mark as Mastered`, `Mark Slot Mastered`, `Next Slot: [long title]` | `Notes`, `Mark done`, `Next lecture`; keep the destination title adjacent where useful. |
| Library | `THE REFERENCE SHELF`, `Reference Shelf`, generic subtitle | `Library`; useful categories and a search field. |
| Library cards | `Reference & orientation · N min read` everywhere | `N min read`, with category already shown once. |
| Settings title/sections | `Settings & Synchronisation`, `Cross-Device Cloud Sync`, `Reading Comfort`, `Offline Backups`, `PWA & Tablet Installation` | `Settings`, `Account`, `Appearance`, `Backups`, `Install app`. |
| Settings backup help | IndexedDB and JSON implementation paragraph | `Export a copy of your notes and progress.` Explain restore/merge behavior where the choice occurs. |
| Settings auth failure | Environment-variable names in ordinary setup note | `Sign-in is unavailable.` Put deployment diagnostics in developer documentation/logs. |
| Search | Long example-query placeholder and repeated scope hint | `Search lectures, references, and notes`; omit the duplicated hint. Keep clear no-results feedback. |
| PDF viewer | Always-visible embedding-restriction helper and “bypasses” claims | Compact `Open in new tab` / `Try another viewer` recovery actions; no guaranteed-success claim. |

### Page-level polish beyond words

- Dashboard: put the current lecture and progress first; avoid duplicating the full Topics directory below a large hero.
- Topics: use compact selectable topics and a clear lecture list; select from the URL and preserve browser navigation.
- Reader: prioritize lesson content. Keep prerequisites and citations available without several large panels delaying the first section. Protect existing annotation layouts before moving panels.
- Notebook: keep list/editor focus, remove duplicate cards and instructional headers, use a small-screen list/detail flow, and give empty/filter-empty/missing-note states distinct recovery actions.
- Study path: make the current pack easy to find; distinguish packs spanning multiple topics rather than always deriving the title solely from the first lecture's topic.
- Graph: one query bar, one primary view, compact advanced controls, consistent selection and completion.
- Settings: account/status, appearance, backups, installation. Separate product help from deployment setup.

## Reusability and target boundaries

Use small boundaries driven by repeated behavior. Keep the current React/Vite stack and working graph algorithms; a framework migration is not justified by this review.

| Shared boundary | Current duplication/problem | Proposed responsibility |
| --- | --- | --- |
| Workspace contract | Client/server mergers, loose storage types, inconsistent defaults | Shared types, runtime schema, legacy migration, sync operation/revision rules. No curriculum or React imports in server contracts. |
| Account workspace session | Effects mix identity, bootstrap, persistence, network, preferences | Identity-bound lifecycle; IndexedDB repository; sync coordinator; separate theme application hook. |
| Progress commands/selectors | Reader, graph, dashboard, study path compute/update status differently | Complete/reopen lecture, select pack, resume target, counts/readiness. One command updates all required state consistently. |
| Annotation document | Two histories/tool policies and parent-echo resets | Reusable reducer, document identity, pointer policy, serialization and versioned geometry; render adapters for scratchpad/page ink. |
| Note editor | Notebook, lecture scratchpad, reference notes duplicate body/title/preview/save behavior | Controlled editor fields and preview, shared association/status actions. Keep each view's layout purposeful. |
| Graph query model | Shared filters, local searches, ignored props | One filter/selection model consumed by each renderer, and common curriculum-derived display metadata. |
| UI primitives | Repeated Empty, class joins, modal behavior, progress/status, download logic | A few accessible components/helpers: EmptyState, Modal, SaveStatus, Progress, NoteEditor, file download helper. Avoid a speculative design-system framework. |
| Design tokens | Inline hard-coded surfaces/sizes plus CSS overrides | Semantic color/spacing/type/layer tokens, readable component styles, deliberate breakpoints. |
| Content publication | Repository traversal plus private-file denylist | Explicit public-content manifest, metadata/body separation, build-time validation. |

Suggested logical modules: `shared/workspace`, `features/workspace`, `features/annotations`, `features/curriculum`, `features/graph`, and `components/ui`. Move files incrementally when touching their behavior; do not begin with a directory-only rewrite. Delete unused props/branches after determining whether they represent a missing feature or truly obsolete code.

## Implementation sequence

Effort is relative: S = focused change, M = several related files/flows, L = schema/lifecycle work requiring integration testing. These are scope estimates, not calendar commitments.

| Batch | Scope and deliverable | Dependencies | Effort | Exit gate |
| --- | --- | --- | --- | --- |
| 1. Containment | S1/S2/S3, truthful durable-save errors from D4, environment ignores from M1; API regression checks | None | M | No unauthenticated curriculum writes, no new public workspace copies, missing audience fails closed, failed saves are reported. |
| 2. Contracts and ownership | S4, D1, shared schema/migrations, identity-scoped loading/persistence, stale-response cancellation | Batch 1 | L | Account transition and malformed-data cases pass; legacy backups still import safely. |
| 3. Durable sync | D2–D6: revision protocol, deletion/mutable progress semantics, transactional saves, field parity, explicit storage authority | Batch 2 contract | L | Two-device/concurrency/failure tests pass; idle sync stops; deletions and all supported fields survive a round trip. |
| 4. Ink stability | I1/I3, validate ink imports/exports, history and document identity; establish I2 compatibility strategy | Batch 2; coordinate schema with Batch 3 | L | Blank-note isolation, complete undo/redo, pointer cancellation, and legacy visual fixtures pass. |
| 5. Immediate interface cleanup | U5 copy inventory for shell/dashboard/notebook/library/settings/search; U1 routes/resume; U4 dialogs/status; small reusable UI pieces | Status/session contracts; can begin safe shell copy earlier | M | Primary workflows read clearly, no unsupported success claims, deep links and keyboard interactions work. |
| 6. Reader/theme/graph polish | I2-aware lecture copy/layout, U2 filters/palette/progress, U3 themes/responsive reading | Batches 3–5; annotation compatibility before lecture reflow | L | Existing ink stays aligned; theme and narrow reading work; graph filters behave consistently. |
| 7. Build and offline | M2/M4: split routes/content, remove duplicate KaTeX CSS, reviewed upgrades, fonts/cache/update flow | Stable routes and layouts | M | Smaller measured initial route; fresh-cache offline checks pass; updates preserve pending edits. |
| 8. Maintenance gates and documentation | M1 manifest, M3 CI/type/lint/test setup, M5 content cleanup and accurate docs; remaining dead-code removal | Add baseline gates early; finish after previous batches | M | Clean checkout passes documented checks; internal docs never publish; no placeholder lecture fallback. |

Ship each batch as a reviewable change with a focused regression check and a short validation note. Additive schema changes should precede clients that depend on them. Keep old backup/ink readers during rollout; do not drop legacy columns or delete backup objects as part of an unverified cosmetic refactor.

## Required regression checks

| Area | Scenarios that matter |
| --- | --- |
| Authentication/API | Missing audience; mismatched `aud` with matching `azp`; expired/invalid token; unsupported method; malformed/oversized body; unauthorized graph write; generic failure response. |
| Account lifecycle | Initial stored session; A → logout → B; fast switching; delayed old GET/POST/IndexedDB result; anonymous notes kept separate; storage unavailable; corrupted cache preserved for recovery. |
| Synchronization | Independent device edits; conflicting note edits; equal timestamps; deletion while another device is offline; bookmark/read/completion removal; earlier pack selection; all Workspace fields round-trip; no requests after a clean acknowledgement. |
| Durability | No configured cloud backend; forced storage failure; KV non-2xx/application error if retained; transaction failure halfway through notes; concurrent requests; first sync for a new account. |
| Ink | Drawn note → blank note; switching during a stroke; multi-step undo/redo; clear restores text and strokes; erase/history; pointer cancel; parent acknowledgement; legacy dimensions; safe SVG export; malformed point payload. |
| Navigation | Every topic deep link; wrong topic/lecture pair; unknown lecture/note/document; Back/Forward; complete-pack resume; a first visit creates no empty note. |
| UI/accessibility | Search/PDF/settings focus and Escape; labeled fields/buttons; keyboard graph selection; selected/expanded state; actual save/error status; no modifier-key shortcut collisions. |
| Visual | Desktop; narrow phone; tablet portrait/landscape; 200% zoom; light/dark/system; notes drawer; long titles/math/code; empty states; legacy ink before/after layout changes. |
| PWA | First complete cache then offline navigation/math; external PDF unavailable; update available with unsent edits; no false offline-ready state. |
| Content/build | Clean checkout content preparation; explicit public manifest; private/maintenance exclusion; real internal anchors; required lecture records; client/server/test typechecks; production build and reviewed dependency graph. |

Keep existing graph invariant and math-rendering tests. Replace overclaiming test names/assertions with behavior they actually verify. No dedicated tests are needed for each deleted subtitle; visual checks and core workflow regressions are more useful.

## Completion criteria

- [ ] P0 exposures are contained and production configuration/data exposure has been checked separately.
- [x] User identity, local saves, cloud acknowledgements, deletion, and concurrent edits have explicit tested semantics.
- [ ] Annotation history is document-scoped; existing ink remains aligned through the release.
- [x] The copy inventory is applied, with one title and a clear action per surface, consistent vocabulary, and truthful statuses.
- [x] Deep links, resume, graph filters, themes, dialogs, and narrow-screen reading work as presented.
- [x] Shared behavior is reused without replacing working domain algorithms or introducing unnecessary frameworks.
- [ ] A clean checkout passes the new quality gates; offline assets and update handling are verified; dependency findings have recorded dispositions.
- [x] Documentation describes implemented behavior and public content is explicitly curated.

The implementation is documented in [CLEANUP_IMPLEMENTATION.md](CLEANUP_IMPLEMENTATION.md). Production-dependent acceptance gates remain open until an authorized release operator completes them.

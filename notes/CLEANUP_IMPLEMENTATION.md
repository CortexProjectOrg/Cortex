# Cleanup implementation and release runbook

Implemented against `b2fa740` on 16 November 2026. This accompanies the original [review and plan](PROJECT_CLEANUP_PLAN.md); the original findings describe that baseline.

## Implemented

| Area | Result |
| --- | --- |
| Security | Retired the public curriculum mutation endpoint (410); removed public Blob/KV/memory workspace writes; required Google signature, issuer, audience, expiry, subject and verified email; validated workspaces and SVG/drawing input; bounded payloads and timeouts; rejected unsupported methods and cross-origin requests. |
| Persistence | Identity-owned controller and serialized account storage; explicit corrupt-cache recovery; session expiry handling; no anonymous/account auto-merge; actual local/cloud save states; no idle acknowledgement loop. |
| Sync | Atomic per-account document with compare-and-swap revision; full field round trips; note deletion tombstones; three-way rebase; competing note edits retained as conflict copies; explicit additive backup import. |
| Annotations | Shared document history; undo/redo for strokes/text/clear/erase; blank-note reset; single active pointer, cancellation, touch scrolling; stored scratchpad dimensions; legacy lecture layout compatibility; version-3 layouts and fit-to-screen annotation display. |
| Product | Short navigation, page titles and actions; compact dashboard and curriculum lists; working topic deep links, resume and reversible completion; consistent graph filters, compact graph cards, keyboard controls and modal details; explicit empty states; native dialogs and drawer focus handling. |
| Responsive UI | Navigation drawer through 1100 px; phone note list/detail flow; wrapping filters/toolbars; flexible library cards; contained math/code/table scrolling; notes overlay through 1200 px; light/dark surfaces; safe-area padding and larger coarse-pointer controls. |
| Build | Lazy routes and separate content/catalog; one KaTeX stylesheet/version; local fonts in precache; update prompt after local flush; explicit public Markdown manifest; Node 22 baseline; client/API/test typechecks, hook lint, formatting, secret guard and CI. |

The fixed annotation coordinate system is deliberate. Reading mode reflows; annotation mode scales the entire page. This avoids reinterpreting old absolute coordinates as responsive text anchors. Existing legacy annotations retain their older headings and panels in annotation mode. Physical pen hardware and historical user documents still need a release smoke test; no claim of pixel-perfect migration for every historic browser/font combination is made.

## Validation

- `npm run check` passed: 16 suites, 101 tests; client/API/test typechecks, hook lint, secret guard and production build. Formatting and the moderate-or-higher audit gate passed.
- Unit/integration tests include actual React provider switches under StrictMode, delayed local writes on remount, corrupt caches, concurrent devices, deletion, reversible progress, annotation history, signed JWT verification, API failure/conflict cases and hostile drawing payloads.
- PGlite executes the PostgreSQL migration and actual compare-and-swap statements locally. Tests cover overlapping revisions, tenant separation and all-or-nothing invalid writes. This is a local PostgreSQL compatibility check, not a live Neon test.
- Browser checks cover 320, 390, 768, 1024 and 1440 px layouts, local note persistence through reload, graph filters, lecture reading, annotation fit, dark mode and dialog/drawer dismissal. Reader page widths stayed within the viewport. No production account was used.
- The built PWA reloaded a different lecture with 39 rendered math nodes after its local server was stopped. All 59 emitted font assets appear in the service worker precache. An older local cached version upgraded after closing and reopening its tab; real installed-device update handling with pending cloud writes remains a release check.
- Initial entry JavaScript is approximately 503 kB / 151 kB gzip, versus 1,736 kB / 503 kB gzip at baseline. These are bundle sizes, not load-time benchmarks. Full curriculum and renderer chunks remain sizeable but are separate from the initial dashboard.
- Dependency audit has no moderate/high/critical findings. Four low affected packages belong to the build-time `deepmerge` → Rollup resolver → Workbox → PWA chain. The available audit suggestion downgrades the PWA stack; no forced downgrade is applied. Recheck the upstream [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) before release. Build configuration is trusted repository input.

## Required deployment sequence

1. Export important browser workspaces and take a private database backup. Schedule a maintenance window; stop the old API from accepting writes while copying data. Keep a deployment rollback artifact and the database backup together.
2. Verify the production Google web client ID and allowed origins. Configure the same client ID for server and browser. Only the server/migration environment receives `DATABASE_URL`.
3. In a secure shell with the migration database URL already injected, run `npm ci` and `npm run db:migrate`. The command does not automatically load a local `.env` file. It creates the additive schema, validates legacy rows, and copies missing workspace documents. Invalid legacy rows stop the copy; recover/repair those rows explicitly and rerun. Existing document rows are never overwritten by rerunning it.
4. Reconcile copied account counts and sample complete private workspaces. The old schema never persisted custom path/completed-session fields reliably; absent values cannot be reconstructed by this migration. Restore those from trusted user backups if available. Legacy tables remain intact.
5. Deploy the API and client together, then reopen writes. Old cached clients use an incompatible POST shape and receive 400; their local notes remain intact. Have users update/reload the app before syncing. Do not re-enable the old unsafe API for compatibility.
6. Test real sign-in, two-device independent edits, concurrent edits to one note, deletion, token expiry and cloud outage against a staging Neon branch before production traffic. Monitor only counts/statuses and server error classes; never log bearer tokens or note bodies.
7. Configure deployment-level throttling for `/api/auth/verify` and `/api/sync`, considering shared networks and normal device bursts. No per-process memory limiter is presented as protection for a distributed serverless deployment.

If rollback is needed after new writes, stop writes first and privately export the new `workspace_documents` data. Reverting only the application would expose stale legacy rows and lose access to newer edits. Roll forward after repair or explicitly reconcile the new documents into a compatible backend. Do not drop the old or new tables as an automated rollback.

## Existing public Blob data

Removing the writer only prevents new public copies. An authorized operator must inventory existing workspace objects, privately preserve and reconcile them with Neon/user backups, verify ownership and completeness, and then remove public copies through the storage provider's controlled process. Check cached URL access and revocation behavior. Rotate retired writer credentials after dependent deployments are removed. Do not publish object URLs or identifiers in an issue/PR. No production object inventory, deletion, credential change or database mutation was performed during this implementation.

## Release smoke tests still requiring the deployment/device environment

- Real Google login and Neon migration/write checks, including older deployed clients and rollback rehearsal.
- A previously installed PWA receiving this update with pending offline changes; Safari/iPad and Android install/resume/rotation behavior.
- Physical stylus pressure, palm rejection, pointer cancellation, long documents and a representative backup of old lecture ink.
- Production public-object inventory/removal and edge throttling.

Mathematical claims and external scholarly references were preserved. This cleanup does not substitute for a subject-matter review of the curriculum.

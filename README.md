# AINotes

A study notebook for mathematics, quantum computing, and simulation systems: 60 lectures, 10 topics, and 15 four-hour study packs.

## Develop and verify

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Vite serves the local app; it does not run the Vercel API. Anonymous notes work locally without credentials. Use a Vercel development/preview environment to exercise Google sign-in and cloud sync.

```sh
npm run check          # generate content, typecheck client/API/tests, lint hooks, scan, test, build
npm run format:check
npm audit --audit-level=moderate
npm run preview        # production PWA at http://127.0.0.1:4173
```

`npm test` prepares generated content automatically. The production service worker is disabled in the development server.

## Notes and synchronization

- Anonymous and signed-in workspaces use separate browser storage keys. Export the anonymous workspace and explicitly import it into the signed-in account to transfer it.
- Notes save to IndexedDB. Save status distinguishes local persistence, pending cloud changes, synchronization, and failures. Browser storage is not a backup; export important work from Settings.
- Cloud saves require Google identity verification and a configured Neon database. Tokens live in session storage and memory; expired/unverified sessions cannot send cloud writes. Previously verified profiles may reopen their local cache offline in the same browser session.
- Each account has one atomic JSON workspace with a server revision. Stale writes receive a conflict response; the client rebases changes against its last acknowledged snapshot. Independent note edits are preserved, competing edits produce a conflict copy, and deletion tombstones prevent stale devices from restoring deleted notes. Conflicting scalar settings use the pending local edit. Device timestamps do not order cloud commits.
- Backup import is a separate additive operation: newer-dated notes win, current preferences remain, and current deletion tombstones are respected. A quarantined corrupt cache requires an explicit backup recovery.
- Workspaces are limited to 3.5 MB, with additional per-field and drawing limits. Export/archive old drawings before exceeding the limit.

## Reading and annotations

Reading mode reflows to the screen. Annotation mode uses a fixed coordinate system with **Fit page** / **Actual size** controls, keeping ink anchored while its display scales. Earlier lecture annotation layouts retain their legacy structure; new annotations use layout version 3. Do not reflow or remove content from those layouts without a versioned compatibility strategy.

Scratchpad drawings retain their stored dimensions across screen changes. Undo/redo covers strokes and typed annotations. Pen/mouse drawing and touch scrolling are separate; physical stylus and installed Safari/Android testing remain release checks.

## Offline use

After the production service worker finishes caching, bundled lectures, references, math fonts, navigation, and local notes are available offline. Google sign-in, cloud synchronization, and external papers/PDF viewers require a network connection. App updates are prompted and local writes must finish before reload. Clearing site data removes local notes and cached assets.

## Deployment

Copy `.env.example` into your private environment. Never put database credentials in `VITE_*` variables. Configure matching Google web client IDs and authorized origins. Run the explicit database migration before deploying this API; request handlers never create tables.

Read [the rollout and recovery runbook](notes/CLEANUP_IMPLEMENTATION.md) before release. In particular, old public Blob copies require a separate inventory and controlled removal. Removing the old writer does not remove previously published objects.

## Repository boundaries

- `shared/`: validated workspace and drawing contracts, migration and merge rules.
- `src/lib/workspaceSession.ts`: account-owned persistence and sync lifecycle.
- `src/components/ink/`: shared annotation history and tools.
- `src/lib/curriculumData.ts`: full lecture content; the generated catalog supplies lightweight navigation metadata.
- `api/`: Google verification and authenticated revisioned workspace API. The obsolete curriculum write endpoint returns 410.
- `migrations/` and `scripts/migrate.ts`: explicit, additive database preparation.
- `content-manifest.json`: the only Markdown files published in the Library. Internal notes, setup files, and new Markdown files are not automatically published.

Tests verify data boundaries, database revision statements, account lifecycle, graph invariants, rendering, and content structure. They do not certify every mathematical claim or citation in the curriculum. `SETUP.md` includes an explicitly labeled architecture stub, not a working simulator.

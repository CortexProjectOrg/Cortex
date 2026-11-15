# AINotes

An open, cross-device educational Progressive Web Application (PWA) designed for deep foundational mastery in discrete mathematics, symplectic algebra, quantum simulation, and systems engineering.

AINotes combines the fluid, distraction-free annotation feel of a modern stylus-first tablet app with a rigorous academic curriculum, full LaTeX rendering, and zero-configuration cross-device persistence.

---

## Key Capabilities

- **Fluid Direct Document Inking**: Draw, highlight, and annotate directly on top of non-static, responsive lecture text and LaTeX equations. Powered by a responsive SVG layer tracking `ResizeObserver` geometry with sub-pixel coordinate scaling.
- **Academic Highlighter & Pressure Stylus**:
  - Ink pen with fine, mid, and thick stroke widths (`perfect-freehand`).
  - Highlighter utilizing `mix-blend-mode: multiply` so underlying mathematical formulas and proofs remain completely legible.
  - Native Palm Rejection mode: active stylus draws ink, while finger touches scroll the page vertically.
  - Browse Mode: toggle to select text, copy code, or interact with links.
- **Concurrent Scratchpad & Note Taker**: Side-drawer for typed derivations and scratchpad calculations available on any screen with a single click or keyboard shortcut (`N`).
- **Zero-Click Auto-Collection**: Notes and drawings created during a lecture are automatically associated with that lecture and organized in the standalone Notebook (`/notes`).
- **15 Four-Hour Mastery Packs (60 Lectures Total)**:
  - Structured into 15 self-contained, 4-hour mastery units (each containing 4 one-hour lectures).
  - Spans 10 topics from basic set theory and finite fields to symplectic Clifford simulation, stabilizer states, and GPU acceleration.
- **Rigorous Theoretical Citations**: Every mathematical equation and formula explicitly cites its primary literature source (Hostens, Aaronson & Gottesman, Lanczos, Simon, etc.) with specific theorems and equation numbers.
- **Cross-Device Persistence**:
  - Primary: Neon PostgreSQL serverless database.
  - Multi-tier fallback: Vercel Blob, Upstash KV, and local IndexedDB.
  - Conflict-free timestamp-based note merging.
- **Offline PWA**: Full offline capability with service worker caching and client-side IndexedDB storage.

---

## Tech Stack

- **Framework**: React 19, TypeScript, Vite 8
- **Styling**: Clean, distraction-free academic typography with KaTeX math rendering
- **Stylus Engine**: `perfect-freehand` with custom vector SVG paths
- **Backend & APIs**: Vercel Serverless Functions (`api/sync.ts`, `api/auth/verify.ts`)
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Authentication**: Google Identity Services (OAuth 2.0 ID Token verification)
- **Testing**: Vitest

---

## Quick Start

### 1. Prerequisites

- Node.js 20+ (recommended v22+)
- npm 10+

### 2. Installation

```bash
git clone https://github.com/f-martini/AINotes.git
cd AINotes
npm install
```

### 3. Local Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser or tablet.

### 4. Running the Test Suite

```bash
npm run test
```

### 5. Production Build

```bash
npm run build
```

---

## Configuration & Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```bash
# Neon Postgres Database URL (or POSTGRES_URL from Neon / Vercel integration)
DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require

# Google Authentication
GOOGLE_AUTH_CLIENT_API_KEY=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_AUTH_API_KEY=your-api-key-optional
```

### Google OAuth Setup in Google Cloud Console

Under **APIs & Services > Credentials > OAuth 2.0 Client IDs**:
- **Application Type**: *Web application*
- **Authorized JavaScript origins**:
  - `http://localhost:5173`
  - `http://localhost:3000`
  - `https://<your-deployment>.vercel.app`
- **Authorized redirect URIs**: (Not required for the client-side Google Identity Services token flow).

---

## Project Structure

```
AINotes/
├── api/                     # Vercel Serverless Functions
│   ├── auth/verify.ts       # Google token verification endpoint
│   ├── lib/db.ts            # Neon PostgreSQL database client & schema migrations
│   ├── lib/storage.ts       # Multi-tier storage fallback (Neon -> Blob -> KV -> Memory)
│   └── sync.ts              # Cross-device workspace synchronization
├── public/                  # Static assets & PWA icons
├── scripts/                 # Markdown content and icon generation scripts
├── src/
│   ├── components/          # React components
│   │   ├── DocumentInkOverlay.tsx # Fluid SVG annotation layer with palm rejection
│   │   ├── InkCanvas.tsx    # Standalone stylus canvas
│   │   ├── LectureReader.tsx# Full lecture reader with integrated ink layer & side notes
│   │   ├── MarkdownView.tsx # KaTeX & GFM markdown renderer
│   │   ├── NotebookView.tsx # Notebook with auto-collected lecture notes
│   │   ├── StudyPathView.tsx# 15 Four-Hour Mastery Packs syllabus
│   │   └── TopicBrowser.tsx # 10 foundational topics directory
│   ├── lib/
│   │   ├── auth.tsx         # Google auth context & GIS integration
│   │   ├── curriculum.ts    # 10 Topics, 60 lectures, citations, formulas
│   │   ├── ink.ts           # Vector ink smoothing engine
│   │   ├── model.ts         # Note, Workspace, and Lecture data models
│   │   └── workspace.tsx    # IndexedDB + Neon sync provider
│   └── styles.css           # Minimalist academic UI stylesheet
├── tests/                   # Vitest unit & integration test suites
└── vercel.json              # Vercel deployment configuration
```

---

## License

MIT License. Open for educational and research use.

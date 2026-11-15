import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams
} from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import {
  BookOpen,
  Bookmark,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Code2,
  Compass,
  Download,
  FolderOpen,
  LayoutDashboard,
  Layers,
  Calendar,
  List,
  LoaderCircle,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PenTool,
  PencilLine,
  Plus,
  Route as RouteIcon,
  Search,
  Settings,
  Sparkles,
  StickyNote,
  Sun,
  Trash2,
  Upload,
  WifiOff,
  Cloud,
  FileText,
  X,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight
} from 'lucide-react';

import { documents, documentMap, sessionDocs, sessionStart, kinds } from './lib/content';
import type { StudyDocument } from './lib/content';
import { docRoute, makeNote, noteMarkdown, notePrompt, slug } from './lib/model';
import { useWorkspace } from './lib/workspace';
import { useAuth } from './lib/auth';
import { ALL_LECTURES, TOPICS } from './lib/curriculum';

import { Dashboard } from './components/Dashboard';
import { TopicBrowser } from './components/TopicBrowser';
import { StudyPathView } from './components/StudyPathView';
import { LectureReader } from './components/LectureReader';
import { NotebookView } from './components/NotebookView';
import { SettingsModal } from './components/SettingsModal';
import { MarkdownView } from './components/MarkdownView';
import { InkCanvas } from './components/InkCanvas';

const join = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className={join('brand', small && 'small')}>
      <img src="/icon.svg" alt="" width="38" height="38" />
      <span>AINotes</span>
    </span>
  );
}

function Empty({
  icon,
  title,
  children,
  action
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}

// Reference Document Reader (for CODEBASE_MAP.md, GLOSSARY.md, SOURCES.md, etc.)
function ReferenceReader() {
  const params = useParams();
  const id = params['*'] ?? '';
  const doc = documentMap.get(id);
  const location = useLocation();
  const navigate = useNavigate();
  const { data, update } = useWorkspace();
  const [notesOpen, setNotesOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  useEffect(() => {
    if (!doc) return;
    update(cur => ({ ...cur, lastRead: { id: doc.id, at: new Date().toISOString() } }));
    setActiveNote(null);
    const timeout = window.setTimeout(() => {
      if (location.hash) {
        document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({
          block: 'start'
        });
      } else {
        window.scrollTo(0, Number(localStorage.getItem(`quaos-position:${id}`) ?? 0));
      }
    }, 80);
    return () => clearTimeout(timeout);
  }, [id, location.hash, update]);

  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(`quaos-position:${id}`, String(Math.round(window.scrollY)));
      } catch {}
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [id]);

  if (!doc) {
    return (
      <div className="page">
        <Empty
          icon={<BookOpen />}
          title="Document not found"
          action={
            <Link className="button primary" to="/library">
              Browse reference library
            </Link>
          }
        >
          This reference page is not in the library.
        </Empty>
      </div>
    );
  }

  const attached = data.notes
    .filter(n => n.documentId === id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const note = attached.find(n => n.id === activeNote) ?? attached[0];
  const read = data.read.includes(id);
  const bookmarked = data.bookmarks.includes(id);

  const toggleRead = () =>
    update(current => ({
      ...current,
      read: current.read.includes(id)
        ? current.read.filter(item => item !== id)
        : [...current.read, id]
    }));

  const addNote = () => {
    const fresh = makeNote(`Notes on ${doc.title}`, id);
    update(current => ({ ...current, notes: [fresh, ...current.notes] }));
    setActiveNote(fresh.id);
    setNotesOpen(true);
  };

  const updateActiveNote = (patch: Partial<typeof note>) => {
    if (!note) return;
    update(cur => ({
      ...cur,
      notes: cur.notes.map(n =>
        n.id === note.id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      )
    }));
  };

  return (
    <div className={join('reading-layout', notesOpen && 'with-notes')}>
      <div className="reading-main">
        <div className="reader-toolbar">
          <Link className="breadcrumb" to="/library">
            <ArrowLeft size={14} /> Reference Library
          </Link>
          <div className="toolbar-actions">
            <button
              type="button"
              className={join('icon-button', bookmarked && 'is-active')}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark page'}
              title="Bookmark page"
              onClick={() =>
                update(current => ({
                  ...current,
                  bookmarks: bookmarked
                    ? current.bookmarks.filter(item => item !== id)
                    : [...current.bookmarks, id]
                }))
              }
            >
              <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className={join('button small', notesOpen ? 'soft' : 'secondary')}
              onClick={() => setNotesOpen(!notesOpen)}
            >
              {notesOpen ? <PanelRightClose size={16} /> : <PenTool size={16} />}
              <span>Stylus Notes</span>
              {attached.length > 0 && <span className="count-pill">{attached.length}</span>}
            </button>
          </div>
        </div>

        <article className="article">
          <header className="article-heading">
            <div className="article-meta">
              <span className="eyebrow">REFERENCE SHELF</span>
              <span>
                <Clock3 size={13} /> {doc.minutes} min read
              </span>
            </div>
            <h1>{doc.title}</h1>
            <div className="article-rule" />
          </header>

          <MarkdownView doc={doc} source={doc.body.replace(/^#\s+[^\n]+\n/, '')} />

          <div className="reader-pagination" style={{ marginTop: '40px' }}>
            <button
              type="button"
              className={join('button', read ? 'soft' : 'secondary')}
              onClick={toggleRead}
            >
              {read ? <CheckCheck size={17} /> : <Check size={17} />}
              {read ? 'Marked as read' : 'Mark as read'}
            </button>
            <Link className="button primary" to="/library">
              Back to Reference Library <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      </div>

      {/* Side Notes Drawer with Ink Canvas */}
      {notesOpen && (
        <aside className="reading-notes" style={{ width: '400px' }}>
          <div className="notes-panel-heading">
            <div>
              <span className="eyebrow">MARGIN NOTES</span>
              <h3>Lecture Notes</h3>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Close notes"
              onClick={() => setNotesOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {attached.length > 0 && (
            <div className="attached-note-select">
              <select
                aria-label="Choose a note"
                value={note?.id}
                onChange={e => setActiveNote(e.target.value)}
              >
                {attached.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.title || 'Untitled Note'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-button"
                title="Add another note"
                onClick={addNote}
              >
                <Plus size={17} />
              </button>
            </div>
          )}

          {note ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <input
                className="note-title"
                value={note.title}
                onChange={e => updateActiveNote({ title: e.target.value })}
                placeholder="Note title"
                style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '6px' }}
              />

              <div style={{ fontSize: '11px', fontWeight: 650, color: 'var(--muted)' }}>
                STYLUS CANVAS:
              </div>
              <InkCanvas
                initialData={note.inkData}
                onChange={inkData => updateActiveNote({ inkData })}
                minHeight={240}
              />

              <div style={{ fontSize: '11px', fontWeight: 650, color: 'var(--muted)' }}>
                TYPED NOTES:
              </div>
              <textarea
                className="note-body"
                value={note.body}
                onChange={e => updateActiveNote({ body: e.target.value })}
                placeholder="Type formulas or thoughts..."
                rows={4}
                style={{
                  padding: '8px',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          ) : (
            <Empty
              icon={<PencilLine size={26} />}
              title="A space beside the text"
              action={
                <button type="button" className="button primary" onClick={addNote}>
                  <Plus size={16} /> Start a note
                </button>
              }
            >
              Draw equations, derive formulas, or write questions.
            </Empty>
          )}
        </aside>
      )}
    </div>
  );
}

// Reference Library View
function Library() {
  const { data } = useWorkspace();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = documents.filter(
    doc =>
      (filter === 'all' || filter === 'bookmarks'
        ? filter !== 'bookmarks' || data.bookmarks.includes(doc.id)
        : doc.kind === filter) &&
      (!query || `${doc.title} ${doc.text}`.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="page library">
      <span className="eyebrow">THE REFERENCE SHELF</span>
      <div className="page-title-row">
        <div>
          <h1>Reference Shelf</h1>
          <p>Codebase architecture maps, glossaries, and practice guides.</p>
        </div>
        <span className="library-count">
          {documents.length}
          <span>study pages</span>
        </span>
      </div>

      <div className="library-controls">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search library"
            placeholder="Find a topic, an equation, a question…"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </label>
        <div className="filter-tabs">
          {[
            ['all', 'All pages'],
            ['guide', 'Guides'],
            ['theory', 'Theory'],
            ['code', 'Code tours'],
            ['bookmarks', 'Saved']
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={filter === id ? 'active' : ''}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="library-grid">
        {filtered.map(doc => (
          <Link className="library-card" key={doc.id} to={docRoute(doc.id)}>
            <div className="library-card-top">
              <span className={join('kind-label', doc.kind)}>
                {doc.kind === 'code' ? (
                  <Code2 size={13} />
                ) : (
                  <BookOpen size={13} />
                )}
                {kinds[doc.kind] || 'Reference'}
              </span>
              {data.bookmarks.includes(doc.id) ? (
                <Bookmark size={15} fill="currentColor" />
              ) : (
                <ArrowUpRight size={16} />
              )}
            </div>
            <h3>{doc.title}</h3>
            <p>
              Reference & orientation · {doc.minutes} min read
            </p>
            {data.read.includes(doc.id) && (
              <span className="read-label">
                <Check size={12} /> Read
              </span>
            )}
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <Empty icon={<Search />} title="No pages found">
          Try a different word or choose another category.
        </Empty>
      )}
    </div>
  );
}

// Global Search Modal (Cmd+K)
function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const { data } = useWorkspace();

  const lectureMatches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ALL_LECTURES.filter(
      l =>
        l.title.toLowerCase().includes(q) ||
        l.question.toLowerCase().includes(q) ||
        l.content.theory.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  const docMatches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return documents
      .filter(doc => `${doc.title} ${doc.text}`.toLowerCase().includes(q))
      .slice(0, 4);
  }, [query]);

  const noteMatches = data.notes
    .filter(
      note => query && `${note.title} ${note.body}`.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 4);

  if (!open) return null;

  return (
    <dialog open className="modal search-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-inner">
        <label className="search-field">
          <Search size={19} />
          <input
            autoFocus
            aria-label="Search all study material"
            placeholder="Try “symplectic”, “Lanczos”, “Clifford”, or “AQUIRE”…"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <button type="button" className="icon-button" onClick={onClose}>
            ✕
          </button>
        </label>
        <div className="search-results">
          {!query && (
            <p className="search-hint">Search 60 lectures, reference shelf, and your own notes.</p>
          )}
          {query &&
            lectureMatches.length === 0 &&
            docMatches.length === 0 &&
            noteMatches.length === 0 && (
              <p className="search-hint">No matches found for “{query}”.</p>
            )}

          {lectureMatches.map(l => (
            <Link
              key={l.id}
              to={`/topics/${l.topicId}/${l.id}`}
              onClick={onClose}
              style={{ textDecoration: 'none' }}
            >
              <span className="search-result-icon">
                <BookOpen size={18} />
              </span>
              <div>
                <strong>{l.title}</strong>
                <span>
                  4H Pack {l.packNumber || l.sundaySession}, Slot {l.packSlot || l.sundaySlot} · 60 min
                </span>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          ))}

          {docMatches.map(doc => (
            <Link key={doc.id} to={docRoute(doc.id)} onClick={onClose} style={{ textDecoration: 'none' }}>
              <span className="search-result-icon">
                <FileText size={18} />
              </span>
              <div>
                <strong>{doc.title}</strong>
                <span>Reference Shelf</span>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          ))}

          {noteMatches.map(note => (
            <Link key={note.id} to={`/notes/${note.id}`} onClick={onClose} style={{ textDecoration: 'none' }}>
              <span className="search-result-icon">
                <PencilLine size={18} />
              </span>
              <div>
                <strong>{note.title}</strong>
                <span>From your notebook</span>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </div>
    </dialog>
  );
}

// Main App Shell
export default function App() {
  const { data, loaded, error, syncState } = useWorkspace();
  const { user } = useAuth();
  const location = useLocation();

  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ainotes_sidebar_collapsed') === 'true';
    }
    return false;
  });
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [refresh, setRefresh] = useState<(() => void) | null>(null);
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [installed, setInstalled] = useState(
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  );
  const [toast, setToast] = useState('');

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(open => !open);
      }
    };
    const network = () => setOnline(navigator.onLine);
    const install = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const installedNow = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('keydown', keyboard);
    window.addEventListener('online', network);
    window.addEventListener('offline', network);
    window.addEventListener('beforeinstallprompt', install);
    window.addEventListener('appinstalled', installedNow);

    const updater = registerSW({
      immediate: true,
      onOfflineReady() {
        setOfflineReady(true);
      },
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisterError(err) {
        console.info('PWA offline cache:', err);
      }
    });
    setRefresh(() => () => {
      void updater(true);
    });

    return () => {
      window.removeEventListener('keydown', keyboard);
      window.removeEventListener('online', network);
      window.removeEventListener('offline', network);
      window.removeEventListener('beforeinstallprompt', install);
      window.removeEventListener('appinstalled', installedNow);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
    { to: '/topics', label: '10 Topics', icon: <Layers size={19} /> },
    { to: '/path', label: 'Study Path', icon: <Calendar size={19} /> },
    { to: '/notes', label: 'Notebook & Ink', icon: <PenTool size={19} /> },
    { to: '/library', label: 'Reference Shelf', icon: <BookOpen size={19} /> }
  ];

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className={join('app-shell', sidebarCollapsed && 'sidebar-collapsed')}>
        {menuOpen && (
          <button
            type="button"
            className="sidebar-scrim"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={join('sidebar', menuOpen && 'open')}>
          <Link to="/" className="brand-link" aria-label="AINotes home">
            <Logo />
          </Link>
          <div className="sidebar-caption">OPEN STUDY PLATFORM</div>

          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                title={item.label}
                className={({ isActive }) => join('nav-link', isActive && 'active')}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.to === '/notes' && data.notes.length > 0 && (
                  <small>{data.notes.length}</small>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-divider" />
          <div className="sidebar-section-label">TOPIC NAVIGATION</div>

          <nav className="chapter-nav" aria-label="Topics">
            {TOPICS.slice(0, 7).map(topic => (
              <Link
                key={topic.id}
                to={`/topics#${topic.id}`}
                title={`Topic ${topic.number}: ${topic.title}`}
              >
                <span className={join('chapter-dot', topic.color)}>{topic.number}</span>
                <span style={{ fontSize: '11px' }}>{topic.title}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <button
              type="button"
              className="nav-link settings-trigger"
              onClick={() => setSettingsOpen(true)}
              title="Settings & Sync"
            >
              <Settings size={18} />
              <span>Settings & Sync</span>
            </button>

            <div className="offline-status">
              {syncState === 'synced' ? (
                <>
                  <Cloud size={13} style={{ color: 'var(--accent)' }} />
                  <span>Cloud Synced</span>
                </>
              ) : online ? (
                <>
                  <span className="status-dot" />
                  <span>Online (Local Cache)</span>
                </>
              ) : (
                <>
                  <WifiOff size={13} />
                  <span>Offline Mode</span>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="app-main">
          <header className="topbar">
            <div className="topbar-left">
              <button
                type="button"
                className="icon-button mobile-menu"
                aria-label="Open navigation"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Menu size={20} />
              </button>
              <button
                type="button"
                className="icon-button desktop-sidebar-toggle"
                onClick={() => {
                  setSidebarCollapsed(c => {
                    const next = !c;
                    localStorage.setItem('ainotes_sidebar_collapsed', String(next));
                    return next;
                  });
                }}
                title={sidebarCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
                aria-label={sidebarCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
              >
                {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
              <span className="topbar-label">AINotes · Symplectic & Quantum Systems Guide</span>
              <Link className="mobile-brand" to="/">
                <Logo small />
              </Link>
            </div>

            <div className="topbar-actions">
              <button
                type="button"
                className="global-search"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={16} />
                <span>Search 60 lectures & notes</span>
                <kbd>⌘ K</kbd>
              </button>

              <span className="topbar-divider" />

              {/* User Avatar / Login */}
              {user ? (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer'
                  }}
                  title={`Signed in as ${user.name}`}
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                    />
                  ) : (
                    <span className="avatar">{user.name[0]}</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="button small secondary"
                  style={{ padding: '6px 12px', minHeight: '32px', fontSize: '11px' }}
                  onClick={() => setSettingsOpen(true)}
                >
                  Sign In
                </button>
              )}

              <button
                type="button"
                className="icon-button"
                aria-label="Open settings"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings size={19} />
              </button>
            </div>
          </header>

          <main id="main-content">
            {loaded ? (
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/topics" element={<TopicBrowser />} />
                <Route path="/topics/:topicId/:lectureId" element={<LectureReader />} />
                <Route path="/path" element={<StudyPathView />} />
                <Route path="/notes" element={<NotebookView />} />
                <Route path="/notes/:id" element={<NotebookView />} />
                <Route path="/library" element={<Library />} />
                <Route path="/read/*" element={<ReferenceReader />} />
                <Route
                  path="*"
                  element={
                    <div className="page">
                      <Empty
                        icon={<Compass />}
                        title="Page not found"
                        action={
                          <Link className="button primary" to="/">
                            Return to Dashboard <ArrowRight size={16} />
                          </Link>
                        }
                      >
                        The study lectures and reference shelves are in the navigation menu.
                      </Empty>
                    </div>
                  }
                />
              </Routes>
            ) : (
              <div className="loading-workspace">
                <LoaderCircle className="spin" size={25} />
                <span>Opening your study room…</span>
              </div>
            )}
          </main>

          <footer className="site-footer">
            <span>
              AINotes <span className="footer-dot">·</span> Open Foundational Platform for
              Quantum & Symplectic Computing.
            </span>
            <span>Theory ↔ Systems Architecture ↔ Derivations</span>
          </footer>
        </div>
      </div>

      {/* Bottom Nav for Mobile / Tablet */}
      <nav className="bottom-nav" aria-label="Tablet navigation">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => join(isActive && 'active')}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onShowToast={msg => setToast(msg)}
        installEvent={installEvent}
        installed={installed}
        offlineReady={offlineReady}
      />

      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Dismiss"
            onClick={() => setToast('')}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Compass,
  Layers,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  PenTool,
  Search,
  Settings,
  WifiOff,
  X
} from 'lucide-react';
import type { ReactNode } from 'react';
import { lazy, Suspense, useEffect, useState, useRef } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { SaveStatus } from './components/ui/SaveStatus';
import { useMediaQuery } from './components/ui/useMediaQuery';
import { useDrawerFocus } from './components/ui/useDrawerFocus';

import { useAuth } from './lib/auth';
import { TOPICS } from './lib/curriculumCatalog';
import { usePdfViewer } from './lib/pdfViewerContext';
import { useWorkspace } from './lib/workspace';

const Dashboard = lazy(() => import('./components/Dashboard').then((m) => ({ default: m.Dashboard })));
const TopicBrowser = lazy(() =>
  import('./components/TopicBrowser').then((m) => ({ default: m.TopicBrowser }))
);
const StudyPathView = lazy(() =>
  import('./components/StudyPathView').then((m) => ({ default: m.StudyPathView }))
);
const LectureReader = lazy(() =>
  import('./components/LectureReader').then((m) => ({ default: m.LectureReader }))
);
const KnowledgeGraphView = lazy(() =>
  import('./components/KnowledgeGraphView').then((m) => ({ default: m.KnowledgeGraphView }))
);
const NotebookView = lazy(() =>
  import('./components/NotebookView').then((m) => ({ default: m.NotebookView }))
);
const SettingsModal = lazy(() =>
  import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);
const SearchModal = lazy(() => import('./components/SearchModal').then((m) => ({ default: m.SearchModal })));
const ReferenceReader = lazy(() =>
  import('./components/reference/ReferenceReader').then((m) => ({ default: m.ReferenceReader }))
);
const Library = lazy(() =>
  import('./components/reference/ReferenceLibrary').then((m) => ({ default: m.ReferenceLibrary }))
);
const PaperPlanner = lazy(() =>
  import('./components/PaperPlanner').then((m) => ({ default: m.PaperPlanner }))
);
const PdfEmbedViewer = lazy(() =>
  import('./components/PdfEmbedViewer').then((m) => ({ default: m.PdfEmbedViewer }))
);

const join = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className={join('brand', small && 'small')}>
      <img src="/icon.svg" alt="" width="38" height="38" />
      <span>Cortex</span>
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

// Main App Shell
export default function App() {
  const { data, loaded, error, syncState, saving, flush } = useWorkspace();
  const { user } = useAuth();
  const { activePaper, closePaper } = usePdfViewer();
  const location = useLocation();

  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const compact = useMediaQuery('(max-width: 1100px)');
  const navigationRef = useRef<HTMLElement>(null);
  useDrawerFocus(navigationRef, compact && menuOpen, () => setMenuOpen(false));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        (localStorage.getItem('cortex_sidebar_collapsed') ??
          localStorage.getItem('ainotes_sidebar_collapsed')) === 'true'
      );
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
        setSearchOpen((open) => !open);
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
      onRegisteredSW(_url, registration) {
        if (registration?.active && navigator.serviceWorker.controller) setOfflineReady(true);
      },
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
  }, [location.pathname, location.hash]);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
    { to: '/topics', label: 'Topics', icon: <Layers size={19} /> },
    { to: '/tree', label: 'Knowledge map', icon: <Network size={19} /> },
    { to: '/path', label: 'Study path', icon: <Calendar size={19} /> },
    { to: '/papers', label: 'Paper study', icon: <Network size={19} /> },
    { to: '/notes', label: 'Notebook', icon: <PenTool size={19} /> },
    { to: '/library', label: 'Library', icon: <BookOpen size={19} /> }
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
        <aside
          ref={navigationRef}
          inert={compact && !menuOpen}
          className={join('sidebar', menuOpen && 'open')}
        >
          {compact && (
            <button
              className="icon-button navigation-close"
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
            >
              <X size={20} />
            </button>
          )}
          <Link to="/" className="brand-link" aria-label="Cortex home">
            <Logo />
          </Link>

          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                title={item.label}
                className={({ isActive }) => join('nav-link', isActive && 'active')}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.to === '/notes' && data.notes.length > 0 && <small>{data.notes.length}</small>}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-divider" />
          <div className="sidebar-section-label">Topics</div>

          <nav className="chapter-nav" aria-label="Topics">
            {TOPICS.map((topic) => (
              <Link key={topic.id} to={`/topics#${topic.id}`} title={`Topic ${topic.number}: ${topic.title}`}>
                <span className={join('chapter-dot', topic.color)}>{topic.number}</span>
                <span style={{ fontSize: '11px' }}>{topic.title}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <button
              type="button"
              className="nav-link settings-trigger"
              onClick={() => {
                setMenuOpen(false);
                setSettingsOpen(true);
              }}
              title="Settings"
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>

            <div className="offline-status">
              <SaveStatus />
              {!online && <WifiOff size={13} aria-label="Offline" />}
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
                  setSidebarCollapsed((c) => {
                    const next = !c;
                    localStorage.setItem('cortex_sidebar_collapsed', String(next));
                    return next;
                  });
                }}
                title={sidebarCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
                aria-label={sidebarCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
              >
                {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>

              <Link className="mobile-brand" to="/">
                <Logo small />
              </Link>
            </div>

            <div className="topbar-actions">
              <button
                type="button"
                className="global-search"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={16} />
                <span>Search</span>
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
                  className="button small secondary sign-in-trigger"
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

          {error && (
            <div className="status-banner" role="alert">
              {error}
              <button className="text-button" onClick={() => setSettingsOpen(true)}>
                Backups
              </button>
            </div>
          )}
          {needRefresh && (
            <div className="status-banner" role="status">
              <span>Update available</span>
              <button
                className="button small secondary"
                disabled={saving || !!error || syncState === 'syncing'}
                onClick={async () => {
                  try {
                    await flush();
                    refresh?.();
                  } catch {
                    setToast('Save or export your changes before updating.');
                  }
                }}
              >
                Update app
              </button>
            </div>
          )}
          <main id="main-content">
            {loaded ? (
              <Suspense fallback={<div className="loading-workspace">Loading…</div>}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/topics" element={<TopicBrowser />} />
                  <Route path="/topics/:topicId/:lectureId" element={<LectureReader />} />
                  <Route path="/tree" element={<KnowledgeGraphView />} />
                  <Route path="/graph" element={<KnowledgeGraphView />} />
                  <Route path="/path" element={<StudyPathView />} />
                  <Route path="/papers" element={<PaperPlanner />} />
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
              </Suspense>
            ) : (
              <div className="loading-workspace">
                <LoaderCircle className="spin" size={25} />
                <span>Opening your study room…</span>
              </div>
            )}
          </main>
        </div>
      </div>

      <Suspense fallback={null}>
        {searchOpen && <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />}

        {activePaper && <PdfEmbedViewer paper={activePaper} onClose={closePaper} />}

        {settingsOpen && (
          <SettingsModal
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onShowToast={(msg) => setToast(msg)}
            installEvent={installEvent}
            installed={installed}
            offlineReady={offlineReady}
          />
        )}
      </Suspense>

      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button type="button" className="icon-button" aria-label="Dismiss" onClick={() => setToast('')}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}

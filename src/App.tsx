import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import {
  BookOpen,
  Bookmark,
  ChevronRight,
  Clock3,
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
  Network,
  PanelLeftClose,
  PanelLeftOpen,
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
  ArrowRight,
  PenTool,
  Check,
  X
} from 'lucide-react';

import { documents } from './lib/content';
import { docRoute } from './lib/model';
import { useWorkspace } from './lib/workspace';
import { useAuth } from './lib/auth';
import { ALL_LECTURES, TOPICS } from './lib/curriculum';

import { Dashboard } from './components/Dashboard';
import { TopicBrowser } from './components/TopicBrowser';
import { StudyPathView } from './components/StudyPathView';
import { LectureReader } from './components/LectureReader';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { NotebookView } from './components/NotebookView';
import { SettingsModal } from './components/SettingsModal';
import { SearchModal } from './components/SearchModal';
import { ReferenceReader } from './components/reference/ReferenceReader';
import { ReferenceLibrary as Library } from './components/reference/ReferenceLibrary';
import { usePdfViewer } from './lib/pdfViewerContext';
import { PdfEmbedViewer } from './components/PdfEmbedViewer';

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

// Main App Shell
export default function App() {
  const { data, loaded, error, syncState } = useWorkspace();
  const { user } = useAuth();
  const { activePaper, closePaper } = usePdfViewer();
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
    { to: '/tree', label: 'Knowledge DAG', icon: <Network size={19} /> },
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
                <Route path="/tree" element={<KnowledgeGraphView />} />
                <Route path="/graph" element={<KnowledgeGraphView />} />
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

      {activePaper && (
        <PdfEmbedViewer paper={activePaper} onClose={closePaper} />
      )}

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

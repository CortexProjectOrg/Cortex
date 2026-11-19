import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  CheckCheck,
  Clock3,
  PanelRightClose,
  PencilLine,
  PenTool,
  Plus,
  X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { documentMap } from '../../lib/content';
import { makeNote } from '../../lib/model';
import { useWorkspace } from '../../lib/workspace';
import { useMediaQuery } from '../ui/useMediaQuery';
import { useDrawerFocus } from '../ui/useDrawerFocus';
import { InkCanvas } from '../InkCanvas';
import { MarkdownView } from '../MarkdownView';

const join = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

function Empty({
  icon,
  title,
  children,
  action
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
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

export function ReferenceReader() {
  const params = useParams();
  const id = params['*'] ?? '';
  const doc = documentMap.get(id);
  const location = useLocation();
  const { data, update } = useWorkspace();
  const [notesOpen, setNotesOpen] = useState(false);
  const notesRef = useRef<HTMLElement>(null);
  const overlay = useMediaQuery('(max-width: 1200px)');
  useDrawerFocus(notesRef, notesOpen && overlay, () => setNotesOpen(false));
  const [activeNote, setActiveNote] = useState<string | null>(null);

  useEffect(() => {
    if (!doc) return;
    update((cur) => ({ ...cur, lastRead: { id: doc.id, at: new Date().toISOString() } }));
    setActiveNote(null);
    const timeout = window.setTimeout(() => {
      if (location.hash) {
        try {
          document
            .getElementById(decodeURIComponent(location.hash.slice(1)))
            ?.scrollIntoView({ block: 'start' });
        } catch {
          /* Ignore malformed anchors. */
        }
      } else {
        window.scrollTo(
          0,
          Number(
            localStorage.getItem(`cortex-position:${id}`) ??
              localStorage.getItem(`ainotes-position:${id}`) ??
              0
          )
        );
      }
    }, 80);
    return () => clearTimeout(timeout);
  }, [id, doc, location.hash, update]);

  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(`cortex-position:${id}`, String(Math.round(window.scrollY)));
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
    .filter((n) => n.documentId === id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const note = attached.find((n) => n.id === activeNote) ?? attached[0];
  const read = data.read.includes(id);
  const bookmarked = data.bookmarks.includes(id);

  const toggleRead = () =>
    update((current) => ({
      ...current,
      read: current.read.includes(id) ? current.read.filter((item) => item !== id) : [...current.read, id]
    }));

  const addNote = () => {
    const fresh = makeNote(`Notes on ${doc.title}`, id);
    update((current) => ({ ...current, notes: [fresh, ...current.notes] }));
    setActiveNote(fresh.id);
    setNotesOpen(true);
  };

  const updateActiveNote = (patch: Partial<typeof note>) => {
    if (!note) return;
    update((cur) => ({
      ...cur,
      notes: cur.notes.map((n) =>
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
                update((current) => ({
                  ...current,
                  bookmarks: bookmarked
                    ? current.bookmarks.filter((item) => item !== id)
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
        <aside ref={notesRef} className="reading-notes" style={{ width: '400px' }}>
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
                onChange={(e) => setActiveNote(e.target.value)}
              >
                {attached.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title || 'Untitled Note'}
                  </option>
                ))}
              </select>
              <button type="button" className="icon-button" title="Add another note" onClick={addNote}>
                <Plus size={17} />
              </button>
            </div>
          )}

          {note ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <input
                className="note-title"
                value={note.title}
                onChange={(e) => updateActiveNote({ title: e.target.value })}
                placeholder="Note title"
                style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '6px' }}
              />

              <div style={{ fontSize: '11px', fontWeight: 650, color: 'var(--muted)' }}>STYLUS CANVAS:</div>
              <InkCanvas
                key={note.id}
                initialData={note.inkData}
                onChange={(inkData) => updateActiveNote({ inkData })}
                minHeight={240}
              />

              <div style={{ fontSize: '11px', fontWeight: 650, color: 'var(--muted)' }}>TYPED NOTES:</div>
              <textarea
                className="note-body"
                value={note.body}
                onChange={(e) => updateActiveNote({ body: e.target.value })}
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

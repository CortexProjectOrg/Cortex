import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Download,
  Edit3,
  Eye,
  FileText,
  PenTool,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LECTURE_MAP } from '../lib/curriculumCatalog';
import type { Note } from '../lib/model';
import { lectureRoute, makeNote, noteMarkdown, notePrompt } from '../lib/model';
import { useWorkspace } from '../lib/workspace';
import { InkCanvas } from './InkCanvas';
import { MarkdownView } from './MarkdownView';
import { SaveStatus } from './ui/SaveStatus';

export function NotebookView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, update, syncState } = useWorkspace();
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'lectures' | 'scratchpad'>('all');
  const [activeTab, setActiveTab] = useState<'both' | 'ink' | 'text'>('both');
  const [previewMarkdown, setPreviewMarkdown] = useState(false);

  const notes = [...data.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const filtered = notes.filter((n) => {
    const matchesQuery = `${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;
    if (filterMode === 'lectures') return Boolean(n.lectureId);
    if (filterMode === 'scratchpad') return !n.lectureId;
    return true;
  });

  const selectedNote = notes.find((n) => n.id === id) || (!id ? filtered[0] : undefined);
  const selectedLecture = selectedNote?.lectureId ? LECTURE_MAP.get(selectedNote.lectureId) : null;

  const createNewNote = () => {
    const note = makeNote('Untitled note');
    update((cur) => ({
      ...cur,
      notes: [note, ...cur.notes]
    }));
    navigate(`/notes/${note.id}`);
  };

  const editActiveNote = (patch: Partial<Note>) => {
    if (!selectedNote) return;
    update((cur) => ({
      ...cur,
      notes: cur.notes.map((n) =>
        n.id === selectedNote.id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      )
    }));
  };

  const deleteActiveNote = () => {
    if (!selectedNote) return;
    if (window.confirm(`Delete “${selectedNote.title || 'Untitled note'}”?`)) {
      update((cur) => ({
        ...cur,
        notes: cur.notes.filter((n) => n.id !== selectedNote.id)
      }));
      navigate('/notes');
    }
  };

  const exportNote = () => {
    if (!selectedNote) return;
    const content = noteMarkdown(selectedNote);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNote.title.replace(/[^\w\s-]/g, '').trim() || 'note'}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="page notebook">
      <div className="page-title-row">
        <div>
          <h1>Notebook</h1>
        </div>
        <button type="button" className="button primary" onClick={createNewNote}>
          <Plus size={17} /> New note
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="library-controls" style={{ marginBottom: '16px' }}>
        <div className="filter-tabs">
          {[
            ['all', `All Notes (${notes.length})`],
            ['lectures', `Lecture Notes (${notes.filter((n) => n.lectureId).length})`],
            ['scratchpad', `General Notes (${notes.filter((n) => !n.lectureId).length})`]
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={filterMode === val ? 'active' : ''}
              onClick={() => setFilterMode(val as any)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`notebook-layout ${id ? 'show-editor' : 'show-list'}`}>
        {/* Sidebar Notes List */}
        <aside className="note-list">
          <label className="search-field small" style={{ marginBottom: '12px' }}>
            <Search size={16} />
            <input
              aria-label="Search notes"
              placeholder="Search notes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <div className="note-list-items">
            {filtered.length === 0 && (
              <p className="subtle">{notes.length ? 'No notes match these filters.' : 'No notes yet.'}</p>
            )}
            {filtered.map((note) => {
              const lec = note.lectureId ? LECTURE_MAP.get(note.lectureId) : null;
              const isSelected = selectedNote?.id === note.id;

              return (
                <Link
                  to={`/notes/${note.id}`}
                  key={note.id}
                  className={`note-list-item ${isSelected ? 'active' : ''}`}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>
                      {new Intl.DateTimeFormat(undefined, {
                        month: 'short',
                        day: 'numeric'
                      }).format(new Date(note.updatedAt))}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {note.lectureInk && (
                        <span
                          title="Contains lecture annotations"
                          style={{
                            fontSize: '9px',
                            background: 'var(--soft)',
                            color: 'var(--accent)',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontWeight: 600
                          }}
                        >
                          Annotated
                        </span>
                      )}
                      {note.inkData && <PenTool size={11} style={{ color: 'var(--accent)' }} />}
                      {note.body && <FileText size={11} style={{ color: 'var(--muted)' }} />}
                    </div>
                  </div>
                  <h3>{note.title || 'Untitled Note'}</h3>
                  {lec && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--accent)',
                        marginBottom: '4px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <BookOpen size={10} /> {lec.title}
                    </div>
                  )}
                  <p>{note.body.replace(/[#*`]/g, '').slice(0, 75) || 'Empty note'}</p>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Note Editor Area */}
        <div className="notebook-editor">
          <Link className="text-link notebook-back" to="/notes">
            <ArrowLeft size={16} /> All notes
          </Link>
          {selectedNote ? (
            <div
              className="note-editor-content"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                height: '100%',
                background: 'var(--surface)',
                borderRadius: '9px'
              }}
            >
              {/* Header / Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div className="note-editor-actions">
                  <div className="segmented">
                    <button
                      type="button"
                      className={activeTab === 'both' ? 'selected' : ''}
                      onClick={() => setActiveTab('both')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={activeTab === 'ink' ? 'selected' : ''}
                      onClick={() => setActiveTab('ink')}
                    >
                      <PenTool size={13} style={{ marginRight: '4px' }} />
                      Drawing
                    </button>
                    <button
                      type="button"
                      className={activeTab === 'text' ? 'selected' : ''}
                      onClick={() => setActiveTab('text')}
                    >
                      <FileText size={13} style={{ marginRight: '4px' }} />
                      Text
                    </button>
                  </div>

                  {activeTab !== 'ink' && (
                    <button
                      type="button"
                      className="button small secondary"
                      onClick={() => setPreviewMarkdown(!previewMarkdown)}
                    >
                      {previewMarkdown ? <Edit3 size={13} /> : <Eye size={13} />}
                      <span>{previewMarkdown ? 'Edit' : 'Preview'}</span>
                    </button>
                  )}
                </div>

                <div className="note-editor-actions">
                  <span
                    style={{
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: syncState === 'synced' ? 'var(--accent)' : 'var(--muted)'
                    }}
                  >
                    <SaveStatus />
                  </span>
                  <button
                    type="button"
                    className="icon-button small"
                    title="Export Markdown"
                    onClick={exportNote}
                  >
                    <Download size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-button small"
                    title="Delete Note"
                    onClick={deleteActiveNote}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Title input */}
              <input
                className="note-title"
                style={{
                  fontSize: '22px',
                  fontFamily: 'var(--serif)',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '4px 0'
                }}
                value={selectedNote.title}
                onChange={(e) => editActiveNote({ title: e.target.value })}
                placeholder="Note title"
                aria-label="Note title"
              />

              {selectedLecture && (
                <Link className="text-link" to={lectureRoute(selectedLecture.topicId, selectedLecture.id)}>
                  {selectedLecture.title}
                  {selectedNote.lectureInk ? ' · Annotated' : ''}
                  <ArrowUpRight size={14} />
                </Link>
              )}

              {/* Tablet Pen Drawing Canvas */}
              {(activeTab === 'both' || activeTab === 'ink') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 650,
                      color: 'var(--muted)',
                      letterSpacing: '0.8px'
                    }}
                  >
                    Drawing
                  </div>
                  <InkCanvas
                    key={selectedNote.id}
                    initialData={selectedNote.inkData}
                    onChange={(inkData) => editActiveNote({ inkData })}
                    minHeight={activeTab === 'ink' ? 520 : 340}
                  />
                </div>
              )}

              {/* Typed Markdown Notes */}
              {(activeTab === 'both' || activeTab === 'text') && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    flex: 1,
                    minHeight: '200px'
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 650,
                      color: 'var(--muted)',
                      letterSpacing: '0.8px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Notes</span>
                    <button
                      type="button"
                      className="text-button"
                      style={{ fontSize: '11px' }}
                      onClick={() =>
                        editActiveNote({
                          body: selectedNote.body ? `${selectedNote.body}\n\n${notePrompt}` : notePrompt
                        })
                      }
                    >
                      Insert template
                    </button>
                  </div>

                  {previewMarkdown ? (
                    <div
                      style={{
                        padding: '14px',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        minHeight: '180px',
                        background: 'var(--surface)'
                      }}
                    >
                      <MarkdownView source={selectedNote.body || '_No written reflections yet._'} />
                    </div>
                  ) : (
                    <textarea
                      style={{
                        width: '100%',
                        flex: 1,
                        minHeight: '180px',
                        padding: '14px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        resize: 'vertical'
                      }}
                      value={selectedNote.body}
                      onChange={(e) => editActiveNote({ body: e.target.value })}
                      placeholder="Write a note…"
                      aria-label="Note body"
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <BookOpen
                size={34}
                style={{ color: 'var(--muted)', display: 'block', margin: '0 auto 12px' }}
              />
              <h3>{id ? 'Note not found' : 'No note selected'}</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '8px 0 20px' }}>
                Choose a note or create one to get started.
              </p>
              <button type="button" className="button primary" onClick={createNewNote}>
                <Plus size={16} /> New note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  BookOpen,
  Trash2,
  Download,
  PenTool,
  Check,
  LoaderCircle,
  Eye,
  Edit3,
  Cloud,
  FileText,
  ArrowRight,
  Layers,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useWorkspace } from '../lib/workspace';
import { makeNote, noteMarkdown, notePrompt, lectureRoute } from '../lib/model';
import type { Note } from '../lib/model';
import { InkCanvas } from './InkCanvas';
import { MarkdownView } from './MarkdownView';
import { LECTURE_MAP, TOPICS } from '../lib/curriculum';

export function NotebookView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, update, saving, syncState } = useWorkspace();
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'lectures' | 'scratchpad'>('all');
  const [activeTab, setActiveTab] = useState<'both' | 'ink' | 'text'>('both');
  const [previewMarkdown, setPreviewMarkdown] = useState(false);

  const notes = [...data.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const filtered = notes.filter(n => {
    const matchesQuery = `${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;
    if (filterMode === 'lectures') return Boolean(n.lectureId);
    if (filterMode === 'scratchpad') return !n.lectureId;
    return true;
  });

  const selectedNote = notes.find(n => n.id === id) || (!id ? filtered[0] : undefined);
  const selectedLecture = selectedNote?.lectureId ? LECTURE_MAP.get(selectedNote.lectureId) : null;

  const createNewNote = () => {
    const note = makeNote('General Scratchpad Note');
    update(cur => ({
      ...cur,
      notes: [note, ...cur.notes]
    }));
    navigate(`/notes/${note.id}`);
  };

  const editActiveNote = (patch: Partial<Note>) => {
    if (!selectedNote) return;
    update(cur => ({
      ...cur,
      notes: cur.notes.map(n =>
        n.id === selectedNote.id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      )
    }));
  };

  const deleteActiveNote = () => {
    if (!selectedNote) return;
    if (window.confirm(`Delete “${selectedNote.title || 'Untitled note'}”?`)) {
      update(cur => ({
        ...cur,
        notes: cur.notes.filter(n => n.id !== selectedNote.id)
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
          <span className="eyebrow">NOTES & DERIVATIONS</span>
          <h1>Notebook</h1>
          <p>
            Stylus sketches, equations, and reflections from lectures and scratchpad.
          </p>
        </div>
        <button type="button" className="button primary" onClick={createNewNote}>
          <Plus size={17} /> New Scratchpad Note
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="library-controls" style={{ marginBottom: '16px' }}>
        <div className="filter-tabs">
          {[
            ['all', `All Notes (${notes.length})`],
            [
              'lectures',
              `Lecture Notes (${notes.filter(n => n.lectureId).length})`
            ],
            [
              'scratchpad',
              `General Notes (${notes.filter(n => !n.lectureId).length})`
            ]
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

      <div className="notebook-layout">
        {/* Sidebar Notes List */}
        <aside className="note-list">
          <label className="search-field small" style={{ marginBottom: '12px' }}>
            <Search size={16} />
            <input
              aria-label="Search notes"
              placeholder="Search derivations & formulas..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </label>

          <div className="note-list-items">
            {filtered.map(note => {
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
                          title="Contains direct fluid annotations on lecture text"
                          style={{
                            fontSize: '9px',
                            background: 'var(--soft)',
                            color: 'var(--accent)',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontWeight: 600
                          }}
                        >
                          Doc Ink
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
                  <p>{note.body.replace(/[#*`]/g, '').slice(0, 75) || 'Stylus drawing & notes...'}</p>
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <p className="subtle" style={{ padding: '16px', textAlign: 'center' }}>
                No matching notes found.
              </p>
            )}
          </div>
        </aside>

        {/* Note Editor Area */}
        <div className="notebook-editor">
          {selectedNote ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                height: '100%',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '9px',
                padding: '24px'
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      Pen Canvas
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: syncState === 'synced' ? 'var(--accent)' : 'var(--muted)'
                    }}
                  >
                    {saving ? (
                      <>
                        <LoaderCircle size={12} className="spin" /> Saving locally
                      </>
                    ) : syncState === 'synced' ? (
                      <>
                        <Cloud size={13} /> Synced to cloud
                      </>
                    ) : (
                      <>
                        <Check size={12} /> Saved locally
                      </>
                    )}
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
                onChange={e => editActiveNote({ title: e.target.value })}
                placeholder="Give this thought or derivation a title"
              />

              {/* Associated Lecture Callout */}
              {selectedLecture && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--soft)',
                    border: '1px solid #dce2d2'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <BookOpen size={14} style={{ color: 'var(--accent)' }} />
                    <span>
                      Associated with Lecture:{' '}
                      <strong>{selectedLecture.title}</strong> (Pack {selectedLecture.packNumber}, Slot {selectedLecture.packSlot})
                    </span>
                  </div>
                  <Link
                    to={lectureRoute(selectedLecture.topicId, selectedLecture.id)}
                    className="text-link"
                    style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    Go to Lecture <ArrowUpRight size={12} />
                  </Link>
                </div>
              )}

              {/* Direct Lecture Inking Callout */}
              {selectedNote.lectureInk && selectedLecture && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#f4f6ef',
                    border: '1px solid #d5dfc9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <PenTool size={14} style={{ color: 'var(--accent)' }} />
                    <span>
                      Fluid pen and highlighter annotations are active on this lecture.
                    </span>
                  </div>
                  <Link
                    to={lectureRoute(selectedLecture.topicId, selectedLecture.id)}
                    className="button small primary"
                    style={{ fontSize: '11px', padding: '4px 10px', minHeight: '28px', textDecoration: 'none' }}
                  >
                    View Annotated Lecture <ArrowRight size={12} />
                  </Link>
                </div>
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
                    PEN / STYLUS DRAWING SURFACE:
                  </div>
                  <InkCanvas
                    initialData={selectedNote.inkData}
                    onChange={inkData => editActiveNote({ inkData })}
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
                    <span>TYPED REFLECTIONS & LATEX EQUATIONS:</span>
                    <button
                      type="button"
                      className="text-button"
                      style={{ fontSize: '11px' }}
                      onClick={() =>
                        editActiveNote({
                          body: selectedNote.body
                            ? `${selectedNote.body}\n\n${notePrompt}`
                            : notePrompt
                        })
                      }
                    >
                      + Add Reflection Template
                    </button>
                  </div>

                  {previewMarkdown ? (
                    <div
                      style={{
                        padding: '14px',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        minHeight: '180px',
                        background: '#fff'
                      }}
                    >
                      <MarkdownView
                        source={selectedNote.body || '_No written reflections yet._'}
                      />
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
                      onChange={e => editActiveNote({ body: e.target.value })}
                      placeholder="Type formulas ($...$), notes, or open questions here..."
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
              <h3>No note selected</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '8px 0 20px' }}>
                Select a lecture note from the list or create a general scratchpad note.
              </p>
              <button type="button" className="button primary" onClick={createNewNote}>
                <Plus size={16} /> Create Scratchpad Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

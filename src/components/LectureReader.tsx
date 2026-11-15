import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCode,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  PenTool,
  PencilLine,
  Plus,
  Trash2,
  Download
} from 'lucide-react';
import { LECTURE_MAP, ALL_LECTURES, TOPICS } from '../lib/curriculum';
import { useWorkspace } from '../lib/workspace';
import { makeNote, lectureRoute, noteMarkdown } from '../lib/model';
import { MarkdownView } from './MarkdownView';
import { InkCanvas } from './InkCanvas';

export function LectureReader() {
  const { topicId, lectureId } = useParams();
  const navigate = useNavigate();
  const { data, update } = useWorkspace();

  const lecture = (lectureId && LECTURE_MAP.get(lectureId)) || ALL_LECTURES[0];
  const topic = TOPICS.find(t => t.id === lecture.topicId) || TOPICS[0];

  const [notesOpen, setNotesOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Find next lecture in order
  const currentIndex = ALL_LECTURES.findIndex(l => l.id === lecture.id);
  const nextLecture = ALL_LECTURES[currentIndex + 1];
  const prevLecture = ALL_LECTURES[currentIndex - 1];

  const isCompleted = data.completedLectures?.includes(lecture.id);

  // Find notes associated with this lecture
  const lectureNotes = data.notes.filter(n => n.lectureId === lecture.id || n.documentId === lecture.id);
  const activeNote = lectureNotes.find(n => n.id === activeNoteId) || lectureNotes[0];

  // Remember reading position and last read
  useEffect(() => {
    update(cur => ({
      ...cur,
      lastRead: {
        id: lecture.id,
        at: new Date().toISOString()
      }
    }));
    window.scrollTo(0, 0);
  }, [lecture.id, update]);

  const toggleCompleted = () => {
    update(cur => {
      const existing = cur.completedLectures || [];
      const updated = existing.includes(lecture.id)
        ? existing.filter(id => id !== lecture.id)
        : [...existing, lecture.id];

      return {
        ...cur,
        completedLectures: updated,
        lectureProgress: {
          ...cur.lectureProgress,
          [lecture.id]: {
            status: updated.includes(lecture.id) ? 'completed' : 'in-progress',
            completedAt: updated.includes(lecture.id) ? new Date().toISOString() : undefined
          }
        }
      };
    });
  };

  const createNote = () => {
    const note = makeNote(`Notes on ${lecture.title}`, undefined, lecture.id);
    update(cur => ({
      ...cur,
      notes: [note, ...cur.notes]
    }));
    setActiveNoteId(note.id);
    setNotesOpen(true);
  };

  const updateActiveNote = (patch: Partial<typeof activeNote>) => {
    if (!activeNote) return;
    update(cur => ({
      ...cur,
      notes: cur.notes.map(n =>
        n.id === activeNote.id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      )
    }));
  };

  const deleteActiveNote = () => {
    if (!activeNote) return;
    if (window.confirm('Delete this note from this device?')) {
      update(cur => ({
        ...cur,
        notes: cur.notes.filter(n => n.id !== activeNote.id)
      }));
      setActiveNoteId(null);
    }
  };

  return (
    <div className={`reading-layout ${notesOpen ? 'with-notes' : ''}`}>
      <div className="reading-main">
        {/* Navigation Toolbar */}
        <div className="reader-toolbar">
          <Link className="breadcrumb" to="/path">
            <ArrowLeft size={14} /> Sunday {lecture.sundaySession} · Slot {lecture.sundaySlot}
          </Link>
          <div className="toolbar-actions">
            <button
              type="button"
              className={`button small ${isCompleted ? 'soft' : 'secondary'}`}
              onClick={toggleCompleted}
            >
              {isCompleted ? <CheckCircle2 size={16} /> : <Check size={16} />}
              <span>{isCompleted ? 'Lecture Mastered' : 'Mark as Mastered'}</span>
            </button>
            <button
              type="button"
              className={`button small ${notesOpen ? 'soft' : 'secondary'}`}
              onClick={() => setNotesOpen(!notesOpen)}
            >
              {notesOpen ? <PanelRightClose size={16} /> : <PenTool size={16} />}
              <span>Stylus Notes</span>
              {lectureNotes.length > 0 && <span className="count-pill">{lectureNotes.length}</span>}
            </button>
          </div>
        </div>

        {/* Lecture Article */}
        <article className="article">
          <header className="article-heading">
            <div className="article-meta">
              <span className="eyebrow">
                TOPIC {topic.number}: {topic.title.toUpperCase()} · SUNDAY {lecture.sundaySession}, SLOT{' '}
                {lecture.sundaySlot}
              </span>
              <span>
                <Clock3 size={13} /> 60 min true effort
              </span>
            </div>
            <h1>{lecture.title}</h1>
            <p
              style={{
                fontSize: '17px',
                color: 'var(--muted)',
                lineHeight: '1.5',
                margin: '12px 0 20px'
              }}
            >
              {lecture.subtitle}
            </p>
            <div className="article-rule" />
          </header>

          {/* Central Question Callout */}
          <div
            style={{
              background: 'var(--soft, #e9eee3)',
              borderLeft: '4px solid var(--accent, #3a5d49)',
              padding: '18px 24px',
              borderRadius: '0 8px 8px 0',
              marginBottom: '32px'
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: 'var(--accent)',
                display: 'block',
                marginBottom: '4px'
              }}
            >
              THE CORE QUESTION OF THIS HOUR
            </span>
            <p
              style={{
                fontSize: '16px',
                fontFamily: 'var(--serif)',
                margin: 0,
                color: 'var(--ink)'
              }}
            >
              {lecture.question}
            </p>
          </div>

          {/* Section 1: Motivation */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', marginBottom: '12px' }}>
              1. Motivation & Mathematical Invariants
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--ink)' }}>
              {lecture.content.motivation}
            </p>
          </section>

          {/* Section 2: Mathematical Theory & Derivation */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', marginBottom: '16px' }}>
              2. Theory & Formal Derivation
            </h2>
            <MarkdownView source={lecture.content.theory} />
          </section>

          {/* Section 3: Worked Example */}
          <section
            style={{
              background: '#f9f9f5',
              border: '1px solid var(--line, #e2e4da)',
              borderRadius: '9px',
              padding: '24px',
              marginBottom: '36px'
            }}
          >
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '22px', marginBottom: '14px' }}>
              3. Step-by-Step Worked Example
            </h2>
            <MarkdownView source={lecture.content.workedExample} />
          </section>

          {/* Section 4: QuAOS-Lab Codebase Connection */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', marginBottom: '16px' }}>
              4. Inside the QuAOS-Lab Codebase
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px'
              }}
            >
              {lecture.codeReferences.map((ref, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    background: 'var(--surface)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px'
                    }}
                  >
                    <FileCode size={16} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 650 }}>
                      <code>
                        {ref.crate}/{ref.filePath}
                      </code>
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                    <strong>Key symbols:</strong> {ref.symbols.map(s => `\`${s}\``).join(', ')}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink)' }}>{ref.purpose}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
                Implementation Choices & Tradeoffs:
              </h4>
              <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.7' }}>
                {lecture.implementationChoices.map((choice, i) => (
                  <li key={i}>{choice}</li>
                ))}
              </ul>
            </div>

            <MarkdownView source={lecture.content.codeWalkthrough} />
          </section>

          {/* Section 5: Associated Research Papers */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', marginBottom: '14px' }}>
              5. Associated Papers & Primary Literature
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lecture.paperReferences.map((p, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '16px',
                    background: 'var(--surface)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '15px', margin: '0 0 4px', fontWeight: 600 }}>
                        {p.title}
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                        {p.authors} · <em>{p.citation}</em>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--accent)' }}>
                        <strong>Sections to read:</strong> {p.relevantSections}
                      </div>
                    </div>
                    {p.arxivUrl && (
                      <a
                        href={p.arxivUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="button small secondary"
                        style={{ flexShrink: 0, textDecoration: 'none' }}
                      >
                        Read arXiv <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 6: Exercise */}
          <section
            style={{
              background: '#fcfcf7',
              border: '1px solid #d9decb',
              borderRadius: '9px',
              padding: '24px',
              marginBottom: '40px'
            }}
          >
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '22px', marginBottom: '12px' }}>
              6. Paper & Pencil Exercise
            </h2>
            <MarkdownView source={lecture.content.exercise} />
          </section>

          {/* Bottom Actions */}
          <div className="reader-pagination">
            {prevLecture ? (
              <Link
                className="button secondary"
                to={lectureRoute(prevLecture.topicId, prevLecture.id)}
              >
                <ArrowLeft size={16} /> Slot {prevLecture.sundaySlot}: {prevLecture.title}
              </Link>
            ) : (
              <span />
            )}

            <button
              type="button"
              className={`button ${isCompleted ? 'soft' : 'primary'}`}
              onClick={toggleCompleted}
            >
              {isCompleted ? <CheckCircle2 size={17} /> : <Check size={17} />}
              {isCompleted ? 'Completed' : 'Mark Slot Completed'}
            </button>

            {nextLecture ? (
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  if (!isCompleted) toggleCompleted();
                  navigate(lectureRoute(nextLecture.topicId, nextLecture.id));
                }}
              >
                Next Slot: {nextLecture.title} <ArrowRight size={16} />
              </button>
            ) : (
              <Link className="button primary" to="/path">
                View Full Path <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </article>
      </div>

      {/* Stylus Pen Notes Drawer / Side Panel */}
      {notesOpen && (
        <aside className="reading-notes" style={{ width: '420px', maxWidth: '90vw' }}>
          <div className="notes-panel-heading">
            <div>
              <span className="eyebrow">TABLET STYLUS & PEN NOTES</span>
              <h3>Derivations & Sketches</h3>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Close notes panel"
              onClick={() => setNotesOpen(false)}
            >
              ✕
            </button>
          </div>

          {lectureNotes.length > 0 && (
            <div className="attached-note-select" style={{ marginBottom: '12px' }}>
              <select
                aria-label="Select note"
                value={activeNote?.id}
                onChange={e => setActiveNoteId(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', borderRadius: '6px' }}
              >
                {lectureNotes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.title || 'Untitled Note'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-button"
                title="Create another note"
                onClick={createNote}
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          {activeNote ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <input
                className="note-title"
                value={activeNote.title}
                onChange={e => updateActiveNote({ title: e.target.value })}
                placeholder="Give this derivation a title"
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  padding: '8px 12px'
                }}
              />

              {/* Tablet Pen Canvas */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 650,
                    letterSpacing: '0.8px',
                    color: 'var(--muted)',
                    marginBottom: '6px'
                  }}
                >
                  DRAWING CANVAS (PEN / STYLUS):
                </div>
                <InkCanvas
                  initialData={activeNote.inkData}
                  onChange={inkData => updateActiveNote({ inkData })}
                  minHeight={260}
                />
              </div>

              {/* Text reflection below */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 650,
                    letterSpacing: '0.8px',
                    color: 'var(--muted)',
                    marginBottom: '6px'
                  }}
                >
                  TYPED REFLECTIONS & FORMULAS:
                </div>
                <textarea
                  className="note-body"
                  value={activeNote.body}
                  onChange={e => updateActiveNote({ body: e.target.value })}
                  placeholder="Notes, formulas, or questions for this lecture..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    fontFamily: 'inherit',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '10px'
                }}
              >
                <button
                  type="button"
                  className="icon-button"
                  title="Delete note"
                  onClick={deleteActiveNote}
                >
                  <Trash2 size={16} />
                </button>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  Auto-saved & synced across devices
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 12px' }}>
              <PencilLine
                size={28}
                style={{ color: 'var(--muted)', display: 'block', margin: '0 auto 12px' }}
              />
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
                No stylus notes for this lecture yet.
              </p>
              <button type="button" className="button primary" onClick={createNote}>
                <Plus size={15} /> Start Pen Note
              </button>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

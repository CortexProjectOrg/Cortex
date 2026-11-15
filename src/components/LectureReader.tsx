import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  PanelRightClose,
  PanelRightOpen,
  PenTool,
  PencilLine,
  Trash2,
  Download,
  Bookmark,
  Sparkles,
  Link2,
  Eye,
  Edit3
} from 'lucide-react';
import { LECTURE_MAP, ALL_LECTURES, TOPICS } from '../lib/curriculum';
import { useWorkspace } from '../lib/workspace';
import { makeNote, lectureRoute } from '../lib/model';
import type { Note } from '../lib/model';
import { MarkdownView } from './MarkdownView';
import { InkCanvas } from './InkCanvas';
import { DocumentInkOverlay } from './DocumentInkOverlay';
import { MathFormula } from './MathFormula';

export function LectureReader() {
  const { topicId, lectureId } = useParams();
  const navigate = useNavigate();
  const { data, update } = useWorkspace();

  const lecture = (lectureId && LECTURE_MAP.get(lectureId)) || ALL_LECTURES[0];
  const topic = TOPICS.find(t => t.id === lecture.topicId) || TOPICS[0];

  const [notesOpen, setNotesOpen] = useState(true); // Open by default for easy note-taking
  const [previewNotes, setPreviewNotes] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  // Find next and previous lectures in syllabus sequence
  const currentIndex = ALL_LECTURES.findIndex(l => l.id === lecture.id);
  const nextLecture = ALL_LECTURES[currentIndex + 1];
  const prevLecture = ALL_LECTURES[currentIndex - 1];

  const isCompleted = data.completedLectures?.includes(lecture.id);

  // AUTOMATIC NOTE ASSOCIATION:
  // Automatically find or create the note associated with this lecture
  const existingNote = data.notes.find(
    n => n.lectureId === lecture.id || n.documentId === lecture.id
  );

  // Ensure an associated note exists as soon as lecture is loaded
  useEffect(() => {
    if (!existingNote && data.notes) {
      const autoNote = makeNote(`Notes: ${lecture.title}`, undefined, lecture.id);
      update(cur => ({
        ...cur,
        notes: [autoNote, ...cur.notes]
      }));
    }
  }, [lecture.id, lecture.title, existingNote, update, data.notes]);

  const activeNote = existingNote || {
    id: `auto-${lecture.id}`,
    title: `Notes: ${lecture.title}`,
    body: '',
    lectureId: lecture.id,
    lectureInk: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Track reading position and last read
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

  // Keyboard shortcut: toggle notes panel with 'N'
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        (e.key === 'n' || e.key === 'N') &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setNotesOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

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

  const updateActiveNote = useCallback(
    (patch: Partial<Note>) => {
      update(cur => {
        const found = cur.notes.some(n => n.id === activeNote.id || n.lectureId === lecture.id);
        if (found) {
          return {
            ...cur,
            notes: cur.notes.map(n =>
              n.id === activeNote.id || n.lectureId === lecture.id
                ? { ...n, ...patch, updatedAt: new Date().toISOString() }
                : n
            )
          };
        } else {
          // If note was virtual, insert it
          const freshNote: Note = {
            ...activeNote,
            ...patch,
            updatedAt: new Date().toISOString()
          };
          return {
            ...cur,
            notes: [freshNote, ...cur.notes]
          };
        }
      });
    },
    [activeNote, lecture.id, update]
  );

  return (
    <div className={`reading-layout ${notesOpen ? 'with-notes' : ''}`}>
      <div className="reading-main">
        {/* Navigation Toolbar */}
        <div className="reader-toolbar">
          <Link className="breadcrumb" to="/path">
            <ArrowLeft size={14} /> Pack {lecture.packNumber} · Slot {lecture.packSlot}
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

            {/* Easy-to-toggle Note Taker button */}
            <button
              type="button"
              className={`button small ${notesOpen ? 'soft' : 'primary'}`}
              onClick={() => setNotesOpen(!notesOpen)}
              title="Toggle Note Taker (Shortcut: N)"
            >
              {notesOpen ? <PanelRightClose size={16} /> : <PenTool size={16} />}
              <span>{notesOpen ? 'Hide Notes' : 'Open Scratchpad & Stylus'}</span>
              <kbd style={{ fontSize: '9px', opacity: 0.7, marginLeft: '4px' }}>N</kbd>
            </button>
          </div>
        </div>

        {/* Lecture Article Content with Direct Fluid Ink Overlay */}
        <article className="article" ref={articleRef} style={{ position: 'relative' }}>
          <DocumentInkOverlay
            key={lecture.id}
            initialData={activeNote.lectureInk}
            onChange={lectureInk => updateActiveNote({ lectureInk })}
            containerRef={articleRef}
            onToggleSideNotes={() => setNotesOpen(!notesOpen)}
            sideNotesOpen={notesOpen}
          />

          <header className="article-heading">
            <div className="article-meta">
              <span className="eyebrow">
                TOPIC {topic.number}: {topic.title.toUpperCase()} · 4H PACK {lecture.packNumber}, SLOT{' '}
                {lecture.packSlot}
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
              marginBottom: '28px'
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
              CORE QUESTION
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

          {/* Theoretical Citations & Formal Formula References */}
          {lecture.theoreticalCitations && lecture.theoreticalCitations.length > 0 && (
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--line, #e2e4da)',
                borderRadius: '8px',
                padding: '18px 22px',
                marginBottom: '32px'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: 'var(--accent)',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <BookOpen size={14} /> THEORETICAL FORMULAS & PRIMARY CITATIONS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {lecture.theoreticalCitations.map((cite, i) => (
                  <div
                    key={i}
                    style={{
                      borderLeft: '3px solid #8caa7c',
                      paddingLeft: '14px',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ fontWeight: 650, color: 'var(--ink)', marginBottom: '4px' }}>
                      {cite.formulaName}:
                    </div>
                    <MathFormula math={cite.expression} display={true} />
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                      Source: <em>{cite.source}</em> · {cite.theoremOrEquation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              2. Theory & Formal Derivations
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

          {/* Section 4: Canonical Systems Architecture */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', marginBottom: '16px' }}>
              4. Systems & Implementation Architecture
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
                    <strong>Key patterns & symbols:</strong>{' '}
                    {ref.symbols.map(s => `\`${s}\``).join(', ')}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink)' }}>{ref.purpose}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
                Algorithmic & Engineering Choices:
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
              5. Primary Literature & Research Papers
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
                      gap: '12px',
                      flexWrap: 'wrap'
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
                        Read Paper <ExternalLink size={12} />
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
              6. Paper & Pencil Exercise — Test Your Understanding
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
              Work out this exercise right in the stylus scratchpad on the right:
            </p>
            <MarkdownView source={lecture.content.exercise} />
          </section>

          {/* Bottom Navigation */}
          <div className="reader-pagination">
            {prevLecture ? (
              <Link
                className="button secondary"
                to={lectureRoute(prevLecture.topicId, prevLecture.id)}
              >
                <ArrowLeft size={16} /> Slot {prevLecture.packSlot}: {prevLecture.title}
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
              {isCompleted ? 'Mastered' : 'Mark Slot Mastered'}
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
                View Full Mastery Path <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </article>
      </div>

      {/* EASY-TO-TOGGLE STYLUS & PEN NOTE TAKER */}
      {notesOpen && (
        <aside className="reading-notes" style={{ width: '450px', maxWidth: '92vw' }}>
          <div className="notes-panel-heading">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="eyebrow">STYLUS & PEN SCRATCHPAD</span>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--accent)',
                    background: 'var(--soft)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title="This note is automatically associated with this lecture and saved in your Notebook"
                >
                  <Link2 size={10} /> Auto-collected
                </span>
              </div>
              <h3 style={{ fontSize: '18px', marginTop: '2px' }}>Test Your Understanding</h3>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Hide notes panel"
              title="Hide notes (Shortcut: N)"
              onClick={() => setNotesOpen(false)}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              flex: 1,
              overflowY: 'auto'
            }}
          >
            {/* Tablet Stylus Canvas */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 650,
                  letterSpacing: '0.8px',
                  color: 'var(--muted)',
                  marginBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>PEN & STYLUS SURFACE:</span>
                <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  Pressure-sensitive ink
                </span>
              </div>
              <InkCanvas
                initialData={activeNote.inkData}
                onChange={inkData => updateActiveNote({ inkData })}
                minHeight={290}
              />
            </div>

            {/* Typed Notes & Derivations */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 650,
                  letterSpacing: '0.8px',
                  color: 'var(--muted)',
                  marginBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>TYPED DERIVATIONS & REFLECTIONS:</span>
                <button
                  type="button"
                  onClick={() => setPreviewNotes(!previewNotes)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                  title="Toggle Math & Markdown Preview"
                >
                  {previewNotes ? <Edit3 size={11} /> : <Eye size={11} />}
                  <span>{previewNotes ? 'Edit' : 'Preview Math'}</span>
                </button>
              </div>

              {previewNotes ? (
                <div
                  style={{
                    width: '100%',
                    minHeight: '115px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    overflowX: 'auto'
                  }}
                >
                  <MarkdownView source={activeNote.body || '_No typed notes yet. Type LaTeX math using $...$._'} />
                </div>
              ) : (
                <textarea
                  className="note-body"
                  value={activeNote.body}
                  onChange={e => updateActiveNote({ body: e.target.value })}
                  placeholder="Test your derivations, write notes ($...$), or record questions..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    lineHeight: '1.6'
                  }}
                />
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'auto',
                paddingTop: '10px',
                borderTop: '1px solid var(--line)'
              }}
            >
              <Link
                to={`/notes/${activeNote.id}`}
                className="text-link"
                style={{ fontSize: '11px' }}
              >
                Open in Full Notebook <ArrowRight size={12} />
              </Link>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Auto-saved & synced across devices
              </span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

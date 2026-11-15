import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  PanelRightClose,
  PenTool
} from 'lucide-react';
import { LECTURE_MAP, ALL_LECTURES, TOPICS } from '../lib/curriculum';
import { getKnowledgeDAG } from '../lib/knowledgeGraph';
import { useWorkspace } from '../lib/workspace';
import { makeNote, lectureRoute } from '../lib/model';
import type { Note } from '../lib/model';
import { MarkdownView } from './MarkdownView';
import { DocumentInkOverlay } from './DocumentInkOverlay';
import { usePdfViewer } from '../lib/pdfViewerContext';
import { LectureDagPanel } from './reader/LectureDagPanel';
import { TheoreticalCitationsPanel } from './reader/TheoreticalCitationsPanel';
import { SystemsArchitecturePanel } from './reader/SystemsArchitecturePanel';
import { PrimaryLiteraturePanel } from './reader/PrimaryLiteraturePanel';
import { LectureMarginGutter } from './reader/LectureMarginGutter';
import { LectureScratchpadPanel } from './reader/LectureScratchpadPanel';

export function LectureReader() {
  const { topicId, lectureId } = useParams();
  const navigate = useNavigate();
  const { data, update } = useWorkspace();
  const { openPaper } = usePdfViewer();

  const lecture = (lectureId && LECTURE_MAP.get(lectureId)) || ALL_LECTURES[0];
  const topic = TOPICS.find(t => t.id === lecture.topicId) || TOPICS[0];
  const dag = useMemo(() => getKnowledgeDAG(), []);
  const dagNode = lecture ? dag.nodes.get(lecture.id) : null;

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesWidth, setNotesWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ainotes_side_notes_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 320 && parsed <= 850) {
          return parsed;
        }
      }
    }
    return 440;
  });
  const [isResizingNotes, setIsResizingNotes] = useState(false);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(440);

  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizingNotes(true);
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = notesWidth;
  };

  useEffect(() => {
    if (!isResizingNotes) return;

    const handlePointerMove = (e: PointerEvent) => {
      // Panel is anchored on right side of viewport: moving left increases width
      const deltaX = resizeStartXRef.current - e.clientX;
      const maxWidth = Math.min(850, window.innerWidth - 60);
      const newWidth = Math.max(320, Math.min(maxWidth, resizeStartWidthRef.current + deltaX));
      setNotesWidth(newWidth);
    };

    const handlePointerUp = () => {
      setIsResizingNotes(false);
      localStorage.setItem('ainotes_side_notes_width', String(notesWidth));
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizingNotes, notesWidth]);

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

        {/* Canonical Academic Reading Sheet with Fluid Ink Overlay & Preserved Marginalia */}
        <DocumentInkOverlay
          key={lecture.id}
          initialData={activeNote.lectureInk}
          onChange={lectureInk => updateActiveNote({ lectureInk })}
          onToggleSideNotes={() => setNotesOpen(!notesOpen)}
          sideNotesOpen={notesOpen}
          sideNotesWidth={notesWidth}
        >
          {/* Column 1: Main Lecture Text & Derivations (640px invariant width) */}
          <article className="article sheet-content-column" ref={articleRef} style={{ position: 'relative' }}>
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

          {/* Knowledge Tree & Dependency DAG Panel */}
          {dagNode && (
            <LectureDagPanel
              dagNode={dagNode}
              dag={dag}
              lectureId={lecture.id}
              completedLectures={data.completedLectures}
            />
          )}

          {/* Theoretical Citations & Primary Formulas Panel */}
          <TheoreticalCitationsPanel
            citations={lecture.theoreticalCitations}
            onOpenPaper={openPaper}
          />

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
          <SystemsArchitecturePanel
            codeReferences={lecture.codeReferences}
            implementationChoices={lecture.implementationChoices}
            codeWalkthrough={lecture.content.codeWalkthrough}
          />

          {/* Section 5: Associated Research Papers */}
          <PrimaryLiteraturePanel
            paperReferences={lecture.paperReferences}
            onOpenPaper={openPaper}
          />

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

        {/* Column 2: Dedicated Preserved Margin Column (240px invariant width) */}
        <LectureMarginGutter />
      </DocumentInkOverlay>
      </div>

      {/* EASY-TO-TOGGLE STYLUS & PEN NOTE TAKER */}
      <LectureScratchpadPanel
        notesOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
        notesWidth={notesWidth}
        isResizingNotes={isResizingNotes}
        onResizeStart={handleResizeStart}
        activeNote={activeNote}
        onUpdateActiveNote={updateActiveNote}
      />
    </div>
  );
}

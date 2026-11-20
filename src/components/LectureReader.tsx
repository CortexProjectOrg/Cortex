import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, PanelRightClose, PenTool } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ALL_LECTURES,
  getLectureEdition,
  LECTURE_MAP,
  TOPICS,
  LEGACY_LECTURE_MAP,
  LEGACY_TOPICS,
  REVISION_FOUR_LECTURES,
  REVISION_FOUR_TOPICS
} from '../lib/curriculum';
import { formatStudyTime } from '../lib/studyTime';
import { parseInkData } from '../lib/ink';
import { buildKnowledgeDAG, getKnowledgeDAG } from '../lib/knowledgeGraph';
import type { Note } from '../lib/model';
import { lectureRoute, makeNote } from '../lib/model';
import { usePdfViewer } from '../lib/pdfViewerContext';
import { toggleLecture } from '../lib/progress';
import { useWorkspace } from '../lib/workspace';
import { lectureVisualPlacements, type LectureVisualSection } from '../lib/lectureVisualPlacements';
import { DocumentInkOverlay } from './DocumentInkOverlay';
import { MarkdownView } from './MarkdownView';
import { LectureDagPanel } from './reader/LectureDagPanel';
import { LectureMarginGutter } from './reader/LectureMarginGutter';
import { LectureScratchpadPanel } from './reader/LectureScratchpadPanel';
import { PrimaryLiteraturePanel } from './reader/PrimaryLiteraturePanel';
import { SystemsArchitecturePanel } from './reader/SystemsArchitecturePanel';
import { TheoreticalCitationsPanel } from './reader/TheoreticalCitationsPanel';
import { LectureWidget } from './reader/LectureWidget';

export function LectureReader() {
  const { topicId, lectureId } = useParams();
  const lecture = lectureId && LECTURE_MAP.get(lectureId);
  if (!lecture || (lecture.topicId !== topicId && LEGACY_LECTURE_MAP.get(lecture.id)?.topicId !== topicId))
    return (
      <div className="page">
        <h1>Lecture not found</h1>
        <Link className="text-link" to="/topics">
          Browse topics
        </Link>
      </div>
    );
  return <LectureReaderContent key={lecture.id} />;
}
function LectureReaderContent() {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const { data, update } = useWorkspace();
  const { openPaper } = usePdfViewer();

  const currentLecture = (lectureId && LECTURE_MAP.get(lectureId)) || ALL_LECTURES[0];
  const attachedNote = data.notes.find(
    (n) => n.lectureId === currentLecture.id || n.documentId === currentLecture.id
  );
  const inkVersion = attachedNote?.lectureInk
    ? parseInkData(attachedNote.lectureInk)?.visualization?.version || 1
    : undefined;
  const { lecture, version, originalContent } = getLectureEdition(currentLecture, inkVersion);
  const topics = originalContent ? LEGACY_TOPICS : version === 4 ? REVISION_FOUR_TOPICS : TOPICS;
  const visuals = lectureVisualPlacements(lecture.id, originalContent, version);
  const visualInsertions = (section: LectureVisualSection) =>
    visuals
      .filter((placement) => placement.section === section)
      .map(({ kind, afterHeading }) => ({
        afterHeading,
        content: <LectureWidget lectureId={lecture.id} kind={kind} />
      }));
  const topic = topics.find((t) => t.id === lecture.topicId) || topics[0];
  const dag = useMemo(
    () =>
      originalContent
        ? buildKnowledgeDAG([...LEGACY_LECTURE_MAP.values()], LEGACY_TOPICS)
        : version === 4
          ? buildKnowledgeDAG(REVISION_FOUR_LECTURES, REVISION_FOUR_TOPICS)
          : getKnowledgeDAG(),
    [originalContent, version]
  );
  const dagNode = lecture ? dag.nodes.get(lecture.id) : null;

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesWidth, setNotesWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved =
        localStorage.getItem('cortex_side_notes_width') ?? localStorage.getItem('ainotes_side_notes_width');
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
      localStorage.setItem('cortex_side_notes_width', String(notesWidth));
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
  const syllabus = version < 5 ? REVISION_FOUR_LECTURES : ALL_LECTURES;
  const currentIndex = syllabus.findIndex((l) => l.id === lecture.id);
  const nextLecture = syllabus[currentIndex + 1];
  const prevLecture = syllabus[currentIndex - 1];

  const isCompleted = data.completedLectures?.includes(lecture.id);

  // AUTOMATIC NOTE ASSOCIATION:
  // Automatically find or create the note associated with this lecture

  const [draftNote] = useState(() => ({ ...makeNote(`Notes: ${lecture.title}`), lectureId: lecture.id }));
  const activeNote = attachedNote ?? draftNote;

  const legacyLayout = inkVersion !== undefined && inkVersion < 3;

  // Track reading position and last read
  useEffect(() => {
    update((cur) => ({
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
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest('input, textarea, select'))
      )
        return;
      if (
        (e.key === 'n' || e.key === 'N') &&
        !e.defaultPrevented &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !document.querySelector('dialog[open]')
      ) {
        e.preventDefault();
        setNotesOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const toggleCompleted = () => update((cur) => toggleLecture(cur, lecture.id));

  const updateActiveNote = useCallback(
    (patch: Partial<Note>) => {
      update((cur) => {
        const found = cur.notes.some((n) => n.id === activeNote.id);
        if (found) {
          return {
            ...cur,
            notes: cur.notes.map((n) =>
              n.id === activeNote.id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
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
    [activeNote, update]
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
              <span>{isCompleted ? 'Done' : 'Mark done'}</span>
            </button>

            {/* Easy-to-toggle Note Taker button */}
            <button
              type="button"
              className={`button small ${notesOpen ? 'soft' : 'primary'}`}
              onClick={() => setNotesOpen(!notesOpen)}
              title="Toggle Note Taker (Shortcut: N)"
            >
              {notesOpen ? <PanelRightClose size={16} /> : <PenTool size={16} />}
              <span>{notesOpen ? 'Hide Notes' : 'Notes'}</span>
              <kbd style={{ fontSize: '9px', opacity: 0.7, marginLeft: '4px' }}>N</kbd>
            </button>
          </div>
        </div>

        <DocumentInkOverlay
          key={lecture.id}
          initialData={activeNote.lectureInk}
          legacyLayout={legacyLayout}
          contentVersion={version}
          onChange={(lectureInk) => updateActiveNote({ lectureInk })}
          onToggleSideNotes={() => setNotesOpen(!notesOpen)}
          sideNotesOpen={notesOpen}
          sideNotesWidth={notesWidth}
        >
          {/* Column 1: Main Lecture Text & Derivations (640px invariant width) */}
          <article className="article sheet-content-column" ref={articleRef} style={{ position: 'relative' }}>
            <header className="article-heading">
              <div className="article-meta">
                <span className="eyebrow">
                  TOPIC {topic.number}: {topic.title.toUpperCase()} · {originalContent ? '4H PACK' : 'PACK'}{' '}
                  {lecture.packNumber}, SLOT {lecture.packSlot}
                </span>
                <span>
                  <Clock3 size={13} />{' '}
                  {legacyLayout
                    ? '60 min true effort'
                    : originalContent
                      ? '60 min'
                      : `~${formatStudyTime(lecture.durationMinutes)}`}
                </span>
              </div>
              <h1>{lecture.title}</h1>
              {legacyLayout && (
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
              )}
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
                {legacyLayout ? 'CORE QUESTION' : 'Key question'}
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

            {legacyLayout ? (
              <>
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
                <TheoreticalCitationsPanel citations={lecture.theoreticalCitations} onOpenPaper={openPaper} />
              </>
            ) : (
              <div className="reader-details">
                <details>
                  <summary>Prerequisites and related lectures</summary>
                  {dagNode && (
                    <LectureDagPanel
                      dagNode={dagNode}
                      dag={dag}
                      lectureId={lecture.id}
                      completedLectures={data.completedLectures}
                      concise
                    />
                  )}
                </details>
                <details>
                  <summary>Formulas and citations</summary>
                  <TheoreticalCitationsPanel
                    citations={lecture.theoreticalCitations}
                    onOpenPaper={openPaper}
                    concise
                  />
                </details>
              </div>
            )}

            {/* Section 1: Motivation */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', marginBottom: '12px' }}>
                {legacyLayout ? '1. Motivation & Mathematical Invariants' : 'Overview'}
              </h2>
              <p style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--ink)' }}>
                {lecture.content.motivation}
              </p>
            </section>

            {/* Section 2: Mathematical Theory & Derivation */}
            <section style={{ marginBottom: '36px' }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', marginBottom: '16px' }}>
                {legacyLayout ? '2. Theory & Formal Derivations' : 'Theory'}
              </h2>
              <MarkdownView source={lecture.content.theory} insertions={visualInsertions('theory')} />
            </section>

            {/* Section 3: Worked Example */}
            <section
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line, #e2e4da)',
                borderRadius: '9px',
                padding: '24px',
                marginBottom: '36px'
              }}
            >
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '22px', marginBottom: '14px' }}>
                {legacyLayout ? '3. Step-by-Step Worked Example' : 'Worked example'}
              </h2>
              <MarkdownView
                source={lecture.content.workedExample}
                insertions={visualInsertions('workedExample')}
              />
            </section>

            {/* Section 4: Canonical Systems Architecture */}
            <SystemsArchitecturePanel
              legacyLayout={legacyLayout}
              codeReferences={lecture.codeReferences}
              implementationChoices={lecture.implementationChoices}
              codeWalkthrough={lecture.content.codeWalkthrough}
            />

            {/* Section 5: Associated Research Papers */}
            <PrimaryLiteraturePanel
              legacyLayout={legacyLayout}
              paperReferences={lecture.paperReferences}
              onOpenPaper={openPaper}
            />

            {/* Section 6: Exercise */}
            <section
              style={{
                background: 'var(--surface)',
                border: '1px solid #d9decb',
                borderRadius: '9px',
                padding: '24px',
                marginBottom: '40px'
              }}
            >
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '22px', marginBottom: '12px' }}>
                {legacyLayout ? '6. Paper & Pencil Exercise — Test Your Understanding' : 'Exercise'}
              </h2>
              {legacyLayout && (
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
                  Work out this exercise right in the stylus scratchpad on the right:
                </p>
              )}
              <MarkdownView source={lecture.content.exercise} />
            </section>

            {/* Bottom Navigation */}
            <div className="reader-pagination">
              {prevLecture ? (
                <Link
                  title={prevLecture.title}
                  className="button secondary"
                  to={lectureRoute(prevLecture.topicId, prevLecture.id)}
                >
                  <ArrowLeft size={16} /> Previous lecture
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
                {isCompleted ? 'Done' : 'Mark done'}
              </button>

              {nextLecture ? (
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    navigate(lectureRoute(nextLecture.topicId, nextLecture.id));
                  }}
                >
                  Next lecture <ArrowRight size={16} />
                </button>
              ) : (
                <Link className="button primary" to="/path">
                  Study path <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </article>

          {/* Column 2: Dedicated Preserved Margin Column (240px invariant width) */}
          <LectureMarginGutter legacyLayout={legacyLayout} />
        </DocumentInkOverlay>
      </div>

      {/* EASY-TO-TOGGLE STYLUS & PEN NOTE TAKER */}
      <LectureScratchpadPanel
        key={lecture.id}
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

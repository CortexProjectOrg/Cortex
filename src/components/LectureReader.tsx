import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Trash2,
  Download,
  Bookmark,
  Sparkles,
  Link2,
  Eye,
  Edit3,
  Network,
  Lock,
  GitFork,
  Share2,
  ChevronRight
} from 'lucide-react';
import { LECTURE_MAP, ALL_LECTURES, TOPICS } from '../lib/curriculum';
import { getKnowledgeDAG, type SoftLink } from '../lib/knowledgeGraph';
import { useWorkspace } from '../lib/workspace';
import { makeNote, lectureRoute } from '../lib/model';
import type { Note } from '../lib/model';
import { MarkdownView } from './MarkdownView';
import { InkCanvas } from './InkCanvas';
import { DocumentInkOverlay } from './DocumentInkOverlay';
import { MathFormula } from './MathFormula';
import { usePdfViewer } from '../lib/pdfViewerContext';
import { resolvePaperUrls } from '../lib/paperUtils';

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
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--line, #e2e4da)',
                borderRadius: '8px',
                padding: '18px 22px',
                marginBottom: '28px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Network size={14} /> KNOWLEDGE DAG POSITION & PREREQUISITES
                  <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '10px' }}>
                    (Topological Rank {dagNode.topologicalRank})
                  </span>
                </div>
                <Link
                  to={`/tree?focus=${lecture.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  View in Knowledge DAG <ExternalLink size={12} />
                </Link>
              </div>

              {/* Hard Prerequisites */}
              <div style={{ marginBottom: dagNode.unlockedLectures.length > 0 || dagNode.softLinks.length > 0 ? '12px' : 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  HARD PREREQUISITES {dagNode.prerequisites.length === 0 ? '(Foundational Bedrock · No Prerequisites)' : `(${dagNode.prerequisites.length})`}:
                </span>
                {dagNode.prerequisites.length === 0 ? (
                  <span style={{ fontSize: '11px', color: '#2d6a4f', fontStyle: 'italic' }}>
                    Axiomatic starting point. Mastered directly from first principles.
                  </span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {dagNode.prerequisites.map((pId: string) => {
                      const pNode = dag.nodes.get(pId);
                      if (!pNode) return null;
                      const isDone = data.completedLectures?.includes(pId);
                      return (
                        <Link
                          key={pId}
                          to={`/topics/${pNode.topicId}/${pNode.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 9px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            background: isDone ? '#eef4ec' : '#faf5e8',
                            border: `1px solid ${isDone ? '#c5ddc0' : '#e6d3a8'}`,
                            color: isDone ? '#2d6a4f' : '#8f640b',
                            textDecoration: 'none'
                          }}
                        >
                          {isDone ? <CheckCircle2 size={12} /> : <Lock size={12} />}
                          <span>L{String(pNode.lectureNumber).padStart(2, '0')}: {pNode.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Directly Unlocked */}
              {dagNode.unlockedLectures.length > 0 && (
                <div style={{ marginBottom: dagNode.softLinks.length > 0 ? '12px' : 0 }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    DIRECTLY UNLOCKS ({dagNode.unlockedLectures.length}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {dagNode.unlockedLectures.slice(0, 6).map((uId: string) => {
                      const uNode = dag.nodes.get(uId);
                      if (!uNode) return null;
                      return (
                        <Link
                          key={uId}
                          to={`/topics/${uNode.topicId}/${uNode.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontSize: '10.5px',
                            background: 'var(--bg)',
                            border: '1px solid var(--line)',
                            color: 'var(--ink)',
                            textDecoration: 'none'
                          }}
                        >
                          <span>L{String(uNode.lectureNumber).padStart(2, '0')}: {uNode.title}</span>
                        </Link>
                      );
                    })}
                    {dagNode.unlockedLectures.length > 6 && (
                      <span style={{ fontSize: '10.5px', color: 'var(--muted)', alignSelf: 'center' }}>
                        +{dagNode.unlockedLectures.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Cross-Disciplinary Soft Links */}
              {dagNode.softLinks.length > 0 && (
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#b07d2b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Share2 size={11} /> CROSS-FIELD SOFT LINKS ({dagNode.softLinks.length}):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dagNode.softLinks.map((link: SoftLink) => {
                      const targetNode = dag.nodes.get(link.targetId);
                      if (!targetNode) return null;
                      return (
                        <div
                          key={link.targetId}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: '#fefcf8',
                            border: '1px solid #ebd8be',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '10px'
                          }}
                        >
                          <div>
                            <strong style={{ color: 'var(--ink)', marginRight: '6px' }}>
                              ↔ L{String(targetNode.lectureNumber).padStart(2, '0')} ({targetNode.title}):
                            </strong>
                            <span style={{ color: 'var(--muted)' }}>{link.relationship}</span>
                          </div>
                          <Link
                            to={`/topics/${targetNode.topicId}/${targetNode.id}`}
                            style={{
                              color: 'var(--accent)',
                              fontSize: '10px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              textDecoration: 'none',
                              flexShrink: 0
                            }}
                          >
                            Explore <ChevronRight size={10} style={{ verticalAlign: 'middle' }} />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

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
                {lecture.theoreticalCitations.map((cite, i) => {
                  const resolvedCite = resolvePaperUrls(cite.doiOrUrl, cite.source, cite.formulaName);
                  return (
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
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--muted)',
                          marginTop: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}
                      >
                        <span>
                          Source: <em>{cite.source}</em> · {cite.theoremOrEquation}
                        </span>
                        {resolvedCite && (
                          <button
                            type="button"
                            onClick={() => openPaper(resolvedCite)}
                            style={{
                              background: 'var(--soft)',
                              border: '1px solid var(--line)',
                              color: 'var(--accent)',
                              fontSize: '10px',
                              fontWeight: 650,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 7px',
                              borderRadius: '4px'
                            }}
                            title="Open cited paper in PDF viewer"
                          >
                            <FileText size={11} />
                            <span>View Paper PDF</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
              {lecture.paperReferences.map((p, i) => {
                const resolved = resolvePaperUrls(p.arxivUrl, p.citation, p.title);
                return (
                  <div
                    key={i}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      padding: '16px 18px',
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
                      <div style={{ flex: 1, minWidth: '240px' }}>
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {resolved ? (
                          <>
                            <button
                              type="button"
                              className="button small primary"
                              onClick={() => openPaper(resolved)}
                              style={{ padding: '6px 12px', minHeight: '32px', fontSize: '11px', gap: '5px' }}
                              title="Open paper in embedded PDF viewer"
                            >
                              <FileText size={13} />
                              <span>View Paper PDF</span>
                            </button>
                            <a
                              href={resolved.abstractUrl || resolved.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="icon-button small"
                              style={{ width: '32px', height: '32px' }}
                              title="Open on arXiv (new tab)"
                              aria-label="Open on arXiv"
                            >
                              <ExternalLink size={13} />
                            </a>
                          </>
                        ) : p.arxivUrl ? (
                          <a
                            href={p.arxivUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="button small secondary"
                            style={{ flexShrink: 0, textDecoration: 'none' }}
                          >
                            Read Paper <ExternalLink size={12} />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
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

        {/* Column 2: Dedicated Preserved Margin Column (240px invariant width) */}
        <aside className="sheet-margin-column" aria-label="Academic Margin Notes and Proofs">
          <div className="sheet-margin-header">
            <div className="sheet-margin-title">
              <PenTool size={11} />
              <span>MARGINALIA & PROOFS</span>
            </div>
            <p className="sheet-margin-desc">
              Preserved margin notes column. Draw proofs, side derivations & notes directly alongside the text.
            </p>
          </div>

          <div className="margin-guide-marker" style={{ marginTop: '24px' }}>
            <span className="margin-section-tag">§ 1 Motivation Notes</span>
          </div>

          <div className="margin-guide-marker" style={{ marginTop: '260px' }}>
            <span className="margin-section-tag">§ 2 Theory & Proofs</span>
          </div>

          <div className="margin-guide-marker" style={{ marginTop: '540px' }}>
            <span className="margin-section-tag">§ 3 Worked Derivations</span>
          </div>

          <div className="margin-guide-marker" style={{ marginTop: '500px' }}>
            <span className="margin-section-tag">§ 4 Systems & Code Notes</span>
          </div>

          <div className="margin-guide-marker" style={{ marginTop: '480px' }}>
            <span className="margin-section-tag">§ 5 Literature Marginalia</span>
          </div>

          <div className="margin-guide-marker" style={{ marginTop: '440px' }}>
            <span className="margin-section-tag">§ 6 Exercise Calculations</span>
          </div>
        </aside>
      </DocumentInkOverlay>
      </div>

      {/* EASY-TO-TOGGLE STYLUS & PEN NOTE TAKER */}
      {notesOpen && (
        <>
          <div
            className="sidebar-scrim notes-scrim"
            onClick={() => setNotesOpen(false)}
            aria-hidden="true"
          />
          <aside
            className={`reading-notes ${isResizingNotes ? 'is-resizing' : ''}`}
            style={{ width: `${notesWidth}px`, maxWidth: '92vw', position: 'relative' }}
          >
            {/* Draggable resize handle along left edge */}
            <div
              className={`notes-resize-handle ${isResizingNotes ? 'is-resizing' : ''}`}
              onPointerDown={handleResizeStart}
              title="Drag left/right to resize notes panel"
              aria-label="Resize notes panel"
            />
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
      </>
    )}
  </div>
);
}

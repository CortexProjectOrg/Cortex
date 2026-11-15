import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock3,
  BookOpen,
  ArrowRight,
  ArrowUpRight,
  Check,
  Calendar,
  Compass,
  PencilLine,
  FolderOpen,
  ChevronRight,
  Sparkles,
  Cloud,
  Layers
} from 'lucide-react';
import { useWorkspace } from '../lib/workspace';
import { useAuth } from '../lib/auth';
import { TOPICS, SUNDAY_SCHOLAR_PATH, ALL_LECTURES, LECTURE_MAP } from '../lib/curriculum';
import { docRoute, lectureRoute } from '../lib/model';

export function Dashboard() {
  const { data, syncState } = useWorkspace();
  const { user, loginWithGoogle } = useAuth();

  const completedCount = data.completedLectures?.length || 0;
  const totalLectures = ALL_LECTURES.length;
  const currentWeekNum = data.studyPlan?.currentWeek || 1;
  const currentWeek = SUNDAY_SCHOLAR_PATH.weeks[currentWeekNum - 1] || SUNDAY_SCHOLAR_PATH.weeks[0];

  // Find next uncompleted lecture
  const nextLectureId =
    currentWeek.lectureIds.find(id => !data.completedLectures?.includes(id)) ||
    currentWeek.lectureIds[0];
  const nextLecture = LECTURE_MAP.get(nextLectureId) || ALL_LECTURES[0];

  const recentNotes = [...data.notes]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  return (
    <div className="page dashboard">
      {/* Top Welcome / Auth Banner if not signed in */}
      {!user && (
        <div
          style={{
            background: 'var(--soft, #e9eee3)',
            border: '1px solid var(--line, #e2e4da)',
            borderRadius: '9px',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cloud size={18} style={{ color: 'var(--accent, #3a5d49)' }} />
            <span style={{ fontSize: '13px', color: 'var(--ink, #28372e)' }}>
              <strong>Sync across devices:</strong> Sign in with Google to synchronize your tablet
              pen sketches, notes, and study progress with your PC.
            </span>
          </div>
          <button
            type="button"
            className="button small primary"
            onClick={loginWithGoogle}
            style={{ fontSize: '11px', padding: '6px 14px', minHeight: '34px' }}
          >
            Sign in with Google
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">THE SYMPLECTIC FIELD GUIDE & CODEBASE COMPANION</span>
          <h1>
            A little theory.
            <br />
            <em>A clearer picture.</em>
          </h1>
          <p>
            From zero to complete mastery of the mathematics and implementation of{' '}
            <code>QuAOS-Lab</code>. 15 structured Sunday sessions of four 1-hour lectures.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              className="button primary"
              to={lectureRoute(nextLecture.topicId, nextLecture.id)}
            >
              Continue Sunday {currentWeekNum}: {nextLecture.title}
              <ArrowRight size={17} />
            </Link>
            <Link className="button secondary" to="/path">
              <Calendar size={15} />
              View 15-Week Study Plan
            </Link>
          </div>
          <div className="hero-meta">
            <span>
              <Clock3 size={14} /> 4 focused hours / Sunday
            </span>
            <span>
              <Layers size={14} /> 60 atomic 1-hour lectures
            </span>
            <span>
              <BookOpen size={14} />
              {completedCount} of {totalLectures} mastered
            </span>
          </div>
        </div>

        {/* Matrix Art */}
        <div className="matrix-art" aria-hidden="true">
          <span className="art-orbit one" />
          <span className="art-orbit two" />
          <div className="matrix-paper">
            <div className="matrix-eyebrow">SYMPLECTIC FORM ω</div>
            <div className="matrix-equation">
              <span className="math-letter">ω</span>
              <span className="math-equals">=</span>
              <span className="matrix-bracket">
                <span>0</span>
                <span>1</span>
                <span>1</span>
                <span>0</span>
              </span>
            </div>
            <div className="matrix-caption">Commutation as finite geometry.</div>
          </div>
          <span className="art-dot" />
        </div>
      </section>

      {/* Sunday Session Focus */}
      <div className="journey-heading" style={{ marginTop: '36px' }}>
        <div>
          <span className="eyebrow">CURRENT FOCUS: SUNDAY {currentWeekNum} OF 15</span>
          <h2>{currentWeek.title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            {currentWeek.theme}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="subtle progress-label">
            {currentWeek.lectureIds.filter(id => data.completedLectures?.includes(id)).length} of 4
            lectures completed today
          </span>
        </div>
      </div>

      {/* 4 Lecture Blocks for this Sunday */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '36px'
        }}
      >
        {currentWeek.lectureIds.map((lId, idx) => {
          const lec = LECTURE_MAP.get(lId);
          if (!lec) return null;
          const isDone = data.completedLectures?.includes(lId);
          const isCurrent = lId === nextLecture.id;

          return (
            <Link
              key={lId}
              to={lectureRoute(lec.topicId, lec.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                borderRadius: '9px',
                border: isCurrent
                  ? '2px solid var(--accent, #3a5d49)'
                  : '1px solid var(--line, #e2e4da)',
                background: 'var(--surface, #fffefa)',
                textDecoration: 'none',
                color: 'inherit',
                position: 'relative',
                boxShadow: isCurrent ? '0 4px 14px rgba(58, 93, 73, 0.08)' : 'none',
                transition: 'transform 0.15s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 650,
                    letterSpacing: '1px',
                    color: isDone ? 'var(--accent)' : 'var(--muted)'
                  }}
                >
                  SLOT {idx + 1} · 60 MIN
                </span>
                {isDone ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: 'var(--accent)',
                      background: 'var(--soft)',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}
                  >
                    <Check size={12} /> Mastered
                  </span>
                ) : isCurrent ? (
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#b86e00',
                      background: '#fff3db',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600
                    }}
                  >
                    Up Next
                  </span>
                ) : null}
              </div>

              <h3
                style={{
                  fontSize: '17px',
                  fontFamily: 'var(--serif)',
                  lineHeight: '1.3',
                  marginBottom: '8px'
                }}
              >
                {lec.title}
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                  lineHeight: '1.5',
                  marginBottom: '14px',
                  flex: 1
                }}
              >
                {lec.question}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: 'var(--accent)',
                  fontWeight: 550,
                  marginTop: 'auto'
                }}
              >
                <span>Study Lecture</span>
                <ArrowRight size={13} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Topics Map & Reference Shelf */}
      <div className="dashboard-columns">
        {/* All 10 Topics */}
        <div>
          <div className="journey-heading" style={{ margin: '0 0 16px' }}>
            <div>
              <span className="eyebrow">COMPLETE KNOWLEDGE GRAPH</span>
              <h2>All 10 Core Topics</h2>
            </div>
            <Link to="/topics" className="text-link" style={{ fontSize: '12px' }}>
              View all topics <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {TOPICS.map(topic => {
              const completedInTopic = topic.lectureIds.filter(id =>
                data.completedLectures?.includes(id)
              ).length;
              const totalInTopic = topic.lectureIds.length;
              const isTopicDone = completedInTopic === totalInTopic && totalInTopic > 0;

              return (
                <Link
                  key={topic.id}
                  to={`/topics#${topic.id}`}
                  className={`session-card ${topic.color}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="session-number">
                    {isTopicDone ? <Check size={23} /> : topic.symbol}
                  </div>
                  <div className="session-copy">
                    <div className="session-kicker">
                      TOPIC {topic.number}
                      <span>
                        {completedInTopic} of {totalInTopic} lectures mastered
                      </span>
                    </div>
                    <h3>{topic.title}</h3>
                    <p>{topic.description}</p>
                    <div className="topic-tags">
                      <span>{topic.subtitle}</span>
                      <span>{totalInTopic} Hours</span>
                    </div>
                  </div>
                  <ArrowUpRight size={20} className="session-arrow" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Aside: Reference Shelf & Notes */}
        <aside className="study-aside">
          {/* Reference Shelf */}
          <section className="aside-card shelf">
            <div className="small-heading">
              <FolderOpen size={17} />
              <span>Reference Library</span>
            </div>
            <h3>
              Keep the good
              <br />
              explanations close.
            </h3>
            <p>Direct references to papers, mathematical glossary, and repository source maps.</p>
            <div className="shelf-links">
              <Link to={docRoute('CODEBASE_MAP.md')}>
                <span>QuAOS-Lab Codebase Map</span>
                <ChevronRight size={16} />
              </Link>
              <Link to={docRoute('GLOSSARY.md')}>
                <span>Symplectic Glossary</span>
                <ChevronRight size={16} />
              </Link>
              <Link to={docRoute('SOURCES.md')}>
                <span>Research Papers Guide</span>
                <ChevronRight size={16} />
              </Link>
              <Link to={docRoute('SETUP.md')}>
                <span>Rust & CUDA Practice Harness</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </section>

          {/* Notebook reflection card */}
          <section className="aside-card thought">
            <PencilLine size={22} />
            <h3>Stylus & Paper Notes</h3>
            <p>
              Draw quantum circuits, derive symplectic formulas with your tablet pen, and review
              clean SVG diagrams on your PC.
            </p>
            <Link to="/notes" className="text-link">
              Open your notebook <ArrowRight size={15} />
            </Link>
          </section>
        </aside>
      </div>

      {/* Recent Notes Section */}
      {recentNotes.length > 0 && (
        <section className="recent-notes" style={{ marginTop: '40px' }}>
          <div className="section-title">
            <h2>From your notebook</h2>
            <Link to="/notes" className="text-link">
              All {data.notes.length} notes <ArrowRight size={15} />
            </Link>
          </div>
          <div className="note-preview-grid">
            {recentNotes.map(n => (
              <Link
                to={`/notes/${n.id}`}
                className="note-preview"
                key={n.id}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}
                >
                  <span className="eyebrow">
                    {new Intl.DateTimeFormat(undefined, {
                      month: 'short',
                      day: 'numeric'
                    }).format(new Date(n.updatedAt))}
                  </span>
                  {n.inkData && (
                    <span
                      style={{
                        fontSize: '10px',
                        background: 'var(--soft)',
                        color: 'var(--accent)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}
                    >
                      Pen Drawing Attached
                    </span>
                  )}
                </div>
                <h3>{n.title || 'Untitled Note'}</h3>
                <p>
                  {n.body.replace(/[#*`]/g, '').slice(0, 140) ||
                    'An open reflection with your personal derivations.'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Check,
  Clock3,
  ArrowRight,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { SUNDAY_SCHOLAR_PATH, LECTURE_MAP } from '../lib/curriculum';
import { useWorkspace } from '../lib/workspace';
import { lectureRoute } from '../lib/model';

export function StudyPathView() {
  const { data, update } = useWorkspace();
  const currentWeek = data.studyPlan?.currentWeek || 1;
  const completedLectures = data.completedLectures || [];

  const setWeek = (week: number) => {
    update(cur => ({
      ...cur,
      studyPlan: {
        ...cur.studyPlan,
        currentWeek: week
      }
    }));
  };

  const totalCompleted = completedLectures.length;
  const percent = Math.round((totalCompleted / 60) * 100);

  return (
    <div className="page study-path-page">
      <div className="page-eyebrow">
        <span className="tiny-line" /> STRUCTURED LEARNING SCHEDULE
      </div>

      <div className="page-title-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1>15-Sunday Study Plan</h1>
          <p>
            4 focused hours every Sunday. 60 lectures from zero to complete mastery of QuAOS-Lab.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="library-count">
            {totalCompleted} / 60<span>lectures done ({percent}%)</span>
          </span>
        </div>
      </div>

      {/* Progress banner */}
      <div
        style={{
          background: 'var(--surface, #fffefa)',
          border: '1px solid var(--line, #e2e4da)',
          borderRadius: '9px',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <span className="eyebrow">ACTIVE TIMELINE</span>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: '20px', margin: '4px 0' }}>
            Currently Studying: Sunday {currentWeek} of 15
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
            {SUNDAY_SCHOLAR_PATH.weeks[currentWeek - 1]?.theme}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Jump to Sunday:</span>
          <select
            value={currentWeek}
            onChange={e => setWeek(Number(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: '#fff',
              fontSize: '13px'
            }}
          >
            {SUNDAY_SCHOLAR_PATH.weeks.map(w => (
              <option key={w.weekNumber} value={w.weekNumber}>
                Sunday {w.weekNumber}: {w.title.replace(/^Sunday \d+:\s*/, '')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 15 Sundays Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {SUNDAY_SCHOLAR_PATH.weeks.map(week => {
          const isCurrent = week.weekNumber === currentWeek;
          const weekCompletedLectures = week.lectureIds.filter(id =>
            completedLectures.includes(id)
          );
          const isWeekDone = weekCompletedLectures.length === 4;

          return (
            <div
              key={week.weekNumber}
              style={{
                border: isCurrent
                  ? '2px solid var(--accent, #3a5d49)'
                  : '1px solid var(--line, #e2e4da)',
                borderRadius: '11px',
                background: isCurrent ? '#f9faf6' : 'var(--surface, #fffefa)',
                padding: '24px',
                boxShadow: isCurrent ? '0 4px 18px rgba(58, 93, 73, 0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        color: isWeekDone ? 'var(--accent)' : isCurrent ? '#b86e00' : 'var(--muted)'
                      }}
                    >
                      SUNDAY {week.weekNumber} OF 15 · 4 HOURS
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: '10px',
                          background: '#fff3db',
                          color: '#b86e00',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 600
                        }}
                      >
                        CURRENT FOCUS
                      </span>
                    )}
                    {isWeekDone && (
                      <span
                        style={{
                          fontSize: '10px',
                          background: 'var(--soft)',
                          color: 'var(--accent)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 600
                        }}
                      >
                        SUNDAY COMPLETED
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: '22px',
                      margin: '4px 0 2px'
                    }}
                  >
                    {week.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>{week.theme}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!isCurrent && (
                    <button
                      type="button"
                      className="button small secondary"
                      onClick={() => setWeek(week.weekNumber)}
                    >
                      Set as Active Sunday
                    </button>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {weekCompletedLectures.length} / 4 lectures completed
                  </span>
                </div>
              </div>

              {/* 4 Lecture Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px'
                }}
              >
                {week.lectureIds.map((lId, slotIdx) => {
                  const lec = LECTURE_MAP.get(lId);
                  if (!lec) return null;
                  const done = completedLectures.includes(lId);

                  return (
                    <Link
                      key={lId}
                      to={lectureRoute(lec.topicId, lec.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid var(--line, #e2e4da)',
                        background: done ? 'var(--soft)' : '#fff',
                        textDecoration: 'none',
                        color: 'inherit',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 650,
                            letterSpacing: '0.8px',
                            color: done ? 'var(--accent)' : 'var(--muted)'
                          }}
                        >
                          SLOT {slotIdx + 1} (60 MIN)
                        </span>
                        {done ? (
                          <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
                        ) : (
                          <Circle size={16} style={{ color: '#ccc' }} />
                        )}
                      </div>

                      <h4
                        style={{
                          fontSize: '15px',
                          fontFamily: 'var(--serif)',
                          lineHeight: '1.3',
                          margin: '0 0 6px'
                        }}
                      >
                        {lec.title}
                      </h4>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--muted)',
                          lineHeight: '1.4',
                          margin: '0 0 12px',
                          flex: 1
                        }}
                      >
                        {lec.question}
                      </p>

                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--accent)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: 'auto'
                        }}
                      >
                        <span>{done ? 'Review' : 'Start Slot'}</span>
                        <ArrowRight size={12} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

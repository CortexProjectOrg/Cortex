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
  Circle,
  Package
} from 'lucide-react';
import { FOUR_HOUR_MASTERY_PATH, LECTURE_MAP } from '../lib/curriculum';
import { useWorkspace } from '../lib/workspace';
import { lectureRoute } from '../lib/model';

export function StudyPathView() {
  const { data, update } = useWorkspace();
  const currentPackNum = data.studyPlan?.currentWeek || 1;
  const completedLectures = data.completedLectures || [];

  const setPack = (pack: number) => {
    update(cur => ({
      ...cur,
      studyPlan: {
        ...cur.studyPlan,
        currentWeek: pack
      }
    }));
  };

  const totalCompleted = completedLectures.length;
  const percent = Math.round((totalCompleted / 60) * 100);

  return (
    <div className="page study-path-page">
      <div className="page-eyebrow">
        <span className="tiny-line" /> STUDY SCHEDULE
      </div>

      <div className="page-title-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1>15 Four-Hour Mastery Packs</h1>
          <p>
            60 one-hour lectures organized into 15 four-hour study blocks.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="library-count">
            {totalCompleted} / 60<span>lectures mastered ({percent}%)</span>
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
            Currently Studying: Pack {currentPackNum} of 15
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
            {FOUR_HOUR_MASTERY_PATH.packs[currentPackNum - 1]?.theme}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Select Pack:</span>
          <select
            value={currentPackNum}
            onChange={e => setPack(Number(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: '#fff',
              fontSize: '13px'
            }}
          >
            {FOUR_HOUR_MASTERY_PATH.packs.map(p => (
              <option key={p.packNumber} value={p.packNumber}>
                Pack {p.packNumber}: {p.title.replace(/^Pack \d+:\s*/, '')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 15 Mastery Packs Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {FOUR_HOUR_MASTERY_PATH.packs.map(pack => {
          const isCurrent = pack.packNumber === currentPackNum;
          const packCompletedLectures = pack.lectureIds.filter(id =>
            completedLectures.includes(id)
          );
          const isPackDone = packCompletedLectures.length === 4;

          return (
            <div
              key={pack.packNumber}
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
                        color: isPackDone ? 'var(--accent)' : isCurrent ? '#b86e00' : 'var(--muted)'
                      }}
                    >
                      4-HOUR MASTERY PACK {pack.packNumber} OF 15
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
                    {isPackDone && (
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
                        PACK COMPLETED
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
                    {pack.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>{pack.theme}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!isCurrent && (
                    <button
                      type="button"
                      className="button small secondary"
                      onClick={() => setPack(pack.packNumber)}
                    >
                      Set as Active Pack
                    </button>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {packCompletedLectures.length} / 4 lectures completed
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
                {pack.lectureIds.map((lId, slotIdx) => {
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

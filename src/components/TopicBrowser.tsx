import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Check,
  Clock3,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCode,
  FileText
} from 'lucide-react';
import { TOPICS, LECTURE_MAP } from '../lib/curriculum';
import { useWorkspace } from '../lib/workspace';
import { lectureRoute } from '../lib/model';

export function TopicBrowser() {
  const { data } = useWorkspace();
  const [selectedTopicId, setSelectedTopicId] = useState<string>(TOPICS[0].id);

  const activeTopic = TOPICS.find(t => t.id === selectedTopicId) || TOPICS[0];

  return (
    <div className="page topics-page">
      <div className="page-eyebrow">
        <span className="tiny-line" /> TOPIC DIRECTORY
      </div>

      <div className="page-title-row" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Topics</h1>
          <p>
            60 lectures categorized across 10 subject areas.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="library-count">
            10<span>topics</span>
          </span>
        </div>
      </div>

      {/* Topic selection tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '12px',
          marginBottom: '32px'
        }}
      >
        {TOPICS.map(topic => {
          const isSelected = topic.id === activeTopic.id;
          const completedCount = topic.lectureIds.filter(id =>
            data.completedLectures?.includes(id)
          ).length;
          const totalCount = topic.lectureIds.length;
          const isDone = completedCount === totalCount && totalCount > 0;

          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => setSelectedTopicId(topic.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '8px',
                border: isSelected
                  ? '2px solid var(--accent, #3a5d49)'
                  : '1px solid var(--line, #e2e4da)',
                background: isSelected ? 'var(--soft, #e9eee3)' : 'var(--surface, #fffefa)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isDone ? 'var(--accent)' : '#dedfcd',
                  color: isDone ? '#fff' : 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 650,
                  fontSize: '13px',
                  flexShrink: 0
                }}
              >
                {isDone ? <Check size={18} /> : topic.symbol}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Topic {topic.number}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {topic.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  {completedCount} / {totalCount} completed
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Topic Detail View */}
      <div
        style={{
          border: '1px solid var(--line, #e2e4da)',
          borderRadius: '12px',
          background: 'var(--surface, #fffefa)',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--line)', paddingBottom: '20px' }}>
          <span className="eyebrow">
            TOPIC {activeTopic.number} OF 10 · {activeTopic.lectureIds.length} HOURS OF STUDY
          </span>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '32px', margin: '8px 0' }}>
            {activeTopic.title}
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: '1.6' }}>
            {activeTopic.description}
          </p>
        </div>

        <h3 style={{ fontSize: '18px', fontFamily: 'var(--serif)', marginBottom: '16px' }}>
          Lectures in this Topic (1 Hour Each)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeTopic.lectureIds.map((lId, idx) => {
            const lec = LECTURE_MAP.get(lId);
            if (!lec) return null;
            const isCompleted = data.completedLectures?.includes(lId);

            return (
              <div
                key={lId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--line, #e2e4da)',
                  background: isCompleted ? 'var(--soft, #e9eee3)' : '#fff',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px', flex: 1 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isCompleted ? 'var(--accent)' : 'var(--sidebar)',
                      color: isCompleted ? '#fff' : 'var(--muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 650,
                      flexShrink: 0
                    }}
                  >
                    {isCompleted ? <Check size={16} /> : lec.lectureNumber}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '16px', margin: 0, fontWeight: 600 }}>{lec.title}</h4>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'var(--sidebar)',
                          color: 'var(--muted)'
                        }}
                      >
                        Sunday {lec.sundaySession} · Slot {lec.sundaySlot}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 0' }}>
                      {lec.question}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock3 size={13} /> 60 min
                  </span>
                  <Link
                    to={lectureRoute(activeTopic.id, lec.id)}
                    className="button small primary"
                    style={{ textDecoration: 'none' }}
                  >
                    {isCompleted ? 'Review' : 'Start Lecture'}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

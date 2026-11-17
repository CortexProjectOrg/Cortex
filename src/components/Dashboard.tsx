import { ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ALL_LECTURES, FOUR_HOUR_MASTERY_PATH, LECTURE_MAP } from '../lib/curriculumCatalog';
import { lectureRoute } from '../lib/model';
import { resumeLecture } from '../lib/progress';
import { useWorkspace } from '../lib/workspace';
export function Dashboard() {
  const { data } = useWorkspace();
  const next = resumeLecture(data);
  const pack =
    FOUR_HOUR_MASTERY_PATH.packs[data.studyPlan.currentWeek - 1] || FOUR_HOUR_MASTERY_PATH.packs[0];
  const recent = [...data.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
  const complete = data.completedLectures.length === ALL_LECTURES.length;
  return (
    <div className="page dashboard">
      <div className="page-title-row">
        <h1>Dashboard</h1>
        <span className="subtle">
          {data.completedLectures.length}/{ALL_LECTURES.length} done
        </span>
      </div>
      <section className="continue-card">
        <div>
          <span className="subtle">
            {complete ? 'All lectures complete' : `Pack ${next.packNumber} · Lecture ${next.lectureNumber}`}
          </span>
          <h2>{next.title}</h2>
        </div>
        <Link className="button primary" to={lectureRoute(next.topicId, next.id)}>
          {complete ? 'Review' : data.lastRead ? 'Continue' : 'Start learning'}
          <ArrowRight size={17} />
        </Link>
      </section>
      <div className="section-title">
        <h2>{pack.title}</h2>
        <Link to="/path" className="text-link">
          Study path <ArrowRight size={15} />
        </Link>
      </div>
      <div className="lecture-list">
        {pack.lectureIds.map((id) => {
          const lecture = LECTURE_MAP.get(id)!;
          return (
            <Link key={id} className="lecture-list-item" to={lectureRoute(lecture.topicId, id)}>
              <span className="lecture-number">{lecture.lectureNumber}</span>
              <strong>{lecture.title}</strong>
              <span className="subtle">
                {data.completedLectures.includes(id) ? 'Done' : `~${lecture.durationMinutes} min`}
              </span>
              <ArrowRight size={16} />
            </Link>
          );
        })}
      </div>
      <div className="section-title">
        <h2>Recent notes</h2>
        <Link className="text-link" to="/notes">
          <Plus size={15} />
          Notebook
        </Link>
      </div>
      {recent.length ? (
        <div className="note-preview-grid">
          {recent.map((note) => (
            <Link key={note.id} className="note-preview" to={`/notes/${note.id}`}>
              <h3>{note.title || 'Untitled note'}</h3>
              <p>
                {note.body.replace(/[#*`]/g, '').slice(0, 120) || (note.inkData ? 'Drawing' : 'Empty note')}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="subtle">Your notes will appear here.</p>
      )}
    </div>
  );
}

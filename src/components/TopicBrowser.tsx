import { ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LECTURE_MAP, TOPICS } from '../lib/curriculumCatalog';
import { lectureRoute } from '../lib/model';
import { useWorkspace } from '../lib/workspace';
export function TopicBrowser() {
  const { data } = useWorkspace();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const active = TOPICS.find((t) => `#${t.id}` === hash) || TOPICS[0];
  return (
    <div className="page topics-page">
      <div className="page-title-row">
        <h1>Topics</h1>
        <span className="subtle">{TOPICS.length} subjects</span>
      </div>
      <div className="topic-selector">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            type="button"
            aria-pressed={topic.id === active.id}
            className={topic.id === active.id ? 'selected' : ''}
            onClick={() => navigate(`/topics#${topic.id}`)}
          >
            <span>{topic.number}</span>
            {topic.title}
            <small>
              {topic.lectureIds.filter((id) => data.completedLectures.includes(id)).length}/
              {topic.lectureIds.length}
            </small>
          </button>
        ))}
      </div>
      <section className="topic-detail">
        <h2>{active.title}</h2>
        <p className="subtle">{active.description}</p>
        <div className="lecture-list">
          {active.lectureIds.map((id) => {
            const lecture = LECTURE_MAP.get(id)!;
            return (
              <Link key={id} className="lecture-list-item" to={lectureRoute(active.id, id)}>
                <span className="lecture-number">{lecture.lectureNumber}</span>
                <strong>{lecture.title}</strong>
                <span className="subtle">{data.completedLectures.includes(id) ? 'Done' : '60 min'}</span>
                <ArrowRight size={16} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

import { formatStudyTime } from '../lib/studyTime';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ALL_LECTURES, FOUR_HOUR_MASTERY_PATH, LECTURE_MAP } from '../lib/curriculumCatalog';
import { lectureRoute } from '../lib/model';
import { useWorkspace } from '../lib/workspace';
export function StudyPathView() {
  const { data, update } = useWorkspace();
  return (
    <div className="page study-path-page">
      <div className="page-title-row">
        <h1>Study path</h1>
        <span className="subtle">
          {FOUR_HOUR_MASTERY_PATH.packs.length} packs · {ALL_LECTURES.length} lectures
        </span>
      </div>
      <div className="pack-grid">
        {FOUR_HOUR_MASTERY_PATH.packs.map((pack) => {
          const count = pack.lectureIds.filter((id) => data.completedLectures.includes(id)).length;
          const current = pack.packNumber === data.studyPlan.currentWeek;
          return (
            <section key={pack.packNumber} className={`pack-card ${current ? 'current' : ''}`}>
              <div className="section-title">
                <h2>{pack.title}</h2>
                <span className="subtle">
                  {count}/{pack.lectureIds.length} done
                </span>
              </div>
              <div className="lecture-list">
                {pack.lectureIds.map((id) => {
                  const lecture = LECTURE_MAP.get(id)!;
                  return (
                    <Link key={id} className="lecture-list-item" to={lectureRoute(lecture.topicId, id)}>
                      <span className="lecture-number">{lecture.lectureNumber}</span>
                      <strong>{lecture.title}</strong>
                      <ArrowRight size={15} />
                    </Link>
                  );
                })}
              </div>
              <div className="pack-actions">
                <span className="subtle">
                  ~
                  {formatStudyTime(
                    pack.lectureIds.reduce((sum, id) => sum + LECTURE_MAP.get(id)!.durationMinutes, 0)
                  )}
                </span>
                <button
                  type="button"
                  className={`button small ${current ? 'soft' : 'secondary'}`}
                  disabled={current}
                  onClick={() =>
                    update((ws) => ({ ...ws, studyPlan: { ...ws.studyPlan, currentWeek: pack.packNumber } }))
                  }
                >
                  {current ? 'Current pack' : 'Study this pack'}
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

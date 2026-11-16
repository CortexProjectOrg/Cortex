import { ALL_LECTURES, FOUR_HOUR_MASTERY_PATH, LECTURE_MAP } from './curriculumCatalog';
import type { Workspace } from './model';
export function toggleLecture(workspace: Workspace, id: string): Workspace {
  const done = !workspace.completedLectures.includes(id);
  return {
    ...workspace,
    completedLectures: done
      ? [...workspace.completedLectures, id]
      : workspace.completedLectures.filter((v) => v !== id),
    lectureProgress: {
      ...workspace.lectureProgress,
      [id]: {
        status: done ? 'completed' : 'in-progress',
        completedAt: done ? new Date().toISOString() : undefined
      }
    }
  };
}
export function resumeLecture(workspace: Workspace) {
  const last = workspace.lastRead && LECTURE_MAP.get(workspace.lastRead.id);
  if (last && !workspace.completedLectures.includes(last.id)) return last;
  const pack = FOUR_HOUR_MASTERY_PATH.packs[workspace.studyPlan.currentWeek - 1];
  const next = pack?.lectureIds.find((id) => !workspace.completedLectures.includes(id));
  return (
    (next && LECTURE_MAP.get(next)) ||
    ALL_LECTURES.find((l) => !workspace.completedLectures.includes(l.id)) ||
    last ||
    ALL_LECTURES[0]
  );
}

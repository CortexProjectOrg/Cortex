import { expect, it } from 'vitest';
import { emptyWorkspace } from '../shared/workspace';
import { ALL_LECTURES } from '../src/lib/curriculumCatalog';
import { resumeLecture, toggleLecture } from '../src/lib/progress';
it('resumes the first unfinished lecture after completing the selected pack', () => {
  const ws = emptyWorkspace();
  ws.completedLectures = ALL_LECTURES.slice(0, 4).map((l) => l.id);
  expect(resumeLecture(ws).id).toBe(ALL_LECTURES[4].id);
});
it('reopening a lecture keeps the list and progress record consistent', () => {
  const id = ALL_LECTURES[0].id;
  const done = toggleLecture(emptyWorkspace(), id);
  expect(done.completedLectures).toContain(id);
  expect(done.lectureProgress[id].status).toBe('completed');
  const reopened = toggleLecture(done, id);
  expect(reopened.completedLectures).not.toContain(id);
  expect(reopened.lectureProgress[id].status).toBe('in-progress');
});

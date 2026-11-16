export { emptyWorkspace, mergeWorkspace, validateWorkspace } from '../../shared/workspace';
export type {
  LectureProgress,
  LectureProgressStatus,
  Note,
  PathItem,
  StudyPlan,
  Workspace
} from '../../shared/workspace';
import type { Note, Workspace } from '../../shared/workspace';

export function makeNote(title = 'Untitled note', documentId?: string, lectureId?: string, body = ''): Note {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    body,
    documentId,
    lectureId,
    createdAt: now,
    updatedAt: now
  };
}

export const notePrompt =
  '## The idea in my own words\n\n\n## Key formulas & derivation\n\n\n## Code connection\n\n\n## Open questions to revisit\n\n';

export function noteMarkdown(note: Note): string {
  let md = `# ${note.title}\n\n${note.body}\n`;
  if (note.updatedAt) {
    md += `\n*Updated: ${note.updatedAt}*\n`;
  }
  if (note.inkData) {
    md += `\n<!-- INK_SKETCH_ATTACHED: ${note.id} -->\n`;
  }
  if (note.lectureInk) {
    md += `\n<!-- DIRECT_LECTURE_INK_ATTACHED: ${note.id} -->\n`;
  }
  return md;
}

export function exportWorkspaceJson(ws: Workspace): string {
  return JSON.stringify(ws, null, 2);
}

export const docRoute = (id: string, anchor = '') => `/read/${id}${anchor ? `#${anchor}` : ''}`;
export const lectureRoute = (topicId: string, lectureId: string) => `/topics/${topicId}/${lectureId}`;
export const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

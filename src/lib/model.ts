export type Note = {
  id: string;
  title: string;
  body: string;
  inkData?: string; // Serialized SVG or stroke vector points for scratchpad pen drawings
  lectureInk?: string; // Serialized strokes drawn directly on top of the lecture article text
  documentId?: string;
  lectureId?: string;
  createdAt: string;
  updatedAt: string;
};

export type PathItem = {
  id: string;
  title: string;
  question: string;
  theory: string;
  practice: string;
  source: string;
  status: 'next' | 'later' | 'done';
};

export type LectureProgressStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export type LectureProgress = {
  status: LectureProgressStatus;
  startedAt?: string;
  completedAt?: string;
};

export type StudyPlan = {
  activePathId: string;
  schedule: 'mastery-pack' | 'sunday-4h';
  startDate?: string;
  currentWeek: number;
};

export type Workspace = {
  version: 2;
  notes: Note[];
  read: string[];
  bookmarks: string[];
  completedSessions: number[]; // legacy session 1-4 numbers
  completedLectures: string[]; // lecture IDs
  lectureProgress: Record<string, LectureProgress>;
  studyPlan: StudyPlan;
  path: PathItem[];
  lastRead?: { id: string; at: string };
  theme: 'light' | 'dark' | 'system';
  fontScale: number;
};

export const emptyWorkspace = (): Workspace => ({
  version: 2,
  notes: [],
  read: [],
  bookmarks: [],
  completedSessions: [],
  completedLectures: [],
  lectureProgress: {},
  studyPlan: {
    activePathId: 'canonical-foundations-to-mastery',
    schedule: 'mastery-pack',
    currentWeek: 1
  },
  path: [],
  theme: 'light',
  fontScale: 1
});

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : [];

export function validateWorkspace(value: unknown): Workspace {
  if (!record(value) || (value.version !== 1 && value.version !== 2) || !Array.isArray(value.notes)) {
    throw new Error('This file is not a valid AINotes backup.');
  }
  if (value.notes.length > 10000) throw new Error('This backup contains too many notes.');

  const notes: Note[] = value.notes.map((n: unknown) => {
    if (
      !record(n) ||
      typeof n.id !== 'string' ||
      typeof n.title !== 'string' ||
      typeof n.body !== 'string' ||
      typeof n.updatedAt !== 'string' ||
      typeof n.createdAt !== 'string'
    ) {
      throw new Error('A note in this backup is incomplete.');
    }
    return {
      id: n.id,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      ...(typeof n.inkData === 'string' ? { inkData: n.inkData } : {}),
      ...(typeof n.lectureInk === 'string' ? { lectureInk: n.lectureInk } : {}),
      ...(typeof n.documentId === 'string' ? { documentId: n.documentId } : {}),
      ...(typeof n.lectureId === 'string' ? { lectureId: n.lectureId } : {})
    };
  });

  const path: PathItem[] = Array.isArray(value.path)
    ? value.path
        .filter(record)
        .filter(p => typeof p.id === 'string' && typeof p.title === 'string')
        .map(p => ({
          id: String(p.id),
          title: String(p.title),
          question: typeof p.question === 'string' ? p.question : '',
          theory: typeof p.theory === 'string' ? p.theory : '',
          practice: typeof p.practice === 'string' ? p.practice : '',
          source: typeof p.source === 'string' ? p.source : '',
          status: p.status === 'done' || p.status === 'later' ? p.status : 'next'
        }))
    : [];

  const lastRead =
    record(value.lastRead) &&
    typeof value.lastRead.id === 'string' &&
    typeof value.lastRead.at === 'string'
      ? { id: value.lastRead.id, at: value.lastRead.at }
      : undefined;

  const lectureProgress: Record<string, LectureProgress> = record(value.lectureProgress)
    ? Object.fromEntries(
        Object.entries(value.lectureProgress)
          .filter(([_, v]) => record(v) && typeof (v as any).status === 'string')
          .map(([k, v]) => [
            k,
            {
              status: (v as any).status,
              startedAt: (v as any).startedAt,
              completedAt: (v as any).completedAt
            }
          ])
      )
    : {};

  const studyPlan: StudyPlan = record(value.studyPlan)
    ? {
        activePathId:
          typeof (value.studyPlan as any).activePathId === 'string'
            ? (value.studyPlan as any).activePathId
            : 'canonical-foundations-to-mastery',
        schedule:
          (value.studyPlan as any).schedule === 'sunday-4h'
            ? 'sunday-4h'
            : 'mastery-pack',
        startDate: (value.studyPlan as any).startDate,
        currentWeek: Number.isInteger((value.studyPlan as any).currentWeek)
          ? Number((value.studyPlan as any).currentWeek)
          : 1
      }
    : {
        activePathId: 'canonical-foundations-to-mastery',
        schedule: 'mastery-pack',
        currentWeek: 1
      };

  return {
    version: 2,
    notes,
    path,
    read: strings(value.read),
    bookmarks: strings(value.bookmarks),
    completedSessions: Array.isArray(value.completedSessions)
      ? [
          ...new Set(
            value.completedSessions.filter(
              (n): n is number => Number.isInteger(n) && Number(n) >= 1 && Number(n) <= 4
            )
          )
        ]
      : [],
    completedLectures: strings(value.completedLectures),
    lectureProgress,
    studyPlan,
    theme: value.theme === 'dark' || value.theme === 'system' ? value.theme : 'light',
    fontScale: [0.9, 1, 1.12, 1.25].includes(Number(value.fontScale))
      ? Number(value.fontScale)
      : 1,
    lastRead
  };
}

export function mergeWorkspace(current: Workspace, incoming: Workspace): Workspace {
  const notes = new Map(current.notes.map(note => [note.id, note]));
  for (const note of incoming.notes) {
    if (!notes.has(note.id) || Date.parse(note.updatedAt) > Date.parse(notes.get(note.id)!.updatedAt)) {
      notes.set(note.id, note);
    }
  }

  const path = new Map(current.path.map(item => [item.id, item]));
  for (const item of incoming.path) {
    if (!path.has(item.id)) path.set(item.id, item);
  }

  return {
    ...current,
    notes: [...notes.values()],
    path: [...path.values()],
    read: [...new Set([...current.read, ...incoming.read])],
    bookmarks: [...new Set([...current.bookmarks, ...incoming.bookmarks])],
    completedSessions: [...new Set([...current.completedSessions, ...incoming.completedSessions])],
    completedLectures: [...new Set([...current.completedLectures, ...incoming.completedLectures])],
    lectureProgress: { ...current.lectureProgress, ...incoming.lectureProgress },
    studyPlan: {
      ...current.studyPlan,
      ...incoming.studyPlan,
      currentWeek: Math.max(current.studyPlan.currentWeek, incoming.studyPlan?.currentWeek || 1)
    },
    lastRead:
      incoming.lastRead &&
      (!current.lastRead || Date.parse(incoming.lastRead.at) > Date.parse(current.lastRead.at))
        ? incoming.lastRead
        : current.lastRead
  };
}

export function makeNote(
  title = 'Untitled note',
  documentId?: string,
  lectureId?: string,
  body = ''
): Note {
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

export const docRoute = (id: string, anchor = '') =>
  `/read/${id}${anchor ? `#${anchor}` : ''}`;
export const lectureRoute = (topicId: string, lectureId: string) =>
  `/topics/${topicId}/${lectureId}`;
export const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

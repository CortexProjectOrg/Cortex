import { z } from 'zod';
import { parseInk } from './ink.js';

export const MAX_WORKSPACE_BYTES = 3_500_000;
const id = z
  .string()
  .min(1)
  .max(160)
  .refine((v) => !['__proto__', 'constructor', 'prototype'].includes(v));
const date = z.string().datetime({ offset: true });
const ink = z
  .string()
  .max(2_000_000)
  .refine((v) => {
    try {
      parseInk(v);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid drawing');
const ids = z
  .array(id)
  .max(10_000)
  .refine((v) => new Set(v).size === v.length, 'Duplicate IDs');
export const noteSchema = z.object({
  id,
  title: z.string().max(1000),
  body: z.string().max(500_000),
  inkData: ink.optional(),
  lectureInk: ink.optional(),
  documentId: id.optional(),
  lectureId: id.optional(),
  createdAt: date,
  updatedAt: date
});
const pathSchema = z.object({
  id,
  title: z.string().max(1000),
  question: z.string().max(10_000),
  theory: z.string().max(20_000),
  practice: z.string().max(20_000),
  source: z.string().max(2000),
  status: z.enum(['next', 'later', 'done'])
});
const progressSchema = z.object({
  status: z.enum(['locked', 'available', 'in-progress', 'completed']),
  startedAt: date.optional(),
  completedAt: date.optional()
});
export const workspaceSchema = z.object({
  version: z.literal(2),
  notes: z
    .array(noteSchema)
    .max(2000)
    .refine((v) => new Set(v.map((n) => n.id)).size === v.length, 'Duplicate note IDs'),
  deletedNotes: ids.default([]),
  read: ids,
  bookmarks: ids,
  completedSessions: z.array(z.number().int().min(1).max(4)).max(4),
  completedLectures: ids,
  lectureProgress: z.record(id, progressSchema).refine((v) => Object.keys(v).length <= 1000),
  studyPlan: z.object({
    activePathId: id,
    schedule: z.enum(['mastery-pack', 'sunday-4h']),
    startDate: z.string().date().optional(),
    currentWeek: z.number().int().min(1).max(1000)
  }),
  path: z.array(pathSchema).max(1000),
  lastRead: z.object({ id, at: date }).optional(),
  theme: z.enum(['light', 'dark', 'system']),
  fontScale: z.union([z.literal(0.9), z.literal(1), z.literal(1.12), z.literal(1.25)])
});
export type Note = z.infer<typeof noteSchema>;
export type PathItem = z.infer<typeof pathSchema>;
export type LectureProgress = z.infer<typeof progressSchema>;
export type LectureProgressStatus = LectureProgress['status'];
export type Workspace = z.infer<typeof workspaceSchema>;
export type StudyPlan = Workspace['studyPlan'];
export type Snapshot = { revision: number; workspace: Workspace };

export const emptyWorkspace = (): Workspace => ({
  version: 2,
  notes: [],
  deletedNotes: [],
  read: [],
  bookmarks: [],
  completedSessions: [],
  completedLectures: [],
  lectureProgress: {},
  path: [],
  theme: 'light',
  fontScale: 1,
  studyPlan: { activePathId: 'canonical-foundations-to-mastery', schedule: 'mastery-pack', currentWeek: 1 }
});

export function parseWorkspace(value: unknown): Workspace {
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > MAX_WORKSPACE_BYTES) {
    throw new Error('Workspace exceeds the 3.5 MB limit. Export and archive older drawings.');
  }
  const result = workspaceSchema.safeParse(value);
  if (!result.success)
    throw new Error('This workspace contains invalid or unsupported data. Restore a valid AINotes backup.');
  return result.data;
}

/** Backup/cache migration only. The sync API requires the full current contract. */
export function validateWorkspace(value: unknown): Workspace {
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    ![1, 2].includes(Number(value.version)) ||
    !('notes' in value) ||
    !Array.isArray(value.notes)
  )
    throw new Error('This file is not a valid AINotes backup.');
  const input = value as Record<string, unknown>;
  const plan =
    input.studyPlan && typeof input.studyPlan === 'object'
      ? (input.studyPlan as Record<string, unknown>)
      : {};
  return parseWorkspace({
    ...emptyWorkspace(),
    ...input,
    version: 2,
    studyPlan: {
      ...emptyWorkspace().studyPlan,
      ...plan,
      schedule: plan.schedule === 'sunday-4h' ? 'sunday-4h' : 'mastery-pack'
    }
  });
}

export const equal = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Merge changes against the last acknowledged base; server revisions order writes, not device clocks. */
export function rebaseWorkspace(base: Workspace, local: Workspace, remote: Workspace): Workspace {
  const result = structuredClone(remote);
  const deleted = new Set([
    ...local.deletedNotes,
    ...remote.deletedNotes,
    ...base.notes
      .filter((n) => !local.notes.some((l) => l.id === n.id) || !remote.notes.some((r) => r.id === n.id))
      .map((n) => n.id)
  ]);
  result.deletedNotes = [...deleted].sort();
  const notes = new Map(remote.notes.filter((n) => !deleted.has(n.id)).map((n) => [n.id, n]));
  for (const note of local.notes) {
    if (deleted.has(note.id)) continue;
    const before = base.notes.find((n) => n.id === note.id);
    const other = notes.get(note.id);
    if (equal(before, note)) continue;
    if (other && !equal(other, before) && !equal(other, note)) {
      // Preserve a competing edit for review instead of silently discarding its text or drawing.
      const conflict = {
        ...other,
        id: conflictId(other),
        title: `${other.title.slice(0, 960)} (conflict copy)`
      };
      if (!deleted.has(conflict.id)) notes.set(conflict.id, conflict);
    }
    notes.set(note.id, note);
  }
  result.notes = [...notes.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const field of ['read', 'bookmarks', 'completedLectures', 'completedSessions'] as const) {
    const b = new Set<string | number>(base[field]),
      l = new Set<string | number>(local[field]);
    const values = new Set<string | number>(remote[field]);
    for (const value of b) if (!l.has(value)) values.delete(value);
    for (const value of l) if (!b.has(value)) values.add(value);
    Object.assign(result, { [field]: [...values].sort() });
  }
  for (const key of new Set([...Object.keys(base.lectureProgress), ...Object.keys(local.lectureProgress)])) {
    if (!equal(base.lectureProgress[key], local.lectureProgress[key])) {
      if (local.lectureProgress[key]) result.lectureProgress[key] = local.lectureProgress[key];
      else delete result.lectureProgress[key];
    }
  }
  for (const field of ['studyPlan', 'path', 'lastRead', 'theme', 'fontScale'] as const) {
    if (!equal(base[field], local[field])) Object.assign(result, { [field]: local[field] });
  }
  return equal(result, local) ? local : result;
}

function conflictId(note: Note) {
  let hash = 2166136261;
  for (const char of JSON.stringify(note)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `${note.id.slice(0, 135)}-conflict-${(hash >>> 0).toString(16)}`;
}

/** Explicit backup import: additive, latest dated note wins; preferences stay on this device. */
export function mergeWorkspace(current: Workspace, incoming: Workspace): Workspace {
  const notes = new Map(current.notes.map((n) => [n.id, n]));
  for (const note of incoming.notes) {
    if (current.deletedNotes.includes(note.id)) continue;
    const previous = notes.get(note.id);
    if (
      !previous ||
      note.updatedAt > previous.updatedAt ||
      (note.updatedAt === previous.updatedAt && JSON.stringify(note) > JSON.stringify(previous))
    )
      notes.set(note.id, note);
  }
  const union = <T>(a: T[], b: T[]) => [...new Set([...a, ...b])];
  return {
    ...current,
    notes: [...notes.values()],
    path: [...new Map([...incoming.path, ...current.path].map((p) => [p.id, p])).values()],
    read: union(current.read, incoming.read),
    bookmarks: union(current.bookmarks, incoming.bookmarks),
    completedSessions: union(current.completedSessions, incoming.completedSessions),
    completedLectures: union(current.completedLectures, incoming.completedLectures),
    lectureProgress: { ...incoming.lectureProgress, ...current.lectureProgress }
  };
}

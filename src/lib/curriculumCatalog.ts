import catalog from '../generated/catalog.json';
import type { Lecture, StudyPath, Topic } from './curriculum';
export type {
  CodeReference,
  Lecture,
  PaperReference,
  SoftLink,
  StudyPath,
  TheoreticalCitation,
  Topic
} from './curriculum';
export const TOPICS: Topic[] = catalog.topics;
export const ALL_LECTURES: Omit<Lecture, 'content'>[] = catalog.lectures;
export const LECTURE_MAP = new Map(ALL_LECTURES.map((l) => [l.id, l]));
export const FOUR_HOUR_MASTERY_PATH: StudyPath = catalog.path;

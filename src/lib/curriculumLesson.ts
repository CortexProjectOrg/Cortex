import type { Lecture, PaperReference, Topic } from './curriculum';

export type LessonDraft = Pick<Lecture, 'id' | 'title' | 'question' | 'prerequisites' | 'durationMinutes'> & {
  overview: string;
  theory: string;
  example: string;
  exercise: string;
  reference: PaperReference;
  formula: { name: string; expression: string; context: string };
};

export function lessonContent(
  overview: string,
  theory: string,
  example: string,
  exercise: string
): Lecture['content'] {
  return {
    motivation: overview,
    theory,
    workedExample: example,
    exercise,
    codeWalkthrough: '',
    reflectionPrompts: []
  };
}

export function studyPack(
  topic: Omit<Topic, 'number' | 'subtitle' | 'lectureIds'>,
  firstLecture: number,
  drafts: readonly LessonDraft[]
) {
  const lectures: Lecture[] = drafts.map(
    ({ overview, theory, example, exercise, reference, formula, ...draft }, i) => ({
      ...draft,
      topicId: topic.id,
      lectureNumber: firstLecture + i,
      packNumber: Math.floor((firstLecture - 1 + i) / 4) + 1,
      packSlot: ((firstLecture - 1 + i) % 4) + 1,
      subtitle: '',
      content: lessonContent(overview, theory, example, exercise),
      paperReferences: [reference],
      theoreticalCitations: [
        {
          formulaName: formula.name,
          expression: formula.expression,
          source: reference.title,
          theoremOrEquation: formula.context,
          doiOrUrl: reference.doi
            ? 'https://doi.org/' + reference.doi
            : (reference.arxivUrl ?? reference.sourceUrl)
        }
      ],
      codeReferences: [],
      implementationChoices: []
    })
  );
  return {
    topic: { ...topic, subtitle: '', lectureIds: lectures.map(({ id }) => id) },
    lectures
  };
}

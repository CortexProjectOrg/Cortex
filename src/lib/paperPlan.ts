import { z } from 'zod';
import { ALL_LECTURES } from './curriculumCatalog';
import type { Lecture } from './curriculum';
import { estimateStudyMinutes } from './studyTime';
import { CATALOG_ALIASES, normalizeCatalogName } from './catalogAliases';
import {
  buildStudyGraph,
  getStudyOrder,
  type StudyEdge,
  type StudyGraph,
  type StudyNode
} from './studyGraph';

const text = (max: number) => z.string().trim().min(1).max(max);
const id = z.string().regex(/^[a-z][a-z0-9_-]{0,63}$/);
export const paperAnalysisSchema = z.object({
  paperTitle: text(300),
  theorem: z
    .object({
      title: text(300),
      statement: text(6000),
      location: text(300),
      quote: text(2000),
      prerequisites: z.array(id).min(1).max(24)
    })
    .nullable(),
  explanation: text(2000),
  concepts: z
    .array(
      z.object({
        id,
        title: text(160),
        topic: text(100),
        reason: text(1000),
        source: text(300),
        evidence: z.string().max(1500),
        prerequisites: z.array(id).max(12),
        objectives: z.array(text(250)).min(1).max(5),
        explanation: text(6000),
        example: text(3000),
        exercise: text(1500),
        difficulty: z.number().int().min(1).max(3),
        practiceMinutes: z.number().int().min(5).max(45)
      })
    )
    .max(24)
});
export type PaperAnalysis = z.infer<typeof paperAnalysisSchema>;
type CatalogLecture = Omit<Lecture, 'content'>;
type PaperConcept = PaperAnalysis['concepts'][number];
export interface PaperNodeMetadata {
  lecture?: CatalogLecture;
  concepts: PaperConcept[];
  suggestions: CatalogLecture[];
}
export interface PaperPlan {
  analysis: PaperAnalysis;
  graph: StudyGraph | null;
  metadataById: ReadonlyMap<string, PaperNodeMetadata>;
  warnings: string[];
}

const specialized =
  /\b(quantum|qubits?|qudits?|paulis?|clifford|stabilizer|gottesman|ket|majorana|matchgate|jordan.wigner|bravyi.kitaev)\b/i;
const stopWords = new Set(['a', 'the', 'and', 'of', 'over', 'in', 'to', 'with', 'for', 'on', 'as']);
const tokens = (value: string) =>
  new Set(
    value
      .toLowerCase()
      .replace(/matrices/g, 'matrix')
      .match(/[\p{L}\p{N}]+/gu)
      ?.map((s) => (s.length > 3 ? s.replace(/s$/, '') : s))
      .filter((s) => !stopWords.has(s)) || []
  );

function compareId(a: string, b: string) {
  return a < b ? -1 : a === b ? 0 : 1;
}

function rankLectures(title: string, catalog: CatalogLecture[]) {
  const query = tokens(title);
  if (!query.size) return [];
  return catalog
    .flatMap((lecture) => {
      if (
        !isSpecializedTitle(title) &&
        (isSpecializedTitle(lecture.title) || specializedLectureIds.has(lecture.id))
      )
        return [];
      const words = tokens(lecture.title);
      const overlap = [...query].filter((word) => words.has(word)).length;
      if (overlap / query.size < 0.8) return [];
      return [{ lecture, score: overlap / Math.max(words.size, query.size) }];
    })
    .sort((a, b) => b.score - a.score || compareId(a.lecture.id, b.lecture.id));
}

/** Conservative title lookup, also used for legacy callers that expect a single best result. */
export function matchLecture(title: string, catalog: CatalogLecture[] = ALL_LECTURES) {
  const queryKey = [...tokens(title)].join(' ');
  if (!queryKey) return undefined;
  for (const [id, aliases] of CATALOG_ALIASES) {
    if (aliases.some((alias) => [...tokens(alias)].join(' ') === queryKey))
      return catalog.find((lecture) => lecture.id === id);
  }
  const matches = rankLectures(title, catalog);
  return matches[0] && (!matches[1] || matches[0].score > matches[1].score) ? matches[0].lecture : undefined;
}

/** DFS closure and topological ordering. Reject malformed graphs instead of inventing repairs. */
export function dependencyOrder(nodes: Map<string, { prerequisites: string[] }>, roots: string[]) {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const order: string[] = [];
  const visit = (nodeId: string) => {
    if (visiting.has(nodeId))
      throw new Error('The proposed prerequisites contain a cycle. Generate the tree again.');
    if (visited.has(nodeId)) return;
    const node = nodes.get(nodeId);
    if (!node) throw new Error('A prerequisite is missing from the proposed tree. Generate it again.');
    visiting.add(nodeId);
    [...new Set(node.prerequisites)].sort().forEach(visit);
    visiting.delete(nodeId);
    visited.add(nodeId);
    order.push(nodeId);
  };
  [...new Set(roots)].sort().forEach(visit);
  return order;
}

export class PaperEvidenceError extends Error {
  constructor() {
    super('A quoted passage was missing from the supplied text.');
  }
}

export const PAPER_TARGET_ID = 'paper:target';
export const MAX_PAPER_TREE_BYTES = 1_000_000;
const paperId = (id: string) => `paper:concept:${id}`;
const catalogId = (id: string) => `catalog:${id}`;

const specializedAliases = new Set([
  'pauli group',
  'pauli groups',
  'grover',
  'shor s algorithm',
  'bqp',
  'qma'
]);
const specializedLectureIds = new Set(
  [...CATALOG_ALIASES]
    .filter(([, aliases]) => aliases.some((alias) => specializedAliases.has(alias)))
    .map(([id]) => id)
);
const isSpecializedTitle = (title: string) =>
  specialized.test(title) || specializedAliases.has(normalizeCatalogName(title));

type PaperSource = { kind: 'import' | 'pdf' } | { kind: 'text'; text: string };

function studyMetadata(lecture?: CatalogLecture): PaperNodeMetadata {
  return { lecture, concepts: [], suggestions: [] };
}

function projectPaperGraph(
  theorem: NonNullable<PaperAnalysis['theorem']>,
  connected: readonly PaperConcept[],
  matches: ReadonlyMap<string, CatalogLecture>,
  catalog: ReadonlyMap<string, CatalogLecture>,
  suggestions: ReadonlyMap<string, CatalogLecture[]>
) {
  const nodes = new Map<string, StudyNode>();
  const metadataById = new Map<string, PaperNodeMetadata>();
  const edges: StudyEdge[] = [];
  const dependencies = new Map<string, { prerequisites: string[] }>();
  const addNode = (node: StudyNode, metadata: PaperNodeMetadata) => {
    nodes.set(node.id, node);
    metadataById.set(node.id, metadata);
    dependencies.set(node.id, { prerequisites: [] });
  };
  const requireNode = (prerequisiteId: string, dependentId: string, source: 'paper' | 'catalog') => {
    dependencies.get(dependentId)!.prerequisites.push(prerequisiteId);
    edges.push({ prerequisiteId, dependentId, sources: [source] });
  };
  const addLecture = (lectureId: string) => {
    const id = catalogId(lectureId);
    if (nodes.has(id)) return;
    const lecture = catalog.get(lectureId)!;
    addNode(
      {
        id,
        title: lecture.title,
        kind: 'catalog',
        catalogLectureId: lectureId,
        lectureNumber: lecture.lectureNumber,
        minutes: lecture.durationMinutes
      },
      studyMetadata(lecture)
    );
    for (const prerequisite of lecture.prerequisites) {
      addLecture(prerequisite);
      requireNode(catalogId(prerequisite), id, 'catalog');
    }
  };
  const projectConceptId = (id: string) => {
    const lecture = matches.get(id);
    return lecture ? catalogId(lecture.id) : paperId(id);
  };

  addNode({ id: PAPER_TARGET_ID, title: theorem.title, kind: 'target', minutes: null }, studyMetadata());
  for (const concept of connected) {
    const id = projectConceptId(concept.id);
    const lecture = matches.get(concept.id);
    if (lecture) addLecture(lecture.id);
    else {
      addNode(
        {
          id,
          title: concept.title,
          kind: 'concept',
          minutes: estimateStudyMinutes(
            `${concept.explanation} ${concept.example} ${concept.exercise}`,
            concept.objectives.length,
            concept.difficulty,
            concept.practiceMinutes
          )
        },
        studyMetadata()
      );
    }
    const metadata = metadataById.get(id)!;
    metadata.concepts.push(concept);
    metadata.suggestions.push(...(suggestions.get(concept.id) ?? []));
    for (const prerequisite of new Set(concept.prerequisites))
      requireNode(projectConceptId(prerequisite), id, 'paper');
  }
  for (const prerequisite of new Set(theorem.prerequisites))
    requireNode(projectConceptId(prerequisite), PAPER_TARGET_ID, 'paper');

  dependencyOrder(dependencies, [PAPER_TARGET_ID]);
  return { graph: buildStudyGraph([...nodes.values()], edges), metadataById };
}

export function buildPaperPlan(
  input: unknown,
  catalog: CatalogLecture[] = ALL_LECTURES,
  source: PaperSource = { kind: 'import' }
): PaperPlan {
  const parsed = paperAnalysisSchema.safeParse(input);
  if (!parsed.success)
    throw new Error('Gemini returned an incomplete study plan. Try again with the theorem and its proof.');
  const analysis = parsed.data;
  if (/!\[|<img\b/i.test(JSON.stringify(analysis)))
    throw new Error('The proposed plan includes external images. Generate a text-only plan.');

  const normalizeQuote = (value: string) => value.replace(/\s+/g, ' ').trim();
  const sourceText = source.kind === 'text' ? normalizeQuote(source.text) : null;
  const concepts = new Map<string, PaperConcept>();
  const titles = new Set<string>();
  for (const concept of analysis.concepts) {
    const signature = [...tokens(concept.title)].sort().join(' ');
    if (concepts.has(concept.id))
      throw new Error('The proposed tree contains duplicate concepts. Generate it again.');
    if (titles.has(signature)) throw new Error('The proposed tree repeats a topic. Generate it again.');
    if (
      !isSpecializedTitle(concept.title) &&
      specialized.test(
        [concept.explanation, concept.example, concept.exercise, ...concept.objectives].join(' ')
      )
    ) {
      throw new Error(
        `“${concept.title}” includes unrelated quantum material. Generate the tree again to keep lessons focused.`
      );
    }
    const quote = normalizeQuote(concept.evidence);
    if (concept.evidence && !quote) {
      if (source.kind !== 'import') throw new PaperEvidenceError();
      concept.evidence = '';
    }
    if (sourceText !== null && quote && !sourceText.includes(quote)) throw new PaperEvidenceError();
    concepts.set(concept.id, concept);
    titles.add(signature);
  }
  dependencyOrder(concepts, [...concepts.keys()]);
  const theorem = analysis.theorem;
  if (!theorem) return { analysis, graph: null, metadataById: new Map(), warnings: [] };
  if (sourceText !== null && !sourceText.includes(normalizeQuote(theorem.quote)))
    throw new PaperEvidenceError();

  const connected = dependencyOrder(concepts, theorem.prerequisites)
    .sort()
    .map((id) => concepts.get(id)!);
  const catalogMap = new Map(catalog.map((lecture) => [lecture.id, lecture]));
  const closureById = new Map<string, string[] | null>();
  const eligible = (concept: PaperConcept, lecture: CatalogLecture) => {
    if (!closureById.has(lecture.id)) {
      try {
        closureById.set(lecture.id, dependencyOrder(catalogMap, [lecture.id]));
      } catch {
        closureById.set(lecture.id, null);
      }
    }
    const closure = closureById.get(lecture.id);
    return (
      !!closure &&
      (isSpecializedTitle(concept.title) ||
        closure.every(
          (id) => !specializedLectureIds.has(id) && !isSpecializedTitle(catalogMap.get(id)!.title)
        ))
    );
  };
  const matches = new Map<string, CatalogLecture>();
  const suggestions = new Map<string, CatalogLecture[]>();
  for (const concept of connected) {
    const normalized = normalizeCatalogName(concept.title);
    const exact = catalog
      .filter(
        (lecture) =>
          (normalizeCatalogName(lecture.title) === normalized ||
            (CATALOG_ALIASES.get(lecture.id) ?? []).includes(normalized)) &&
          eligible(concept, lecture)
      )
      .sort((a, b) => compareId(a.id, b.id));
    if (exact.length === 1) {
      matches.set(concept.id, exact[0]);
      try {
        projectPaperGraph(theorem, connected, matches, catalogMap, suggestions);
        continue;
      } catch {
        matches.delete(concept.id);
      }
    }
    const candidates = [
      ...exact,
      ...rankLectures(concept.title, catalog)
        .map(({ lecture }) => lecture)
        .filter((lecture) => eligible(concept, lecture))
    ];
    suggestions.set(
      concept.id,
      [...new Map(candidates.map((lecture) => [lecture.id, lecture])).values()].slice(0, 3)
    );
  }
  const warnings = [
    'AI-proposed dependencies. Check the theorem, evidence, and prerequisites against the paper.'
  ];
  if (connected.length < analysis.concepts.length)
    warnings.push('Unrelated concepts were omitted from the study path.');
  return { analysis, ...projectPaperGraph(theorem, connected, matches, catalogMap, suggestions), warnings };
}

export function paperPlanMarkdown(plan: PaperPlan, evidenceStatus = 'Check in paper') {
  const { analysis, graph } = plan;
  const theorem = analysis.theorem;
  const order = graph ? getStudyOrder(graph, PAPER_TARGET_ID, new Set()).remaining : [];
  return [
    `# ${analysis.paperTitle}`,
    'AI-generated study plan. Review against the paper.',
    `## ${theorem?.title ?? 'No theorem found'}`,
    theorem?.statement ?? analysis.explanation,
    theorem
      ? `Source: ${theorem.location} (${evidenceStatus})\n\n> ${theorem.quote.replace(/\n/g, '\n> ')}`
      : '',
    ...order.map((id, index) => {
      const node = graph!.nodes.get(id)!;
      const { lecture, concepts } = plan.metadataById.get(id)!;
      const prerequisites = graph!.incoming
        .get(id)!
        .map((prerequisite) => graph!.nodes.get(prerequisite)!.title);
      return [
        `## ${index + 1}. ${node.title} · ~${node.minutes} min`,
        `Prerequisites: ${prerequisites.join(', ') || 'None'}`,
        lecture ? `[Read lecture](/topics/${lecture.topicId}/${lecture.id})` : '',
        ...concepts.map((concept) =>
          [
            concept.reason,
            concept.explanation,
            concept.example,
            `Exercise: ${concept.exercise}`,
            concept.evidence
              ? `Evidence: ${concept.source} (${evidenceStatus})\n${concept.evidence}`
              : 'Background prerequisite'
          ].join('\n\n')
        )
      ].join('\n\n');
    })
  ].join('\n\n');
}

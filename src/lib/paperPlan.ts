import { z } from 'zod';
import { ALL_LECTURES } from './curriculumCatalog';
import type { Lecture } from './curriculum';
import { estimateStudyMinutes } from './studyTime';

const text = (max: number) => z.string().trim().min(1).max(max);
const id = z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
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
export interface PlanNode {
  id: string;
  title: string;
  topic: string;
  prerequisites: string[];
  minutes: number;
  kind: 'paper' | 'catalog';
  lecture?: CatalogLecture;
  concept?: PaperAnalysis['concepts'][number];
}
export interface PaperPlan {
  analysis: PaperAnalysis;
  nodes: Map<string, PlanNode>;
  roots: string[];
  order: string[];
  totalMinutes: number;
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

/** Conservative title-only retrieval: broad concepts must not retrieve specialized applications. */
export function matchLecture(title: string, catalog: CatalogLecture[] = ALL_LECTURES) {
  const query = tokens(title);
  if (!query.size) return undefined;
  const aliases: Record<string, string> = {
    map: 'L01-sets-maps-proofs',
    function: 'L01-sets-maps-proofs',
    set: 'L01-sets-maps-proofs',
    group: 'L02-groups-modular-arithmetic',
    'group theory': 'L02-groups-modular-arithmetic',
    'pauli group': 'L16-n-qubit-pauli-strings',
    'finite field': 'L03-finite-fields-gf2-gfp',
    'vector space': 'L04-vector-spaces-finite-fields',
    'linear map': 'L05-linear-maps-matrices',
    'inner product': 'L09-complex-inner-products-hilbert'
  };
  const alias = aliases[[...query].join(' ')];
  if (alias) return catalog.find((lecture) => lecture.id === alias);
  const matches = catalog
    .flatMap((lecture) => {
      if (!specialized.test(title) && specialized.test(lecture.title)) return [];
      const words = tokens(lecture.title);
      const overlap = [...query].filter((word) => words.has(word)).length;
      if (overlap / query.size < 0.8) return [];
      return [{ lecture, score: overlap / Math.max(words.size, query.size) }];
    })
    .sort((a, b) => b.score - a.score || a.lecture.id.localeCompare(b.lecture.id));
  // Ambiguous matches stay as generated concepts instead of silently choosing a course.
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

export function buildPaperPlan(input: unknown, catalog: CatalogLecture[] = ALL_LECTURES): PaperPlan {
  const parsed = paperAnalysisSchema.safeParse(input);
  if (!parsed.success)
    throw new Error('Gemini returned an incomplete study plan. Try again with the theorem and its proof.');
  const analysis = parsed.data;
  if (/!\[|<img\b/i.test(JSON.stringify(analysis)))
    throw new Error('The proposed plan includes external images. Generate a text-only plan.');
  const nodes = new Map<string, PlanNode>();
  const catalogMap = new Map(catalog.map((l) => [l.id, l]));
  const titles = new Set<string>();
  for (const concept of analysis.concepts) {
    if (nodes.has(concept.id))
      throw new Error('The proposed tree contains duplicate concepts. Generate it again.');
    const signature = [...tokens(concept.title)].sort().join(' ');
    if (titles.has(signature)) throw new Error('The proposed tree repeats a topic. Generate it again.');
    titles.add(signature);
    if (
      !specialized.test(concept.title) &&
      specialized.test(
        [concept.explanation, concept.example, concept.exercise, ...concept.objectives].join(' ')
      )
    ) {
      throw new Error(
        `“${concept.title}” includes unrelated quantum material. Generate the tree again to keep lessons focused.`
      );
    }
    nodes.set(concept.id, {
      id: concept.id,
      title: concept.title,
      topic: concept.topic,
      prerequisites: [...new Set(concept.prerequisites)],
      kind: 'paper',
      concept,
      minutes: estimateStudyMinutes(
        `${concept.explanation} ${concept.example} ${concept.exercise}`,
        concept.objectives.length,
        concept.difficulty,
        concept.practiceMinutes
      )
    });
  }
  // Validate even disconnected model output; prune it only after integrity checks.
  dependencyOrder(nodes, [...nodes.keys()]);
  const roots = analysis.theorem?.prerequisites || [];
  const connected = dependencyOrder(nodes, roots);
  const keep = new Set(connected);
  for (const nodeId of nodes.keys()) if (!keep.has(nodeId)) nodes.delete(nodeId);
  const addLecture = (lectureId: string): string => {
    const nodeId = `catalog:${lectureId}`;
    if (nodes.has(nodeId)) return nodeId;
    const lecture = catalogMap.get(lectureId);
    if (!lecture) throw new Error('A course prerequisite is unavailable.');
    nodes.set(nodeId, {
      id: nodeId,
      title: lecture.title,
      topic: lecture.topicId,
      prerequisites: [],
      minutes: lecture.durationMinutes,
      kind: 'catalog',
      lecture
    });
    nodes.get(nodeId)!.prerequisites = lecture.prerequisites.map(addLecture);
    return nodeId;
  };
  // Include complete catalog prerequisites, only if their closure stays in the concept's domain.
  const usedLectures = new Set<string>();
  for (const nodeId of connected) {
    const node = nodes.get(nodeId)!;
    const match = matchLecture(node.title, catalog);
    if (!match || usedLectures.has(match.id)) continue;
    const closure = dependencyOrder(catalogMap, [match.id]);
    if (!specialized.test(node.title) && closure.some((key) => specialized.test(catalogMap.get(key)!.title)))
      continue;
    node.lecture = match;
    usedLectures.add(match.id);
    node.minutes = match.durationMinutes;
    node.prerequisites.push(...match.prerequisites.map(addLecture));
  }
  // Reuse a matched paper concept when a catalog dependency refers to the same lesson.
  const matched = new Map(
    connected.filter((key) => nodes.get(key)!.lecture).map((key) => [nodes.get(key)!.lecture!.id, key])
  );
  for (const node of nodes.values())
    node.prerequisites = [
      ...new Set(
        node.prerequisites.map((key) => (key.startsWith('catalog:') ? matched.get(key.slice(8)) || key : key))
      )
    ];
  const order = dependencyOrder(nodes, roots);
  const retained = new Set(order);
  for (const key of nodes.keys()) if (!retained.has(key)) nodes.delete(key);
  const warnings = [
    'AI-proposed dependencies. Check the theorem, evidence, and prerequisites against the paper.'
  ];
  if (connected.length < analysis.concepts.length)
    warnings.push('Unrelated concepts were omitted from the study path.');
  return {
    analysis,
    nodes,
    roots,
    order,
    totalMinutes: order.reduce((sum, key) => sum + nodes.get(key)!.minutes, 0),
    warnings
  };
}

export function paperPlanMarkdown(plan: PaperPlan) {
  const { analysis } = plan;
  return [
    `# ${analysis.paperTitle}`,
    'AI-generated study plan; verify against the paper.',
    `## ${analysis.theorem?.title || 'No theorem found'}`,
    analysis.theorem?.statement || analysis.explanation,
    analysis.theorem
      ? `Source: ${analysis.theorem.location}\n\n> ${analysis.theorem.quote.replace(/\n/g, '\n> ')}`
      : '',
    ...plan.order.map((key, index) => {
      const node = plan.nodes.get(key)!;
      return [
        `## ${index + 1}. ${node.title} · ~${node.minutes} min`,
        `Prerequisites: ${node.prerequisites.map((p) => plan.nodes.get(p)!.title).join(', ') || 'None'}`,
        node.lecture ? `[Read lecture](/topics/${node.lecture.topicId}/${node.lecture.id})` : '',
        node.concept
          ? [
              node.concept.reason,
              node.concept.explanation,
              node.concept.example,
              `Exercise: ${node.concept.exercise}`,
              `Evidence: ${node.concept.source}\n${node.concept.evidence}`
            ].join('\n\n')
          : ''
      ].join('\n\n');
    })
  ].join('\n\n');
}

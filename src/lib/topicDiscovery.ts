import { LECTURE_MAP, TOPICS } from './curriculumCatalog';
import type { Topic } from './curriculumCatalog';

export const SUBFIELDS = [
  {
    id: 'logic',
    title: 'Logic & proofs',
    description: 'Sets, functions, reasoning, and proof techniques.',
    keywords: 'foundations set theory logic induction invariants',
    tone: 'sage',
    topicIds: ['math-foundations', 'mathematical-proofs']
  },
  {
    id: 'algebra',
    title: 'Group theory & algebra',
    description: 'Groups, finite fields, and algebraic symmetries.',
    keywords: 'abstract algebra group theory modular arithmetic pauli clifford',
    tone: 'violet',
    topicIds: ['abstract-algebra', 'pauli-group', 'clifford-operations']
  },
  {
    id: 'linear-algebra',
    title: 'Linear algebra & numerics',
    description: 'Vectors, matrices, spectra, and numerical methods.',
    keywords: 'linear algebra numerical analysis computational mathematics',
    tone: 'blue',
    topicIds: ['linear-algebra', 'lanczos-algorithm', 'computational-mathematics']
  },
  {
    id: 'geometry',
    title: 'Geometry',
    description: 'Symplectic forms and structure-preserving maps.',
    keywords: 'symplectic geometry bilinear forms transvections',
    tone: 'rose',
    topicIds: ['symplectic-geometry']
  },
  {
    id: 'probability',
    title: 'Probability & statistics',
    description: 'Randomness, inference, sampling, and estimation.',
    keywords: 'probability statistics bayesian bayes monte carlo mcmc measurement estimation',
    tone: 'ochre',
    topicIds: ['probability-estimation', 'aquire-measurement']
  },
  {
    id: 'graphs',
    title: 'Graph theory',
    description: 'Graphs, partitions, automorphisms, and search.',
    keywords: 'graph theory discrete mathematics combinatorics graph algorithms',
    tone: 'sage',
    topicIds: ['graph-algorithms']
  },
  {
    id: 'complexity',
    title: 'Complexity theory',
    description: 'Classical and quantum limits of computation.',
    keywords: 'complexity theory computer science p np bqp qma reductions computational cost',
    tone: 'violet',
    topicIds: ['classical-complexity', 'quantum-complexity']
  },
  {
    id: 'quantum-mechanics',
    title: 'Quantum mechanics',
    description: 'States, Hamiltonians, dynamics, and open systems.',
    keywords: 'quantum physics mechanics hamiltonian dynamics spectra channels lindblad',
    tone: 'blue',
    topicIds: [
      'quantum-essentials',
      'hamiltonians-symmetries',
      'open-quantum-systems',
      'quantum-dynamics-spectra'
    ]
  },
  {
    id: 'quantum-computing',
    title: 'Quantum computing',
    description: 'Algorithms, stabilizers, and error correction.',
    keywords: 'quantum computing quantum computation',
    tone: 'sage',
    topicIds: ['stabilizer-formalism', 'quantum-error-correction', 'quantum-algorithms']
  },
  {
    id: 'simulation',
    title: 'Quantum simulation',
    description: 'Simulator design, tensor networks, and acceleration.',
    keywords: 'quantum simulation simulators computational physics',
    tone: 'ochre',
    topicIds: ['simulation-architecture', 'tensor-network-simulation', 'advanced-topics']
  },
  {
    id: 'hardware',
    title: 'Quantum hardware & noise',
    description: 'Qubit devices, control, readout, and noise.',
    keywords: 'quantum hardware experimental physics qubit devices',
    tone: 'rose',
    topicIds: ['superconducting-qubit-physics', 'quantum-noise-characterization']
  }
] as const;

export type Subfield = (typeof SUBFIELDS)[number];
export type SubfieldId = Subfield['id'];

const subfieldByTopic = new Map<string, Subfield>(
  SUBFIELDS.flatMap((field) => field.topicIds.map((id) => [id, field] as const))
);

export function getTopicSubfield(topicId: string): Subfield {
  const field = subfieldByTopic.get(topicId);
  if (!field) throw new Error(`Missing subfield for topic: ${topicId}`);
  return field;
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function matchesStudyQuery(query: string, ...values: string[]): boolean {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return !query.trim();
  const text = normalizeSearch(values.join(' '));
  return terms.every((term) => text.includes(term));
}

export function topicSearchTerms(topic: Topic): string[] {
  const field = getTopicSubfield(topic.id);
  return [topic.title, topic.subtitle, topic.description, field.title, field.keywords];
}

export function matchesTopicQuery(topic: Topic, query: string): boolean {
  const context = topicSearchTerms(topic);
  return (
    matchesStudyQuery(query, ...context) ||
    topic.lectureIds.some((id) => {
      const lecture = LECTURE_MAP.get(id);
      return (
        lecture && matchesStudyQuery(query, ...context, lecture.title, lecture.question, lecture.subtitle)
      );
    })
  );
}

export function discoverTopics(query: string, subfieldId: SubfieldId | 'all' = 'all'): Topic[] {
  return TOPICS.filter(
    (topic) =>
      (subfieldId === 'all' || getTopicSubfield(topic.id).id === subfieldId) &&
      matchesTopicQuery(topic, query)
  );
}

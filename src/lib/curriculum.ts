export interface TheoreticalCitation {
  formulaName: string;
  expression: string;
  source: string;
  theoremOrEquation: string;
  doiOrUrl?: string;
}

export interface PaperReference {
  title: string;
  authors: string;
  citation: string;
  arxivUrl?: string;
  doi?: string;
  relevantSections: string;
}

export interface CodeReference {
  crate: string;
  filePath: string;
  symbols: string[];
  purpose: string;
}

export interface SoftLink {
  targetId: string;
  relationship: string;
}

export interface Lecture {
  id: string;
  topicId: string;
  lectureNumber: number; // 1 to 60
  title: string;
  subtitle: string;
  durationMinutes: number; // 60 min true effort
  packNumber: number; // 1 to 15 (4-hour mastery packs)
  packSlot: number; // 1 to 4 (1-hour slots inside the pack)
  sundaySession?: number; // legacy alias for packNumber
  sundaySlot?: number; // legacy alias for packSlot
  question: string;
  theoreticalCitations: TheoreticalCitation[];
  paperReferences: PaperReference[];
  codeReferences: CodeReference[];
  implementationChoices: string[];
  content: {
    motivation: string;
    theory: string; // Markdown with LaTeX & precise equation references
    workedExample: string;
    codeWalkthrough: string;
    exercise: string;
    reflectionPrompts: string[];
  };
  prerequisites: string[];
  softLinks?: SoftLink[];
}

export interface Topic {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  symbol: string;
  lectureIds: string[];
  prerequisites: string[];
}

export interface MasteryPack {
  packNumber: number;
  title: string;
  theme: string;
  lectureIds: string[]; // 4 lectures per pack = 4h total
}

export interface StudyPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  totalPacks: number; // 15
  hoursPerPack: number; // 4
  totalLectures: number; // 60
  packs: MasteryPack[];
  weeks?: MasteryPack[]; // legacy alias
}

// 10 Comprehensive Topics
export const TOPICS: Topic[] = [
  {
    id: 'math-foundations',
    number: 1,
    title: 'Mathematical Foundations',
    subtitle: 'From Sets and Finite Fields to Symplectic Geometry',
    description:
      'The foundational mathematical bedrock: finite fields GF(2) and GF(p), discrete vector spaces, symplectic bilinear forms, and the symplectic group Sp(2n, F_p).',
    color: 'sage',
    symbol: 'F₂',
    lectureIds: [
      'L01-sets-maps-proofs',
      'L02-groups-modular-arithmetic',
      'L03-finite-fields-gf2-gfp',
      'L04-vector-spaces-finite-fields',
      'L05-linear-maps-matrices',
      'L06-bilinear-symplectic-forms',
      'L07-symplectic-group-sp2n',
      'L08-eigenvalues-without-diagonalization'
    ],
    prerequisites: []
  },
  {
    id: 'quantum-essentials',
    number: 2,
    title: 'Quantum Mechanics Essentials',
    subtitle: 'Hilbert Spaces, Qubits, Gates, and Entanglement',
    description:
      'A rigorous, coordinate-free introduction to quantum states, unitary evolution, projective measurement, tensor products, and entanglement.',
    color: 'ochre',
    symbol: 'Ψ',
    lectureIds: [
      'L09-complex-inner-products-hilbert',
      'L10-one-qubit-states-measurement',
      'L11-unitary-operators-quantum-gates',
      'L12-multi-qubit-systems-entanglement',
      'L13-density-matrices-mixed-states',
      'L14-circuit-model-universal-sets'
    ],
    prerequisites: ['math-foundations']
  },
  {
    id: 'pauli-group',
    number: 3,
    title: 'The Pauli Group & Symplectic Representation',
    subtitle: 'Mapping Quantum Operators to Discrete Binary Vectors',
    description:
      'Representing the Pauli group as a symplectic vector space over GF(2) and GF(p). Binary vectors, commutation as symplectic products, and phase arithmetic.',
    color: 'blue',
    symbol: 'Pₙ',
    lectureIds: [
      'L15-pauli-matrices-algebra',
      'L16-n-qubit-pauli-strings',
      'L17-binary-symplectic-encoding',
      'L18-symplectic-product-commutation',
      'L19-acquired-phases-hostens-moduli',
      'L20-pauli-sums-observables-hamiltonians'
    ],
    prerequisites: ['math-foundations', 'quantum-essentials']
  },
  {
    id: 'clifford-operations',
    number: 4,
    title: 'Clifford Operations & Symplectic Synthesis',
    subtitle: 'Normalizers, Transvections, and Efficient Circuits',
    description:
      'The Clifford group as the normalizer of the Pauli group. Symplectic matrix representation, transvection decomposition, circuit synthesis, and uniform Clifford sampling.',
    color: 'sage',
    symbol: 'Cₙ',
    lectureIds: [
      'L21-clifford-group-definition',
      'L22-standard-generators-conjugation',
      'L23-symplectic-clifford-isomorphism',
      'L24-symplectic-transvections',
      'L25-clifford-circuit-synthesis',
      'L26-clifford-uniform-sampling'
    ],
    prerequisites: ['pauli-group']
  },
  {
    id: 'stabilizer-formalism',
    number: 5,
    title: 'Stabilizer Formalism & Efficient Simulation',
    subtitle: 'Tableaux, Gottesman-Knill Theorem, and Measurement',
    description:
      'Stabilizer states, the Aaronson-Gottesman tableau formalism, polynomial-time Clifford simulation, stabilizer measurements, and magic states.',
    color: 'ochre',
    symbol: 'S',
    lectureIds: [
      'L27-stabilizer-states-generators',
      'L28-aaronson-gottesman-tableaux',
      'L29-tableau-gate-updates',
      'L30-stabilizer-measurement-algorithm',
      'L31-gottesman-knill-theorem',
      'L32-magic-states-pauli-based-computation'
    ],
    prerequisites: ['clifford-operations']
  },
  {
    id: 'simulation-architecture',
    number: 6,
    title: 'Simulation Architecture & Systems Optimization',
    subtitle: 'Bitboards, Pauli Frames, and Peephole Rewrites',
    description:
      'Systems engineering for quantum simulators: bit-parallel operations, automatic route selection, Pauli frame batching, and circuit simplification passes.',
    color: 'blue',
    symbol: '⚙',
    lectureIds: [
      'L33-program-ir-routes',
      'L34-pauli-frame-batched-sampling',
      'L35-circuit-peephole-rewrites',
      'L36-ket-networks-path-sums'
    ],
    prerequisites: ['stabilizer-formalism']
  },
  {
    id: 'hamiltonians-symmetries',
    number: 7,
    title: 'Hamiltonians, Symmetries & Block-Diagonalization',
    subtitle: 'Graph Automorphisms and Subspace Reductions',
    description:
      'Discovering Clifford and Pauli symmetries of many-body Hamiltonians, automorphism search on colored graphs, term fixers, and automated block-diagonalization.',
    color: 'rose',
    symbol: 'Aut',
    lectureIds: [
      'L37-many-body-hamiltonians-models',
      'L38-symmetry-as-operator-commutation',
      'L39-clifford-symmetries-paper-tour',
      'L40-colored-graphs-interaction-graphs',
      'L41-partition-refinement-backtracking',
      'L42-term-fixers-exact-kernel',
      'L43-commuting-paulis-sector-resolution',
      'L44-block-diagonalization-pipeline'
    ],
    prerequisites: ['pauli-group', 'clifford-operations']
  },
  {
    id: 'lanczos-algorithm',
    number: 8,
    title: 'The Lanczos Algorithm & Spectrum Solving',
    subtitle: 'Matrix-Free Krylov Subspaces for Massive Quantum Systems',
    description:
      'Theoretical derivation of Lanczos iteration, tridiagonal Ritz projection, matrix-free action via Pauli sums, single-precision tradeoffs, and GPU offload.',
    color: 'rose',
    symbol: 'Kₘ',
    lectureIds: [
      'L45-krylov-subspaces-power-iteration',
      'L46-lanczos-three-term-recurrence',
      'L47-matrix-free-hamiltonian-products',
      'L48-convergence-precision-architecture'
    ],
    prerequisites: ['hamiltonians-symmetries']
  },
  {
    id: 'aquire-measurement',
    number: 9,
    title: 'Quantum Observable Estimation & Clique Covers',
    subtitle: 'Adaptive Bayesian Shot Allocation and Posterior Covariance',
    description:
      'Estimating Hamiltonian expectation values with minimal measurement budgets: commutation graphs, maximal clique covers, rotated clique circuits, and MCMC covariance integration.',
    color: 'blue',
    symbol: '⟨H⟩',
    lectureIds: [
      'L49-quantum-observable-estimation-budget',
      'L50-commutation-graphs-clique-covers',
      'L51-rotated-cliques-diagonalization-circuits',
      'L52-bayesian-adaptive-allocation',
      'L53-mcmc-covariance-integration',
      'L54-hardware-noise-systematic-shifts'
    ],
    prerequisites: ['hamiltonians-symmetries']
  },
  {
    id: 'advanced-topics',
    number: 10,
    title: 'Free Fermions, QEC, GPUs & Qudits',
    subtitle: 'From Majorana Matchgates to CUDA and High-Dimensional Registers',
    description:
      'Advanced computational techniques: matchgate/free-fermion covariance simulation, quantum error correcting code automorphisms, CUDA Lanczos and covariance kernels, and prime qudit mathematics.',
    color: 'ochre',
    symbol: 'Z_d',
    lectureIds: [
      'L55-majorana-fermions-encodings',
      'L56-gaussian-states-matchgate-simulation',
      'L57-qec-stabilizer-codes-automorphisms',
      'L58-cuda-lanczos-gpu-kernels',
      'L59-batched-cuda-covariance-offload',
      'L60-qudit-algebra-mixed-dimension-registers'
    ],
    prerequisites: ['simulation-architecture', 'lanczos-algorithm', 'aquire-measurement']
  }
];

// Detailed metadata with full theoretical citations for key lectures
import { FULL_LECTURES_RECORD } from './curriculumData';

// Generates all 60 lectures systematically
export function getAllLectures(): Lecture[] {
  return TOPICS.flatMap((topic) =>
    topic.lectureIds.map((id) => {
      const lecture = FULL_LECTURES_RECORD[id];
      if (!lecture || lecture.topicId !== topic.id) throw new Error(`Missing or mismatched lecture: ${id}`);
      return lecture;
    })
  );
}

export const ALL_LECTURES = getAllLectures();
export const LECTURE_MAP = new Map(ALL_LECTURES.map((l) => [l.id, l]));

// The 15 Four-Hour Mastery Packs Study Path
export const FOUR_HOUR_MASTERY_PATH: StudyPath = {
  id: 'canonical-foundations-to-mastery',
  title: 'Symplectic Quantum Computing: Foundations to Mastery',
  subtitle: '15 Four-Hour Mastery Packs · 60 Focused 1-Hour Lectures',
  description:
    'A universal, foundational curriculum from basic discrete mathematics and finite fields to Clifford normalizers, matrix-free Lanczos spectrum solvers, and Bayesian observable estimation.',
  totalPacks: 15,
  hoursPerPack: 4,
  totalLectures: 60,
  packs: Array.from({ length: 15 }, (_, i) => {
    const packNumber = i + 1;
    const startIdx = i * 4;
    const packLectures = ALL_LECTURES.slice(startIdx, startIdx + 4);
    const packTopics = TOPICS.filter((t) => packLectures.some((l) => l.topicId === t.id));

    return {
      packNumber,
      title: `Pack ${packNumber}: ${packTopics.map((t) => t.title).join(' / ')}`,
      theme: packTopics.map((t) => t.subtitle).join(' · '),
      lectureIds: packLectures.map((l) => l.id)
    };
  })
};

// Aliases for compatibility
export const MASTERY_PACKS = FOUR_HOUR_MASTERY_PATH.packs;
export const SUNDAY_SCHOLAR_PATH = FOUR_HOUR_MASTERY_PATH;

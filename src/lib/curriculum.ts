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

export interface Lecture {
  id: string;
  topicId: string;
  lectureNumber: number; // 1 to 60
  title: string;
  subtitle: string;
  durationMinutes: number; // 60 min
  sundaySession: number; // 1 to 15
  sundaySlot: number; // 1 to 4
  question: string;
  paperReferences: PaperReference[];
  codeReferences: CodeReference[];
  implementationChoices: string[];
  content: {
    motivation: string;
    theory: string; // Markdown with LaTeX
    workedExample: string;
    codeWalkthrough: string;
    exercise: string;
    reflectionPrompts: string[];
  };
  prerequisites: string[];
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
  prerequisites: string[]; // topic IDs
}

export interface StudyPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  totalWeeks: number; // 15
  hoursPerWeek: number; // 4
  totalLectures: number; // 60
  weeks: {
    weekNumber: number;
    title: string;
    theme: string;
    lectureIds: string[]; // 4 lectures per week
  }[];
}

// 10 Topics
export const TOPICS: Topic[] = [
  {
    id: 'math-foundations',
    number: 1,
    title: 'Mathematical Foundations',
    subtitle: 'From Sets and Finite Fields to Symplectic Geometry',
    description:
      'The foundational mathematical bedrock: finite fields GF(2) and GF(p), vector spaces, symplectic bilinear forms, and the symplectic group Sp(2n, F_p).',
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
      'A rigorous, coordinate-free introduction to quantum states, unitary evolution, measurement projections, tensor products, and entanglement without unnecessary hand-waving.',
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
    subtitle: 'The Core Algebra: Mapping Quantum Operators to Binary Vectors',
    description:
      'How the Pauli group is represented as a symplectic vector space over GF(2) and GF(p). Binary vectors, commutation as symplectic inner products, and phase rings.',
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
      'The Clifford group as the normalizer of the Pauli group. Symplectic matrices, transvection decomposition, circuit synthesis, and Clifford sampling.',
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
      'Stabilizer states, the Aaronson-Gottesman tableau formalism, polynomial-time Clifford simulation, stabilizer measurements, and magic state injection.',
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
    title: 'Simulation Architecture & Optimizations',
    subtitle: 'Inside sympleq-core: Routes, Frames, and Peephole Passes',
    description:
      'The architectural decisions behind sympleq-core: automatic route selection, Pauli frame batching, circuit simplification passes, and path-sum simulation.',
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
    subtitle: 'The Nation et al. (2026) Framework & Graph Automorphisms',
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
      'Theoretical derivation of Lanczos iteration, tridiagonal Ritz projection, matrix-free matrix-vector products with Pauli sums, single-precision tradeoffs, and GPU porting.',
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
    title: 'AQUIRE Measurement Protocol',
    subtitle: 'Simon et al. (2026): Adaptive Bayesian Observable Estimation',
    description:
      'Estimating Hamiltonian expectation values with minimal shot budgets: commutation graphs, maximal clique covers, rotated clique circuits, and MCMC covariance integration.',
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
      'Advanced modules in QuAOS-Lab: matchgate/free-fermion covariance simulation, quantum error correcting code automorphisms, CUDA Lanczos and covariance kernels, and prime qudit mathematics.',
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

// Helper to construct lectures
export const LECTURES_DATA: Record<string, Partial<Lecture>> = {
  'L01-sets-maps-proofs': {
    title: 'Sets, Maps, and Mathematical Proof Patterns',
    subtitle: 'Establishing the vocabulary of exact mathematical reasoning',
    sundaySession: 1,
    sundaySlot: 1,
    question: 'How do set-theoretic definitions eliminate ambiguity in quantum algebra?',
    implementationChoices: [
      'Rust newtypes vs primitive types for register indices',
      'Zero-allocation iterator semantics in no_std Rust',
      'Compile-time validation of set invariants'
    ],
    codeReferences: [
      {
        crate: 'sympleq-core',
        filePath: 'src/lib.rs',
        symbols: ['Register', 'Qudit'],
        purpose: 'Fundamental set definitions of quantum registers'
      }
    ],
    paperReferences: [
      {
        title: 'Stabilizer states and Clifford operations for systems of arbitrary dimensions',
        authors: 'E. Hostens, J. Dehaene, B. De Moor',
        citation: 'Phys. Rev. A 71, 042315 (2005)',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/0408190',
        relevantSections: 'Section I & II: Set definitions of qudit registers'
      }
    ]
  },
  'L02-groups-modular-arithmetic': {
    title: 'Groups and Modular Arithmetic',
    subtitle: 'Algebraic symmetries and residues modulo n',
    sundaySession: 1,
    sundaySlot: 2,
    question: 'Why does modular arithmetic represent rotational and phase symmetries in computing?',
    implementationChoices: [
      'Fast modular arithmetic without division instructions (Montgomery/Barrett techniques)',
      'Avoiding overflow in 32-bit register arithmetic'
    ],
    codeReferences: [
      {
        crate: 'sympleq-core',
        filePath: 'src/modular.rs',
        symbols: ['Modulus', 'residue', 'inverse'],
        purpose: 'Modular reduction and group operations'
      }
    ],
    paperReferences: [
      {
        title: 'Stabilizer states and Clifford operations for systems of arbitrary dimensions',
        authors: 'E. Hostens, J. Dehaene, B. De Moor',
        citation: 'Phys. Rev. A 71, 042315 (2005)',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/0408190',
        relevantSections: 'Section II: Modular arithmetic in generalized Pauli groups'
      }
    ]
  },
  'L03-finite-fields-gf2-gfp': {
    title: 'Finite Fields: GF(2) and GF(p)',
    subtitle: 'Fields where division is always possible',
    sundaySession: 1,
    sundaySlot: 3,
    question: 'Why must qudit dimensions be prime, and why does GF(4) differ from Z/4Z?',
    implementationChoices: [
      'Exclusion of prime-power rings in sympleq-core to preserve field division',
      'Bitwise XOR representation for GF(2) addition'
    ],
    codeReferences: [
      {
        crate: 'sympleq-core',
        filePath: 'src/dimension.rs',
        symbols: ['Dimension', 'is_prime', 'field_element'],
        purpose: 'Enforcement of prime qudit dimensions'
      }
    ],
    paperReferences: [
      {
        title: 'Stabilizer states and Clifford operations for systems of arbitrary dimensions',
        authors: 'E. Hostens, J. Dehaene, B. De Moor',
        citation: 'Phys. Rev. A 71, 042315 (2005)',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/0408190',
        relevantSections: 'Section II: Field properties of prime qudit systems'
      }
    ]
  },
  'L04-vector-spaces-finite-fields': {
    title: 'Vector Spaces Over Finite Fields',
    subtitle: 'Linear independence and bases in GF(2)ⁿ',
    sundaySession: 1,
    sundaySlot: 4,
    question: 'How do n bits define points in an n-dimensional discrete vector space?',
    implementationChoices: [
      '64-bit packed bitstrings (`u64` bitboards) for 64-qubit vector operations',
      'SIMD vectorization for bit-parallel linear algebra'
    ],
    codeReferences: [
      {
        crate: 'sympleq-core',
        filePath: 'src/bits.rs',
        symbols: ['BitVector', 'dot_product', 'hamming_weight'],
        purpose: 'Packed binary vector representation'
      }
    ],
    paperReferences: [
      {
        title: 'Improved simulation of stabilizer circuits',
        authors: 'S. Aaronson, D. Gottesman',
        citation: 'Phys. Rev. A 70, 052328 (2004)',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/0406196',
        relevantSections: 'Section 2: Binary vector spaces for Pauli operators'
      }
    ]
  },
  'L17-binary-symplectic-encoding': {
    title: 'Binary Symplectic Representation of Pauli Operators',
    subtitle: 'The [x | z] tableau encoding and phase separation',
    sundaySession: 5,
    sundaySlot: 1,
    question: 'How do 2 bits per qubit completely specify any Pauli operator up to a phase factor?',
    implementationChoices: [
      'Separation of Pauli labels [x | z] from the acquired phase scalar',
      'Continuous memory buffer for tableau rows to maximize L1 cache hits'
    ],
    codeReferences: [
      {
        crate: 'sympleq-core',
        filePath: 'src/pauli/string.rs',
        symbols: ['PauliString', 'x_component', 'z_component'],
        purpose: 'Binary symplectic layout [x | z]'
      },
      {
        crate: 'sympleq-core',
        filePath: 'src/tableau.rs',
        symbols: ['Tableau', 'row', 'components'],
        purpose: 'M × 2N binary tableau'
      }
    ],
    paperReferences: [
      {
        title: 'Improved simulation of stabilizer circuits',
        authors: 'S. Aaronson, D. Gottesman',
        citation: 'Phys. Rev. A 70, 052328 (2004)',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/0406196',
        relevantSections: 'Section 3: The tableau data structure'
      }
    ]
  },
  'L18-symplectic-product-commutation': {
    title: 'The Symplectic Inner Product and Commutation',
    subtitle: 'Why ω(a, b) = a_z · b_x - a_x · b_z determines quantum interference',
    sundaySession: 5,
    sundaySlot: 2,
    question: 'How does a discrete geometric form compute whether two quantum operators commute?',
    implementationChoices: [
      'Branchless bitwise calculation: (a.z & b.x) ^ (a.x & b.z) followed by parity popcount',
      'Mixed-dimension lift using least common multiple (LCM)'
    ],
    codeReferences: [
      {
        crate: 'sympleq-core',
        filePath: 'src/pauli/string.rs',
        symbols: ['symplectic_product', 'commutes_with'],
        purpose: 'Commutation test via symplectic form'
      },
      {
        crate: 'sympleq-core',
        filePath: 'src/symplectic_algebra.rs',
        symbols: ['symplectic_form', 'omega'],
        purpose: 'General qudit symplectic product'
      }
    ],
    paperReferences: [
      {
        title: 'Stabilizer states and Clifford operations for systems of arbitrary dimensions',
        authors: 'E. Hostens, J. Dehaene, B. De Moor',
        citation: 'Phys. Rev. A 71, 042315 (2005)',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/0408190',
        relevantSections: 'Eq. (5) & (6): Symplectic form and commutation'
      }
    ]
  },
  'L46-lanczos-three-term-recurrence': {
    title: 'The Lanczos Algorithm: Three-Term Recurrence',
    subtitle: 'Constructing the Krylov tridiagonal matrix T_m = V_m^T H V_m',
    sundaySession: 12,
    sundaySlot: 2,
    question: 'Why does a three-term recurrence suffice to project a 2ⁿ × 2ⁿ Hamiltonian into tridiagonal form?',
    implementationChoices: [
      'Two-vector Lanczos (v_{k-1}, v_k, v_{k+1}) requiring only O(2ⁿ) memory instead of saving full Krylov basis',
      'Single-precision f32 storage for state vectors with f64 double-precision dot-product accumulation'
    ],
    codeReferences: [
      {
        crate: 'sympleq-application',
        filePath: 'src/spectrum.rs',
        symbols: ['lanczos', 'GroundEnergy', 'tridiagonal'],
        purpose: 'Core Lanczos solver loop'
      },
      {
        crate: 'sympleq-application',
        filePath: 'src/spectrum/operator.rs',
        symbols: ['MatrixFreeOperator', 'multiply_into'],
        purpose: 'State vector application'
      }
    ],
    paperReferences: [
      {
        title: 'Clifford symmetries in quantum many-body systems',
        authors: 'C. Nation, R. P. A. Simon, et al.',
        citation: 'arXiv:2605.18966 (2026)',
        arxivUrl: 'https://arxiv.org/abs/2605.18966',
        relevantSections: 'Section IV: Ground-state solving using symmetry-reduced blocks'
      }
    ]
  },
  'L47-matrix-free-hamiltonian-products': {
    title: 'Matrix-Free Matrix-Vector Products with Pauli Sums',
    subtitle: 'Evaluating H|v⟩ in O(M · 2ⁿ) operations without forming the matrix',
    sundaySession: 12,
    sundaySlot: 3,
    question: 'How does each Pauli term act as a single bit-flip and phase factor on basis states?',
    implementationChoices: [
      'A Pauli term X^x Z^z maps basis index |k⟩ directly to |k ^ x⟩ with sign (-1)^{k · z}',
      'Zero matrix memory: 0 bytes of dense matrix allocation for 30+ qubit systems'
    ],
    codeReferences: [
      {
        crate: 'sympleq-core',
        filePath: 'src/pauli/sum.rs',
        symbols: ['PauliSum', 'apply_to_vector'],
        purpose: 'Matrix-free product'
      },
      {
        crate: 'sympleq-gpu',
        filePath: 'kernels/lanczos.cu',
        symbols: ['matrix_free_spmv_kernel'],
        purpose: 'CUDA GPU matrix-free Lanczos kernel'
      }
    ],
    paperReferences: [
      {
        title: 'Clifford symmetries in quantum many-body systems',
        authors: 'C. Nation, R. P. A. Simon, et al.',
        citation: 'arXiv:2605.18966 (2026)',
        arxivUrl: 'https://arxiv.org/abs/2605.18966',
        relevantSections: 'Section IV-B: Numerical implementation of the matrix-free action'
      }
    ]
  },
  'L50-commutation-graphs-clique-covers': {
    title: 'Commutation Graphs and Maximal Clique Covers',
    subtitle: 'Grouping non-commuting Hamiltonian terms into simultaneously measurable sets',
    sundaySession: 13,
    sundaySlot: 2,
    question: 'How does graph coloring minimize the measurement shots needed for quantum chemistry?',
    implementationChoices: [
      'Heaviest-first greedy clique cover with weight capped by observable coefficient magnitude',
      'Dual modes: general commutation (all commuting Paulis) vs qubitwise commutation (easier hardware readout)'
    ],
    codeReferences: [
      {
        crate: 'sympleq-application',
        filePath: 'src/measurement/commutation.rs',
        symbols: ['CommutationGraph', 'CommutationMode'],
        purpose: 'Graph construction from PauliSum'
      },
      {
        crate: 'sympleq-application',
        filePath: 'src/measurement/cover.rs',
        symbols: ['clique_cover', 'greedy_cover'],
        purpose: 'Heaviest-first maximal clique partition'
      }
    ],
    paperReferences: [
      {
        title:
          'An Error-aware and Adaptive Method for the Estimation of Quantum Observables on Qudit-Based Quantum Computers',
        authors: 'R. P. A. Simon, et al.',
        citation: 'arXiv:2605.00682 (2026)',
        arxivUrl: 'https://arxiv.org/abs/2605.00682',
        relevantSections: 'Section III: Commutation partitioning and clique covers'
      }
    ]
  },
  'L53-mcmc-covariance-integration': {
    title: 'MCMC Posterior Covariance Integration',
    subtitle: 'Computing reliable confidence intervals across correlated measurement cliques',
    sundaySession: 14,
    sundaySlot: 1,
    question: 'Why does post-processing covariance via Markov Chain Monte Carlo dominate CPU runtime?',
    implementationChoices: [
      'Parallel MCMC chains using Rayon on CPU or batched CUDA threads on GPU',
      'Equation (7) covariance integration over Dirichlet posterior'
    ],
    codeReferences: [
      {
        crate: 'sympleq-application',
        filePath: 'src/measurement/posterior.rs',
        symbols: ['integrate_covariances', 'McmcState'],
        purpose: 'MCMC integration of covariance'
      },
      {
        crate: 'sympleq-gpu',
        filePath: 'src/cuda/covariance.rs',
        symbols: ['integrate_covariances_cuda'],
        purpose: 'GPU accelerated covariance integrator'
      }
    ],
    paperReferences: [
      {
        title:
          'An Error-aware and Adaptive Method for the Estimation of Quantum Observables on Qudit-Based Quantum Computers',
        authors: 'R. P. A. Simon, et al.',
        citation: 'arXiv:2605.00682 (2026)',
        arxivUrl: 'https://arxiv.org/abs/2605.00682',
        relevantSections: 'Section IV: Posterior covariance and Eq. (7)'
      }
    ]
  }
};

// Generate full list of 60 lectures
export function getAllLectures(): Lecture[] {
  const lectures: Lecture[] = [];

  let lectureCounter = 1;
  for (const topic of TOPICS) {
    for (const lectureId of topic.lectureIds) {
      const sundaySession = Math.ceil(lectureCounter / 4);
      const sundaySlot = ((lectureCounter - 1) % 4) + 1;
      const custom = LECTURES_DATA[lectureId] || {};

      const title =
        custom.title ||
        lectureId
          .replace(/^L\d+-/, '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

      const subtitle = custom.subtitle || `Detailed study of ${title.toLowerCase()} for symplectic computing.`;
      const question = custom.question || `What is the theoretical principle and implementation choice behind ${title}?`;

      lectures.push({
        id: lectureId,
        topicId: topic.id,
        lectureNumber: lectureCounter,
        title,
        subtitle,
        durationMinutes: 60,
        sundaySession,
        sundaySlot,
        question,
        paperReferences: custom.paperReferences || [
          {
            title: 'Stabilizer states and Clifford operations for systems of arbitrary dimensions',
            authors: 'E. Hostens, J. Dehaene, B. De Moor',
            citation: 'Phys. Rev. A 71, 042315 (2005)',
            arxivUrl: 'https://arxiv.org/abs/quant-ph/0408190',
            relevantSections: 'Core reference for symplectic Clifford algebra'
          }
        ],
        codeReferences: custom.codeReferences || [
          {
            crate: 'sympleq-core',
            filePath: 'src/lib.rs',
            symbols: ['sympleq_core'],
            purpose: 'Algebraic implementation'
          }
        ],
        implementationChoices: custom.implementationChoices || [
          'Zero-allocation memory layout in no_std',
          'Bitwise vector representation for cache locality'
        ],
        content: {
          motivation: `Understanding ${title} is crucial for mastering how quantum programs and many-body Hamiltonians are analyzed without exponential memory overhead.`,
          theory: `### 1. Conceptual Foundation\n\nIn this lecture, we examine **${title}** from first principles.\n\nLet $\\mathcal{H}$ be a finite-dimensional Hilbert space. When we represent quantum operators $P \\in \\mathcal{P}_n$, we observe that the phase and the algebraic action decouple:\n\n$$P = i^\\tau X^x Z^z$$\n\nwhere $x, z \\in \\mathbb{F}_2^n$ and $\\tau \\in \\mathbb{Z}_4$.\n\n### 2. Symplectic Invariance\n\nTwo Pauli operators commute if and only if their symplectic product vanishes:\n\n$$\\omega(a, b) = a_z \\cdot b_x - a_x \\cdot b_z \\equiv 0 \\pmod 2$$\n\nThis fundamental identity allows polynomial-time manipulation of quantum states that would otherwise require $2^n \\times 2^n$ dense complex matrices.`,
          workedExample: `#### Concrete Calculation\n\nConsider $n = 2$ qubits. Let $P_1 = X \\otimes Z$ and $P_2 = Z \\otimes X$.\n\n1. Represent $P_1$: $x_1 = (1, 0)$, $z_1 = (0, 1)$.\n2. Represent $P_2$: $x_2 = (0, 1)$, $z_2 = (1, 0)$.\n3. Calculate the symplectic product:\n   $$\\omega(P_1, P_2) = (z_1 \\cdot x_2) - (x_1 \\cdot z_2) = (0\\cdot 0 + 1\\cdot 1) - (1\\cdot 1 + 0\\cdot 0) = 1 - 1 = 0 \\pmod 2$$\n\nBecause $\\omega(P_1, P_2) = 0$, $P_1$ and $P_2$ **commute**, meaning they share a common basis of eigenstates.`,
          codeWalkthrough: `#### In the QuAOS-Lab Codebase\n\nInspect the implementation in \`sympleq-core/src/pauli/string.rs\`:\n\n\`\`\`rust\npub fn commutes_with(&self, other: &Self) -> bool {\n    self.symplectic_product(other) == 0\n}\n\`\`\`\n\nNotice how the codebase avoids floating-point matrix multiplications entirely: commutation is resolved using integer XOR and popcount instructions on binary bitboards.`,
          exercise: `**Paper & Pencil Exercise:**\nCompute by hand the symplectic product for $P_A = Y \\otimes I$ and $P_B = Z \\otimes Z$. Predict whether they commute, then verify by matrix multiplication.`,
          reflectionPrompts: [
            'What is the core intuition in my own words?',
            'Where does the phase factor belong in the binary tableau?',
            'What performance bottleneck does this representation avoid?'
          ]
        },
        prerequisites: lectureCounter > 1 ? [`L${String(lectureCounter - 1).padStart(2, '0')}`] : []
      });

      lectureCounter++;
    }
  }

  return lectures;
}

export const ALL_LECTURES = getAllLectures();
export const LECTURE_MAP = new Map(ALL_LECTURES.map(l => [l.id, l]));

// The Study Path: 15 Sundays x 4 hours (60 lectures)
export const SUNDAY_SCHOLAR_PATH: StudyPath = {
  id: 'quaos-foundations-to-mastery',
  title: 'Symplectic Quantum Computing: Zero to QuAOS-Lab Mastery',
  subtitle: '15 Sundays · 4 Hours per Session · 60 Focused 1-Hour Lectures',
  description:
    'A complete, rigorous journey from foundational finite fields and quantum mechanics to the frontiers of Clifford symmetries, matrix-free Lanczos solvers, and the AQUIRE observable estimation protocol.',
  totalWeeks: 15,
  hoursPerWeek: 4,
  totalLectures: 60,
  weeks: Array.from({ length: 15 }, (_, i) => {
    const weekNumber = i + 1;
    const startIdx = i * 4;
    const weekLectures = ALL_LECTURES.slice(startIdx, startIdx + 4);
    const primaryTopic = TOPICS.find(t => t.id === weekLectures[0]?.topicId) || TOPICS[0];

    return {
      weekNumber,
      title: `Sunday ${weekNumber}: ${primaryTopic.title}`,
      theme: primaryTopic.subtitle,
      lectureIds: weekLectures.map(l => l.id)
    };
  })
};

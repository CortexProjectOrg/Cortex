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
export const LECTURES_DATA: Record<string, Partial<Lecture>> = {
  'L01-sets-maps-proofs': {
    title: 'Sets, Maps, and Mathematical Proof Patterns',
    subtitle: 'Establishing the vocabulary of exact discrete mathematical reasoning',
    packNumber: 1,
    packSlot: 1,
    question: 'How do set-theoretic definitions eliminate ambiguity in discrete quantum algebra?',
    theoreticalCitations: [
      {
        formulaName: 'Cartesian Product & Map Definition',
        expression: 'f: A \\to B, \\quad \\text{where } \\forall a \\in A, \\, \\exists! b \\in B \\text{ s.t. } (a,b) \\in f',
        source: 'Halmos, Naive Set Theory (1960)',
        theoremOrEquation: 'Section 8: Functions as subsets of Cartesian products'
      }
    ],
    implementationChoices: [
      'Rust newtypes vs primitive integers to prevent register indexing errors',
      'Zero-allocation iterator semantics in no_std Rust systems',
      'Compile-time validation of set invariants'
    ],
    codeReferences: [
      {
        crate: 'quantum-core',
        filePath: 'src/register.rs',
        symbols: ['Register', 'QuditIndex'],
        purpose: 'Fundamental discrete set definitions of quantum registers'
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
  'L06-bilinear-symplectic-forms': {
    title: 'Bilinear Forms and the Symplectic Invariant',
    subtitle: 'Why skew-symmetric geometry governs quantum operator commutation',
    packNumber: 2,
    packSlot: 2,
    question: 'What defines a non-degenerate alternating bilinear form over finite fields?',
    theoreticalCitations: [
      {
        formulaName: 'Standard Symplectic Form over F_p',
        expression: '\\omega(u, v) = u_z \\cdot v_x - u_x \\cdot v_z \\pmod p',
        source: 'Hostens, Dehaene, De Moor (2005)',
        theoremOrEquation: 'Eq. (5) & Eq. (6)',
        doiOrUrl: 'https://doi.org/10.1103/PhysRevA.71.042315'
      },
      {
        formulaName: 'Non-Degeneracy Condition',
        expression: '\\forall u \\neq 0, \\, \\exists v \\text{ s.t. } \\omega(u, v) \\neq 0',
        source: 'Artin, Geometric Algebra (1957)',
        theoremOrEquation: 'Chapter III: Symplectic Geometry'
      }
    ],
    implementationChoices: [
      'Branchless bitwise calculation using XOR and AND instructions',
      'Bit-parallel popcount for O(1) symplectic inner products'
    ],
    codeReferences: [
      {
        crate: 'quantum-core',
        filePath: 'src/symplectic.rs',
        symbols: ['symplectic_product', 'omega'],
        purpose: 'Discrete symplectic bilinear form computation'
      }
    ],
    paperReferences: [
      {
        title: 'Synthesis of Logical Clifford Operators via Symplectic Geometry',
        authors: 'N. Rengaswamy, R. Calderbank, S. Kadhe, H. D. Pfister',
        citation: 'Proc. IEEE ISIT, pp. 791-795 (2018)',
        arxivUrl: 'https://arxiv.org/abs/1803.06987',
        relevantSections: 'Section II: Symplectic Geometry over Finite Fields'
      }
    ]
  },
  'L17-binary-symplectic-encoding': {
    title: 'Binary Symplectic Representation of Pauli Operators',
    subtitle: 'The [x | z] tableau encoding and phase decoupling',
    packNumber: 5,
    packSlot: 1,
    question: 'How do 2 bits per qubit completely specify any Pauli operator up to a global phase factor?',
    theoreticalCitations: [
      {
        formulaName: 'Pauli Operator Decomposition',
        expression: 'P(x, z, \\tau) = i^\\tau X^{x_1} Z^{z_1} \\otimes \\cdots \\otimes X^{x_n} Z^{z_n}, \\quad x, z \\in \\mathbb{F}_2^n, \\, \\tau \\in \\mathbb{Z}_4',
        source: 'Aaronson & Gottesman (2004)',
        theoremOrEquation: 'Section 3: The Tableau Formalism, Lemma 1',
        doiOrUrl: 'https://doi.org/10.1103/PhysRevA.70.052328'
      }
    ],
    implementationChoices: [
      'Separation of Pauli labels [x | z] from the acquired phase scalar',
      'Continuous 64-byte aligned memory buffer for tableau rows to maximize L1 cache bandwidth'
    ],
    codeReferences: [
      {
        crate: 'quantum-core',
        filePath: 'src/pauli.rs',
        symbols: ['PauliString', 'x_bits', 'z_bits'],
        purpose: 'Binary symplectic layout [x | z]'
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
    packNumber: 5,
    packSlot: 2,
    question: 'How does a discrete geometric form compute whether two quantum operators commute?',
    theoreticalCitations: [
      {
        formulaName: 'Pauli Commutation Relation',
        expression: 'P_a P_b = (-1)^{\\omega(a, b)} P_b P_a, \\quad \\text{where } \\omega(a, b) = a_z \\cdot b_x - a_x \\cdot b_z \\pmod 2',
        source: 'Nielsen & Chuang, Quantum Computation and Quantum Information',
        theoremOrEquation: 'Theorem 10.1: Group properties of Pauli operators (Eq. 10.4)',
        doiOrUrl: 'https://doi.org/10.1017/CBO9780511976667'
      }
    ],
    implementationChoices: [
      'Hardware instruction popcnt((a.z & b.x) ^ (a.x & b.z)) & 1',
      'Zero branch misprediction in inner simulation loops'
    ],
    codeReferences: [
      {
        crate: 'quantum-core',
        filePath: 'src/pauli.rs',
        symbols: ['commutes_with', 'symplectic_product'],
        purpose: 'O(1) commutation check'
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
  'L21-clifford-group-definition': {
    title: 'The Clifford Group as Normalizer of the Pauli Group',
    subtitle: 'Unitaries preserving Pauli structure under conjugation',
    packNumber: 6,
    packSlot: 1,
    question: 'Why does the normalizer C_n = { U : U P U^† ∈ P_n } preserve symplectic geometry?',
    theoreticalCitations: [
      {
        formulaName: 'Clifford Group Definition',
        expression: '\\mathcal{C}_n = \\{ U \\in \\mathcal{U}(2^n) \\mid U \\mathcal{P}_n U^\\dagger = \\mathcal{P}_n \\}',
        source: 'D. Gottesman, Ph.D. Thesis, Caltech (1997)',
        theoremOrEquation: 'Chapter 3: Stabilizer Codes and the Clifford Group',
        doiOrUrl: 'https://arxiv.org/abs/quant-ph/9705052'
      }
    ],
    implementationChoices: [
      'Representing Clifford gates as 2n × 2n symplectic matrices + linear phase vectors',
      'Conjugation computed in O(n) per gate without matrix inversion'
    ],
    codeReferences: [
      {
        crate: 'quantum-core',
        filePath: 'src/clifford.rs',
        symbols: ['CliffordGate', 'conjugate_pauli'],
        purpose: 'Action of Cliffords on Paulis'
      }
    ],
    paperReferences: [
      {
        title: 'Synthesis of Logical Clifford Operators via Symplectic Geometry',
        authors: 'N. Rengaswamy, et al.',
        citation: 'Proc. IEEE ISIT (2018)',
        arxivUrl: 'https://arxiv.org/abs/1803.06987',
        relevantSections: 'Section I & II: The Clifford Group as Symplectic Transformations'
      }
    ]
  },
  'L31-gottesman-knill-theorem': {
    title: 'The Gottesman-Knill Theorem and Polynomial Simulation',
    subtitle: 'Why quantum entanglement alone is insufficient for quantum computational supremacy',
    packNumber: 8,
    packSlot: 3,
    question: 'How do stabilizer states containing maximal entanglement simulate in O(n²) time?',
    theoreticalCitations: [
      {
        formulaName: 'Gottesman-Knill Theorem',
        expression: '\\text{Any circuit with } |0\\rangle^{\\otimes n} \\text{ input, Clifford gates, and Pauli measurements simulates in } \\mathcal{O}(m \\cdot n) \\text{ or } \\mathcal{O}(m \\cdot n^2)',
        source: 'Aaronson & Gottesman (2004)',
        theoremOrEquation: 'Theorem 1: Efficient Simulation of Stabilizer Circuits',
        doiOrUrl: 'https://doi.org/10.1103/PhysRevA.70.052328'
      }
    ],
    implementationChoices: [
      'Pauli frame updating: deferring measurement updates during pure Clifford execution',
      'Gaussian elimination over GF(2) with SIMD word swaps'
    ],
    codeReferences: [
      {
        crate: 'quantum-core',
        filePath: 'src/simulator.rs',
        symbols: ['StabilizerSimulator', 'run_circuit'],
        purpose: 'Polynomial-time Clifford simulator engine'
      }
    ],
    paperReferences: [
      {
        title: 'Improved simulation of stabilizer circuits',
        authors: 'S. Aaronson, D. Gottesman',
        citation: 'Phys. Rev. A 70, 052328 (2004)',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/0406196',
        relevantSections: 'Sections 1-4'
      }
    ]
  },
  'L46-lanczos-three-term-recurrence': {
    title: 'The Lanczos Algorithm: Three-Term Recurrence',
    subtitle: 'Constructing the Krylov tridiagonal matrix T_m = V_m^T H V_m',
    packNumber: 12,
    packSlot: 2,
    question: 'Why does a three-term recurrence project a 2ⁿ × 2ⁿ Hermitian operator into tridiagonal form?',
    theoreticalCitations: [
      {
        formulaName: 'Lanczos Three-Term Recurrence Relation',
        expression: '\\beta_j v_{j+1} = H v_j - \\alpha_j v_j - \\beta_{j-1} v_{j-1}, \\quad \\alpha_j = v_j^\\dagger H v_j, \\, \\beta_j = \\|H v_j - \\alpha_j v_j - \\beta_{j-1} v_{j-1}\\|',
        source: 'C. Lanczos, J. Res. Natl. Bur. Stand. 45, 255 (1950)',
        theoremOrEquation: 'Section 3: An iteration method for the solution of the eigenvalue problem',
        doiOrUrl: 'https://doi.org/10.6028/jres.045.026'
      },
      {
        formulaName: 'Rayleigh-Ritz Projection Theorem',
        expression: 'T_m = V_m^\\dagger H V_m = \\begin{pmatrix} \\alpha_1 & \\beta_1 & & \\\\ \\beta_1 & \\alpha_2 & \\ddots & \\\\ & \\ddots & \\ddots & \\beta_{m-1} \\\\ & & \\beta_{m-1} & \\alpha_m \\end{pmatrix}',
        source: 'Golub & Van Loan, Matrix Computations (4th ed., 2013)',
        theoremOrEquation: 'Algorithm 9.1.1: The Lanczos Algorithm'
      }
    ],
    implementationChoices: [
      'Two-vector Lanczos (v_{k-1}, v_k, v_{k+1}) requiring only O(2ⁿ) memory instead of storing the full Krylov basis',
      'Single-precision f32 storage for state vectors with f64 double-precision dot-product accumulation'
    ],
    codeReferences: [
      {
        crate: 'quantum-spectrum',
        filePath: 'src/lanczos.rs',
        symbols: ['lanczos_ground_energy', 'TridiagonalMatrix'],
        purpose: 'Core Lanczos eigensolver'
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
    packNumber: 12,
    packSlot: 3,
    question: 'How does each Pauli term act as a single bit-flip and phase factor on computational basis states?',
    theoreticalCitations: [
      {
        formulaName: 'Pauli Action on Computational Basis State',
        expression: '(X^x Z^z) |k\\rangle = (-1)^{k \\cdot z} |k \\oplus x\\rangle, \\quad k, x, z \\in \\mathbb{F}_2^n',
        source: 'Nielsen & Chuang (2010)',
        theoremOrEquation: 'Section 4.2: Pauli matrices as permutations and phase gates'
      }
    ],
    implementationChoices: [
      'Zero matrix memory allocation: enables simulating 28+ qubit systems entirely in RAM or GPU VRAM',
      'Direct index arithmetic: k ^ x for index permutation and popcnt(k & z) & 1 for sign computation'
    ],
    codeReferences: [
      {
        crate: 'quantum-spectrum',
        filePath: 'src/matrix_free.rs',
        symbols: ['MatrixFreeOperator', 'multiply_into'],
        purpose: 'Sparse matrix-free Hamiltonian multiplication'
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
    subtitle: 'Partitioning non-commuting Hamiltonian terms into simultaneously measurable sets',
    packNumber: 13,
    packSlot: 2,
    question: 'How does graph coloring minimize the measurement shots needed for quantum chemistry?',
    theoreticalCitations: [
      {
        formulaName: 'Commutation Graph Definition',
        expression: 'G = (V, E), \\quad V = \\{ P_i \\}, \\, (P_i, P_j) \\in E \\iff \\omega(P_i, P_j) = 0',
        source: 'Simon et al., arXiv:2605.00682 (2026)',
        theoremOrEquation: 'Section III: Graph representations of observable commutation'
      }
    ],
    implementationChoices: [
      'Heaviest-first greedy clique cover with weight capped by observable coefficient magnitude',
      'Dual modes: general commutation (all commuting Paulis) vs qubitwise commutation (hardware friendly)'
    ],
    codeReferences: [
      {
        crate: 'quantum-measurement',
        filePath: 'src/commutation.rs',
        symbols: ['CommutationGraph', 'clique_cover'],
        purpose: 'Graph construction and maximal clique partition'
      }
    ],
    paperReferences: [
      {
        title: 'An Error-aware and Adaptive Method for the Estimation of Quantum Observables on Qudit-Based Quantum Computers',
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
    packNumber: 14,
    packSlot: 1,
    question: 'Why does integrating posterior covariance via Markov Chain Monte Carlo guarantee unbiased error bounds?',
    theoreticalCitations: [
      {
        formulaName: 'Posterior Covariance Integral',
        expression: '\\operatorname{Cov}(P_i, P_j) = \\int (\\langle P_i \\rangle - \\mu_i)(\\langle P_j \\rangle - \\mu_j) \\, p(\\vec{\\mu} \\mid \\vec{D}) \\, d\\vec{\\mu}',
        source: 'Simon et al., arXiv:2605.00682 (2026)',
        theoremOrEquation: 'Eq. (7): Bayesian posterior covariance integration under Dirichlet prior'
      }
    ],
    implementationChoices: [
      'Parallel MCMC chains using multi-threaded CPU workers or batched CUDA threads on GPU',
      'Equation (7) covariance integration with automatic burn-in and convergence check'
    ],
    codeReferences: [
      {
        crate: 'quantum-measurement',
        filePath: 'src/posterior.rs',
        symbols: ['integrate_covariances', 'McmcState'],
        purpose: 'Bayesian MCMC covariance integrator'
      }
    ],
    paperReferences: [
      {
        title: 'An Error-aware and Adaptive Method for the Estimation of Quantum Observables on Qudit-Based Quantum Computers',
        authors: 'R. P. A. Simon, et al.',
        citation: 'arXiv:2605.00682 (2026)',
        arxivUrl: 'https://arxiv.org/abs/2605.00682',
        relevantSections: 'Section IV: Posterior covariance and Eq. (7)'
      }
    ]
  }
};

// Generates all 60 lectures systematically
export function getAllLectures(): Lecture[] {
  const lectures: Lecture[] = [];
  let lectureCounter = 1;

  for (const topic of TOPICS) {
    for (const lectureId of topic.lectureIds) {
      const packNumber = Math.ceil(lectureCounter / 4);
      const packSlot = ((lectureCounter - 1) % 4) + 1;
      const custom = LECTURES_DATA[lectureId] || {};

      const title =
        custom.title ||
        lectureId
          .replace(/^L\d+-/, '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

      const subtitle = custom.subtitle || `Rigorous mathematical analysis and implementation of ${title.toLowerCase()}.`;
      const question = custom.question || `What is the theoretical principle and implementation architecture of ${title}?`;

      const defaultCitation: TheoreticalCitation = {
        formulaName: `${title} Algebraic Form`,
        expression: 'P_a P_b = (-1)^{\\omega(a, b)} P_b P_a, \\quad \\omega(a, b) = a_z \\cdot b_x - a_x \\cdot b_z \\pmod 2',
        source: 'Hostens, Dehaene, De Moor, Phys. Rev. A 71, 042315 (2005)',
        theoremOrEquation: 'Eq. (4) & Eq. (5): Symplectic product and Pauli commutation'
      };

      lectures.push({
        id: lectureId,
        topicId: topic.id,
        lectureNumber: lectureCounter,
        title,
        subtitle,
        durationMinutes: 60,
        packNumber,
        packSlot,
        sundaySession: packNumber,
        sundaySlot: packSlot,
        question,
        theoreticalCitations: custom.theoreticalCitations || [defaultCitation],
        paperReferences: custom.paperReferences || [
          {
            title: 'Stabilizer states and Clifford operations for systems of arbitrary dimensions',
            authors: 'E. Hostens, J. Dehaene, B. De Moor',
            citation: 'Phys. Rev. A 71, 042315 (2005)',
            arxivUrl: 'https://arxiv.org/abs/quant-ph/0408190',
            relevantSections: 'Foundational framework for symplectic Clifford and Pauli algebra'
          }
        ],
        codeReferences: custom.codeReferences || [
          {
            crate: 'quantum-core',
            filePath: 'src/lib.rs',
            symbols: ['quantum_core'],
            purpose: 'Algebraic implementation'
          }
        ],
        implementationChoices: custom.implementationChoices || [
          'Zero-allocation memory layout in no_std systems',
          'Bitwise vector representation for L1 cache locality and SIMD throughput'
        ],
        content: {
          motivation: `Understanding **${title}** is fundamental for mastering how quantum programs, stabilizer codes, and many-body Hamiltonians are analyzed without exponential memory overhead.`,
          theory: `### 1. Conceptual Foundation & Formula References

In this lecture, we examine **${title}** from first principles.

> **Theoretical Reference (Hostens et al., Phys. Rev. A 71, 042315 (2005), Eq. 2 & Eq. 4):**
> Let $\\mathcal{H}$ be a finite-dimensional Hilbert space. When representing quantum operators $P \\in \\mathcal{P}_n$, the phase factor and the algebraic symplectic action decouple:
>
> $$P = i^\\tau X^x Z^z, \\quad x, z \\in \\mathbb{F}_2^n, \\, \\tau \\in \\mathbb{Z}_4$$

### 2. Symplectic Invariance & Commutation

Two Pauli operators commute if and only if their standard alternating bilinear form (symplectic product) vanishes:

> **Commutation Theorem (Aaronson & Gottesman, Phys. Rev. A 70, 052328 (2004), Lemma 1):**
> $$\\omega(a, b) = a_z \\cdot b_x - a_x \\cdot b_z \\equiv 0 \\pmod 2$$
>
> $$P_a P_b = (-1)^{\\omega(a, b)} P_b P_a$$

This discrete geometric identity enables polynomial-time simulation of circuits that would otherwise demand $2^n \\times 2^n$ dense complex matrices.`,
          workedExample: `#### Concrete Calculation Walkthrough

Let $n = 2$ qubits. Consider $P_1 = X \\otimes Z$ and $P_2 = Z \\otimes X$.

1. **Extract Symplectic Components:**
   - For $P_1$: $x_1 = (1, 0)$, $z_1 = (0, 1)$
   - For $P_2$: $x_2 = (0, 1)$, $z_2 = (1, 0)$

2. **Compute the Symplectic Product $\\omega(P_1, P_2)$:**
   $$\\omega(P_1, P_2) = (z_1 \\cdot x_2) - (x_1 \\cdot z_2) = (0\\cdot 0 + 1\\cdot 1) - (1\\cdot 1 + 0\\cdot 0) = 1 - 1 = 0 \\pmod 2$$

3. **Conclusion:**
   Because $\\omega(P_1, P_2) = 0$, $P_1$ and $P_2$ commute, sharing a simultaneous eigenbasis.`,
          codeWalkthrough: `#### Production Systems Architecture

Consider how this is implemented in high-performance computational systems:

\`\`\`rust
// Fast, branchless commutation check over 64-qubit packed bitboards
#[inline(always)]
pub fn commutes_with(&self, other: &Self) -> bool {
    let cross1 = (self.z & other.x).count_ones();
    let cross2 = (self.x & other.z).count_ones();
    ((cross1 ^ cross2) & 1) == 0
}
\`\`\`

Notice that floating-point operations and matrix allocations are replaced by integer bitwise XOR and hardware popcount instructions executing in a single CPU cycle.`,
          exercise: `**Paper & Pencil Exercise:**
1. Compute the symplectic product for $P_A = Y \\otimes I$ and $P_B = Z \\otimes Z$ by hand using $\\omega(a, b)$.
2. Predict whether they commute or anticommute.
3. Verify your result in the notes scratchpad on the right!`,
          reflectionPrompts: [
            'What is the core intuition in my own words?',
            'Where does the phase factor belong in the binary tableau?',
            'What computational bottleneck does this representation avoid?'
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

// The 15 Four-Hour Mastery Packs Study Path
export const FOUR_HOUR_MASTERY_PATH: StudyPath = {
  id: 'symplectic-foundations-to-mastery',
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
    const primaryTopic = TOPICS.find(t => t.id === packLectures[0]?.topicId) || TOPICS[0];

    return {
      packNumber,
      title: `Pack ${packNumber}: ${primaryTopic.title}`,
      theme: primaryTopic.subtitle,
      lectureIds: packLectures.map(l => l.id)
    };
  })
};

// Aliases for compatibility
export const MASTERY_PACKS = FOUR_HOUR_MASTERY_PATH.packs;
export const SUNDAY_SCHOLAR_PATH = FOUR_HOUR_MASTERY_PATH;

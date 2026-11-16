/**
 * Knowledge DAG & Dependency Graph for AINotes Monothematic Lectures
 *
 * Implements a strict Directed Acyclic Graph (DAG) for all 60 foundational lectures.
 * Every lecture has explicit hard dependencies (prerequisites) guaranteed to be cycle-free
 * via Kahn's algorithm. Terminal apex concepts build strictly upon upstream foundational nodes.
 *
 * Also models cross-disciplinary "soft links" representing conceptual cross-contamination
 * across fields (e.g. symplectic geometry <-> fermionic matchgates, stabilizer tableaux <-> QEC codes).
 */

import { ALL_LECTURES, TOPICS, type Lecture, type Topic } from './curriculumCatalog';

export interface SoftLink {
  targetId: string;
  relationship: string;
}

export interface GraphNode {
  id: string;
  lectureNumber: number;
  title: string;
  subtitle: string;
  topicId: string;
  topicNumber: number;
  topicTitle: string;
  topicColor: string;
  packNumber: number;
  packSlot: number;
  question: string;
  prerequisites: string[]; // Direct hard prerequisites (structural predecessors)
  unlockedLectures: string[]; // Direct downstream lectures (structural dependents)
  derivedPrerequisites: string[]; // Derived prerequisites bypassed via intermediate lectures
  derivedUnlocked: string[]; // Derived downstream unlocks bypassed via intermediate lectures
  rawPrerequisites: string[]; // Raw declared prerequisites before reduction
  allPrerequisites: string[]; // Complete transitive ancestors (topological order)
  allUnlocked: string[]; // Complete transitive descendants
  softLinks: SoftLink[]; // Cross-field cross-contamination links
  inDegree: number;
  outDegree: number;
  topologicalRank: number; // Tier / depth (0 for root, 1, 2...)
}

export interface KnowledgeDAG {
  nodes: Map<string, GraphNode>;
  nodeList: GraphNode[];
  topologicalOrder: string[];
  layers: Array<{ rank: number; title: string; nodes: GraphNode[] }>;
  isAcyclic: boolean;
  cycleNodes?: string[];
  totalPrerequisiteEdges: number;
  totalDirectEdges: number;
  totalDerivedEdges: number;
  totalSoftLinks: number;
}

export interface NodeReadiness {
  status: 'completed' | 'ready' | 'locked';
  completedPrereqs: string[];
  missingPrereqs: string[];
  percentReady: number;
}

/**
 * Mathematically grounded hard prerequisites and cross-disciplinary soft links
 * for all 60 monothematic lectures.
 *
 * Hard prerequisites: strictly necessary theoretical foundations.
 * Soft links: cross-pollinated insights between distinct fields.
 */
export const LECTURE_DEPENDENCIES: Record<string, { prereqs: string[]; softLinks: SoftLink[] }> = {
  // === TOPIC 1: Mathematical Foundations ===
  'L01-sets-maps-proofs': {
    prereqs: [],
    softLinks: [
      {
        targetId: 'L02-groups-modular-arithmetic',
        relationship: 'Algebraic Lift: Set-theoretic mappings structure group composition laws.'
      }
    ]
  },
  'L02-groups-modular-arithmetic': {
    prereqs: ['L01-sets-maps-proofs'],
    softLinks: [
      {
        targetId: 'L19-acquired-phases-hostens-moduli',
        relationship: 'Phase Accumulation: Z4 cyclic group arithmetic tracks Pauli global phase factors.'
      }
    ]
  },
  'L03-finite-fields-gf2-gfp': {
    prereqs: ['L01-sets-maps-proofs', 'L02-groups-modular-arithmetic'],
    softLinks: [
      {
        targetId: 'L60-qudit-algebra-mixed-dimension-registers',
        relationship:
          'Field Generalization: Galois fields GF(p) govern prime-dimensional qudit Pauli operators.'
      }
    ]
  },
  'L04-vector-spaces-finite-fields': {
    prereqs: ['L01-sets-maps-proofs', 'L03-finite-fields-gf2-gfp'],
    softLinks: [
      {
        targetId: 'L42-term-fixers-exact-kernel',
        relationship:
          'Kernel Subspaces: Discrete nullspaces over GF(2) determine invariant Hamiltonian term fixers.'
      }
    ]
  },
  'L05-linear-maps-matrices': {
    prereqs: ['L04-vector-spaces-finite-fields'],
    softLinks: [
      {
        targetId: 'L45-krylov-subspaces-power-iteration',
        relationship:
          'Matrix Action: Linear transformations across finite fields mirror complex operator power iterations.'
      }
    ]
  },
  'L06-bilinear-symplectic-forms': {
    prereqs: ['L04-vector-spaces-finite-fields', 'L05-linear-maps-matrices'],
    softLinks: [
      {
        targetId: 'L56-gaussian-states-matchgate-simulation',
        relationship:
          'Algebraic Duality: Alternating bilinear forms over GF(2) parallel orthogonal quadratic forms over Majorana fermions.'
      }
    ]
  },
  'L07-symplectic-group-sp2n': {
    prereqs: ['L06-bilinear-symplectic-forms'],
    softLinks: [
      {
        targetId: 'L23-symplectic-clifford-isomorphism',
        relationship: 'Group Homomorphism: Sp(2n, F2) is isomorphic to the Clifford quotient group C_n / P_n.'
      },
      {
        targetId: 'L60-qudit-algebra-mixed-dimension-registers',
        relationship:
          'Qudit Symplectic Extension: Sp(2n, F_p) generates qudit Clifford gates over discrete qudits.'
      }
    ]
  },
  'L08-eigenvalues-without-diagonalization': {
    prereqs: ['L05-linear-maps-matrices', 'L07-symplectic-group-sp2n'],
    softLinks: [
      {
        targetId: 'L43-commuting-paulis-sector-resolution',
        relationship: 'Spectral Partitioning: Invariant subspace splitting without full matrix factorization.'
      }
    ]
  },

  // === TOPIC 2: Complex Hilbert Spaces & Quantum States ===
  'L09-complex-inner-products-hilbert': {
    prereqs: ['L01-sets-maps-proofs', 'L04-vector-spaces-finite-fields', 'L05-linear-maps-matrices'],
    softLinks: [
      {
        targetId: 'L45-krylov-subspaces-power-iteration',
        relationship:
          'Hilbert Metric: Sesquilinear inner products govern Lanczos Rayleigh quotient convergence.'
      }
    ]
  },
  'L10-one-qubit-states-measurement': {
    prereqs: ['L09-complex-inner-products-hilbert'],
    softLinks: [
      {
        targetId: 'L49-quantum-observable-estimation-budget',
        relationship:
          'Born Statistical Variance: Single-qubit projective projection sets sample variance bounds.'
      }
    ]
  },
  'L11-unitary-operators-quantum-gates': {
    prereqs: ['L09-complex-inner-products-hilbert', 'L10-one-qubit-states-measurement'],
    softLinks: [
      {
        targetId: 'L22-standard-generators-conjugation',
        relationship:
          'Unitary Generators: One-qubit gates H and S form the discrete generators of Clifford groups.'
      }
    ]
  },
  'L12-multi-qubit-systems-entanglement': {
    prereqs: ['L10-one-qubit-states-measurement', 'L11-unitary-operators-quantum-gates'],
    softLinks: [
      {
        targetId: 'L27-stabilizer-states-generators',
        relationship:
          'Entanglement Structure: Maximal Bell entanglement is canonically represented by two stabilizer generators.'
      }
    ]
  },
  'L13-density-matrices-mixed-states': {
    prereqs: ['L09-complex-inner-products-hilbert', 'L12-multi-qubit-systems-entanglement'],
    softLinks: [
      {
        targetId: 'L54-hardware-noise-systematic-shifts',
        relationship:
          'Open System Dynamics: Mixed states and Kraus operators model hardware decoherence for Zero-Noise Extrapolation.'
      }
    ]
  },
  'L14-circuit-model-universal-sets': {
    prereqs: ['L11-unitary-operators-quantum-gates', 'L12-multi-qubit-systems-entanglement'],
    softLinks: [
      {
        targetId: 'L32-magic-states-pauli-based-computation',
        relationship:
          'Universality Threshold: Adding non-Clifford T-gates to Clifford circuits achieves BQP-completeness.'
      }
    ]
  },

  // === TOPIC 3: The Pauli Group & Symplectic Mapping ===
  'L15-pauli-matrices-algebra': {
    prereqs: ['L10-one-qubit-states-measurement', 'L11-unitary-operators-quantum-gates'],
    softLinks: [
      {
        targetId: 'L55-majorana-fermions-encodings',
        relationship:
          'Clifford Algebra Bridge: Pauli matrices form 3D Euclidean Clifford algebras isomorphic to paired Majorana modes.'
      }
    ]
  },
  'L16-n-qubit-pauli-strings': {
    prereqs: ['L12-multi-qubit-systems-entanglement', 'L15-pauli-matrices-algebra'],
    softLinks: [
      {
        targetId: 'L55-majorana-fermions-encodings',
        relationship:
          'Non-Local Jordan-Wigner Strings: Tensor products of Pauli Z operators represent fermionic exchange parity.'
      }
    ]
  },
  'L17-binary-symplectic-encoding': {
    prereqs: ['L06-bilinear-symplectic-forms', 'L16-n-qubit-pauli-strings'],
    softLinks: [
      {
        targetId: 'L28-aaronson-gottesman-tableaux',
        relationship:
          'Tableau Bitboards: Symplectic binary vectors (x|z) become contiguous rows in stabilizer tableaux.'
      }
    ]
  },
  'L18-symplectic-product-commutation': {
    prereqs: ['L06-bilinear-symplectic-forms', 'L17-binary-symplectic-encoding'],
    softLinks: [
      {
        targetId: 'L50-commutation-graphs-clique-covers',
        relationship:
          'Graph Adjacency: The symplectic inner product defines edges in Hamiltonian commutation graphs.'
      }
    ]
  },
  'L19-acquired-phases-hostens-moduli': {
    prereqs: [
      'L02-groups-modular-arithmetic',
      'L17-binary-symplectic-encoding',
      'L18-symplectic-product-commutation'
    ],
    softLinks: [
      {
        targetId: 'L60-qudit-algebra-mixed-dimension-registers',
        relationship:
          'Discrete Phase Moduli: Hostens phase tracking extends from mod 4 integers to roots of unity omega_d.'
      }
    ]
  },
  'L20-pauli-sums-observables-hamiltonians': {
    prereqs: ['L13-density-matrices-mixed-states', 'L16-n-qubit-pauli-strings'],
    softLinks: [
      {
        targetId: 'L37-many-body-hamiltonians-models',
        relationship:
          'Physical Systems: Molecular electronic Hamiltonians expand into linear sums of Pauli strings.'
      }
    ]
  },

  // === TOPIC 4: Clifford Operations & Symplectic Geometry ===
  'L21-clifford-group-definition': {
    prereqs: ['L16-n-qubit-pauli-strings', 'L19-acquired-phases-hostens-moduli'],
    softLinks: [
      {
        targetId: 'L23-symplectic-clifford-isomorphism',
        relationship: 'Normalizer Structure: The Clifford group normalizes the Pauli group within U(2^n).'
      }
    ]
  },
  'L22-standard-generators-conjugation': {
    prereqs: ['L14-circuit-model-universal-sets', 'L21-clifford-group-definition'],
    softLinks: [
      {
        targetId: 'L29-tableau-gate-updates',
        relationship:
          'Action on Tableaux: Gate conjugation rules directly translate to deterministic bitboard updates.'
      }
    ]
  },
  'L23-symplectic-clifford-isomorphism': {
    prereqs: [
      'L07-symplectic-group-sp2n',
      'L18-symplectic-product-commutation',
      'L21-clifford-group-definition'
    ],
    softLinks: [
      {
        targetId: 'L57-qec-stabilizer-codes-automorphisms',
        relationship:
          'Code Symmetries: Fault-tolerant transversal gates correspond to symplectic automorphisms preserving the code.'
      }
    ]
  },
  'L24-symplectic-transvections': {
    prereqs: ['L07-symplectic-group-sp2n', 'L23-symplectic-clifford-isomorphism'],
    softLinks: [
      {
        targetId: 'L25-clifford-circuit-synthesis',
        relationship:
          'Algorithmic Factoring: Decomposing symplectic matrices into shear transvections produces gate sequences.'
      }
    ]
  },
  'L25-clifford-circuit-synthesis': {
    prereqs: ['L22-standard-generators-conjugation', 'L24-symplectic-transvections'],
    softLinks: [
      {
        targetId: 'L35-circuit-peephole-rewrites',
        relationship:
          'Canonical Forms: Synthesized circuits provide canonical representations to measure peephole rewrite reductions.'
      },
      {
        targetId: 'L51-rotated-cliques-diagonalization-circuits',
        relationship:
          'Diagonalization Synthesis: Synthesizing unitary Clifford rotations to simultaneously measure commuting cliques.'
      }
    ]
  },
  'L26-clifford-uniform-sampling': {
    prereqs: ['L23-symplectic-clifford-isomorphism', 'L25-clifford-circuit-synthesis'],
    softLinks: [
      {
        targetId: 'L53-mcmc-covariance-integration',
        relationship:
          'Randomized Benchmarking & Shadows: Haar-uniform Clifford samples underpin classical shadow tomography.'
      }
    ]
  },

  // === TOPIC 5: Stabilizer Formalism & Classical Simulation ===
  'L27-stabilizer-states-generators': {
    prereqs: [
      'L12-multi-qubit-systems-entanglement',
      'L18-symplectic-product-commutation',
      'L21-clifford-group-definition'
    ],
    softLinks: [
      {
        targetId: 'L57-qec-stabilizer-codes-automorphisms',
        relationship:
          'Quantum Error Correction: Stabilizer codes are joint +1 eigenspaces of commuting Pauli generator subgroups.'
      }
    ]
  },
  'L28-aaronson-gottesman-tableaux': {
    prereqs: ['L17-binary-symplectic-encoding', 'L27-stabilizer-states-generators'],
    softLinks: [
      {
        targetId: 'L34-pauli-frame-batched-sampling',
        relationship:
          'Memory-Throughput Tradeoff: Full (2n+1)x(2n+1) tableaux vs O(1) Pauli frame updates in quantum control.'
      }
    ]
  },
  'L29-tableau-gate-updates': {
    prereqs: ['L22-standard-generators-conjugation', 'L28-aaronson-gottesman-tableaux'],
    softLinks: [
      {
        targetId: 'L35-circuit-peephole-rewrites',
        relationship:
          'Symbolic Simulation: Applying tableau updates to verify equivalence of circuit simplification rules.'
      }
    ]
  },
  'L30-stabilizer-measurement-algorithm': {
    prereqs: ['L18-symplectic-product-commutation', 'L29-tableau-gate-updates'],
    softLinks: [
      {
        targetId: 'L34-pauli-frame-batched-sampling',
        relationship:
          'Syndrome Acquisition: Non-deterministic measurement branches update active Pauli frames in quantum error tracking.'
      }
    ]
  },
  'L31-gottesman-knill-theorem': {
    prereqs: ['L29-tableau-gate-updates', 'L30-stabilizer-measurement-algorithm'],
    softLinks: [
      {
        targetId: 'L56-gaussian-states-matchgate-simulation',
        relationship:
          'Complexity Boundary: Gottesman-Knill and fermionic matchgates define the two solvable islands in quantum mechanics.'
      }
    ]
  },
  'L32-magic-states-pauli-based-computation': {
    prereqs: ['L14-circuit-model-universal-sets', 'L31-gottesman-knill-theorem'],
    softLinks: [
      {
        targetId: 'L57-qec-stabilizer-codes-automorphisms',
        relationship:
          'Circumventing Eastin-Knill: Fault-tolerant magic state distillation compensates for transversal gate limitations.'
      }
    ]
  },

  // === TOPIC 6: Simulation Architecture & Compiler Pipelines ===
  'L33-program-ir-routes': {
    prereqs: ['L14-circuit-model-universal-sets', 'L31-gottesman-knill-theorem'],
    softLinks: [
      {
        targetId: 'L44-block-diagonalization-pipeline',
        relationship:
          'Compiler Partitioning: IR splits circuits into pure Clifford stabilizer routes and Hamiltonian symmetry sectors.'
      }
    ]
  },
  'L34-pauli-frame-batched-sampling': {
    prereqs: ['L30-stabilizer-measurement-algorithm', 'L33-program-ir-routes'],
    softLinks: [
      {
        targetId: 'L54-hardware-noise-systematic-shifts',
        relationship:
          'Frame Virtualization: Tracking bit-flips in software eliminates physical calibration latency and noise.'
      }
    ]
  },
  'L35-circuit-peephole-rewrites': {
    prereqs: ['L25-clifford-circuit-synthesis', 'L34-pauli-frame-batched-sampling'],
    softLinks: [
      {
        targetId: 'L51-rotated-cliques-diagonalization-circuits',
        relationship:
          'Optimization for Hardware: Peephole rewrites eliminate redundant CNOT depth in measurement rotation subcircuits.'
      }
    ]
  },
  'L36-ket-networks-path-sums': {
    prereqs: ['L14-circuit-model-universal-sets', 'L27-stabilizer-states-generators'],
    softLinks: [
      {
        targetId: 'L37-many-body-hamiltonians-models',
        relationship:
          'Tensor Networks: Ket network slicing provides matrix product states for strongly correlated condensed matter.'
      }
    ]
  },

  // === TOPIC 7: Hamiltonian Symmetries & Spectral Decomposition ===
  'L37-many-body-hamiltonians-models': {
    prereqs: ['L20-pauli-sums-observables-hamiltonians', 'L36-ket-networks-path-sums'],
    softLinks: [
      {
        targetId: 'L55-majorana-fermions-encodings',
        relationship:
          'Electronic Structure: Ab initio quantum chemistry molecular integrals map into fermionic operators.'
      }
    ]
  },
  'L38-symmetry-as-operator-commutation': {
    prereqs: ['L20-pauli-sums-observables-hamiltonians', 'L37-many-body-hamiltonians-models'],
    softLinks: [
      {
        targetId: 'L40-colored-graphs-interaction-graphs',
        relationship:
          'Topological Symmetry: Permutational and spatial symmetries manifest as automorphism orbits of interaction graphs.'
      }
    ]
  },
  'L39-clifford-symmetries-paper-tour': {
    prereqs: ['L23-symplectic-clifford-isomorphism', 'L38-symmetry-as-operator-commutation'],
    softLinks: [
      {
        targetId: 'L44-block-diagonalization-pipeline',
        relationship:
          'Empirical Symmetry Hunting: Practical symmetry identification compresses Hamiltonian state space exponentially.'
      }
    ]
  },
  'L40-colored-graphs-interaction-graphs': {
    prereqs: ['L18-symplectic-product-commutation', 'L38-symmetry-as-operator-commutation'],
    softLinks: [
      {
        targetId: 'L50-commutation-graphs-clique-covers',
        relationship:
          'Graph-Theoretic Duality: Interaction graphs connect interacting particles; commutation graphs connect measurable observables.'
      }
    ]
  },
  'L41-partition-refinement-backtracking': {
    prereqs: ['L40-colored-graphs-interaction-graphs'],
    softLinks: [
      {
        targetId: 'L42-term-fixers-exact-kernel',
        relationship:
          'Discrete Algorithms: McKay partition refinement discovers subgroup orbits without combinatorial explosion.'
      }
    ]
  },
  'L42-term-fixers-exact-kernel': {
    prereqs: ['L04-vector-spaces-finite-fields', 'L41-partition-refinement-backtracking'],
    softLinks: [
      {
        targetId: 'L43-commuting-paulis-sector-resolution',
        relationship:
          'Symplectic Kernel Nullspace: Exact term fixers generate the maximal commuting point group symmetry algebra.'
      }
    ]
  },
  'L43-commuting-paulis-sector-resolution': {
    prereqs: [
      'L08-eigenvalues-without-diagonalization',
      'L27-stabilizer-states-generators',
      'L42-term-fixers-exact-kernel'
    ],
    softLinks: [
      {
        targetId: 'L51-rotated-cliques-diagonalization-circuits',
        relationship:
          'Simultaneous Diagonalization: Resolving symmetry sectors is mathematically identical to diagonalizing measurement cliques.'
      }
    ]
  },
  'L44-block-diagonalization-pipeline': {
    prereqs: ['L42-term-fixers-exact-kernel', 'L43-commuting-paulis-sector-resolution'],
    softLinks: [
      {
        targetId: 'L47-matrix-free-hamiltonian-products',
        relationship:
          'Solvers Integration: Block diagonal sectors feed decoupled sparse vectors directly into iterative Lanczos solvers.'
      }
    ]
  },

  // === TOPIC 8: Lanczos Algorithm & Krylov Subspace Solvers ===
  'L45-krylov-subspaces-power-iteration': {
    prereqs: [
      'L05-linear-maps-matrices',
      'L09-complex-inner-products-hilbert',
      'L20-pauli-sums-observables-hamiltonians'
    ],
    softLinks: [
      {
        targetId: 'L46-lanczos-three-term-recurrence',
        relationship:
          'Subspace Expansion: Power iteration Krylov bases {v, Av, A^2v...} form the foundation for three-term tridiagonalization.'
      }
    ]
  },
  'L46-lanczos-three-term-recurrence': {
    prereqs: ['L45-krylov-subspaces-power-iteration'],
    softLinks: [
      {
        targetId: 'L48-convergence-precision-architecture',
        relationship:
          'Orthogonality Breakdown: Finite IEEE 754 precision causes ghost spurious Ritz values during Lanczos recursion.'
      }
    ]
  },
  'L47-matrix-free-hamiltonian-products': {
    prereqs: ['L16-n-qubit-pauli-strings', 'L46-lanczos-three-term-recurrence'],
    softLinks: [
      {
        targetId: 'L58-cuda-lanczos-gpu-kernels',
        relationship:
          'Hardware Acceleration: Matrix-free Pauli-vector bitboard evaluation translates to massive CUDA thread parallelism.'
      }
    ]
  },
  'L48-convergence-precision-architecture': {
    prereqs: ['L46-lanczos-three-term-recurrence', 'L47-matrix-free-hamiltonian-products'],
    softLinks: [
      {
        targetId: 'L59-batched-cuda-covariance-offload',
        relationship:
          'Heterogeneous Compute: Selective reorthogonalization on CPU host interleaved with GPU matrix-vector compute.'
      }
    ]
  },

  // === TOPIC 9: Quantum Measurement, Cliques & Shadow Estimation ===
  'L49-quantum-observable-estimation-budget': {
    prereqs: ['L10-one-qubit-states-measurement', 'L20-pauli-sums-observables-hamiltonians'],
    softLinks: [
      {
        targetId: 'L52-bayesian-adaptive-allocation',
        relationship:
          'Sample Optimization: Allocating finite shot budgets to minimize aggregate variance Tr(Cov).'
      }
    ]
  },
  'L50-commutation-graphs-clique-covers': {
    prereqs: [
      'L18-symplectic-product-commutation',
      'L40-colored-graphs-interaction-graphs',
      'L49-quantum-observable-estimation-budget'
    ],
    softLinks: [
      {
        targetId: 'L51-rotated-cliques-diagonalization-circuits',
        relationship:
          'Clique Partitioning: Grouping non-commuting observables into minimal sets of simultaneously measurable commuting cliques.'
      }
    ]
  },
  'L51-rotated-cliques-diagonalization-circuits': {
    prereqs: ['L25-clifford-circuit-synthesis', 'L50-commutation-graphs-clique-covers'],
    softLinks: [
      {
        targetId: 'L52-bayesian-adaptive-allocation',
        relationship:
          'Circuit Execution: Measuring rotated cliques feeds live empirical shot statistics into Bayesian allocators.'
      }
    ]
  },
  'L52-bayesian-adaptive-allocation': {
    prereqs: ['L49-quantum-observable-estimation-budget', 'L51-rotated-cliques-diagonalization-circuits'],
    softLinks: [
      {
        targetId: 'L53-mcmc-covariance-integration',
        relationship:
          'Posterior Sampling: When shot count grows, posterior covariance integrals are evaluated via Markov Chain Monte Carlo.'
      }
    ]
  },
  'L53-mcmc-covariance-integration': {
    prereqs: [
      'L26-clifford-uniform-sampling',
      'L49-quantum-observable-estimation-budget',
      'L52-bayesian-adaptive-allocation'
    ],
    softLinks: [
      {
        targetId: 'L59-batched-cuda-covariance-offload',
        relationship:
          'Massive Sampling Offload: High-dimensional covariance matrix inversion offloaded to GPU tensor cores.'
      }
    ]
  },
  'L54-hardware-noise-systematic-shifts': {
    prereqs: ['L13-density-matrices-mixed-states', 'L49-quantum-observable-estimation-budget'],
    softLinks: [
      {
        targetId: 'L57-qec-stabilizer-codes-automorphisms',
        relationship:
          'Noise Strategy: Error mitigation (ZNE) bridges the noisy intermediate-scale era until fault-tolerant QEC emerges.'
      }
    ]
  },

  // === TOPIC 10: Advanced Frontiers: Fermions, Codes, CUDA & Qudits ===
  'L55-majorana-fermions-encodings': {
    prereqs: ['L16-n-qubit-pauli-strings', 'L37-many-body-hamiltonians-models'],
    softLinks: [
      {
        targetId: 'L56-gaussian-states-matchgate-simulation',
        relationship:
          'Majorana Kinematics: Quadratic Majorana Hamiltonians generate free-fermion matchgate circuits.'
      }
    ]
  },
  'L56-gaussian-states-matchgate-simulation': {
    prereqs: ['L23-symplectic-clifford-isomorphism', 'L55-majorana-fermions-encodings'],
    softLinks: [
      {
        targetId: 'L06-bilinear-symplectic-forms',
        relationship:
          'Mathematical Duality: Symplectic forms over GF(2) mirror SO(2n) orthogonal Lie algebras over Majorana operators.'
      },
      {
        targetId: 'L31-gottesman-knill-theorem',
        relationship:
          'Solvable Subtheories: Matchgate polynomial simulation forms the fermionic twin to the Clifford Gottesman-Knill theorem.'
      }
    ]
  },
  'L57-qec-stabilizer-codes-automorphisms': {
    prereqs: [
      'L27-stabilizer-states-generators',
      'L31-gottesman-knill-theorem',
      'L50-commutation-graphs-clique-covers'
    ],
    softLinks: [
      {
        targetId: 'L23-symplectic-clifford-isomorphism',
        relationship:
          'Logical Gate Automorphisms: Transversal Clifford operations on CSS/surface codes map to symplectic invariants.'
      },
      {
        targetId: 'L32-magic-states-pauli-based-computation',
        relationship:
          'Universal Fault-Tolerance: Magic state distillation circumvents the Eastin-Knill no-go barrier in stabilizer codes.'
      }
    ]
  },
  'L58-cuda-lanczos-gpu-kernels': {
    prereqs: ['L47-matrix-free-hamiltonian-products'],
    softLinks: [
      {
        targetId: 'L59-batched-cuda-covariance-offload',
        relationship:
          'Kernel Fusion: Shared memory caching and warp shuffle operations scale sparse Pauli evaluations across GPU clusters.'
      }
    ]
  },
  'L59-batched-cuda-covariance-offload': {
    prereqs: ['L48-convergence-precision-architecture', 'L58-cuda-lanczos-gpu-kernels'],
    softLinks: [
      {
        targetId: 'L53-mcmc-covariance-integration',
        relationship:
          'High-Throughput Analytics: Streaming GPU pipelines evaluate millions of MCMC shadow samples in parallel.'
      }
    ]
  },
  'L60-qudit-algebra-mixed-dimension-registers': {
    prereqs: [
      'L03-finite-fields-gf2-gfp',
      'L07-symplectic-group-sp2n',
      'L19-acquired-phases-hostens-moduli',
      'L31-gottesman-knill-theorem'
    ],
    softLinks: [
      {
        targetId: 'L24-symplectic-transvections',
        relationship:
          'Generalized Symplectic Geometry: Discrete Wigner functions and Heisenberg-Weyl qudit operators over GF(p).'
      }
    ]
  }
};

/**
 * Builds and validates the Knowledge DAG.
 * Uses Kahn's algorithm to strictly verify acyclicity and determine topological rank.
 */
export function buildKnowledgeDAG(lectures: Omit<Lecture, 'content'>[] = ALL_LECTURES): KnowledgeDAG {
  const topicMap = new Map<string, Topic>(TOPICS.map((t) => [t.id, t]));

  // Initialize nodes
  const nodeMap = new Map<string, GraphNode>();
  const rawPrereqsMap = new Map<string, string[]>();
  const rawAdjacencyList = new Map<string, string[]>();
  const rawInDegreeMap = new Map<string, number>();

  let totalSoftLinks = 0;

  for (const lecture of lectures) {
    const topic = topicMap.get(lecture.topicId) || TOPICS[0];
    const depData = LECTURE_DEPENDENCIES[lecture.id] || { prereqs: [], softLinks: [] };
    const rawPrereqs = [...depData.prereqs];
    rawPrereqsMap.set(lecture.id, rawPrereqs);
    totalSoftLinks += depData.softLinks.length;

    nodeMap.set(lecture.id, {
      id: lecture.id,
      lectureNumber: lecture.lectureNumber,
      title: lecture.title,
      subtitle: lecture.subtitle,
      topicId: lecture.topicId,
      topicNumber: topic.number,
      topicTitle: topic.title,
      topicColor: topic.color,
      packNumber: lecture.packNumber || lecture.sundaySession || 1,
      packSlot: lecture.packSlot || lecture.sundaySlot || 1,
      question: lecture.question,
      prerequisites: [], // populated with direct prerequisites below
      unlockedLectures: [], // populated with direct unlocks below
      derivedPrerequisites: [],
      derivedUnlocked: [],
      rawPrerequisites: rawPrereqs,
      allPrerequisites: [],
      allUnlocked: [],
      softLinks: [...depData.softLinks],
      inDegree: 0,
      outDegree: 0,
      topologicalRank: 0
    });

    rawInDegreeMap.set(lecture.id, 0);
    rawAdjacencyList.set(lecture.id, []);
  }

  // Populate raw edges & in-degrees
  for (const [id, rawPrereqs] of rawPrereqsMap.entries()) {
    for (const prereqId of rawPrereqs) {
      if (nodeMap.has(prereqId)) {
        rawAdjacencyList.get(prereqId)!.push(id);
        rawInDegreeMap.set(id, (rawInDegreeMap.get(id) || 0) + 1);
      } else {
        console.warn(`Prerequisite '${prereqId}' not found in lectures for node '${id}'.`);
      }
    }
  }

  // Kahn's algorithm for topological sort and cycle detection on raw graph
  const currentInDegree = new Map<string, number>(rawInDegreeMap);
  const queue: string[] = [];

  for (const [id, degree] of currentInDegree.entries()) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  const topologicalOrder: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    topologicalOrder.push(u);

    for (const v of rawAdjacencyList.get(u) || []) {
      const remainingDegree = (currentInDegree.get(v) || 0) - 1;
      currentInDegree.set(v, remainingDegree);
      if (remainingDegree === 0) {
        queue.push(v);
      }
    }
  }

  const isAcyclic = topologicalOrder.length === lectures.length;
  const cycleNodes = isAcyclic
    ? undefined
    : lectures.map((l) => l.id).filter((id) => !topologicalOrder.includes(id));

  // Compute full transitive ancestors in topological order
  const fullAncestorsMap = new Map<string, Set<string>>();
  for (const id of topologicalOrder) {
    const ancestors = new Set<string>();
    const rawParents = rawPrereqsMap.get(id) || [];
    for (const p of rawParents) {
      ancestors.add(p);
      const parentAncestors = fullAncestorsMap.get(p);
      if (parentAncestors) {
        parentAncestors.forEach((a) => ancestors.add(a));
      }
    }
    fullAncestorsMap.set(id, ancestors);
  }

  // Global Transitive Reduction: Classify raw dependencies as DIRECT or DERIVED
  // A raw parent u of node v is DERIVED if there exists another raw parent w of v (w !== u)
  // such that u is an ancestor of w (i.e. alternative path u -> ... -> w -> v exists).
  // Otherwise, u is a strictly DIRECT prerequisite!
  const directPrereqsMap = new Map<string, string[]>();
  const derivedPrereqsMap = new Map<string, string[]>();

  for (const id of topologicalOrder) {
    const rawParents = rawPrereqsMap.get(id) || [];
    const direct: string[] = [];
    const derived: string[] = [];

    for (const u of rawParents) {
      let isDerived = false;
      for (const w of rawParents) {
        if (w !== u && fullAncestorsMap.get(w)?.has(u)) {
          isDerived = true;
          break;
        }
      }
      if (isDerived) {
        derived.push(u);
      } else {
        direct.push(u);
      }
    }

    directPrereqsMap.set(id, direct);
    derivedPrereqsMap.set(id, derived);
  }

  // Populate direct and derived unlocks across all nodes
  const directUnlockedMap = new Map<string, string[]>();
  const derivedUnlockedMap = new Map<string, string[]>();
  for (const id of topologicalOrder) {
    directUnlockedMap.set(id, []);
    derivedUnlockedMap.set(id, []);
  }

  for (const id of topologicalOrder) {
    for (const p of directPrereqsMap.get(id) || []) {
      directUnlockedMap.get(p)?.push(id);
    }
    for (const p of derivedPrereqsMap.get(id) || []) {
      derivedUnlockedMap.get(p)?.push(id);
    }
  }

  let totalDirectEdges = 0;
  let totalDerivedEdges = 0;

  for (const [id, node] of nodeMap.entries()) {
    const directPrereqs = directPrereqsMap.get(id) || [];
    const derivedPrereqs = derivedPrereqsMap.get(id) || [];
    const directUnlocked = directUnlockedMap.get(id) || [];
    const derivedUnlocked = derivedUnlockedMap.get(id) || [];

    node.prerequisites = directPrereqs;
    node.derivedPrerequisites = derivedPrereqs;
    node.unlockedLectures = directUnlocked;
    node.derivedUnlocked = derivedUnlocked;
    node.inDegree = directPrereqs.length;
    node.outDegree = directUnlocked.length;

    totalDirectEdges += directPrereqs.length;
    totalDerivedEdges += derivedPrereqs.length;
  }

  // Compute topological rank (depth from root) based on direct prerequisites
  for (const id of topologicalOrder) {
    const node = nodeMap.get(id)!;
    if (node.prerequisites.length === 0) {
      node.topologicalRank = 0;
    } else {
      const maxPrereqRank = Math.max(...node.prerequisites.map((p) => nodeMap.get(p)?.topologicalRank ?? 0));
      node.topologicalRank = maxPrereqRank + 1;
    }
  }

  // Compute transitive ancestors (allPrerequisites) in topological order
  for (const id of topologicalOrder) {
    const node = nodeMap.get(id)!;
    const ancestors = Array.from(fullAncestorsMap.get(id) || []);
    node.allPrerequisites = ancestors.sort((a, b) => {
      return (nodeMap.get(a)?.topologicalRank ?? 0) - (nodeMap.get(b)?.topologicalRank ?? 0);
    });
  }

  // Compute transitive descendants (allUnlocked) in reverse topological order
  for (let i = topologicalOrder.length - 1; i >= 0; i--) {
    const id = topologicalOrder[i];
    const node = nodeMap.get(id)!;
    const descendantSet = new Set<string>();

    for (const childId of node.unlockedLectures) {
      descendantSet.add(childId);
      const childDescendants = nodeMap.get(childId)?.allUnlocked || [];
      for (const d of childDescendants) {
        descendantSet.add(d);
      }
    }
    node.allUnlocked = Array.from(descendantSet).sort((a, b) => {
      return (nodeMap.get(a)?.topologicalRank ?? 0) - (nodeMap.get(b)?.topologicalRank ?? 0);
    });
  }

  // Build stratified layers
  const maxRank = Math.max(0, ...Array.from(nodeMap.values()).map((n) => n.topologicalRank));
  const layers: Array<{ rank: number; title: string; nodes: GraphNode[] }> = [];

  const tierTitles: Record<number, string> = {
    0: 'Foundational Bedrock',
    1: 'Algebraic Structures',
    2: 'Linear & Symplectic Forms',
    3: 'Symplectic Groups & Quantum States',
    4: 'Entanglement & Single-Qubit Pauli',
    5: 'N-Qubit Pauli & Binary Representation',
    6: 'Clifford Group Normalizers',
    7: 'Stabilizer Formalism & Tableaux',
    8: 'Measurement & Polynomial Simulation',
    9: 'Compiler Routes & Normal Forms',
    10: 'Many-Body Models & Lattice Hamiltonians',
    11: 'Hamiltonian Symmetries & Graph Automorphisms',
    12: 'Symmetry Sector Diagonalization',
    13: 'Krylov Subspaces & Power Iteration',
    14: 'Matrix-Free Lanczos Solvers',
    15: 'Measurement Budgets & Variances',
    16: 'Commutation Graphs & Maximal Cliques',
    17: 'Simultaneous Measurement Rotations',
    18: 'Bayesian Shot Allocation & MCMC',
    19: 'Majorana Modes & Error Mitigation',
    20: 'Fermionic Matchgate Polynomial Simulation',
    21: 'QEC Codes & CUDA Kernels',
    22: 'Apex Frontiers: Multi-GPU Lanczos & Qudits'
  };

  for (let r = 0; r <= maxRank; r++) {
    const nodesInRank = Array.from(nodeMap.values())
      .filter((n) => n.topologicalRank === r)
      .sort((a, b) => a.lectureNumber - b.lectureNumber);

    if (nodesInRank.length > 0) {
      layers.push({
        rank: r,
        title: tierTitles[r] || `Tier ${r}`,
        nodes: nodesInRank
      });
    }
  }

  const nodeList = Array.from(nodeMap.values()).sort((a, b) => a.lectureNumber - b.lectureNumber);

  return {
    nodes: nodeMap,
    nodeList,
    topologicalOrder,
    layers,
    isAcyclic,
    cycleNodes,
    totalPrerequisiteEdges: totalDirectEdges,
    totalDirectEdges,
    totalDerivedEdges,
    totalSoftLinks
  };
}

// Singleton cached instance
let cachedDAG: KnowledgeDAG | null = null;

export function getKnowledgeDAG(): KnowledgeDAG {
  if (!cachedDAG) {
    cachedDAG = buildKnowledgeDAG(ALL_LECTURES);
  }
  return cachedDAG;
}

/**
 * Computes readiness status for a lecture based on completed lectures.
 */
export function computeNodeReadiness(
  nodeId: string,
  completedLectureIds: Set<string> | string[]
): NodeReadiness {
  const dag = getKnowledgeDAG();
  const node = dag.nodes.get(nodeId);
  const completedSet =
    completedLectureIds instanceof Set ? completedLectureIds : new Set(completedLectureIds);

  if (!node) {
    return {
      status: 'locked',
      completedPrereqs: [],
      missingPrereqs: [],
      percentReady: 0
    };
  }

  const isCompleted = completedSet.has(nodeId);
  const totalPrereqs = node.prerequisites.length;

  if (totalPrereqs === 0) {
    return {
      status: isCompleted ? 'completed' : 'ready',
      completedPrereqs: [],
      missingPrereqs: [],
      percentReady: 100
    };
  }

  const completedPrereqs: string[] = [];
  const missingPrereqs: string[] = [];

  for (const p of node.prerequisites) {
    if (completedSet.has(p)) {
      completedPrereqs.push(p);
    } else {
      missingPrereqs.push(p);
    }
  }

  const percentReady = Math.round((completedPrereqs.length / totalPrereqs) * 100);

  if (isCompleted) {
    return {
      status: 'completed',
      completedPrereqs,
      missingPrereqs,
      percentReady: 100
    };
  }

  if (missingPrereqs.length === 0) {
    return {
      status: 'ready',
      completedPrereqs,
      missingPrereqs: [],
      percentReady: 100
    };
  }

  return {
    status: 'locked',
    completedPrereqs,
    missingPrereqs,
    percentReady
  };
}

export interface TopicRamification {
  topic: Topic;
  lectures: GraphNode[];
  prerequisiteTopics: Array<{
    topic: Topic;
    crossEdgesCount: number;
    samplePrereqs: GraphNode[];
  }>;
  nextTopics: Array<{
    topic: Topic;
    crossEdgesCount: number;
    sampleUnlocked: GraphNode[];
  }>;
  entryLectures: GraphNode[];
  exitLectures: GraphNode[];
  internalProgression: Array<{ from: GraphNode; to: GraphNode }>;
  softLinkedTopics: Array<{
    topic: Topic;
    fromLecture: GraphNode;
    toLecture: GraphNode;
    relationship: string;
  }>;
}

export interface LectureRamification {
  node: GraphNode;
  directPrerequisites: GraphNode[];
  ancestorTiers: Array<{ distance: number; title: string; nodes: GraphNode[] }>;
  directUnlocked: GraphNode[];
  descendantTiers: Array<{ distance: number; title: string; nodes: GraphNode[] }>;
  softLinks: Array<{ targetNode: GraphNode; relationship: string }>;
  readyToTackleNext: GraphNode[];
}

/**
 * Calculates topic-level ramifications: which topics are needed first,
 * how lectures progress internally, and which next topics are unlocked.
 */
export function getTopicRamification(
  topicId: string,
  dag: KnowledgeDAG = getKnowledgeDAG()
): TopicRamification | null {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) return null;

  const topicLectures = dag.nodeList.filter((n) => n.topicId === topicId);
  const prereqTopicMap = new Map<string, { count: number; nodes: Set<string> }>();
  const nextTopicMap = new Map<string, { count: number; nodes: Set<string> }>();
  const internalProgression: Array<{ from: GraphNode; to: GraphNode }> = [];
  const entryLectures: GraphNode[] = [];
  const exitLectures: GraphNode[] = [];

  for (const node of topicLectures) {
    let hasInternalPrereq = false;
    let hasExternalPrereq = false;

    for (const pId of node.prerequisites) {
      const pNode = dag.nodes.get(pId);
      if (!pNode) continue;

      if (pNode.topicId === topicId) {
        hasInternalPrereq = true;
        internalProgression.push({ from: pNode, to: node });
      } else {
        hasExternalPrereq = true;
        if (!prereqTopicMap.has(pNode.topicId)) {
          prereqTopicMap.set(pNode.topicId, { count: 0, nodes: new Set() });
        }
        const entry = prereqTopicMap.get(pNode.topicId)!;
        entry.count++;
        entry.nodes.add(pId);
      }
    }

    if (!hasInternalPrereq || hasExternalPrereq || node.prerequisites.length === 0) {
      entryLectures.push(node);
    }

    let unlocksExternal = false;
    for (const uId of node.unlockedLectures) {
      const uNode = dag.nodes.get(uId);
      if (!uNode) continue;

      if (uNode.topicId !== topicId) {
        unlocksExternal = true;
        if (!nextTopicMap.has(uNode.topicId)) {
          nextTopicMap.set(uNode.topicId, { count: 0, nodes: new Set() });
        }
        const entry = nextTopicMap.get(uNode.topicId)!;
        entry.count++;
        entry.nodes.add(uId);
      }
    }

    if (unlocksExternal) {
      exitLectures.push(node);
    }
  }

  const prerequisiteTopics = Array.from(prereqTopicMap.entries())
    .map(([tId, info]) => {
      const t = TOPICS.find((top) => top.id === tId)!;
      return {
        topic: t,
        crossEdgesCount: info.count,
        samplePrereqs: Array.from(info.nodes)
          .map((id) => dag.nodes.get(id)!)
          .filter(Boolean)
      };
    })
    .sort((a, b) => a.topic.number - b.topic.number);

  const nextTopics = Array.from(nextTopicMap.entries())
    .map(([tId, info]) => {
      const t = TOPICS.find((top) => top.id === tId)!;
      return {
        topic: t,
        crossEdgesCount: info.count,
        sampleUnlocked: Array.from(info.nodes)
          .map((id) => dag.nodes.get(id)!)
          .filter(Boolean)
      };
    })
    .sort((a, b) => a.topic.number - b.topic.number);

  const softLinkedTopics: TopicRamification['softLinkedTopics'] = [];
  for (const node of topicLectures) {
    for (const link of node.softLinks) {
      const targetNode = dag.nodes.get(link.targetId);
      if (targetNode && targetNode.topicId !== topicId) {
        const targetTopic = TOPICS.find((t) => t.id === targetNode.topicId);
        if (targetTopic) {
          softLinkedTopics.push({
            topic: targetTopic,
            fromLecture: node,
            toLecture: targetNode,
            relationship: link.relationship
          });
        }
      }
    }
  }

  return {
    topic,
    lectures: topicLectures,
    prerequisiteTopics,
    nextTopics,
    entryLectures,
    exitLectures,
    internalProgression,
    softLinkedTopics
  };
}

/**
 * Calculates lecture-level ramifications: upstream ancestry branches,
 * downstream unlocked branches, and next actionable lectures.
 */
export function getLectureRamification(
  nodeId: string,
  completedSet: Set<string> = new Set(),
  dag: KnowledgeDAG = getKnowledgeDAG()
): LectureRamification | null {
  const node = dag.nodes.get(nodeId);
  if (!node) return null;

  const directPrerequisites = node.prerequisites.map((p) => dag.nodes.get(p)!).filter(Boolean);

  const directUnlocked = node.unlockedLectures.map((u) => dag.nodes.get(u)!).filter(Boolean);

  // Compute upstream layers by distance
  const ancestorTiers: Array<{ distance: number; title: string; nodes: GraphNode[] }> = [];
  let currentAncestorIds = new Set(node.prerequisites);
  const visitedAncestors = new Set<string>([node.id, ...node.prerequisites]);
  let distanceBack = 1;

  while (currentAncestorIds.size > 0 && distanceBack <= 6) {
    const layerNodes = Array.from(currentAncestorIds)
      .map((id) => dag.nodes.get(id)!)
      .filter(Boolean)
      .sort((a, b) => a.lectureNumber - b.lectureNumber);

    const title =
      distanceBack === 1
        ? 'Direct Prerequisites'
        : distanceBack === 2
          ? 'Secondary Foundations (Grandparents)'
          : `Ancestral Tier -${distanceBack}`;

    ancestorTiers.push({
      distance: distanceBack,
      title,
      nodes: layerNodes
    });

    const nextAncestorIds = new Set<string>();
    for (const aId of currentAncestorIds) {
      const aNode = dag.nodes.get(aId);
      if (aNode) {
        for (const p of aNode.prerequisites) {
          if (!visitedAncestors.has(p)) {
            visitedAncestors.add(p);
            nextAncestorIds.add(p);
          }
        }
      }
    }

    currentAncestorIds = nextAncestorIds;
    distanceBack++;
  }

  // Compute downstream layers by distance
  const descendantTiers: Array<{ distance: number; title: string; nodes: GraphNode[] }> = [];
  let currentDescendantIds = new Set(node.unlockedLectures);
  const visitedDescendants = new Set<string>([node.id, ...node.unlockedLectures]);
  let distanceFwd = 1;

  while (currentDescendantIds.size > 0 && distanceFwd <= 6) {
    const layerNodes = Array.from(currentDescendantIds)
      .map((id) => dag.nodes.get(id)!)
      .filter(Boolean)
      .sort((a, b) => a.lectureNumber - b.lectureNumber);

    const title =
      distanceFwd === 1
        ? 'Directly Unlocks (Next Topics)'
        : distanceFwd === 2
          ? 'Secondary Horizon (Grandchildren)'
          : `Unlocked Tier +${distanceFwd}`;

    descendantTiers.push({
      distance: distanceFwd,
      title,
      nodes: layerNodes
    });

    const nextDescendantIds = new Set<string>();
    for (const dId of currentDescendantIds) {
      const dNode = dag.nodes.get(dId);
      if (dNode) {
        for (const u of dNode.unlockedLectures) {
          if (!visitedDescendants.has(u)) {
            visitedDescendants.add(u);
            nextDescendantIds.add(u);
          }
        }
      }
    }

    currentDescendantIds = nextDescendantIds;
    distanceFwd++;
  }

  const softLinks = node.softLinks
    .map((link) => {
      const targetNode = dag.nodes.get(link.targetId);
      return targetNode ? { targetNode, relationship: link.relationship } : null;
    })
    .filter(Boolean) as Array<{ targetNode: GraphNode; relationship: string }>;

  // Children whose other prerequisites are satisfied (ready to tackle)
  const readyToTackleNext = directUnlocked.filter((child) => {
    return child.prerequisites.every((p) => p === node.id || completedSet.has(p));
  });

  return {
    node,
    directPrerequisites,
    ancestorTiers,
    directUnlocked,
    descendantTiers,
    softLinks,
    readyToTackleNext
  };
}

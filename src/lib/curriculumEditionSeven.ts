import type { Lecture, SoftLink } from './curriculum';
import { PAULI_CORRECTIONS } from './curriculumPauliCorrections';
import { SIMULATION_CORRECTIONS } from './curriculumSimulationCorrections';
import { STUDY_CORRECTIONS } from './curriculumStudyCorrections';

type TextSection = Exclude<keyof Lecture['content'], 'reflectionPrompts'>;
export type LectureCorrection = {
  content?: Partial<Record<TextSection, string>>;
  additions?: Partial<Record<TextSection, string>>;
  replacements?: Partial<Record<TextSection, [string, string][]>>;
  formulas?: Lecture['theoreticalCitations'];
  prerequisites?: string[];
  referenceSections?: string;
};

const overviews: Partial<Record<number, string>> = {
  14: 'A circuit builds operations from elementary gates. Universality asks what a fixed gate set can approximate and how precision affects the compiled sequence.',
  17: 'Two binary labels specify the local Pauli axes. Store a separate phase exponent to recover the exact operator.',
  25: 'Clifford synthesis turns signed images of Pauli generators into gates. Reduce the label action, then correct the generator signs.',
  26: 'A uniform projective Clifford sample combines a uniform symplectic frame and an independent uniform Pauli.',
  31: 'A highly entangled GHZ state still has a short stabilizer description. The Gottesman–Knill theorem gives efficient joint sampling for the stated circuit family.',
  33: 'Separate circuit description from execution so each backend can declare which inputs, operations, and outputs it supports.',
  36: 'Slicing lowers the active memory requirement for dense amplitudes. Tensor contractions and path sums offer other ways to compute structured results or individual amplitudes.',
  38: 'A symmetry defines invariant sectors of a Hamiltonian. Their dimensions depend on the symmetry operator.',
  39: 'A Clifford can permute the signed Pauli terms of a Hamiltonian. Compare the resulting coefficients and work in the eigenspaces of a verified symmetry.',
  42: 'Find Pauli labels that commute with every term. Select a commuting subset to define joint sectors.',
  43: 'Reduce a commuting Pauli family to single-wire Z operators. Track signs and row operations to interpret the resulting bits.',
  44: 'Use a Pauli symmetry to split a four-spin Hamiltonian into two blocks and recover the global ground energy by comparing them.',
  47: 'Each Pauli term moves amplitudes between computational basis states and supplies a phase. Use that action to apply the Hamiltonian with a vector accumulator.',
  50: 'Grouping commuting observables can reduce measurement settings. Graph coloring supplies candidates whose shot costs depend on covariance.',
  55: 'Majorana operators give a Hermitian basis for expressing creation and annihilation. Compare how two fermion encodings store parity information.',
  56: 'Track quadratic evolution of an even fermionic Gaussian state by rotating its covariance matrix.',
  58: 'Parallelize the output-index gather in a matrix-free Pauli sum. Use traffic estimates to interpret a measured GPU runtime.',
  59: 'Estimate average conditional shot covariance by evaluating the integrand across posterior draws and reducing the resulting arrays.'
};

const updatedFormulas: Partial<Record<number, Lecture['theoreticalCitations']>> = {
  14: [
    {
      formulaName: 'Projective Clifford+T universality',
      expression: String.raw`\overline{\langle[H],[S],[\mathrm{CNOT}],[T]\rangle}=\mathrm{PU}(2^n)`,
      source: 'Boykin et al., universal fault-tolerant basis',
      theoremOrEquation: 'Density in projective unitary action',
      doiOrUrl: 'https://arxiv.org/abs/quant-ph/9906054'
    }
  ],
  22: [
    {
      formulaName: 'Projective Clifford generators',
      expression: String.raw`\overline{\mathcal C}_n=\langle[H_j],[S_j],[\mathrm{CNOT}_{j\to k}]\mid j\ne k\rangle`,
      source: 'Aaronson and Gottesman',
      theoremOrEquation: 'Elementary Clifford operations',
      doiOrUrl: 'https://arxiv.org/abs/quant-ph/0406196'
    }
  ],
  25: [
    {
      formulaName: 'Pauli sign correction after label synthesis',
      expression: String.raw`QX_jQ^\dagger=(-1)^{z_j}X_j,\qquad QZ_jQ^\dagger=(-1)^{x_j}Z_j`,
      source: 'Bravyi and Maslov',
      theoremOrEquation: 'Projective Clifford structure',
      doiOrUrl: 'https://arxiv.org/abs/2003.09412'
    }
  ],
  26: [
    {
      formulaName: 'Size of a projective Clifford fiber',
      expression: String.raw`|\overline{\mathcal C}_n|=4^n|\mathrm{Sp}(2n,\mathbb F_2)|`,
      source: 'König and Smolin',
      theoremOrEquation: 'Uniform sampling of projective Cliffords',
      doiOrUrl: 'https://arxiv.org/abs/1406.2170'
    }
  ],
  33: [
    {
      formulaName: 'Dense statevector memory',
      expression: String.raw`B=16\cdot2^n\ \mathrm{bytes}`,
      source: 'Complex double-precision storage',
      theoremOrEquation: 'Amplitude payload before workspace overhead'
    }
  ],
  35: [
    {
      formulaName: 'Exact local rewrite identities',
      expression: String.raw`H^2=I,\quad S^4=I,\quad \mathrm{CNOT}^2=I,\quad XTX=e^{i\pi/4}T^\dagger`,
      source: 'Single-qubit matrix identities',
      theoremOrEquation: 'Ordered products with global phase retained'
    }
  ],
  51: [
    {
      formulaName: 'Recover the signed measurement outcome',
      expression: String.raw`UPU^\dagger=(-1)^rZ^z\quad\Longrightarrow\quad y_P=(-1)^{r+z\cdot b}`,
      source: 'Signed Clifford conjugation',
      theoremOrEquation: 'Basis rotation followed by bit parity'
    }
  ],
  58: [
    {
      formulaName: 'Simplified full-vector traffic bound',
      expression: String.raw`t_{\mathrm{transfer}}\ge\frac{2\cdot2^n\cdot8\ \mathrm{bytes}}{B_{\mathrm{peak}}}`,
      source: 'Memory traffic calculation',
      theoremOrEquation: 'One full read and write of complex-single data'
    }
  ]
};

const link = (targetId: string, relationship: string): SoftLink => ({ targetId, relationship });
const revisedLinks: Partial<Record<number, SoftLink[]>> = {
  7: [
    link('L23-symplectic-clifford-isomorphism', 'See the projective Clifford action on qubit Pauli labels.'),
    link(
      'L60-qudit-algebra-mixed-dimension-registers',
      'Compare qubit labels with local shift and clock operators.'
    )
  ],
  11: [
    link(
      'L22-standard-generators-conjugation',
      'H and S generate the single-qubit projective Clifford group. Add CNOT for multiple wires.'
    )
  ],
  13: [
    link('L54-hardware-noise-systematic-shifts', 'Study calibration of readout errors.'),
    link('L61-quantum-channels-kraus', 'Extend the partial trace to the Kraus representation of a channel.')
  ],
  23: [
    link(
      'L57-qec-stabilizer-codes-automorphisms',
      'Use signed Clifford conjugation to check whether a code subspace is preserved.'
    )
  ],
  24: [
    link('L25-clifford-circuit-synthesis', 'Reduce a symplectic frame and recover a signed gate sequence.'),
    link(
      'L60-qudit-algebra-mixed-dimension-registers',
      'Compare finite-field examples with the local shift and clock algebra.'
    )
  ],
  26: [
    link('L82-randomized-benchmarking', 'Use uniform projective Clifford draws for randomized benchmarking.')
  ],
  35: [
    link('L22-standard-generators-conjugation', 'Derive valid gate moves from signed Clifford conjugation.')
  ],
  36: [
    link('L66-matrix-product-quantum-states', 'Use bounded bond dimensions to store structured amplitudes.')
  ],
  40: [
    link(
      'L50-commutation-graphs-clique-covers',
      'Compare the graph with a term graph that places edges on commuting pairs.'
    )
  ],
  41: [
    link('L42-term-fixers-exact-kernel', 'Find term-fixing Pauli labels by a binary nullspace calculation.')
  ],
  44: [
    link(
      'L39-clifford-symmetries-paper-tour',
      'Distinguish Pauli sectors from sectors of a general Clifford symmetry.'
    ),
    link(
      'L40-colored-graphs-interaction-graphs',
      'Generate candidate symmetries from the colored term graph.'
    )
  ],
  48: [
    link(
      'L59-batched-cuda-covariance-offload',
      'Compare Ritz residual checks with numerical error checks for covariance estimation.'
    )
  ],
  53: [
    link(
      'L59-batched-cuda-covariance-offload',
      'Batch the conditional covariance integrand across posterior draws.'
    ),
    link(
      'L92-markov-chains-mixing-mcmc',
      'Check support, mixing, and dependence in Markov chain integration.'
    )
  ],
  58: [
    link(
      'L59-batched-cuda-covariance-offload',
      'Compare a GPU matrix-vector product with a covariance reduction.'
    )
  ],
  59: [
    link(
      'L53-mcmc-covariance-integration',
      'Separate mean conditional covariance from covariance of conditional means.'
    )
  ],
  60: [
    link(
      'L23-symplectic-clifford-isomorphism',
      'Compare projective phase quotients and the symplectic action.'
    ),
    link('L24-symplectic-transvections', 'Study a transvection over a prime field.')
  ],
  64: [link('L90-monte-carlo-variance', 'Treat survival at fixed time as a Bernoulli event.')],
  67: [link('L93-hamiltonian-time-evolution', 'Derive coherent evolution for a constant Hamiltonian.')],
  74: [
    link(
      'L93-hamiltonian-time-evolution',
      'Derive constant-Hamiltonian evolution and compare ordered pulses.'
    )
  ],
  105: [
    link('L98-np-completeness-reductions', 'Relate accepting witnesses to decision-problem classes.'),
    link('L100-space-complexity-reachability', 'Compare path counting and implicit reachability.')
  ],
  107: [link('L92-markov-chains-mixing-mcmc', 'Use total variation to quantify distributional error.')],
  108: [link('L67-tebd-quantum-time-evolution', 'Compare product-formula and truncation error in TEBD.')]
};

export function reviseLecture(lecture: Lecture): Lecture {
  const n = lecture.lectureNumber;
  const revision = STUDY_CORRECTIONS[n] ?? PAULI_CORRECTIONS[n] ?? SIMULATION_CORRECTIONS[n];
  const softLinks = revisedLinks[n] ?? lecture.softLinks;
  if (!revision && softLinks === lecture.softLinks) return lecture;

  const content = { ...lecture.content, ...revision?.content };
  content.motivation = overviews[n] ?? content.motivation;
  for (const section of Object.keys(revision?.replacements ?? {}) as TextSection[]) {
    for (const [before, after] of revision?.replacements?.[section] ?? []) {
      if (!content[section].includes(before)) {
        throw new Error('Missing correction target in ' + lecture.id + ' ' + section);
      }
      content[section] = content[section].replaceAll(before, after);
    }
  }
  for (const section of Object.keys(revision?.additions ?? {}) as TextSection[]) {
    content[section] += '\n\n' + revision?.additions?.[section];
  }
  const paperReferences = lecture.paperReferences.map((paper, i) => {
    if (n >= 10 && n <= 13 && paper.sourceUrl === 'https://www.preskill.caltech.edu/ph219/chap2_15.pdf') {
      return {
        ...paper,
        sourceUrl: 'https://www.preskill.caltech.edu/ph219/chap3_15.pdf',
        citation: 'Caltech quantum computation lecture notes, chapter 3'
      };
    }
    return i === 0 && revision?.referenceSections
      ? { ...paper, relevantSections: revision.referenceSections }
      : paper;
  });
  const theoreticalCitations = (updatedFormulas[n] ?? revision?.formulas ?? lecture.theoreticalCitations).map(
    (cite) =>
      n >= 10 && n <= 13 && cite.doiOrUrl === 'https://www.preskill.caltech.edu/ph219/chap2_15.pdf'
        ? { ...cite, doiOrUrl: 'https://www.preskill.caltech.edu/ph219/chap3_15.pdf' }
        : cite
  );
  return {
    ...lecture,
    content,
    paperReferences,
    theoreticalCitations,
    implementationChoices:
      revision?.content?.codeWalkthrough === undefined ? lecture.implementationChoices : [],
    softLinks,
    prerequisites: revision?.prerequisites ?? lecture.prerequisites
  };
}

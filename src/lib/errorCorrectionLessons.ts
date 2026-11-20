import type { PaperReference } from './curriculum';
import { studyPack } from './curriculumLesson';

const PRESKILL: PaperReference = {
  title: 'Quantum error correction',
  authors: 'John Preskill',
  citation: 'Caltech lecture notes (1998)',
  relevantSections: 'Three-qubit repetition code and quantum error correction',
  sourceUrl: 'https://www.preskill.caltech.edu/ph229/notes/chap7.pdf'
};

export const ERROR_CORRECTION = studyPack(
  {
    id: 'quantum-error-correction',
    title: 'Quantum Error Correction',
    description: 'Read syndromes, prove correctability, and track detection events across rounds.',
    color: 'sage',
    symbol: '⊕',
    prerequisites: ['stabilizer-formalism', 'open-quantum-systems']
  },
  77,
  [
    {
      id: 'L77-three-qubit-repetition-code',
      formula: {
        name: 'Repetition-code failure rate',
        expression: String.raw`P_L=3p^2(1-p)+p^3`,
        context: 'Independent bit flips with ideal correction'
      },
      title: 'The Three-Qubit Repetition Code',
      question: 'How can two parity checks locate a bit flip without measuring the logical state?',
      prerequisites: ['L13-density-matrices-mixed-states', 'L27-stabilizer-states-generators'],
      durationMinutes: 40,
      reference: PRESKILL,
      overview:
        'A syndrome reveals relationships between qubits. The three-qubit repetition code uses two relationships to correct one bit flip while preserving the encoded amplitudes.',
      theory: String.raw`### Encode a superposition

Encode $\alpha|0\rangle+\beta|1\rangle$ as $\alpha|000\rangle+\beta|111\rangle$. Both basis states have eigenvalue $+1$ under the parity operators $ZZI$ and $IZZ$. Measuring those operators cannot distinguish the two codewords. Each check yields a syndrome bit equal to 1 for eigenvalue $-1$.

An $X$ on the first qubit flips the first check only. An $X$ on the middle qubit flips both checks. An $X$ on the third qubit flips the second check only. Applying the corresponding $X$ again returns the original encoded state, including its relative phase.

### What the syndrome misses

A $Z$ on one qubit leaves both check outcomes unchanged and changes the relative sign of the two codewords. It acts as logical $Z$. Two bit flips have the same syndrome as the single flip on the remaining qubit. A decoder that assumes one flip completes a logical $XXX$ in that case.`,
      example: String.raw`### Decode 11

The syndrome $(1,1)$ is consistent with $X$ on qubit 2, counting from 1. It is also consistent with $X$ on qubits 1 and 3. With independent bit flips of probability $p<1/2$, the single flip is more likely. If checks and recovery are ideal, the resulting logical bit flips occur with probability $3p^2(1-p)+p^3=3p^2-2p^3$. At $p=0.01$ this is $0.000298$.`,
      exercise: String.raw`**Track a mistaken repair.** Qubits 1 and 2 flip. Write the syndrome and apply the one-flip decoder to $\alpha|000\rangle+\beta|111\rangle$.

**Check:** The syndrome is $(1,0)\oplus(1,1)=(0,1)$. The decoder flips qubit 3, so the final state is $\alpha|111\rangle+\beta|000\rangle$.`
    },
    {
      id: 'L78-knill-laflamme-conditions',
      formula: {
        name: 'Exact quantum error correction',
        expression: String.raw`PE_a^\dagger E_bP=c_{ab}P`,
        context: 'Correctability on the code space'
      },
      title: 'The Knill–Laflamme Conditions',
      question: 'What must be true of an entire set of errors for a single recovery to correct it?',
      prerequisites: ['L77-three-qubit-repetition-code', 'L61-quantum-channels-kraus'],
      durationMinutes: 50,
      reference: {
        title: 'Theory of quantum error-correcting codes',
        authors: 'Emanuel Knill & Raymond Laflamme',
        citation: 'Phys. Rev. A 55, 900 (1997)',
        relevantSections: 'Necessary and sufficient conditions for recovery',
        doi: '10.1103/PhysRevA.55.900',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/9604034'
      },
      overview:
        'Exact correction requires that the error record reveal no information about the encoded state. The Knill–Laflamme test makes that requirement an operator identity.',
      theory: String.raw`### Test overlaps on the code space

Let $P$ project onto the code space and let $\{E_a\}$ be the error operators of a channel. Exact recovery on that space exists precisely when

$$
P E_a^\dagger E_b P=c_{ab}P\quad\text{for every pair } a,b.
$$

For a normalized code state $|\psi\rangle$, $\langle\psi|E_a^\dagger E_b|\psi\rangle$ is an overlap between two corrupted states. Those overlaps determine the corresponding environment density matrix. If they depend on $|\psi\rangle$, the environment can carry information about the input. The operator condition requires the same overlaps for every code state, including superpositions.

### Why that is enough

The scalar matrix $c$ is positive semidefinite. Diagonalizing it mixes the error operators into $F_j$ with $P F_j^\dagger F_k P=d_j\delta_{jk}P$. Each $F_j/\sqrt{d_j}$ for $d_j>0$ is an isometry on the code with range orthogonal to the others. A recovery can measure which range occurred and reverse its isometry. Terms with $d_j=0$ vanish on the code. This argument allows two physical errors to have the same action on the code.`,
      example: String.raw`### Test bit flips and phase flips separately

On the repetition code, $I,X_1,X_2,X_3$ send the two codewords to four disjoint pairs of basis states. Cross overlaps vanish and diagonal overlaps are $P$. Now try the pair $I,Z_1$. The product $PIZ_1P$ has eigenvalue $+1$ on $|000\rangle$ and $-1$ on $|111\rangle$. No single scalar $c$ fits both, so the code cannot exactly correct the error set containing both $I$ and $Z_1$.`,
      exercise: String.raw`**Identify a degenerate pair.** On the same code, compare the actions of $I$ and $Z_1Z_2$. What is their cross overlap?

**Check:** Both act as identity on the encoded basis, giving $P I^\dagger Z_1Z_2P=P$. A recovery does not need to distinguish these two actions.`
    },
    {
      id: 'L79-css-steane-code',
      formula: {
        name: 'CSS commutation',
        expression: String.raw`H_XH_Z^{\mathsf T}=0`,
        context: 'Binary orthogonality of check matrices'
      },
      title: 'CSS Checks and the Steane Code',
      question: 'How do two binary parity-check matrices define commuting quantum checks?',
      prerequisites: ['L17-binary-symplectic-encoding', 'L78-knill-laflamme-conditions'],
      durationMinutes: 55,
      reference: {
        title: 'Good quantum error-correcting codes exist',
        authors: 'A. R. Calderbank & Peter W. Shor',
        citation: 'Phys. Rev. A 54, 1098 (1996)',
        relevantSections: 'Quantum codes constructed from binary linear codes',
        doi: '10.1103/PhysRevA.54.1098',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/9512032'
      },
      overview:
        'CSS codes use separate $X$ and $Z$ checks. Binary linear algebra tells you which operators commute, how to read their syndromes, and which errors can act on the encoded state.',
      theory: String.raw`### Translate a row into a check

In a row of $H_X$, each 1 places an $X$ on that qubit. A row of $H_Z$ places $Z$ on its 1s. On a common qubit, $XZ=-ZX$. Overlap on an even number of qubits gives an overall plus sign. Thus the check sets commute exactly when $H_XH_Z^{\mathsf T}=0$ over $\mathbb F_2$.

A $Z$ error with support vector $z$ produces the $X$-check syndrome $H_X z$. An $X$ error with support $x$ produces the $Z$-check syndrome $H_Z x$. A $Y$ error has both components. Here syndrome 0 means the corresponding check commutes with the error.

### Use one Hamming matrix twice

For the Steane code take $H_X=H_Z=H$, with rows $0001111$, $0110011$, and $1010101$. Each row has weight four, and every pair overlaps in two positions. The six generators are independent because the three rows are independent in each Pauli sector. They leave $k=7-6=1$ logical qubit.

The columns of $H$ are the seven nonzero three-bit vectors. No weight-one or weight-two vector belongs to $\ker H$. The first three columns sum to zero, so $1110000$ belongs to $\ker H$. Every nonzero vector in the row space has weight four: a nonzero linear form on the columns returns 1 on four columns. Thus $Z_1Z_2Z_3$ commutes with all checks and is outside the stabilizer. The distance is three.`,
      example: String.raw`### Locate a phase flip

A $Z$ on qubit 6 yields the $X$-check syndrome $110$, the sixth column of $H$. Its $Z$-check syndrome is $000$. A $Y$ on qubit 6 gives $110$ in both blocks. The two syndrome blocks distinguish a single-qubit $Z$ from a single-qubit $Y$ at the same location.`,
      exercise: String.raw`**Look for ambiguity beyond distance.** Compute the $X$-check syndrome of $Z_1Z_2$. Which single-qubit error produces the same result?

**Check:** $001\oplus010=011$, the syndrome of $Z_3$. Applying $Z_3$ yields the weight-three logical operator identified above.`
    },
    {
      id: 'L80-surface-code-repeated-syndromes',
      formula: {
        name: 'Detection event condition',
        expression: String.raw`s_{j,t}s_{j,t-1}=-1`,
        context: 'Comparing successive outcomes of one check'
      },
      title: 'Surface Codes and Repeated Syndromes',
      question: 'What changes when a parity-check outcome can itself be wrong?',
      prerequisites: ['L79-css-steane-code', 'L30-stabilizer-measurement-algorithm'],
      durationMinutes: 50,
      reference: {
        title: 'Surface codes: Towards practical large-scale quantum computation',
        authors: 'Fowler, Mariantoni, Martinis & Cleland',
        citation: 'Phys. Rev. A 86, 032324 (2012)',
        relevantSections: 'Repeated stabilizer measurements and decoding',
        doi: '10.1103/PhysRevA.86.032324',
        arxivUrl: 'https://arxiv.org/abs/1208.0928'
      },
      overview:
        'A decoder sees a record of repeated checks. Adjacent changes in that record distinguish persistent errors from transient measurement faults when considered across the whole patch.',
      theory: String.raw`### Compare rounds

Write $s_{j,t}\in\{+1,-1\}$ for check $j$ in round $t$. With a fixed schedule and known initial checks, a detection event occurs when $s_{j,t}s_{j,t-1}=-1$. A single flipped readout gives two successive events at the same check if the adjacent rounds are reliable. A Pauli fault on a data qubit can instead flip two adjacent checks of the opposite type, giving spatial events in the same round in the idealized phenomenological model.

### Pair events across space and time

Place each event at a check and a round. Candidate edges represent elementary faults that cause a pair of events. Some faults create a single observable event near a boundary, where the other endpoint can terminate. Real circuit faults can create more complex patterns, so the detector graph and weights depend on the extraction circuit and noise model.

Two corrections can explain the same detection events. Their difference may be a product of stabilizers, which acts trivially on encoded states. It may instead be a logical operator supported across the appropriate boundaries. A decoder succeeds when its inferred recovery has the correct logical effect.`,
      example: String.raw`### Read a single-check time slice

| Readouts over four rounds | Changes after the first round | A compatible fault |
| --- | --- | --- |
| $+,-,-,-$ | $1,0,0$ | A data error flips the check persistently |
| $+,-,+,+$ | $1,1,0$ | The second readout was wrong |

These examples illustrate possible explanations. Two data faults can also make a temporary flip. Other checks, boundary conditions, and fault probabilities help distinguish the explanations.`,
      exercise: String.raw`**Compare spatial and temporal edges.** Two neighboring checks change in round 3 and keep their new values. Which simple fault can explain both events? How would a readout fault on one of the checks differ?

**Check:** A data Pauli between the checks can flip both. A readout fault at one check gives a local change in round 3 and another in round 4 if the next readout returns to its original value.`
    }
  ]
);

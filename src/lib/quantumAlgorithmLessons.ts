import { studyPack } from './curriculumLesson';

export const QUANTUM_ALGORITHMS = studyPack(
  {
    id: 'quantum-algorithms',
    title: 'Quantum algorithms',
    description: 'Phase kickback, Grover search, phase estimation, and quantum order finding.',
    color: 'blue',
    symbol: 'U',
    prerequisites: ['quantum-essentials', 'classical-complexity', 'computational-mathematics']
  },
  101,
  [
    {
      id: 'L101-quantum-queries-phase-kickback',
      title: 'Quantum Queries and Phase Kickback',
      question: 'How can one coherent query expose a hidden parity string?',
      prerequisites: ['L14-circuit-model-universal-sets', 'L97-cost-models-asymptotics'],
      durationMinutes: 45,
      reference: {
        title: 'Quantum complexity theory',
        authors: 'Ethan Bernstein & Umesh Vazirani',
        citation: 'SIAM Journal on Computing 26, 1411–1473 (1997)',
        doi: '10.1137/S0097539796300921',
        sourceUrl: 'https://epubs.siam.org/doi/10.1137/S0097539796300921',
        relevantSections: 'Quantum oracle computation and Fourier sampling'
      },
      formula: {
        name: 'Phase kickback for a bit oracle',
        expression: String.raw`U_f|x\rangle|-\rangle=(-1)^{f(x)}|x\rangle|-\rangle`,
        context: 'X on the target has eigenvalue −1 on the minus state'
      },
      overview:
        'Derive the Bernstein–Vazirani algorithm and separate the number of oracle calls from the work of realizing the oracle.',
      theory: String.raw`### Use a reversible oracle

For a Boolean function $f$, the bit oracle is $U_f|x\rangle|b\rangle=|x\rangle|b\oplus f(x)\rangle$. With target $|-\rangle$, applying $X$ changes a sign, so the output acquires phase $(-1)^{f(x)}$. Preparing $|+\rangle^{\otimes n}$ on the input register places this sign on each component with one call. Measuring those components directly would still produce a uniform sample.

### Decode the hidden parity by interference

For the promise $f(x)=s\cdot x\bmod2$, the signed state after the oracle is $H^{\otimes n}|s\rangle$. This follows by tensoring $H|s_i\rangle=(|0\rangle+(-1)^{s_i}|1\rangle)/\sqrt2$. Applying another $H$ to each input qubit yields $|s\rangle$ exactly.

Each classical bit query returns one linear equation on the $n$ unknown bits. With fewer than $n$ independent equations there are multiple consistent strings. The separation is in black-box queries. If you have the circuit description for $f$, you must also account for what that description already reveals and how much a coherent call costs.`,
      example: String.raw`### Recover a four-bit label

Let $s=1011$. The phase on input $0101$ is $-1$ because the dot product is 1 modulo 2. The whole sign pattern factors into the tensor product $|-\rangle|+\rangle|-\rangle|-\rangle$. The final Hadamards return $1011$. The classical standard-basis strategy queries $1000,0100,0010,0001$ to read one bit at a time.`,
      exercise: String.raw`**Change the target state.** What if the oracle target is $|+\rangle$? What register string is measured after the final Hadamards?

**Check.** $X|+\rangle=|+\rangle$, so there is no kicked-back phase. The uniform input returns to $0^n$, independent of the hidden string.`
    },
    {
      id: 'L102-grover-search-query-bounds',
      title: 'Grover Search and Query Lower Bounds',
      question: 'Why does unstructured quantum search need order √N queries?',
      prerequisites: ['L101-quantum-queries-phase-kickback'],
      durationMinutes: 55,
      reference: {
        title: 'A fast quantum mechanical algorithm for database search',
        authors: 'Lov K. Grover',
        citation: 'Proceedings of STOC, 1996, pp. 212–219',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/9605043',
        relevantSections: 'Phase marking and inversion about the average'
      },
      formula: {
        name: 'Grover success probability',
        expression: String.raw`P_r=\sin^2((2r+1)\theta),\qquad\sin^2\theta=M/N`,
        context: 'r ideal iterations from the uniform start with M of N labels marked'
      },
      overview:
        'Derive the two-dimensional rotation and explain why a more clever black-box circuit cannot generally beat its scaling.',
      theory: String.raw`### Reflect about two axes

Write the uniform state as $\cos\theta|b\rangle+\sin\theta|g\rangle$, with normalized unmarked and marked uniform states and $\sin^2\theta=M/N$. A phase oracle negates the marked component. The diffusion operator $2|s\rangle\langle s|-I$ reflects about the original uniform state $|s\rangle$. Their product is a rotation by $2\theta$ toward the marked axis at the start.

After $r$ iterations, the probability of a marked outcome is $\sin^2((2r+1)\theta)$. When $M$ is known and small relative to $N$, choose $r$ near $\pi/(4\theta)-1/2$ to approach the first peak. With one marked item this takes $O(\sqrt N)$ queries. Continuing to iterate can reduce the success probability.

### Compare against the no-mark oracle

For the lower bound, compare a circuit's final state with a single mark $x$ to its state with no mark. Before query $j$ on the no-mark run, let $p_j(x)$ be the probability weight on address $x$. Changing that query changes the state norm by at most $2\sqrt{p_j(x)}$. A telescoping comparison of the $r$ queries and Cauchy–Schwarz give $\sum_x\|\psi_x-\psi_\varnothing\|^2\le4r^2$. To reliably return each possible mark, a final measurement must distinguish the marked state from the no-mark state by a constant for most $x$. Thus $4r^2=\Omega(N)$. This is the black-box obstruction in the [hybrid lower bound](https://arxiv.org/abs/quant-ph/9701001).`,
      example: String.raw`### Hit the first peak with one call

With four marked labels out of 16, $\theta=\arcsin(1/2)=\pi/6$. After one iteration the angle is $\pi/2$, giving success 1. After two iterations it is $5\pi/6$, giving $1/4$. A classical uniform query in this example succeeds with probability $1/4$ on its first draw.`,
      exercise: String.raw`**Count queries in an exhaustive search.** Let one of $N$ labels be marked and a classical strategy test $q$ distinct labels. With a uniformly random mark, what is the chance of finding it among those $q$ tests?

**Check.** The probability is $q/N$. Constant success requires order $N$ classical tests in this model. Include the cost of the predicate when translating either query count into runtime.`
    },
    {
      id: 'L103-quantum-phase-estimation',
      title: 'Quantum Phase Estimation and the Inverse QFT',
      question: 'How do controlled powers of a unitary make its eigenphase readable?',
      prerequisites: [
        'L101-quantum-queries-phase-kickback',
        'L88-dft-fast-fourier-transform',
        'L93-hamiltonian-time-evolution'
      ],
      durationMinutes: 55,
      reference: {
        title: 'Quantum measurements and the Abelian stabilizer problem',
        authors: 'A. Yu. Kitaev',
        citation: 'arXiv:quant-ph/9511026, 1995',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/9511026',
        relevantSections: 'Measuring eigenphases of unitary operators'
      },
      formula: {
        name: 'Probability of a phase estimate',
        expression: String.raw`P(y)=\left|\frac1N\sum_{x=0}^{N-1}e^{2\pi i x(\varphi-y/N)}\right|^2,\qquad N=2^m`,
        context: 'm control qubits and an eigenstate input'
      },
      overview:
        'Calculate the exact grid case, explain the finite-resolution tails, and count the time needed to implement the controlled powers.',
      theory: String.raw`### Accumulate an eigenphase in a control register

Suppose $U|u\rangle=e^{2\pi i\varphi}|u\rangle$. Prepare $m$ control qubits in a uniform superposition, with $N=2^m$. Controlling $U^{2^j}$ on bit $j$ multiplies component $x$ by $e^{2\pi i\varphi x}$. The eigenstate is unchanged. Inverse QFT on the control register converts this phase progression into a peak near $N\varphi$ modulo $N$.

If $\varphi=a/N$, the finite geometric sum is $N$ at $y=a$ and zero elsewhere. For a phase off the grid, its nearest grid point has probability at least $4/\pi^2$. To see the bound, set $\delta=\varphi-y/N$ modulo integers with $|\delta|\le1/(2N)$ and use $|\sin(\pi N\delta)|\ge2N|\delta|$ and $|\sin(\pi\delta)|\le\pi|\delta|$ in the geometric sum. With a superposition of target eigenstates, phase outcomes mix according to the squared overlaps.

### Count what the controls implement

The exact inverse QFT circuit uses $O(m^2)$ elementary basis-change and controlled rotation gates. When powers are built by repeated calls to $U$, the controlled evolutions require $1+2+\cdots+2^{m-1}=N-1$ calls. For $U=e^{-iHt/\hbar}$, longer simulated evolution improves resolution, and energies separated by $2\pi\hbar/t$ have the same eigenphase. State preparation, evolution, precision, and readout each need a budget.`,
      example: String.raw`### Decode an exact three-bit phase

Let $m=3$ and $\varphi=3/8$. The input to inverse QFT is the Fourier column for index 3, so the result is the basis label $011$. If the initial target state has squared overlap $0.25$ on that eigenvector and all its other components have distinct on-grid phases, the algorithm reports $011$ with probability $0.25$.`,
      exercise: String.raw`**Double resolution.** Increase $m$ from three to four. How do the grid spacing and the repeated-$U$ query count change?

**Check.** Spacing decreases from $1/8$ to $1/16$. The counts increase from 7 to 15. For a structured $U$, directly implementing its powers can change the cost model.`
    },
    {
      id: 'L104-quantum-order-finding',
      title: 'Order Finding and Shor’s Algorithm',
      question: 'How does a measured eigenphase yield a factor of an integer?',
      prerequisites: ['L103-quantum-phase-estimation', 'L72-invariants-termination'],
      durationMinutes: 60,
      reference: {
        title:
          'Polynomial-time algorithms for prime factorization and discrete logarithms on a quantum computer',
        authors: 'Peter W. Shor',
        citation: 'SIAM Journal on Computing 26, 1484–1509 (1997)',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/9508027',
        relevantSections: 'Order finding, continued fractions, and reduction from factoring'
      },
      formula: {
        name: 'Extract factors from an even order',
        expression: String.raw`a^r\equiv1\pmod N,\quad r\text{ even}\quad\Longrightarrow\quad (a^{r/2}-1)(a^{r/2}+1)\equiv0\pmod N`,
        context: 'Use the two GCDs when the half-order power is neither +1 nor −1 modulo N'
      },
      overview:
        'Follow the reduction from modular order through a phase estimate and continued fractions to a classical GCD calculation.',
      theory: String.raw`### Turn multiplication into a unitary

For $\gcd(a,N)=1$, multiplication by $a$ modulo $N$ is a permutation of residues. Its orbit from 1 has length $r$, the least positive exponent with $a^r\equiv1\pmod N$. Fourier superpositions around that orbit are eigenvectors of the permutation with phases $s/r$, $s=0,\ldots,r-1$. The starting residue state $|1\rangle$ has equal squared overlap on those eigenvectors. Phase estimation therefore samples one of the orbit phases.

### Recover a denominator, then verify it

With resolution roughly $1/N^2$, continued fractions find the reduced denominator of a close enough phase sample. Specifically, if $|y/Q-s/r|<1/(2r^2)$ and $\gcd(s,r)=1$, the fraction $s/r$ is a convergent of $y/Q$. A shared factor of $s$ and $r$ can hide part of $r$, so verify candidate orders with modular exponentiation and repeat as necessary. Controlled powers multiply by the precomputed $a^{2^j}\bmod N$, allowing reversible modular arithmetic with polynomial cost in $\log N$ rather than repeatedly applying the base permutation.

### Extract a nontrivial factor

If $r$ is even and $a^{r/2}$ is neither $1$ nor $-1$ modulo $N$, the two GCDs of $a^{r/2}\pm1$ with $N$ give nontrivial factors. Other outcomes can require another sample or another choice of $a$. The polynomial-time quantum algorithm does not establish a classical lower bound for factoring.`,
      example: String.raw`### Factor 21 using base 2

The order of 2 modulo 21 is 6. A phase sample with register size 512 can give $y=85$. The continued fraction of $85/512$ begins $[0;6,\ldots]$, with convergent $1/6$. Verify $2^6\equiv1\pmod{21}$ and check smaller divisors of 6 to confirm the order. Now $2^3=8$, so $\gcd(7,21)=7$ and $\gcd(9,21)=3$.`,
      exercise: String.raw`**Use a reduced eigenphase.** If the sampled numerator is $s=2$ and $r=6$, what denominator can be recovered from the exact phase? Does it pass verification for base 2 modulo 21?

**Check.** The fraction reduces to $1/3$. Since $2^3=8\not\equiv1\pmod{21}$, the denominator 3 is not an order.`
    }
  ]
);

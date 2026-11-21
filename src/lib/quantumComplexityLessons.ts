import { studyPack } from './curriculumLesson';

export const QUANTUM_COMPLEXITY = studyPack(
  {
    id: 'quantum-complexity',
    title: 'Quantum computational complexity',
    description:
      'BQP and PP, QMA and local Hamiltonians, simulation tasks, and precision-dependent resource bounds.',
    color: 'ochre',
    symbol: 'Q',
    prerequisites: ['quantum-algorithms', 'classical-complexity', 'quantum-dynamics-spectra']
  },
  105,
  [
    {
      id: 'L105-bqp-circuit-complexity',
      title: 'BQP, PP, and Quantum Circuit Cost',
      question: 'What does polynomial-time quantum computation mean without a free oracle?',
      prerequisites: ['L99-randomized-complexity-amplification', 'L102-grover-search-query-bounds'],
      durationMinutes: 55,
      reference: {
        title: 'Quantum Computational Complexity',
        authors: 'John Watrous',
        citation: 'Encyclopedia of Complexity and Systems Science, 2009',
        arxivUrl: 'https://arxiv.org/abs/0804.3401',
        relevantSections: 'Polynomial-time quantum models, BQP, and classical counting bounds'
      },
      formula: {
        name: 'Class containments',
        expression: String.raw`\mathrm P\subseteq\mathrm{BPP}\subseteq\mathrm{BQP}\subseteq\mathrm{PP}\subseteq\mathrm{PSPACE}`,
        context: 'Unrelativized decision classes with their usual uniform models'
      },
      overview:
        'Define bounded-error quantum polynomial time, connect it to counting signed paths, and check what a claimed speedup actually establishes.',
      theory: String.raw`### Require a uniform family of small circuits

$\mathrm{BQP}$ consists of decision problems solved with error at most $1/3$ by uniform polynomial-size quantum circuits over a fixed universal gate set. Uniformity requires an efficient classical procedure that generates the circuit for each input length. The input is supplied to that circuit in basis states, and an output bit is measured. Independent repetition and majority reduce error, as in BPP. A reversible implementation of classical logic with random bits from measured Hadamards gives $\mathrm{BPP}\subseteq\mathrm{BQP}$.

### Relate acceptance to signed computation paths

For the counting argument use Hadamard and Toffoli gates, which suffice for bounded-error quantum computation via a real-amplitude encoding. With $h$ Hadamards, each path contributes a sign times $2^{-h/2}$. For each accepting basis output, square the sum of signs over paths reaching it. Expanding the square counts ordered pairs of paths that end at the same accepting basis state, weighted by the product of their signs. Acceptance is $G/2^h$, where $G$ is the difference of two efficiently verifiable path-pair counts.

In $\mathrm{PP}$, acceptance probability above $1/2$ is enough even for a tiny gap. Equivalently PP can test the sign of a difference of path counts. The sign of $2G-2^h$ distinguishes the BQP cases, giving $\mathrm{BQP}\subseteq\mathrm{PP}$. This containment offers a complexity bound. It does not supply a bounded-error classical simulation. Whether BPP equals BQP remains open.`,
      example: String.raw`### Account for the predicate in Grover search

If a predicate on $n$ bits costs $g(n)$ elementary gates to evaluate reversibly, an unstructured Grover search over $2^n$ addresses needs order $2^{n/2}$ predicate uses in the one-mark case, plus diffusion gates. Even a polynomial $g(n)$ leaves exponential scaling with $n$. A quadratic reduction in queries does not make this algorithm a polynomial-time solver for arbitrary instances of SAT.`,
      exercise: String.raw`**Inspect the input model.** A circuit makes one query to a unitary that loads an arbitrary table of $2^n$ values. What must be specified before comparing its runtime with a classical algorithm?

**Check.** Specify how the table is represented, how coherent access is prepared, and the work and memory charged in both models. A query bound alone leaves those costs unspecified.`
    },
    {
      id: 'L106-qma-local-hamiltonian',
      title: 'QMA and the Local Hamiltonian Problem',
      question: 'How can a quantum witness certify that a many-body Hamiltonian has low energy?',
      prerequisites: [
        'L105-bqp-circuit-complexity',
        'L98-np-completeness-reductions',
        'L95-quantum-thermal-states'
      ],
      durationMinutes: 60,
      reference: {
        title: 'The complexity of the local Hamiltonian problem',
        authors: 'Julia Kempe, Alexei Kitaev & Oded Regev',
        citation: 'SIAM Journal on Computing 35, 1070–1097 (2006)',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/0406180',
        relevantSections: 'The local Hamiltonian promise problem and QMA-completeness'
      },
      formula: {
        name: 'Energy verifier acceptance',
        expression: String.raw`P(\mathrm{accept}\mid\rho)=1-\frac{\operatorname{Tr}(H\rho)}{m},\quad H=\sum_{j=1}^m H_j,\quad 0\le H_j\le I`,
        context: 'Choose a term uniformly and accept with measurement effect I − Hⱼ'
      },
      overview:
        'Relate the energy of a proposed quantum state to a verifier’s acceptance probability and identify why the problem needs a promise gap.',
      theory: String.raw`### Set the verification promise

QMA is the quantum-witness analogue of a bounded-error verifier. A yes instance has a polynomial-qubit state that a polynomial-size quantum verifier accepts with probability at least $2/3$. For no instances every witness is accepted with probability at most $1/3$. The verifier has one copy of the supplied register and can process it coherently.

For the $k$-local Hamiltonian problem, a classical input specifies $H=\sum_{j=1}^m H_j$ with polynomially many terms, each acting on at most $k$ qubits. Normalize terms to $0\le H_j\le I$ by shifting and rescaling with the thresholds if needed. The input includes thresholds $a<b$ separated by an inverse-polynomial gap. Decide whether the ground energy is at most $a$ or at least $b$, with one case promised.

### Test one term of the witness

Choose a random term $H_j$ and measure the local effect $I-H_j$ for acceptance. Its average is $1-\operatorname{Tr}(H\rho)/m$. A low-energy witness achieves at least $1-a/m$, and in the high-energy case every state gives at most $1-b/m$. The inverse-polynomial difference is sufficient for quantum verification with amplification. The hard direction constructs Hamiltonians from arbitrary verifier circuits. The 2-local version is QMA-complete even with terms acting on at most two qubits.`,
      example: String.raw`### Verify a sum of two projectors

Take $H_1=(I-Z_1)/2$ and $H_2=(I-Z_1Z_2)/2$. The state $|00\rangle$ has energy 0 and always passes. The state $(|00\rangle+|11\rangle)/\sqrt2$ has mean energy $1/2$, since only $H_1$ contributes on $|11\rangle$. With two terms the verifier accepts that witness with probability $3/4$. The two acceptance rates concern different witnesses for the same Hamiltonian.`,
      exercise: String.raw`**Compute the gap in acceptance.** In a general instance let $m=20$, $a=2$, and $b=3$. What are the guaranteed yes and no acceptance bounds for one query to a local term?

**Check.** The best yes witness reaches at least $0.90$. In a no instance every witness has acceptance at most $0.85$. Amplification can increase the $0.05$ gap.`
    },
    {
      id: 'L107-strong-weak-simulation',
      title: 'Strong and Weak Classical Simulation',
      question: 'Why can generating samples be easy when computing a probability exactly is hard?',
      prerequisites: [
        'L105-bqp-circuit-complexity',
        'L98-np-completeness-reductions',
        'L31-gottesman-knill-theorem'
      ],
      durationMinutes: 50,
      reference: {
        title:
          'Classical simulation of quantum computation, the Gottesman–Knill theorem, and slightly beyond',
        authors: 'Maarten Van den Nest',
        citation: 'Quantum Information and Computation 10, 258–271 (2010)',
        arxivUrl: 'https://arxiv.org/abs/0811.0898',
        relevantSections: 'Strong versus weak simulation for reversible classical circuits'
      },
      formula: {
        name: 'Acceptance probability as a count',
        expression: String.raw`P(f(X)=1)=\frac{\#\{x\in\{0,1\}^n:f(x)=1\}}{2^n}`,
        context: 'First prepare a uniform input and then compute the Boolean predicate reversibly'
      },
      overview:
        'Separate exact probability evaluation, additive estimation, and sampling by using the same explicit circuit family.',
      theory: String.raw`### State the simulator’s output

Strong simulation computes outcome probabilities under a specified precision requirement. Weak simulation draws outcomes from the distribution, exactly or within a stated total variation tolerance. If you can efficiently compute every prefix marginal, you can sample bit by bit using conditional probabilities. Being able to sample gives additive estimates of event probabilities, with finite sampling error.

### Build an exact-counting example

Start with $H^{\otimes n}|0^n\rangle$ and compute a Boolean formula $f(x)$ reversibly into an output bit. Its acceptance probability is $\#\mathrm{SAT}(f)/2^n$. A classical simulator can sample the output by drawing a uniform $x$ and evaluating $f$, which costs polynomial time. A polynomial-time exact probability evaluator for all such circuits would compute the number of satisfying assignments by multiplying by $2^n$. That is a $\#\mathrm P$-complete counting task, where $\#\mathrm P$ counts accepting branches of polynomial-time nondeterministic computations.

### Distinguish additive from relative precision

For an event of probability $2^{-n}$, additive error $10^{-3}$ permits reporting zero when $n$ is large. A relative error guarantee on a positive probability requires absolute error proportional to that probability. State the sampling distance, output register, and accuracy criterion before comparing simulators. The Clifford circuits of the stabilizer lessons illustrate how a circuit family can be tractable under specific input and measurement assumptions.`,
      example: String.raw`### Find a rare outcome with one satisfying assignment

For $f(x)=x_1\land\cdots\land x_{20}$ only one input out of $2^{20}$ gives 1. A weak sampler runs quickly per draw. The probability of seeing no 1 in 1000 independent draws is $(1-2^{-20})^{1000}\approx0.9990$. All those samples together provide little relative information about the rare event.`,
      exercise: String.raw`**Draw the next output bit.** A strong simulator gives $P(10)=0.18$ and $P(1)=0.30$ for a prefix. Conditional on already emitting 1, what probability should it assign to 0 next?

**Check.** $P(0\mid1)=P(10)/P(1)=0.6$. Efficient access to prefix probabilities is the ingredient used in this sequential sampler.`
    },
    {
      id: 'L108-hamiltonian-simulation-cost',
      title: 'Hamiltonian Simulation and Precision Cost',
      question: 'How does noncommutation determine a product formula’s gate budget?',
      prerequisites: [
        'L105-bqp-circuit-complexity',
        'L93-hamiltonian-time-evolution',
        'L86-conditioning-linear-solves'
      ],
      durationMinutes: 55,
      reference: {
        title: 'Theory of Trotter error with commutator scaling',
        authors: 'Andrew M. Childs, Yuan Su, Minh C. Tran, Nathan Wiebe & Shuchen Zhu',
        citation: 'Phys. Rev. X 11, 011020 (2021)',
        doi: '10.1103/PhysRevX.11.011020',
        arxivUrl: 'https://arxiv.org/abs/1912.08854',
        relevantSections: 'First-order product formulas and operator-norm errors'
      },
      formula: {
        name: 'First-order two-term error bound',
        expression: String.raw`\left\|e^{-it(A+B)}-\left(e^{-itA/r}e^{-itB/r}\right)^r\right\|\le\frac{t^2}{2r}\|[A,B]\|`,
        context: 'Finite Hermitian terms, operator norm, r positive steps, and ℏ = 1'
      },
      overview:
        'Convert a first-order discretization error into a gate count by separating simulation time, commutator size, and synthesis costs.',
      theory: String.raw`### Split an evolution into implementable terms

For $H=A+B$ use units $\hbar=1$. Advance by $\tau=t/r$ using $e^{-i\tau A}e^{-i\tau B}$ in place of $e^{-i\tau(A+B)}$. If $A$ and $B$ commute, that substitution is exact. Otherwise, differentiating the product exposes a conjugated $B$. The difference from $B$ is an integral of conjugates of $[A,B]$, of norm at most $|\tau|\|[A,B]\|$. Integrating once more bounds the error per step by $\tau^2\|[A,B]\|/2$.

### Sum errors without amplifying them

To compare $r$ exact steps to $r$ product steps, replace one step at a time. Since all the steps are unitary, the norm of each replacement error is unchanged by the other factors. The total is at most $r$ times the local bound. Thus choosing $r\ge t^2\|[A,B]\|/(2\epsilon)$ with $r\ge1$ suffices for operator-norm error $\epsilon$.

With many terms, a step applies each implementable term evolution and the error depends on their commutators and ordering. Gate synthesis adds another budget, and estimating a measured output adds a sampling budget. A sparse or local classical description is useful when it makes term evolution and those costs explicit.`,
      example: String.raw`### Budget a noncommuting pair

For $A=X$, $B=Z$, the commutator has norm 2. At $t=1$ and target error $0.01$, the bound gives $r=100$, or 200 term exponentials. Doubling $t$ increases this bound on $r$ by a factor of four. This is a sufficient budget for the chosen formula. On a single qubit one can instead exponentiate the full matrix directly.`,
      exercise: String.raw`**Compare two decompositions.** Replace $B=Z$ by $B=0.1Z$. How does the guaranteed step count change at fixed time and tolerance? What if $B=Z\otimes I$ and $A=I\otimes X$?

**Check.** The commutator norm falls by a factor of ten in the first case. In the second case the terms commute because they act on separate qubits, so the first-order splitting is exact.`
    }
  ]
);

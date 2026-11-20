import type { Lecture, PaperReference } from './curriculum';
import { lessonContent } from './curriculumLesson';
import { PROOFS_REFERENCE } from './proofLessons';

const QUANTUM_STATES: PaperReference = {
  title: 'Foundations II: Measurement and evolution',
  authors: 'John Preskill',
  citation: 'Caltech quantum computation lecture notes, chapter 2',
  sourceUrl: 'https://www.preskill.caltech.edu/ph219/chap2_15.pdf',
  relevantSections: 'States, measurement, ensembles, and bipartite systems'
};

const STABILIZERS: PaperReference = {
  title: 'Stabilizer codes and quantum error correction',
  authors: 'Daniel Gottesman',
  citation: 'PhD thesis, Caltech (1997)',
  arxivUrl: 'https://arxiv.org/abs/quant-ph/9705052',
  relevantSections: 'Stabilizer formalism and fault-tolerant computation'
};

type Revision = Pick<Lecture, 'question' | 'content' | 'durationMinutes'> &
  Partial<Pick<Lecture, 'title' | 'paperReferences' | 'theoreticalCitations' | 'softLinks'>>;

// Keep existing lecture IDs and publish the revised reader content as edition 5.
export const CURRICULUM_REVISIONS: Partial<Record<string, Revision>> = {
  'L01-sets-maps-proofs': {
    title: 'Sets, Maps, and Inverses',
    question: 'Exactly when does a function have an inverse?',
    durationMinutes: 35,
    paperReferences: [PROOFS_REFERENCE],
    theoreticalCitations: [
      {
        formulaName: 'Two-sided inverse',
        expression: String.raw`f\text{ is bijective }\iff\exists\, h:B\to A,\quad h\circ f=\operatorname{id}_A,\quad f\circ h=\operatorname{id}_B`,
        source: PROOFS_REFERENCE.title,
        theoremOrEquation: 'The inverse criterion for a function between sets',
        doiOrUrl: PROOFS_REFERENCE.sourceUrl
      }
    ],
    softLinks: [
      {
        targetId: 'L69-quantifiers-counterexamples',
        relationship: 'Practice writing and negating quantified claims.'
      }
    ],
    content: lessonContent(
      'Identify the domain, codomain, and image of a map, then prove the inverse criterion in both directions.',
      String.raw`### A map has a domain and a codomain

A set records which elements belong to it. The product $A\times B$ contains ordered pairs $(a,b)$. A function $f:A\to B$ assigns exactly one $b\in B$ to each $a\in A$. Its image $f(A)$ is the subset of $B$ attained by the rule.

The map is injective if $f(a)=f(a')$ implies $a=a'$. It is surjective if every $b\in B$ has a preimage. An injective map answers “at most one” and a surjective map answers “at least one.” A bijection answers both.

### Inverses and composition

For $f:A\to B$ and $g:B\to C$, $(g\circ f)(a)=g(f(a))$. A two-sided inverse $h:B\to A$ satisfies $h\circ f=\operatorname{id}_A$ and $f\circ h=\operatorname{id}_B$.

**Theorem.** The map $f$ has a two-sided inverse exactly when it is bijective.

**Forward direction.** Suppose $h$ is an inverse. If $f(a)=f(a')$, apply $h$ to both sides to get $a=a'$. For any $b\in B$, choose $a=h(b)$. Then $f(a)=b$. This proves both injectivity and surjectivity.

**Reverse direction.** Suppose $f$ is bijective. For each $b\in B$, surjectivity supplies an $a$ with $f(a)=b$ and injectivity makes it unique. Define $h(b)$ to be that $a$. Then $f(h(b))=b$ by definition. The unique preimage of $f(a)$ is $a$, so $h(f(a))=a$ as well. Any inverse must choose this same unique preimage.`,
      String.raw`### Change the codomain and test the claim

Let $f:\mathbb Z\to\mathbb Z$ send $n$ to $2n$. Equality of outputs gives $2n=2m$, hence $n=m$. But $1$ has no preimage, so $f$ has no two-sided inverse. With codomain $2\mathbb Z$, each element is even and each has exactly one preimage, so the inverse is $k\mapsto k/2$.

The map $g:\mathbb R\to[0,\infty)$ with $g(x)=x^2$ illustrates the other failure. Every $y\ge0$ has a square root, but $g(-1)=g(1)$. Restricting the domain to $[0,\infty)$ gives a bijection.`,
      String.raw`**Prove a one-sided claim.** If $g\circ f$ is surjective, must $g$ be surjective? Must $f$ be surjective?

**Check.** Every $c$ equals $g(f(a))$ for some $a$, so $g$ is surjective. For a counterexample about $f$, include the even integers into $\mathbb Z$ and compose with $g(n)=0$ from $\mathbb Z$ to $\{0\}$.

Continue with [quantifiers and counterexamples](/topics/mathematical-proofs/L69-quantifiers-counterexamples) to learn how to systematically find these proof obligations.`
    )
  },
  'L10-one-qubit-states-measurement': {
    title: 'Qubit States and the Born Rule',
    question: 'How does a change of measurement basis turn relative phase into a probability?',
    durationMinutes: 35,
    paperReferences: [QUANTUM_STATES],
    theoreticalCitations: [
      {
        formulaName: 'Born rule in an orthonormal basis',
        expression: String.raw`\Pr(j)=|\langle u_j|\psi\rangle|^2`,
        source: QUANTUM_STATES.title,
        theoremOrEquation: 'Rank-one projective measurement',
        doiOrUrl: QUANTUM_STATES.sourceUrl
      }
    ],
    content: lessonContent(
      'Use the Born rule in two bases to distinguish states whose computational-basis measurements look identical.',
      String.raw`### Normalize the amplitudes

A pure qubit state is $a|0\rangle+b|1\rangle$ with complex amplitudes and $|a|^2+|b|^2=1$. Multiplying both amplitudes by the same phase leaves all measurement probabilities unchanged. Changing one amplitude relative to the other can change the probabilities in another basis.

### Project onto the outcome state

For an orthonormal measurement basis $\{|u_0\rangle,|u_1\rangle\}$, outcome $j$ has probability $|\langle u_j|\psi\rangle|^2$. With ideal projective measurement, after a nonzero-probability outcome the conditional state lies in the selected basis direction.

In the computational basis, the probabilities are $|a|^2$ and $|b|^2$. In the basis $|\pm\rangle=(|0\rangle\pm|1\rangle)/\sqrt2$, the probabilities are $|a+b|^2/2$ and $|a-b|^2/2$. Each includes an interference term with opposite sign.`,
      String.raw`### Read the sign of a relative phase

The state $(|0\rangle-|1\rangle)/\sqrt2$ gives equal probabilities in the computational basis. It gives the $-$ outcome with probability 1 in the $\{+,-\}$ basis. The state with a plus sign produces the other outcome with probability 1 in that basis. Applying $H$ before computational measurement implements this basis change because $H|+\rangle=|0\rangle$ and $H|-\rangle=|1\rangle$.`,
      String.raw`**Check a quarter-cycle phase.** What probabilities does $(|0\rangle+i|1\rangle)/\sqrt2$ give in the computational and $\{+,-\}$ bases?

**Check.** Both bases give probabilities $1/2,1/2$. In the second basis, $|1+i|^2=|1-i|^2=2$. A different measurement basis can distinguish this state from its complex conjugate.`
    )
  },
  'L11-unitary-operators-quantum-gates': {
    title: 'Unitary Gates and Composition',
    question: 'What does a unitary preserve, and why does the order of gates matter?',
    durationMinutes: 35,
    paperReferences: [QUANTUM_STATES],
    theoreticalCitations: [
      {
        formulaName: 'Inner-product preservation',
        expression: String.raw`U^\dagger U=I\quad\Longrightarrow\quad \langle Uv|Uw\rangle=\langle v|w\rangle`,
        source: QUANTUM_STATES.title,
        theoremOrEquation: 'Unitary evolution of a finite-dimensional quantum system',
        doiOrUrl: QUANTUM_STATES.sourceUrl
      }
    ],
    content: lessonContent(
      'Gate matrices move amplitudes and relative phases. Follow the state through each gate to see what the eventual measurement can detect.',
      String.raw`### Orthonormal columns preserve inner products

A square complex matrix $U$ is unitary when $U^\dagger U=I$. Its columns are an orthonormal basis. For any vectors $v,w$, $(Uv)^\dagger(Uw)=v^\dagger w$. In particular a normalized state stays normalized, and $U^\dagger$ reverses the operation.

### Use X, Z, and H as state transformations

$X$ swaps $|0\rangle$ and $|1\rangle$. $Z$ leaves $|0\rangle$ fixed and multiplies $|1\rangle$ by $-1$. The Hadamard $H$ sends $|0\rangle\mapsto|+\rangle$ and $|1\rangle\mapsto|-\rangle$. These two images are orthonormal, and $H^2=I$.

In a circuit that applies $U$ and then $V$, the state is $V(U|\psi\rangle)$, so the matrix product is $VU$. Track the intermediate state before simplifying a product.`,
      String.raw`### Convert a phase into a detectable bit

Starting with $|0\rangle$, apply $H$, then $Z$, then $H$. The path is $|0\rangle\to|+\rangle\to|-\rangle\to|1\rangle$. Starting with $|1\rangle$ gives the reverse output, so $HZH=X$ as operators. The first $H$ creates a superposition, and the last converts the relative sign introduced by $Z$ into a deterministic output.`,
      String.raw`**Reverse two gates.** Compare $ZH|0\rangle$ and $HZ|0\rangle$. Can a computational-basis measurement distinguish the outputs? Which basis can?

**Check.** They are $|-\rangle$ and $|+\rangle$. Computational measurement gives equal probabilities for each state, but applying another $H$ and measuring separates them.`
    )
  },
  'L12-multi-qubit-systems-entanglement': {
    title: 'Tensor Products and Bell States',
    question: 'How do you tell whether a two-qubit pure state factors?',
    durationMinutes: 40,
    paperReferences: [QUANTUM_STATES],
    theoreticalCitations: [
      {
        formulaName: 'Dimension of a tensor product',
        expression: String.raw`\dim(\mathcal H_A\otimes\mathcal H_B)=\dim(\mathcal H_A)\,\dim(\mathcal H_B)`,
        source: QUANTUM_STATES.title,
        theoremOrEquation: 'Tensor-product Hilbert space of two subsystems',
        doiOrUrl: QUANTUM_STATES.sourceUrl
      }
    ],
    content: lessonContent(
      'The two-qubit coefficient table makes separability testable and explains why a Bell state cannot be built with separate single-qubit gates.',
      String.raw`### Expand products in a fixed basis order

Use $|00\rangle,|01\rangle,|10\rangle,|11\rangle$, with the first bit denoting the first qubit. The product $(a|0\rangle+b|1\rangle)\otimes(c|0\rangle+d|1\rangle)$ has coefficient table

$$
M=\begin{pmatrix}ac&ad\\bc&bd\end{pmatrix}.
$$

The first index is the row, and the second is the column. Any product state gives a rank-one table. Conversely, a nonzero two-by-two rank-one table can be written as a column times a row, which supplies the two state factors. Thus $\det M=0$ is the product-state test for a normalized pure state of two qubits.

### Build a Bell state

The controlled-NOT with the first qubit as control sends $|ij\rangle\mapsto|i,\,j\oplus i\rangle$. Apply it to $(|00\rangle+|10\rangle)/\sqrt2$. The result is $|\Phi^+\rangle=(|00\rangle+|11\rangle)/\sqrt2$. Its table is $I/\sqrt2$, with determinant $1/2$, so it is entangled. Independent local unitary gates preserve the rank because they multiply the table by invertible matrices on the left and right.`,
      String.raw`### Compute what the two detectors see

Computational-basis measurement of $|\Phi^+\rangle$ gives 00 and 11 with equal probability. Either detector alone sees a fair bit, while the pair always agrees. The classical mixture of $|00\rangle$ and $|11\rangle$ also has those statistics in this basis. The next lecture uses density matrices and a second measurement basis to distinguish them.`,
      String.raw`**Test a superposition.** Is $(|00\rangle+|01\rangle+|10\rangle-|11\rangle)/2$ a product state?

**Check.** Its coefficient table is $\tfrac12\begin{pmatrix}1&1\\1&-1\end{pmatrix}$, whose determinant is $-1/2$. Computational measurement produces four equally likely outcomes even though the state is entangled.`
    )
  },
  'L13-density-matrices-mixed-states': {
    title: 'Density Matrices and Partial Trace',
    question: 'How can a globally pure state have mixed subsystems?',
    durationMinutes: 45,
    paperReferences: [QUANTUM_STATES],
    theoreticalCitations: [
      {
        formulaName: 'Partial trace on computational basis operators',
        expression: String.raw`\operatorname{Tr}_B(|ij\rangle\langle k\ell|)=\delta_{j\ell}|i\rangle\langle k|`,
        source: QUANTUM_STATES.title,
        theoremOrEquation: 'Reduced density operator on subsystem A',
        doiOrUrl: QUANTUM_STATES.sourceUrl
      }
    ],
    content: lessonContent(
      'Density operators describe coherent superpositions, classical mixtures, and subsystem statistics in the same language.',
      String.raw`### Compare coherent and incoherent preparations

A pure state has $\rho=|\psi\rangle\langle\psi|$. A preparation that samples pure states with probabilities $p_i$ has $\rho=\sum_i p_i|\psi_i\rangle\langle\psi_i|$. The operator is positive semidefinite and has trace 1. A measurement with effect $E$ has probability $\operatorname{Tr}(E\rho)$. Two preparations with the same density operator give the same probabilities for all measurements on that system.

For $\rho_\Phi=|\Phi^+\rangle\langle\Phi^+|$, the cross terms $|00\rangle\langle11|/2$ and its adjoint encode coherence. The equal classical mixture of $|00\rangle$ and $|11\rangle$ has the same diagonal terms without those cross terms.

### Trace out the subsystem you cannot measure

For basis operators, $\operatorname{Tr}_B(|ij\rangle\langle k\ell|)=\delta_{j\ell}|i\rangle\langle k|$. This gives the unique $\rho_A$ that reproduces expectations of $E_A\otimes I_B$ via $\operatorname{Tr}(E_A\rho_A)$. In the Bell state the cross terms vanish under the partial trace, leaving $\rho_A=I/2$. The global state is pure with $\operatorname{Tr}(\rho_\Phi^2)=1$ and the reduced state has $\operatorname{Tr}(\rho_A^2)=1/2$.`,
      String.raw`### Distinguish the preparations with a joint measurement

$X\otimes X$ swaps $|00\rangle$ and $|11\rangle$. The Bell vector is a $+1$ eigenstate, so its expectation is 1. In the classical mixture, each basis vector is mapped to a perpendicular vector, giving expectation 0. The marginal density matrices agree, so the distinction requires access to correlations.`,
      String.raw`**Compute a partial trace.** For $|\psi\rangle=\sqrt{3/4}|00\rangle+\sqrt{1/4}|11\rangle$, find the reduced density matrix on the first qubit and its purity.

**Check.** The reduced state is $\operatorname{diag}(3/4,1/4)$. Its purity is $9/16+1/16=5/8$. The off-diagonal terms of the global density operator disappear when tracing out the second qubit.`
    )
  },
  'L23-symplectic-clifford-isomorphism': {
    title: 'The Clifford-to-symplectic map',
    question: 'Which information does a symplectic matrix keep about a Clifford operator?',
    durationMinutes: 45,
    paperReferences: [STABILIZERS],
    theoreticalCitations: [
      {
        formulaName: 'Clifford quotient by Pauli operators',
        expression: String.raw`\overline{\mathcal C}_n/\overline{\mathcal P}_n\cong\operatorname{Sp}(2n,\mathbb F_2)`,
        source: STABILIZERS.title,
        theoremOrEquation: 'The action of Clifford conjugation on Pauli labels modulo phase',
        doiOrUrl: STABILIZERS.arxivUrl
      }
    ],
    content: lessonContent(
      'A binary symplectic matrix describes how a Clifford permutes Pauli labels. Recovering the signed action requires additional information.',
      String.raw`### Forget overall phases and conjugation signs separately

Let $\overline{\mathcal C}_n$ denote the Clifford group modulo global phase, and $\overline{\mathcal P}_n$ the Pauli group modulo its phases. Each Clifford sends a Pauli to another Pauli by conjugation. Forget the phase of the output to obtain a linear map on labels $(x\mid z)\in\mathbb F_2^{2n}$. Products of Paulis add labels, and composition of Clifford actions multiplies the label matrices. Conjugation preserves commutation, so the label matrix is symplectic.

### Identify the kernel

A Pauli conjugation changes only signs, so every projective Pauli lies in the kernel. Conversely, a Clifford in the kernel sends each generator $X_i$ and $Z_i$ to itself with a sign. Multiplying by a suitable Pauli cancels all signs: $Z_i$ flips the sign of $X_i$ and $X_i$ flips the sign of $Z_i$. The resulting operator commutes with every $Z_i$, hence is diagonal in the computational basis, and commutes with every $X_i$, hence all its diagonal entries agree. It is a scalar. This proves the kernel is exactly $\overline{\mathcal P}_n$.

The map is onto because the binary actions of $H$, $S$, and CNOT generate the symplectic group. The resulting isomorphism is between the **quotient** by projective Paulis and the symplectic group. For synthesis, first match the symplectic map. Then match generator signs with a Pauli correction if the full conjugation action is required.`,
      String.raw`### Compute the label matrix of H

Write one-qubit labels as columns $(x,z)^{\mathsf T}$. Since $HXH=Z$ and $HZH=X$, the matrix of $H$ has columns $(0,1)$ and $(1,0)$. The Clifford $ZH$ has the same matrix. Its action on $Z$ is $ZXZ=-X$, so the two operators have different signed actions.`,
      String.raw`**Find a kernel element.** Compute the binary action and the two generator signs for the gate $Z$. How could you distinguish it from the identity using the input $|+\rangle$?

**Check.** The binary action is identity, with a minus on $X$ and a plus on $Z$. The input $|+\rangle$ goes to $|-\rangle$, distinguishable in the $X$ basis.`
    )
  },
  'L32-magic-states-pauli-based-computation': {
    title: 'Magic States and T-Gate Injection',
    question: 'How does a prepared ancilla turn a Clifford circuit into a T gate?',
    durationMinutes: 40,
    paperReferences: [
      {
        title: 'Universal quantum computation with ideal Clifford gates and noisy ancillas',
        authors: 'Sergey Bravyi & Alexei Kitaev',
        citation: 'Phys. Rev. A 71, 022316 (2005)',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/0403025',
        relevantSections: 'Gate injection and magic-state distillation with ideal Clifford operations'
      }
    ],
    theoreticalCitations: [
      {
        formulaName: 'Injection correction for outcome 1',
        expression: String.raw`S T^\dagger = T,\qquad T=\operatorname{diag}(1,e^{i\pi/4})`,
        source: 'Diagonal gate matrices',
        theoremOrEquation: 'The Clifford phase gate supplies the branch correction'
      }
    ],
    content: lessonContent(
      'Follow both measurement branches of a T injection gadget and identify which operation needs a non-Clifford resource.',
      String.raw`### Prepare and measure the ancilla

Let $T=\operatorname{diag}(1,e^{i\pi/4})$ and $S=T^2$. Prepare the ancilla $|A\rangle=T|+\rangle$. A $T$ rotation is non-Clifford because it conjugates $X$ to $(X+Y)/\sqrt2$, outside the Pauli group.

With data $a|0\rangle+b|1\rangle$, apply CNOT from data to ancilla, then measure the ancilla in $Z$. If the measurement gives 0, the normalized data state is $a|0\rangle+e^{i\pi/4}b|1\rangle=T|\psi\rangle$. If it gives 1, the state is $e^{i\pi/4}a|0\rangle+b|1\rangle$, equivalent up to global phase to $T^\dagger|\psi\rangle$. Apply $S$ in this branch to get $T|\psi\rangle$. Both branches have probability $1/2$ with the ideal ancilla.

### Count the resource that was consumed

CNOT, the measurement, and the conditional correction are stabilizer operations. The ancilla already carried the non-Clifford phase. Distillation uses several noisy resource states and a code-based acceptance test to produce fewer, higher-fidelity states in a specified noise regime. Its error rate and yield depend on the protocol, state preparation, and reliability of the Clifford operations.`,
      String.raw`### Evaluate the branch before correcting it

Set $a=b=1/\sqrt2$. If the ancilla outcome is 1, remove the common phase $e^{i\pi/4}$. The data vector is $(|0\rangle+e^{-i\pi/4}|1\rangle)/\sqrt2$. Multiplying its second amplitude by $i$ leaves the desired relative phase $e^{i\pi/4}$.`,
      String.raw`**Omit the correction.** Suppose the ancilla outcome is 1. What is the relative phase error between the output and $T|\psi\rangle$? Would a computational-basis histogram of $T|+\rangle$ detect it?

**Check.** The relative factor is $e^{-i\pi/2}=-i$, corresponding to $S^\dagger$. The probabilities in the computational basis are both $1/2$ in either case.`
    )
  },
  'L53-mcmc-covariance-integration': {
    question: 'Which covariance belongs in a posterior error bar, and how does a finite chain affect it?',
    durationMinutes: 45,
    content: lessonContent(
      'Preserve joint draws of commuting observables when you propagate uncertainty to a weighted sum. Then quantify how well those draws estimate the result.',
      String.raw`### Start with the joint measurement

One shot of a commuting measurement group can yield several outcomes together. If $A$ and $B$ are outcomes from that shot, their covariance is $\mathbb E[AB]-\mathbb E[A]\mathbb E[B]$. For $N$ independent shots from a fixed distribution, the variance of the sample mean of $A+B$ is

$$
\operatorname{Var}(\overline{A+B})=\frac{\operatorname{Var}(A)+\operatorname{Var}(B)+2\operatorname{Cov}(A,B)}{N}.
$$

This is a sampling variance conditional on that distribution. It can be estimated from joint shot data. Marginal counts alone do not generally identify the term $\mathbb E[AB]$.

### Propagate the posterior draw by draw

If a model gives a posterior for the joint outcome probabilities, compute $\mu_A$ and $\mu_B$ using the same probability draw. For a target $H=w_A\mu_A+w_B\mu_B$, the posterior variance is $w^{\mathsf T}\Sigma w$, where $\Sigma$ is the posterior covariance of the means. Compute the same quantity by forming $H$ for every draw and taking its variance. This posterior uncertainty is distinct from the shot covariance in the first formula.

### Check the precision of the computation

MCMC draws can be autocorrelated. That affects the Monte Carlo error in posterior summaries, such as the variance of $H$ or its quantiles. Examine chain agreement and effective sample size for the summaries you use. A posterior interval also depends on the likelihood and prior. Neither accounting for covariance nor running a longer chain guarantees frequentist coverage or removes hardware bias.`,
      String.raw`### Keep or lose perfect cancellation

Take two equally weighted toy posterior draws of $(\mu_A,\mu_B)$, $(0.2,-0.2)$ and $(-0.2,0.2)$. Each marginal variance is $0.04$ and the covariance is $-0.04$. The weighted sum with both weights 1 is always zero. Combining the two marginal variances as if they were independent would incorrectly give $0.08$. With weights $(1,-1)$ instead, the result takes values $\pm0.4$, with variance $0.16$.`,
      String.raw`**Design the posterior computation.** You only saved independent posterior draws for $\mu_A$ and $\mu_B$ even though the parameters occur in the same joint measurement model. Can you reconstruct the variance of their sum from those samples?

**Check.** The marginal variances are available, but the joint covariance is missing. Draw the parameters together from the joint model or use a justified analytical covariance calculation.`
    ),
    theoreticalCitations: [
      {
        formulaName: 'Variance of a linear combination',
        expression: String.raw`\operatorname{Var}(w^{\mathsf T}\mu)=w^{\mathsf T}\operatorname{Cov}(\mu)w`,
        source: 'Definition of covariance',
        theoremOrEquation: 'Expand the expected squared centered linear combination'
      }
    ]
  },
  'L54-hardware-noise-systematic-shifts': {
    title: 'Readout Calibration and Error Mitigation',
    question: 'Which systematic errors can you estimate from calibration, and what does mitigation cost?',
    durationMinutes: 45,
    paperReferences: [
      {
        title: 'Error mitigation for short-depth quantum circuits',
        authors: 'Kristan Temme, Sergey Bravyi & Jay M. Gambetta',
        citation: 'Phys. Rev. Lett. 119, 180509 (2017)',
        arxivUrl: 'https://arxiv.org/abs/1612.02058',
        relevantSections: 'Richardson extrapolation for scalable noise'
      },
      {
        title: 'Mitigating measurement errors in multi-qubit experiments',
        authors: 'Sergey Bravyi et al.',
        citation: 'Phys. Rev. A 103, 042605 (2021)',
        arxivUrl: 'https://arxiv.org/abs/2006.14044',
        relevantSections: 'Assignment model and mitigation overhead'
      }
    ],
    theoreticalCitations: [
      {
        formulaName: 'Binary assignment correction',
        expression: String.raw`p(1)=\frac{q(1)-e_0}{1-e_0-e_1}`,
        source: 'Binary assignment model',
        theoremOrEquation: 'Solve the law of total probability for the input distribution'
      }
    ],
    content: lessonContent(
      'Calibrate how the detector reports a bit, then distinguish correction of the readout distribution from mitigation of circuit noise.',
      String.raw`### Estimate both assignment probabilities

For an effective binary readout model, let $e_0=P(\hat 1|0)$ and $e_1=P(\hat 0|1)$. If the true population of $|1\rangle$ is $p$, the reported population is $q=e_0+(1-e_0-e_1)p$. Solve for $p$ using separately calibrated error rates. The slope gets small near $e_0+e_1=1$, where the detector loses information about the state. Inversion amplifies statistical fluctuations by the inverse slope magnitude and can return values outside $[0,1]$ on finite data. Calibration uncertainty and drift affect the estimate too.

### Extrapolate only under a noise-scaling model

Zero-noise extrapolation uses observations at different effective noise scales. If $E(\lambda)=E_0+c\lambda+O(\lambda^2)$, then $2E(1)-E(2)$ cancels the linear term. For independent estimates the variance is $4\operatorname{Var}(\widehat E(1))+\operatorname{Var}(\widehat E(2))$. Folding gates keeps the ideal circuit action and lengthens the implementation. The mapping from length to effective noise scale is an experimental assumption to check.

### Verify a conserved quantity

If an ideal circuit stays in one particle-number sector, check the Hamming weight for an occupation-basis readout. For one qubit per occupation, $N=\sum_j(I-Z_j)/2$. A record in the wrong sector fails the test, while faults that preserve the sector can pass. Report the acceptance rate and the uncertainty of the conditional estimate.`,
      String.raw`### Correct a symmetric readout

If both errors are $0.10$, then $q=0.10+0.80p$. Observing $q=0.70$ gives $p=0.75$. Ignoring calibration uncertainty, an estimated standard error of $0.02$ for $q$ becomes $0.025$ after inversion. See [dispersive readout](/topics/superconducting-qubit-physics/L76-dispersive-readout) for how the assignment probabilities arise in a superconducting device.`,
      String.raw`**Extrapolate two observations.** Let $\widehat E(1)=-0.91$ and $\widehat E(2)=-0.86$, each with independent standard error $0.02$. Find the first-order extrapolate and its standard error.

**Check.** The estimate is $-0.96$ with standard error $\sqrt5(0.02)\approx0.045$. Higher-order residual bias and mismatched noise scaling are outside that standard error.`
    )
  },
  'L57-qec-stabilizer-codes-automorphisms': {
    title: 'Stabilizer Codes and Code Symmetries',
    question: 'When does a symmetry of the checks implement a useful logical gate?',
    durationMinutes: 45,
    paperReferences: [STABILIZERS],
    theoreticalCitations: [
      {
        formulaName: 'Distance of a stabilizer code',
        expression: String.raw`d=\min_{P\in N(S)\setminus S}\operatorname{wt}(P)`,
        source: STABILIZERS.title,
        theoremOrEquation: 'Pauli normalizer and stabilizer interpreted modulo global phase',
        doiOrUrl: STABILIZERS.arxivUrl
      }
    ],
    softLinks: [
      {
        targetId: 'L77-three-qubit-repetition-code',
        relationship: 'Decode a concrete syndrome and calculate its failure probability.'
      },
      {
        targetId: 'L79-css-steane-code',
        relationship: 'Build the Steane checks from explicit binary matrices.'
      }
    ],
    content: lessonContent(
      'Track the code space and the logical Pauli operators separately to decide what a physical symmetry does to encoded information.',
      String.raw`### Define the code by joint eigenvalues

Let $S$ be an abelian group of Hermitian Paulis generated by $r$ independent commuting checks, with $-I\notin S$. The common $+1$ eigenspace of these checks has dimension $2^{n-r}$. A Pauli that anticommutes with a check gives a flipped syndrome. A Pauli that commutes with all checks preserves the code space and may act logically.

Modulo phase, the distance $d$ is the smallest weight of a Pauli commuting with all checks whose label is outside the stabilizer. An ideal code of distance $d$ corrects arbitrary errors supported on at most $\lfloor(d-1)/2\rfloor$ qubits. A repetition code can correct one bit flip despite distance 1 for general Pauli errors: $Z_1$ commutes with both checks and acts as logical $Z$.

### Compute the induced logical action

If $U$ sends the signed stabilizer group to itself by conjugation, it maps the code space to itself. Track how $U$ conjugates chosen logical $X$ and $Z$ modulo stabilizers. A permutation can swap checks and still act as identity on encoded information.

A transversal single-block gate is a product of gates applied independently to physical qubits. A preexisting error on one qubit stays on that qubit under conjugation. A check-preserving unitary need not have this property. Fault tolerance for a complete operation also depends on how the operation is implemented and how errors are corrected.`,
      String.raw`### Compare two code symmetries

Reflecting the repetition code swaps its two $Z$ checks and exchanges qubits 1 and 3. It fixes both $|000\rangle$ and $|111\rangle$, so its logical action is identity.

In the seven-qubit Steane code, the $X$ checks and $Z$ checks have identical support patterns. Applying $H$ to every qubit swaps each $X$ check with the corresponding $Z$ check. It also swaps $X^{\otimes7}$ and $Z^{\otimes7}$, which are anticommuting representatives of the logical $X$ and $Z$. This implements a logical Hadamard and is transversal.`,
      String.raw`**Check the sign convention.** On the three-qubit repetition code, conjugate $ZZI$ and $IZZ$ by $X_1$. Does $X_1$ stabilize the code space?

**Check.** The first check becomes $-ZZI$ and the second stays $IZZ$. The operation preserves their unsigned supports but flips the first eigenvalue. It maps the code space into an error sector.`
    )
  },
  'L60-qudit-algebra-mixed-dimension-registers': {
    title: 'Qudit Shift and Clock Operators',
    question: 'How do shift, phase, and commutation change with the local dimension?',
    durationMinutes: 40,
    paperReferences: [
      {
        title:
          'Stabilizer states and Clifford operations for systems of arbitrary dimensions, and modular arithmetic',
        authors: 'Erik Hostens, Jeroen Dehaene & Bart De Moor',
        citation: 'Phys. Rev. A 71, 042315 (2005)',
        arxivUrl: 'https://arxiv.org/abs/quant-ph/0408190',
        relevantSections: 'Generalized Pauli and Clifford operations over modular labels'
      }
    ],
    theoreticalCitations: [
      {
        formulaName: 'Clock and shift commutation',
        expression: String.raw`Z^b X^a = \omega^{ab} X^a Z^b,\qquad \omega=e^{2\pi i/d}`,
        source: 'Hostens, Dehaene & De Moor (2005)',
        theoremOrEquation: 'Generalized Pauli labels with the phase operator written on the left',
        doiOrUrl: 'https://arxiv.org/abs/quant-ph/0408190'
      }
    ],
    content: lessonContent(
      'Use modular labels to calculate qudit Pauli phases and determine which qubit arguments require a prime local dimension.',
      String.raw`### Write the operators on basis states

In dimension $d$, define $X|j\rangle=|j+1\bmod d\rangle$ and $Z|j\rangle=\omega^j|j\rangle$ for $\omega=e^{2\pi i/d}$. Applying $ZX$ to $|j\rangle$ gives $\omega^{j+1}|j+1\bmod d\rangle$, whereas $XZ$ gives $\omega^j|j+1\bmod d\rangle$. Thus $ZX=\omega XZ$. Powers obey $Z^bX^a=\omega^{ab}X^aZ^b$.

In a mixed register with local dimensions $d_i$, each site's labels have their own modulus. For multi-site products the commutation phases multiply. A qutrit and a four-level site together have 12 basis states labeled by pairs.

### Know which labels form a field

For prime $d=p$, the labels use the field $\mathbb F_p$. The Clifford action on labels preserves the symplectic form. Passing to label matrices forgets conjugation phases. As with qubits, the quotient of the projective Clifford group by projective Pauli operators gives $\operatorname{Sp}(2n,\mathbb F_p)$ on $n$ sites of the same prime dimension.

For composite $d$, $\mathbb Z_d$ is a ring with zero divisors. Elimination steps that divide by every nonzero coefficient no longer apply. Choose the modular description and the phase convention together when implementing qudit Clifford gates.`,
      String.raw`### Follow a shift by two

In dimension 3, repeated $X^2$ cycles through $0,2,1,0$. In dimension 4, it cycles through $0,2,0$, and starting at 1 gives a separate orbit $1,3,1$. Multiplication by 2 is invertible modulo 3 and fails to be invertible modulo 4. The shift itself is invertible in both dimensions because it adds 2.`,
      String.raw`**Compute a phase in dimension 4.** How does $ZX^2$ compare to $X^2Z$? What about $Z^2 X^2$ and $X^2 Z^2$?

**Check.** With $\omega=i$, commuting $Z$ past $X^2$ gives $i^2=-1$. Commuting $Z^2$ past $X^2$ gives $i^4=1$.`
    )
  }
};

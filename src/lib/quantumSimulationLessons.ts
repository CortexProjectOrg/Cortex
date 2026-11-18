import type { Lecture, PaperReference, TheoreticalCitation, Topic } from './curriculum';

const channels: PaperReference = {
  title: 'Quantum Information, Chapter 3: Measurement and Evolution',
  authors: 'John Preskill',
  citation: 'Caltech Ph219/CS219 lecture notes, updated October 2018',
  sourceUrl: 'https://www.preskill.caltech.edu/ph219/chap3_15.pdf',
  relevantSections: '3.2 Quantum channels; 3.4 Three quantum channels; 3.5 Master equations'
};
const states: PaperReference = {
  title: 'Quantum Information and Computation, Chapter 2: States and Ensembles',
  authors: 'John Preskill',
  citation: 'Caltech Ph219/CS219 lecture notes, updated July 2015',
  sourceUrl: 'https://www.preskill.caltech.edu/ph219/chap2_13.pdf',
  relevantSections: '2.3 The density operator; 2.4 Schmidt decomposition'
};
const mps: PaperReference = {
  title: 'The density-matrix renormalization group in the age of matrix product states',
  authors: 'Ulrich Schollwöck',
  citation: 'Annals of Physics 326, 96–192 (2011)',
  arxivUrl: 'https://arxiv.org/abs/1008.3477',
  doi: '10.1016/j.aop.2010.09.012',
  relevantSections: 'Matrix product states, canonical forms, compression, and variational optimization'
};

type NewLesson = Pick<
  Lecture,
  'id' | 'title' | 'question' | 'prerequisites' | 'durationMinutes' | 'content'
> & {
  reference: PaperReference;
  formula: Pick<TheoreticalCitation, 'formulaName' | 'expression' | 'theoremOrEquation'>;
};

const lessons: NewLesson[] = [
  {
    id: 'L61-quantum-channels-kraus',
    title: 'Quantum channels and Kraus operators',
    question: 'How can a quantum evolution be physical even when it is not unitary?',
    durationMinutes: 35,
    prerequisites: ['L13-density-matrices-mixed-states', 'L05-linear-maps-matrices'],
    reference: channels,
    formula: {
      formulaName: 'Trace-preserving operator-sum representation',
      expression: String.raw`\mathcal E(\rho)=\sum_k K_k\rho K_k^\dagger,\qquad\sum_k K_k^\dagger K_k=I`,
      theoremOrEquation: 'Chapter 3, §3.2.1: operator-sum representation'
    },
    content: {
      motivation:
        'A simulator that only multiplies state vectors by unitary matrices cannot describe discarded measurement outcomes, relaxation, or a system coupled to an unobserved environment. Quantum channels provide one common language for these processes.',
      theory: String.raw`### From a larger unitary to an open system
Let a system start in $\rho$ and an independent environment in $|0\rangle\langle0|$. Apply a joint unitary $U$ and discard the environment:
$$\mathcal E(\rho)=\operatorname{Tr}_E[U(\rho\otimes|0\rangle\langle0|)U^\dagger].$$
In an orthonormal environment basis, define $K_k=\langle k|U|0\rangle$. Expanding the partial trace yields $\mathcal E(\rho)=\sum_kK_k\rho K_k^\dagger$. The system and environment need not remain independent after the interaction. An initially correlated system–environment state requires more care and need not define one channel on every possible system input.

### The completeness check
Cyclicity of the trace gives $\operatorname{Tr}\mathcal E(\rho)=\operatorname{Tr}(\rho\sum_kK_k^\dagger K_k)$. Therefore $\sum_kK_k^\dagger K_k=I$ guarantees trace preservation for every input. Each summand is positive when $\rho$ is positive. More strongly, the same construction remains positive when an arbitrary identity channel acts on an untouched ancillary system. This is **complete positivity**, a stronger condition than positivity on isolated inputs.

### Measurement versus forgetting an outcome
For outcome $k$, the probability is $p_k=\operatorname{Tr}(K_k\rho K_k^\dagger)$. If $p_k>0$, the conditional state is $K_k\rho K_k^\dagger/p_k$. Forgetting the outcome gives the sum over $k$, not one normalized branch. The conditional map includes state-dependent normalization and is generally nonlinear; the averaged channel is linear.

### Simulation checks
A density matrix on $n$ qubits has $4^n$ complex entries, compared with $2^n$ amplitudes for a pure state. Test trace, Hermiticity, and positivity after a channel step. Do not repair a large negative eigenvalue by silently clipping it: first check the Kraus completeness relation and the implementation. Different Kraus lists can represent the same averaged channel, so their labels are not unique physical events without a specified measurement model.`,
      workedExample: String.raw`A computational-basis measurement with its outcome discarded has $K_0=|0\rangle\langle0|$ and $K_1=|1\rangle\langle1|$. For $\rho=|+\rangle\langle+|=\tfrac12\begin{pmatrix}1&1\\1&1\end{pmatrix}$,
$$\mathcal E(\rho)=\tfrac12\begin{pmatrix}1&0\\0&1\end{pmatrix}.$$
The trace remains one, but purity drops from one to $1/2$. If outcome zero is retained instead, its probability is $1/2$ and the normalized state is $|0\rangle\langle0|$. These are two different questions about the same measurement.`,
      codeWalkthrough: '',
      exercise: String.raw`1. Verify completeness for $K_0=\sqrt{1-p}\,I$, $K_1=\sqrt p\,Z$, with $0\le p\le1$.
2. Apply this channel to a general $\begin{pmatrix}a&c\\c^*&1-a\end{pmatrix}$.
3. Show explicitly that composing two Kraus channels gives Kraus operators $L_jK_k$ in that order.
4. Write a two-by-two matrix implementation and test the identity channel, a pure input, and the maximally mixed input.`,
      reflectionPrompts: [
        'Why is positivity on an isolated qubit not enough?',
        'What information is lost when an outcome is discarded?'
      ]
    }
  },
  {
    id: 'L62-quantum-noise-channels',
    title: 'Quantum noise: dephasing and amplitude damping',
    question: 'How do loss of phase coherence and loss of excitation differ?',
    durationMinutes: 40,
    prerequisites: ['L61-quantum-channels-kraus', 'L10-one-qubit-states-measurement'],
    reference: channels,
    formula: {
      formulaName: 'Amplitude-damping Kraus operators',
      expression: String.raw`K_0=\begin{pmatrix}1&0\\0&\sqrt{1-\gamma}\end{pmatrix},\quad K_1=\begin{pmatrix}0&\sqrt\gamma\\0&0\end{pmatrix}`,
      theoremOrEquation: 'Chapter 3, §3.4.3: amplitude-damping channel'
    },
    content: {
      motivation:
        'Two noise processes can produce similar-looking reductions in purity while changing observables differently. Distinguishing populations from coherences makes a noise model testable and prevents incorrect comparisons between simulators.',
      theory: String.raw`### Fix the parameter convention
Write $\rho=\begin{pmatrix}1-q&c\\c^*&q\end{pmatrix}$, where $q$ is the excited-state population. A phase-flip channel $(1-p)\rho+pZ\rho Z$ leaves $q$ unchanged and multiplies $c$ by $1-2p$. Complete dephasing occurs at $p=1/2$; at $p=1$ the operation is the deterministic unitary $Z$, not stronger irreversible dephasing.

An alternative dephasing-strength convention is $\mathcal D_\lambda(\rho)=(1-\lambda)\rho+\lambda\operatorname{diag}(\rho)$ with $0\le\lambda\le1$. It multiplies coherence by $1-\lambda$. State the convention whenever comparing noise parameters.

### Relaxation toward the ground state
Amplitude damping uses
$$K_0=\begin{pmatrix}1&0\\0&\sqrt{1-\gamma}\end{pmatrix},\qquad K_1=\begin{pmatrix}0&\sqrt\gamma\\0&0\end{pmatrix},$$
with $0\le\gamma\le1$. Direct multiplication gives
$$\mathcal A_\gamma(\rho)=\begin{pmatrix}1-(1-\gamma)q&\sqrt{1-\gamma}\,c\\\sqrt{1-\gamma}\,c^*&(1-\gamma)q\end{pmatrix}.$$
Thus relaxation changes populations and coherence. It does not leave the maximally mixed state fixed: it is non-unital.

### A geometric reading
For $\rho=(I+xX+yY+zZ)/2$, amplitude damping sends $(x,y,z)$ to $(\sqrt{1-\gamma}x,\sqrt{1-\gamma}y,(1-\gamma)z+\gamma)$. Transverse coordinates contract while the center shifts toward $|0\rangle$. The visualization uses the $x$–$z$ plane and the initial state $|+\rangle$; it is a cross-section, not the entire Bloch sphere.

### What purity does and does not tell you
Purity is $(1+x^2+y^2+z^2)/2$. It need not decrease throughout relaxation: the final ground state is pure. For a time-homogeneous decay model, $\gamma(t)=1-e^{-t/T_1}$. This relation is a model assumption, not a definition of every experimental noise process.`,
      workedExample: String.raw`For an initial $|+\rangle$ and $\gamma=3/4$, the output is $\begin{pmatrix}7/8&1/4\\1/4&1/8\end{pmatrix}$. The ground and excited populations are $7/8$ and $1/8$, while the Bloch vector is $(1/2,0,3/4)$. Purity is $(1+1/4+9/16)/2=29/32$. By contrast, complete dephasing of the same input gives $I/2$ with unchanged populations and purity $1/2$.`,
      codeWalkthrough: '',
      exercise: String.raw`1. Verify Kraus completeness for amplitude damping.
2. Show that two damping steps with parameters $\gamma_1,\gamma_2$ combine into $1-(1-\gamma_1)(1-\gamma_2)$.
3. Calculate the output of $I/2$ and explain non-unitality.
4. Use the visual to locate the minimum purity for damped $|+\rangle$, then derive its parameter analytically.`,
      reflectionPrompts: [
        'Why can dissipative evolution end in a pure state?',
        'Which measurement distinguishes dephasing from relaxation?'
      ]
    }
  },
  {
    id: 'L63-lindblad-quantum-dynamics',
    title: 'Lindblad dynamics for open quantum systems',
    question: 'Which continuous-time equations preserve physical density matrices?',
    durationMinutes: 50,
    prerequisites: [
      'L61-quantum-channels-kraus',
      'L62-quantum-noise-channels',
      'L37-many-body-hamiltonians-models'
    ],
    reference: {
      title: 'On the generators of quantum dynamical semigroups',
      authors: 'Göran Lindblad',
      citation: 'Communications in Mathematical Physics 48, 119–130 (1976)',
      doi: '10.1007/BF01608499',
      sourceUrl: 'https://doi.org/10.1007/BF01608499',
      relevantSections: 'Bounded generators of completely positive dynamical semigroups'
    },
    formula: {
      formulaName: 'Finite-dimensional Lindblad generator',
      expression: String.raw`\dot\rho=-i[H,\rho]+\sum_j\left(L_j\rho L_j^\dagger-\tfrac12\{L_j^\dagger L_j,\rho\}\right)`,
      theoremOrEquation:
        'Generator of a time-homogeneous completely positive trace-preserving semigroup; units ℏ = 1'
    },
    content: {
      motivation:
        'A discrete noise channel describes one step. To simulate a continuously damped system, we need an equation for the rate of change and an integrator whose numerical errors can be separated from physical dissipation.',
      theory: String.raw`### Generator and assumptions
In a finite-dimensional, time-homogeneous Markov model, $\mathcal E_t=e^{t\mathcal L}$ forms a completely positive trace-preserving semigroup: $\mathcal E_{t+s}=\mathcal E_t\mathcal E_s$. Its generator can be written, with $\hbar=1$,
$$\dot\rho=\mathcal L(\rho)=-i[H,\rho]+\sum_j\left(L_j\rho L_j^\dagger-\tfrac12L_j^\dagger L_j\rho-\tfrac12\rho L_j^\dagger L_j\right).$$
Here a dot is the time derivative, $H=H^\dagger$ generates coherent evolution, and each $L_j$ includes the square root of its nonnegative rate. The anticommutator notation is $\{A,B\}=AB+BA$. Arbitrary memory effects are outside this semigroup assumption.

### Why the trace is constant
The trace of a commutator vanishes. For each dissipative term, cyclicity gives $\operatorname{Tr}(L_j\rho L_j^\dagger)=\operatorname{Tr}(L_j^\dagger L_j\rho)$, which cancels the two half terms. The generator also preserves Hermiticity. The Lindblad structure gives complete positivity for the exact evolution; trace preservation alone would not establish that property.

### Decaying qubit
Take $H=0$ and $L=\sqrt\kappa|0\rangle\langle1|$. The equations reduce to $\dot\rho_{11}=-\kappa\rho_{11}$ and $\dot\rho_{01}=-(\kappa/2)\rho_{01}$. Solving $\dot q=-\kappa q$ gives $q(t)=q(0)e^{-\kappa t}$. Coherence decays at half this rate in this model with no additional dephasing. The exact solution is the amplitude-damping channel with $\gamma=1-e^{-\kappa t}$.

### Discretization is a separate approximation
Forward Euler, $\rho_{m+1}=\rho_m+\Delta t\,\mathcal L(\rho_m)$, preserves trace algebraically but need not preserve positivity. Even small time steps do not turn it into an exact quantum channel on all inputs. Compare against an exact soluble model, reduce the step size, inspect the smallest eigenvalue, and distinguish integrator error from the model's validity. Dense Liouvillian matrices scale as $d^2\times d^2$; applying $\mathcal L$ without materializing that matrix can save memory.`,
      workedExample: String.raw`Start from $|1\rangle$ with $\kappa=2$ in inverse time units. At $t=(\log2)/2$, the populations are both $1/2$. A single Euler step with $\Delta t=0.6$ instead produces $q=1-2(0.6)=-0.2$, an impossible probability, even though the trace is still one. Exact channel stepping gives $q=e^{-1.2}>0$.`,
      codeWalkthrough: '',
      exercise: String.raw`1. Derive the four matrix-entry equations for the decaying qubit.
2. Verify the stationary state $|0\rangle\langle0|$.
3. Add $L_\phi=\sqrt{\eta/2}\,Z$ and find the extra decay rate of $\rho_{01}$.
4. Compare Euler and exact channel steps at fixed final time while halving $\Delta t$. Record trace error, minimum eigenvalue, and population error separately.`,
      reflectionPrompts: [
        'Why can a trace-preserving numerical update still be unphysical?',
        'When would a time-homogeneous Markov model be inappropriate?'
      ]
    }
  },
  {
    id: 'L64-quantum-trajectories',
    title: 'Quantum trajectories and Monte Carlo simulation',
    question: 'How can random pure-state paths reproduce mixed-state dynamics?',
    durationMinutes: 50,
    prerequisites: ['L63-lindblad-quantum-dynamics', 'L13-density-matrices-mixed-states'],
    reference: {
      title: 'Wave-function approach to dissipative processes in quantum optics',
      authors: 'Jean Dalibard, Yvan Castin, Klaus Mølmer',
      citation: 'Physical Review Letters 68, 580–583 (1992)',
      doi: '10.1103/PhysRevLett.68.580',
      sourceUrl: 'https://doi.org/10.1103/PhysRevLett.68.580',
      relevantSections: 'Non-Hermitian evolution, stochastic quantum jumps, and ensemble averaging'
    },
    formula: {
      formulaName: 'Effective Hamiltonian and jump probabilities',
      expression: String.raw`H_{\mathrm{eff}}=H-\tfrac i2\sum_jL_j^\dagger L_j,\qquad p_j=\Delta t\langle\psi|L_j^\dagger L_j|\psi\rangle`,
      theoremOrEquation: 'First-order Monte Carlo wave-function update'
    },
    content: {
      motivation:
        'Storing a density matrix can be expensive even when each trajectory needs only a state vector. The Monte Carlo wave-function method exchanges deterministic mixed-state storage for a collection of stochastic pure-state simulations.',
      theory: String.raw`### Jump and no-jump branches
For a short interval $\Delta t$, define $H_{\mathrm{eff}}=H-\tfrac i2\sum_jL_j^\dagger L_j$. A jump of type $j$ has probability $p_j=\Delta t\langle L_j^\dagger L_j\rangle+O(\Delta t^2)$ and gives the normalized state $L_j|\psi\rangle/\|L_j|\psi\rangle\|$. The no-jump branch uses $(I-iH_{\mathrm{eff}}\Delta t)|\psi\rangle$, then normalizes. Its probability is $1-\sum_jp_j$ to first order. Zero-probability branches must never be normalized.

### Recovering the master equation
Average the **outer products**, weighted by branch probabilities. The no-jump contribution produces the commutator and anticommutator terms, while jump branches add $\Delta t\sum_jL_j\rho L_j^\dagger$. Their sum is $\rho+\Delta t\mathcal L(\rho)+O(\Delta t^2)$. Averaging state vectors instead would create spurious interference between different measurement records.

For $M$ independent trajectories, estimate $\langle O\rangle$ by $M^{-1}\sum_m\langle\psi_m|O|\psi_m\rangle$. Sampling uncertainty typically scales as $M^{-1/2}$ for finite variance. It is distinct from time-discretization error. A mixed initial state needs an ensemble decomposition as well; one arbitrarily selected pure state is not an equivalent initialization.

### Exact waiting times in a simple model
For an initially excited, undriven qubit with $L=\sqrt\kappa|0\rangle\langle1|$, the survival probability is $e^{-\kappa t}$. Draw $u$ uniformly from $(0,1)$ and set the jump time $T=-\log u/\kappa$. Before $T$ the normalized conditional state is $|1\rangle$; afterward it is $|0\rangle$. This exact waiting-time shortcut applies to this model, not every driven multichannel process.

### Computational tradeoff
One trajectory stores $O(d)$ amplitudes rather than an $O(d^2)$ density matrix, but many trajectories may be needed for accurate or rare-event observables. Independent random streams, uncertainty estimates, and step-size convergence are part of a reliable simulation. The unraveling depends on the chosen monitoring scheme; a single simulated jump record is not an observer-independent history of an unmonitored system.`,
      workedExample: String.raw`Set $\kappa=1$ and observe at $t=\log2$. An initially excited qubit survives with probability $1/2$. The empirical surviving fraction from $M=100$ independent trajectories has standard deviation $\sqrt{(1/2)(1/2)/100}=0.05$. Increasing to $M=400$ reduces this to $0.025$, not $0.0125$. Each individual trajectory still has an abrupt transition rather than an exponential population curve.`,
      codeWalkthrough: '',
      exercise: String.raw`1. Derive the exponential waiting-time formula by inverting the survival function.
2. Simulate survival fractions at $t=0.5,1,2$ and compare with $e^{-t}$.
3. Repeat with several independent seeds and report an uncertainty estimate.
4. Explain why averaging $|0\rangle$ and $|1\rangle$ as vectors does not reproduce their equally weighted mixed state.`,
      reflectionPrompts: [
        'Which errors shrink with more trajectories, and which do not?',
        'Why must the physical monitoring scheme be specified when interpreting jumps?'
      ]
    }
  },
  {
    id: 'L65-schmidt-quantum-entanglement',
    title: 'Schmidt decomposition and quantum entanglement',
    question: 'How much information must cross a cut through a pure quantum state?',
    durationMinutes: 40,
    prerequisites: [
      'L12-multi-qubit-systems-entanglement',
      'L13-density-matrices-mixed-states',
      'L08-eigenvalues-without-diagonalization'
    ],
    reference: states,
    formula: {
      formulaName: 'Schmidt decomposition and entropy',
      expression: String.raw`|\psi\rangle=\sum_\alpha s_\alpha|u_\alpha\rangle|v_\alpha\rangle,\quad S=-\sum_\alpha s_\alpha^2\log_2s_\alpha^2`,
      theoremOrEquation: 'Chapter 2, §2.4: Schmidt decomposition and bipartite pure-state entanglement'
    },
    content: {
      motivation:
        'The number of qubits alone does not determine how hard a state is to represent. The Schmidt spectrum measures correlations across a chosen bipartition and becomes the central resource estimate for tensor-network simulation.',
      theory: String.raw`### Reshape amplitudes into a matrix
Choose a bipartition $A|B$ and product bases. Write $|\psi\rangle=\sum_{a,b}C_{ab}|a\rangle|b\rangle$. A singular value decomposition $C=USV^\dagger$ yields nonnegative singular values $s_\alpha$. The columns of $U$ and the complex conjugates of the columns of $V$ define orthonormal Schmidt vectors. Therefore
$$|\psi\rangle=\sum_\alpha s_\alpha|u_\alpha\rangle_A|v_\alpha\rangle_B,\qquad\sum_\alpha s_\alpha^2=1.$$
The number of nonzero coefficients is the Schmidt rank. A bipartite pure state is a product state exactly when this rank is one.

### Reduced states and entropy
Tracing out $B$ gives $\rho_A=\sum_\alpha s_\alpha^2|u_\alpha\rangle\langle u_\alpha|$. Both reduced states have the same nonzero eigenvalues, even when their dimensions differ. With $0\log_2 0=0$, their entropy is $S=-\sum_\alpha s_\alpha^2\log_2s_\alpha^2$. A pure state with Schmidt rank $r$ satisfies $S\le\log_2r$. Entropy of one subsystem is an entanglement measure here because the joint state is pure; the same shortcut is invalid for a general mixed joint state.

### Truncation and a precise error measure
Keep the largest $\chi$ coefficients and let $\epsilon=\sum_{\alpha>\chi}s_\alpha^2$. The unnormalized truncated vector has squared two-norm error $\epsilon$. If $\epsilon<1$, normalize the retained vector; its squared overlap with the original is $1-\epsilon$. Its squared vector distance is instead $2-2\sqrt{1-\epsilon}$. These three quantities should not be confused.

Local unitaries on $A$ and $B$ change Schmidt vectors but preserve singular values. A gate crossing the cut can change them. The singular spectrum may also change when the partition changes, so always name the cut.`,
      workedExample: String.raw`For $|\psi\rangle=\sqrt{0.9}|00\rangle+\sqrt{0.1}|11\rangle$, the reduced eigenvalues are $0.9$ and $0.1$, and the entropy is about $0.469$ bits. A rank-one truncation retains $|00\rangle$ after normalization. Its squared overlap is $0.9$ and discarded weight is $0.1$. For a Bell state both eigenvalues are $1/2$, so any rank-one truncation loses half the weight.`,
      codeWalkthrough: '',
      exercise: String.raw`1. Obtain the Schmidt spectra of $|00\rangle$, $(|00\rangle+|11\rangle)/\sqrt2$, and $|+\rangle|+\rangle$.
2. Use the visual to vary $\theta$ in $\cos\theta|00\rangle+\sin\theta|11\rangle$.
3. For squared coefficients $(0.7,0.2,0.08,0.02)$, compute the rank-two discarded weight and normalized fidelity.
4. Give a mixed separable state whose reduced entropy is nonzero.`,
      reflectionPrompts: [
        'Why does subsystem entropy diagnose entanglement only for a pure joint state?',
        'Which changes of basis preserve the Schmidt spectrum?'
      ]
    }
  },
  {
    id: 'L66-matrix-product-quantum-states',
    title: 'Matrix product states for quantum simulation',
    question: 'When can a chain of small tensors replace an exponential state vector?',
    durationMinutes: 45,
    prerequisites: ['L65-schmidt-quantum-entanglement', 'L05-linear-maps-matrices'],
    reference: mps,
    formula: {
      formulaName: 'Open-boundary matrix product state',
      expression: String.raw`\psi_{i_1\cdots i_N}=A^{[1]i_1}A^{[2]i_2}\cdots A^{[N]i_N},\qquad S_{\ell|\ell+1}\le\log_2\chi_\ell`,
      theoremOrEquation: 'MPS representation and Schmidt-rank bound at a virtual bond'
    },
    content: {
      motivation:
        'A general qubit state has exponentially many amplitudes. Many one-dimensional states explored in practice have limited entanglement across each cut, allowing useful approximations with matrix product states rather than dense vectors.',
      theory: String.raw`### Physical and virtual indices
An open-boundary MPS writes each amplitude as a product of matrices,
$$\psi_{i_1\cdots i_N}=A^{[1]i_1}A^{[2]i_2}\cdots A^{[N]i_N}.$$
The physical index $i_j$ selects a local basis state, with dimension $d$. Each matrix has shape $\chi_{j-1}\times\chi_j$, and the boundary dimensions are $\chi_0=\chi_N=1$, so the product is a scalar. Virtual indices are summed when neighboring tensors are contracted. They are not additional physical qubits.

### Why a bond limits entanglement
Cut one virtual index. The state becomes a sum of at most $\chi_j$ left–right product terms, so its Schmidt rank across that cut is at most $\chi_j$. The actual rank may be smaller. Consequently $S\le\log_2\chi_j$, also bounded by the Hilbert-space dimension of the smaller side. Increasing a bond dimension increases representational capacity; it does not itself create entanglement in an unchanged state.

Repeated SVDs construct an exact MPS for any finite state, but exact bond dimensions can grow exponentially with system size. Bounded $\chi$ gives storage roughly $O(Nd\chi^2)$ for uniform interior bonds. This estimate is useful only if the required accuracy is achievable at that $\chi$; MPS is not an efficient description of every state.

### Gauge freedom and contractions
Inserting $GG^{-1}$ across a bond changes adjacent tensors while preserving every physical amplitude. Canonical forms choose convenient gauges with orthonormal left or right block states. In such a form, singular values at the center carry the Schmidt data. Compute norms and local expectation values by contracting transfer tensors along the chain instead of expanding all $d^N$ amplitudes.

### Choosing a simulation representation
Product states need bond dimension one. A GHZ state needs dimension two across any nontrivial contiguous cut, despite involving arbitrarily many sites. Many generic highly entangled states require much larger bonds. The cut entropy and discarded singular weight are diagnostics; neither total qubit count nor a single bond bound proves a full simulation will remain cheap.`,
      workedExample: String.raw`For six qubits split after the third, each side has dimension eight. The Schmidt rank is at most $\min(\chi,8)$, giving the capacity bound $S\le\log_2\min(\chi,8)$. Thus $\chi=1,2,4,8$ allow upper bounds of zero, one, two, and three bits. The six-qubit GHZ state only needs $\chi=2$ and has one bit across this cut. These upper bounds are not the entropy of every state stored at the chosen bond dimension.`,
      codeWalkthrough: '',
      exercise: String.raw`1. Count the parameters of a four-site, local-dimension-two open MPS with bond dimensions $(1,2,4,2,1)$.
2. Write scalar tensors for the product state $|0101\rangle$.
3. Explain how diagonal virtual paths represent $|0000\rangle+|1111\rangle$ with bond dimension two.
4. Contract the norm of a two-site example and compare with its expanded state vector.`,
      reflectionPrompts: [
        'What is the difference between a physical leg and a virtual bond?',
        'Why is low bond dimension a statement about a representation and its accuracy?'
      ]
    }
  },
  {
    id: 'L67-tebd-quantum-time-evolution',
    title: 'TEBD: gates and truncation in quantum time evolution',
    question: 'How do local quantum gates change an MPS without expanding the full state?',
    durationMinutes: 55,
    prerequisites: [
      'L66-matrix-product-quantum-states',
      'L11-unitary-operators-quantum-gates',
      'L37-many-body-hamiltonians-models'
    ],
    reference: {
      title: 'Efficient simulation of one-dimensional quantum many-body systems',
      authors: 'Guifré Vidal',
      citation: 'Physical Review Letters 93, 040502 (2004)',
      arxivUrl: 'https://arxiv.org/abs/quant-ph/0310089',
      doi: '10.1103/PhysRevLett.93.040502',
      relevantSections: 'Local updates, Schmidt truncation, and time-evolving block decimation'
    },
    formula: {
      formulaName: 'Second-order even–odd product formula',
      expression: String.raw`e^{-i(H_e+H_o)\Delta t}=e^{-iH_e\Delta t/2}e^{-iH_o\Delta t}e^{-iH_e\Delta t/2}+O(\Delta t^3)`,
      theoremOrEquation:
        'Symmetric short-time product formula for finite bounded nearest-neighbor Hamiltonians'
    },
    content: {
      motivation:
        'Time-evolving block decimation combines short-time local gates with controlled tensor compression. Its usefulness depends on tracking two different approximations: splitting the Hamiltonian evolution and truncating the state representation.',
      theory: String.raw`### Split a nearest-neighbor Hamiltonian
For $H=\sum_j h_{j,j+1}$, put disjoint even and odd bonds into $H_e$ and $H_o$. Terms inside each layer act on disjoint sites and commute. For a finite bounded system, the symmetric step
$$U_2(\Delta t)=e^{-iH_e\Delta t/2}e^{-iH_o\Delta t}e^{-iH_e\Delta t/2}$$
has local error $O(\Delta t^3)$ and accumulated error $O(T\Delta t^2)$ at fixed final time $T$, before truncation. The hidden constants depend on commutators and system size. Nonlocal interactions require a different decomposition or additional handling.

### A two-site update
Bring the MPS into a mixed canonical form centered at the active bond. Contract its two neighboring tensors into $\Theta_{\alpha i j\beta}$. Apply the two-site gate to the physical indices $i,j$. Reshape the result as a matrix with row index $(\alpha,i)$ and column index $(j,\beta)$, then take an SVD. Its exact rank can exceed the old bond dimension because the gate can generate entanglement.

### Compress with a measured loss
Retain the largest singular values subject to a maximum bond dimension or a discarded-weight tolerance. Split the factors back into two tensors and move the canonical center. In the canonical setting, $\epsilon=\sum_{a>\chi}s_a^2$ measures the squared norm discarded in that local truncation. Normalize if appropriate and record this loss. Outside a canonical gauge, an arbitrary tensor SVD's singular values need not be the physical Schmidt coefficients.

### Two convergence studies
At a sufficiently large bond cap, halve the time step to test product-formula convergence. At a sufficiently small time step, increase the bond cap or tighten the cutoff to test truncation convergence. A smaller time step alone does not guarantee better results at fixed bond dimension, because it also changes the number of truncations. Accumulated discarded weights are useful diagnostics but are not automatically the final observable error or infidelity.

For fixed local dimension, the dense local SVD often gives a cost scaling cubically in the bond dimension. Entanglement growth after a quench can force the bond dimension upward, limiting accessible times even in one dimension.`,
      workedExample: String.raw`Suppose a normalized two-site update has squared Schmidt coefficients $(0.70,0.20,0.08,0.02)$. A bond cap of two retains weight $0.90$, discards $0.10$, and produces normalized retained weights $(7/9,2/9)$. At that one cut, the normalized truncated state has fidelity $0.90$ with the pre-truncation state. A cap of three raises that fidelity to $0.98$. Neither number includes product-formula error.`,
      codeWalkthrough: '',
      exercise: String.raw`1. For a four-site nearest-neighbor chain, list the gates in each even and odd layer.
2. Apply a two-qubit entangling gate to a product MPS and calculate its new Schmidt rank.
3. Use the visual to choose the smallest bond cap giving discarded weight at most $0.03$.
4. Design a table varying both time step and bond cap; include norm, energy, a local observable, and truncation diagnostics.`,
      reflectionPrompts: [
        'Which approximation can change the state even when every local gate is exact?',
        'Why must truncation and time-step convergence be checked separately?'
      ]
    }
  },
  {
    id: 'L68-dmrg-quantum-ground-states',
    title: 'DMRG: variational quantum ground-state search',
    question: 'How can local tensor optimization approximate a many-body ground state?',
    durationMinutes: 55,
    prerequisites: [
      'L66-matrix-product-quantum-states',
      'L46-lanczos-three-term-recurrence',
      'L37-many-body-hamiltonians-models'
    ],
    reference: mps,
    formula: {
      formulaName: 'Variational energy and local effective problem',
      expression: String.raw`E(A)=\frac{\langle\psi(A)|H|\psi(A)\rangle}{\langle\psi(A)|\psi(A)\rangle},\qquad H_{\mathrm{eff}}a=E\,a`,
      theoremOrEquation: 'Variational MPS optimization in an orthonormal canonical environment'
    },
    content: {
      motivation:
        'Density-matrix renormalization group searches for low-energy states inside an MPS family. It reuses local eigensolvers and tensor contractions to avoid constructing the full many-body Hamiltonian or state vector.',
      theory: String.raw`### The variational objective
For a normalized state, $E=\langle\psi|H|\psi\rangle$ is at least the true ground energy $E_0$. Restrict $|\psi\rangle$ to an MPS family and optimize its tensors. The variational bound applies to the energy of the actual normalized trial state; uncontrolled approximate contractions or inaccurate energy reporting can obscure it.

### Freeze the environment, optimize the center
Hold all tensors except one center tensor fixed. Contract the surrounding tensors and Hamiltonian, often represented as a matrix product operator, into an effective local eigenproblem. In a canonical gauge, the surrounding basis is orthonormal and $H_{\mathrm{eff}}a=Ea$. Otherwise a norm matrix appears in a generalized eigenproblem. A matrix-free Lanczos solver can apply the effective operator without storing it densely.

### Sweeps and bond growth
Move the canonical center from one end to the other and back, updating environments as you go. One-site updates optimize within the current bond structure. Two-site updates temporarily combine neighboring tensors, optimize them jointly, then split with an SVD; this permits adapting the bond dimension, at the cost of a truncation step. An exact local solve lowers or preserves the energy in its local search space, but subsequent truncation can raise it.

### Convergence is not a certificate of the ground state
The tensor optimization is not jointly convex. Different initial states or symmetry sectors can lead to different stationary results. Track energy changes, local solver residuals, bond dependence, discarded weight, and observables. The variance $\langle H^2\rangle-\langle H\rangle^2$ vanishes for an eigenstate, including excited eigenstates; a small variance alone does not prove ground-state convergence.

### A practical benchmark
For a short chain, compare with exact diagonalization and check the same Hamiltonian normalization, boundary conditions, and symmetry sector. Then increase system size gradually. Low-entanglement ground states of many one-dimensional local systems are a favorable setting, but criticality, long-range couplings, and higher-dimensional mappings can require substantially larger bonds.`,
      workedExample: String.raw`For two spins with $H=X\otimes X+Y\otimes Y+Z\otimes Z$, the singlet $(|01\rangle-|10\rangle)/\sqrt2$ has energy $-3$ in this Pauli-matrix convention. A product state has energy $\mathbf r_1\cdot\mathbf r_2\ge-1$. Thus bond dimension one cannot reach the ground state, while bond dimension two can represent the singlet exactly. Using spin operators $S=X/2,Y/2,Z/2$ instead would divide both energy values by four.`,
      codeWalkthrough: '',
      exercise: String.raw`1. Verify the singlet energy by applying each Pauli product.
2. Derive the product-state lower bound using Bloch vectors.
3. Explain why zero variance can also describe a triplet excited state.
4. For a four-site chain, compare two initial MPS choices and several bond caps against exact diagonalization; report both energy and variance.`,
      reflectionPrompts: [
        'What distinguishes a converged local optimization from a certified ground state?',
        'Why should the Hamiltonian convention accompany every benchmark energy?'
      ]
    }
  }
];

export const QUANTUM_SIMULATION_LECTURES: Record<string, Lecture> = Object.fromEntries(
  lessons.map(({ reference, formula, ...entry }, index) => {
    const lectureNumber = 61 + index;
    return [
      entry.id,
      {
        ...entry,
        lectureNumber,
        topicId: index < 4 ? 'open-quantum-systems' : 'tensor-network-simulation',
        subtitle: '',
        packNumber: 16 + Math.floor(index / 4),
        packSlot: (index % 4) + 1,
        theoreticalCitations: [
          {
            ...formula,
            source: `${reference.authors}, ${reference.citation}`,
            doiOrUrl: reference.doi
              ? `https://doi.org/${reference.doi}`
              : reference.sourceUrl || reference.arxivUrl
          }
        ],
        paperReferences: [reference],
        codeReferences: [],
        implementationChoices: []
      }
    ];
  })
);

export const QUANTUM_SIMULATION_TOPICS: Topic[] = [
  {
    id: 'open-quantum-systems',
    number: 15,
    title: 'Open quantum systems',
    subtitle: '',
    description: 'Quantum channels, noise models, master equations, and stochastic trajectories.',
    color: 'blue',
    symbol: 'ρ',
    lectureIds: lessons.slice(0, 4).map((lesson) => lesson.id),
    prerequisites: ['quantum-essentials']
  },
  {
    id: 'tensor-network-simulation',
    number: 16,
    title: 'Tensor-network quantum simulation',
    subtitle: '',
    description:
      'Entanglement spectra, matrix product states, local time evolution, and ground-state optimization.',
    color: 'sage',
    symbol: 'χ',
    lectureIds: lessons.slice(4).map((lesson) => lesson.id),
    prerequisites: ['quantum-essentials', 'lanczos-algorithm']
  }
];

import type { LectureCorrection } from './curriculumEditionSeven';

export const SIMULATION_CORRECTIONS: Partial<Record<number, LectureCorrection>> = {
  37: {
    additions: {
      theory:
        'Take at least two sites for an open chain. With a periodic convention that counts each nearest-neighbor bond once, use at least three. The stated critical point describes the one-dimensional ferromagnetic transverse-field Ising model in the thermodynamic limit.'
    }
  },
  38: {
    content: {
      theory: String.raw`### 1. Symmetry as operator commutation

A unitary $U$ is a symmetry of $H$ if $UHU^\dagger=H$. Diagonalize $U$ and restrict $H$ to its invariant eigenspaces. A Hermitian involution $S$ with $S^2=I$ has sectors with eigenvalues $\pm1$.

### 2. Simultaneous Eigenspaces and Block Diagonalization

The sector projectors are $(I\pm S)/2$. They have equal rank exactly when $\operatorname{Tr}S=0$. A nonidentity Hermitian Pauli is traceless; a general involution can have unequal sector ranks. Before testing termwise Pauli commutation, collect equal Hermitian Pauli labels, absorb scalar signs into their coefficients, and remove terms whose net coefficient is zero. The remaining labels are linearly independent.`,
      codeWalkthrough:
        'Canonicalize the sum into distinct nonzero Hermitian Pauli terms. A Pauli symmetry commutes with the sum exactly when it commutes with each of those terms. For a general Clifford symmetry, conjugate terms with their signs and compare the resulting coefficient map.'
    }
  },
  39: {
    content: {
      theory: String.raw`### 1. Clifford Symmetries of Quantum Hamiltonians

A Clifford $U$ gives a signed permutation of the Pauli basis. Write $H=\sum_v c_vP(v)$ using distinct Hermitian representatives. For every term check $UP(v)U^\dagger=s_vP(Fv)$ and compare $s_vc_v$ with $c_{Fv}$. The binary action alone cannot certify a symmetry.

### 2. Restricting the Hamiltonian

Any unitary symmetry gives invariant eigenspaces. A nonidentity Pauli symmetry can be mapped to a single-wire $Z$ and yields two equal sectors. A general Clifford symmetry has its own eigenspace dimensions. Use spectral projectors or a basis adapted to those dimensions.`,
      workedExample: String.raw`#### Reflection of an open three-spin chain

Let $H=\sum_{\alpha\in\{X,Y,Z\}}(\alpha_1\alpha_2+\alpha_2\alpha_3)$. The reflection $U=\mathrm{SWAP}_{13}$ exchanges the two bonds. On the end spins the symmetric subspace has dimension three and the antisymmetric subspace has dimension one. Including the middle spin gives sector dimensions six and two. A one-wire $Z$ has sectors of dimensions four and four, so no unitary conjugation can identify it with this $U$. On the singlet of the end spins, $(\alpha_1+\alpha_3)$ vanishes and both middle-spin states have energy zero.`,
      codeWalkthrough:
        'Store canonical Pauli labels as keys and net coefficients as values. Conjugate each label with phases, multiply its coefficient by the conjugation sign, and compare the whole canonical map with the original.',
      exercise:
        'For the chain in the worked example, write the normalized symmetric and antisymmetric states of the end spins. Compute the ranks of their projectors after tensoring with the identity on the middle spin. Then show that a CNOT from wire 1 to wire 2 sends X₁X₂ to X₁.'
    }
  },
  40: {
    additions: {
      theory: String.raw`A color-preserving graph automorphism is a candidate mapping of the terms. To lift the permutation, check that it respects every binary linear dependency among their labels, extend the compatible symplectic action, and solve or verify the signed coefficient conditions from L39. A graph edge records anticommutation between terms and does not by itself supply any of those checks.`
    },
    content: {
      codeWalkthrough:
        'Build edges by testing the symplectic pairing of each pair of terms. One u64 per adjacency row supports at most 64 vertices. For larger graphs use multiple words or adjacency lists.'
    }
  },
  41: {
    additions: {
      theory:
        'To obtain a candidate permutation, pair vertices occupying corresponding positions in two discrete leaves of the search tree. Verify colors and adjacency before calling the permutation an automorphism.'
    }
  },
  42: {
    prerequisites: ['L04-vector-spaces-finite-fields', 'L18-symplectic-product-commutation'],
    content: {
      theory: String.raw`### 1. Definition of the Term Fixer Kernel

A Pauli label $v=(x,z)$ fixes a Hamiltonian term with label $u=(a,b)$ exactly when $\langle u,v\rangle_s=b\cdot x+a\cdot z=0$ in $\mathbb F_2$.

### 2. Formulation as a Linear System over $\mathbb F_2$

Stack rows $(b\mid a)$ to form $A$ and compute a nullspace basis. This describes all labels that fix every term by conjugation.

### 3. Choose a commuting subgroup

A nullspace basis can include anticommuting vectors. For simultaneous sectors select an independent isotropic subspace, where every pair has pairing zero. For a maximal such selection, split off pairs with pairing one using symplectic elimination, take one member from each split pair, and include the remaining radical. The chosen signed involutions can then be diagonalized together.`
    },
    additions: {
      workedExample: String.raw`Here $XXX$ and $ZII$ anticommute. An isotropic basis that retains the global spin flip is $XXX,ZZI,IZZ$. The two $Z$ strings each overlap $XXX$ on two wires. An alternative commuting basis is $ZII,IZI,IIZ$. Choose one family of sectors before solving the spectrum.`
    }
  },
  43: {
    prerequisites: [
      'L08-eigenvalues-without-diagonalization',
      'L22-standard-generators-conjugation',
      'L27-stabilizer-states-generators',
      'L42-term-fixers-exact-kernel'
    ],
    content: {
      theory: String.raw`### 1. The Diagonalization Theorem

Independent, pairwise commuting Hermitian Pauli labels can be sent to single-wire $Z$ labels by a Clifford. Record the sign on each row throughout the construction.

### 2. Algorithmic Procedure

For each pivot row, rotate its supported axes to $Z$ with local Clifford gates. Pick a pivot wire $p$ and apply $\mathrm{CNOT}_{k\to p}$ for every other supported wire $k$. The pivot becomes $\pm Z_p$. All remaining rows commute with that row, so at $p$ they have $I$ or $Z$. Multiply each row containing $Z_p$ by the signed pivot to clear it. Apply row products also to the desired eigenvalues. Restrict subsequent gates to untouched wires. A negative pivot sign may be retained when interpreting the measured bit.

### 3. Hilbert Space Projection

After conjugating $H$, substitute the selected eigenvalue of each pivot $Z_p$ wherever it appears. A Pauli in $H$ that commutes with every pivot has only $I$ or $Z$ on those wires. Each independent pivot halves the dimension, and each original sector constraint has a corresponding constraint on the pivot bits.`,
      workedExample: String.raw`For $X_1X_2$, apply $H$ on both wires, obtaining $Z_1Z_2$. Applying $\mathrm{CNOT}_{1\to2}$ then gives $Z_2$, since $Z_1$ is fixed and $Z_2$ becomes $Z_1Z_2$. To finish on wire 1 use the reverse-control $\mathrm{CNOT}_{2\to1}$ instead. The diagram shows another valid sequence: $\mathrm{CNOT}_{1\to2}$ first sends $X_1X_2$ to $X_1$ and $H_1$ sends that to $Z_1$.`,
      exercise: String.raw`Let $V=\mathrm{CNOT}_{1\to2} H_2 H_1$. Verify $V(X_1X_2)V^\dagger=Z_2$. Then conjugate $Z_1Z_2$ and $Z_1$ by $V$. The results are $X_1$ and $X_1X_2$, respectively. Check that the first commutes with $Z_2$ and the second anticommutes with it, as the original pairings require.`,
      codeWalkthrough:
        'Keep the sign and label of each generator, the basis change circuit, and the row operations on the requested sector bits. Validate the output by conjugating every original generator and reconstructing it from the signed Z pivots.'
    }
  },
  44: {
    content: {
      theory: String.raw`### 1. The 5-Stage Block-Diagonalization Architecture

1. Canonicalize the Pauli expansion. Use L39 and L40 to search for nontrivial Clifford symmetries when needed.
2. Find term-fixing labels with L42 and choose an independent commuting subset.
3. Apply the signed diagonalization from L43 to the generators and to every Hamiltonian term.
4. Substitute the selected pivot eigenvalues in each sector.
5. Solve the requested sector, or compare all sectors if the global ground state is sought.

Each independent Pauli sector bit halves the block dimension. This algebraic reduction preserves the sector spectrum; runtime depends on both the reduced solver and which sectors need to be solved.`,
      workedExample: String.raw`#### Resolve the spin-flip sectors of an open four-spin chain

Let $S=X_1X_2X_3X_4$ and $H=Z_1Z_2+Z_2Z_3+Z_3Z_4+S$. Each bond commutes with $S$ because it overlaps on two sites. First apply $\mathrm{CNOT}_{1\to2},\mathrm{CNOT}_{1\to3},\mathrm{CNOT}_{1\to4}$, then $H_1$. The controlled gates send $S$ to $X_1$ and the final $H_1$ sends $X_1$ to $Z_1$. The three bonds become $Z_2,\ Z_2Z_3,\ Z_3Z_4$.

In sector $s=\pm1$, the reduced energy is $z_2+z_2z_3+z_3z_4+s$. The first three terms simultaneously reach $-1$ at $(z_2,z_3,z_4)=(-1,+1,-1)$. Thus $E_{\min}(+1)=-2$ and $E_{\min}(-1)=-4$. The global ground energy is $-4$; each sector has eight states.`,
      codeWalkthrough:
        'Check each Pauli term under conjugation. Sum signed coefficients after substituting the sector bits. For this diagonal example, enumerate the eight triples of remaining Z eigenvalues per sector.'
    }
  },
  45: {
    additions: {
      theory: String.raw`For a unit vector $v$, the Rayleigh estimate is $\theta=v^\dagger Av$ and its residual is $r=Av-\theta v$. Measure convergence to an eigenvector up to sign or complex phase. A negative dominant eigenvalue can make consecutive real iterates alternate signs while their one-dimensional spans converge.`
    }
  },
  46: {
    additions: {
      theory: String.raw`Let $Q_m=[q_1,\ldots,q_m]$ contain the orthonormal Krylov vectors. The three-term recurrence column by column gives $HQ_m=Q_mT_m+\beta_m q_{m+1}e_m^\mathsf T$. Multiplication by $Q_m^\dagger$ removes the last term by orthogonality and yields $Q_m^\dagger H Q_m=T_m$.`
    }
  },
  47: {
    content: {
      theory: String.raw`### 1. The Pauli Basis Action

Use zero-based wire indices, with wire $q$ at bit $q$ and the highest bit at the left of the ket. Let $P=(-1)^r i^{|x\cap z|}X^xZ^z$ be a signed Hermitian Pauli. For any basis index $k$,

$$
P\lvert k\rangle=(-1)^{r+|k\cap z|}i^{|x\cap z|}\lvert k\mathbin{\oplus}x\rangle.
$$

For $Y$ on one wire, this gives $Y\lvert0\rangle=i\lvert1\rangle$ and $Y\lvert1\rangle=-i\lvert0\rangle$.

### 2. Matrix-Free Multiplication Algorithm

For each output index $j$ and each term, gather the input amplitude at $k=j\mathbin{\oplus}x$. Use $k$ for parity, multiply by the coefficient and complex phase, and sum the terms. This costs $O(M2^n)$ for $M$ terms with single-word labels and stores vectors instead of the dense matrix.

### 3. Cache and Memory Efficiency

Each term permutes indices without a collision. Access locality depends on the flipped bits and the vector layout. Benchmark the concrete access pattern before choosing a term-major or output-major implementation.`,
      workedExample: String.raw`For $X\otimes Z$, the left factor acts on bit 1 and the right factor on bit 0. Thus $x=2,z=1$. For input $(v_{00},v_{01},v_{10},v_{11})^\mathsf T$, the result is $(v_{10},-v_{11},v_{00},-v_{01})^\mathsf T$. Changing the term to $Z\otimes X$ gives $x=1,z=2$ and output $(v_{01},v_{00},-v_{11},-v_{10})^\mathsf T$.`,
      codeWalkthrough:
        'Use complex accumulators. For output index j, set k = j XOR x. Compute the phase exponent (popcount(x AND z) + 2r + 2 popcount(k AND z)) modulo four, multiply the input by i to that power, then multiply by the real coefficient. Sum the actual terms only.'
    },
    formulas: [
      {
        formulaName: 'Signed Pauli action',
        expression: String.raw`P\lvert k\rangle=(-1)^{r+|k\cap z|}i^{|x\cap z|}\lvert k\oplus x\rangle`,
        source: 'Hostens, Dehaene, and De Moor',
        theoremOrEquation: 'Pauli labels with phase',
        doiOrUrl: 'https://arxiv.org/abs/quant-ph/0408190'
      }
    ]
  },
  48: {
    formulas: [
      {
        formulaName: 'Ritz residual from the Lanczos recurrence',
        expression: String.raw`\|H(Q_my)-\theta Q_my\|_2=\beta_m|e_m^\mathsf{T}y|`,
        source: 'Lanczos projection identity',
        theoremOrEquation: 'Exact arithmetic, orthonormal basis and normalized Ritz vector'
      }
    ],
    additions: {
      exercise: String.raw`Use $H=\operatorname{diag}(1,2,4)$ and $q_1=(1,1,1)^\mathsf T/\sqrt3$ when testing Ritz residuals. Compare a true breakdown after reaching the full Krylov dimension with premature loss of orthogonality in finite precision.`
    }
  },
  49: {
    additions: {
      theory: String.raw`For an independently measured $\pm1$ term weighted by $c$, the per-shot standard deviation is $s=|c|\sqrt{1-\mu^2}$, which can exceed one. The worst-case standard deviation is $|c|$. For a positive integer budget assign one shot to each estimated term, then allocate each extra shot where it most reduces variance, $s^2/[N(N+1)]$. This handles integer rounding and exactly spends the specified budget.`
    }
  },
  50: {
    content: {
      theory: String.raw`### 1. The commutation graph

Create one vertex per observable and an edge between distinct commuting Pauli labels. A clique can be measured in one joint stabilizer basis. In a qubit-wise compatible clique each wire uses at most one nonidentity basis, so local rotations suffice.

### 2. The Minimum Clique Cover Problem

Choose cliques covering all vertices. Removing duplicate assignments from a cover leaves valid cliques, so a minimum setting cover can be taken as a partition. Equivalently color the anticommutation graph. Greedy coloring is a heuristic, with quality depending on vertex order and graph structure. Minimizing the number of settings and minimizing estimator variance under a shot budget are distinct objectives.`,
      workedExample: String.raw`For $XX,YY,ZZ,XI$, one partition is $\{XX,YY,ZZ\}$ and $\{XI\}$. The first three commute in pairs because each unequal axis appears on two wires. $XI$ anticommutes with $YY$ and $ZZ$, so one setting cannot cover the set. Another valid two-setting partition is $\{XX,XI\}$ and $\{YY,ZZ\}$.`,
      codeWalkthrough:
        'Color the anticommutation graph in a stated vertex order, keeping an independent set in each color. Check coverage and disjointness, then evaluate the variance objective for the candidate allocation.'
    }
  },
  51: {
    prerequisites: ['L43-commuting-paulis-sector-resolution', 'L50-commutation-graphs-clique-covers'],
    content: {
      theory: String.raw`### 1. The Clique Rotation Problem

Use signed diagonalization as in L43. If $UPU^\dagger=(-1)^rZ^z$, read computational bits $b$ after $U$ and report $(-1)^{r+z\cdot b}$. Multiplicative dependencies among clique observables survive conjugation, including their signs.

### 2. Circuit Synthesis Complexity

The circuit acts once per shot. The outcome parity is then classical work per observable. Count the diagonalizing gates separately from wire routing and from parity accumulation.`,
      workedExample: String.raw`First apply $\mathrm{CNOT}_{1\to2}$, then $H_1$. The CNOT sends $XX$ to $XI$ and $ZZ$ to $IZ$. After $H_1$, these are $ZI$ and $IZ$. Since $YY=-XX\,ZZ$, it becomes $-ZZ$. Read $b_1,b_2$ on wires 1 and 2, returning $(-1)^{b_1}$, $(-1)^{b_2}$ and $-(-1)^{b_1+b_2}$ for $XX,ZZ,YY$, respectively. The Bell state $\lvert\Phi^+\rangle$ gives both readout bits zero, so the three outcomes are $(+1,+1,-1)$.`,
      codeWalkthrough:
        'Store a sign bit and a Z support mask for each diagonalized observable. XOR the sign bit with the parity of the intersection of the support and the measured bits. Check that the Bell decoder gives YY = −1 for readout 00.'
    }
  },
  52: {
    content: {
      theory: String.raw`### 1. The Neyman Optimal Allocation

A shot in clique $g$ produces a joint vector $Y_g$. With coefficients $c_g$ and covariance $\Sigma_g$, its weighted variance is $V_g=c_g^\mathsf{T}\Sigma_g c_g$. Different clique batches are independent when settings and shot counts are fixed in advance. The aggregate variance is $\sum_g V_g/N_g$. Minimizing at fixed total budget gives $N_g\propto\sqrt{V_g}$. Use the marginal reduction $V_g/[N_g(N_g+1)]$ to allocate integer shots after assigning a positive minimum.

### 2. Multi-Round Adaptive Refinement

A Beta prior $\mathrm{Beta}(\alpha,\beta)$ for Bernoulli $p$ updates to $\mathrm{Beta}(\alpha+s,\beta+f)$ after $s$ successes and $f$ failures. At posterior parameters $a,b$, its variance is $ab/[(a+b)^2(a+b+1)]$. For a $\pm1$ outcome the variance of its posterior mean $2p-1$ is four times that number. The conditional shot variance is $4p(1-p)$. For several jointly measured outcomes estimate their covariance from the same shots. To avoid selection bias in a simple two-stage analysis, use independent pilot data to choose a fixed final allocation and compute the final estimate from the final shots alone.`,
      workedExample: String.raw`Take weighted per-shot variances $V_A=0.0199$ and $V_B=1$. A fixed 1,000-shot equal allocation gives $0.0199/500+1/500=0.0020398$. If 250 shots per group are reserved and the variances treated as known for a fixed-design comparison, assign the remaining 500 as 60 to A and 440 to B. The totals are 310 and 690. This fixed allocation yields $0.0199/310+1/690\approx0.0015135$, about a 26% reduction. It is a fixed-design variance calculation. A pooled estimator whose allocation depended on the pilot outcomes needs a separate error analysis.`,
      exercise: String.raw`Two independent cliques have weighted per-shot variances $0.16$ and $0.64$. Find the continuous optimum for 1,000 shots. Compare the two integer allocations bracketing that optimum using $0.16/N_1+0.64/N_2$. Which wins?`,
      codeWalkthrough:
        'For each clique, form the scalar weighted outcome per shot or compute its joint covariance on the pilot. Allocate the fixed final budget using the integer marginal gains. Record whether pilot observations enter the final estimator.'
    },
    formulas: [
      {
        formulaName: 'Joint weighted variance',
        expression: String.raw`V_g=c_g^\mathsf{T}\Sigma_gc_g,\quad N_g\propto\sqrt{V_g}`,
        source: 'Constrained variance minimization',
        theoremOrEquation: 'Independent fixed-size clique batches'
      },
      {
        formulaName: 'Beta posterior variance',
        expression: String.raw`\operatorname{Var}(p\mid D)=\frac{ab}{(a+b)^2(a+b+1)}`,
        source: 'Beta–Bernoulli conjugacy',
        theoremOrEquation: 'Posterior parameters a and b'
      }
    ]
  },
  53: {
    prerequisites: ['L52-bayesian-adaptive-allocation'],
    additions: {
      theory: String.raw`### Conditional shot covariance

For a posterior draw $\theta$, let $\mu_i(\theta)=\mathbb E[Y_i\mid\theta]$ and $m_{ij}(\theta)=\mathbb E[Y_iY_j\mid\theta]$. AQUIRE Eq. (7a) integrates $m_{ij}(\theta)-\mu_i(\theta)\mu_j(\theta)$ over the posterior. This is the mean conditional shot covariance. The covariance of the conditional means is a different term, and the two add to the covariance of the posterior predictive outcomes. For a posterior concentrated on $\lvert\Phi^+\rangle$ and $Y_i=Z_i$, both conditional means are always zero. The conditional product is always one, so the first term is one and the second is zero. With a Markov chain, average the integrand over recorded states, including repeats after rejected moves. Dependence among states affects numerical error. See [AQUIRE Eq. (7) and Appendix C](https://arxiv.org/html/2605.00682v1).`
    }
  },
  54: {
    additions: {
      theory: String.raw`Prepare $\lvert0\rangle$ repeatedly and estimate $e_{01}$ as the fraction reported as 1. Prepare $\lvert1\rangle$ repeatedly and estimate $e_{10}$ as the fraction reported as 0. Use separate calibration counts and propagate their uncertainty when it is appreciable.`
    }
  },
  55: {
    replacements: {
      theory: [
        ['This cuts quantum circuit depth from linear to logarithmic!', 'This reduces Pauli support size.']
      ]
    },
    additions: {
      theory:
        'Here Majorana operators are Hermitian combinations of creation and annihilation operators. A Fenwick update path identifies stored parities affected by an occupation change. The complete Bravyi–Kitaev operator also needs the parity and occupation information used in querying a mode. Pauli support size counts nonidentity factors. Compiled circuit depth depends on geometry, basis changes, and scheduling.'
    },
    content: {
      codeWalkthrough:
        'Treat a Fenwick update routine as one part of the encoding. Check the full transformed creation and annihilation operators against their canonical anticommutation relations before using them.'
    }
  },
  56: {
    content: {
      theory: String.raw`### 1. Quadratic (Free) Fermionic Hamiltonians

For Majoranas with $\{\gamma_j,\gamma_k\}=2\delta_{jk}$ and real skew-symmetric $A$, let $H=(i/4)\sum_{jk}A_{jk}\gamma_j\gamma_k$. The Heisenberg equation gives $\dot\gamma=A\gamma$, hence $\gamma(t)=e^{At}\gamma(0)$.

### 2. The Fermionic Covariance Matrix

For an even fermionic Gaussian state, $\Gamma_{jk}=(i/2)\langle[\gamma_j,\gamma_k]\rangle$ determines its correlations. The real antisymmetric matrix has canonical $2\times2$ blocks with entries $\pm\nu_j$ and $|\nu_j|\le1$. Thus $-I\preceq\Gamma^2\preceq0$. A pure Gaussian state has $|\nu_j|=1$ for every block, while the maximally mixed state has $\Gamma=0$.

Evolution gives $\Gamma'=R\Gamma R^\mathsf{T}$. Wick's rule evaluates a specified product of $2k$ distinct Majoranas through a Pfaffian of order $2k$ in $O(k^3)$ arithmetic. A sum of many such products costs proportionally more.`,
      workedExample: String.raw`For four modes, the covariance has eight rows and eight columns. With active and inactive Majoranas separated, a local rotation acts as:

$$
\Gamma=\begin{pmatrix}A&B\\-B^\mathsf T&D\end{pmatrix},
\qquad
\Gamma'=\begin{pmatrix}RAR^\mathsf T&RB\\-B^\mathsf TR^\mathsf T&D\end{pmatrix}.
$$

When $B\ne0$, the cross-block entries change as well as the active block. A fixed-size rotation touches $O(n)$ entries per step, so $m$ such steps cost $O(mn)$ and dense storage uses $O(n^2)$. At 1,000 modes a dense double-precision array has $2{,}000^2$ entries, or 32 MB.`
    },
    formulas: [
      {
        formulaName: 'Gaussian covariance bounds and evolution',
        expression: String.raw`-I\preceq\Gamma^2\preceq0,\quad \Gamma'=R\Gamma R^\mathsf T`,
        source: 'Sergey Bravyi, fermionic linear optics',
        theoremOrEquation: 'Gaussian correlation matrices',
        doiOrUrl: 'https://arxiv.org/abs/quant-ph/0404180'
      }
    ]
  },
  57: {
    prerequisites: ['L27-stabilizer-states-generators', 'L31-gottesman-knill-theorem'],
    additions: {
      theory: String.raw`The three-qubit repetition checks are $ZZI$ and $IZZ$. For the Steane code, the same weight-four binary check support can define an $X$ check and a $Z$ check, for example $IIIXXXX$ and $IIIZZZZ$ under one choice of column order.`
    }
  },
  58: {
    content: {
      theory: String.raw`### 1. Mapping Basis States to GPU Threads

Assign an output index $j$ to a thread. For each Hermitian Pauli term, gather complex amplitude $v_{j\oplus x}$ and include its complete phase from L47. Sum into that thread's output, then write once.

### 2. Hardware Intrinsic Bit-Twiddling

For a packed label, population count yields parity and the overlap phase. Use a complex accumulator. A warp shuffle is defined only for participating lanes. If the requested source lane is outside the mask or on another warp, use a suitable global or shared-memory load.

### 3. Coalesced Memory Access and Shared Memory Tiling

Measure actual bandwidth for the index permutation and data type. Tiling helps only when it improves those accesses or allows input reuse. A full Lanczos step also includes scalar reductions, recurrence updates, and possibly reorthogonalization.`,
      workedExample: String.raw`A complex-single vector of length $2^{28}$ uses $2^{28}\cdot8$ bytes. A simplified full read and full write transfers about $4.29$ GB. At a hypothetical sustained $1{,}008$ GB/s, this is a lower bound of about $4.26$ ms for that transfer alone. Multiple terms, synchronization, finite efficiency, and convergence are separate costs.`,
      exercise:
        'For each output index of a single-wire Y apply the gather rule. Then compute the effective bandwidth of a 4.3 GB read-and-write transfer taking 5 ms. Identify what else would need timing for a full Lanczos iteration.',
      codeWalkthrough:
        'For output j, gather k = j XOR x. Depending on the phase exponent modulo four, use v, i v, −v, or −i v, and multiply by the signed real coefficient. Compare the device output with a CPU complex matrix-vector product for I, X, Y, and Z on one and two wires.'
    }
  },
  59: {
    prerequisites: ['L53-mcmc-covariance-integration', 'L58-cuda-lanczos-gpu-kernels'],
    content: {
      theory: String.raw`### 1. Heterogeneous Quantum Computing Pipeline

For posterior draw $\theta$ and $d$ jointly measurable observables compute the upper triangle of $C_{ij}(\theta)=m_{ij}(\theta)-\mu_i(\theta)\mu_j(\theta)$. Its posterior average is the conditional shot covariance used in AQUIRE Eq. (7a). Keep separate estimates of posterior covariance of conditional means and Monte Carlo numerical error.

### 2. Batched CUDA Architecture

The estimator for $B$ retained draws is an array of $d(d+1)/2$ means. Each thread group accumulates partial sums for selected draws and pairs. Within a block, synchronize after writing shared memory before reducing it. Write one partial array per block, then launch a second reduction after the first kernel completes. Divide by the total retained sample count, including states repeated after rejected moves. Parallel chains can produce the draws, but within-chain transitions remain sequential. Report Monte Carlo uncertainty using chain-aware diagnostics or batch means. See [AQUIRE Appendix C](https://arxiv.org/html/2605.00682v1).`,
      workedExample: String.raw`For two observables the output order can be $(1,1),(1,2),(2,2)$. On a Bell state with both observables $Z$, both means vanish and all three conditional moment entries are one. With two equally weighted draws, a Bell state and $\lvert00\rangle$, the second draw has conditional covariance zero. The integrated covariance array is $(1/2,1/2,1/2)$. The covariance of the two conditional mean vectors is instead $(1/4,1/4,1/4)$.`,
      exercise: String.raw`For a posterior concentrated on $\lvert\Phi^+\rangle$, compute the conditional shot covariance, covariance of conditional means, and predictive covariance for $Z_1,Z_2$. Then explain why repeating the same chain state increases the arithmetic draw count without adding an independent posterior observation.`,
      codeWalkthrough:
        'Test per-draw values against a CPU reference, then compare averaged upper-triangle arrays. Validate sample count, shape, and transpose symmetry. Measure end-to-end latency with transfer, chain generation, reduction, and synchronization included before making a performance claim.'
    },
    formulas: [
      {
        formulaName: 'Integrated conditional covariance',
        expression: String.raw`\widehat{\overline C}_{ij}=\frac1B\sum_{b=1}^B\bigl(m_{ij}(\theta_b)-\mu_i(\theta_b)\mu_j(\theta_b)\bigr)`,
        source: 'Simon et al., AQUIRE',
        theoremOrEquation: 'Equation (7a) and Appendix C',
        doiOrUrl: 'https://arxiv.org/abs/2605.00682'
      }
    ]
  },
  60: {
    additions: {
      theory: String.raw`On a qubit–qutrit register define $P=X_2\otimes X_3$ and $Q=Z_2\otimes Z_3$, with $Z_dX_d=\omega_d X_dZ_d$ and $\omega_d=e^{2\pi i/d}$. Then $QP=(\omega_2\omega_3)PQ=-e^{2\pi i/3}PQ$. Keep one modular label per local dimension and combine the local scalar phases.`
    }
  },
  61: {
    additions: {
      theory: String.raw`In finite dimensions a linear map is completely positive and trace preserving exactly when it admits a Kraus representation $\Phi(\rho)=\sum_k K_k\rho K_k^\dagger$ with $\sum_k K_k^\dagger K_k=I$. One reported outcome can collect several Kraus operators. Its probability is the trace of the corresponding partial sum, and that partial sum divided by its trace is the selected state.`
    }
  },
  64: {
    additions: {
      theory: String.raw`Take $\kappa>0$. At a fixed time $t$, the sample labeled 1 can represent survival, with Bernoulli probability $e^{-\kappa t}$. Varying $t$ traces the survival function.`
    }
  },
  65: {
    additions: {
      theory: String.raw`Write the coefficient array as $C=U\operatorname{diag}(s)V^\dagger$. The columns of $U$ are left Schmidt vectors, and the coordinatewise conjugates of the columns of $V$ are right Schmidt vectors. The singular values $s$ are amplitudes and their squares are the reduced-state eigenvalues. For $C=\operatorname{diag}(\sqrt{3}/2,1/2)$ the state is $(\sqrt3/2)\lvert00\rangle+(1/2)\lvert11\rangle$ and the weights are $3/4,1/4$.`
    }
  },
  66: {
    additions: {
      theory: String.raw`The Schmidt rank across a cut is at most $\min(\chi,d_A,d_B)$. The entropy in bits is at most $\log_2\min(\chi,d_A,d_B)$ because a distribution of fixed support size has largest entropy when uniform.`
    }
  },
  68: {
    additions: {
      theory: String.raw`With left and right basis tensors fixed, let $V$ embed the active center coefficients into the full chain. In a canonical gauge the effective operator is $H_{\rm eff}=V^\dagger H V$. Its matrix elements contract the Hamiltonian with both environments.`,
      exercise: String.raw`For the four sites, take an open chain $H=\sum_{j=1}^{3}(X_jX_{j+1}+Y_jY_{j+1}+Z_jZ_{j+1})/4$. This excludes the bond between sites 4 and 1.`
    }
  }
};

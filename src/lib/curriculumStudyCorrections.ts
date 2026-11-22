import type { LectureCorrection } from './curriculumEditionSeven';

function theory(text: string): LectureCorrection {
  return { additions: { theory: text } };
}

export const STUDY_CORRECTIONS: Partial<Record<number, LectureCorrection>> = {
  1: {
    replacements: {
      theory: [
        [
          String.raw`A two-sided inverse $h:B\to A$ satisfies`,
          String.raw`The identity map $\operatorname{id}_A:A\to A$ sends each $a$ to itself, and $\operatorname{id}_B$ does the same on $B$. A two-sided inverse $h:B\to A$ satisfies`
        ]
      ]
    },
    referenceSections: 'Functions and mappings, including images, inverse images, and bijections'
  },
  2: theory(
    String.raw`Bézout's identity gives $\gcd(a,n)=ua+vn$ for integers $u,v$. The residue of $a$ is a unit modulo $n$ exactly when this gcd is 1. Fermat's little theorem uses a prime modulus $p$: $a^p\equiv a\bmod p$, and $a^{p-1}\equiv1\bmod p$ when $p\nmid a$.`
  ),
  3: theory(
    String.raw`The characteristic is the least positive $k$ for which $k\cdot1=0$, or zero if none exists. A zero divisor is a nonzero element with zero product with another nonzero element. If $n=ab$ with $1<a,b<n$, the nonzero residues $[a],[b]$ have product $[0]$.`
  ),
  4: theory(
    String.raw`Under addition a vector space is an abelian group. For scalars $a,b$ in its field and vectors $u,v$, require $a(u+v)=au+av$, $(a+b)v=av+bv$, $(ab)v=a(bv)$ and $1v=v$.`
  ),
  5: theory(
    String.raw`For composition $W\to V\to U$ use one field and the same basis of $V$ for both matrices. Extend a kernel basis to a basis of the domain. The images of the added vectors span the image and are independent: any combination with image zero would belong to the kernel, contradicting basis independence unless its coefficients vanish.`
  ),
  6: theory(
    String.raw`A vector $w$ is $B$-orthogonal to $W$ if $B(w,u)=0$ for every $u\in W$. Choose $e,f$ with $B(e,f)=1$. The restriction to their plane is nondegenerate, so every vector splits into its components in that plane and the orthogonal complement. Repeat on the complement.`
  ),
  7: theory(
    String.raw`$\mathrm{GL}(V)$ is the group of invertible linear maps on $V$. In the basis $(e_1,e_2,f_1,f_2)$ with $B(e_j,f_k)=\delta_{jk}$, swapping $e_1,e_2$ and fixing the two $f$ vectors fails to preserve $B$. Over $\mathbb F_2$ its determinant is still 1.`
  ),
  8: theory(
    String.raw`Matrices $A$ and $S^{-1}AS$ are similar for invertible $S$. The trace is the sum of diagonal entries. An eigenvalue's algebraic multiplicity is its root multiplicity in the characteristic polynomial.`
  ),
  9: {
    replacements: {
      theory: [
        [
          'Gram–Schmidt constructs such a family from independent input vectors, although finite-precision implementations need care.',
          String.raw`Given successive independent vectors $v_j$, form $w_j=v_j-\sum_{i<j}q_i\langle q_i,v_j\rangle$ and normalize $q_j=w_j/\|w_j\|$. This is Gram–Schmidt. The subtraction leaves an orthogonal residual and independence guarantees it is nonzero.`
        ]
      ]
    },
    additions: {
      theory: String.raw`A ket $\lvert v\rangle$ is a column vector and its bra $\langle v\rvert$ is the conjugate-transpose row. The adjoint satisfies $\langle u,Av\rangle=\langle A^\dagger u,v\rangle$. For unit $q$, $\lvert q\rangle\langle q\rvert$ projects onto its span.`
    }
  },
  10: {
    replacements: {
      theory: [
        [
          '### Normalize the amplitudes',
          String.raw`### Normalize the amplitudes

Use computational basis $\lvert0\rangle=(1,0)^\mathsf T$ and $\lvert1\rangle=(0,1)^\mathsf T$. A bra is the conjugate transpose of its ket. Hadamard $H$ sends the two computational kets to $\lvert+\rangle$ and $\lvert-\rangle$. The accompanying gate widget uses real amplitudes.`
        ]
      ]
    },
    additions: {
      exercise: String.raw`The $Y$ basis vectors are $\lvert y_\pm\rangle=(\lvert0\rangle\pm i\lvert1\rangle)/\sqrt2$. Conjugate the phase when forming each bra.`
    }
  },
  11: {
    replacements: {
      theory: [
        [
          'A square complex matrix',
          String.raw`The adjoint $U^\dagger$ is the conjugate transpose. A square complex matrix`
        ]
      ]
    }
  },
  12: theory(
    String.raw`Acting by $U\otimes V$ on coefficient table $M$ gives $UMV^\mathsf T$: its entry $(i,j)$ sums $U_{ia}M_{ab}V_{jb}$. The eigenvalues of $MM^\dagger$ are the squared singular values of $M$. They are the Schmidt weights shown in the widget.`
  ),
  13: {
    replacements: {
      theory: [
        [
          '### Compare coherent and incoherent preparations',
          String.raw`### Compare coherent and incoherent preparations

An outer product $\lvert v\rangle\langle w\rvert$ maps $u$ to $v\langle w,u\rangle$. Trace is the diagonal sum, and a Hermitian matrix $A$ is positive semidefinite if $\langle v,Av\rangle\ge0$ for all $v$. An effect $0\preceq E\preceq I$ describes one measurement outcome.`
        ]
      ]
    }
  },
  63: { prerequisites: ['L61-quantum-channels-kraus', 'L62-quantum-noise-channels'] },
  67: { prerequisites: ['L66-matrix-product-quantum-states', 'L11-unitary-operators-quantum-gates'] },
  70: theory(
    'A residue modulo 3 is a remainder 0, 1, or 2. Two integers with the same remainder differ by a multiple of 3. Addition and multiplication can be performed on the remainders.'
  ),
  72: {
    replacements: {
      exercise: [
        [
          'Prove an indexed loop that counts positive entries is correct.',
          String.raw`Take a list $a$ of $n\ge0$ integers. Set $c=0$ and, for $i=0,\ldots,n-1$, increment $c$ if $a_i>0$. Prove that this loop counts positive entries.`
        ]
      ]
    }
  },
  73: theory(
    String.raw`Node flux is the integrated voltage, $\Phi(t)=\int^t V(t')\,dt'$. The capacitor charge is $Q=CV=C\dot\Phi$. These give the variables to quantize.`
  ),
  74: theory(
    String.raw`For constant $H$, the Schrödinger equation gives $\psi(t)=e^{-itH/\hbar}\psi(0)$. The transverse drive's phase $\phi$ determines the axis $\cos\phi\,X+\sin\phi\,Y$. A resonant $\pi$ pulse about that axis gives $\lvert0\rangle\mapsto-ie^{i\phi}\lvert1\rangle$.`
  ),
  75: theory(
    String.raw`$E_J$ is the Josephson energy and $E_C=e^2/(2C_\Sigma)$ is the charging energy. DRAG adds a component on the orthogonal drive quadrature proportional to the time derivative of the main envelope.`
  ),
  76: theory(
    String.raw`The assignment matrix is $\begin{pmatrix}1-e_{01}&e_{10}\\e_{01}&1-e_{10}\end{pmatrix}$, with prepared states as columns and reported states as rows. Here $e_{ab}$ is the probability of reporting $b$ after preparing $a$.`
  ),
  78: theory(
    String.raw`For $V=\sum_a E_a\otimes\lvert a\rangle_E$, environment entry $(a,b)$ is $\langle\psi|E_b^\dagger E_a|\psi\rangle$. Perfect recovery leaves no environment record of the encoded state. Constancy of these quadratic forms on unit code states implies $P E_b^\dagger E_a P=\lambda_{ba}P$ by polarization.`
  ),
  79: theory(
    String.raw`Distance minimizes the weight of a normalizer Pauli outside the stabilizer modulo phase. A mixed CSS Pauli must have zero syndrome for both its $x$ and $z$ parts. Every nonzero binary vector of weight at most two gives a nonzero syndrome for this check matrix, so no nonzero mixed label of weight below three passes. Two faults can exceed the one-error correction radius.`
  ),
  80: {
    replacements: {
      theory: [
        [
          '### Compare rounds',
          '### Compare rounds\n\nIn a planar surface-code patch, local X and Z checks act on nearby data qubits, with smaller checks near the edges. A bulk X fault flips incident Z checks, a bulk Z fault flips incident X checks, and Y can flip both. At a boundary that absorbs the syndrome type, a local fault may change just one check.'
        ]
      ]
    },
    additions: {
      workedExample: String.raw`For event coordinates $(j,t)$, a bulk fault can give $(j,t),(j+1,t)$, a flipped reading gives $(j,t),(j,t+1)$, and a fault at an absorbing edge gives $(j,t)$ paired with the boundary. The three pairs are different kinds of candidate edges.`
    }
  },
  81: theory(
    String.raw`In a Ramsey fit, $A$ is contrast, $B$ is the offset, $\phi$ is fringe phase, and the drive detuning sets the oscillation frequency. $T_2^*$ is the decay time of the Ramsey envelope under the fitted model.`
  ),
  82: {
    replacements: {
      theory: [
        [
          'Sample $m$ Clifford gates',
          'Independently sample each of the $m$ Clifford gates uniformly from the projective Clifford group'
        ]
      ]
    }
  },
  83: theory(
    'Quadratic coherent growth applies at small accumulated angles. Near a full rotation, the exact coherent error probability approaches zero again.'
  ),
  84: theory(
    String.raw`For stationarity, $C(\tau)=\mathbb E[\delta(t+\tau)\delta(t)]$. Alternate $y=\pm1$ on $m$ intervals of length $\tau$, with $m$ even. Then $Y(\omega)=((e^{i\omega\tau}-1)/(i\omega))\sum_{j=0}^{m-1}(-e^{i\omega\tau})^j$. The alternating sum cancels at zero frequency. Near $\omega=\pi/\tau$ its terms add in phase, with peak magnitude $2m\tau/\pi$. Finite duration broadens the peak.`
  ),
  85: theory(
    String.raw`When $1+x$ rounds to 1 the increment is lost while forming that sum. Rationalize $\sqrt{1+x}-1$ by multiplying and dividing by $\sqrt{1+x}+1$. The new numerator is exactly $x$ in real arithmetic.`
  ),
  86: theory(
    String.raw`Use the induced matrix 2-norm $\|A\|_2=\max_{\|v\|_2=1}\|Av\|_2$. At elimination step $k$, search for the partial pivot only in rows $k,\ldots,n$ of column $k$.`
  ),
  87: {
    replacements: { theory: [['A thin QR factorization', 'For full column rank, a thin QR factorization']] }
  },
  88: theory(
    String.raw`With $T(1)=\Theta(1)$, the $\log_2 N$ levels give $\Theta(N\log N)$ work. For $(1,1,0,0)$ both shorter transforms contribute $(1,1)$, giving combined output $(2,1-i,0,1+i)$.`
  ),
  89: {
    additions: {
      workedExample: String.raw`Normalize posterior odds $w_A:w_B$ to probability $w_A/(w_A+w_B)$ for $A$. Equivalently normalize the two joint weights $P(A)P(E\mid A)$ and $P(B)P(E\mid B)$.`
    }
  },
  90: {
    replacements: {
      theory: [
        [
          '### Estimate an expectation with repeated draws',
          String.raw`### Estimate an expectation with repeated draws

Expectation is the probability-weighted average, an integral for a continuous density. Variance is $\mathbb E[(X-\mathbb E[X])^2]$, and standard error is the standard deviation of an estimator over repeated datasets.`
        ],
        [
          'gives the variance shown above',
          String.raw`gives $\operatorname{Var}(aX+bY)=a^2\operatorname{Var}(X)+b^2\operatorname{Var}(Y)+2ab\operatorname{Cov}(X,Y)$`
        ]
      ]
    }
  },
  91: theory(
    String.raw`For independent $X_i\in[0,1]$ with common mean $\mu$, the sample mean is $\bar X=m^{-1}\sum_iX_i$. The two-sided Hoeffding bound is $\Pr(|\bar X-\mu|\ge\epsilon)\le2e^{-2m\epsilon^2}$.`
  ),
  92: theory(
    String.raw`An irreducible chain can reach any state from any other with positive probability. Aperiodicity means the gcd of return times is one. In Metropolis–Hastings use the positive target support and account for forward and reverse proposal probabilities. Estimate $\mathbb E_\pi f$ by $m^{-1}\sum_i f(X_i)$ over retained steps, including repeats after rejections.`
  ),
  93: {
    additions: {
      workedExample: String.raw`If the segments are $U_1=e^{-it_1H_1/\hbar}$ then $U_2=e^{-it_2H_2/\hbar}$, their action is $U_2U_1\lvert\psi\rangle$. Reversing physical order gives $U_1U_2\lvert\psi\rangle$.`
    }
  },
  94: theory(
    String.raw`After a basis change $U$, the original-basis outcome projector is $P_b=U^\dagger\lvert b\rangle\langle b\rvert U$. For nonzero probability $p_b=\langle\psi|P_b|\psi\rangle$, the normalized branch is $P_b\lvert\psi\rangle/\sqrt{p_b}$.`
  ),
  95: theory(
    String.raw`The normalized Gibbs state is $\rho_\beta=e^{-\beta H}/\operatorname{Tr}(e^{-\beta H})$ with $\beta=1/(k_{\mathrm B}T)$, where $k_{\mathrm B}$ is Boltzmann's constant.`
  ),
  96: theory(
    String.raw`For a linear schedule $s=t/T$, the chain rule gives $d/dt=(1/T)d/ds$. This factor connects variation along the path to the physical rate.`
  ),
  97: theory(
    'The canonical binary length ⌊log₂ n⌋ + 1 assumes a positive integer. The numeral 0 has length one by convention.'
  ),
  98: theory(
    String.raw`A language $L$ belongs to NP if $x\in L$ exactly when there is a polynomial-length witness $w$ with $V(x,w)=1$. A 3-CNF is an AND of clauses each with at most three literals. NP-hardness means every NP language reduces in polynomial time; NP-completeness additionally requires membership. Unroll the fixed verifier into a polynomial-size circuit, fix the input $x$, and leave the witness bits free. The same construction works for each $x$. Gate clauses reduce this Circuit-SAT instance to 3-CNF.`
  ),
  99: theory(
    'Use an odd repetition count. With an even count, specify the tie rule before stating the success probability.'
  ),
  100: theory(
    String.raw`A machine configuration specifies the control state, tape contents, and tape head positions including the input head. Check adjacency by testing a legal one-step transition on the fixed input. For at most $N$ configurations start at $k=\lceil\log_2 N\rceil$. If space is $s(n)\ge\log n$, then $\log N=O(s(n))$ and the total space bound is $O(s(n)^2)$.`
  ),
  101: theory(
    'The rank argument concerns exact deterministic classical queries. On any fixed transcript, fewer than n independent constraints leave at least two compatible secrets.'
  ),
  102: theory(
    String.raw`The two-axis representation assumes $0<M<N$. In the lower bound the no-mark output can have probability above $1/3$ on at most two addresses. A successful single-mark oracle outputs its mark with probability at least $2/3$, giving a difference of at least $1/3$ on all other mark events. Measurement cannot increase trace distance, and pure-state trace distance is at most Euclidean distance, so the hybrid bound requires $\Omega(\sqrt N)$ queries.`
  ),
  103: {
    replacements: {
      theory: [
        [
          '### Accumulate an eigenphase in a control register',
          String.raw`### Accumulate an eigenphase in a control register

Use $F_N\lvert x\rangle=N^{-1/2}\sum_y e^{2\pi ixy/N}\lvert y\rangle$. Its adjoint has the negative exponent of L88 with unitary normalization. Bit $j$ has weight $2^j$, starting at the least significant bit. Restore normal order if the QFT decomposition reverses wires. Assume access to controlled-$U$.`
        ]
      ]
    },
    additions: {
      theory:
        'The exact O(m²) count treats the required controlled rotations and Hadamards as elementary gates. Discrete gate sets require approximation of those rotations and a separate synthesis error budget.'
    }
  },
  104: {
    additions: {
      theory: String.raw`Choose the least $Q=2^m\ge N^2$. The nearest-grid error is at most $1/(2Q)<1/(2r^2)$ since $r<N$. Repeated Euclidean division gives the continued-fraction coefficients. If $a^q=1\bmod N$, dividing $q$ by the order gives a remainder with the same property. Minimality forces that remainder to zero, so $r$ divides $q$. Verify candidate denominators and extracted factors.

First handle even integers, primes, and perfect powers classically. With a random base $a$, return a nontrivial gcd if available. For an odd composite with distinct prime factors, a uniform unit has constant probability of an even order with $a^{r/2}\ne-1\bmod N$ by the Chinese remainder theorem. The chance of a coprime phase numerator is $\varphi(r)/r$, at least inverse polylogarithmic. Repeating the verified procedure therefore costs polynomial time in $\log N$.`,
      workedExample: String.raw`The $512$ basis states require nine control qubits. Since $512=6\cdot85+2$, the first nonzero convergent of $85/512$ is $1/6$. Verify the denominator with $2^6\equiv1\bmod21$.`
    }
  },
  105: theory(
    'PP requires probability strictly greater than 1/2 on yes instances. Given two accepting path counts with equal padded branching depth, toss a fair bit and run the first predicate or the complement of the second. The acceptance probability exceeds 1/2 exactly when the first count is larger.'
  ),
  106: theory(
    String.raw`If all local terms satisfy $-\Lambda I\preceq H_j\preceq\Lambda I$, use the common rescaling $\widetilde H_j=(H_j+\Lambda I)/(2\Lambda)$ and transform thresholds by $(E+m\Lambda)/(2\Lambda)$. The verifier applies the local effects $I-\widetilde H_j,\widetilde H_j$. Diagonalize the constant-size term and implement an eigenvalue-dependent ancilla rotation. Marriott–Watrous amplification alternates coherent tests of the accept and input-ancilla projectors using the verifier and its inverse. It amplifies on the original quantum register. [Marriott and Watrous](https://arxiv.org/abs/cs/0506068).`
  ),
  107: theory(
    String.raw`Total variation is $\sup_A|P(A)-Q(A)|$, half the discrete $\ell_1$ distance. An approximate sampler within $\eta$ total variation can shift any event probability by up to $\eta$ in addition to shot uncertainty.`
  ),
  108: theory(
    String.raw`Implement a Pauli exponential by rotating its axes to $Z$, computing parity on one wire with CNOTs, applying $R_z(2tc)$ for $e^{-itcP}$, then undoing parity and basis change. In Clifford+$T$, approximate each rotation. For $K$ term gates, allocate at most $\epsilon_{\mathrm{syn}}/K$ operator-norm error to each and combine by telescoping with the product-formula bound.`
  )
};

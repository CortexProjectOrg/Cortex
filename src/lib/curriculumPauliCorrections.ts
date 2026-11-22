import type { LectureCorrection } from './curriculumEditionSeven';

export const PAULI_CORRECTIONS: Partial<Record<number, LectureCorrection>> = {
  14: {
    content: {
      theory: String.raw`### 1. The circuit model

A circuit acts on a register by composing gates in time order. In a product $U_m\cdots U_1$, the rightmost gate acts first. A global scalar $e^{i\alpha}$ leaves measurement probabilities unchanged.

### 2. Universal quantum gate sets

The one-qubit gates $H,T$ generate a dense group **up to global phase**. Together with $\mathrm{CNOT}$ they are universal for fixed-size qubit registers in the same projective sense. Clifford gates alone preserve the Pauli group under conjugation. Since the group of signed Pauli images on a finite register is finite, the projective Clifford group is finite. In contrast, $TXT^\dagger=(X+Y)/\sqrt2$.

To see the origin of distinct axes, $T=e^{i\pi/8}R_z(\pi/4)$ and $HTH=e^{i\pi/8}R_x(\pi/4)$. The Solovay–Kitaev bound applies to approximating fixed-size unitary gates from a fixed, inverse-closed, dense gate set. A general $n$-qubit unitary may already require exponentially many elementary operations before that approximation step.`,
      workedExample: String.raw`### Change the rotation axis

Use $HZH=X$ to get $HR_z(\theta)H=R_x(\theta)$, then substitute $\theta=\pi/4$. The resulting circuit $HTH$ has the same measurement probabilities as $R_x(\pi/4)$. The scalar relating them is $e^{i\pi/8}$.`,
      codeWalkthrough:
        'A compiler should specify its target gate set, how it measures approximation error up to phase, and the tolerance per compiled gate.'
    }
  },
  15: {
    content: {
      workedExample: String.raw`#### Decomposing a Hermitian matrix

Let $A=\begin{pmatrix}3&1-2i\\1+2i&-1\end{pmatrix}$. Orthogonality gives $c_P=\operatorname{Tr}(PA)/2$. For $I,X,Z$ the traces are $2,2,4$, respectively. For $Y$:

$$
YA=\begin{pmatrix}-i(1+2i)&i\\3i&i(1-2i)\end{pmatrix},
\qquad \operatorname{Tr}(YA)=(2-i)+(2+i)=4.
$$

Thus $A=I+X+2Y+2Z$. Its upper entry is $1-2i$ and its lower entry is $1+2i$. These coefficients expand an operator. A quantum channel is a map on operators and needs a separate representation.`,
      codeWalkthrough: String.raw`#### Ordered products

Use phases $i^k$ with $k$ reduced modulo four. Reversing a product of distinct nonidentity Paulis adds two to $k$.

~~~rust
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Pauli { I, X, Y, Z }

fn multiply(left: Pauli, right: Pauli) -> (u8, Pauli) {
    use Pauli::*;
    match (left, right) {
        (I, right) => (0, right),
        (left, I) => (0, left),
        (X, Y) => (1, Z),
        (Y, Z) => (1, X),
        (Z, X) => (1, Y),
        (Y, X) => (3, Z),
        (Z, Y) => (3, X),
        (X, Z) => (3, Y),
        (X, X) | (Y, Y) | (Z, Z) => (0, I),
    }
}

fn main() {
    assert_eq!(multiply(Pauli::X, Pauli::Y), (1, Pauli::Z));
    assert_eq!(multiply(Pauli::Y, Pauli::X), (3, Pauli::Z));
}
~~~`
    }
  },
  16: {
    additions: {
      theory: String.raw`### Quotient and register order

The coset $[P]$ identifies $P,iP,-P,-iP$. On each wire use the label $(x_j,z_j)$ for $X^{x_j}Z^{z_j}$, so commuting $Z$ past $X$ contributes only a scalar and the quotient product XORs the two labels. Any nonidentity label anticommutes with a suitable local Pauli on one of its nonidentity wires. This proves the center consists of scalar phases. In written tensor products the left factor is the higher-order wire. Thus $X\otimes Z$ flips the high bit and reads the low bit; $Z\otimes X$ has the opposite roles.`
    },
    content: {
      codeWalkthrough: String.raw`For the unsigned product of two packed labels, first require equal register sizes $1\le n\le64$. Compute the mask by shifting an all-ones word right by $64-n$. Reject inputs with bits outside that mask, then XOR the corresponding $x$ and $z$ words. To multiply signed operators, carry the phase as in L19.`
    }
  },
  17: {
    replacements: {
      theory: [['Total size: **17 bytes**', 'The three fields use 17 payload bytes before padding']]
    },
    additions: {
      theory: String.raw`### From wires to packed bits

Wire $q$ uses bit $q$ with zero-based indexing. Kets are printed from high to low bit. A raw representative is $i^kX^xZ^z$, so an unsigned identity label has $x=z=0$. It is the actual identity exactly when $k=0\bmod4$. A packed payload with two 64-bit fields and one 8-bit phase uses 17 field bytes. Rust structure alignment can make the in-memory stride larger.`
    },
    content: {
      codeWalkthrough:
        'Test the unsigned identity with x == 0 && z == 0. Test the exact identity by also requiring phase % 4 == 0. In particular, the label of −I passes only the unsigned test.'
    }
  },
  18: {
    content: {
      theory: String.raw`### 1. Commutation on individual wires

For two tensor-product Pauli labels $u=(x,z)$ and $v=(a,b)$, the local sign is $(-1)^{x_jb_j+z_ja_j}$. It is negative exactly for unequal nonidentity axes. At a $Y,Y$ position both cross terms are one, so their sum is zero modulo two.

### 2. The Fundamental Commutation Identity

$$
\langle u,v\rangle_s=x\cdot b+z\cdot a\bmod2,\qquad
P(u)P(v)=(-1)^{\langle u,v\rangle_s}P(v)P(u).
$$

On packed words evaluate the parity of $(x\mathbin{\&}b)\mathbin{\oplus}(z\mathbin{\&}a)$. Population count may compile to a hardware instruction on supported targets. Wider labels need a reduction across words.`
    }
  },
  19: {
    replacements: {
      theory: [
        [
          String.raw`However, whenever both $x_1 = 1$ and $x_2 = 1$, $X^{x_1 + x_2} = X^2 = I$. If we write the product in the standard form $X^{x_1 \oplus x_2} Z^{z_1 \oplus z_2}$, an extra phase factor arises.`,
          'Reducing the powers of X and Z modulo two adds no phase. The phase shown above came from moving the first Z factor past the second X factor.'
        ]
      ]
    },
    additions: {
      theory: String.raw`### Raw and Hermitian representatives

Write $R(x,z)=X^xZ^z$ and $P(x,z)=i^{|x\cap z|}R(x,z)$, where $|x\cap z|$ is a population count. Then $P(x,z)$ is the tensor product of the axes $I,X,Y,Z$, with $P(1,1)=Y=iXZ$. The same operator $i^kR(x,z)$ is $i^{k-|x\cap z|}P(x,z)$. The raw product adds $2(z\cdot a)$ to the phase exponent of $R(x,z)R(a,b)$ and XORs the labels. To report a Hermitian-representative phase, subtract the overlap count of the output label.`
    },
    formulas: [
      {
        formulaName: 'Ordered raw Pauli multiplication',
        expression: String.raw`R(x,z)R(a,b)=i^{2(z\cdot a)}R(x\oplus a,z\oplus b)`,
        source: 'Hostens, Dehaene, and De Moor',
        theoremOrEquation: 'Modular Pauli representation',
        doiOrUrl: 'https://arxiv.org/abs/quant-ph/0408190'
      }
    ]
  },
  20: {
    additions: {
      theory: String.raw`### Expectation and ground energy

The expectation for a specified density matrix is $\operatorname{Tr}(\rho H)$. By the spectral theorem the ground energy is the minimum expectation over all unit vectors. For $H=Z$, $\lvert0\rangle$ gives $+1$ and the minimum is $-1$. Local models often have a small number of Pauli terms. A generic observable can have all $4^n$ coefficients.`
    },
    content: {
      codeWalkthrough:
        'Represent each term as a pair containing its coefficient and Pauli label. Compute the sum of coefficient times measured or simulated expectation. If the inputs are two parallel arrays, validate equal lengths before using zip.'
    }
  },
  21: {
    content: {
      theory: String.raw`### 1. The Normalizer Definition

The Clifford group $\mathcal C_n$ is the normalizer of the $n$-qubit Pauli group inside $\mathrm U(2^n)$. Conjugation sends each Hermitian Pauli to a signed Hermitian Pauli. Scalar unitaries act trivially, so the finite object is the projective Clifford group $\overline{\mathcal C}_n=\mathcal C_n/\mathrm U(1)$.

### 2. Signed and unsigned actions

The projective Clifford group maps onto $\mathrm{Sp}(2n,\mathbb F_2)$ when signs are forgotten. Its kernel is the projective Pauli group $\overline{\mathcal P}_n$, whose conjugations can change signs while fixing labels. Equivalently $\mathcal C_n/(\mathrm U(1)\mathcal P_n)\cong\mathrm{Sp}(2n,\mathbb F_2)$. L23 proves the kernel statement.`
    },
    formulas: [
      {
        formulaName: 'Projective Clifford quotient',
        expression: String.raw`\overline{\mathcal C}_n/\overline{\mathcal P}_n\cong\mathrm{Sp}(2n,\mathbb F_2)`,
        source: 'Aaronson and Gottesman',
        theoremOrEquation: 'Clifford circuits and tableau representations',
        doiOrUrl: 'https://arxiv.org/abs/quant-ph/0406196'
      }
    ]
  },
  22: {
    additions: {
      theory: String.raw`### Gate generation and signs

$H,S,\mathrm{CNOT}$ generate the projective qubit Clifford group. One constructive proof reduces the images of $X_j,Z_j$ to the standard symplectic frame, one pair at a time, as in L25. Finish by correcting the remaining generator signs with a Pauli. For example, $\mathrm{CNOT}_{1\to2}$ sends $X_1Z_2$ to $(X_1X_2)(Z_1Z_2)=-Y_1Y_2$. An XOR-only implementation therefore computes only the unsigned action.`
    },
    content: {
      codeWalkthrough:
        'For an unsigned CNOT on zero-based control c and target t, XOR x[c] into x[t] and XOR z[t] into z[c]. For signed rows, apply the sign update in L29 using the four old bits before writing either new bit.'
    }
  },
  23: {
    additions: {
      theory:
        'To lift a symplectic matrix, treat its columns as an ordered frame of conjugate Pauli labels. The pair-by-pair reduction in L25 sends the frame to the standard one using elementary Clifford gates. Reversing the reduction gives a lift.'
    }
  },
  24: {
    additions: {
      theory: String.raw`### A short factorization

Over $\mathbb F_2$, let $t_v(w)=w+\langle v,w\rangle_s v$. Then $t_Z(x,z)=(x,z+x)$ is the unsigned $S$ gate, and $t_X(x,z)=(x+z,z)$. Multiplying the two shear matrices gives $H=t_Xt_Zt_X$ on labels, with the rightmost factor acting first. This factorization concerns labels. Signed gate action requires checking the image of $Y$ separately.`
    }
  },
  25: {
    content: {
      theory: String.raw`### 1. The Circuit Synthesis Problem

Given the signed images of the $X_j,Z_j$ generators, construct a Clifford realizing them. First work on labels, then solve for signs. All column operations below are implemented by conjugating every column with the same physical gate.

### 2. The Canonical Synthesis Pipeline

1. Pick the first remaining image of $Z_j$. On each wire in its support, use single-qubit Cliffords to turn its local axis into $Z$. Swap a supported wire into position $j$. For every other support wire $k$, apply $\mathrm{CNOT}_{k\to j}$. It sends $Z_kZ_j$ to $Z_j$ and clears wire $k$ from this image.
2. The paired image of $X_j$ anticommutes with $Z_j$, so it has $X$ or $Y$ at $j$. A power of $S_j$ makes that factor $X$. Rotate its other nontrivial local axes to $X$ using gates on those other wires. Then apply $\mathrm{CNOT}_{j\to k}$ for each such wire. It sends $X_jX_k$ to $X_j$ and leaves $Z_j$ fixed.
3. All other frame columns commute with both fixed labels, so they are identity on wire $j$. Repeat on the remaining wires. Reverse the reduction circuit, inverting each gate, to obtain the required unsigned action.
4. Compare the signed images with the target. At the input, multiply by a Pauli whose $z_j$ flips the sign of the $X_j$ image and whose $x_j$ flips the sign of the $Z_j$ image. Check all $2n$ signed generators. They determine the projective action.

This constructive elimination gives an $O(n^2)$ elementary gate bound with arbitrary two-wire connectivity. Additional routing and optimization are separate costs. [Bravyi and Maslov](https://arxiv.org/abs/2003.09412) give a canonical layered description.`,
      workedExample: String.raw`#### A phase gate and a SWAP

For the target $S$, the images are $X\mapsto Y$ and $Z\mapsto Z$. The first reduction step leaves $Z$ fixed. In the second step $S^\dagger$ sends $Y$ to $X$. Inversion yields $S$, with no sign correction.

For SWAP, the two $X$ labels and the two $Z$ labels exchange wires. The diagram shows a reduction in the CNOT-only subgroup. Its three alternating CNOTs exchange the two bits and consequently exchange both pairs of Pauli labels.`,
      codeWalkthrough:
        'Track signed generator images when applying every elementary gate. Use the unsigned labels for pivot choice, apply the sign correction at the input, and verify the reconstructed circuit by conjugating each X and Z. The one-wire S and two-wire SWAP examples test distinct cases.'
    }
  },
  26: {
    content: {
      theory: String.raw`### Sample a symplectic frame uniformly

In a $2m$-dimensional nondegenerate symplectic space choose $a$ uniformly from the nonzero vectors. Choose $b$ uniformly from the $2^{2m-1}$ vectors with $\langle a,b\rangle_s=1$. Recurse on the orthogonal complement of their span. Each choice has a count depending only on $m$, so every ordered symplectic frame is equally likely.

### Lift the labels and randomize the signs

Use any fixed lift from L25, then multiply on the right by a uniformly chosen projective Pauli. This randomizes the $2n$ generator signs independently and uniformly. Every fiber has $4^n$ choices, making the projective Clifford uniform. Being a unitary design refers to matching specified Haar moment averages, rather than sampling each unitary from the continuous Haar distribution.`,
      workedExample: String.raw`For one qubit there are three choices for $a$ and two for $b$. These give six unsigned frames. Independently pick $I,X,Y,$ or $Z$ to obtain all 24 projective Cliffords, each with probability $1/24$.`,
      codeWalkthrough:
        'Sample a uniform nonzero label in the current symplectic complement. Sample its partner uniformly from the affine hyperplane with symplectic pairing one. Once all pairs are fixed, synthesize the lift and choose 2n independent fair bits for the input Pauli.'
    }
  },
  27: {
    additions: {
      theory: String.raw`### Validate signed generators

First require Hermitian generators and pairwise commutation. Reduce the binary labels by Gaussian elimination, multiplying the full signed Paulis in each row operation. If a zero label reduces to $-I$, the constraints are inconsistent. If it reduces to $+I$, it is redundant. For example $Z$ and $-Z$ would require opposite eigenvalues simultaneously. A consistent rank-$r$ group has a $2^{n-r}$-dimensional fixed subspace. For a pure stabilizer state, nonzero computational-basis amplitudes have equal magnitude, and their relative signs or phases can differ.`
    },
    content: {
      codeWalkthrough:
        'Validate the entire commuting generating set, then eliminate labels while multiplying signed rows. Return an inconsistency when any remaining row is −I. The pair [Z, −Z] must fail and [Z, Z] must reduce to rank one.'
    }
  },
  28: {
    additions: {
      theory: String.raw`Each row represents $(-1)^r i^{|x\cap z|}X^xZ^z$. The population count defines the Hermitian representative and the extra bit $r$ gives its sign. There are $2n$ persistent rows. The deterministic measurement algorithm uses a separate scratch row initialized to $+I$.`
    },
    content: {
      workedExample: String.raw`#### Initial Tableau for a 2-Qubit System

The columns are $(x_1,x_2\mid z_1,z_2\mid r)$. The rows $D_1,D_2,S_1,S_2$ start as $X_1,X_2,Z_1,Z_2$:

$$
\left(\begin{array}{cc|cc|c}
1&0&0&0&0\\
0&1&0&0&0\\\hline
0&0&1&0&0\\
0&0&0&1&0
\end{array}\right).
$$

The two $Z$ rows stabilize $\lvert00\rangle$. The two paired symplectic products equal one, and cross-pair products vanish.`
    }
  },
  29: {
    replacements: {
      theory: [
        [String.raw`$X \mapsto Y = XZ$`, String.raw`$X \mapsto Y = iXZ$`],
        ['All $2n$ rows are updated in parallel.', 'Each of the $2n$ rows can be updated independently.']
      ]
    },
    content: {
      workedExample: String.raw`#### A tableau update that changes a sign

On one qubit, take $D=X$ and $S=+Y$, where $Y=iXZ$. Initially the rows $(x,z,r)$ are:

$$
\left(\begin{array}{cc|c}1&0&0\\1&1&0\end{array}\right).
$$

Apply $H$. The rows become $Z$ and $-Y$ because $HYH=iZX=-Y$:

$$
\left(\begin{array}{cc|c}0&1&0\\1&1&1\end{array}\right).
$$

The new signed stabilizer fixes the state with $Y$ eigenvalue $-1$. Its sign bit must change even though its binary label stayed fixed.`
    }
  },
  30: {
    content: {
      theory: String.raw`### 1. Identifying the Measurement Regime

Measure $Z_a$ using a valid signed tableau with destabilizers $D_i$ dual to stabilizers $S_i$. A row anticommutes with $Z_a$ exactly when its $x_a$ bit is one. Measurement reports $b=0$ for eigenvalue $+1$.

### 2. State Collapse in the Random Case (Case 1)

If a stabilizer anticommutes with $Z_a$, select its index $p$ and save the entire signed row $S_p$. For each persistent row other than $S_p,D_p$ that anticommutes with $Z_a$, multiply it by the saved row. Those products commute internally because $S_p$ anticommutes only with its paired destabilizer among the original frame. Set $D_p$ to the saved signed row, then replace $S_p$ by $(-1)^b Z_a$ with $b$ an independent fair bit. The paired row is overwritten, so multiplying it first would be unnecessary and can produce an anti-Hermitian temporary product.

### 3. State Collapse in the Deterministic Case (Case 2)

If all stabilizers commute with $Z_a$, start a scratch row at $+I$. For every $D_i$ anticommuting with $Z_a$, multiply the scratch row by the signed $S_i$. Their product has the label of $Z_a$, since pairing with the dual frame gives exactly its coordinates in the stabilizer span. Return its sign bit. The persistent tableau remains as it was.`,
      codeWalkthrough:
        'Use the signed row multiplication from L19 and inspect the old rows before updating them. Tests should measure Z on |1⟩, sample both outcomes on H|0⟩, and check that a random pivot preserves the complete old stabilizer row in its paired destabilizer.'
    },
    additions: {
      workedExample: String.raw`For $\lvert1\rangle$, take $D=X,S=-Z$. The scratch row multiplies by $S$ and equals $-Z$, so the reported bit is 1. With $D=Y,S=X$ instead, $Z$ is a random measurement. Skip $D$ during row clearing. After a $+1$ result the pair is $D=X,S=Z$.`
    }
  },
  31: {
    content: {
      theory: String.raw`### 1. Statement of the Gottesman-Knill Theorem

With stabilizer inputs, Clifford gates, and Pauli measurements, a classical algorithm samples the complete joint measurement record in polynomial time. This includes adaptive Clifford choices driven by earlier recorded outcomes.

### 2. Physical and Computational Implications

A dense tableau uses $O(n^2)$ bits, a local Clifford updates $O(n)$ row entries, and a measurement can take $O(n^2)$ bit operations. Stabilizer states can still be entangled: across every nontrivial cut of GHZ the two squared Schmidt weights are $1/2,1/2$. For a circuit with $g$ local gates and $m$ measurements, the corresponding worst-case bit operation count is $O(gn+mn^2)$. Actual timing depends on the circuit, arithmetic layout, and hardware.`,
      workedExample: String.raw`Initialize $\lvert0\rangle^{\otimes n}$, apply $H$ to wire 1, then apply $\mathrm{CNOT}_{1\to j}$ for $j=2,\ldots,n$. The resulting generators are $X_1\cdots X_n$ and $Z_1Z_j$ for every other wire. There are $n$ gates and $O(n^2)$ tableau row updates. A joint computational-basis shot returns the all-zero or all-one string with equal probability.`
    },
    additions: {
      exercise:
        'State the tableau size for a single GHZ shot separately from the cost of producing many samples.'
    }
  },
  33: {
    content: {
      theory: String.raw`### 1. Quantum Intermediate Representation (IR)

An intermediate representation records wire indices, gates, measurement targets and classical control in execution order. Validate it before selecting a representation and keep output requirements explicit.

### 2. Multi-Engine Simulation Routing

Apply eligibility and resource checks first. Route joint stabilizer samples to a tableau when the operations and input are supported. Use a dense statevector when amplitudes are needed and it fits the memory budget. A stabilizer-decomposition backend can help with few non-Clifford gates, subject to its supported outputs, memory and target error. Tensor methods need a credible bond or contraction estimate. A router can report that no eligible engine fits the request.`,
      workedExample: String.raw`For forty wires a complex-double statevector consumes $16\,\mathrm{TiB}$. A dense stabilizer tableau has $80\cdot81=6{,}480$ payload bits. A Clifford-only sampling request is eligible for the tableau. With ten $T$ gates it is not. If a decomposition backend supports the requested output and its cost estimate fits, use that backend. The count of $T$ gates alone supplies neither a timing nor an exact branch count.`,
      codeWalkthrough:
        'Return the chosen route together with the eligibility and budget checks that passed. If several routes fit, compare estimated cost on the same requested output. Report unsupported outputs or exhausted resource limits explicitly.'
    }
  },
  34: {
    content: {
      theory: String.raw`### 1. The Pauli Frame Concept

A frame represents the Pauli relating one simulated shot to a reference trajectory. Draw one ideal stabilizer trajectory and record its measurement bits. Different shots need independent gate faults and independent Born outcomes at random measurements.

### 2. Deferring Gate Conjugation

Propagate the frame through each Clifford by conjugation and multiply in sampled Pauli faults. At a $Z_a$ measurement the pre-measurement readout flip is the frame's $x_a$ bit. If the reference measurement is random, sample an independent fair output bit for the shot, then add the old reference tableau's signed pivot label to the frame exactly when necessary to align its projected branch with that outcome. The old pivot anticommutes with $Z_a$, so toggling it toggles the readout flip and maps the two reference branches. For a deterministic reference measurement, the recorded bit XOR the frame's $x_a$ is already the correct shot output.

### 3. Batched Multi-Shot SIMD Parallelism

Store one frame bit per shot in each bit lane. For an initially prepared or reset $\lvert0\rangle$ wire, clear its $X$ frame data and sample an independent random $Z$ frame bit if using the equivalent randomized-frame formulation. An exact reset discards the previous wire frame after projection and prepares the requested state. In that formulation always return the reference bit XOR the propagated $X$ frame bit at a $Z$ readout. In the explicit-branch formulation above, the independent random outcomes and pivot alignment provide the randomization. Use one formulation consistently. See [Stim, section 2.3](https://arxiv.org/abs/2103.02202).`,
      codeWalkthrough:
        'For an explicit-branch batch, precompute reference bits and old pivot labels for random measurements. At a random Z readout, draw one random bit per lane. XOR the pivot mask into lanes whose predicted bit differs. At a deterministic readout, XOR the reference bit with the X mask. After a physical reset, remove the local frame after processing the measurement and apply the reset noise channel if present.'
    },
    additions: {
      workedExample: String.raw`A noiseless $H$ followed by a $Z$ readout must still output independent fair bits. With reset-frame randomization, the initial random $Z$ bit becomes an $X$ bit under $H$. XORing that bit with the fixed reference outcome produces both results.`
    }
  },
  35: {
    replacements: {
      theory: [
        [
          String.raw`By pushing single-qubit gates through multi-qubit CNOT networks and canceling adjacent pairs, peephole compilation frequently achieves a $20\% - 40\%$ reduction in physical circuit depth without changing the unitary evolution.`,
          'Depth savings depend on the input circuit, allowed rewrites, and layout.'
        ]
      ]
    },
    content: {
      codeWalkthrough:
        'For adjacent inverse cancellations, scan once and keep a stack of surviving gates. If the next gate cancels the top gate on the same ordered wires, pop it. Otherwise push it. Each gate is pushed and popped at most once. Track phase explicitly for exact-unitary rewrites.'
    },
    additions: {
      theory: String.raw`Since $T=\operatorname{diag}(1,e^{i\pi/4})$, the exact identity is $XTX=e^{i\pi/4}T^\dagger$. A rewrite that drops the scalar preserves projective action. L22 supplies the conjugation rules that justify related gate moves.`
    }
  },
  36: {
    content: {
      theory: String.raw`### 1. Slicing and memory

A complex-double statevector for forty qubits needs $2^{40}\cdot16=16$ TiB. Slicing by fixed high bits can reduce working memory. Gates mixing a sliced wire require reading the affected slices together or reorganizing them.

### 2. Tensor networks

Each gate is a tensor with input and output indices. A contraction eliminates internal indices. Its memory and work depend on contraction order and intermediate widths. L66 introduces a concrete tensor-network representation with a tractable width parameter.

### 3. Feynman Path Sums for Single Amplitudes

For a target basis amplitude, insert resolutions of identity between gates and sum products of transition entries over intermediate basis strings. This computes one amplitude and its cost depends on which paths contribute.`,
      workedExample: String.raw`Start in $\lvert00\rangle$. Apply $H$ on the left wire, then $\mathrm{CNOT}$ controlled by that wire. For $\lvert11\rangle$, the only contributing intermediate basis state is $\lvert10\rangle$. Its transition amplitudes are $1/\sqrt2$ and $1$, so the output amplitude is $1/\sqrt2$.`
    }
  }
};

import type { Lecture } from './curriculum';

type LessonRevision = Pick<Lecture, 'question' | 'content' | 'codeReferences' | 'implementationChoices'> &
  Partial<Pick<Lecture, 'prerequisites' | 'paperReferences' | 'theoreticalCitations'>>;
function lesson(
  question: string,
  motivation: string,
  theory: string,
  workedExample: string,
  exercise: string,
  reflectionPrompts: string[]
): LessonRevision {
  return {
    question,
    content: {
      motivation,
      theory,
      workedExample,
      exercise,
      reflectionPrompts,
      codeWalkthrough: ''
    },
    codeReferences: [],
    implementationChoices: []
  };
}

// Content revision 4. Keep the original record intact for drawings anchored to earlier text.
export const FOUNDATION_LESSONS: Record<string, LessonRevision> = {
  'L01-sets-maps-proofs': lesson(
    'When does a function have an inverse?',
    'A precise domain and codomain determine what a function claims to do. Distinguishing an image from a codomain prevents mistakes in proofs about inverses and composition.',
    String.raw`### Sets and maps
A set contains distinct elements. The Cartesian product $A\times B$ consists of ordered pairs $(a,b)$ with $a\in A$ and $b\in B$. A function $f:A\to B$ assigns exactly one output to each input. Its image is $f(A)=\{f(a):a\in A\}$, which need not equal $B$.

### Inverses and composition
A map is **injective** when $f(x)=f(y)$ implies $x=y$, **surjective** when every member of $B$ is an output, and **bijective** when both hold. A bijection has a unique inverse $f^{-1}:B\to A$ satisfying both inverse identities. A bijection between sets is not automatically an isomorphism of groups or vector spaces: those require preservation of additional structure.

For $f:A\to B$ and $g:B\to C$, composition is $(g\circ f)(a)=g(f(a))$. Composition of injective maps is injective: equality of composite outputs first gives equality of $f$ outputs by injectivity of $g$, then equality of inputs by injectivity of $f$.

### Proof choices
To prove an implication, start from its hypotheses. To disprove a universal claim, give one counterexample. For a statement indexed by natural numbers, induction requires a base case and a step from $n$ to $n+1$. Always check that every expression is defined before manipulating it.`,
    String.raw`Let $f:\mathbb Z\to\mathbb Z$ be $f(n)=2n$. If $2n=2m$, cancellation gives $n=m$, so $f$ is injective. It is not surjective because no integer maps to $1$. Changing the codomain to the even integers $2\mathbb Z$ makes the same rule bijective, with inverse $k\mapsto k/2$. Thus the rule alone does not determine whether a map is invertible.`,
    String.raw`1. List $\{0,1\}\times\{a,b,c\}$.
2. Classify $n\mapsto n+3$ from $\mathbb Z$ to itself and prove your answer.
3. Give two non-surjective maps whose composition cannot be surjective, then explain why the second map's codomain matters.
4. Prove that the composition of two surjections is surjective.`,
    [
      'Which part of your inverse proof uses surjectivity?',
      'How does changing the codomain change the claim?'
    ]
  ),
  'L02-groups-modular-arithmetic': lesson(
    'Which operations form groups, and how do inverses behave?',
    'Groups capture reversible composition. Integer addition, permutations, and modular arithmetic provide concrete examples before more specialized applications.',
    String.raw`### Monoids and groups
A monoid is a set with an associative operation and a two-sided identity. A group additionally gives every element a two-sided inverse. Closure is part of specifying an operation $G\times G\to G$. A group is abelian if all pairs commute. Associativity does not imply commutativity.

Inverses are unique: if $b$ and $c$ are both inverses of $a$, then $b=b(ac)=(ba)c=c$. The inverse of a product reverses its order: $(ab)^{-1}=b^{-1}a^{-1}$.

### Residue classes
Write $a\equiv b\pmod n$ when $n$ divides $a-b$. Addition of residue classes is well-defined because replacing representatives changes the sum by a multiple of $n$. The classes $\mathbb Z/n\mathbb Z$ form an abelian group under addition.

Under multiplication, only the **units** form a group. The residue of $a$ is a unit precisely when $\gcd(a,n)=1$. An integer inverse can be obtained from Bézout's identity. The nonzero residues modulo a composite number need not be units.`,
    String.raw`Modulo $8$, the units are $1,3,5,7$. Their squares are all congruent to $1$, so each is its own inverse. The residue $2$ is nonzero but not a unit: every product $2k$ is even and cannot be congruent to $1$. In the additive group, however, $2$ does have an inverse, namely $6$. The operation must always be named.`,
    String.raw`1. Construct the addition table modulo $4$ and identify all inverses.
2. Find the multiplicative units modulo $10$.
3. Verify $(ab)^{-1}=b^{-1}a^{-1}$ directly using group axioms.
4. Give a monoid that is not a group, and explain which axiom fails.`,
    [
      'Why must the order reverse when inverting a product?',
      'Why can a nonzero residue fail to have a multiplicative inverse?'
    ]
  ),
  'L03-finite-fields-gf2-gfp': lesson(
    'Why does arithmetic modulo a prime form a field?',
    'A field supports addition, subtraction, multiplication, and division by nonzero elements. Finite fields allow exact linear algebra and provide the scalars used in coding and discrete mathematics.',
    String.raw`### Field axioms
A field has an abelian additive group, an abelian multiplicative group on its nonzero elements, and distributivity. The identities $0$ and $1$ are distinct.

### Prime fields
For prime $p$, every nonzero residue $a$ has $\gcd(a,p)=1$. Bézout's identity supplies an inverse modulo $p$, so $\mathbb F_p=\mathbb Z/p\mathbb Z$ is a field. If $n$ is composite, nonzero zero divisors prevent the residue ring modulo $n$ from being a field.

In $\mathbb F_2$, addition is XOR and multiplication is AND on individual bits. Every element is its own additive inverse. In odd characteristic, $-1$ and $1$ differ. Never transfer a characteristic-two simplification to another field without checking it.

Finite fields also exist with $p^k$ elements. For $k>1$ these are constructed using irreducible polynomials; they are not the integers modulo $p^k$.`,
    String.raw`Solve $3x+2=1$ in $\mathbb F_5$. Subtracting $2$ gives $3x=4$. Since $3\cdot2=6\equiv1\pmod5$, multiply by $2$ to obtain $x=8\equiv3$. Check: $3\cdot3+2=11\equiv1$. Modulo $6$, the analogous equation $3x=4$ has no solution because the multiples of $3$ are only $0$ and $3$.`,
    String.raw`Build addition and multiplication tables for $\mathbb F_3$. Find the inverse of every nonzero element of $\mathbb F_7$. Show that $\mathbb Z/9\mathbb Z$ is not a field by finding a nonzero zero divisor. Explain why this does not rule out a field with nine elements.`,
    ['Where does primality enter the inverse argument?', 'Which identities depend on characteristic two?']
  ),
  'L04-vector-spaces-finite-fields': lesson(
    'How do bases determine dimension and the number of vectors?',
    'A basis turns an abstract vector space into coordinates without changing its linear structure. Finite fields make both dimension and counting especially concrete.',
    String.raw`### Linear combinations and subspaces
A vector space over a field $F$ has vector addition and scalar multiplication satisfying the usual compatibility and distributive laws. A subspace contains zero and is closed under both operations. A linear combination of $v_1,\ldots,v_k$ is $\sum_i a_i v_i$ with $a_i\in F$.

### Independence and bases
The vectors are independent if $\sum_i a_i v_i=0$ forces every coefficient to vanish. Their span is the set of all linear combinations. A basis is both independent and spanning, so every vector has a unique coordinate list. All bases of a finite-dimensional space have the same size, its dimension.

A $d$-dimensional space over a field with $q$ elements has $q^d$ vectors because each coordinate has $q$ choices. Dimension is not the number of vectors. Row reduction must use arithmetic in the chosen field.`,
    String.raw`In $\mathbb F_2^3$, let $u=(1,0,1)$ and $v=(0,1,1)$. Their span is $\{(0,0,0),u,v,(1,1,0)\}$. If $au+bv=0$, the first two coordinates force $a=b=0$, so they form a basis of a two-dimensional subspace. This subspace is exactly the solutions of $x_1+x_2+x_3=0$.`,
    String.raw`List the span of $(1,1)$ in $\mathbb F_3^2$. Decide whether $(1,1)$ and $(1,2)$ are independent over $\mathbb F_3$. Find a basis for the solutions of $x_1+x_2+x_3=0$ over $\mathbb F_3$, and count the solutions.`,
    ['Why does independence guarantee unique coordinates?', 'Why does a subspace always contain zero?']
  ),
  'L05-linear-maps-matrices': lesson(
    'How does a linear map become a matrix after choosing bases?',
    'Linear maps are defined independently of coordinates. Matrices describe those maps relative to bases and make kernels, images, and composition computable.',
    String.raw`### Linear maps
A map $T:V\to W$ is linear when $T(av+bw)=aT(v)+bT(w)$ for all vectors and scalars. Its kernel consists of vectors sent to zero; its image consists of all outputs. Both are subspaces.

### Matrix representation
Choose bases $v_1,\ldots,v_n$ and $w_1,\ldots,w_m$. The $j$th column of the representing matrix is the coordinate vector of $T(v_j)$. Matrix multiplication represents composition in the same order as applying the rightmost map first. A change of basis changes the representing matrix, not the underlying map.

### Rank and nullity
For a finite-dimensional domain, $\dim V=\dim\ker T+\dim\operatorname{im}T$. To see why, extend a basis of the kernel to a basis of $V$. The images of the added basis vectors form a basis of the image. Thus injectivity is equivalent to a zero kernel. For a linear endomorphism of a finite-dimensional space, injectivity and surjectivity are equivalent.`,
    String.raw`Over $\mathbb F_3$, consider $T(x,y)=(x+y,x+y)$. Its matrix has both rows $(1,1)$. The kernel is the span of $(1,2)$ and the image is the span of $(1,1)$. Both dimensions are one, giving rank plus nullity $1+1=2$. The map is not invertible, despite having a square matrix.`,
    String.raw`Find the matrix of $S(x,y)=(x,2y)$ over $\mathbb F_3$. Compute $ST$ and $TS$ using the worked example and explain their difference. Find a basis for the kernel of each composite. Verify rank–nullity.`,
    [
      'Why do matrix columns contain images of basis vectors?',
      'Which parts of rank–nullity require finite dimension?'
    ]
  ),
  'L06-bilinear-symplectic-forms': lesson(
    'What does it mean for a bilinear form to be alternating and nondegenerate?',
    'Bilinear forms compare pairs of vectors. Separating their defining properties makes symplectic geometry understandable over both real and finite fields.',
    String.raw`### Bilinearity
A form $B:V\times V\to F$ is linear in each argument separately. In coordinates it can be written $B(u,v)=u^T Jv$. Its radical consists of vectors $u$ with $B(u,v)=0$ for every $v$. Nondegeneracy means this radical is zero; for a square coordinate matrix it means $J$ is invertible.

### Alternating forms
A form is alternating if $B(v,v)=0$ for every $v$. Expanding $B(u+v,u+v)$ gives $B(u,v)=-B(v,u)$. In characteristic two, the minus sign disappears, but alternation still requires a zero diagonal. Symmetry alone is not sufficient.

A symplectic form is alternating and nondegenerate. A symplectic basis puts its matrix into blocks $J=\begin{pmatrix}0&I\\-I&0\end{pmatrix}$. Such a finite-dimensional space has even dimension: one can choose a pair with nonzero pairing, split off their nondegenerate plane, and repeat on its orthogonal complement.`,
    String.raw`On $F^2$ let $B((x,y),(a,b))=xb-ya$. Then $B(v,v)=xy-yx=0$. If $B((x,y),(a,b))=0$ for all $(a,b)$, use $(0,1)$ and $(1,0)$ to obtain $x=y=0$. Thus the form is nondegenerate over any field, including characteristic two.`,
    String.raw`Compute the form on $(1,2)$ and $(3,1)$ over $\mathbb F_5$. Find all vectors orthogonal to $(1,0)$. Over $\mathbb F_2$, give a symmetric matrix whose form is not alternating.`,
    [
      'Why is the zero diagonal condition essential in characteristic two?',
      'How does nondegeneracy differ from positive definiteness?'
    ]
  ),
  'L07-symplectic-group-sp2n': lesson(
    'Which invertible maps preserve a symplectic form?',
    'The symplectic group is defined by a preservation law. Understanding this law directly gives closure, inverses, and concrete tests for membership.',
    String.raw`### Preservation law
Fix a nondegenerate alternating matrix $J$. The symplectic group is
$$\operatorname{Sp}(2n,F)=\{M\in\operatorname{GL}(2n,F):M^TJM=J\}.$$
This equation says that $B(Mu,Mv)=B(u,v)$ for every pair. The identity preserves $J$. If $M$ and $N$ preserve it, then $(MN)^TJ(MN)=N^T(M^TJM)N=J$. Rearranging the equation gives $M^{-1}=J^{-1}M^TJ$, and the inverse also preserves the form.

### Symplectic planes
For a $2\times2$ matrix with the standard alternating $J$, direct multiplication gives $M^TJM=(\det M)J$. Thus in dimension two, symplectic matrices are exactly determinant-one matrices. This equivalence does not extend to arbitrary even dimension: preserving volume alone is weaker than preserving the entire form.`,
    String.raw`Let $M=\begin{pmatrix}1&t\\0&1\end{pmatrix}$. Its determinant is one, so it preserves the standard form on a plane. Its inverse replaces $t$ with $-t$. Over $\mathbb F_5$, choosing $t=2$ gives inverse parameter $3$. Multiply the matrices and verify both the inverse and preservation identities.`,
    String.raw`Over $\mathbb F_3$, test $\begin{pmatrix}1&1\\1&2\end{pmatrix}$ and $\begin{pmatrix}1&0\\0&2\end{pmatrix}$ for membership. Derive $M^{-1}=J^{-1}M^TJ$ from the preservation equation. Explain why a non-invertible map cannot preserve a nondegenerate form.`,
    [
      'Which property makes the preservation set a group?',
      'Why is determinant one insufficient in higher dimensions?'
    ]
  ),
  'L08-eigenvalues-without-diagonalization': {
    ...lesson(
      'What can traces and characteristic polynomials reveal without an eigenbasis?',
      'Not every matrix is diagonalizable. Spectral invariants still constrain its eigenvalues, count multiplicities, and distinguish similarity classes.',
      String.raw`### Eigenvalues and characteristic polynomials
An eigenvalue satisfies $Av=\lambda v$ for some nonzero $v$. Equivalently, $\det(\lambda I-A)=0$. The characteristic polynomial has degree $n$ for an $n\times n$ matrix. Its roots may require extending the scalar field.

### Similarity invariants
If $B=P^{-1}AP$, then $A$ and $B$ have the same characteristic polynomial, determinant, and trace. Over an algebraic closure, trace is the sum and determinant the product of eigenvalues counted with algebraic multiplicity, whether or not the matrix has an eigenbasis.

The minimal polynomial is the monic polynomial of least degree annihilating $A$. A matrix is diagonalizable over a field exactly when its minimal polynomial splits there into distinct linear factors. Equal traces or determinants alone do not imply similarity. In positive characteristic, identities involving division by integers need additional care.`,
      String.raw`The matrices $I=\begin{pmatrix}1&0\\0&1\end{pmatrix}$ and $A=\begin{pmatrix}1&1\\0&1\end{pmatrix}$ have the same characteristic polynomial $(t-1)^2$, trace, and determinant. But $A-I\ne0$ while $(A-I)^2=0$. The minimal polynomials are $t-1$ and $(t-1)^2$, respectively. Only the first is diagonalizable.`,
      String.raw`Compute characteristic and minimal polynomials for $\begin{pmatrix}0&-1\\1&0\end{pmatrix}$ over $\mathbb R$. Decide whether it is diagonalizable over $\mathbb R$ and over $\mathbb C$. Explain which invariant distinguishes the two matrices in the worked example.`,
      [
        'What information is lost when only trace and determinant are retained?',
        'Why does the scalar field matter for diagonalization?'
      ]
    ),
    prerequisites: ['L05-linear-maps-matrices']
  },
  'L09-complex-inner-products-hilbert': lesson(
    'How do inner products define lengths, orthogonality, and projections?',
    'Inner products add geometry to vector spaces. They support approximation by orthogonal projection and stable coordinate systems for numerical algorithms.',
    String.raw`### Complex inner products
Use the convention $\langle u,v\rangle=u^*v$, conjugate-linear in the first argument and linear in the second. Conjugate symmetry and positive definiteness imply a norm $\|v\|=\sqrt{\langle v,v\rangle}$. Without conjugation, a complex bilinear expression need not be positive.

### Orthogonality and projections
Vectors are orthogonal when their inner product is zero. For a unit vector $q$, the projection of $v$ onto its span is $q\langle q,v\rangle$. The residual is orthogonal to $q$. An orthonormal family gives the projection onto its span by summing these terms. Gram–Schmidt constructs such a family from independent input vectors, although finite-precision implementations need care.

### Completeness
A Hilbert space is an inner-product space complete in its induced norm: every Cauchy sequence converges in the space. Finite-dimensional real or complex inner-product spaces are complete. Infinite-dimensional spaces require this additional condition. Inner products in this sense use $\mathbb R$ or $\mathbb C$, not an ordering or positivity on finite fields.`,
    String.raw`Take $q=(1,i)/\sqrt2$ and $v=(1,0)$ in $\mathbb C^2$. Then $\langle q,v\rangle=1/\sqrt2$ and the projection is $(1,i)/2$. The residual $(1,-i)/2$ is orthogonal to $q$ because $\langle q,(1,-i)/2\rangle=(1+(-i)(-i))/(2\sqrt2)=0$.`,
    String.raw`Compute norms and inner products for $(1,i)$ and $(i,1)$. Apply Gram–Schmidt to $(1,1)$ and $(1,0)$ over $\mathbb R$. Verify that the squared norm of a vector is the sum of the squared norms of its projection and orthogonal residual.`,
    ['Where is complex conjugation necessary?', 'What does completeness add in infinite dimension?']
  )
};

Object.assign(FOUNDATION_LESSONS, {
  'L24-symplectic-transvections': {
    ...lesson(
      'How can a rank-one update preserve an alternating form?',
      'A transvection modifies a vector along one fixed direction while preserving the symplectic pairing. It is a useful elementary transformation in algebraic algorithms.',
      String.raw`Fix a vector $v$ in a symplectic space and a scalar $c$. Define $T_{v,c}(x)=x+cB(v,x)v$. Because $B(v,v)=0$, its inverse is $T_{v,-c}$. Expanding the form gives
$$B(T_{v,c}x,T_{v,c}y)=B(x,y)+cB(v,y)B(x,v)+cB(v,x)B(v,y)=B(x,y).$$
The cross terms cancel by alternation; the remaining quadratic term vanishes. The map fixes every vector orthogonal to $v$ and changes other vectors by a multiple of $v$.

In coordinates, $T=I+cvv^TJ$ under the convention $B(v,x)=v^TJx$. Its difference from the identity has rank at most one. Products of elementary symplectic transformations support elimination algorithms. To implement a decomposition, track which pairings and already-fixed basis vectors each step must preserve; a generic row operation need not be symplectic.`,
      String.raw`On $\mathbb F_5^2$ use $B((a,b),(x,y))=ay-bx$. Taking $v=(1,0)$ and $c=2$ yields $T(x,y)=(x+2y,y)$. Its matrix is $\begin{pmatrix}1&2\\0&1\end{pmatrix}$ and its inverse has upper-right entry $3$. Check preservation on the two standard basis vectors and extend by bilinearity.`,
      String.raw`Derive the inverse formula directly. Prove that every vector in $v^\perp$ is fixed. Compute $T_{v,c}T_{v,d}$ and decide when it is the identity. Repeat the argument in characteristic two, keeping the alternating condition explicit.`,
      ['Why does the rank-one update not change pairings?', 'Which directions are fixed?']
    ),
    prerequisites: ['L07-symplectic-group-sp2n']
  },
  'L41-partition-refinement-backtracking': {
    ...lesson(
      'How does partition refinement reduce graph-isomorphism search?',
      'A graph automorphism is a permutation of vertices preserving adjacency. Refining indistinguishable vertex classes can reduce the number of candidate permutations without discarding valid symmetries.',
      String.raw`Start with a finite graph and a partition of its vertices, for example by vertex color or degree. Refine each cell by the vector of neighbor counts into all current cells. Repeat until no cell splits. Every color-preserving automorphism preserves every resulting cell, since it preserves both adjacency and the initial partition.

A stable partition need not identify a unique labeling or all automorphism orbits. If a cell still has multiple vertices, a search can individualize one candidate vertex, refine again, and branch on the remaining choices. Backtracking abandons branches inconsistent with established adjacency constraints. At a discrete partition, verify the proposed permutation against every edge and color.

Refinement is deterministic once the cell and vertex orders are fixed. It is a pruning step, not a general polynomial-time solution: highly regular graphs can retain large ambiguous cells and require extensive search.`,
      String.raw`For the path $a-b-c-d$, degrees first split vertices into $\{a,d\}$ and $\{b,c\}$. Neighbor counts do not split these cells further. Individualizing $a$ distinguishes $b$, then $c$, then $d$. Choosing $d$ instead gives the reflected labeling, corresponding to the nontrivial automorphism.`,
      String.raw`Refine a five-vertex path from the degree partition. Compare the result with a five-cycle, where all vertices initially look alike. List the remaining branch choices and verify a rotation of the cycle explicitly preserves its edges.`,
      [
        'Why can refinement safely discard some permutations?',
        'Why does a stable partition not finish the search?'
      ]
    ),
    prerequisites: ['L01-sets-maps-proofs', 'L02-groups-modular-arithmetic']
  },
  'L45-krylov-subspaces-power-iteration': {
    ...lesson(
      'How can repeated matrix-vector products reveal an eigenvector?',
      'Large eigenvalue problems often permit matrix-vector products but make a full factorization impractical. Krylov spaces collect information from these products in a small subspace.',
      String.raw`The Krylov space is $\mathcal K_m(A,v)=\operatorname{span}\{v,Av,\ldots,A^{m-1}v\}$. Its dimension can be less than $m$ if these vectors become dependent.

Power iteration repeatedly normalizes $Av$. For a diagonalizable matrix with a unique eigenvalue of greatest magnitude, a nonzero initial component along its eigenvector eventually dominates. The asymptotic rate depends on the ratio of the next-largest magnitude to the largest. Missing the dominant component or having a tie can prevent convergence to the desired direction.

Shift-and-invert iteration applies $(A-\sigma I)^{-1}$ by solving a linear system at each step. An eigenvalue $\lambda$ becomes $1/(\lambda-\sigma)$, so an eigenvalue near the shift can become dominant. The shift must avoid an exact eigenvalue, and near-singularity makes the solves more demanding. Always check the residual $\|Ax-\mu x\|$ for the resulting approximation.`,
      String.raw`For $A=\operatorname{diag}(4,1)$ and $v=(1,1)$, $A^kv=(4^k,1)$. After normalization its direction approaches the first coordinate axis; the relative second component is $4^{-k}$. Starting with $(0,1)$ never finds the dominant eigenvector. This explicitly shows why the initial-vector hypothesis is needed.`,
      String.raw`Repeat the calculation for diagonal entries $4$ and $3$. Compare the rates. Choose a shift near $1$ for the original matrix and identify the dominant eigenvalue of its inverse transform. Explain the cost of a solve compared with a matrix-vector product.`,
      [
        'What happens when the dominant magnitudes tie?',
        'Why check a residual as well as changes between iterates?'
      ]
    ),
    prerequisites: ['L08-eigenvalues-without-diagonalization', 'L09-complex-inner-products-hilbert']
  },
  'L46-lanczos-three-term-recurrence': {
    ...lesson(
      'Why does a Hermitian matrix produce a three-term Krylov recurrence?',
      'Lanczos compresses a Hermitian eigenproblem onto an orthonormal Krylov basis. Its short recurrence follows from symmetry, rather than from any particular physical application.',
      String.raw`Let $A=A^*$, choose a unit vector $q_1$, and set $q_0=0$, $\beta_0=0$. At step $j$, compute
$$w=Aq_j-\beta_{j-1}q_{j-1},\qquad\alpha_j=q_j^*w,$$
$$w\leftarrow w-\alpha_jq_j,\qquad\beta_j=\|w\|,\qquad q_{j+1}=w/\beta_j.$$
If $\beta_j=0$, stop: the current Krylov subspace is invariant in exact arithmetic. Hermitian symmetry and the preceding orthogonalization imply that $Aq_j$ is orthogonal to every earlier basis vector except $q_{j-1}$ and $q_j$. This yields a real symmetric tridiagonal projected matrix $T_m$.

The eigenvalues of $T_m$ are Ritz approximations. If $T_my=\theta y$ and $\|y\|=1$, the residual of $Q_my$ has norm $|\beta_m e_m^Ty|$. Finite precision can destroy orthogonality, so the short recurrence alone is not a complete numerical stability strategy.`,
      String.raw`For $A=\operatorname{diag}(1,3)$ and $q_1=(1,1)/\sqrt2$, $\alpha_1=2$, $\beta_1=1$, and $q_2=(-1,1)/\sqrt2$. The second diagonal coefficient is $2$ and the next residual is zero. Thus $T_2=\begin{pmatrix}2&1\\1&2\end{pmatrix}$ has eigenvalues $1$ and $3$, exactly the eigenvalues of $A$.`,
      String.raw`Verify each arithmetic step of the example. Derive the Ritz residual formula from $AQ_m=Q_mT_m+\beta_mq_{m+1}e_m^T$. Explain why the same three-term derivation does not apply to an arbitrary nonsymmetric matrix.`,
      ['Where is Hermitian symmetry used?', 'What does exact breakdown mean geometrically?']
    ),
    prerequisites: ['L45-krylov-subspaces-power-iteration']
  },
  'L48-convergence-precision-architecture': {
    ...lesson(
      'How can loss of orthogonality create misleading Ritz values?',
      'A mathematically correct recurrence can drift in floating-point arithmetic. Understanding the error mechanisms makes convergence checks and reorthogonalization meaningful.',
      String.raw`Exact Lanczos basis vectors are orthogonal, but rounding errors reintroduce components along earlier directions. Once an eigenvector has converged, these small components can grow and produce repeated Ritz values, often called ghosts. Repetition alone does not establish an eigenvalue's true multiplicity.

Full reorthogonalization subtracts projections onto all previous basis vectors; a second pass may be necessary. Selective or partial approaches reduce work by monitoring loss of orthogonality or reorthogonalizing only selected directions. Restarting limits storage but changes the search space and needs a retention strategy.

Assess a candidate with a residual and an orthogonality check. For Hermitian $A$ and unit $x$, some eigenvalue lies within $\|Ax-\theta x\|$ of $\theta$. Identifying which eigenvalue, or bounding the eigenvector error, additionally requires spectral separation. Tolerances should reflect operator scale, input precision, and the desired accuracy.`,
      String.raw`Suppose two normalized approximate eigenvectors both have small residuals at nearly the same Ritz value. If their inner product has magnitude close to one, they are nearly the same direction; they do not demonstrate a two-dimensional eigenspace. Project the second vector orthogonally to the first and inspect the remaining norm before interpreting multiplicity.`,
      String.raw`Run the same small symmetric eigenproblem in two precisions. Record residual norms and $\|Q^*Q-I\|$. Compare a short recurrence with full reorthogonalization. State a stopping tolerance relative to the matrix norm and justify it.`,
      [
        'Why can a small residual coexist with a wrong multiplicity estimate?',
        'What extra information bounds eigenvector error?'
      ]
    ),
    prerequisites: ['L46-lanczos-three-term-recurrence']
  }
} satisfies Record<string, LessonRevision>);

const algebraReference = {
  title: 'Algebra',
  authors: 'Michael Artin',
  citation: 'Second edition (2010)',
  relevantSections: 'Vector spaces and linear transformations'
};
const linearReference = {
  title: 'Linear Algebra Done Right',
  authors: 'Sheldon Axler',
  citation: 'Fourth edition (2024)',
  arxivUrl: 'https://linear.axler.net/LADR4e.pdf',
  relevantSections: 'Linear maps, eigenvalues, and inner product spaces'
};
const formsReference = {
  title: 'Bilinear Forms',
  authors: 'Keith Conrad',
  citation: 'Author lecture notes',
  arxivUrl: 'https://kconrad.math.uconn.edu/blurbs/linmultialg/bilinearform.pdf',
  relevantSections: 'Sections 2, 3, and 5: coordinate matrices, nondegeneracy, and symplectic bases'
};
FOUNDATION_LESSONS['L04-vector-spaces-finite-fields'].paperReferences = [algebraReference];
FOUNDATION_LESSONS['L05-linear-maps-matrices'].paperReferences = [algebraReference];
for (const id of ['L06-bilinear-symplectic-forms', 'L07-symplectic-group-sp2n']) {
  FOUNDATION_LESSONS[id].paperReferences = [formsReference];
  FOUNDATION_LESSONS[id].theoreticalCitations = [
    {
      formulaName: 'Alternating form and preservation',
      expression: String.raw`B(u,v)=u^T Jv,\quad M^TJM=J`,
      source: 'Keith Conrad, Bilinear Forms',
      theoremOrEquation: 'Coordinate representation and symplectic bases',
      doiOrUrl: formsReference.arxivUrl
    }
  ];
}
FOUNDATION_LESSONS['L08-eigenvalues-without-diagonalization'].theoreticalCitations = [
  {
    formulaName: 'Characteristic polynomial',
    expression: String.raw`p_A(t)=\det(tI-A)`,
    source: 'Hoffman & Kunze, Linear Algebra (2nd ed., 1971)',
    theoremOrEquation: 'Characteristic polynomials and eigenvalues'
  }
];
FOUNDATION_LESSONS['L09-complex-inner-products-hilbert'].paperReferences = [linearReference];
FOUNDATION_LESSONS['L09-complex-inner-products-hilbert'].theoreticalCitations = [
  {
    formulaName: 'Cauchy–Schwarz inequality',
    expression: String.raw`|\langle u,v\rangle|\leq\|u\|\,\|v\|`,
    source: 'Sheldon Axler, Linear Algebra Done Right (4th ed., 2024)',
    theoremOrEquation: 'Section 6A: Inner products and norms',
    doiOrUrl: linearReference.arxivUrl
  }
];
FOUNDATION_LESSONS['L24-symplectic-transvections'].paperReferences = [formsReference];
FOUNDATION_LESSONS['L24-symplectic-transvections'].theoreticalCitations = [
  {
    formulaName: 'Symplectic transvection',
    expression: String.raw`T_{v,c}(x)=x+cB(v,x)v`,
    source: 'Artin, Geometric Algebra (1957)',
    theoremOrEquation: 'Symplectic transformations'
  }
];

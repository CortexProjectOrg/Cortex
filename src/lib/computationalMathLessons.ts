import type { PaperReference } from './curriculum';
import { studyPack } from './curriculumLesson';

const NUMERICAL_ANALYSIS: PaperReference = {
  title: 'Accuracy and Stability of Numerical Algorithms',
  authors: 'Nicholas J. Higham',
  citation: 'SIAM, 2nd edition, 2002',
  doi: '10.1137/1.9780898718027',
  sourceUrl: 'https://nhigham.com/accuracy-and-stability-of-numerical-algorithms/',
  relevantSections: 'Floating-point arithmetic, perturbation theory, and least squares'
};

export const COMPUTATIONAL_MATH = studyPack(
  {
    id: 'computational-mathematics',
    title: 'Computational mathematics',
    description: 'Floating-point error, conditioning, least squares, and fast Fourier transforms.',
    color: 'sage',
    symbol: 'ε',
    prerequisites: ['linear-algebra', 'mathematical-proofs']
  },
  85,
  [
    {
      id: 'L85-floating-point-cancellation',
      title: 'Floating-Point Error and Cancellation',
      question: 'How can two algebraically equivalent formulas produce very different results?',
      prerequisites: ['L05-linear-maps-matrices'],
      durationMinutes: 35,
      reference: NUMERICAL_ANALYSIS,
      formula: {
        name: 'Relative error of one rounded operation',
        expression: String.raw`\operatorname{fl}(z)=z(1+\delta),\quad|\delta|\le u`,
        context: 'Round to nearest with a normal result in range'
      },
      overview:
        'Follow rounding through a subtraction and use an algebraic reformulation to preserve a small result.',
      theory: String.raw`### Track the rounded inputs to a subtraction

A floating-point format has a bounded exponent and a fixed number of significand digits. The spacing between representable numbers increases with magnitude. For round-to-nearest arithmetic with a normal result in range, one rounded operation satisfies $\operatorname{fl}(z)=z(1+\delta)$ with $|\delta|\le u$, the unit roundoff. In binary64, $u=2^{-53}$.

If $a$ and $b$ already have errors $\Delta a$ and $\Delta b$, their computed difference before the final rounding is $(a-b)+(\Delta a-\Delta b)$. When $|a-b|$ is much smaller than the inputs, modest absolute input errors can dominate the relative error of the difference. In particular, an exact subtraction of the stored inputs cannot restore digits lost in earlier operations.

### Reformulate before rounding

Multiply $\sqrt{1+x}-1$ by its conjugate to obtain $x/(\sqrt{1+x}+1)$ for $x\ge-1$. For small positive $x$ the new denominator is close to 2 and the numerator retains $x$. Both expressions have the same exact value. They perform different rounded operations.`,
      example: String.raw`### Compute with four significant digits

For $x=10^{-6}$, rounding $1+x$ gives $1.000$. The direct formula then returns zero. In the rationalized form the rounded denominator is $2.000$, so the result is $5.000\times10^{-7}$. The exact value is approximately $4.99999875\times10^{-7}$. The small input still affects the final division even though it was rounded away in the square root.`,
      exercise: String.raw`**Test another evaluation order.** In four-digit decimal arithmetic, compare $(10^4+1)-10^4$ with $(10^4-10^4)+1$.

**Check.** The first gives 0 because the nearest four-digit value of $10001$ is $10000$. The reordered expression gives 1.`
    },
    {
      id: 'L86-conditioning-linear-solves',
      title: 'Conditioning and Linear Solve Residuals',
      question: 'When can a tiny residual hide a large error in the solution?',
      prerequisites: ['L85-floating-point-cancellation', 'L09-complex-inner-products-hilbert'],
      durationMinutes: 45,
      reference: NUMERICAL_ANALYSIS,
      formula: {
        name: 'Relative forward-error bound',
        expression: String.raw`\frac{\|\widehat x-x\|}{\|x\|}\le\kappa(A)\frac{\|b-A\widehat x\|}{\|b\|}`,
        context: 'Nonsingular A, nonzero b, and compatible induced matrix norm'
      },
      overview:
        'A residual measures how well a proposed solution satisfies the equations. The condition number controls how much that residual can move the solution.',
      theory: String.raw`### Separate problem sensitivity from solver behavior

For nonsingular $A$, let $Ax=b$ and $r=b-A\widehat x$. Then $x-\widehat x=A^{-1}r$. Since $\|b\|\le\|A\|\|x\|$, the relative forward error is at most $\kappa(A)\|r\|/\|b\|$ when $b\ne0$, where $\kappa(A)=\|A\|\|A^{-1}\|$. In the Euclidean norm this is the ratio of largest to smallest singular value. The singular values are the nonnegative square roots of the eigenvalues of $A^\ast A$.

The residual also gives an exact perturbed problem, $A\widehat x=b-r$. A small $r$ says the result solves a nearby right-hand side. An ill-conditioned matrix can send that small perturbation into a large change in $x$.

### Avoid unnecessary amplification during elimination

Gaussian elimination with partial pivoting swaps in a largest-magnitude candidate in the current column before dividing by the pivot. This keeps the elimination multipliers at magnitude at most one. Assess stability separately from $\kappa(A)$, since pivoting changes the arithmetic without removing the problem's sensitivity. Large element growth can still degrade a solve.`,
      example: String.raw`### A nearly invisible second equation

Take $A=\operatorname{diag}(1,10^{-6})$, $b=(1,10^{-6})^\mathsf T$, and $\widehat x=(1,0)^\mathsf T$. The true solution is $(1,1)^\mathsf T$. The residual norm is $10^{-6}$, while the forward error norm is $1$. The condition number is $10^6$. A unit change along the second coordinate barely changes the measurements.`,
      exercise: String.raw`**Choose a pivot.** The first column of a two-row system is $(10^{-4},1)^\mathsf T$. Compare the multiplier when leaving the rows in place to the multiplier after swapping them.

**Check.** The magnitudes are $10^4$ and $10^{-4}$ respectively. Swapping reduces the scale of the row operation.`
    },
    {
      id: 'L87-least-squares-qr-svd',
      title: 'Least Squares with QR and SVD',
      question: 'How do you fit inconsistent data without squaring its condition number?',
      prerequisites: ['L86-conditioning-linear-solves'],
      durationMinutes: 50,
      reference: NUMERICAL_ANALYSIS,
      formula: {
        name: 'QR least-squares system',
        expression: String.raw`R\widehat x=Q^\ast b,\qquad A=QR,\quad Q^\ast Q=I`,
        context: 'Thin QR for a matrix with full column rank'
      },
      overview:
        'Project the data onto the range of the model, then recover coefficients with a triangular solve or a rank-aware SVD.',
      theory: String.raw`### Project before solving

For a tall matrix $A$, minimize $\|Ax-b\|_2^2$. At the minimum the residual is orthogonal to the columns of $A$. The normal equations are $A^\ast A x=A^\ast b$. For full column rank, the singular values of $A$ become squared eigenvalues of $A^\ast A$. Thus $\kappa_2(A^\ast A)=\kappa_2(A)^2$.

A thin QR factorization $A=QR$ gives an orthonormal basis $Q$ of the column space and an upper triangular $R$. Decompose $b=QQ^\ast b+(I-QQ^\ast)b$. The second part is orthogonal to every $Ax$, so minimizing the residual reduces to making $Rx=Q^\ast b$. Householder reflections are a practical way to compute QR.

### Inspect weakly constrained directions

For $A=U\Sigma V^\ast$, the contribution along a right singular vector $v_j$ is $(u_j^\ast b)/\sigma_j$ when $\sigma_j>0$. Small nonzero $\sigma_j$ amplify perturbations. The pseudoinverse skips zero singular values and returns the minimum-norm least-squares solution. Truncating noisy small singular values adds a modeling choice that trades fit for stability.`,
      example: String.raw`### Fit a line using centered inputs

For inputs $(-1,0,1)$ and outputs $(1,2,5)$, the intercept column $(1,1,1)$ and the slope column $(-1,0,1)$ are orthogonal. Projecting gives intercept $8/3$ and slope $2$. The fitted vector is $(2/3,8/3,14/3)$, leaving residual $(1,-2,1)/3$. Its dot product with each column is zero, which verifies the fit.`,
      exercise: String.raw`**Interpret tiny singular values.** For singular values $1$ and $10^{-4}$, what are the condition numbers of $A$ and $A^\ast A$?

**Check.** They are $10^4$ and $10^8$. The normal equations square the sensitivity even though the least-squares objective is the same.`
    },
    {
      id: 'L88-dft-fast-fourier-transform',
      title: 'The Discrete Fourier Transform and FFT',
      question: 'How can half-size transforms recover all Fourier coefficients?',
      prerequisites: ['L09-complex-inner-products-hilbert', 'L71-induction-recursive-arguments'],
      durationMinutes: 50,
      reference: {
        title: 'Fast Fourier Transform Algorithms',
        authors: 'Steven G. Johnson',
        citation: 'MIT IAP notes, 2006',
        sourceUrl: 'https://math.mit.edu/~stevenj/18.336/fft-iap2.pdf',
        relevantSections: 'Radix-2 decimation in time and operation counts'
      },
      formula: {
        name: 'Radix-2 merge',
        expression: String.raw`X_k=E_k+\omega_N^k O_k,\quad X_{k+N/2}=E_k-\omega_N^k O_k`,
        context: 'Even and odd transforms for 0 ≤ k < N/2'
      },
      overview:
        'Derive the FFT from the structure of the DFT matrix and count arithmetic operations in the resulting recursion.',
      theory: String.raw`### Separate even and odd samples

For $\omega_N=e^{-2\pi i/N}$, the DFT is $X_k=\sum_{j=0}^{N-1}x_j\omega_N^{jk}$. The inverse uses the opposite sign and a factor $1/N$. Roots of unity summed across a complete period cancel for any nonzero frequency index modulo $N$.

When $N$ is even, split $j$ into $2\ell$ and $2\ell+1$. Since $\omega_N^2=\omega_{N/2}$, the first sum is the half-length DFT $E_k$ of the even samples. The second is $\omega_N^k O_k$ from the odd samples. At $k+N/2$ the half-length coefficients repeat and the odd factor changes sign. Each pair of output coefficients reuses the same two shorter transforms.

### Count arithmetic on a fixed-size representation

For powers of two, $T(N)=2T(N/2)+\Theta(N)$ complex arithmetic operations. Each of $\log_2 N$ levels does $\Theta(N)$ work. The full explicit output uses $\Theta(N)$ entries. The quantum Fourier transform later encodes amplitudes in a state, where reading every coefficient is a different task.`,
      example: String.raw`### Transform four samples by hand

For $x=(1,0,-1,0)$, even samples $(1,-1)$ transform to $(0,2)$ and odd samples transform to $(0,0)$. The merge produces $(0,2,0,2)$. Only the two conjugate frequencies remain. The coefficient at $k=2$ would describe alternating signs at each adjacent sample.`,
      exercise: String.raw`**Find an alias.** Compare $e^{2\pi i k j/N}$ and $e^{2\pi i(k+N)j/N}$ at integer sample indices $j$.

**Check.** The extra factor is $e^{2\pi i j}=1$, so the sampled signals are identical. A discrete frequency index is periodic modulo $N$.`
    }
  ]
);

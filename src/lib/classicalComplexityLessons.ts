import type { PaperReference } from './curriculum';
import { studyPack } from './curriculumLesson';

const CLASSICAL_COMPLEXITY: PaperReference = {
  title: 'Computational Complexity: A Modern Approach',
  authors: 'Sanjeev Arora & Boaz Barak',
  citation: 'Cambridge University Press, 2009',
  sourceUrl: 'https://theory.cs.princeton.edu/complexity/',
  relevantSections: 'Models of computation, NP-completeness, space, and randomized computation'
};

export const CLASSICAL_COMPLEXITY_PACK = studyPack(
  {
    id: 'classical-complexity',
    title: 'Classical computational complexity',
    description: 'Input size and cost models, NP reductions, randomized algorithms, and space complexity.',
    color: 'sage',
    symbol: 'P',
    prerequisites: ['mathematical-proofs', 'probability-estimation']
  },
  97,
  [
    {
      id: 'L97-cost-models-asymptotics',
      title: 'Input Size, Cost Models, and Asymptotics',
      question: 'When can a linear loop take exponential time in the input length?',
      prerequisites: ['L72-invariants-termination'],
      durationMinutes: 40,
      reference: CLASSICAL_COMPLEXITY,
      formula: {
        name: 'Binary length of a positive integer',
        expression: String.raw`n=\lfloor\log_2 N\rfloor+1\quad\Longleftrightarrow\quad 2^{n-1}\le N<2^n`,
        context: 'Measure the input by the number of bits, not its numeric value'
      },
      overview:
        'Identify the input encoding and charged operations before you translate an algorithm into a time or space bound.',
      theory: String.raw`### Count what the user supplies

An instance is encoded as a string. For a list of $m$ words of fixed width, a linear scan costs $O(m)$ word operations. For an integer $N$ in binary, the encoded length is $\lfloor\log_2 N\rfloor+1$. Iterating all numbers from 1 to $N$ takes $\Theta(2^n)$ iterations for an $n$-bit input. A bound polynomial in a numeric value but exponential in its encoded length is called pseudo-polynomial when those are the relevant parameters.

### Specify what one step costs

In bit complexity, reading or writing one bit costs one unit. A word RAM can treat bounded-size word operations as primitives, often with word width $O(\log n)$ on an input of size $n$. Charging arbitrary-size multiplication as one step would hide its cost. Count the size of intermediates when a loop performs arithmetic.

### Distinguish an upper bound from a tight bound

$T(n)=O(f(n))$ means there exists a constant $C$ with $T(n)\le Cf(n)$ for all sufficiently large $n$. The analogous eventual lower bound is $\Omega(f(n))$. Both together give $\Theta(f(n))$. A worst-case bound maximizes over inputs of a given size. A typical-case claim needs a distribution.`,
      example: String.raw`### Compare loops on a binary integer

For $N=2^{20}-1$, a loop decrementing $N$ until zero takes $1{,}048{,}575$ iterations. Repeatedly replacing it with $\lfloor N/2\rfloor$ takes 20 iterations. In a bit model that physically rewrites the remaining bits each time, the shifts can cost $\Theta(n^2)$ total. The iteration count and machine step count answer different questions.`,
      exercise: String.raw`**Include the output.** Can an algorithm that explicitly writes every binary integer from 1 through $N$ run in time polynomial in $\log N$?

**Check.** It must write at least $N$ outputs, each of nonzero length. That alone is exponential in the bit length of $N$.`
    },
    {
      id: 'L98-np-completeness-reductions',
      title: 'P, NP, and Polynomial Reductions',
      question: 'How can a reduction turn a circuit into a 3-SAT instance with the same answer?',
      prerequisites: ['L97-cost-models-asymptotics', 'L70-direct-contrapositive-contradiction'],
      durationMinutes: 55,
      reference: CLASSICAL_COMPLEXITY,
      formula: {
        name: 'Polynomial many-one reduction',
        expression: String.raw`A\le_{\mathrm p}B\quad\Longleftrightarrow\quad x\in A\iff f(x)\in B\quad\text{for a polynomial-time }f`,
        context: 'A solver for B then gives a solver for A with polynomial overhead'
      },
      overview:
        'Build an equisatisfiable formula one gate at a time. Then use the direction of the reduction to identify what hardness it establishes.',
      theory: String.raw`### Compare solving with verification

$\mathrm P$ contains decision problems solvable in deterministic polynomial time. In $\mathrm{NP}$ a yes instance has a polynomial-length witness checkable in deterministic polynomial time, and no instance has no accepting witness. A truth assignment is a witness for Boolean satisfiability. Enumerating the witnesses can take exponential time.

### Encode each gate with a local constraint

Circuit-SAT asks whether some input makes a Boolean circuit accept. Give every wire a variable. For $z=x\land y$, add $(\neg x\lor\neg y\lor z)\land(x\lor\neg z)\land(y\lor\neg z)$. The first clause forces $z$ when both inputs hold, and the last two force both inputs whenever $z$ holds. For a NOT gate $w=\neg z$, use $(w\lor z)\land(\neg w\lor\neg z)$. Add a unit clause forcing the output true.

Any satisfying input extends to the actual wire values. Conversely any satisfying assignment respects each gate, and by topological order its wire values are the circuit's evaluation. The construction has linear many clauses in the number of gates. Clauses shorter than three can repeat literals if the definition requires exactly three slots.

Circuit-SAT is NP-complete by the polynomial-size circuit encoding of polynomial-time verification. The reduction makes 3-SAT NP-hard, and checking a proposed assignment puts it in NP. Whether $\mathrm P=\mathrm{NP}$ remains open.`,
      example: String.raw`### Translate a two-gate circuit

Let $z=x\land y$ and $w=\neg z$, with acceptance when $w=1$. Add the three AND clauses, the two NOT clauses, and $(w)$. The input $x=1,y=0$ extends to $z=0,w=1$. The input $x=y=1$ forces $z=1,w=0$, contradicting the output clause. Both outcomes are preserved.`,
      exercise: String.raw`**Encode an OR gate.** Give clauses equivalent to $z=x\lor y$. Explain in which direction each implication acts.

**Check.** $(\neg x\lor z)$ and $(\neg y\lor z)$ force $z$ for either true input. $(x\lor y\lor\neg z)$ forces at least one true input if $z$ holds.`
    },
    {
      id: 'L99-randomized-complexity-amplification',
      title: 'Randomized Complexity and Amplification',
      question: 'How does bounded error become a tunable accuracy guarantee?',
      prerequisites: ['L97-cost-models-asymptotics', 'L91-concentration-sample-complexity'],
      durationMinutes: 45,
      reference: CLASSICAL_COMPLEXITY,
      formula: {
        name: 'Majority amplification',
        expression: String.raw`P(\text{majority wrong})\le e^{-m/18}`,
        context: 'm independent runs, each correct with probability at least 2/3'
      },
      overview:
        'Compare one-sided and two-sided randomized decisions and calculate how many repetitions reach a chosen confidence.',
      theory: String.raw`### Name the allowed errors

$\mathrm{BPP}$ allows a polynomial-time randomized decision procedure with probability at least $2/3$ of being correct on every input. In $\mathrm{RP}$ a no instance is always rejected, while a yes instance is accepted with probability at least $1/2$. The complementary class $\mathrm{coRP}$ reverses the one-sided guarantee. $\mathrm{ZPP}$ allows a zero-error answer with expected polynomial running time.

### Change confidence with independent repetitions

In BPP, view each run as a correct/wrong indicator. The expected fraction correct is at least $2/3$. A wrong majority needs a downward deviation of at least $1/6$, so one-sided Hoeffding gives $e^{-2m(1/6)^2}=e^{-m/18}$. Thus $O(\log(1/\delta))$ repetitions suffice for error probability $\delta$.

An RP algorithm can accept if any run accepts. A no instance is still never accepted, while the probability of rejecting a yes instance after $m$ independent trials is at most $2^{-m}$. These bounds use fresh randomness. Repeating the same random choices does not supply independent evidence.`,
      example: String.raw`### Set a one-percent error budget

For BPP, $m=83$ odd repetitions suffice because $e^{-83/18}<0.01$. For RP with yes acceptance at least $1/2$, seven repetitions suffice because $2^{-7}<0.01$. The smaller count reflects the stronger shape of the per-run guarantee.`,
      exercise: String.raw`**Pick the aggregation rule.** A test can falsely accept a no instance, but never falsely rejects a yes instance. Which aggregation preserves the one-sided guarantee?

**Check.** Accept only if all runs accept. Yes instances still always accept, and independent runs reduce the chance that a no instance slips through every time.`
    },
    {
      id: 'L100-space-complexity-reachability',
      title: 'Space Complexity and Recursive Reachability',
      question: 'How can a graph search save memory by recomputing its subproblems?',
      prerequisites: ['L97-cost-models-asymptotics', 'L41-partition-refinement-backtracking'],
      durationMinutes: 55,
      reference: CLASSICAL_COMPLEXITY,
      formula: {
        name: 'Recursive reachability',
        expression: String.raw`R_k(u,v)=\bigvee_{w\in V}\bigl(R_{k-1}(u,w)\land R_{k-1}(w,v)\bigr)`,
        context: 'Rₖ allows at most 2ᵏ edges; R₀ checks equality or a single edge'
      },
      overview:
        'Prove a reachability recurrence and count the memory held at one time instead of counting every recursive call as simultaneous storage.',
      theory: String.raw`### Split a path at its midpoint

If a directed path exists on $N$ vertices, deleting repetitions gives one of length at most $N-1$. Let $R_k(u,v)$ ask whether $u$ reaches $v$ in at most $2^k$ edges. At $k=0$, accept if $u=v$ or there is an edge. For larger $k$, try every midpoint $w$ and check both half paths with bound $2^{k-1}$. Short paths may use an empty half. Concatenating two successful halves proves the reverse implication.

### Count the stack and the recomputation separately

For an explicit read-only graph, a call stores a few $O(\log N)$-bit vertex indices, the recursion level, and which half is being checked. Run the halves sequentially so their workspaces can be reused. There are $O(\log N)$ levels and hence $O(\log^2 N)$ working bits. Repeating calls can cost $N^{O(\log N)}$ time. Storing a visited set can give faster search with greater space.

Savitch's theorem applies the same recursion to the implicit graph of configurations of a nondeterministic machine. With space $s(n)\ge\log n$, the graph can have $2^{O(s(n))}$ configurations. The deterministic recursion needs $O(s(n)^2)$ space. In particular $\mathrm{NPSPACE}=\mathrm{PSPACE}$, where PSPACE means polynomial working space.`,
      example: String.raw`### Reach beyond the single-edge base case

On the directed path $0\to1\to2\to3\to4$, $R_2(0,4)$ can choose $w=2$. The first half chooses midpoint 1 and the second chooses 3. The four single-edge checks can run one at a time. The stack keeps only the endpoints and midpoint of each active call.`,
      exercise: String.raw`**Size the initial bound.** On an eight-vertex graph, what is the smallest $k$ that covers every shortest reachable path in the worst case? Can the same recursion use an unbounded path-length budget?

**Check.** A shortest path has at most seven edges, so $k=3$ suffices and a directed chain shows $k=2$ can fail. A finite budget gives the decreasing recursion level needed for termination.`
    }
  ]
);

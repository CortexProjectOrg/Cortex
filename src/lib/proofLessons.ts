import { studyPack } from './curriculumLesson';

export const PROOFS_REFERENCE = {
  title: 'Mathematics for Computer Science',
  authors: 'Eric Lehman, F. Thomson Leighton, and Albert R. Meyer',
  citation: 'MIT OpenCourseWare, 2015',
  sourceUrl:
    'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/mit6_042js15_textbook.pdf',
  relevantSections: 'Chapters 1, 3, 5, and 6 on proofs, logical formulas, induction, and state machines'
};

export const PROOF_PACK = studyPack(
  {
    id: 'mathematical-proofs',
    title: 'Mathematical proofs',
    description: 'Quantifiers, implication, induction, and invariants with complete proofs.',
    color: 'sage',
    symbol: '∀',
    prerequisites: ['math-foundations']
  },
  69,
  [
    {
      id: 'L69-quantifiers-counterexamples',
      title: 'Quantifiers, negation, and counterexamples',
      question: 'What kind of evidence disproves a quantified claim?',
      durationMinutes: 40,
      prerequisites: ['L01-sets-maps-proofs'],
      overview:
        'Rewrite a claim with explicit domains and quantifiers. Use its negation to tell whether you need a witness, a counterexample, or a stronger argument.',
      theory: String.raw`### Read the domain first
The statement $\forall n\in\mathbb Z,\ n^2\ge n$ ranges over negative integers and zero as well as positive integers. The existential statement $\exists n\in\mathbb Z,\ n^2=4$ needs one witness, such as $n=2$. That witness tells you nothing about the claim that every integer squares to $4$.

### Quantifier order is a dependency
The claim $\forall x\in\mathbb Z\ \exists y\in\mathbb Z:\ y>x$ is true: choose $y=x+1$ after seeing $x$. The claim $\exists y\in\mathbb Z\ \forall x\in\mathbb Z:\ y>x$ is false: for each proposed $y$, take $x=y$. Write down who chooses each variable before trying a proof.

### Negate from the outside inward
Negate a universal by exhibiting a failure. Negate an existential by ruling out every candidate. The negation of $\forall x\,\exists y:\ R(x,y)$ is $\exists x\,\forall y:\ \neg R(x,y)$. Keep the original domains. The negation of $P\Rightarrow Q$ is $P\land\neg Q$, so a case where $P$ is false cannot refute the implication.

### Turn definitions into proof instructions
To prove $A\subseteq B$, take an arbitrary $x\in A$ and derive $x\in B$. To refute it, exhibit $x\in A\setminus B$. To prove equality, show membership is equivalent on both sides.`,
      example: String.raw`**Claim.** $A\setminus(B\cup C)=(A\setminus B)\cap(A\setminus C)$.

Take an arbitrary $x$. It belongs to the left-hand set exactly when it is in $A$ and is not in $B\cup C$. The latter means $x\notin B$ **and** $x\notin C$. Thus membership is equivalent to $(x\in A\land x\notin B)\land(x\in A\land x\notin C)$, precisely membership in the right-hand set. This works for each $x$.

Replacing the right-hand intersection by a union makes the claim false. Take $A=B=\{1\}$ and $C=\varnothing$: the left is empty and the modified right contains $1$.`,
      exercise: String.raw`1. Negate “every real $x$ has a real $y$ with $y^2=x$.” Give a witness.
2. With integer domains, decide whether $\forall n\ \exists m:\ n=2m$ holds. Explain why a single failed choice of $m$ is insufficient.
3. Prove $A\setminus(B\cap C)=(A\setminus B)\cup(A\setminus C)$.

**Check.** In exercise 3 the two failures $x\notin B$ and $x\notin C$ are linked by “or.”`,
      reference: PROOFS_REFERENCE,
      formula: {
        name: 'Negating nested quantifiers',
        expression: String.raw`\neg(\forall x\,\exists y:\ R(x,y))\iff\exists x\,\forall y:\ \neg R(x,y)`,
        context: 'Quantifier negation with the same domains'
      }
    },
    {
      id: 'L70-direct-contrapositive-contradiction',
      title: 'Direct proof, contraposition, and contradiction',
      question: 'Which assumption makes the proof move forward?',
      durationMinutes: 45,
      prerequisites: ['L69-quantifiers-counterexamples'],
      formula: {
        name: 'Contraposition',
        expression: String.raw`(P\Rightarrow Q)\iff(\neg Q\Rightarrow\neg P)`,
        context: 'An implication and its contrapositive are logically equivalent'
      },
      overview:
        'Prove integer statements by unpacking divisibility, changing the direction of an implication, and deriving a contradiction from a reduced fraction.',
      theory: String.raw`### A direct proof opens the hypothesis
To prove $P\Rightarrow Q$, assume $P$ and derive $Q$. For $a\mid b$ and $b\mid c$, write $b=ak$ and $c=b\ell$ with integers $k,\ell$. Substitution gives $c=a(k\ell)$, so $a\mid c$. The proof produces the witness required by divisibility.

### Contraposition starts from failure of the conclusion
$P\Rightarrow Q$ is equivalent to $\neg Q\Rightarrow\neg P$. To prove “if $n^2$ is even then $n$ is even,” assume $n=2k+1$. Then $n^2=2(2k^2+2k)+1$ is odd. The converse $Q\Rightarrow P$ is a separate assertion.

### Cases must cover the entire domain
To prove $3\mid n(n+1)(n+2)$, consider the residues $0$, $1$, and $2$ modulo $3$. In those cases the factors $n$, $n+2$, and $n+1$, respectively, are divisible by $3$. The cases include negative integers because residues partition all integers.

### Contradiction needs an impossible conjunction
To prove $P\Rightarrow Q$ by contradiction, assume $P$ and $\neg Q$. For an unconditional claim $Q$, assume only $\neg Q$. A surprising conclusion is insufficient: identify the earlier statement it contradicts.`,
      example: String.raw`**Claim.** $\sqrt{2}$ is irrational.

Assume $\sqrt{2}=a/b$ for positive coprime integers $a,b$. Squaring gives $a^2=2b^2$, so $a^2$ is even. The parity lemma forces $a=2k$. Now $4k^2=2b^2$, so $b^2=2k^2$ and $b$ is even.

Both $a$ and $b$ are divisible by $2$, contradicting $\gcd(a,b)=1$. The reduced-fraction hypothesis is essential, since a fraction can have an even numerator and denominator before reduction.`,
      exercise: String.raw`1. Prove that two odd integers have an even sum by exhibiting the integer witness.
2. Prove by contraposition that $3\mid n^2$ implies $3\mid n$. Check both nonzero residues.
3. Refute the converse of “if $4\mid n$ then $2\mid n$.”
4. Use exercise 2 to adapt the reduced-fraction proof to $\sqrt3$.`,
      reference: PROOFS_REFERENCE
    },
    {
      id: 'L71-induction-recursive-arguments',
      title: 'Ordinary and strong induction',
      question: 'Which facts about smaller inputs does the next step need?',
      durationMinutes: 45,
      prerequisites: ['L70-direct-contrapositive-contradiction'],
      formula: {
        name: 'Ordinary induction',
        expression: String.raw`P(n_0)\land\bigl(\forall k\ge n_0,\ P(k)\Rightarrow P(k+1)\bigr)\ \Longrightarrow\ \forall n\ge n_0,\ P(n)`,
        context: 'Base case and induction step over the integers'
      },
      overview:
        'Use ordinary induction for a one-step recurrence and strong induction for factorization and two-step recurrences.',
      theory: String.raw`### Prove a family of statements
Write $P(n)$ and specify the first $n$. Ordinary induction on $n\ge n_0$ requires $P(n_0)$ and, for arbitrary $k\ge n_0$, the implication $P(k)\Rightarrow P(k+1)$. The induction hypothesis is available inside the step for that $k$.

### A sum gives a one-step recurrence
For $S_n=\sum_{j=1}^n(2j-1)$, the empty sum is $S_0=0$. The step uses $S_{k+1}=S_k+(2k+1)$. Substituting the hypothesis $S_k=k^2$ gives $(k+1)^2$. The formula works because its increment is the new term.

### Strong induction supplies all earlier cases
For a recurrence using $a_k$ and $a_{k-1}$, check both starting values before deriving the next one. In the strong step you may assume $P(j)$ for every earlier index in the declared range. This principle follows from ordinary induction applied to the cumulative claim “every $P(j)$ up to $k$ holds.”

### Look for a gap at the first step
A step proved only when $k\ge2$ does not take $P(1)$ to $P(2)$. Check the first substitution before treating the general algebra as finished.`,
      example: String.raw`**Claim.** Every integer $n\ge2$ is a product of primes.

The base $n=2$ is prime. Take arbitrary $n>2$ and assume the result for all $2\le j<n$. If $n$ is prime, one factor suffices. If composite, $n=ab$ with $2\le a,b<n$. The hypothesis applies to both factors, so concatenating their prime factors gives a factorization of $n$.

This establishes existence. Uniqueness requires a separate divisibility argument.`,
      exercise: String.raw`1. Prove $\sum_{j=1}^n j=n(n+1)/2$ for $n\ge0$.
2. With $a_0=1$, $a_1=2$, and $a_{n+2}=a_{n+1}+a_n$, prove $a_n\le2^n$.
3. A proof checks $P(0)$ but its step assumes $P(k-1)$ and $P(k)$ for $k\ge1$. Identify the missing case.

**Check.** Exercise 2 needs two base cases before the recurrence is available.`,
      reference: PROOFS_REFERENCE
    },
    {
      id: 'L72-invariants-termination',
      title: 'Loop invariants and termination',
      question: 'How can you prove an algorithm returns the right answer and stops?',
      durationMinutes: 50,
      prerequisites: ['L71-induction-recursive-arguments', 'L02-groups-modular-arithmetic'],
      overview:
        'Prove the Euclidean algorithm correct by tracking what stays constant and what decreases. Transfer the same method to a loop over a list.',
      theory: String.raw`### State what remains true
An invariant is a property of every reachable state at a specified program point. To prove it at the top of a loop, show it initially and show that an iteration preserves it under the loop guard. At exit, combine the invariant with failure of the guard to derive the postcondition.

### Correctness and termination
An invariant can hold even if execution never stops. To establish termination, exhibit a nonnegative integer that decreases strictly whenever the loop runs. There is no infinite descending chain of nonnegative integers. A positive real that halves forever does not give the same argument.

### Euclid preserves the common divisors
Start with $a,b\ge0$, not both zero. While $b>0$, replace $(a,b)$ by $(b,r)$ where $a=qb+r$ and $0\le r<b$. Every common divisor of $a,b$ divides $r=a-qb$. Every common divisor of $b,r$ divides $a=qb+r$. The common divisors, hence the gcd, stay the same. The second component strictly decreases. At $b=0$, $\gcd(a,0)=a$ gives the result.

### Choose an invariant that proves something
For a sum loop, “the accumulator is a number” does not connect the input to the output. “The accumulator sums exactly the first $i$ entries” matches initialization at $i=0$ and gives the desired result at $i=n$.`,
      example: String.raw`For input $(252,105)$ the states are

$$
(252,105)\to(105,42)\to(42,21)\to(21,0).
$$

The second component falls through $105,42,21,0$, and the gcd stays constant. The algorithm returns $21$. Back substitution gives $21=5\cdot105-2\cdot252$, so every common divisor divides $21$. Since $21$ divides both inputs, this independently checks the output.`,
      exercise: String.raw`1. Trace Euclid on $(84,30)$ and give a decreasing measure.
2. Prove an indexed loop that counts positive entries is correct. Give the invariant, exit reason, and the empty-list result.
3. Explain which part of the proof breaks if $b$ stays unchanged.

**Check.** For exercise 2 the accumulator counts positives in the prefix of length $i$, and $n-i$ decreases.`,
      reference: PROOFS_REFERENCE,
      formula: {
        name: 'Euclidean invariant',
        expression: String.raw`\gcd(a,b)=\gcd(b,a\bmod b),\qquad b>0`,
        context: 'The two pairs have the same common divisors'
      }
    }
  ]
);

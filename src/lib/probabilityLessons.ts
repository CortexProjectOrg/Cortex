import type { PaperReference } from './curriculum';
import { studyPack } from './curriculumLesson';

const PROBABILITY: PaperReference = {
  title: 'Mathematics for Computer Science',
  authors: 'Eric Lehman, F. Thomson Leighton & Albert R. Meyer',
  citation: 'MIT OpenCourseWare, 2015',
  sourceUrl:
    'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/mit6_042js15_textbook.pdf',
  relevantSections: 'Part V, Probability'
};

export const PROBABILITY_AND_ESTIMATION = studyPack(
  {
    id: 'probability-estimation',
    title: 'Probability and estimation',
    description: 'Conditioning, Monte Carlo estimates, concentration bounds, and Markov-chain mixing.',
    color: 'ochre',
    symbol: 'E',
    prerequisites: ['mathematical-proofs', 'linear-algebra']
  },
  89,
  [
    {
      id: 'L89-conditional-probability-bayes',
      title: 'Conditional Probability and Bayes’ Rule',
      question: 'How does an observation change the probability of the process that generated it?',
      prerequisites: ['L69-quantifiers-counterexamples'],
      durationMinutes: 35,
      reference: PROBABILITY,
      formula: {
        name: 'Bayes’ rule over a partition',
        expression: String.raw`P(A_i\mid B)=\frac{P(B\mid A_i)P(A_i)}{\sum_j P(B\mid A_j)P(A_j)}`,
        context: 'Disjoint hypotheses of positive probability and evidence with P(B) > 0'
      },
      overview:
        'Compute a posterior by weighting evidence under every possible hypothesis. Then identify which independence assumptions let you update again.',
      theory: String.raw`### Normalize the joint probabilities

For $P(B)>0$, $P(A\mid B)=P(A\cap B)/P(B)$. For a partition $\{A_i\}$ of hypotheses with positive probabilities, $P(A_i\cap B)=P(B\mid A_i)P(A_i)$. Add those joint probabilities to obtain $P(B)$, then divide each joint probability by that total.

The prior $P(A_i)$ weights the hypotheses before observing $B$. The likelihood $P(B\mid A_i)$ describes the observation model with the hypothesis held fixed. Their normalized product is the posterior $P(A_i\mid B)$. A high likelihood alone need not give a high posterior.

### State which variables are independent

If two observations are independent given $A_i$, multiply $P(B_1\mid A_i)$ and $P(B_2\mid A_i)$ to get their joint likelihood. The observations can still be dependent after averaging over the unknown hypothesis. A shared cause can make an observation predict the next one.`,
      example: String.raw`### Identify the urn

Choose urn A with probability $1/5$ and urn B otherwise. A has red fraction $3/4$ and B has red fraction $1/4$. The joint probabilities of A and red, and B and red, are $3/20$ and $4/20$. After a red draw, the posterior probability of A is $3/7$. The red observation increases it from $1/5$, with B still slightly more likely.`,
      exercise: String.raw`**Update after a second red draw.** Keep the same urn and replace the first ball before sampling again. Compute the posterior probability of A.

**Check.** The unnormalized weights are $(1/5)(3/4)^2$ and $(4/5)(1/4)^2$, with ratio $9:4$. The posterior is $9/13$.`
    },
    {
      id: 'L90-monte-carlo-variance',
      title: 'Expectation, Covariance, and Monte Carlo',
      question: 'When does reusing the same random draw help or hurt an estimate?',
      prerequisites: ['L89-conditional-probability-bayes'],
      durationMinutes: 45,
      reference: PROBABILITY,
      formula: {
        name: 'Variance of a paired estimate',
        expression: String.raw`\operatorname{Var}(\overline{X+Y})=\frac{\operatorname{Var}(X)+\operatorname{Var}(Y)+2\operatorname{Cov}(X,Y)}{m}`,
        context: 'Independent pairs across m draws; the two values within a pair can be dependent'
      },
      overview:
        'Derive the standard error of a Monte Carlo mean and see how the choice of joint draws changes its variance.',
      theory: String.raw`### Estimate an expectation with repeated draws

If $X_i=f(U_i)$ with independent draws $U_i$ from the same distribution, then the sample mean $\bar X=m^{-1}\sum_i X_i$ estimates $\mu=\mathbb E[X]$. Linearity gives $\mathbb E[\bar X]=\mu$. For finite variance $\sigma^2$, independence gives $\operatorname{Var}(\bar X)=\sigma^2/m$. The standard error decreases as $1/\sqrt m$.

For example, if $U$ is uniform on $[0,1]$ then $\mathbb E[U^2]=\int_0^1 u^2\,du=1/3$. Each draw gives one sample of $U^2$. Since $\mathbb E[U^4]=1/5$, the single-draw variance is $4/45$.

### Keep covariance when you share randomness

For paired values $X,Y$, the covariance is $\mathbb E[(X-\mu_X)(Y-\mu_Y)]$. Expanding the square of a centered sum gives the variance shown above. For a difference, the covariance term enters with a minus sign. Pairing positively correlated outputs can therefore improve estimation of a difference even though it increases the variance of their sum.`,
      example: String.raw`### Compare two ways to draw two bits

Take $X$ and $Y$ to be fair bits. If both equal the same coin flip, $X+Y$ is either 0 or 2, with variance 1. If they are independent, the variance of the sum is $1/2$. For 100 independent pairs the two standard errors for the sum are $0.10$ and approximately $0.071$. For the difference, sharing the same bit instead gives zero variance.`,
      exercise: String.raw`**Set a sampling budget.** For the estimator of $\mathbb E[U^2]$, how many independent draws give standard error at most $0.01$?

**Check.** Solve $4/(45m)\le10^{-4}$. The least integer is 889. A standard-error target does not specify a tail probability by itself.`
    },
    {
      id: 'L91-concentration-sample-complexity',
      title: 'Concentration Bounds and Sample Complexity',
      question: 'How many observations suffice for a stated error tolerance and failure probability?',
      prerequisites: ['L90-monte-carlo-variance'],
      durationMinutes: 45,
      reference: {
        title: 'Probability inequalities for sums of bounded random variables',
        authors: 'Wassily Hoeffding',
        citation: 'Journal of the American Statistical Association 58, 13–30 (1963)',
        doi: '10.1080/01621459.1963.10500830',
        sourceUrl: 'https://doi.org/10.1080/01621459.1963.10500830',
        relevantSections: 'The bounded independent-variable inequality'
      },
      formula: {
        name: 'Two-sided Hoeffding bound',
        expression: String.raw`P(|\overline X-\mu|\ge\epsilon)\le 2\exp(-2m\epsilon^2)`,
        context: 'm independent observations in [0,1] with common mean μ'
      },
      overview:
        'Translate a deviation inequality into an explicit sample budget. Use a union bound to handle several simultaneous estimates.',
      theory: String.raw`### Choose the accuracy statement first

For independent $[0,1]$ observations with mean $\mu$, Hoeffding bounds either one-sided deviation by $\exp(-2m\epsilon^2)$. Add the two tails to get the displayed bound. For a variable in $[a,b]$, apply it to $(X-a)/(b-a)$, so the exponent is $-2m\epsilon^2/(b-a)^2$ in the original units.

For failure probability at most $\delta$, a sufficient sample budget is $\lceil\log(2/\delta)/(2\epsilon^2)\rceil$ for observations in $[0,1]$. This bound holds uniformly over their distributions under the assumptions. A particular distribution can require fewer samples.

### Require several estimates to succeed together

If any of $k$ failures makes the experiment fail, $\Pr(\text{any failure})\le\sum_i\Pr(\text{failure }i)$. Set each budget with failure probability $\delta/k$. The union bound can combine correlated events. Each individual Hoeffding bound still needs independence of that estimate's samples.`,
      example: String.raw`### Estimate a probability to five points

For $\epsilon=0.05$ and $\delta=0.05$, the sufficient budget is $\lceil\log(40)/0.005\rceil=738$. With four probabilities and a total failure budget of $0.05$, use $\lceil\log(160)/0.005\rceil=1016$ samples per estimate. If every readout yields all four variables, the same 1016 independent readouts can serve all estimates.`,
      exercise: String.raw`**Change the observable range.** A measurement gives values in $\{-1,+1\}$ instead of $\{0,1\}$. For the same absolute tolerance and failure probability, what changes before rounding the required sample count?

**Check.** The range length doubles, so the bound requires four times as many samples.`
    },
    {
      id: 'L92-markov-chains-mixing-mcmc',
      title: 'Markov Chains, Mixing, and MCMC',
      question: 'Why can a chain have the right stationary law yet produce a poor estimate?',
      prerequisites: ['L90-monte-carlo-variance', 'L08-eigenvalues-without-diagonalization'],
      durationMinutes: 55,
      reference: {
        title: 'Markov Chains and Mixing Times',
        authors: 'David A. Levin & Yuval Peres, with contributions by Elizabeth L. Wilmer',
        citation: 'AMS, 2nd edition, 2017',
        sourceUrl: 'https://www.stat.berkeley.edu/~aldous/260-FMIE/Levin-Peres-Wilmer.pdf',
        relevantSections: 'Stationary distributions, total variation, eigenvalues, and time averages'
      },
      formula: {
        name: 'Detailed balance',
        expression: String.raw`\pi_i P_{ij}=\pi_j P_{ji}\quad\Longrightarrow\quad\pi P=\pi`,
        context: 'Reversible transition matrix with π a probability row vector'
      },
      overview:
        'Construct a reversible chain and use a two-state calculation to distinguish burn-in from dependence between samples.',
      theory: String.raw`### Specify the update and its limiting law

A Markov chain moves from state $i$ to $j$ with probability $P_{ij}$. A row distribution $\mu$ becomes $\mu P$ after one step. If $\pi_iP_{ij}=\pi_j P_{ji}$ for every pair, summing over $i$ shows $\pi P=\pi$. A finite irreducible, aperiodic chain converges to its unique stationary law. Reversibility supplies a stationary law but does not quantify how quickly it is reached.

In Metropolis sampling with symmetric proposal probabilities, accept a proposed move $i\to j$ with probability $\min(1,\pi_j/\pi_i)$. The two flows both equal the proposal probability times $\min(\pi_i,\pi_j)$. Rejected proposals stay at $i$.

### Separate start-up bias from correlation

Total variation distance is half the sum of absolute probability differences on a finite state space. It bounds the change in probability of any event. Near stationarity, consecutive samples can still be correlated. The variance of a chain average includes the off-diagonal covariances of the sampled values. Effective sample size estimates how many independent draws would give comparable variance for a specific summary.`,
      example: String.raw`### Solve a reversible two-state chain

Target probabilities $(2/3,1/3)$ and propose a switch with probability $0.2$. The acceptances $1/2$ and $1$ give transition probabilities $P_{01}=0.1$ and $P_{10}=0.2$. Let $p_t$ be the probability of state 1 after $t$ steps. Then $p_{t+1}=0.1+0.7p_t$. Starting in state 0 gives $p_t=(1-0.7^t)/3$, with total variation distance $0.7^t/3$. The factor $0.7$ also governs the decay of lag correlations of the state indicator under stationarity.`,
      exercise: String.raw`**Compute burn-in for this starting state.** Find the first $t$ for which the displayed distance is at most $0.01$. Does that make the next two samples independent?

**Check.** $t=10$. The next state still depends on the present state through the transition probabilities, even when the marginal distribution is close to stationary.`
    }
  ]
);

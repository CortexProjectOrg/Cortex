import type { PaperReference } from './curriculum';
import { studyPack } from './curriculumLesson';

const TWO_STATE_SYSTEMS: PaperReference = {
  title: 'Quantum Physics II: Two State Systems',
  authors: 'Barton Zwiebach',
  citation: 'MIT OpenCourseWare, 2013',
  sourceUrl:
    'https://ocw.mit.edu/courses/8-05-quantum-physics-ii-fall-2013/7c376a3b5b27e5ea586a7e37b85a05d3_MIT8_05F13_Chap_07.pdf',
  relevantSections: 'Spin precession and general two-state Hamiltonians'
};

export const QUANTUM_DYNAMICS = studyPack(
  {
    id: 'quantum-dynamics-spectra',
    title: 'Quantum dynamics and spectra',
    description: 'Hamiltonian evolution, spin measurements, thermal states, and adiabatic gaps.',
    color: 'blue',
    symbol: 'ℏ',
    prerequisites: ['quantum-essentials', 'pauli-group']
  },
  93,
  [
    {
      id: 'L93-hamiltonian-time-evolution',
      title: 'Hamiltonians and Time Evolution',
      question: 'How do energy differences become measurable phases?',
      prerequisites: ['L11-unitary-operators-quantum-gates', 'L20-pauli-sums-observables-hamiltonians'],
      durationMinutes: 45,
      reference: TWO_STATE_SYSTEMS,
      formula: {
        name: 'Spectral expansion of time evolution',
        expression: String.raw`U(t)=e^{-iHt/\hbar}=\sum_j e^{-iE_jt/\hbar}|E_j\rangle\langle E_j|`,
        context: 'Finite-dimensional time-independent Hermitian Hamiltonian'
      },
      overview:
        'Use the eigenspaces of a Hamiltonian to evolve a superposition and predict what changes in a measurement.',
      theory: String.raw`### Evolve energy components by phase

The Schrödinger equation is $i\hbar\partial_t|\psi\rangle=H|\psi\rangle$. For constant $H$, applying $U(t)=e^{-iHt/\hbar}$ multiplies each energy amplitude by $e^{-iE_jt/\hbar}$. Because $H$ is Hermitian, those factors have unit magnitude and $U(t)$ is unitary. Adding $cI$ to a constant Hamiltonian multiplies the entire state by $e^{-ict/\hbar}$, while an energy gap produces a relative phase.

### Use a commutator to identify conserved expectations

For an observable $A$ with no explicit time dependence, differentiate $\langle\psi(t)|A|\psi(t)\rangle$ using the Schrödinger equation and its adjoint. This gives $d\langle A\rangle/dt=(i/\hbar)\langle[H,A]\rangle$. If $A$ commutes with $H$, its expectation is conserved for every initial state. Measuring in another basis can reveal the phases that do evolve.

When the Hamiltonian changes, order matters. Evolution with $H_1$ followed by $H_2$ multiplies the two corresponding unitaries in that order on the state. The exponential of the sum generally gives a different unitary when the generators fail to commute.`,
      example: String.raw`### Turn precession into an interference signal

Take $H=\hbar\omega Z/2$ and start from $|+\rangle$. Removing a common phase gives $(|0\rangle+e^{i\omega t}|1\rangle)/\sqrt2$. A $Z$ measurement keeps equal probabilities because $[H,Z]=0$. Measuring $X$ gives $+$ with probability $(1+\cos(\omega t))/2$. At $t=\pi/\omega$ the outcome is certainly $-$.`,
      exercise: String.raw`**Change the energy reference.** Add $3\hbar\omega I$ to the example Hamiltonian. What happens to the $X$ measurement probabilities? What if instead you double the coefficient of $Z$?

**Check.** The identity term contributes only global phase. Doubling the $Z$ coefficient doubles the fringe frequency.`
    },
    {
      id: 'L94-spin-measurement-rotations',
      title: 'Spin-½ Measurements and Rotations',
      question: 'What probability does a spin analyzer measure after its axis is tilted?',
      prerequisites: ['L93-hamiltonian-time-evolution', 'L15-pauli-matrices-algebra'],
      durationMinutes: 40,
      reference: TWO_STATE_SYSTEMS,
      formula: {
        name: 'Spin analyzer probability',
        expression: String.raw`P_{\mathbf n}(+)=\operatorname{Tr}\!\left(\frac{I+\mathbf n\cdot\boldsymbol{\sigma}}{2}\rho\right)=\frac{1+\mathbf n\cdot\mathbf r}{2}`,
        context: 'Analyzer axis n is a unit vector and r is the state’s Bloch vector'
      },
      overview:
        'Use spin projectors to calculate successive Stern–Gerlach outcomes and connect a rotation of the state to an analyzer direction.',
      theory: String.raw`### Represent the measured component

For spin-$1/2$, $S_i=\hbar\sigma_i/2$ and $[S_x,S_y]=i\hbar S_z$. For a unit analyzer direction $\mathbf n$, $S_{\mathbf n}=\hbar\,\mathbf n\cdot\boldsymbol{\sigma}/2$. Since $(\mathbf n\cdot\boldsymbol{\sigma})^2=I$, the projectors onto the $\pm\hbar/2$ outcomes are $P_\pm=(I\pm\mathbf n\cdot\boldsymbol{\sigma})/2$.

Write $\rho=(I+\mathbf r\cdot\boldsymbol{\sigma})/2$, where $|\mathbf r|\le1$. The Pauli trace identities give $P(+)=\operatorname{Tr}(P_+\rho)=(1+\mathbf n\cdot\mathbf r)/2$. In particular, a state prepared along $+z$ and measured at tilt $\theta$ from $z$ gives $P(+)=\cos^2(\theta/2)$.

### Connect rotations to the spin Hamiltonian

The active spin rotation by angle $\theta$ about $\mathbf n$ is $e^{-i\theta\,\mathbf n\cdot\boldsymbol{\sigma}/2}$. At $2\pi$ it is $-I$. An isolated spin has identical measurement probabilities after that overall phase, while an interferometer can compare the phase with a branch that did not rotate.`,
      example: String.raw`### Select an analyzer branch

Prepare $+z$, analyze along $x$, and retain only the $+x$ branch. Half the particles take that branch, and the retained spin state is $+x$. A subsequent $z$ measurement is again 50–50 within the retained branch. Before selection, the joint probability of $+x$ followed by $+z$ is $1/4$.`,
      exercise: String.raw`**Tilt by sixty degrees.** Start along $+z$ and set the analyzer $60^\circ$ away. Find the probability of the negative outcome. What is the result if you immediately repeat the measurement on that negative branch?

**Check.** The negative probability is $(1-\cos60^\circ)/2=1/4$. Repeating the same ideal analyzer on its negative eigenstate gives the negative outcome with certainty.`
    },
    {
      id: 'L95-quantum-thermal-states',
      title: 'Quantum Thermal States and Partition Functions',
      question: 'How do energy levels and temperature determine the populations of an equilibrium state?',
      prerequisites: [
        'L93-hamiltonian-time-evolution',
        'L13-density-matrices-mixed-states',
        'L90-monte-carlo-variance'
      ],
      durationMinutes: 45,
      reference: {
        title: 'Statistical Mechanics I: Quantum Microstates and Macrostates',
        authors: 'Mehran Kardar',
        citation: 'MIT OpenCourseWare, 2013, lecture 21',
        sourceUrl:
          'https://www.ocw.mit.edu/courses/8-333-statistical-mechanics-i-statistical-mechanics-of-particles-fall-2013/4f8defd6fcba707a0c691dd8957a43e3_MIT8_333F13_Lec21.pdf',
        relevantSections: 'Quantum canonical density operator and partition function'
      },
      formula: {
        name: 'Canonical state and partition function',
        expression: String.raw`\rho_\beta=e^{-\beta H}/Z(\beta),\qquad Z(\beta)=\operatorname{Tr}(e^{-\beta H})`,
        context: 'Canonical equilibrium with inverse temperature β = 1/(kBT)'
      },
      overview:
        'Compute the Gibbs state in the energy basis and derive its mean energy and energy fluctuations from one normalizer.',
      theory: String.raw`### Weight eigenstates by energy

For a finite system in canonical equilibrium at $T>0$, let $\beta=1/(k_\mathrm B T)$. With energy eigenstates $|j\rangle$ and eigenvalues $E_j$, $e^{-\beta H}$ puts weight $e^{-\beta E_j}$ on each eigenstate. The trace $Z=\sum_j e^{-\beta E_j}$ normalizes the density matrix. A level with multiplicity $g$ has total probability $g e^{-\beta E}/Z$.

### Differentiate the normalizer

Since $Z'=-\sum_j E_j e^{-\beta E_j}$, the mean is $\langle H\rangle=-\partial_\beta\log Z$. Differentiating again yields $-\partial_\beta\langle H\rangle=\langle H^2\rangle-\langle H\rangle^2$. These derivatives hold for a fixed Hamiltonian.

At $\beta=0$ every eigenstate has equal weight. As $\beta\to\infty$ only the ground subspace remains populated, with equal weight within an exactly degenerate ground subspace. For any normalized state the energy expectation is a weighted average of the spectrum and therefore at least the ground energy.`,
      example: String.raw`### Compare two energy levels

For energies $0,\Delta$ with $\Delta>0$, $Z=1+e^{-\beta\Delta}$. When $\beta\Delta=\log3$, the excited-state population is $1/4$. The mean energy is $\Delta/4$ and the variance is $3\Delta^2/16$. A device can depart from these populations when its preparation or environment is out of equilibrium.`,
      exercise: String.raw`**Add a degeneracy.** Keep a unique ground state, but give the energy $\Delta$ three orthogonal states. At $\beta\Delta=\log3$, compute the probability of observing energy $\Delta$.

**Check.** The excited level's total weight is $3(1/3)=1$, equal to the ground weight. Its probability is $1/2$.`
    },
    {
      id: 'L96-adiabatic-evolution-gaps',
      title: 'Adiabatic Evolution and Avoided Crossings',
      question: 'Why does the smallest energy gap matter when preparing a state by a slow change?',
      prerequisites: ['L94-spin-measurement-rotations'],
      durationMinutes: 50,
      reference: {
        title: 'Quantum Physics III: Adiabatic Approximation',
        authors: 'Barton Zwiebach',
        citation: 'MIT OpenCourseWare, 2018, chapter 6',
        sourceUrl:
          'https://ocw.mit.edu/courses/8-06-quantum-physics-iii-spring-2018/resources/chapter-6-adiabatic-approximation/',
        relevantSections: 'Instantaneous eigenstates and adiabatic dynamics'
      },
      formula: {
        name: 'Gap for an interpolating spin Hamiltonian',
        expression: String.raw`\Delta(s)=2E\sqrt{(1-s)^2+s^2}`,
        context: 'Interpolation from −EZ to −EX for E > 0'
      },
      overview: 'Track the energy gap and the change in eigenvectors along an explicit scheduling path.',
      theory: String.raw`### Distinguish a moving eigenvector from the moving state

Write $H(s)$ with $s=t/T\in[0,1]$. At each $s$, diagonalize $H(s)$ and call its ground and first excited vectors $|g(s)\rangle$ and $|e(s)\rangle$. If the state starts in a nondegenerate ground state and the path is sufficiently smooth with a gap bounded away from zero, the adiabatic theorem says the probability of leaving the ground subspace vanishes as $T\to\infty$.

### See where transitions enter the equation

Differentiate the instantaneous eigenvalue equation and project onto $|e\rangle$. This gives $\langle e|\partial_s g\rangle=\langle e|\partial_s H|g\rangle/(E_g-E_e)$. A small gap can magnify the change in eigenvectors. During the evolution, rapid relative dynamical phases suppress net transitions, with phase rate $(E_e-E_g)/\hbar$. Both the gap and the matrix element of the change matter. A gap alone does not supply a universal finite-time error guarantee.

An avoided crossing occurs when a coupling between two would-be crossing states opens a nonzero minimum gap. Slowing near that gap can give the state more time to follow the changing eigenvectors.`,
      example: String.raw`### Rotate a field between two axes

For $H(s)=-E[(1-s)Z+sX]$ with $E>0$, anticommutation gives $H(s)^2=E^2[(1-s)^2+s^2]I$. The energy gap is smallest at $s=1/2$, where it equals $\sqrt2 E$. The initial ground state is $|0\rangle$ and the final one is $|+\rangle$. A sudden switch leaves $|0\rangle$ with final-ground probability $1/2$. In the slow limit the probability approaches 1.`,
      exercise: String.raw`**Replace the path by $H(s)=-E(1-2s)Z$.** Locate the gap closure. Starting in $|0\rangle$, can running this path more slowly prepare the final ground state?

**Check.** The gap closes at $s=1/2$. Every $H(s)$ is diagonal in the same basis, so the state remains $|0\rangle$ up to phase, while the final ground state is $|1\rangle$.`
    }
  ]
);

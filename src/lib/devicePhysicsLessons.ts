import type { PaperReference } from './curriculum';
import { studyPack } from './curriculumLesson';

const CIRCUIT_QED: PaperReference = {
  title: 'Circuit quantum electrodynamics',
  authors: 'Blais, Grimsmo, Girvin & Wallraff',
  citation: 'Rev. Mod. Phys. 93, 025005 (2021)',
  relevantSections: 'LC quantization, driven qubits, and the dispersive regime',
  doi: '10.1103/RevModPhys.93.025005',
  arxivUrl: 'https://arxiv.org/abs/2005.12667'
};

const TRANSMON: PaperReference = {
  title: 'Charge-insensitive qubit design derived from the Cooper pair box',
  authors: 'Koch et al.',
  citation: 'Phys. Rev. A 76, 042319 (2007)',
  relevantSections: 'Transmon spectrum and anharmonicity',
  doi: '10.1103/PhysRevA.76.042319',
  arxivUrl: 'https://arxiv.org/abs/cond-mat/0703002'
};

export const DEVICE_PHYSICS = studyPack(
  {
    id: 'superconducting-qubit-physics',
    title: 'Superconducting Qubit Physics',
    description: 'From LC resonators and coherent drives to transmon leakage and dispersive readout.',
    color: 'blue',
    symbol: 'ω',
    prerequisites: ['quantum-essentials']
  },
  73,
  [
    {
      id: 'L73-quantum-lc-resonator',
      formula: {
        name: 'LC mode frequency',
        expression: String.raw`\omega = \frac{1}{\sqrt{LC}}`,
        context: 'Quantized LC oscillator'
      },
      title: 'The Quantum LC Resonator',
      question: 'How do inductance and capacitance set the energy cost of adding one photon?',
      prerequisites: ['L09-complex-inner-products-hilbert', 'L11-unitary-operators-quantum-gates'],
      durationMinutes: 35,
      reference: CIRCUIT_QED,
      overview:
        'A superconducting circuit can store energy in an oscillating voltage and current. Quantizing one mode of that circuit gives the equally spaced ladder used to model microwave resonators.',
      theory: String.raw`### From flux and charge to an energy ladder

In an ideal LC circuit, the capacitor stores $Q^2/(2C)$ and the inductor stores $\Phi^2/(2L)$, where $Q$ is charge and $\Phi$ is flux. Quantize these conjugate variables with $[\Phi,Q]=i\hbar$. The angular frequency is $\omega=1/\sqrt{LC}$.

Let $Z_0=\sqrt{L/C}$ be the mode impedance. Write $\Phi=\sqrt{\hbar Z_0/2}\,(a+a^\dagger)$ and $Q=i\sqrt{\hbar/(2Z_0)}\,(a^\dagger-a)$. These scalings put the quadratic electric and magnetic energies on the same scale, and their commutator is $i\hbar$.

The ladder operators satisfy $[a,a^\dagger]=I$ on the oscillator's Fock basis. Since $a|n\rangle=\sqrt{n}|n-1\rangle$ and $a^\dagger|n\rangle=\sqrt{n+1}|n+1\rangle$, $a^\dagger a$ counts excitations. The Hamiltonian is $H=\hbar\omega(a^\dagger a+\tfrac12 I)$. The vacuum $|0\rangle$ has energy $\hbar\omega/2$, and each step adds $\hbar\omega=hf$, with $f=\omega/(2\pi)$.

### What a simulation cutoff changes

The infinite ladder has no highest state. A simulation that keeps $|0\rangle$ through $|N\rangle$ sets the projected $a^\dagger|N\rangle$ to zero. Acting on that state, $[a,a^\dagger]$ gives $-N|N\rangle$. Monitor population near the cutoff and repeat with a larger basis when a drive can populate high levels.`,
      example: String.raw`### An energy step at 5 GHz

At $f=5\,\mathrm{GHz}$, one photon adds $hf\approx3.31\times10^{-24}\,\mathrm J$. Both the $0\to1$ and $1\to2$ transitions require that same frequency. A resonant drive that couples adjacent levels can therefore continue up the ladder. Frequency selectivity alone cannot isolate the lowest two levels. [The transmon lesson](/topics/superconducting-qubit-physics/L75-transmon-anharmonicity-leakage) shows how anharmonicity changes that.`,
      exercise: String.raw`**Find the cutoff error.** A simulation retains $|0\rangle$, $|1\rangle$, and $|2\rangle$. Apply $aa^\dagger$ and $a^\dagger a$ to $|2\rangle$. Explain why a two-photon population is a warning here.

**Check:** The first product yields zero and the second yields $2|2\rangle$. The simulated commutator has the wrong sign and magnitude at $|2\rangle$, where the drive in the full oscillator could also populate $|3\rangle$.`
    },
    {
      id: 'L74-coherent-drives-rabi-oscillations',
      formula: {
        name: 'Driven excited population',
        expression: String.raw`P_1(t)=\frac{\Omega^2}{\Omega^2+\Delta^2}\sin^2\!\left(\frac{t\sqrt{\Omega^2+\Delta^2}}2\right)`,
        context: 'Constant drive in the rotating-wave approximation'
      },
      title: 'Coherent Drives and Rabi Oscillations',
      question: 'How do drive amplitude, detuning, and phase determine a qubit rotation?',
      prerequisites: ['L15-pauli-matrices-algebra', 'L73-quantum-lc-resonator'],
      durationMinutes: 40,
      reference: CIRCUIT_QED,
      overview:
        'A microwave pulse implements a rotation. A Rabi experiment measures how far the pulse rotates the state as its duration changes.',
      theory: String.raw`### Choose axes in the drive frame

Use $Z|0\rangle=|0\rangle$ and a bare Hamiltonian $-\hbar\omega_q Z/2$, so $|0\rangle$ is the ground state. In a frame rotating at the drive frequency $\omega_d$, choose the pulse phase convention so the rotating-wave Hamiltonian is

$$
H_{\mathrm{rot}}/\hbar=\tfrac12[-\Delta Z+\Omega(\cos\phi\,X+\sin\phi\,Y)],\qquad \Delta=\omega_q-\omega_d.
$$

$\Omega$ is the resonant angular Rabi frequency. The rotating-wave approximation discards rapidly oscillating terms and applies here when the drive strength and detuning are small compared with the carrier frequency. On resonance, phase zero gives an $X$ rotation. Changing phase by $\pi/2$ makes the rotation about $Y$.

### Detuning tilts the rotation axis

For a constant pulse starting in $|0\rangle$, the excited-state probability is

$$
P_1(t)=\frac{\Omega^2}{\Omega^2+\Delta^2}\sin^2\!\left(\frac{t}{2}\sqrt{\Omega^2+\Delta^2}\right).
$$

On resonance, a $\pi$ pulse inverts the qubit at $t=\pi/\Omega$. With detuning, the oscillation speeds up and its maximum population drops because the rotation axis tilts toward $Z$.`,
      example: String.raw`### Calibrate a 100 ns pulse

Set $\Omega/(2\pi)=5\,\mathrm{MHz}$. On resonance the first maximum occurs at $100\,\mathrm{ns}$ and reaches 1. At $\Delta/(2\pi)=5\,\mathrm{MHz}$ it occurs at $100/\sqrt2\approx70.7\,\mathrm{ns}$ and reaches only $1/2$. Adjusting duration alone cannot restore full inversion at this detuning.`,
      exercise: String.raw`**Separate phase and amplitude.** A resonant $100\,\mathrm{ns}$ pulse inverts the qubit at phase zero. What duration makes an equal superposition? What changes if you add $\pi/2$ to the pulse phase?

**Check:** At $50\,\mathrm{ns}$, the two populations both equal $1/2$. Adding $\pi/2$ switches the axis from $X$ to $Y$, so the relative phase changes while the computational-basis populations stay the same.`
    },
    {
      id: 'L75-transmon-anharmonicity-leakage',
      formula: {
        name: 'Leading transmon anharmonicity',
        expression: String.raw`\hbar\alpha\approx-E_C`,
        context: 'Large Josephson-to-charging energy ratio'
      },
      title: 'Transmon Anharmonicity and Leakage',
      question: 'Why can a transmon act like a qubit and still leak into a third level?',
      prerequisites: ['L74-coherent-drives-rabi-oscillations'],
      durationMinutes: 45,
      reference: TRANSMON,
      overview:
        'The Josephson junction introduces unequal transition frequencies. That separates the qubit transition from neighboring transitions and sets a practical limit on how quickly a pulse can address it.',
      theory: String.raw`### The Josephson term changes the spacings

The transmon model is $H=4E_C(n-n_g)^2-E_J\cos\varphi$, where $n$ counts Cooper pairs, $n_g$ is offset charge, and $\varphi$ is superconducting phase. At large $E_J/E_C$, the quadratic part of the cosine approximates an oscillator. The first quartic correction makes $E_2-E_1$ smaller than $E_1-E_0$.

To leading order, $\hbar\omega_{01}\approx\sqrt{8E_J E_C}-E_C$ and $\alpha=\omega_{12}-\omega_{01}\approx-E_C/\hbar$. A larger $E_J/E_C$ strongly suppresses sensitivity to offset charge but leaves finite anharmonicity.

### Why the pulse shape matters

During a gate the drive can couple both $|0\rangle\leftrightarrow|1\rangle$ and $|1\rangle\leftrightarrow|2\rangle$. Shortening a pulse generally broadens its spectrum, bringing more of it near the unwanted transition. Leakage is population outside the computational subspace. A calibrated DRAG pulse adds a derivative-shaped quadrature and can reduce leakage and drive-induced phase errors. Population and phase still need separate checks on the hardware.`,
      example: String.raw`### Estimate both transition frequencies

For $E_J/h=20\,\mathrm{GHz}$ and $E_C/h=0.25\,\mathrm{GHz}$, $f_{01}\approx\sqrt{40}-0.25=6.075\,\mathrm{GHz}$. The next transition is near $5.825\,\mathrm{GHz}$. A calibration that measures a single excitation signal can miss leakage. To distinguish it from a rotation error, resolve the populations of all three levels after the pulse.`,
      exercise: String.raw`**Compare pulse durations.** Two envelopes have the same shape and area. One is compressed from $40\,\mathrm{ns}$ to $10\,\mathrm{ns}$. How do the peak amplitude and the characteristic bandwidth change? Why is that insufficient to predict a leakage probability?

**Check:** Both increase by a factor of four. Predicting leakage also requires the envelope's spectral weight at the neighboring transition, the transition matrix elements, and the dynamical phases during the pulse.`
    },
    {
      id: 'L76-dispersive-readout',
      formula: {
        name: 'Two-level dispersive shift',
        expression: String.raw`\chi=\frac{g^2}{\Delta}`,
        context: 'Second-order dispersive approximation'
      },
      title: 'Dispersive Readout and Assignment Errors',
      question: 'How does a resonator reveal the state of a qubit that is far from resonance?',
      prerequisites: ['L13-density-matrices-mixed-states', 'L75-transmon-anharmonicity-leakage'],
      durationMinutes: 45,
      reference: CIRCUIT_QED,
      overview:
        'The qubit shifts the resonator frequency by an amount that depends on its state. A readout pulse turns that shift into a measurement record that can be classified and calibrated.',
      theory: String.raw`### A virtual exchange shifts the resonator

Let a two-level qubit of frequency $\omega_q$ couple to a resonator at $\omega_r$ with strength $g$. With $\Delta=\omega_q-\omega_r$, real excitation exchange is suppressed in the dispersive regime $g\sqrt{n+1}\ll|\Delta|$, where $n$ is the photon number. To second order, the resonator frequencies conditioned on $|0\rangle$ and $|1\rangle$ differ by $2|\chi|$ with $\chi=g^2/\Delta$ in this model.

A transmon has more than two levels. The leading dispersive expression becomes $\chi\approx g^2\alpha/[\Delta(\Delta+\alpha)]$, with $\alpha=\omega_{12}-\omega_{01}$. Use it only when both transitions are sufficiently detuned. Comparing $2|\chi|$ with the resonator linewidth helps explain the contrast between the two responses.

### Calibrate the measurement record

Integrate the outgoing in-phase and quadrature signals over the readout window. Repeated reference preparations give two distributions. A decision boundary assigns each record a bit. Record both $P(\hat 1|0)$ and $P(\hat 0|1)$ when possible. Preparation errors and relaxation during readout can contribute to the observed differences, so name the calibration protocol when reporting them.`,
      example: String.raw`### Separate shift from drive power

In the two-level model, take $g/(2\pi)=100\,\mathrm{MHz}$ and $\Delta/(2\pi)=1\,\mathrm{GHz}$. Then $|\chi|/(2\pi)=10\,\mathrm{MHz}$ and the two resonances are separated by $20\,\mathrm{MHz}$. The model's critical photon-number scale $\Delta^2/(4g^2)$ is 25. Driving to mean occupation near 25 takes the device outside the weak-drive regime where the simple shift was derived.`,
      exercise: String.raw`**Compute a readout matrix.** Out of 1,000 ground-state preparations, 25 are assigned 1. Out of 1,000 excited-state preparations, 80 are assigned 0. Compute the observed error on each input and their mean for equal priors.

**Check:** The error rates are $2.5\%$ and $8\%$. For equal priors the average is $5.25\%$. The two conditional rates contain more information than this one average.`
    }
  ]
);

import { studyPack } from './curriculumLesson';

export const NOISE_CHARACTERIZATION = studyPack(
  {
    id: 'quantum-noise-characterization',
    title: 'Quantum Noise Characterization',
    description: 'Measure coherence, interpret randomized benchmarks, and probe noise by frequency.',
    color: 'ochre',
    symbol: 'T₂',
    prerequisites: ['superconducting-qubit-physics', 'open-quantum-systems']
  },
  81,
  [
    {
      id: 'L81-relaxation-ramsey-echo',
      formula: {
        name: 'Exponential coherence rates',
        expression: String.raw`\frac1{T_2}=\frac1{2T_1}+\frac1{T_\phi}`,
        context: 'Independent exponential relaxation and dephasing'
      },
      title: 'Relaxation, Ramsey, and Echo',
      question: 'Which experiment measures population loss and which measures loss of phase coherence?',
      prerequisites: ['L63-lindblad-quantum-dynamics', 'L74-coherent-drives-rabi-oscillations'],
      durationMinutes: 40,
      reference: {
        title: "A quantum engineer's guide to superconducting qubits",
        authors: 'Krantz et al.',
        citation: 'Appl. Phys. Rev. 6, 021318 (2019)',
        relevantSections: 'Decoherence and characterization techniques',
        doi: '10.1063/1.5089550',
        arxivUrl: 'https://arxiv.org/abs/1904.06560'
      },
      overview:
        'The same qubit can retain its energy population while losing relative phase. Pulse sequences isolate the two effects under different assumptions.',
      theory: String.raw`### Measure energy relaxation with an idle

Prepare $|1\rangle$, wait $t$, and measure in the computational basis. For constant transition rates, the excited population follows

$$
P_1(t)=P_{\mathrm{eq}}+[P_1(0)-P_{\mathrm{eq}}]e^{-t/T_1}.
$$

The asymptote $P_{\mathrm{eq}}$ can be nonzero. Fit it or estimate it independently if the qubit has appreciable thermal excitation. Readout and preparation errors can also shift the observed amplitude and baseline.

### Use Ramsey fringes and an echo to probe phase

Two $\pi/2$ pulses with an idle between them map phase to population. In one phase convention the signal is $B+A\,C(t)\cos(\Delta t+\phi)$, where $C(t)$ is the coherence envelope. Slowly varying frequency offsets across repetitions can give a Gaussian envelope. Report the fit model with the resulting $T_2^*$.

A $\pi$ pulse halfway through a Hahn echo reverses phase accumulation from a static detuning. It cannot undo energy relaxation. For a model with independent exponential pure dephasing and population relaxation, $1/T_2=1/(2T_1)+1/T_\phi$. A Gaussian Ramsey fit cannot be inserted directly into that rate equation.`,
      example: String.raw`### Extract an exponential dephasing time

Suppose $T_1=80\,\mu\mathrm{s}$ and the homogeneous exponential coherence time is $T_2=60\,\mu\mathrm{s}$. Then $1/T_\phi=1/60-1/160=1/96$ in inverse microseconds. The inferred $T_\phi$ is $96\,\mu\mathrm{s}$. If only slow static detuning were present in addition to relaxation, an ideal echo would refocus that detuning and its relaxation-limited envelope would be $e^{-t/(2T_1)}$.`,
      exercise: String.raw`**Plan a drift check.** How could a slow change in readout baseline bias a scan gathered in increasing idle time? How would you test whether the fitted time reflects genuine relaxation?

**Check:** Baseline drift would line up with idle time and could imitate a change in decay. Shuffle or interleave delays, collect fresh readout references, and repeat the scan in independent blocks.`
    },
    {
      id: 'L82-randomized-benchmarking',
      formula: {
        name: 'Randomized benchmarking decay',
        expression: String.raw`\Pr(\mathrm{return})=A p^m+B`,
        context: 'Zeroth-order Clifford randomized benchmarking model'
      },
      title: 'Randomized Benchmarking and Its Assumptions',
      question: 'What does the decay rate of random Clifford sequences measure?',
      prerequisites: ['L21-clifford-group-definition', 'L81-relaxation-ramsey-echo'],
      durationMinutes: 45,
      reference: {
        title: 'Characterizing quantum gates via randomized benchmarking',
        authors: 'Magesan, Gambetta & Emerson',
        citation: 'Phys. Rev. A 85, 042311 (2012)',
        relevantSections: 'Protocol and fitting models',
        doi: '10.1103/PhysRevA.85.042311',
        arxivUrl: 'https://arxiv.org/abs/1109.6887'
      },
      overview:
        'Randomized benchmarking reports an average error per Clifford under a model. The modeled decay and the assumptions behind it matter as much as the reported number.',
      theory: String.raw`### Undo a random sequence

Sample $m$ Clifford gates and append the inverse of their product. Ideally the circuit returns the input state. For each length, sample several independent gate sequences. Run multiple shots on each sequence, then estimate mean survival across the sequences.

With effectively gate-independent, time-stationary Markovian noise, averaging over Cliffords turns the modeled noise into a depolarizing channel. The fit is $A p^m+B$. The constants absorb fixed preparation and measurement effects and the noise of the final inversion under the model. The average infidelity per Clifford is $r=(d-1)(1-p)/d$ in dimension $d$.

### Check the model against the data

Inspect residuals and compare runs separated in time. Leakage, gate dependence, or drift can violate the single-decay model. For uncertainty, keep the sequences as sampling units. Extra shots reduce readout sampling error but do not replace extra sequences. A Clifford may compile into several different physical pulses. Translating to error per primitive gate or isolating one gate with interleaved benchmarking requires additional assumptions.`,
      example: String.raw`### Interpret a qubit fit

For $p=0.992$ and $d=2$, the inferred $r=(1-0.992)/2=0.004$, or $0.4\%$ per Clifford. Dividing this by an average of two pulses would give a rough estimate only under a small, similar, and effectively stochastic error per pulse. The same fit can hide a systematic overrotation. [The next lesson](/topics/quantum-noise-characterization/L83-coherent-stochastic-errors) compares errors with equal average infidelity.`,
      exercise: String.raw`**Choose the unit of a resampling check.** For each length you have 30 random sequences with 500 shots each. How should you resample to capture variation across sequences?

**Check:** Resample the 30 sequences at each length as groups and refit. Treating all $15{,}000$ outcomes as independent draws of new sequences would omit sequence-to-sequence variation.`
    },
    {
      id: 'L83-coherent-stochastic-errors',
      formula: {
        name: 'Unitarity of a qubit channel',
        expression: String.raw`u=\operatorname{Tr}(M^{\mathsf T}M)/3`,
        context: 'Bloch matrix definition for one qubit'
      },
      title: 'Coherent and Stochastic Error Accumulation',
      question: 'How can two errors with the same average infidelity behave so differently in a circuit?',
      prerequisites: ['L82-randomized-benchmarking'],
      durationMinutes: 40,
      reference: {
        title: 'Estimating the coherence of noise',
        authors: 'Wallman, Granade, Harper & Flammia',
        citation: 'New J. Phys. 17, 113020 (2015)',
        relevantSections: 'Definition and properties of unitarity',
        doi: '10.1088/1367-2630/17/11/113020',
        arxivUrl: 'https://arxiv.org/abs/1503.07865'
      },
      overview:
        'A small rotation builds phase predictably when repeated about the same axis. An independent random flip builds population much more slowly in that experiment, even when both single-use infidelities match.',
      theory: String.raw`### Match the single-use error

Compare an unwanted $R_x(\epsilon)=e^{-i\epsilon X/2}$ with an independent $X$ flip applied with probability $q=\sin^2(\epsilon/2)$. Both have average gate infidelity $2q/3$ relative to the identity. An average infidelity gives a useful scalar but discards how the channel moves different states.

### Repeat from the same input

Starting in $|0\rangle$, after $m$ identical overrotations the angle is $m\epsilon$, so $P_1=\sin^2(m\epsilon/2)$. For independent flips, the final bit is 1 if the number of flips is odd. The difference between even and odd probabilities is $(1-2q)^m$, so $P_1=[1-(1-2q)^m]/2$.

### Measure a different summary

For a unital qubit channel with Bloch-vector map $v\mapsto Mv$, unitarity is $\operatorname{Tr}(M^\mathsf{T}M)/3$. The coherent rotation has unitarity 1 because $M$ is orthogonal. The bit-flip channel shrinks the axes perpendicular to $X$ by $1-2q$, giving unitarity $[1+2(1-2q)^2]/3$. This distinguishes the examples without identifying a general channel from two scalars.`,
      example: String.raw`### Repeat a 0.02 rad overrotation 50 times

Here $q\approx0.0001$. After 50 uses, the coherent model predicts $\sin^2(0.5)\approx22.98\%$ excited population. The stochastic model predicts about $0.50\%$. The comparison uses the same axis every time. A circuit that reverses the overrotation sign can cancel the coherent angle instead.`,
      exercise: String.raw`**Alternate the sign.** Replace every second $R_x(\epsilon)$ with $R_x(-\epsilon)$. What happens after an even number of uses? What if the noise is the independent $X$ channel instead?

**Check:** Consecutive opposite rotations multiply to identity. The independent bit flips still accumulate according to their parity because reversing the rotation sign leaves $q$ unchanged.`
    },
    {
      id: 'L84-noise-spectroscopy-filter-functions',
      formula: {
        name: 'Filter-weighted phase variance',
        expression: String.raw`\operatorname{Var}(\varphi)=\int S(\omega)|Y(\omega)|^2\frac{d\omega}{2\pi}`,
        context: 'Classical Gaussian pure dephasing'
      },
      title: 'Noise Spectroscopy with Filter Functions',
      question: 'How do the timings of refocusing pulses select which noise frequencies matter?',
      prerequisites: ['L81-relaxation-ramsey-echo', 'L83-coherent-stochastic-errors'],
      durationMinutes: 50,
      reference: {
        title: 'How to enhance dephasing time in superconducting qubits',
        authors: 'Cywiński, Lutchyn, Nave & Das Sarma',
        citation: 'Phys. Rev. B 77, 174509 (2008)',
        relevantSections: 'Filter functions and pulse sequences',
        doi: '10.1103/PhysRevB.77.174509',
        arxivUrl: 'https://arxiv.org/abs/0712.2225'
      },
      overview:
        'A control sequence changes the sign with which frequency fluctuations accumulate phase. Varying the sequence changes which frequency bands it probes.',
      theory: String.raw`### Track the sign of phase accumulation

Model pure dephasing as a zero-mean stationary classical Gaussian frequency shift $\delta(t)$ in radians per second. In the toggling frame each ideal $\pi$ pulse reverses the sign of the phase coupling. Write that sign as $y(t)=\pm1$. The phase accumulated in a sequence of length $T$ is $\varphi=\int_0^T y(t)\delta(t)\,dt$.

The coherence is $\langle e^{i\varphi}\rangle=e^{-\operatorname{Var}(\varphi)/2}$. Use the two-sided spectral density convention $C(\tau)=\int S(\omega)e^{-i\omega\tau}\,d\omega/(2\pi)$ for the autocovariance. Substituting into the phase variance gives

$$
\operatorname{Var}(\varphi)=\int_{-\infty}^{\infty} S(\omega)|Y(\omega)|^2\,\frac{d\omega}{2\pi},\qquad Y(\omega)=\int_0^T y(t)e^{i\omega t}\,dt.
$$

### Change the pulse timings to probe another band

Ramsey has $y=1$ and $Y(0)=T$. Echo has equal positive and negative durations, hence $Y(0)=0$. A train of equally spaced refocusing pulses, such as CPMG, creates peaks at nonzero frequencies. Each measured decay constrains a weighted integral of the spectrum. Inferring a spectrum needs a set of timings and a model for what frequencies contribute. Account for finite pulse errors and energy relaxation when comparing measured decay to this pure-dephasing formula.`,
      example: String.raw`### Average over a static offset

In each run let $\delta$ be constant, with a fresh Gaussian draw of variance $\sigma^2$ across runs. Ramsey accumulates $\delta T$, giving coherence $e^{-\sigma^2T^2/2}$. Echo accumulates $\delta T/2-\delta T/2=0$. If the echo pulse is shifted to time $3T/4$, the residual phase is $\delta T/2$. Its variance is one quarter of Ramsey's.`,
      exercise: String.raw`**Compare two equal-time measurements.** One refocusing sequence has a shorter spacing between refocusing pulses than another. What happens to its main sensitive band? Why can neither sequence read the spectrum at one frequency directly?

**Check:** Shorter spacing moves the dominant band to higher frequency. Finite duration makes the filter bands broad, and multiple peaks can contribute. The measured variance integrates the spectral density over all the bands.`
    }
  ]
);

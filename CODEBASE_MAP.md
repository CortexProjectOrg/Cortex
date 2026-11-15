# Codebase map: concept to source

[Index](README.md) · [Glossary](GLOSSARY.md) · [Plan](PLAN.md)

Begin with a function you can explain on a tiny example. File names and symbol names are more durable than line numbers. This map was checked against the working checkout on 15 November 2026; refresh the GPU exports and routing decisions as the library evolves.

## Core path for the first month

| Idea | File and symbols to find | Question to answer |
|---|---|---|
| Pauli labels | [pauli/string.rs](../sympleq/sympleq-rust/sympleq-core/src/pauli/string.rs): PauliString, qubit, components | Where are x and z stored, and what is missing without a phase? |
| Commutation and phases | [pauli/string.rs](../sympleq/sympleq-rust/sympleq-core/src/pauli/string.rs): symplectic_product, commutes_with, acquired_phase | Which calculation tests commutation, and which records multiplication order? |
| Representation | [tableau.rs](../sympleq/sympleq-rust/sympleq-core/src/tableau.rs), [symplectic_phase.rs](../sympleq/sympleq-rust/sympleq-core/src/symplectic_phase.rs) | Which arithmetic belongs to labels and which to phases? |
| Clifford gate action | [clifford/gate.rs](../sympleq/sympleq-rust/sympleq-core/src/clifford/gate.rs): hadamard, phase, controlled_x, conjugated | How does a gate specify an operator image? |
| Conjugation contract | [clifford/conjugation.rs](../sympleq/sympleq-rust/sympleq-core/src/clifford/conjugation.rs) | Which types preserve phase when conjugated? |
| State and generators | [stabilizer/state.rs](../sympleq/sympleq-rust/sympleq-core/src/stabilizer/state.rs): StabilizerState, zeros | How can a state be described using generators? |
| Circuit as data | [program.rs](../sympleq/sympleq-rust/sympleq-core/src/program.rs): Instruction, Program, push, measure_all | Where do instructions and reads live? |
| Execution interface | [simulate/mod.rs](../sympleq/sympleq-rust/sympleq-core/src/simulate/mod.rs): Backend, counts, StabilizerSimulator's run | Who runs a program and who tallies records? |
| Route selection | [simulate/routes.rs](../sympleq/sympleq-rust/sympleq-core/src/simulate/routes.rs): Routes::shots | Why does the small Clifford example select frames? |
| Batched sampling | [simulate/frames.rs](../sympleq/sympleq-rust/sympleq-core/src/simulate/frames.rs): frame_shots, reference_digits, FrameBatch | Which work is shared and which scales with shots? |
| Packed arithmetic | [bits.rs](../sympleq/sympleq-rust/sympleq-core/src/bits.rs) and frame columns | Are bits indexing qubits in a row or shots in a column? |

For the zero-start, noiseless Clifford exercise, follow:

```text
Backend::counts
  -> StabilizerSimulator's Backend::run
    -> compilation and Routes::shots
      -> frame_shots
        -> callback receives each record
  -> counts tallies records in a map
```

Other starts, gates, and instructions can select other routes. Understanding this one route is the first month's target.

## The surrounding crates

| Crate | Main purpose | When to browse |
|---|---|---|
| [sympleq-core](../sympleq/sympleq-rust/sympleq-core/src/lib.rs) | Algebra, states, programs, simulation | Throughout the first month |
| [sympleq-models](../sympleq/sympleq-rust/sympleq-models/src/lib.rs) | Models and example inputs | When a concrete Hamiltonian or circuit would help |
| [sympleq-fermion](../sympleq/sympleq-rust/sympleq-fermion/src/lib.rs) | Gaussian/free-fermion simulation | After learning Majorana operators and covariance matrices |
| [sympleq-application](../sympleq/sympleq-rust/sympleq-application/src/lib.rs) | Symmetry, spectra, QEC, measurement estimation | Choose one application after the foundations |
| [sympleq-report](../sympleq/sympleq-rust/sympleq-report/README.md) | Reports and CLI workflow | When following an end-to-end Hamiltonian analysis |
| [sympleq-gpu](../sympleq/sympleq-rust/sympleq-gpu/src/lib.rs) | Optional CUDA numerical work | After choosing an equivalent CPU workload |

## Current GPU boundary

Inspect [the public exports](../sympleq/sympleq-rust/sympleq-gpu/src/lib.rs), [CUDA host code](../sympleq/sympleq-rust/sympleq-gpu/src/cuda.rs), and [covariance integration](../sympleq/sympleq-rust/sympleq-gpu/src/cuda/covariance.rs). Current exports include ground_energy and integrate_covariances. Ground-state solving and AQUIRE covariance post-processing are different tasks from taking circuit shots. Inspect them as examples of data movement; do not compare their times with counts as though the outputs were equivalent.

For later study, the application has a [measurement overview](../sympleq/sympleq-rust/sympleq-application/src/measurement/README.md). Its statistical model is additional theory, not assumed knowledge in the first four sessions.

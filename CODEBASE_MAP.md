# Architecture Guide: Concept to Implementation Examples

[Index](README.md) · [Glossary](GLOSSARY.md) · [Plan](PLAN.md)

This guide maps abstract quantum theory and symplectic invariants to concrete, canonical Rust implementation patterns. Rather than tying understanding to any single proprietary repository, code is proposed here as an educational reference architecture that can be implemented in any high-performance systems language.

## Core Architectural Progression

| Mathematical Invariant | Implementation Pattern (Example) | Architectural & Design Question |
|---|---|---|
| Pauli labels | `struct PauliString { x: Vec<u64>, z: Vec<u64> }` | Where are $X$ and $Z$ bits stored, and why are global phases separated from symplectic labels? |
| Commutation & phases | `fn symplectic_product(&self, other: &Self) -> u8` | Which bitwise calculation evaluates commutation ($\omega(u,v)=0$), and which tracks phase acquisition? |
| Tableau representation | `struct Tableau { table: Vec<PauliString>, phases: Vec<u8> }` | Which matrix arithmetic operates in $\mathbb{F}_2$ and which updates phase signs in $\mathbb{Z}_4$? |
| Clifford gate action | `fn conjugate(&self, p: &PauliString) -> PauliString` | How does a Clifford gate specify image rows on the standard symplectic basis? |
| Conjugation contracts | `trait ConjugatePhase` | Which types drop global phase during conjugation versus preserving relative phase signs? |
| Stabilizer states | `struct StabilizerState { generators: Vec<PauliString> }` | How is a $2^n$-dimensional state uniquely specified by $n$ commuting independent generators? |
| Circuit as pure data | `struct Program { instructions: Vec<Instruction> }` | Why separate circuit instruction sequences from simulator state and execution? |
| Execution interface | `trait Backend { fn run(&mut self, prog: &Program) }` | How does an abstract backend decouple circuit semantics from memory representation? |
| Route selection | `enum ExecutionRoute { TableauExact, FrameSampling }` | Why do Clifford circuits without non-Clifford gates select batched frame sampling? |
| Batched sampling | `struct FrameBatch { shots: usize, columns: Vec<u64> }` | What state work is computed once per gate versus replicated across thousands of shots? |
| Packed bit arithmetic | Bitwise 64-bit words (`u64::count_ones() & 1`) | How do 64-bit SIMD registers accelerate row operations and multi-shot bit columns? |

---

## Canonical Execution Pipeline (Example Flow)

For an $n$-qubit stabilizer circuit initialized in $|0\dots 0\rangle$ and measured across repeated shots, the canonical execution pipeline follows:

```text
Backend::counts(&program, shots)
  └── Backend::run (StabilizerSimulator)
        ├── Step 1: Circuit validation & pass optimization
        ├── Step 2: Route selection (Tableau tracking vs. FrameBatch sampling)
        ├── Step 3: Fast-path frame propagation
        │     └── Gate update applied across 64-shot packed u64 columns
        ├── Step 4: Measurement sample extraction
        │     └── Stream individual bit records to output accumulator
        └── Step 5: Tally identical measurement bitstrings into Map<String, usize>
```

---

## Modular Systems Architecture

Modern quantum simulation engines are organized into layered modules. When designing your own implementation:

| Module Layer | Primary Responsibility | Key Theoretical Invariant |
|---|---|---|
| **Core** | Symplectic algebra, Pauli strings, stabilizer states, Clifford tableaux | Symplectic form preservation: $S^T J S \equiv J \pmod 2$ |
| **Models** | Standard circuit benchmarks (GHZ, QFT, random Clifford) and physical Hamiltonians | Jordan-Wigner and Bravyi-Kitaev operator encodings |
| **Fermion** | Majorana modes, covariance matrix tracking, Gaussian state evolution | Canonical anticommutation: $\{c_j, c_k\} = 2\delta_{jk}$ |
| **Applications** | Syndrome extraction, quantum error correction decoders, shadow estimation | Classical shadow snapshot unbiased estimators |
| **Acceleration** | AVX-512 SIMD bitwise kernels, GPU CUDA memory transfers, pinned host buffers | Packed 64-shot column vectorized XOR and parity reductions |

---

## Hardware Acceleration Boundary & Design Rules

When implementing high-throughput simulation engines on GPUs or accelerators:

1. **Separate Data Movement from Algorithmic Throughput**: Moving a tableau to a GPU device takes orders of magnitude longer than executing a single bitwise XOR. Acceleration is only advantageous when batch sizes exceed hundreds of thousands of parallel shots or when computing large covariance matrices.
2. **Column-Major Multi-Shot Layout**: In memory, organize shots along word columns ($64$ shots per `u64`), rather than storing separate tableaux per shot. A single bitwise `^` instruction then updates $64$ parallel simulation trajectories simultaneously.
3. **Equivalence of Verification Baselines**: Never compare an accelerated covariance integration routine against a circuit shot sampling routine—they compute fundamentally distinct quantities with distinct error bounds.

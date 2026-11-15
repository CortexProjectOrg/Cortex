# Study Plan: 4-Hour Pack Progression to Mastery

[Index](README.md) · [Personal path](PERSONAL_PATH.md) · [Progress](PROGRESS.md)

## Purpose

Build an authoritative, mathematically rigorous foundation you can defend with concrete proofs and code examples: why Pauli labels are binary, where phases belong, why Clifford maps preserve symplectic commutation, how stabilizer measurement works, and how these ideas translate into high-performance simulation code. Use Rust to verify and investigate your theoretical derivations.

The study path is organized into structured 4-hour mastery packs designed for focused, self-paced progress across foundational quantum theory and systems architecture.

## Budget and Rhythm

Each 4-hour pack is structured into four 60-minute blocks, balancing rigorous paper derivations with practical systems implementation:

| Block | Purpose | Core Output |
|---|---|---|
| **Block 1** — Theory (60 min) | Learn the core mathematical concept and establish invariants | Derivations on paper, lemma proofs |
| **Block 2** — Implementation (60 min) | Model the concept through high-performance Rust example code | Type definitions, unit tests, bitwise operations |
| **Block 3** — Theory (60 min) | Connect the concept to the next structural quantum theorem | Invariant preservation proofs ($S^T J S \equiv J$) |
| **Block 4** — Verification (60 min) | Verify paper predictions against simulated outputs | Benchmarks, test suites, and reflection notes |

Take 10–15 minutes between blocks. Practice exercises are contained within the four-hour pack budget. If an investigation expands, carry it forward systematically into your custom learning path.

## Foundational 4-Hour Study Packs

| Pack | Mathematical Theory | Practical Systems Output |
|---|---|---|
| [Pack 1: Foundations](sessions/01-foundations/README.md) | Fields with two elements ($\mathbb{F}_2$), vector spaces, symplectic bases, linear transformations | A bit-pair operator type, memory ownership model, and unit tests |
| [Pack 2: Qubits and Paulis](sessions/02-quantum-paulis/README.md) | Hilbert state vectors, measurement projection, global vs. relative phase, Pauli group, symplectic form | Single-qubit matrix derivations and a commutation checker |
| [Pack 3: Cliffords and Stabilizers](sessions/03-cliffords-stabilizers/README.md) | Group conjugation, symplectic preservation, commuting generator groups, Bell states | Gate-action tests, Bell state circuit, and pure-data program representation |
| [Pack 4: Measurement & Performance](sessions/04-measurement-performance/README.md) | Stabilizer measurement theorem, Gottesman-Knill polynomial scaling, batched frame sampling | CPU execution flow diagram, 64-bit word bitwise benchmarks |

Each pack contains separate theory, exercises, and architectural code tours. Read the pack overview first; use the companion pages for deep reference while working.

## Scope & Architectural Boundaries

Begin with qubits and Clifford circuits. Prime-dimension qudits, non-Clifford stabilizer decompositions, tableau canonicalization, Lanczos algorithms, and GPU kernels represent advanced extensions. The foundational 16 hours establish a comprehensive mastery of the central stabilizer simulation pipeline.

## Advancing Beyond the Foundational Packs

Use [your personal path](PERSONAL_PATH.md) to formulate your next research investigation. Select a [pack template](templates/SESSION.md), allocate a 4-hour budget, and link your notes directly to the workspace index. Each new topic should specify one theoretical prerequisite, one paper derivation, one testable code example, and clear criteria for completion.

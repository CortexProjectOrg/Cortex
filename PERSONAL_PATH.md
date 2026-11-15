# My learning path

[Index](README.md) · [Progress](PROGRESS.md) · [Templates](templates/README.md)

Edit this page as you learn. Choose a direction because of a question you want to answer. You do not need to complete every branch.

## My starting point

- Why I want to understand this project:
- Programming experience I can draw on:
- Mathematics I already know:
- Topics I want help explaining:
- Available study time: four focused hours per session, adjustable.
- Preferred theory/practice balance: currently about 50/50.

## My next session

- Main question:
- Prerequisite I want to refresh:
- Theory selection, about two hours:
- Practical task, about two hours:
- Prediction I will check:
- Evidence I want to keep:
- A sensible stopping point:
- If the task expands, I will defer:

Keep one active session here. Put other interests in the small backlog below.

## Choose a branch after the foundations

| Direction | Useful prerequisites | First question | Small next project |
|---|---|---|---|
| More mathematics | Sessions 1–3 | How do commuting generator sets relate to linear independence? | Compute a few symplectic products and dependent generator examples by hand, then check them |
| More Rust | Session 1 | How do enums, traits, slices, and Result support the public API? | A small Pauli-label parser with explicit errors and tests |
| Stabilizer simulation | Sessions 2–4 | How does a measurement change the tableau? | Trace one random and one deterministic Pauli measurement on two qubits |
| CPU performance | Session 4 | Which part of one sampling call dominates? | Separate setup, sampling, and output tallying in a small reproducible experiment |
| GPU programming | A correct CPU exercise and basic cost model | Which independent work is worth offloading? | Port a small batched XOR exercise and compare identical inputs before attempting a simulator |
| Hamiltonians and the existing GPU solver | Pauli operators, complex inner products, eigenvalues | What problem does matrix-free Lanczos solve? | Compare a tiny Hamiltonian's known eigenvalues with a CPU solve before reading the CUDA loop |
| Measurement estimation | Pauli observables and elementary probability | How do sample means and covariances determine an error bar? | Derive a two-observable toy estimate before inspecting AQUIRE integration |
| FPGA/digital logic | Boolean algebra, registers, finite-state machines | How does a clocked circuit differ from a software loop? | Simulate a small XOR datapath; hardware purchase and board-specific tooling can wait |

Useful starting sources are listed in [SOURCES](SOURCES.md). For advanced mathematical conventions use Q4; for GPU basics use G1/G2; for digital logic use F1. Do not turn the reference shelf into a requirement to read everything.

## How I add a new Saturday

1. Copy [the session template](templates/SESSION.md) into a new numbered folder under sessions, such as `05-tableau-measurement/README.md`.
2. Pick one main question and one prerequisite. Add theory, exercises, or code-tour files only when they make navigation clearer.
3. Select one or two sources. Record the exact section and the question it should answer.
4. Give the session two theory blocks and two practical blocks, or deliberately write down a different balance.
5. Link the session from [the index](README.md), this page, and the preceding session's notes. Create its note using [the note template](templates/NOTE.md).
6. After trying it, adjust the scope and record what changed your understanding.

## A later CPU/GPU comparison

Before selecting an API, write down the same input, numerical task, output, accuracy requirement, and timed boundary for both devices. Circuit sampling, Hamiltonian eigensolving, and covariance post-processing are three different workloads. Choose one. Start with correctness and a CPU baseline, then add transfers and synchronization to the GPU comparison.

FPGA development is a separate possible route. It is not a prerequisite for understanding the library or its GPU implementation.

## A small backlog

| Question | Why it interests me | Prerequisite or source | Next tiny action |
|---|---|---|---|
| | | | |
| | | | |
| | | | |

## Decisions and changes

| Date | What I chose or changed | What prompted it |
|---|---|---|
| | | |

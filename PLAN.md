# Plan: four Saturdays of theory and experiments

[Index](README.md) · [Personal path](PERSONAL_PATH.md) · [Progress](PROGRESS.md)

## Purpose

Build an explanation you can defend with small examples: why Pauli labels are binary, where phases belong, why Clifford maps preserve commutation, how stabilizer measurement works, and where these ideas appear in Sympleq. Use Rust to investigate your predictions.

The original Sunday plan has been reorganized into the sessions below. Use Saturdays as requested. If you want calendar labels, the next four are 21 and 28 November, then 5 and 12 December 2026. The sequence works equally well without dates.

## Budget and rhythm

Reserve four focused hours, plus breaks. Each session has two one-hour theory blocks and two one-hour practical blocks. Theory includes working examples on paper. Practical time includes learning Rust, reading source, debugging, and writing notes.

| Block | Purpose |
|---|---|
| 1 — theory, 60 min | Learn one idea and make a paper prediction |
| 2 — practical, 60 min | Explore it through Rust or a small simulation |
| 3 — theory, 60 min | Connect it to the next mathematical idea |
| 4 — practical, 60 min | Check predictions and record what is still unclear |

Take 10–15 minutes between blocks. Homework is inside the four-hour budget. There is no required weekday work or catch-up session. If a task expands, carry it forward and reduce the extensions.

## The first four sessions

| Session | Theory | Practical evidence |
|---|---|---|
| [1: Foundations](sessions/01-foundations/README.md) | Fields with two elements, vectors, bases, linear maps, composition | A bit-pair type, an ownership example, and meaningful tests |
| [2: Qubits and Paulis](sessions/02-quantum-paulis/README.md) | State vectors, measurement, global/relative phase, Pauli multiplication, symplectic products | Single-qubit experiments and a commutation checker compared with Sympleq |
| [3: Cliffords and stabilizers](sessions/03-cliffords-stabilizers/README.md) | Conjugation, symplectic preservation, commuting generators, Bell states | Gate-image checks, a Bell circuit, and a description/execution diagram |
| [4: Measurement and performance](sessions/04-measurement-performance/README.md) | Stabilizer measurement, polynomial simulation, batching, acceleration limits | A CPU call diagram and a small timing CSV |

Each session has separate theory, homework, and code-tour pages. Read the session overview first; use the remaining pages as references while working. The sources page distinguishes introductory selections from later research reading.

## Scope

Begin with qubits and small Clifford circuits. Prime-dimension qudits, non-Clifford stabilizer sums, tableau repair details, Lanczos, CUDA kernels, and FPGA development are later branches. Sixteen hours can establish a working understanding of one route through the repository; it will not cover all its algorithms.

The long-term CPU/GPU comparison remains a useful project. First identify a computation, an equivalent CPU baseline, and a correctness check. In the current checkout, GPU support includes ground-state solving and AQUIRE covariance integration; these are different tasks from sampling circuit shots. Recheck exports when choosing a later project.

## After four sessions

Use [your personal path](PERSONAL_PATH.md) to choose one next question. Copy a [session template](templates/SESSION.md), assign a four-hour budget, and add the resulting link to the index. A new topic should have one prerequisite, one prediction, one experiment or derivation, and a clear place to stop.

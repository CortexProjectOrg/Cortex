# Sources and reading guide

[Index](README.md) · [Plan](PLAN.md) · [Personal path](PERSONAL_PATH.md)

Primary teaching materials, official documentation, and original research. Links checked on 15 November 2026. This is a reference shelf. Usually select 15–25 minutes of reading within a theory block and spend the rest working an example. Optional research reading is not extra homework.

## R0

**Rust: Cargo basics.** [Hello, Cargo!](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html)

Use during [setup](SETUP.md). Read creating, building, and running a project. Stop when you can locate the manifest and source and run the practice project. Skip this selection if those steps are already familiar.

## R1

**Rust: ownership.** [What Is Ownership?](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)

Session 1. Focus on moving a String, scope, and why the original binding cannot be reused after a move. Make one failing example and explain the compiler's message. The detailed memory diagrams are available when useful.

## R2

**Rust: references.** [References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)

Session 1. Read the borrowed-String example and the basic mutable-reference rules. Explain a function taking &T versus T. Stop before trying to master lifetimes or every ownership pattern in the repository.

## R3

**Rust: methods.** [Methods](https://doc.rust-lang.org/book/ch05-03-method-syntax.html)

Session 1. Focus on impl, &self, and associated functions. Adapt the pattern to BitPair. The exercise is about deciding what the method means and how it accesses its inputs.

## R4

**Rust: tests.** [How to Write Tests](https://doc.rust-lang.org/book/ch11-01-writing-tests.html)

Session 1 onward. Read the opening test structure and assertion examples. Write tests for mathematical properties. Test organization, custom harnesses, and every later subsection can wait.

## M1

**Linear algebra refresher.** [MIT: Multiplication and Inverse Matrices](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/ax-b-and-the-four-subspaces/multiplication-and-inverse-matrices/)

Session 1. Use one matrix-product or inverse example. The lecture's usual real-number setting differs from the modulo-two exercises in this notebook; apply the same multiplication pattern with arithmetic reduced modulo two. Skip the full lecture/problem set unless you choose a mathematics branch.

## Q1

**Qubit states, operations, and measurement.** [IBM Quantum Learning: Single Systems introduction](https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/single-systems/introduction)

Session 2. Use the introduction or the relevant part of its lesson to clarify state vectors and operations. Work a two-component example afterward. No account-based exam, certificate, or complete course is required. The local theory page supplies the definitions needed for the homework.

## Q2

**Operators and stabilizers.** Daniel Gottesman, [The Heisenberg Representation of Quantum Computers](https://arxiv.org/abs/quant-ph/9807006).

Session 3 or later. Read the opening explanation of following operators and the Pauli/stabilizer examples. Prerequisite: distinguish a state from an operator and understand Pauli multiplication. Stop when you can explain one small stabilizer example; the full paper is optional.

## Q3

**Efficient stabilizer simulation.** Scott Aaronson and Daniel Gottesman, [Improved Simulation of Stabilizer Circuits](https://arxiv.org/abs/quant-ph/0406196).

Session 4. Read the introduction and locate the description of a tableau and measurement cases. Use it to connect the theorem to a compact representation. Leave algorithmic optimizations and complexity-class results for a later session.

## Q4

**Conventions and later qudit study.** Erik Hostens, Jeroen Dehaene, and Bart De Moor, [Stabilizer states and Clifford operations for systems of arbitrary dimensions, and modular arithmetic](https://arxiv.org/abs/quant-ph/0408190).

Optional after sessions 2–3. This is the representation reference named by the repository. Follow the definitions of Pauli labels, phase, multiplication, and commutation. Restrict your first comparison to qubits. General dimensions and the repository's mixed-prime-dimension extension are later topics.

## P1

**Reference samples and batched frames.** Craig Gidney, [Stim: a fast stabilizer circuit simulator](https://arxiv.org/abs/2103.02202).

Session 4 or later. Read the discussion of a reference sample and bulk Pauli-frame sampling. Ask which expensive work is shared. You do not need to reproduce Stim or read its full benchmark section to understand that idea.

## G1

**GPU programming concepts.** [NVIDIA CUDA: Programming Model](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html)

Optional extension or GPU branch. Focus on host/device responsibilities, threads, blocks, and independent output indices. Draw a tiny buffer-and-thread example. Toolkit installation, architecture details, and advanced kernels are separate sessions.

## G2

**Speedup and timing.** [NVIDIA CUDA Best Practices Guide](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html)

Session 4: find “Strong Scaling and Amdahl's Law.” GPU branch: find “Timing,” including CPU versus GPU timers and asynchronous completion. Explain the total timed boundary before optimizing it. This is conceptual reading; C++ details are optional until you choose to write CUDA code.

## F1

**Later digital-logic branch.** [MIT: Introductory Digital Systems Laboratory](https://ocw.mit.edu/courses/6-111-introductory-digital-systems-laboratory-fall-2002/)

Optional after the foundations. Look for combinational logic, registers, finite-state machines, and timing in the lecture notes. This is an older course: use it for concepts, not current board/tool installation instructions. FPGA study is a separate choice, not a GPU prerequisite.

## Adding a source

Record a stable link, author/provider, prerequisite, exact selection, time budget, question to answer, and a stopping point. Prefer original papers and official teaching/documentation. If a resource changes, update the link and keep the reason you chose it.

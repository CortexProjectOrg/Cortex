# Stabilizer measurement and the cost of simulation

[Session](README.md) · [Exercises](exercises.md) · [Code tour](code-tour.md) · [Sources](../../SOURCES.md)

## 1. Measurement of a pure stabilizer state

For a Hermitian Pauli observable, possible eigenvalues are +1 and -1. Computational-basis measurement of a qubit's Z observable encodes those as bits 0 and 1. Keep this outcome convention distinct from binary operator labels.

For a pure stabilizer state there are two cases:

- If the observable's eigenvalue is already fixed by the signed stabilizer group, the result is deterministic.
- If the observable anticommutes with a generator, the two eigenvalues are equally likely. The measurement updates the state and its generators.

In the second case, replace an anticommuting generator with the measured observable carrying the observed sign, and repair other affected generators. A full implementation needs careful row operations; the Bell example lets you see the principle without implementing tableau repair.

For Bell generators XX and ZZ, measuring ZI anticommutes with XX and therefore gives a random outcome. Afterward ZZ still fixes the parity of the two qubits. Work out the signs for each first outcome and determine the second result. Independent coin tosses would lose this constraint.

## 2. Why efficient classical simulation is possible

Stabilizer preparations, Clifford operations, and Pauli measurements can be simulated with polynomial-cost classical algorithms. The crucial ingredients are the compact generator description and its closure under the permitted transformations. See [Q3](../../SOURCES.md#q3) for the original simulation context.

This does not say that arbitrary quantum circuits are equally cheap. A generic non-Clifford step can leave the stabilizer family. The repository includes additional methods for those programs, with costs depending on the structure they introduce.

The first month's objective is to explain the mechanism on small cases, not prove every runtime bound or reproduce the optimized simulator.

## 3. Representation and repeated shots

A general n-qubit pure state has 2^n complex amplitudes. A pure stabilizer state's n generators require 2n^2 binary label entries plus phases in a minimal description. An implementation can keep extra rows, caches, and metadata.

Repeated sampling introduces another distinction: work shared by all shots versus work repeated for each shot. A rough model is:

```text
T_total = T_setup + shots * T_per_shot
```

Reference sampling shares a quantum reference calculation and follows many Pauli frames in bulk. Read the overview in [P1](../../SOURCES.md#p1). In this repository, the CPU can also hoist a shared noiseless prefix and pack 64 shot bits into a machine word.

Packing a Pauli row across qubits and packing a frame column across shots use similar bit operations on different axes. Draw the axis before counting words or estimating memory.

## 4. Limits of acceleration

For a fixed workload, let p be the fraction of baseline runtime accelerated by a factor k. With no additional overhead, the ideal total speedup is:

```text
speedup = 1 / ((1-p) + p/k)
```

This version of Amdahl's model assumes the remaining work is unchanged. Transfers, initialization, output conversion, and synchronization can reduce real benefit. The source discussion is in [G2](../../SOURCES.md#g2).

A fair CPU/GPU comparison needs the same numerical task, input, output, and accuracy requirement. A fast kernel for a different task does not establish a speedup for your simulator. The current GPU exports cover ground-state solving and covariance integration; circuit-shot sampling is a separate workload.

For GPU timing, measure completed work. Launching asynchronous work and stopping a CPU timer immediately measures submission costs rather than completion. A later GPU session can introduce events or explicit synchronization after establishing correctness.

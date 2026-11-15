# Code tour: a gate, a program, and a backend

[Session](README.md) · [Theory](theory.md) · [Exercises](exercises.md) · [Codebase map](../../CODEBASE_MAP.md)

## Gate action

In [clifford/gate.rs](../../../sympleq/sympleq-rust/sympleq-core/src/clifford/gate.rs), locate hadamard, phase, controlled_x, and conjugated. Notice how images of basis directions are stored as matrix rows. Match one row of controlled_x with a Pauli image from your derivation.

Read the short phase-related documentation in [clifford/conjugation.rs](../../../sympleq/sympleq-rust/sympleq-core/src/clifford/conjugation.rs). Different operand types retain different information; a PauliString drops conjugation phases, while phase-carrying types retain them.

## Circuit description

In [program.rs](../../../sympleq/sympleq-rust/sympleq-core/src/program.rs), find Instruction and the public Program methods new, push, instructions, and measure_all. A Program stores what to do and what is measured. Print its instructions for the Bell example if that helps make the data concrete.

## Execution interface

In [simulate/mod.rs](../../../sympleq/sympleq-rust/sympleq-core/src/simulate/mod.rs), find Backend::run and counts. The callback receives each shot's record; counts uses it to tally equal records in a map. The simulator supplies an implementation of run.

Draw:

```text
Program / Instruction
  -> Backend::run implemented by StabilizerSimulator
  -> one measurement record at a time
  -> counts tallies records
```

A Program does not execute itself. Leave compiler passes and the route selector for the next session.

## Questions

- What is stored data, and what is execution?
- Where does the code specify qubit placement?
- Which operand can establish a sign-sensitive result?

Record one function for each answer in [your notes](../../notes/03-cliffords-stabilizers.md).

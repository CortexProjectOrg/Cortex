# Code tour: labels, phases, and commutation

[Session](README.md) · [Theory](theory.md) · [Exercises](exercises.md) · [Codebase map](../../CODEBASE_MAP.md)

Open [pauli/string.rs](../../../sympleq/sympleq-rust/sympleq-core/src/pauli/string.rs). Follow this small sequence:

1. Construct X and Z using qubit(1,0) and qubit(0,1).
2. Read components to identify the stored row.
3. Find commutes_with and its call to symplectic_product.
4. Read acquired_phase's documentation and connect its multiplication order with your paper derivation.
5. Locate the existing tests about commutation and multiplication order. Compare their assertions with your own predictions.

The library handles arbitrary supported registers, so the general symplectic calculation includes per-qudit dimensions and lifts. Restrict this tour to all-qubit inputs. You can understand the special case before following the mixed-dimension arithmetic.

## A convention to record

PauliString represents the symplectic label alone. Its multiplication and conjugation do not carry every operator phase. The multiplication phase can be queried separately; PauliSum and stabilizer types carry additional phase information.

Locate [symplectic_phase.rs](../../../sympleq/sympleq-rust/sympleq-core/src/symplectic_phase.rs) as a later reference. Do not read every helper today.

## Questions

- Why can label products agree when ordered operator products differ?
- What are the two relevant moduli for qubits?
- Does one passing label test establish that a phase convention is correct?

Keep a source symbol beside each mathematical statement in [your notes](../../notes/02-quantum-paulis.md).

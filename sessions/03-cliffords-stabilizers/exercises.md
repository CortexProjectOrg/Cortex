# Homework: Clifford maps and Bell states

[Session](README.md) · [Theory](theory.md) · [Code tour](code-tour.md) · [My notes](../../notes/03-cliffords-stabilizers.md)

## E1. Conjugation on paper

Calculate HXH and HZH from the one-qubit matrices. Use the product-preservation identity to explain why commuting operators remain commuting after conjugation. Compare H's complex state matrix with its binary swap map on labels.

Extension: check F^T J F=J for the one-qubit swap. Keep the field and row/column convention visible. Another extension is to compare B^2=I as a binary map with S^2=Z as a quantum gate; explain why label identity does not imply physical identity.

## E2. Check the gate action

Construct PauliString labels for X and Z. Use Gate::hadamard().conjugated(&pauli, &[0]) and compare their components with E1. Read the relevant gate definitions during the [code tour](code-tour.md).

A successful label comparison cannot verify HYH=-Y. State that limitation before deciding how to check a sign. You can calculate the sign using matrices; using a phase-carrying library type is an optional later experiment.

## E3. Stabilizers on paper

Check that Z fixes |0> and X fixes |+>. Starting from |00>, derive the state after H on qubit 0 and CX from 0 to 1. Derive XX and ZZ by conjugating the initial generators. Check both generators against the final state.

Explain why a stabilizer generator's sign matters. Extension: multiply XX and ZZ and account for the resulting phase.

## E4. Build and change the circuit

Adapt [the harness](../../SETUP.md#circuit-harness-for-sessions-2-and-3) to two qubits. Insert H on qubit 0 followed by CX on [0,1], then measure all. Predict possible records before running.

Choose one change: remove CX, or add a second H before it. Make a new prediction and then run it. Keep the same register, seed, and shot count when useful. Compare structural facts, such as impossible records, rather than insisting on exactly equal random counts.

Essential version: one Bell prediction, one run, and a description/execution diagram. Extension: a seeded behavioural test that Bell sampling never produces an unequal pair. Such a finite sample is a regression check; the paper calculation establishes why those records are impossible.

## Keep and reflect

Save your state-vector calculation, generator calculation, gate-image check, and circuit experiment. Explain the same Bell circuit using at least two representations in [your notes](../../notes/03-cliffords-stabilizers.md).

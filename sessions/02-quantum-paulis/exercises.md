# Homework: qubits and Paulis

[Session](README.md) · [Theory](theory.md) · [Code tour](code-tour.md) · [My notes](../../notes/02-quantum-paulis.md)

## E1. State predictions

Calculate X|0>, Z|1>, H|0>, and H(H|0>). Compare Z acting on |1> with Z acting on |+>. Apply H to |+> and |-> and predict the subsequent measurement. Explain one global phase and one relative phase in these examples.

Essential version: H followed by H, plus the distinction between state and operator. Extension: write the matrices for Y and the phase gate S=diag(1,i), and check their action on a basis state.

## E2. Run the predictions

Use [the CPU harness](../../SETUP.md#circuit-harness-for-sessions-2-and-3) for separate circuits: no gate, X, H, and H followed by H. Use the same register and shot count. Before each run, write the possible records and their theoretical probabilities.

Compare predictions with observed counts. Do not demand exact equal frequencies for a random result. Essential version: two variants if setup consumes the block. Extension: run H-Z-H and explain why its result differs from H-H.

## E3. Commutation checker

On paper, multiply XZ and ZX. Use their difference to derive the phase term from the theory page. Then derive the one-qubit symplectic expression.

Extend BitPair with a commutation calculation. Compare every pair of I, X, Y, and Z labels against PauliString::commutes_with, using PauliString::qubit to construct them. Test a self-pair, identity with another label, and an anticommuting pair before expanding to all 16 comparisons.

Use acquired_phase on X,Z in both orders. Interpret its result as an exponent of i modulo four. A raw phase exponent is not an angle in radians.

Extension: compute the two-qubit symplectic products of XX with ZZ, and XI with ZI. Explain the result without multiplying four-by-four matrices.

## Keep and reflect

Save one paper calculation, one circuit prediction and result, and the commutation comparisons. In [your notes](../../notes/02-quantum-paulis.md), explain which information a PauliString contains and which it leaves to a phase-carrying type.

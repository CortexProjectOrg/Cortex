# Code tour: the first Pauli row

[Session](README.md) · [Theory](theory.md) · [Exercises](exercises.md) · [Codebase map](../../CODEBASE_MAP.md)

Limit this first tour to about 15 minutes at the end of block 4. If the type or tests need that time, begin here next session.

Open [pauli/string.rs](../../../sympleq/sympleq-rust/sympleq-core/src/pauli/string.rs). Find:

1. PauliString's documentation: one row and no phase storage.
2. qubit: constructs a one-qubit label from x and z.
3. components: returns the underlying row for inspection.

In the [practice project](../../SETUP.md), construct PauliString::qubit(1,0) and inspect components(). Compare its two numbers with your BitPair. Keep the return types and borrowing syntax visible while reading.

The library supports much more than one qubit, so its underlying Tableau is more general than the toy type. For n qubits, a row is [x0,...,x(n-1),z0,...,z(n-1)]. Your exercise matches the smallest case.

Leave the physical interpretation and commutation formula for [session 2](../02-quantum-paulis/README.md). You do not need to follow every constructor into the full tableau implementation yet.

## Questions

- Which method borrows an existing object?
- Why can a generic representation be more complicated than a two-field exercise?
- What does the documentation explicitly say this type does not store?

Record one unfamiliar line in [your notes](../../notes/01-foundations.md).

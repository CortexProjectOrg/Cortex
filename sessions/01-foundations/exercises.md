# Homework: foundations

[Session](README.md) · [Theory](theory.md) · [Code tour](code-tour.md) · [Record my work](../../notes/01-foundations.md)

These exercises occupy the session's four blocks. Essential work comes before extensions; unfinished items can move to the next Saturday.

## E1. Binary vectors

Write the addition and multiplication tables for F_2. List the combinations of e0=(1,0) and e1=(0,1), with each coefficient chosen from {0,1}. Explain in two sentences why this is a basis. Show one nonzero vector added to itself.

## E2. Matrices

Using A and B from [the theory page](theory.md#3-linear-maps-and-composition), find their action on the basis vectors. Calculate AB and BA. Choose one input on which the resulting maps differ. Work out A^2 and, if time permits, B^2. Keep track of the right-to-left composition order.

Essential version: one matrix-vector calculation and one order-sensitive comparison. Extension: prove linearity of each map for a general input pair, then find their inverses.

## E3. Ownership and borrowing

Use [setup](../../SETUP.md) and [R1/R2](../../SOURCES.md#r1). Write a function taking a String by value, then try using the caller's original binding afterward. Save the compiler diagnostic. Change the function to take a reference and show that the caller can still use its value.

Write what changed about ownership. Use a String for this exercise; a Copy bit-pair type would conceal the intended move example. An additional &mut String experiment is optional.

## E4. A small Rust type

Design:

```text
BitPair { x: bool, z: bool }
new(x, z) -> BitPair
combine(&self, other: &Self) -> BitPair
```

Implement component-wise binary vector addition. Choose method bodies and derives yourself. Read only the examples you need from [methods](../../SOURCES.md#r3) and [tests](../../SOURCES.md#r4).

Test adding zero, self-cancellation, reversing input order, and one specific prediction from your paper calculations. Two tests are enough if Rust setup takes longer than expected. Explain what each test establishes independently of your implementation.

Extension: implement A or B on BitPair and compare a few results with E2. Save the distinction between bit-vector maps and quantum-state operators for session 2.

## Keep and reflect

Save your calculations, code, test output, and one question in [your note](../../notes/01-foundations.md). You should be able to explain one mathematical property and one Rust ownership decision using your own examples.

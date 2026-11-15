# Binary arithmetic, vectors, and linear maps

[Session](README.md) · [Exercises](exercises.md) · [Code tour](code-tour.md) · [Glossary](../../GLOSSARY.md)

## 1. The field with two elements

F_2 contains 0 and 1. Add or multiply normally and reduce modulo two. In particular, 1+1=0. Addition is XOR; multiplication is AND for single bits. This gives a precise algebraic meaning to familiar bit operations.

A field provides addition, multiplication, and division by nonzero elements. In F_2 the only nonzero element is 1, so its inverse is itself. You do not need general finite-field theory for the first month.

A vector in F_2^n is a list of n bits. Its addition happens component by component. Scalars are also in F_2; multiplying a vector by zero gives zero, and multiplying by one keeps it.

## 2. Basis and independence

A linear combination combines vectors using field-valued coefficients. A set spans a space if every vector in the space is one of those combinations. A set is independent if only the all-zero coefficient choice gives the zero vector.

For two components, start with e0=(1,0) and e1=(0,1). List their four possible linear combinations. Then ask what fails if you replace e1 with a second copy of e0. This small example supplies the basis/independence intuition later needed for stabilizer generators.

The number of components is not the number of possible vectors. A two-component binary vector space contains four vectors. Later, a 2n-component Pauli-label space will contain 2^(2n) labels.

## 3. Linear maps and composition

A map L is linear when it preserves addition and scalar multiplication. A matrix describes a linear map after choosing bases. For column vectors, the action is v -> Mv. Matrix multiplication describes composition: ABv means apply B first, then A.

Use:

```text
A = [0 1]       B = [1 0]
    [1 0]           [1 1]
```

For example, A swaps a vector's two components. The matrix-product rule is unchanged from real linear algebra, but every sum is reduced modulo two. Work out B's action and the compositions in the exercises.

An invertible map has another map that undoes it. A matrix satisfying M^2=I is its own inverse. This is an algebraic property to establish, rather than assume because a transformation seems simple.

For a refresher on the product rule, see [M1](../../SOURCES.md#m1). The modulo-two setting here is our adaptation of the usual matrix calculations.

## 4. Conventions that will matter later

Write down which field your components belong to and whether you use row or column vectors. Quantum amplitudes will be complex numbers; Pauli labels will be binary. Matrices acting on those two objects can have different sizes and different meanings.

For today's calculations use columns. In canonical tableau data structures, Pauli labels are typically stored as rows in an $[x \mid z]$ block layout. Transposition connects the two conventions, but the side on which you multiply changes as well.

## Questions to carry forward

- What information does a vector contain, compared with the set of all vectors?
- Why can an order-sensitive composition be built from simple maps?
- If XOR is commutative, does that imply every matrix composition is commutative?

Keep examples for your answers; you will reuse these ideas for Pauli multiplication and Clifford maps.

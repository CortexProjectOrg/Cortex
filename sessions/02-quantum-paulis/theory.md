# Qubit states, Pauli labels, and the symplectic form

[Session](README.md) · [Exercises](exercises.md) · [Code tour](code-tour.md) · [Sources](../../SOURCES.md#q1)

## 1. States and operators

For one qubit, use the basis states |0>=[1,0]^T and |1>=[0,1]^T. A normalized state is a|0>+b|1>, where a and b are complex and |a|^2+|b|^2=1. Computational-basis measurement returns 0 or 1 with probabilities |a|^2 and |b|^2.

An operator acts on this vector. The examples for today are:

```text
X = [0 1]    Z = [1  0]    H = (1/sqrt(2)) [1  1]
    [1 0]        [0 -1]                    [1 -1]
```

Matrix composition applies the rightmost operation first. H is a coherent transformation: amplitudes can later add or cancel. Treating an unmeasured superposition as a classical random choice would lose that interference.

## 2. Global and relative phase

Multiplying an entire state by exp(i theta) leaves its measurement probabilities unchanged. Multiplying only one component by a phase can change later interference.

Compare |+>=(|0>+|1>)/sqrt(2) with |->=(|0>-|1>)/sqrt(2). Their immediate computational-basis probabilities agree. Applying H before measurement distinguishes them. Work out that example in E1.

An operator's sign also matters when it is used as a stabilizer: G and -G fix different eigenspaces. Do not drop operator signs merely because a global phase on a state is unobservable.

## 3. Labels and phase

Write a qubit Pauli as P(p,x,z)=i^p X^x Z^z. The phase exponent p is modulo four; x and z are modulo two. The binary labels are:

| Operator | x | z |
|---|---|---|
| I | 0 | 0 |
| X | 1 | 0 |
| Z | 0 | 1 |
| Y, up to phase | 1 | 1 |

The convention is X before Z. Since Y=iXZ, its canonical matrix needs a phase in addition to its label. The full Pauli group includes non-Hermitian phase choices; use the usual Hermitian I, X, Y, Z when talking about measurement observables.

Using ZX=-XZ, multiplying P(p,x,z) by P(q,u,v) adds the labels modulo two and changes the phase:

```text
new phase = p + q + 2*z*u  (mod 4)
new x     = x + u         (mod 2)
new z     = z + v         (mod 2)
```

For multiple qubits replace z*u with the dot product of the corresponding vectors. Derive the single-qubit rule by commuting the middle factors. The rule is provided here as a reference, not a replacement for that calculation.

## 4. Commutation as a bilinear calculation

The operator products differ by a sign determined by:

```text
omega(a,b) = x_a*z_b + z_a*x_b  (mod 2)
```

Zero means commute; one means anticommute. For n qubits, sum this expression over qubits. Two local anticommutations can therefore cancel in the total sign.

This is a bilinear, alternating form: it is linear in each input and omega(a,a)=0. Those properties are the beginning of the symplectic viewpoint. In characteristic two, minus and plus coincide; the repository's more general qudit formula requires its stated signs and moduli.

A label-only multiplication can be commutative even when multiplying the associated operators changes a sign with order. That is exactly why the phase is a separate part of the representation.

## Useful distinction

State amplitudes live in a complex vector space. Pauli labels live in a binary vector space. Even for one qubit, these are different objects with different operations. Carry this distinction into [session 3](../03-cliffords-stabilizers/README.md).

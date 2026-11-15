# Clifford conjugation and stabilizer states

[Session](README.md) · [Exercises](exercises.md) · [Code tour](code-tour.md) · [Sources](../../SOURCES.md#q2)

## 1. Following operators

Under a unitary U, follow an operator through conjugation: P -> U P U-dagger. A Clifford maps every Pauli to another Pauli, including its phase. This closure is what makes a compact operator representation useful.

Conjugation preserves products:

```text
U(PQ)U-dagger = (UPU-dagger)(UQU-dagger)
```

Consequently a commuting pair remains commuting, and an anticommuting pair remains anticommuting. This connects a quantum operation to preservation of the binary symplectic product.

For H, verify HXH=Z and HZH=X. Its binary label map swaps x and z. Its complex state matrix from session 2 is a different representation acting on a different space.

For CX with control c and target t, the basis Pauli images are:

```text
X_c -> X_c X_t       Z_c -> Z_c
X_t -> X_t           Z_t -> Z_c Z_t
```

Check an image using its action on computational basis states. The binary map can be built from these images; they do not replace the phase information needed for arbitrary Pauli products.

## 2. Symplectic preservation

For column labels v=[x;z] over F_2, write:

```text
omega(v,w) = v^T J w
J = [0 I]
    [I 0]
```

A binary map F preserves this product when F^T J F=J. This is the symplectic condition. In the one-qubit case the swap matrix A from session 1 is the label action of H. The shear B is the label action of the phase gate S=diag(1,i).

If labels are row vectors transformed as v -> vC, use C J C^T=J. Here C is the transpose of the column-action matrix. Sympleq stores rows, so always state the convention before comparing formulas.

A binary map alone does not determine every Pauli image's sign. For example, HYH=-Y. This is invisible in a label-only result. The phase data is essential to the complete Clifford action.

## 3. Describing a state by its stabilizers

An operator G stabilizes |psi> if G|psi>=|psi>. A pure n-qubit stabilizer state can be specified by n independent commuting Pauli generators with consistent signs. Their generated group must exclude -I, which fixes no nonzero state with eigenvalue +1.

The generators describe a shared +1 eigenspace. For a pure stabilizer state this eigenspace has dimension one. For example, Z fixes |0>, and X fixes |+>. To obtain a transformed state's generators, conjugate each generator by the state-preparing Clifford.

This explains the compact description: store generators and phases, then update them under gates, instead of maintaining every complex amplitude.

## 4. A two-qubit example

Use qubit 0 as the left symbol in the ket. The starting |00> state is stabilized by ZI and IZ. Prepare H on qubit 0, then CX from 0 to 1. Work out the state by amplitudes, and separately conjugate its starting generators.

The final generators are XX and ZZ. Show that they commute and fix the state you derived. Multiply them as full operators if you want a phase-sensitive extension. Keeping only the binary labels would not establish the sign of their product.

The example links a gate list, a state vector, a binary representation, and a stabilizer description. Session 4 will use the same state to explain measurement correlations.

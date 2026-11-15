# Architecture Tour: Commutation & the Symplectic Inner Product

[Session](README.md) · [Theory](theory.md) · [Exercises](exercises.md) · [Architecture Guide](../../CODEBASE_MAP.md)

## The Symplectic Inner Product in Code

Two Pauli strings $P_u, P_v \in \{I,X,Y,Z\}^{\otimes n}$ commute if and only if their binary symplectic product vanishes modulo 2:

$$\omega(u, v) = u_x \cdot v_z \oplus u_z \cdot v_x = \sum_{j=0}^{n-1} (u_{x,j} v_{z,j} \oplus u_{z,j} v_{x,j}) \equiv 0 \pmod 2$$

If $\omega(u, v) = 0$, then $P_u P_v = P_v P_u$. If $\omega(u, v) = 1$, they anticommute: $P_u P_v = -P_v P_u$.

The following example shows how this calculation is expressed in Rust:

```rust
impl PauliString {
    /// Computes the binary symplectic product between two Pauli operators:
    /// \omega(u, v) = (u_x \cdot v_z \oplus u_z \cdot v_x) \pmod 2
    pub fn symplectic_product(&self, other: &Self) -> u8 {
        assert_eq!(self.num_qubits, other.num_qubits, "Register size mismatch");

        let mut inner_sum = 0u32;
        for i in 0..self.num_qubits {
            let u_x = self.x[i] as u32;
            let u_z = self.z[i] as u32;
            let v_x = other.x[i] as u32;
            let v_z = other.z[i] as u32;

            inner_sum ^= (u_x * v_z) ^ (u_z * v_x);
        }

        (inner_sum & 1) as u8
    }

    /// Evaluates whether two Pauli operators commute: [P_u, P_v] = 0
    pub fn commutes_with(&self, other: &Self) -> bool {
        self.symplectic_product(other) == 0
    }

    /// Determines the acquired phase factor k \in {0, 1, 2, 3} such that
    /// P_u P_v = i^k P_{u \oplus v}
    pub fn acquired_phase(&self, other: &Self) -> u8 {
        assert_eq!(self.num_qubits, other.num_qubits);
        let mut phase_sum = 0i32;

        for i in 0..self.num_qubits {
            let ux = self.x[i];
            let uz = self.z[i];
            let vx = other.x[i];
            let vz = other.z[i];

            // Standard Pauli multiplication phase table modulo 4
            match ((ux, uz), (vx, vz)) {
                ((true, false), (false, true)) => phase_sum += 1,  // X * Z = -i Y (phase factor)
                ((false, true), (true, false)) => phase_sum += 3,  // Z * X = +i Y
                ((true, true), (true, false))  => phase_sum += 1,  // Y * X = -i Z
                ((true, false), (true, true))  => phase_sum += 3,  // X * Y = +i Z
                ((false, true), (true, true))  => phase_sum += 1,  // Z * Y = -i X
                ((true, true), (false, true))  => phase_sum += 3,  // Y * Z = +i X
                _ => {} // Products with Identity or identical operators contribute 0 phase
            }
        }

        ((phase_sum % 4 + 4) % 4) as u8
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pauli_commutation_relations() {
        let x = PauliString::qubit(1, 0);
        let z = PauliString::qubit(0, 1);
        let y = PauliString::qubit(1, 1);
        let id = PauliString::qubit(0, 0);

        // X and Z anticommute: \omega(X, Z) = 1
        assert_eq!(x.symplectic_product(&z), 1);
        assert!(!x.commutes_with(&z));

        // X and X commute: \omega(X, X) = 0
        assert_eq!(x.symplectic_product(&x), 0);
        assert!(x.commutes_with(&x));

        // Identity commutes with everything
        assert!(id.commutes_with(&x));
        assert!(id.commutes_with(&y));
        assert!(id.commutes_with(&z));
    }
}
```

## Architectural Insights

1. **Separation of Symplectic Geometry from Global Phase**: Notice that `commutes_with` depends purely on the XOR sum of cross-products in $\mathbb{F}_2$. It never touches complex arithmetic.
2. **Phase Arithmetic Modulo 4**: In contrast, `acquired_phase` tracks the power $k \in \mathbb{Z}_4$ of the imaginary unit $i^k$. Commutation requires only $1$ bit of information; operator product signs require $2$ bits.

## Questions to Consider

- Why can two Pauli strings yield the exact same binary label $u \oplus v$ while their operator products carry opposite signs?
- Why is the symplectic inner product symmetric under swapping $u$ and $v$ over $\mathbb{F}_2$, even though matrix multiplication of operators is anticommutative?

Document your proof and code derivations in [your personal notes](../../notes/02-quantum-paulis.md).

# Architecture Tour: Pauli String & Bit-Pair Layout

[Session](README.md) · [Theory](theory.md) · [Exercises](exercises.md) · [Architecture Guide](../../CODEBASE_MAP.md)

Limit this initial architectural review to about 15 minutes at the conclusion of Block 4. Set up a [practice workspace](../../SETUP.md#create-a-rust-workspace) to run the examples. The two bits are storage labels. Session 2 explains which Pauli matrices they represent.

## Canonical Data Structure: Pauli Label Storage

In a production quantum simulation engine, an $n$-qubit Pauli operator $P \in \{I, X, Y, Z\}^{\otimes n}$ is represented without global phases as a binary symplectic vector:

$$v = (x_0, x_1, \dots, x_{n-1} \mid z_0, z_1, \dots, z_{n-1}) \in \mathbb{F}_2^{2n}$$

The following Rust example demonstrates how this operator is stored, constructed, and inspected:

```rust
/// Canonical bit-pair representation of an n-qubit Pauli operator (without global phase).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PauliString {
    num_qubits: usize,
    /// Bitvector of X components (true = 1, false = 0)
    x: Vec<bool>,
    /// Bitvector of Z components (true = 1, false = 0)
    z: Vec<bool>,
}

impl PauliString {
    /// Constructs a single-qubit Pauli operator from explicit binary components:
    /// - (0, 0) -> I
    /// - (1, 0) -> X
    /// - (1, 1) -> Y
    /// - (0, 1) -> Z
    pub fn qubit(x: u8, z: u8) -> Self {
        Self {
            num_qubits: 1,
            x: vec![x & 1 == 1],
            z: vec![z & 1 == 1],
        }
    }

    /// Constructs an n-qubit identity operator: I^{\otimes n}
    pub fn identity(num_qubits: usize) -> Self {
        Self {
            num_qubits,
            x: vec![false; num_qubits],
            z: vec![false; num_qubits],
        }
    }

    /// Inspect raw binary components as an (x, z) slice pair
    pub fn components(&self) -> (&[bool], &[bool]) {
        (&self.x, &self.z)
    }

    /// Number of qubits in this operator register
    pub fn len(&self) -> usize {
        self.num_qubits
    }

    pub fn is_empty(&self) -> bool {
        self.num_qubits == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_single_qubit_construction() {
        let x_op = PauliString::qubit(1, 0);
        let z_op = PauliString::qubit(0, 1);
        let y_op = PauliString::qubit(1, 1);

        assert_eq!(x_op.components(), (&[true][..], &[false][..]));
        assert_eq!(z_op.components(), (&[false][..], &[true][..]));
        assert_eq!(y_op.components(), (&[true][..], &[true][..]));
    }
}
```

## Architectural Insights

1. **Why Global Phases are Separated**: Multiplications of pure symplectic labels in $\mathbb{F}_2^{2n}$ form a vector space under addition ($\oplus$). Tracking phases ($\pm 1, \pm i$) belongs to a higher-level state or group abstraction.
2. **From Toy BitPair to $n$-Qubit Registers**: The example's `Vec<bool>` stores directly indexed Boolean values. While a 1-qubit toy structure uses two fields `(u8, u8)`, multi-qubit engines pack multiple qubits into contiguous bit-arrays (`Vec<u64>`), matching processor cache lines.

## Questions to Consider

- Which method borrows an existing slice rather than cloning heap memory?
- Why can an abstract binary representation be simpler to compose than floating-point matrices?
- What physical information is deliberately omitted when tracking only binary labels?

Record your answers and reflections in [your personal notes](../../notes/01-foundations.md).

# Architecture Tour: High-Performance Frame Sampling & Packed Arithmetic

[Session](README.md) · [Theory](theory.md) · [Exercises](exercises.md) · [Architecture Guide](../../CODEBASE_MAP.md)

## The Batched Frame Sampling Architecture

When simulating thousands of circuit shots, re-running a full tableau simulation per shot is inefficient. State-of-the-art stabilizer simulators use **Frame Sampling**:
1. Compute the deterministic measurement record and reference stabilizer frame **once** on the CPU.
2. Propagate Pauli frame errors or randomized Pauli signs across batches of 64 shots simultaneously by packing them into 64-bit unsigned integers (`u64`).

The following example demonstrates how 64 shots are simulated in parallel using bitwise operations:

```rust
/// Packed batch of 64 simulation shots stored as parallel columns
#[derive(Clone, Debug)]
pub struct FrameBatch64 {
    /// Number of qubits
    pub num_qubits: usize,
    /// Bit columns for X frame errors: one u64 per qubit (64 shots parallel)
    pub x_columns: Vec<u64>,
    /// Bit columns for Z frame errors: one u64 per qubit (64 shots parallel)
    pub z_columns: Vec<u64>,
}

impl FrameBatch64 {
    pub fn new(num_qubits: usize) -> Self {
        Self {
            num_qubits,
            x_columns: vec![0u64; num_qubits],
            z_columns: vec![0u64; num_qubits],
        }
    }

    /// Fast Hadamard update across 64 shots: X and Z columns swap simultaneously
    #[inline(always)]
    pub fn apply_h(&mut self, qubit: usize) {
        std::mem::swap(&mut self.x_columns[qubit], &mut self.z_columns[qubit]);
    }

    /// Fast Phase gate (S) update across 64 shots: Z ^= X in one instruction
    #[inline(always)]
    pub fn apply_s(&mut self, qubit: usize) {
        self.z_columns[qubit] ^= self.x_columns[qubit];
    }

    /// Fast CNOT gate across 64 shots:
    /// X_target ^= X_control
    /// Z_control ^= Z_target
    #[inline(always)]
    pub fn apply_cx(&mut self, control: usize, target: usize) {
        let x_c = self.x_columns[control];
        self.x_columns[target] ^= x_c;

        let z_t = self.z_columns[target];
        self.z_columns[control] ^= z_t;
    }

    /// Extract the measurement outcome for a specific shot (0..64)
    pub fn get_shot_record(&self, shot_idx: usize, reference: &[bool]) -> String {
        assert!(shot_idx < 64);
        let mask = 1u64 << shot_idx;

        let mut record = String::with_capacity(self.num_qubits);
        for q in 0..self.num_qubits {
            let frame_flip = (self.z_columns[q] & mask) != 0;
            let outcome_bit = reference[q] ^ frame_flip;
            record.push(if outcome_bit { '1' } else { '0' });
        }
        record
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_batch_64_shots_parallel_cnot() {
        let mut batch = FrameBatch64::new(2);

        // Inject initial superposition on control for odd shots
        batch.x_columns[0] = 0xAAAAAAAAAAAAAAAA; // alternating bits

        // Apply CNOT: targets should now match controls across all 64 trajectories
        batch.apply_cx(0, 1);
        assert_eq!(batch.x_columns[1], 0xAAAAAAAAAAAAAAAA);
    }
}
```

## Three Key Performance Ideas

1. **Deterministic Reference Execution**: The deterministic Pauli frame is calculated once. The random measurement branches only flip bits relative to this baseline.
2. **Bit-Level Parallelism**: A single processor XOR instruction `^` updates $64$ shot trajectories in 1 clock cycle.
3. **Hardware Accelerator Boundaries**: When offloading simulation workloads to GPUs:
   - GPU speedup occurs only when batch sizes exceed millions of shots or when performing large dense covariance matrix tensor contractions.
   - For small circuits, memory transfer latency ($PCIe$) vastly exceeds computation time.

## Questions to Consider

- Why is column-packing (shots along bits) more cache-efficient for sampling than row-packing (qubits along bits)?
- How does the Gottesman-Knill theorem guarantee that $n$-qubit Clifford circuits with $m$ gates execute in $O(m \cdot n)$ time rather than exponential time?

Record your timing benchmarks and execution graphs in [your personal notes](../../notes/04-measurement-performance.md).

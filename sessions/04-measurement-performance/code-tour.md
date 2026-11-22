# Architecture Tour: High-Performance Frame Sampling & Packed Arithmetic

[Session](README.md) · [Theory](theory.md) · [Exercises](exercises.md) · [Architecture Guide](../../CODEBASE_MAP.md)

## The Batched Frame Sampling Architecture

When simulating thousands of circuit shots, re-running a full tableau simulation per shot is inefficient. State-of-the-art stabilizer simulators use **Frame Sampling**:
1. Draw the reference measurement record and stabilizer trajectory once. Random reference outcomes follow the Born rule.
2. Propagate Pauli frame errors or randomized Pauli signs across batches of 64 shots simultaneously by packing them into 64-bit unsigned integers (`u64`).

This packed example covers zero-state input, Clifford propagation, and terminal Z readout. Give each input wire an independent random Z mask. A Hadamard changes those random Z bits into X bits, so even a noiseless run can have random outcomes. A shot's readout is the reference bit XOR its X frame bit. For intermediate measurement and reset, use the signed reference-pivot bookkeeping or equivalent randomized frame updates described in [Stim](https://arxiv.org/abs/2103.02202).

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
    pub fn new(random_z_masks: Vec<u64>) -> Self {
        let num_qubits = random_z_masks.len();
        Self {
            num_qubits,
            x_columns: vec![0u64; num_qubits],
            z_columns: random_z_masks,
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
        assert_eq!(reference.len(), self.num_qubits);
        let mask = 1u64 << shot_idx;

        let mut record = String::with_capacity(self.num_qubits);
        for q in 0..self.num_qubits {
            let frame_flip = (self.x_columns[q] & mask) != 0;
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
        let mut batch = FrameBatch64::new(vec![0; 2]);

        // Inject an X frame on the control for odd shots
        batch.x_columns[0] = 0xAAAAAAAAAAAAAAAA; // alternating bits

        // Apply CNOT: targets should now match controls across all 64 trajectories
        batch.apply_cx(0, 1);
        assert_eq!(batch.x_columns[1], 0xAAAAAAAAAAAAAAAA);
        assert_eq!(batch.get_shot_record(0, &[false, false]), "00");
        assert_eq!(batch.get_shot_record(1, &[false, false]), "11");
    }
}
```

## Measure packed sampling

A bitwise XOR updates a word containing up to 64 trajectories. Total time also includes loads, stores, random masks, reference simulation, and record handling. A CPU–GPU comparison needs the same circuit, shot budget, data transfers, and output conditions on both devices.

## Questions to Consider

- Why is column-packing (shots along bits) more cache-efficient for sampling than row-packing (qubits along bits)?
- How do O(n) local tableau gate updates and the O(n²) worst case for tableau measurement contribute to the cost of one reference trajectory?

Record your timing benchmarks and execution graphs in [your personal notes](../../notes/04-measurement-performance.md).

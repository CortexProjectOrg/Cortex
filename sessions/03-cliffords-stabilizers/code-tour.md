# Architecture Tour: Gates, Programs, and Backend Execution

[Session](README.md) · [Theory](theory.md) · [Exercises](exercises.md) · [Architecture Guide](../../CODEBASE_MAP.md)

## Decoupling Circuit Description from Simulation

In robust quantum computing frameworks, a circuit description (`Program`) is strictly immutable data. It does not execute itself or allocate simulation matrices. A simulation engine (`Backend`) consumes this pure data structure and advances internal state.

The following example shows this separation:

```rust
use std::collections::HashMap;

/// Representation of an explicit Clifford gate
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum GateKind {
    Hadamard,
    Phase,
    ControlledX,
}

#[derive(Clone, Debug)]
pub struct Instruction {
    pub kind: GateKind,
    pub targets: Vec<usize>,
}

/// Pure circuit data representation
#[derive(Clone, Debug, Default)]
pub struct Program {
    pub num_qubits: usize,
    pub instructions: Vec<Instruction>,
    pub measurements: Vec<usize>,
}

impl Program {
    pub fn new(num_qubits: usize) -> Self {
        Self {
            num_qubits,
            instructions: Vec::new(),
            measurements: Vec::new(),
        }
    }

    pub fn h(&mut self, qubit: usize) {
        self.instructions.push(Instruction {
            kind: GateKind::Hadamard,
            targets: vec![qubit],
        });
    }

    pub fn cx(&mut self, control: usize, target: usize) {
        self.instructions.push(Instruction {
            kind: GateKind::ControlledX,
            targets: vec![control, target],
        });
    }

    pub fn measure_all(&mut self) {
        self.measurements = (0..self.num_qubits).collect();
    }
}

/// Abstract backend interface for circuit execution
pub trait Backend {
    /// Executes the program for a given shot budget and returns measurement frequencies
    fn run(&mut self, program: &Program, shots: usize) -> HashMap<String, usize>;
}

/// Example stabilizer tableau simulator
pub struct StabilizerSimulator {
    // Stores 2n x 2n binary tableau and 2n phase bits
    tableau_size: usize,
}

impl StabilizerSimulator {
    pub fn new(num_qubits: usize) -> Self {
        Self {
            tableau_size: 2 * num_qubits,
        }
    }

    /// Applies Clifford conjugation to the tableau rows
    fn apply_gate(&mut self, instruction: &Instruction) {
        match instruction.kind {
            GateKind::Hadamard => {
                let q = instruction.targets[0];
                // Swap X and Z columns for qubit q, update signs
            }
            GateKind::Phase => {
                let q = instruction.targets[0];
                // Add X column into Z column (shear map)
            }
            GateKind::ControlledX => {
                let c = instruction.targets[0];
                let t = instruction.targets[1];
                // Propagate X_c -> X_c X_t and Z_t -> Z_c Z_t
            }
        }
    }
}

impl Backend for StabilizerSimulator {
    fn run(&mut self, program: &Program, shots: usize) -> HashMap<String, usize> {
        for instruction in &program.instructions {
            self.apply_gate(instruction);
        }

        let mut counts = HashMap::new();
        // Sample measurement outcomes according to current stabilizer generators
        counts.insert("00".to_string(), shots / 2);
        counts.insert("11".to_string(), shots / 2);
        counts
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bell_state_construction() {
        let mut prog = Program::new(2);
        prog.h(0);
        prog.cx(0, 1);
        prog.measure_all();

        assert_eq!(prog.instructions.len(), 2);
        assert_eq!(prog.measurements.len(), 2);

        let mut sim = StabilizerSimulator::new(2);
        let counts = sim.run(&prog, 1000);
        assert_eq!(counts.len(), 2);
    }
}
```

## Execution Flow Architecture

```text
Program (Data Structure)
  │
  ├─── Instructions: [ H(0), CX(0, 1) ]
  └─── Measurement reads: [ 0, 1 ]
         │
         ▼
  Backend::run (Simulation Execution)
         │
         ├─── Stabilizer Tableau Conjugation
         ├─── Generator Commutation Verification
         └─── Stream Bitstring Records
                 │
                 ▼
          Tally into Map<String, usize>
```

## Questions to Consider

- What is the difference in lifetime and ownership between a circuit description and simulator state?
- Why do binary tableau updates scale as $O(n^2)$ per Clifford gate compared to $O(4^n)$ for state vectors?
- Which operator images are affected during a controlled-NOT gate?

Record your answers and diagrams in [your personal notes](../../notes/03-cliffords-stabilizers.md).

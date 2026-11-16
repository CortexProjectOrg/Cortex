# Practice Environment Setup

[Index](README.md) · [Plan](PLAN.md)

## Creating a Practice Rust Workspace

Verify your local Rust toolchain with `rustc --version` and `cargo --version` in your terminal. If you need to install Rust, use [rustup.rs](https://rustup.rs).

To keep experiments isolated and easy to test, initialize a dedicated practice workspace:

```powershell
cargo new quantum-study
Set-Location quantum-study
cargo run
```

Keep reusable mathematical abstractions in `src/lib.rs`, unit tests next to them, and runnable experiments in `src/main.rs` or `examples/`.

Add standard random number generation to `Cargo.toml`:

```toml
[dependencies]
rand = "0.9"
```

---

## Canonical Circuit Simulation Harness (Example Implementation)

The following example illustrates how circuit data structures, instructions, and simulation execution are cleanly separated in a modern quantum engine. You can use this example structure in `src/main.rs`:

```rust
use std::collections::HashMap;
use rand::{rngs::SmallRng, Rng, SeedableRng};

/// Elementary quantum gate representation
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Gate {
    Hadamard(usize),
    Phase(usize),
    ControlledX(usize, usize),
    PauliX(usize),
    PauliZ(usize),
}

/// Pure circuit data representation (decoupled from simulator state)
#[derive(Clone, Debug, Default)]
pub struct Program {
    pub num_qubits: usize,
    pub instructions: Vec<Gate>,
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

    pub fn push(&mut self, gate: Gate) {
        self.instructions.push(gate);
    }

    pub fn measure_all(&mut self) {
        self.measurements = (0..self.num_qubits).collect();
    }
}

/// Example execution backend for stabilizer and state-vector simulations
pub trait SimulationBackend {
    fn counts(&mut self, program: &Program, shots: usize) -> HashMap<String, usize>;
}

/// Architecture stub: ignores gates and always returns the all-zero bitstring.
pub struct ReferenceSimulator {
    rng: SmallRng,
}

impl ReferenceSimulator {
    pub fn new(seed: u64) -> Self {
        Self {
            rng: SmallRng::seed_from_u64(seed),
        }
    }
}

impl SimulationBackend for ReferenceSimulator {
    fn counts(&mut self, program: &Program, shots: usize) -> HashMap<String, usize> {
        let mut results = HashMap::new();
        // Placeholder only: implement gate evolution and Born-rule sampling before using results.
        for _ in 0..shots {
            // Compute or sample measurement record
            let bitstring = "0".repeat(program.num_qubits);
            *results.entry(bitstring).or_insert(0) += 1;
        }
        results
    }
}

fn main() {
    let mut program = Program::new(2);
    program.push(Gate::Hadamard(0));
    program.push(Gate::ControlledX(0, 1));
    program.measure_all();

    let mut sim = ReferenceSimulator::new(42);
    let counts = sim.counts(&program, 1_000);
    println!("Measurement counts: {:?}", counts);
}
```

---

## Benchmarking & Experimentation Guidelines

1. **Release Mode for Measurements**: Always run benchmarks with `cargo run --release`. Debug builds include extensive bounds checking and disabled SIMD vectorization that distort execution times by up to $20\times$.
2. **Exclude I/O from Timed Regions**: Ensure terminal printing (`println!`) and disk writes occur outside timing blocks (`Instant::now()`).
3. **Reproducibility with Fixed Seeds**: Use seeded pseudo-random number generators (`SmallRng::seed_from_u64(...)`) so your empirical measurement histograms can be reproduced across test runs.

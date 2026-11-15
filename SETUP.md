# Practice setup

[Index](README.md) · [Plan](PLAN.md)

## One small Rust project

Check `rustc --version` and `cargo --version` in PowerShell. If installation or a compiler error consumes a block, keep the error in your notes and continue with a paper exercise. The first month needs no CUDA build.

Use a project outside the library so experiments stay easy to change. If `C:/Users/frecm/sympleq-study` exists, reuse it. Otherwise:

```powershell
Set-Location $env:USERPROFILE
cargo new sympleq-study
Set-Location sympleq-study
cargo run
```

Keep reusable exercise code in that project's `src/lib.rs`, tests next to it, and runnable experiments in `src/main.rs` or `examples/`. These files are your homework; this notebook has not filled in their solutions.

Under the existing `[dependencies]` heading in the practice project's Cargo.toml, add:

```toml
# Canonical symplectic stabilizer library
sympleq-core = { git = "https://github.com/ricott1/sympleq-rust.git" }
rand = "0.9"
```

The package name uses a hyphen; the Rust import is `sympleq_core`. Add the library dependency in session 1 or 2 and `rand` when running circuits. Run `cargo test` from the practice project.

## Circuit harness for sessions 2 and 3

This provides setup, not a completed circuit. Start with no gates, predict the result, and then add each experiment's instructions.

```rust
use rand::{rngs::SmallRng, SeedableRng};
use sympleq_core::{Backend, Gate, PauliString, Program, QuditDimension, StabilizerSimulator};

fn main() {
    let register = [QuditDimension::QUBIT; 1];
    let mut program = Program::new(&register);

    // Add your gate instructions here.

    program.measure_all();
    let mut simulator = StabilizerSimulator::new(SmallRng::seed_from_u64(7));
    println!("{:?}", simulator.counts(&program, 1_000));
}
```

An unused import warning while you work is expected. For the Bell exercise, change the register size to two. Run small experiments with `cargo run`; use `cargo run --release` for timing. Keep console output outside a timed region.

Useful gate forms:

```rust
program.push(Gate::hadamard().on(&[0]));
program.push(Gate::pauli(&PauliString::qubit(1, 0)).on(&[0]));
// Requires a register containing qubits 0 and 1:
program.push(Gate::controlled_x().on(&[0, 1]));
```

Use these forms in separate experiments according to the homework, rather than copying them all into one circuit. Predict each experiment before running it. Seeded sampling is reproducible for the implementation being used; exact frequencies need not equal the theoretical probabilities.

## Record an experiment

Keep the source, command, circuit, register size, seed, expected support, and observed output. For timings also record release/debug mode and what the timer includes. See the [experiment template](templates/EXPERIMENT.md).

For Cargo basics, see [R0](SOURCES.md#r0). For ownership and methods, use [R1–R3](SOURCES.md#r1).

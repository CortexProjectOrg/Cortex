# Practice environment setup

[Study plan](PLAN.md)

## Create a Rust workspace

Verify your toolchain with `rustc --version` and `cargo --version`. If needed, install Rust using [rustup.rs](https://rustup.rs).

```powershell
cargo new quantum-study
Set-Location quantum-study
```

Put reusable types and unit tests in `src/lib.rs` and runnable experiments in `src/main.rs` or `examples/`.

## Circuit harness for Sessions 2 and 3

Paste the following dependency-free example into `src/main.rs`. Run `cargo run` to sample the Bell circuit and `cargo test` to verify it. For other exercises, change the gate list and predict the record before running. The statevector has $2^n$ complex amplitudes, so this example limits registers to 20 wires. It supports terminal computational-basis measurements in the given listing order.

```rust
use std::collections::BTreeMap;

#[derive(Clone, Copy)]
enum Gate {
    H(usize),
    S(usize),
    X(usize),
    Z(usize),
    Cx(usize, usize),
}

struct Program {
    wires: usize,
    gates: Vec<Gate>,
    measured: Vec<usize>,
}

fn probabilities(program: &Program) -> Vec<f64> {
    assert!((1..=20).contains(&program.wires));
    assert!(program.measured.iter().all(|&q| q < program.wires));
    let mut state = vec![[0.0; 2]; 1 << program.wires];
    state[0][0] = 1.0;

    for &gate in &program.gates {
        let (wire, control) = match gate {
            Gate::Cx(c, target) => {
                assert!(c < program.wires && c != target);
                (target, Some(1 << c))
            }
            Gate::H(q) | Gate::S(q) | Gate::X(q) | Gate::Z(q) => (q, None),
        };
        assert!(wire < program.wires);
        let mask = 1 << wire;
        for basis in 0..state.len() {
            if basis & mask != 0 || control.is_some_and(|bit| basis & bit == 0) {
                continue;
            }
            let other = basis | mask;
            match gate {
                Gate::H(_) => {
                    let a = state[basis];
                    let b = state[other];
                    for part in 0..2 {
                        state[basis][part] = (a[part] + b[part]) * std::f64::consts::FRAC_1_SQRT_2;
                        state[other][part] = (a[part] - b[part]) * std::f64::consts::FRAC_1_SQRT_2;
                    }
                }
                Gate::S(_) => {
                    let [re, im] = state[other];
                    state[other] = [-im, re];
                }
                Gate::Z(_) => {
                    let [re, im] = state[other];
                    state[other] = [-re, -im];
                }
                Gate::X(_) | Gate::Cx(_, _) => state.swap(basis, other),
            }
        }
    }
    state.iter().map(|[re, im]| re * re + im * im).collect()
}

fn counts(program: &Program, shots: usize, mut seed: u64) -> BTreeMap<String, usize> {
    assert_ne!(seed, 0);
    let mut cumulative = probabilities(program);
    let mut total = 0.0;
    for value in &mut cumulative {
        total += *value;
        *value = total;
    }
    let mut result = BTreeMap::new();
    for _ in 0..shots {
        // Fixed-seed xorshift for reproducible classroom sampling.
        seed ^= seed << 13;
        seed ^= seed >> 7;
        seed ^= seed << 17;
        let uniform = (seed >> 11) as f64 / (1_u64 << 53) as f64;
        let basis = cumulative.partition_point(|&limit| limit <= uniform * total);
        let record: String = program.measured.iter()
            .map(|&q| if basis & (1 << q) == 0 { '0' } else { '1' })
            .collect();
        *result.entry(record).or_insert(0) += 1;
    }
    result
}

fn main() {
    let bell = Program {
        wires: 2,
        gates: vec![Gate::H(0), Gate::Cx(0, 1)],
        measured: vec![0, 1],
    };
    println!("{:?}", counts(&bell, 1_001, 42));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bell_has_the_expected_distribution_and_preserves_the_shot_count() {
        let bell = Program {
            wires: 2,
            gates: vec![Gate::H(0), Gate::Cx(0, 1)],
            measured: vec![0, 1],
        };
        let p = probabilities(&bell);
        assert!((p[0] - 0.5).abs() < 1e-12 && (p[3] - 0.5).abs() < 1e-12);
        assert_eq!((p[1], p[2]), (0.0, 0.0));
        let observed = counts(&bell, 1_001, 42);
        assert_eq!(observed.values().sum::<usize>(), 1_001);
        assert!(observed.keys().all(|k| k == "00" || k == "11"));
    }

    #[test]
    fn single_wire_gates_affect_the_distribution() {
        let cases = [
            (vec![], 1.0),
            (vec![Gate::X(0)], 0.0),
            (vec![Gate::H(0)], 0.5),
            (vec![Gate::H(0), Gate::H(0)], 1.0),
            (vec![Gate::H(0), Gate::Z(0), Gate::H(0)], 0.0),
            (vec![Gate::H(0), Gate::S(0), Gate::H(0)], 0.5),
        ];
        for (gates, expected_zero) in cases {
            let trial = Program { wires: 1, gates, measured: vec![0] };
            assert!((probabilities(&trial)[0] - expected_zero).abs() < 1e-12);
        }
    }
}
```

## Benchmarking

- Run timing trials in release mode with `cargo run --release`. Report the build profile and what the timed call includes.
- Put terminal output and file writes outside the timing region. For a 16-wire GHZ circuit, extend the Bell gate list with a CNOT from wire 0 to every other wire, then measure all wires.
- Fix and report the seed. Check the total count and the possible records separately from the timing. This example measures a statevector baseline, with circuit evolution and cumulative-distribution setup on every call to `counts`.

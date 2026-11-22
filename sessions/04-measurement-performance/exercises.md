# Homework: measurement and performance

[Session](README.md) · [Theory](theory.md) · [Code tour](code-tour.md) · [My notes](../../notes/04-measurement-performance.md)

## E1. Measurement on paper

Starting with Bell generators XX and ZZ, measure Z on qubit 0. Work through outcome 0 and outcome 1 separately. Write a consistent post-measurement generator set for each branch and infer the next Z measurement on qubit 1.

Explain which result is random and which is fixed by an earlier observation. Extension: repeat with |00> and compare the deterministic case.

## E2. Follow one CPU route

Follow the [code tour](code-tour.md) from the shared reference trajectory through packed propagation to final readout. Then follow the [practice harness](../../SETUP.md#circuit-harness-for-sessions-2-and-3) from gate evolution to the cumulative distribution and counts. Identify the work each method shares across shots.

## E3. Estimate before measuring

Compare 2^n complex amplitudes with 2n^2 binary generator entries for n=10 and n=20. Keep units explicit; entries and bytes are different quantities.

Calculate Amdahl speedup for p=0.8 and k=10. Then let k grow without bound. State which model assumptions would fail if GPU transfer costs were added.

Extension: draw eight shot bits in one frame column, XOR two short words, and explain how the same operation extends to a u64. Label the axis represented by each bit.

## E4. A small CPU timing experiment

Use the practice harness to build one 16-qubit GHZ program: H on qubit 0, then CX from 0 to each other qubit, then measure all. Before timing, explain its possible measurement records.

In a release build, use std::time::Instant to time counts for 100, 1,000, and 10,000 shots. Warm up once, take three repetitions per size, and consume/check the output. Build the Program before the timed call and print/write the CSV afterward. Keep raw rows:

```text
qubits,shots,repeat,elapsed_ms
```

Label this CPU sampling-and-counting: per-call simulator setup, sampling, and tallying are included. No CUDA build is needed. If calls are too short to measure reliably, time a group of completed calls and divide by the number of calls, or use a larger shot count and record that change.

Essential version: a correct small timing table and an explanation of its boundaries. Extension: vary qubit count or compare counts with a lighter Backend::run consumer, while keeping the circuit and output checks equivalent.

## Keep and choose what follows

Save the measurement derivation, CPU diagram, raw CSV, and a short conclusion. Use [your personal path](../../PERSONAL_PATH.md) to choose one next topic. Avoid treating an unexplained timing number as a conclusion about GPU performance.

# Saturday 4: measurement, simulation, and performance

[Study plan](../../PLAN.md) · [Previous](../03-cliffords-stabilizers/README.md) · [Choose what follows](../../PERSONAL_PATH.md) · [My notes](../../notes/04-measurement-performance.md)

**Main question:** how can a compact description produce the right random outcomes, and what work is worth accelerating?

Prerequisite: the Bell state's generators and possible records. Reuse your previous calculation rather than beginning a new physical example.

| Block | One-hour activity | Page |
|---|---|---|
| 1 — theory | Stabilizer measurement, correlated outcomes, efficient simulation | [Theory, sections 1–2](theory.md#1-measurement-of-a-pure-stabilizer-state) |
| 2 — practical | Follow the CPU route and identify shared work | [Code tour](code-tour.md) and [Exercises E2](exercises.md#e2-follow-one-cpu-route) |
| 3 — theory | Representation size, batching, Amdahl's law, and overhead | [Theory, sections 3–4](theory.md#3-representation-and-repeated-shots) |
| 4 — practical | A small CPU measurement and a written conclusion | [Exercises E4](exercises.md#e4-a-small-cpu-timing-experiment) |

Use [Q3](../../SOURCES.md#q3) for the stabilizer-simulation statement, [P1](../../SOURCES.md#p1) for reference frames, and the Amdahl section of [G2](../../SOURCES.md#g2) as short selections. Deeper measurement algorithms and CUDA are optional branches.

## Keep

A paper account of both Bell measurement outcomes, a CPU call diagram, a small timing CSV, and a conclusion stating what was measured. Pick the next session from [your personal path](../../PERSONAL_PATH.md); the first month does not require a new GPU implementation.

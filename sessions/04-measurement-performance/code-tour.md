# Code tour: shared work and recorded shots

[Session](README.md) · [Theory](theory.md) · [Exercises](exercises.md) · [Codebase map](../../CODEBASE_MAP.md)

## Trace the selected CPU case

For the zero-start, noiseless Clifford exercise:

1. In [simulate/mod.rs](../../../sympleq/sympleq-rust/sympleq-core/src/simulate/mod.rs), read Backend::counts and its call to run.
2. Find StabilizerSimulator's Backend::run implementation and locate compilation and Routes::shots.
3. In [simulate/routes.rs](../../../sympleq/sympleq-rust/sympleq-core/src/simulate/routes.rs), locate the single-stabilizer/start and frames_carry selection for frame_shots.
4. In [simulate/frames.rs](../../../sympleq/sympleq-rust/sympleq-core/src/simulate/frames.rs), read the overview and the first stage of frame_shots.
5. Follow the callback boundary back to the counts map. Record order matters to a consumer.

## Locate three performance ideas

Find settled_prefix, reference_digits, and the packed-column discussion. Explain the roles of one reference calculation, shared prefix work, and batched shot bits. The detailed inverse-tableau and gauge-sampling proofs can become their own later session.

Compare [bits.rs](../../../sympleq/sympleq-rust/sympleq-core/src/bits.rs) with the frame columns. A row of Pauli components and a column of many shots are different data layouts. The use of words and XOR does not make their axes interchangeable.

## Optional GPU orientation

Read only [the public exports](../../../sympleq/sympleq-rust/sympleq-gpu/src/lib.rs), then locate allocation/transfer and launch sites in [CUDA host code](../../../sympleq/sympleq-rust/sympleq-gpu/src/cuda.rs) or [covariance integration](../../../sympleq/sympleq-rust/sympleq-gpu/src/cuda/covariance.rs). Current exported computations include ground_energy and integrate_covariances. Verify exports again when you return to them.

Use [G1](../../SOURCES.md#g1) for host/device terminology. A later project must compare equivalent tasks; these numerical routines are not a circuit-shot backend. No kernel implementation, Lanczos derivation, or device setup is assigned here.

End by writing one function name beside each box of your CPU call diagram.

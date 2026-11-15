# Working glossary

[Index](README.md) · [Sources](SOURCES.md) · [My concept-note template](templates/NOTE.md)

Add an example in your own words whenever a definition becomes useful.

## Mathematics and quantum information

| Term | Working meaning |
|---|---|
| F_2 | The field containing 0 and 1, with arithmetic modulo two. |
| Vector | An ordered list of components; always specify which field they belong to. |
| Basis | An independent set of vectors whose linear combinations span the space. |
| Linear map | A transformation preserving vector addition and scalar multiplication. |
| Amplitude | A complex component of a quantum state; its squared magnitude contributes a measurement probability. |
| Operator | A linear map acting on states; it is a different object from a state. |
| Global phase | A common factor exp(i theta) on an entire state; it leaves its measurement probabilities unchanged. |
| Relative phase | A phase difference between components, which can affect later interference. |
| Pauli label | Binary x and z components identifying a qubit Pauli up to phase. |
| Symplectic product | Here, the binary bilinear expression detecting Pauli commutation. |
| Conjugation | The operator transformation P -> U P U-dagger. |
| Clifford | A unitary whose conjugation maps Paulis to Paulis, including their phases. |
| Stabilizer | An operator fixing a state with eigenvalue +1; a stabilizer description includes its signs. |
| Generator | An element used to obtain other members of a group by multiplication. |
| Tableau | A structured array holding Pauli labels and associated state or operator information. |
| Shot | One run's measurement record. |
| Hamiltonian | A Hermitian operator representing a system's energy; its eigenproblem differs from circuit sampling. |
| Covariance | A measure of how two random quantities vary together. |
| Lanczos | An iterative method for an eigenvalue problem using repeated matrix-vector products. |

## Rust and performance

| Term | Working meaning |
|---|---|
| Crate | A Rust compilation unit; a Cargo package contains one or more targets built as crates. |
| Ownership | Rules governing who owns a value and when its resources are released. |
| Borrow/reference | Temporary access through a reference, such as &T or &mut T. |
| impl | A block defining methods or implementing a trait for a type. |
| Trait | A shared behaviour/interface contract implemented by types. |
| Callback | A function supplied to another operation; Backend::run uses one to deliver records. |
| Packed bits | Many binary values stored as bits of a machine word. State which axis those bits represent. |
| Host/device | In CUDA discussions, the CPU-side system and the GPU-side processor/memory. |
| Kernel | A function launched to execute many GPU threads. |
| Synchronization | Waiting or coordinating so relevant operations are complete or properly ordered. |
| Setup cost | Work paid once per process, context, program, or call; specify which. |
| Throughput | Amount of completed work per unit time. |
| Amdahl's law | A bound on total speedup when only part of a fixed workload is accelerated. |

import generated from '../generated/content.json';
export type LinkTarget = { kind: 'external' | 'anchor' | 'document' | 'notes' | 'path' | 'progress' | 'unavailable'; href: string; label?: string };
export type StudyDocument = { id: string; title: string; body: string; text: string; kind: string; session: number | null; minutes: number; links: Record<string, LinkTarget> };
export const documents = generated.documents as StudyDocument[];
export const documentMap = new Map(documents.map(doc => [doc.id, doc]));
export const sessions = [
  { id: 1, folder: '01-foundations', title: 'The language of bits', subtitle: 'Binary linear algebra & Rust', question: 'How can bit operations become linear algebra?', tag: 'Build the foundations', symbol: '01', color: 'sage', topics: ['Binary vectors', 'Linear maps', 'Rust ownership'] },
  { id: 2, folder: '02-quantum-paulis', title: 'A qubit, a label, a phase', subtitle: 'Quantum states & Pauli operators', question: 'What can two bits tell us about a quantum operator?', tag: 'Connect the ideas', symbol: '02', color: 'ochre', topics: ['Qubit states', 'Phases', 'Commutation'] },
  { id: 3, folder: '03-cliffords-stabilizers', title: 'A compact quantum world', subtitle: 'Clifford maps & stabilizer states', question: 'Why are some quantum circuits easier to describe?', tag: 'See the structure', symbol: '03', color: 'blue', topics: ['Clifford maps', 'Symplectic forms', 'Bell states'] },
  { id: 4, folder: '04-measurement-performance', title: 'From theory to simulation', subtitle: 'Measurement & performance', question: 'Where does randomness enter, and what can we accelerate?', tag: 'Follow the work', symbol: '04', color: 'rose', topics: ['Measurement', 'CPU sampling', 'Acceleration'] }
];
export const sessionDocs = (id: number) => documents.filter(doc => doc.session === id);
export const sessionStart = (folder: string) => `sessions/${folder}/README.md`;
export const kinds: Record<string, string> = { theory: 'Theory', exercises: 'Homework', code: 'Code tour', guide: 'Guide', template: 'Template' };
import {
  Atom,
  Binary,
  Boxes,
  CircleDot,
  CircuitBoard,
  Cpu,
  Dice5,
  Grid2X2,
  Network,
  Orbit,
  Workflow
} from 'lucide-react';
import type { Subfield } from '../lib/topicDiscovery';
import './topicDiscovery.css';

const icons = {
  logic: Binary,
  algebra: Boxes,
  'linear-algebra': Grid2X2,
  geometry: Orbit,
  probability: Dice5,
  graphs: Network,
  complexity: Workflow,
  'quantum-mechanics': Atom,
  'quantum-computing': CircuitBoard,
  simulation: Cpu,
  hardware: CircleDot
};

export function SubfieldIcon({ field, size = 20 }: { field: Subfield; size?: number }) {
  const Icon = icons[field.id];
  return (
    <span className={`subfield-icon ${field.tone}`} aria-hidden="true">
      <Icon size={size} strokeWidth={1.7} />
    </span>
  );
}

import { useState } from 'react';
import { FOUNDATION_WIDGETS } from './FoundationWidgets';
import { QUANTUM_PRACTICE_WIDGETS } from './QuantumPracticeWidgets';
import { QUANTUM_WIDGETS } from './QuantumVisual';
import { MATH_PRACTICE_WIDGETS } from './MathPracticeWidgets';
import { SIMULATION_PRACTICE_WIDGETS } from './SimulationPracticeWidgets';
import { DiagramWidget } from './DiagramWidget';
import { LECTURE_DIAGRAMS } from './lectureDiagrams';
import { QuickCheck, type WidgetSpec } from './WidgetParts';
import './lectureWidget.css';

const widgets = {
  ...FOUNDATION_WIDGETS,
  ...QUANTUM_PRACTICE_WIDGETS,
  ...QUANTUM_WIDGETS,
  ...MATH_PRACTICE_WIDGETS,
  ...SIMULATION_PRACTICE_WIDGETS
};
export const LECTURE_WIDGETS: Record<string, keyof typeof widgets> = {
  'L01-sets-maps-proofs': 'maps',
  'L02-groups-modular-arithmetic': 'clock',
  'L03-finite-fields-gf2-gfp': 'inverse',
  'L04-vector-spaces-finite-fields': 'vectors',
  'L05-linear-maps-matrices': 'matrix',
  'L09-complex-inner-products-hilbert': 'projection',
  'L10-one-qubit-states-measurement': 'gates',
  'L11-unitary-operators-quantum-gates': 'gates',
  'L12-multi-qubit-systems-entanglement': 'entanglement',
  'L13-density-matrices-mixed-states': 'damping',
  'L18-symplectic-product-commutation': 'commutation',
  'L35-circuit-peephole-rewrites': 'rewrite',
  'L41-partition-refinement-backtracking': 'refinement',
  'L45-krylov-subspaces-power-iteration': 'power',
  'L49-quantum-observable-estimation-budget': 'budget',
  'L52-bayesian-adaptive-allocation': 'sampling',
  'L62-quantum-noise-channels': 'damping',
  'L63-lindblad-quantum-dynamics': 'lindblad',
  'L64-quantum-trajectories': 'sampling',
  'L65-schmidt-quantum-entanglement': 'entanglement',
  'L66-matrix-product-quantum-states': 'bond',
  'L67-tebd-quantum-time-evolution': 'truncation',
  'L68-dmrg-quantum-ground-states': 'variational'
};

function WidgetSession({ spec: { title, Component, check } }: { spec: WidgetSpec }) {
  const [revision, setRevision] = useState(0);
  return (
    <details className="lesson-widget">
      <summary>Explore: {title}</summary>
      <div className="lesson-widget-body">
        <div key={revision}>
          <Component />
          <QuickCheck {...check} />
        </div>
        <button
          type="button"
          className="button secondary widget-reset"
          onClick={() => setRevision(revision + 1)}
        >
          Reset exploration
        </button>
      </div>
    </details>
  );
}

export function LectureWidget({ lectureId }: { lectureId: string }) {
  const spec = widgets[LECTURE_WIDGETS[lectureId]];
  const diagram = LECTURE_DIAGRAMS[lectureId];
  return (
    <>
      {diagram && <DiagramWidget key={`diagram-${lectureId}`} spec={diagram} />}
      {spec && <WidgetSession key={`widget-${lectureId}`} spec={spec} />}
    </>
  );
}

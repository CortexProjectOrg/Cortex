import { useState } from 'react';
import { FOUNDATION_WIDGETS } from './FoundationWidgets';
import { QUANTUM_PRACTICE_WIDGETS } from './QuantumPracticeWidgets';
import { QUANTUM_WIDGETS } from './QuantumVisual';
import { QuickCheck, type WidgetSpec } from './WidgetParts';
import './lectureWidget.css';

const widgets = { ...FOUNDATION_WIDGETS, ...QUANTUM_PRACTICE_WIDGETS, ...QUANTUM_WIDGETS };
export const LECTURE_WIDGETS: Record<string, keyof typeof widgets> = {
  'L01-sets-maps-proofs': 'maps',
  'L02-groups-modular-arithmetic': 'clock',
  'L04-vector-spaces-finite-fields': 'vectors',
  'L05-linear-maps-matrices': 'matrix',
  'L10-one-qubit-states-measurement': 'gates',
  'L11-unitary-operators-quantum-gates': 'gates',
  'L12-multi-qubit-systems-entanglement': 'entanglement',
  'L13-density-matrices-mixed-states': 'damping',
  'L52-bayesian-adaptive-allocation': 'sampling',
  'L62-quantum-noise-channels': 'damping',
  'L64-quantum-trajectories': 'sampling',
  'L65-schmidt-quantum-entanglement': 'entanglement',
  'L66-matrix-product-quantum-states': 'bond',
  'L67-tebd-quantum-time-evolution': 'truncation'
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
  return spec ? <WidgetSession key={lectureId} spec={spec} /> : null;
}

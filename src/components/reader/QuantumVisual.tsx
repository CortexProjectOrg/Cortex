import { useState } from 'react';
import { bondEntropyBound, dampedPlusState, entangledPair, truncateSchmidt } from '../../lib/quantumVisuals';
import { WidgetRange, type WidgetSpec } from './WidgetParts';

const percent = (value: number) => `${(100 * value).toFixed(1)}%`;

function DampingVisual() {
  const [gamma, setGamma] = useState(0.5);
  const state = dampedPlusState(gamma);
  const curve = Array.from({ length: 41 }, (_, i) => {
    const point = dampedPlusState(i / 40);
    return `${180 + 85 * point.x},${140 - 85 * point.z}`;
  }).join(' ');
  return (
    <>
      <WidgetRange
        label="Damping strength γ"
        min={0}
        max={1}
        step={0.01}
        value={gamma}
        onChange={setGamma}
        formatValue={(value) => value.toFixed(2)}
      />
      <figure>
        <svg
          viewBox="0 0 360 270"
          role="img"
          aria-label="Bloch x–z cross-section: the damped plus state moves from the positive x axis toward the ground state"
        >
          <circle cx="180" cy="140" r="85" className="visual-outline" />
          <path d="M 80 140 H 285 M 180 40 V 240" className="visual-axis" />
          <text x="180" y="28" textAnchor="middle">
            |0⟩
          </text>
          <text x="180" y="263" textAnchor="middle">
            |1⟩
          </text>
          <text x="294" y="146">
            x
          </text>
          <text x="192" y="50">
            z
          </text>
          <polyline points={curve} className="visual-curve" />
          <line x1="180" y1="140" x2={180 + state.x * 85} y2={140 - state.z * 85} className="visual-vector" />
          <circle cx={180 + state.x * 85} cy={140 - state.z * 85} r="6" className="visual-dot" />
        </svg>
        <figcaption>
          Start in |+⟩. Relaxation reduces coherence and moves population toward |0⟩. Purity can rise again as
          the ground state is approached.
        </figcaption>
      </figure>
      <dl className="lesson-widget-values" aria-live="polite">
        <div>
          <dt>Ground population</dt>
          <dd>{percent(state.ground)}</dd>
        </div>
        <div>
          <dt>Excited population</dt>
          <dd>{percent(state.excited)}</dd>
        </div>
        <div>
          <dt>Purity Tr(ρ²)</dt>
          <dd>{state.purity.toFixed(3)}</dd>
        </div>
      </dl>
    </>
  );
}

function EntanglementVisual() {
  const [degrees, setDegrees] = useState(22.5);
  const pair = entangledPair(degrees);
  return (
    <>
      <p className="lesson-widget-formula">|ψ⟩ = cos θ |00⟩ + sin θ |11⟩</p>
      <WidgetRange
        label="Entanglement angle θ"
        min={0}
        max={45}
        step={0.5}
        value={degrees}
        onChange={setDegrees}
        formatValue={(value) => `${value.toFixed(1)}°`}
      />
      <figure>
        <svg
          viewBox="0 0 360 235"
          role="img"
          aria-label="Squared Schmidt coefficients for the two-qubit pure state"
        >
          <path d="M 40 25 V 190 H 325" className="visual-axis" />
          <text x="20" y="38">
            1
          </text>
          <text x="20" y="195">
            0
          </text>
          <rect x="80" y={190 - pair.p00 * 155} width="70" height={pair.p00 * 155} className="visual-dot" />
          <rect
            x="220"
            y={190 - pair.p11 * 155}
            width="70"
            height={pair.p11 * 155}
            className="visual-secondary"
          />
          <text x="115" y="222" textAnchor="middle">
            |00⟩
          </text>
          <text x="255" y="222" textAnchor="middle">
            |11⟩
          </text>
        </svg>
        <figcaption>
          At 0° the state is a product. At 45° equal Schmidt weights give a Bell state and one bit of
          entanglement entropy.
        </figcaption>
      </figure>
      <dl className="lesson-widget-values" aria-live="polite">
        <div>
          <dt>Weight of |00⟩</dt>
          <dd>{percent(pair.p00)}</dd>
        </div>
        <div>
          <dt>Weight of |11⟩</dt>
          <dd>{percent(pair.p11)}</dd>
        </div>
        <div>
          <dt>Entropy across A|B</dt>
          <dd>{pair.entropy.toFixed(3)} bits</dd>
        </div>
      </dl>
    </>
  );
}

function BondVisual() {
  const [chi, setChi] = useState(2);
  const entropyBound = bondEntropyBound(chi, 3, 3);
  return (
    <>
      <label className="lesson-widget-control">
        Bond dimension χ
        <select value={chi} onChange={(event) => setChi(Number(event.target.value))}>
          {[1, 2, 4, 8].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <figure>
        <svg
          viewBox="0 0 380 210"
          role="img"
          aria-label="Six-qubit matrix product state: vertical legs are physical qubits and the middle virtual bond separates three qubits from three qubits"
        >
          <line x1="35" y1="105" x2="345" y2="105" className="visual-vector" />
          <path d="M 190 45 V 56 M 190 86 V 160" className="visual-curve" />
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i}>
              <line x1={35 + i * 62} y1="45" x2={35 + i * 62} y2="90" className="visual-axis" />
              <text x={35 + i * 62} y="30" textAnchor="middle">
                {i + 1}
              </text>
              <rect x={19 + i * 62} y="89" width="32" height="32" rx="5" className="visual-tensor" />
              <text x={35 + i * 62} y="111" textAnchor="middle">
                A
              </text>
            </g>
          ))}
          <text x="190" y="76" textAnchor="middle">
            χ = {chi}
          </text>
          <text x="100" y="180" textAnchor="middle">
            3 qubits
          </text>
          <text x="280" y="180" textAnchor="middle">
            3 qubits
          </text>
        </svg>
        <figcaption>
          Horizontal bonds carry summed virtual indices. A larger χ permits a larger Schmidt rank; it does not
          force the represented state to become more entangled.
        </figcaption>
      </figure>
      <dl className="lesson-widget-values" aria-live="polite">
        <div>
          <dt>Maximum Schmidt rank at this cut</dt>
          <dd>{Math.min(chi, 8)}</dd>
        </div>
        <div>
          <dt>Entropy upper bound</dt>
          <dd>
            {entropyBound.toFixed(0)} {entropyBound === 1 ? 'bit' : 'bits'}
          </dd>
        </div>
      </dl>
    </>
  );
}

const spectrum = [0.7, 0.2, 0.08, 0.02] as const;
function TruncationVisual() {
  const [keep, setKeep] = useState(2);
  const result = truncateSchmidt(spectrum, keep);
  return (
    <>
      <ol className="lesson-widget-steps" aria-label="Two-site TEBD update">
        <li>Apply gate</li>
        <li>Split with SVD</li>
        <li>Keep χ terms</li>
      </ol>
      <WidgetRange label="Retained Schmidt terms χ" min={1} max={4} value={keep} onChange={setKeep} />
      <figure>
        <svg
          viewBox="0 0 360 235"
          role="img"
          aria-label={`Schmidt weights 0.70, 0.20, 0.08, 0.02; the largest ${keep} are retained`}
        >
          <path d="M 30 25 V 190 H 340" className="visual-axis" />
          <text x="10" y="38">
            1
          </text>
          <text x="10" y="195">
            0
          </text>
          {spectrum.map((weight, i) => (
            <g key={i}>
              <rect
                x={55 + i * 72}
                y={190 - weight * 155}
                width="45"
                height={weight * 155}
                className={i < keep ? 'visual-dot' : 'visual-discarded'}
              />
              <text x={77 + i * 72} y={180 - weight * 155} textAnchor="middle">
                {weight.toFixed(2)}
              </text>
              <text x={77 + i * 72} y="218" textAnchor="middle">
                {i < keep ? 'Keep' : 'Drop'}
              </text>
            </g>
          ))}
        </svg>
        <figcaption>
          The bars are squared Schmidt coefficients before truncation. For this single normalized pure-state
          truncation, fidelity equals retained weight. It does not include time-step error or later
          truncations.
        </figcaption>
      </figure>
      <dl className="lesson-widget-values" aria-live="polite">
        <div>
          <dt>Discarded weight</dt>
          <dd>{percent(result.discarded)}</dd>
        </div>
        <div>
          <dt>Normalized-state fidelity</dt>
          <dd>{percent(result.fidelity)}</dd>
        </div>
      </dl>
    </>
  );
}

export const QUANTUM_WIDGETS = {
  damping: {
    title: 'Amplitude damping',
    Component: DampingVisual,
    check: {
      question: 'At complete damping (γ = 1), where does the initial |+⟩ state end up?',
      options: [
        {
          label: 'The pure ground state |0⟩',
          correct: true,
          feedback:
            'All population ends in |0⟩, so the final purity is one. Dissipation need not always lower purity.'
        },
        {
          label: 'The maximally mixed state',
          feedback:
            'Check the ground population at γ = 1. Relaxation transfers population as well as reducing coherence.'
        }
      ]
    }
  },
  entanglement: {
    title: 'Schmidt weights and entanglement',
    Component: EntanglementVisual,
    check: {
      question: 'When is this two-qubit pure state maximally entangled?',
      options: [
        { label: 'At θ = 0°', feedback: 'That is |00⟩, a product state with zero entanglement entropy.' },
        {
          label: 'At θ = 45°',
          correct: true,
          feedback: 'Equal Schmidt weights give a Bell state and one bit of entanglement entropy.'
        }
      ]
    }
  },
  bond: {
    title: 'Bond dimension',
    Component: BondVisual,
    check: {
      question: 'If χ = 4 at this cut, must the entropy be 2 bits?',
      options: [
        {
          label: 'Yes',
          feedback:
            'Bond dimension gives capacity. A product state can still have zero entropy inside that representation.'
        },
        {
          label: 'No, that is an upper bound',
          correct: true,
          feedback: 'The actual Schmidt spectrum determines the entropy; χ only limits the rank.'
        }
      ]
    }
  },
  truncation: {
    title: 'Schmidt truncation',
    Component: TruncationVisual,
    check: {
      question: 'How many terms keep discarded weight at or below 3%?',
      options: [
        { label: 'Two', feedback: 'Keeping 0.70 and 0.20 discards 0.10, or 10%.' },
        {
          label: 'Three',
          correct: true,
          feedback: 'Keeping the first three weights leaves only 0.02, or 2%, discarded.'
        },
        { label: 'One', feedback: 'Keeping only 0.70 discards the remaining 30%.' }
      ]
    }
  }
} satisfies Record<string, WidgetSpec>;

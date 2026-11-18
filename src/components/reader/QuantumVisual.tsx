import { useState } from 'react';
import { bondEntropyBound, dampedPlusState, entangledPair, truncateSchmidt } from '../../lib/quantumVisuals';
import './quantumVisual.css';

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
      <label className="quantum-visual-control">
        Damping strength γ
        <input
          type="range"
          aria-label="Damping strength γ"
          min="0"
          max="1"
          step="0.01"
          value={gamma}
          onChange={(event) => setGamma(Number(event.target.value))}
        />
        <output>{gamma.toFixed(2)}</output>
      </label>
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
      <dl className="quantum-visual-values" aria-live="polite">
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
      <p className="quantum-visual-formula">|ψ⟩ = cos θ |00⟩ + sin θ |11⟩</p>
      <label className="quantum-visual-control">
        Entanglement angle θ
        <input
          type="range"
          aria-label="Entanglement angle θ"
          min="0"
          max="45"
          step="0.5"
          value={degrees}
          onChange={(event) => setDegrees(Number(event.target.value))}
        />
        <output>{degrees.toFixed(1)}°</output>
      </label>
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
      <dl className="quantum-visual-values" aria-live="polite">
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
      <label className="quantum-visual-control">
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
      <dl className="quantum-visual-values" aria-live="polite">
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
      <ol className="quantum-visual-steps" aria-label="Two-site TEBD update">
        <li>Apply gate</li>
        <li>Split with SVD</li>
        <li>Keep χ terms</li>
      </ol>
      <label className="quantum-visual-control">
        Retained Schmidt terms χ
        <input
          type="range"
          aria-label="Retained Schmidt terms χ"
          min="1"
          max="4"
          step="1"
          value={keep}
          onChange={(event) => setKeep(Number(event.target.value))}
        />
        <output>{keep}</output>
      </label>
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
      <dl className="quantum-visual-values" aria-live="polite">
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

const visuals = {
  damping: { title: 'Amplitude damping', Component: DampingVisual },
  entanglement: { title: 'Schmidt weights and entanglement', Component: EntanglementVisual },
  bond: { title: 'Bond dimension', Component: BondVisual },
  truncation: { title: 'Schmidt truncation', Component: TruncationVisual }
};
export const LECTURE_VISUALS: Record<string, keyof typeof visuals> = {
  'L12-multi-qubit-systems-entanglement': 'entanglement',
  'L13-density-matrices-mixed-states': 'damping',
  'L62-quantum-noise-channels': 'damping',
  'L65-schmidt-quantum-entanglement': 'entanglement',
  'L66-matrix-product-quantum-states': 'bond',
  'L67-tebd-quantum-time-evolution': 'truncation'
};

export function QuantumVisual({ lectureId }: { lectureId: string }) {
  const visual = visuals[LECTURE_VISUALS[lectureId]];
  if (!visual) return null;
  const { title, Component } = visual;
  return (
    <details className="quantum-visual">
      <summary>Visual: {title}</summary>
      <div className="quantum-visual-body">
        <Component key={lectureId} />
      </div>
    </details>
  );
}

import { useState } from 'react';
import { WidgetRange, WidgetSelect, WidgetValues, type WidgetSpec } from './WidgetParts';

const paulis = ['I', 'X', 'Y', 'Z'].map((symbol) => [symbol, symbol] as const);

function CommutationWidget() {
  const [leftFirst, setLeftFirst] = useState('X');
  const [leftSecond, setLeftSecond] = useState('X');
  const [rightFirst, setRightFirst] = useState('Z');
  const [rightSecond, setRightSecond] = useState('Z');
  const pairs = [
    [leftFirst, rightFirst],
    [leftSecond, rightSecond]
  ];
  const negative = pairs.map(([left, right]) => left !== 'I' && right !== 'I' && left !== right);
  const flips = negative.filter(Boolean).length;
  return (
    <>
      <div className="widget-selects">
        <WidgetSelect
          label="Left string, site 1"
          value={leftFirst}
          options={paulis}
          onChange={setLeftFirst}
        />
        <WidgetSelect
          label="Left string, site 2"
          value={leftSecond}
          options={paulis}
          onChange={setLeftSecond}
        />
        <WidgetSelect
          label="Right string, site 1"
          value={rightFirst}
          options={paulis}
          onChange={setRightFirst}
        />
        <WidgetSelect
          label="Right string, site 2"
          value={rightSecond}
          options={paulis}
          onChange={setRightSecond}
        />
      </div>
      <figure>
        <ul className="widget-tiles" aria-label="Local commutation signs">
          {pairs.map(([left, right], index) => (
            <li key={index} className={'widget-tile' + (negative[index] ? ' widget-tile-marked' : '')}>
              <span>Site {index + 1}</span>
              <strong>
                {left} ↔ {right}
              </strong>
              <span>{negative[index] ? '−1 · anticommute' : '+1 · commute'}</span>
            </li>
          ))}
        </ul>
        <figcaption>
          Multiply the local signs to swap {leftFirst}
          {leftSecond} and {rightFirst}
          {rightSecond}.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          ['Local minus signs', flips],
          ['Result', flips % 2 === 0 ? 'Commute (+1)' : 'Anticommute (−1)']
        ]}
      />
    </>
  );
}

function RewriteWidget() {
  const [gate, setGate] = useState<'Z' | 'X'>('Z');
  const onTarget = gate === 'X';
  return (
    <>
      <WidgetSelect
        label="Middle gate on control"
        value={gate}
        options={[
          ['Z', 'Z'],
          ['X', 'X']
        ]}
        onChange={setGate}
      />
      <figure>
        <svg
          viewBox="0 0 360 230"
          role="img"
          aria-label={`Before: CNOT, ${gate} on control, CNOT. After: ${gate} on control${onTarget ? ' and X on target' : ''}.`}
        >
          <text x="12" y="22">
            Before
          </text>
          <text x="12" y="138">
            After
          </text>
          <path d="M 66 52 H 336 M 66 96 H 336 M 66 168 H 336 M 66 212 H 336" className="visual-axis" />
          {[52, 96, 168, 212].map((y, i) => (
            <text key={y} x="10" y={y + 5}>
              {i % 2 ? 'Target' : 'Control'}
            </text>
          ))}
          {[112, 286].map((x) => (
            <g key={x}>
              <line x1={x} y1="52" x2={x} y2="96" className="visual-vector" />
              <circle cx={x} cy="52" r="5" className="visual-dot" />
              <circle cx={x} cy="96" r="11" className="visual-tensor" />
              <path d={`M ${x - 6} 96 h 12 M ${x} 90 v 12`} className="visual-axis" />
            </g>
          ))}
          {[[52, gate], [168, gate], ...(onTarget ? [[212, 'X']] : [])].map(([y, symbol]) => (
            <g key={y}>
              <rect x="184" y={Number(y) - 14} width="30" height="28" rx="4" className="visual-tensor" />
              <text x="199" y={Number(y) + 6} textAnchor="middle">
                {symbol}
              </text>
            </g>
          ))}
        </svg>
        <figcaption>
          {onTarget
            ? 'Conjugating X on the control by CNOT adds X on the target.'
            : 'Z on the control commutes with CNOT. The two identical CNOTs then cancel.'}
        </figcaption>
      </figure>
    </>
  );
}

function ShotBudgetWidget() {
  const [first, setFirst] = useState(60);
  const second = 120 - first;
  const standardError = Math.sqrt(1 / first + 4 / second);
  return (
    <>
      <WidgetRange
        label="Shots for estimate A"
        min={10}
        max={110}
        step={5}
        value={first}
        onChange={setFirst}
      />
      <figure>
        <ul className="widget-tiles" aria-label="Allocation of 120 shots">
          <li className="widget-tile">
            <span>A · σ = 1</span>
            <meter min={0} max={120} value={first} aria-label="Shots for estimate A" />
            <strong>{first}</strong>
          </li>
          <li className="widget-tile">
            <span>B · σ = 2</span>
            <meter min={0} max={120} value={second} aria-label="Shots for estimate B" />
            <strong>{second}</strong>
          </li>
        </ul>
        <figcaption>
          The weighted single-shot standard deviations are 1 and 2. For independent sample means, add 1/Nₐ and
          4/Nᵦ before taking the square root.
        </figcaption>
      </figure>
      <WidgetValues values={[['Standard error of A + B', standardError.toFixed(4)]]} />
    </>
  );
}

function LindbladWidget() {
  const [step, setStep] = useState(0.25);
  const exact = Math.exp(-2 * step);
  const euler = 1 - 2 * step;
  return (
    <>
      <WidgetRange
        label="Time step Δt"
        min={0}
        max={0.8}
        step={0.05}
        value={step}
        onChange={setStep}
        formatValue={(n) => n.toFixed(2)}
      />
      <figure>
        <svg
          viewBox="0 0 360 235"
          role="img"
          aria-label={`Excited population: exact ${exact.toFixed(3)}, Euler ${euler.toFixed(3)}`}
        >
          <path d="M 45 28 V 209 M 45 139 H 325" className="visual-axis" />
          <text x="20" y="34">
            1
          </text>
          <text x="20" y="145">
            0
          </text>
          {[exact, euler].map((value, i) => (
            <g key={i}>
              <rect
                x={100 + i * 130}
                y={139 - Math.max(value, 0) * 111}
                width="60"
                height={Math.abs(value) * 111}
                className={i ? 'visual-secondary' : 'visual-dot'}
              />
              <text x={130 + i * 130} y="228" textAnchor="middle">
                {i ? 'Euler' : 'Exact'}
              </text>
            </g>
          ))}
        </svg>
        <figcaption>
          Start fully excited with decay rate 2. Both updates preserve trace, but a negative population makes
          the Euler state unphysical.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          ['Exact population', exact.toFixed(3)],
          ['Euler population', euler.toFixed(3)],
          ['Euler state', euler < 0 ? 'Negative population' : 'Valid for this input']
        ]}
      />
    </>
  );
}

function VariationalWidget() {
  const [angle, setAngle] = useState(0);
  const radians = (angle * Math.PI) / 180;
  const a = Math.cos(radians);
  const b = -Math.sin(radians);
  const energy = -1 - 2 * Math.sin(2 * radians);
  const x = 44 + (272 * angle) / 45;
  const y = 41 + 54 * (-energy - 1);
  const curve = Array.from(
    { length: 46 },
    (_, degrees) => `${44 + (272 * degrees) / 45},${41 + 108 * Math.sin((degrees * Math.PI) / 90)}`
  ).join(' ');
  return (
    <>
      <WidgetRange
        label="Mixing angle θ"
        min={0}
        max={45}
        value={angle}
        onChange={setAngle}
        formatValue={(n) => `${n}°`}
      />
      <figure>
        <svg
          viewBox="0 0 360 190"
          role="img"
          aria-label={`Two-spin energy ${energy.toFixed(3)} at ${angle} degrees`}
        >
          <path d="M 44 28 V 152 H 326" className="visual-axis" />
          <path d="M 44 41 H 316" className="visual-curve" />
          <polyline points={curve} className="widget-plot-line" />
          <circle cx={x} cy={y} r="6" className="visual-dot" />
          <text x="14" y="46">
            −1
          </text>
          <text x="14" y="154">
            −3
          </text>
          <text x="52" y="26">
            Product-state limit
          </text>
          <text x="44" y="180" textAnchor="middle">
            0°
          </text>
          <text x="316" y="180" textAnchor="middle">
            45°
          </text>
        </svg>
        <figcaption>
          Vary cos θ |01⟩ − sin θ |10⟩ for H = XX + YY + ZZ. At 45°, the trial state is the singlet.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          ['Trial energy', energy.toFixed(3)],
          ['Schmidt rank', angle === 0 ? 1 : 2],
          ['Amplitude of |01⟩', a.toFixed(3)],
          ['Amplitude of |10⟩', b.toFixed(3)]
        ]}
      />
    </>
  );
}

export const SIMULATION_PRACTICE_WIDGETS = {
  commutation: {
    title: 'Count the local swaps',
    Component: CommutationWidget,
    check: {
      question: 'Which string commutes with XX?',
      options: [
        { label: 'ZZ', correct: true, feedback: 'The two local minus signs multiply to +1.' },
        { label: 'ZI', feedback: 'Only the first site contributes a minus sign.' }
      ]
    }
  },
  rewrite: {
    title: 'Simplify a CNOT pair',
    Component: RewriteWidget,
    check: {
      question: 'Which middle gate leaves the target untouched in the simplified circuit?',
      options: [
        {
          label: 'Z on control',
          correct: true,
          feedback: 'Z on the control commutes with CNOT. Only Z remains.'
        },
        { label: 'X on control', feedback: 'A control flip propagates to the target through CNOT.' }
      ]
    }
  },
  budget: {
    title: 'Spend 120 shots',
    Component: ShotBudgetWidget,
    check: {
      question: 'Which allocation gives the smaller standard error?',
      options: [
        {
          label: '60 to A, 60 to B',
          feedback: 'B contributes the larger variance and benefits more from extra shots.'
        },
        {
          label: '40 to A, 80 to B',
          correct: true,
          feedback:
            'For this fixed budget, allocating in proportion to the standard deviations 1 and 2 minimizes the variance.'
        }
      ]
    }
  },
  lindblad: {
    title: 'Take one time step',
    Component: LindbladWidget,
    check: {
      question: 'What happens at Δt = 0.60?',
      options: [
        { label: 'Both populations are positive', feedback: 'The Euler update gives 1 − 2 × 0.60 = −0.20.' },
        {
          label: 'Euler gives a negative population',
          correct: true,
          feedback:
            'The exact exponential stays positive. Preserving trace alone cannot prevent an invalid state.'
        }
      ]
    }
  },
  variational: {
    title: 'Lower the trial energy',
    Component: VariationalWidget,
    check: {
      question: 'What bond dimension is needed to represent this singlet?',
      options: [
        {
          label: '1',
          feedback: 'Bond dimension one only allows product states, whose energy here is at least −1.'
        },
        { label: '2', correct: true, feedback: 'The singlet has two nonzero Schmidt coefficients.' }
      ]
    }
  }
} satisfies Record<string, WidgetSpec>;

import { useState } from 'react';
import { measurementShots, realCircuit, type RealGate } from '../../lib/lessonWidgets';
import { WidgetRange, WidgetValues, type WidgetSpec } from './WidgetParts';

function GateWidget() {
  const [gates, setGates] = useState<RealGate[]>([]);
  const amplitudes = realCircuit(gates);
  return (
    <>
      <p className="widget-prompt">
        Start at |0⟩. Try H twice, then compare H → Z → H. Watch signs as well as probabilities.
      </p>
      <div className="widget-actions" role="group" aria-label="Circuit gates">
        {(['H', 'X', 'Z'] as const).map((gate) => (
          <button
            type="button"
            className="button secondary"
            key={gate}
            disabled={gates.length >= 8}
            onClick={() => setGates([...gates, gate])}
          >
            Apply {gate}
          </button>
        ))}
        <button
          type="button"
          className="button secondary"
          disabled={!gates.length}
          onClick={() => setGates(gates.slice(0, -1))}
        >
          Undo gate
        </button>
      </div>
      {gates.length >= 8 && <p role="status">Circuit full. Undo a gate or reset to try another sequence.</p>}
      <svg
        viewBox="0 0 380 64"
        role="img"
        aria-label={`Circuit: input zero${gates.length ? `, then ${gates.join(', then ')}` : ', no gates'}`}
      >
        <text x="8" y="38">
          |0⟩
        </text>
        <line x1="44" y1="32" x2="366" y2="32" className="visual-axis" />
        {gates.map((gate, i) => (
          <g key={i}>
            <rect x={52 + i * 38} y="15" width="28" height="34" rx="4" className="visual-tensor" />
            <text x={66 + i * 38} y="38" textAnchor="middle">
              {gate}
            </text>
          </g>
        ))}
      </svg>
      <figure>
        <svg
          viewBox="0 0 360 270"
          role="img"
          aria-label={`Signed real amplitudes: zero ${amplitudes[0].toFixed(3)}, one ${amplitudes[1].toFixed(3)}`}
        >
          <path d="M 45 40 V 220 M 45 130 H 325" className="visual-axis" />
          <text x="15" y="55">
            +1
          </text>
          <text x="25" y="136">
            0
          </text>
          <text x="15" y="217">
            −1
          </text>
          {amplitudes.map((value, i) => (
            <g key={i}>
              <rect
                x={82 + i * 140}
                y={value >= 0 ? 130 - value * 80 : 130}
                width="60"
                height={Math.abs(value) * 80}
                className={value >= 0 ? 'visual-dot' : 'visual-secondary'}
              />
              <text
                x={112 + i * 140}
                y={value >= 0 ? 120 - value * 80 : 152 - value * 80}
                textAnchor="middle"
              >
                {Math.abs(value) < 1e-10 ? '0.000' : value.toFixed(3)}
              </text>
              <text x={112 + i * 140} y="255" textAnchor="middle">
                |{i}⟩
              </text>
            </g>
          ))}
        </svg>
        <figcaption>
          These gates keep amplitudes real. Measurement probabilities are their squares; relative minus signs
          can change what a later H gate does.
        </figcaption>
      </figure>
      <WidgetValues values={amplitudes.map((a, i) => [`Measure ${i}`, `${(100 * a * a).toFixed(1)}%`])} />
    </>
  );
}

function SamplingWidget() {
  const [probability, setProbability] = useState(50);
  const [count, setCount] = useState(0);
  const shots = measurementShots(probability / 100, count);
  const ones = shots.filter(Boolean).length;
  const error = count ? Math.sqrt(((probability / 100) * (1 - probability / 100)) / count) : null;
  return (
    <>
      <p className="widget-prompt">
        Repeat a two-outcome measurement. Does the observed frequency match the probability after every batch?
      </p>
      <WidgetRange
        label="Probability of 1 (%)"
        min={0}
        max={100}
        step={5}
        value={probability}
        onChange={(value) => {
          setProbability(value);
          setCount(0);
        }}
      />
      <div className="widget-actions">
        {[10, 100].map((batch) => (
          <button
            type="button"
            className="button secondary"
            key={batch}
            disabled={count >= 2000}
            onClick={() => setCount(Math.min(2000, count + batch))}
          >
            Take {batch} shots
          </button>
        ))}
      </div>
      <figure>
        <svg
          viewBox="0 0 340 270"
          role="img"
          aria-label={`${count} simulated shots, ${ones} outcomes of one. Showing the first ${Math.min(count, 100)} outcomes.`}
        >
          {!count && (
            <text x="170" y="135" textAnchor="middle">
              Take a few shots
            </text>
          )}
          {shots.slice(0, 100).map((one, i) => (
            <circle
              key={i}
              cx={35 + (i % 10) * 30}
              cy={24 + Math.floor(i / 10) * 25}
              r="8"
              className={one ? 'visual-dot' : 'widget-shot-zero'}
            />
          ))}
        </svg>
        <figcaption>
          Filled = 1, empty = 0.{' '}
          {count > 100 ? 'Only the first 100 shots are drawn; totals use every shot. ' : ''}Reset repeats the
          same simulated sequence. Changing the probability starts a fresh run.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          ['Total shots', count],
          ['Observed frequency of 1', count ? `${((100 * ones) / count).toFixed(1)}%` : '—'],
          ['Expected standard error', error === null ? '—' : `${(100 * error).toFixed(1)} pp`]
        ]}
      />
      <p className="widget-note">
        Standard error uses the chosen probability and independent shots. It describes typical variation in
        percentage points, not a guaranteed error bound.
      </p>
      {count === 2000 && <p role="status">2,000 shots reached. Reset to start again.</p>}
    </>
  );
}

export const QUANTUM_PRACTICE_WIDGETS = {
  gates: {
    title: 'Build a quantum circuit',
    Component: GateWidget,
    check: {
      question: 'Starting at |0⟩, what does H → Z → H produce?',
      options: [
        {
          label: '|0⟩',
          feedback:
            'Z flips the relative sign after the first H. Try the last H and watch the amplitudes interfere.'
        },
        {
          label: '|1⟩',
          correct: true,
          feedback: 'H creates |+⟩, Z turns it into |−⟩, and H turns |−⟩ into |1⟩.'
        },
        {
          label: 'A 50–50 measurement',
          feedback: 'That is true after the first H, but the remaining gates change the state.'
        }
      ]
    }
  },
  sampling: {
    title: 'Measurement and sampling',
    Component: SamplingWidget,
    check: {
      question: 'Going from 100 to 400 independent shots changes standard error by what factor?',
      options: [
        {
          label: 'One half',
          correct: true,
          feedback: 'Standard error scales as 1/√N. Four times as many shots halves it.'
        },
        {
          label: 'One quarter',
          feedback: 'Variance falls by a factor of four; standard error is its square root.'
        },
        {
          label: 'No change',
          feedback:
            'More independent shots reduce typical sampling uncertainty, though individual estimates still fluctuate.'
        }
      ]
    }
  }
} satisfies Record<string, WidgetSpec>;

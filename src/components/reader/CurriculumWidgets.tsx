import { useState } from 'react';
import { WidgetRange, WidgetSelect, WidgetValues, type WidgetSpec } from './WidgetParts';

function EuclidWidget() {
  const [pair, setPair] = useState(0);
  const [step, setStep] = useState(0);
  let [a, b] = [
    [252, 105],
    [48, 18],
    [35, 12]
  ][pair];
  const divisions = [];
  while (b !== 0) {
    const remainder = a % b;
    divisions.push({ a, b, remainder });
    [a, b] = [b, remainder];
  }
  const current = divisions[step];
  return (
    <>
      <WidgetSelect
        label="Starting pair"
        options={[
          [0, '(252, 105)'],
          [1, '(48, 18)'],
          [2, '(35, 12)']
        ]}
        value={pair}
        onChange={(next) => {
          setPair(next);
          setStep(0);
        }}
      />
      <WidgetRange
        label="Division"
        min={1}
        max={divisions.length}
        value={step + 1}
        onChange={(n) => setStep(n - 1)}
      />
      <WidgetValues
        values={[
          [
            'Division equation',
            `${current.a} = ${Math.floor(current.a / current.b)} × ${current.b} + ${current.remainder}`
          ],
          ['Next pair', `(${current.b}, ${current.remainder})`],
          ['Status', current.remainder === 0 ? `GCD = ${current.b}` : 'Same GCD']
        ]}
      />
    </>
  );
}

function RabiWidget() {
  const [detuning, setDetuning] = useState(0);
  const [time, setTime] = useState(100);
  const frequency = Math.hypot(5, detuning);
  const maximum = (5 / frequency) ** 2;
  const population = (ns: number) => maximum * Math.sin((Math.PI * frequency * ns) / 1000) ** 2;
  const y = (ns: number) => 126 - 100 * population(ns);
  return (
    <>
      <p className="widget-prompt">
        The drive strength Ω/2π stays at 5 MHz. Change the detuning to compare the first peaks.
      </p>
      <WidgetRange
        label="Detuning Δ/2π"
        min={0}
        max={10}
        value={detuning}
        formatValue={(n) => `${n} MHz`}
        onChange={setDetuning}
      />
      <WidgetRange
        label="Pulse duration"
        min={0}
        max={200}
        value={time}
        formatValue={(n) => `${n} ns`}
        onChange={setTime}
      />
      <svg
        viewBox="0 0 360 157"
        role="img"
        aria-label={`Excited population versus duration at ${detuning} megahertz detuning`}
      >
        <path className="visual-axis" d="M45 26 V126 H325 M41 26 H45" />
        <text x="10" y="30">
          1
        </text>
        <text x="10" y="130">
          0
        </text>
        <text x="45" y="150" textAnchor="middle">
          0
        </text>
        <text x="185" y="150" textAnchor="middle">
          100 ns
        </text>
        <text x="325" y="150" textAnchor="middle">
          200 ns
        </text>
        <polyline
          className="visual-vector"
          fill="none"
          points={Array.from({ length: 101 }, (_, i) => `${45 + 2.8 * i},${y(2 * i)}`).join(' ')}
        />
        <circle className="visual-dot" cx={45 + 1.4 * time} cy={y(time)} r="5" />
      </svg>
      <WidgetValues
        values={[
          ['Excited population', `${(100 * population(time)).toFixed(1)}%`],
          ['Maximum', `${(100 * maximum).toFixed(1)}%`],
          ['First peak', `${(500 / frequency).toFixed(1)} ns`]
        ]}
      />
    </>
  );
}

function SyndromeWidget() {
  const [flips, setFlips] = useState([0, 0, 0]);
  const [a, b, c] = flips;
  const s = a ^ b;
  const t = b ^ c;
  const repair = [0, 3, 1, 2][2 * s + t];
  const residual = flips.map((flip, i) => flip ^ Number(i + 1 === repair)).join('');
  return (
    <>
      <div className="widget-actions" role="group" aria-label="Physical bit flips">
        {flips.map((error, index) => (
          <button
            type="button"
            className="widget-answer"
            key={index}
            aria-pressed={Boolean(error)}
            onClick={() => setFlips(flips.map((bit, i) => (i === index ? 1 - bit : bit)))}
          >
            Flip qubit {index + 1}
          </button>
        ))}
      </div>
      <WidgetValues
        values={[
          ['Physical flip pattern', flips.join('')],
          ['Syndrome (ZZI, IZZ)', `${s}${t}`],
          ['One-flip decoder', repair ? `Flip qubit ${repair}` : 'No action'],
          ['After recovery', residual === '000' ? 'Recovered' : 'Logical X (111)']
        ]}
      />
    </>
  );
}

function AccumulationWidget() {
  const [uses, setUses] = useState(50);
  const [alternate, setAlternate] = useState(0);
  const epsilon = 0.02;
  const q = Math.sin(epsilon / 2) ** 2;
  const coherent = Math.sin(((alternate ? uses % 2 : uses) * epsilon) / 2) ** 2;
  const stochastic = (1 - (1 - 2 * q) ** uses) / 2;
  return (
    <>
      <p className="widget-prompt">Each use has ε = 0.02 rad or a matching stochastic flip probability.</p>
      <WidgetRange label="Number of uses" min={0} max={150} value={uses} onChange={setUses} />
      <WidgetSelect
        label="Coherent rotation sign"
        options={[
          [0, 'Fixed'],
          [1, 'Alternating']
        ]}
        value={alternate}
        onChange={setAlternate}
      />
      <WidgetValues
        values={[
          ['Coherent P(1)', `${(100 * coherent).toFixed(2)}%`],
          ['Stochastic P(1)', `${(100 * stochastic).toFixed(2)}%`]
        ]}
      />
    </>
  );
}

function EchoWidget() {
  const [mode, setMode] = useState(1);
  const [position, setPosition] = useState(75);
  const signedTime = mode ? (2 * position - 100) / 100 : 1;
  const pulseX = 30 + 3 * position;
  return (
    <>
      <WidgetSelect
        label="Sequence"
        options={[
          [0, 'Ramsey'],
          [1, 'One refocusing pulse']
        ]}
        value={mode}
        onChange={setMode}
      />
      {mode === 1 && (
        <WidgetRange
          label="Pulse position"
          min={0}
          max={100}
          step={5}
          value={position}
          formatValue={(n) => `${n}%`}
          onChange={setPosition}
        />
      )}
      <svg
        viewBox="0 0 360 128"
        role="img"
        aria-label={
          mode
            ? `Phase coupling switches from plus to minus at ${position}% of the duration`
            : 'Phase coupling stays positive for the entire duration'
        }
      >
        <path className="visual-axis" d="M30 20 V100 M30 60 H330" />
        <text x="5" y="36">
          +1
        </text>
        <text x="5" y="98">
          −1
        </text>
        <text x="30" y="122" textAnchor="middle">
          0
        </text>
        <text x="330" y="122" textAnchor="middle">
          T
        </text>
        <path className="visual-vector" fill="none" d={mode ? `M30 30 H${pulseX} V90 H330` : 'M30 30 H330'} />
      </svg>
      <WidgetValues
        values={[
          ['Signed duration / T', signedTime.toFixed(2)],
          ['Static-offset variance / Ramsey', (signedTime ** 2).toFixed(2)]
        ]}
      />
    </>
  );
}

export const CURRICULUM_WIDGETS = {
  euclid: {
    title: 'Trace the Euclidean algorithm',
    Component: EuclidWidget,
    check: {
      question: 'What decreases at every nonterminal division?',
      options: [
        { label: 'Second entry', correct: true, feedback: 'The remainder is smaller than the divisor.' },
        { label: 'GCD', feedback: 'The common divisors are preserved by taking a remainder.' }
      ]
    }
  },
  rabi: {
    title: 'Tune a Rabi pulse',
    Component: RabiWidget,
    check: {
      question: 'What is the largest excited population at 5 MHz detuning?',
      options: [
        { label: '50%', correct: true, feedback: 'Equal drive strength and detuning give a maximum of 1/2.' },
        { label: '100%', feedback: 'Changing duration cannot compensate for the tilted axis.' }
      ]
    }
  },
  syndrome: {
    title: 'Decode a repetition syndrome',
    Component: SyndromeWidget,
    check: {
      question: 'Which error has the same syndrome as flips on qubits 1 and 3?',
      options: [
        {
          label: 'A flip on qubit 2',
          correct: true,
          feedback: 'Both patterns flip the signs of both checks.'
        },
        { label: 'No flips', feedback: 'No flips produce 00. Try flipping both end qubits.' }
      ]
    }
  },
  accumulation: {
    title: 'Repeat two matched errors',
    Component: AccumulationWidget,
    check: {
      question: 'Which error cancels when successive rotation signs alternate?',
      options: [
        {
          label: 'Coherent rotation',
          correct: true,
          feedback: 'Each pair of opposite rotations multiplies to identity.'
        },
        {
          label: 'Independent random flips',
          feedback: 'Each flip probability depends on the squared sine, which keeps the same value.'
        }
      ]
    }
  },
  echo: {
    title: 'Move the refocusing pulse',
    Component: EchoWidget,
    check: {
      question: 'Where does one pulse cancel a constant frequency offset?',
      options: [
        {
          label: 'Halfway through',
          correct: true,
          feedback: 'The positive and negative durations are equal.'
        },
        { label: 'Three quarters through', feedback: 'The signed duration is still T/2 in this case.' }
      ]
    }
  }
} satisfies Record<string, WidgetSpec>;

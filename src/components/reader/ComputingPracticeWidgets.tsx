import { useState } from 'react';
import { WidgetRange, WidgetSelect, WidgetValues, type WidgetSpec } from './WidgetParts';

function CancellationWidget() {
  const [exponent, setExponent] = useState(6);
  const x = 10 ** -exponent;
  const round = (n: number) => Number(n.toPrecision(4));
  const root = round(Math.sqrt(round(1 + x)));
  const direct = round(root - 1);
  const rationalized = round(x / round(root + 1));
  return (
    <>
      <WidgetRange
        label="Small input exponent"
        min={2}
        max={8}
        value={exponent}
        formatValue={(n) => `−${n}`}
        onChange={setExponent}
      />
      <WidgetValues
        values={[
          ['Input x', x.toExponential(0)],
          ['Rounded 1 + x', round(1 + x).toPrecision(4)],
          ['Direct result', direct ? direct.toExponential(3) : '0'],
          ['Rationalized result', rationalized.toExponential(3)]
        ]}
      />
    </>
  );
}

function ConcentrationWidget() {
  const [points, setPoints] = useState(5);
  const [estimates, setEstimates] = useState(1);
  const count = Math.ceil(Math.log(40 * estimates) / (2 * (points / 100) ** 2));
  return (
    <>
      <p className="widget-prompt">Use a 5% total failure budget for estimates of probabilities.</p>
      <WidgetRange
        label="Absolute tolerance"
        min={2}
        max={20}
        value={points}
        formatValue={(n) => `${n} pp`}
        onChange={setPoints}
      />
      <WidgetRange label="Simultaneous estimates" min={1} max={8} value={estimates} onChange={setEstimates} />
      <WidgetValues
        values={[
          ['Failure budget per estimate', `${(5 / estimates).toFixed(2)}%`],
          ['Sufficient draws per estimate', String(count)]
        ]}
      />
    </>
  );
}

function AdiabaticGapWidget() {
  const [position, setPosition] = useState(50);
  const [path, setPath] = useState(0);
  const energy = (s: number) => (path === 0 ? Math.hypot(1 - s, s) : Math.abs(1 - 2 * s));
  const x = (s: number) => 42 + 280 * s;
  const y = (e: number) => 76 - 48 * e;
  const levels = (sign: number) =>
    Array.from({ length: 41 }, (_, i) => {
      const s = i / 40;
      return `${x(s)},${y(sign * energy(s))}`;
    }).join(' ');
  const s = position / 100;
  const level = energy(s);
  return (
    <>
      <WidgetSelect
        label="Hamiltonian path"
        options={[
          [0, 'Rotate from Z to X'],
          [1, 'Reverse Z through zero']
        ]}
        value={path}
        onChange={setPath}
      />
      <WidgetRange
        label="Schedule position s"
        min={0}
        max={100}
        step={5}
        value={position}
        formatValue={(n) => (n / 100).toFixed(2)}
        onChange={setPosition}
      />
      <svg
        viewBox="0 0 360 159"
        role="img"
        aria-label={`Instantaneous energies at s = ${s}: plus and minus ${level.toFixed(3)} in units of E`}
      >
        <path className="visual-axis" d="M42 22 V128 M42 76 H322" />
        <text x="4" y="33">
          +E
        </text>
        <text x="4" y="130">
          −E
        </text>
        <text x="42" y="150" textAnchor="middle">
          0
        </text>
        <text x="322" y="150" textAnchor="middle">
          1
        </text>
        <polyline className="visual-vector" fill="none" points={levels(1)} />
        <polyline className="visual-vector" fill="none" points={levels(-1)} />
        <line className="visual-axis" x1={x(s)} x2={x(s)} y1={y(level)} y2={y(-level)} />
        <circle className="visual-dot" cx={x(s)} cy={y(level)} r="4" />
        <circle className="visual-dot" cx={x(s)} cy={y(-level)} r="4" />
      </svg>
      <WidgetValues values={[['Energy gap / E', (2 * level).toFixed(3)]]} />
    </>
  );
}

function AmplificationWidget() {
  const [runs, setRuns] = useState(7);
  const [model, setModel] = useState(0);
  const bound = model === 0 ? Math.exp(-runs / 18) : 2 ** -runs;
  return (
    <>
      <WidgetSelect
        label="Guarantee"
        options={[
          [0, 'BPP · majority'],
          [1, 'RP · accept any success']
        ]}
        value={model}
        onChange={setModel}
      />
      <WidgetRange label="Independent runs" min={1} max={101} step={2} value={runs} onChange={setRuns} />
      <WidgetValues
        values={[
          ['Failure probability bound', `${(100 * bound).toPrecision(3)}%`],
          ['Certifies failure below 1%', bound < 0.01 ? 'Yes' : 'No']
        ]}
      />
    </>
  );
}

function GroverWidget() {
  const [marked, setMarked] = useState(4);
  const [iterations, setIterations] = useState(1);
  const theta = Math.asin(Math.sqrt(marked / 16));
  const probability = Math.sin((2 * iterations + 1) * theta) ** 2;
  const perLabel = (i: number) => (i < marked ? probability / marked : (1 - probability) / (16 - marked));
  return (
    <>
      <WidgetSelect
        label="Marked labels of 16"
        options={[
          [1, '1'],
          [2, '2'],
          [4, '4'],
          [8, '8']
        ]}
        value={marked}
        onChange={setMarked}
      />
      <WidgetRange label="Oracle calls" min={0} max={10} value={iterations} onChange={setIterations} />
      <figure>
        <svg
          viewBox="0 0 360 134"
          role="img"
          aria-label={`Probability per label with ${marked} marked labels after ${iterations} Grover iterations`}
        >
          <path className="visual-axis" d="M30 16 V103 H350 M26 17 H30" />
          <text x="8" y="22">
            1
          </text>
          <text x="8" y="107">
            0
          </text>
          {Array.from({ length: 16 }, (_, i) => {
            const height = 86 * perLabel(i);
            return (
              <rect
                key={i}
                className={i < marked ? 'visual-dot' : 'visual-secondary'}
                x={33 + i * 19.5}
                y={103 - height}
                width="14"
                height={height}
              />
            );
          })}
          <text x="33" y="126">
            0
          </text>
          <text x="325" y="126">
            15
          </text>
        </svg>
        <figcaption>
          Marked labels come first. Bar height gives the probability of each individual label.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          ['Probability of any marked label', `${(100 * probability).toFixed(2)}%`],
          ['Uniform starting probability', `${((100 * marked) / 16).toFixed(2)}%`]
        ]}
      />
    </>
  );
}

function TrotterBudgetWidget() {
  const [t, setTime] = useState(1);
  const [epsilon, setTolerance] = useState(0.01);
  const [commutes, setCommutes] = useState(0);
  const norm = commutes ? 0 : 2;
  const steps = Math.max(1, Math.ceil((t * t * norm) / (2 * epsilon)));
  return (
    <>
      <WidgetSelect
        label="Hamiltonian terms"
        options={[
          [0, 'X and Z'],
          [1, 'X and X']
        ]}
        value={commutes}
        onChange={setCommutes}
      />
      <WidgetRange label="Evolution time" min={1} max={5} value={t} onChange={setTime} />
      <WidgetSelect
        label="Error tolerance"
        options={[
          [0.1, '0.1'],
          [0.01, '0.01'],
          [0.001, '0.001']
        ]}
        value={epsilon}
        onChange={setTolerance}
      />
      <WidgetValues
        values={[
          ['Commutator norm', String(norm)],
          ['Sufficient steps', String(steps)],
          ['Term exponentials', String(2 * steps)]
        ]}
      />
    </>
  );
}

export const COMPUTING_PRACTICE_WIDGETS = {
  cancellation: {
    title: 'Compare two rounded formulas',
    Component: CancellationWidget,
    check: {
      question: 'Why does the rationalized formula keep a nonzero result?',
      options: [
        {
          label: 'The numerator still contains x',
          correct: true,
          feedback: 'The denominator can be rounded to 2 without discarding the small numerator.'
        },
        { label: 'It uses more digits', feedback: 'Both computations use four significant digits.' }
      ]
    }
  },
  concentration: {
    title: 'Set a sample budget',
    Component: ConcentrationWidget,
    check: {
      question: 'What happens to the unrounded budget when the tolerance is halved?',
      options: [
        {
          label: 'It quadruples',
          correct: true,
          feedback: 'Accuracy enters in the denominator as the squared tolerance.'
        },
        { label: 'It doubles', feedback: 'Compare the counts at 10 and 5 percentage points.' }
      ]
    }
  },
  adiabaticGap: {
    title: 'Track a gap along the schedule',
    Component: AdiabaticGapWidget,
    check: {
      question: 'Which path closes its gap at s = 0.5?',
      options: [
        {
          label: 'Reverse Z through zero',
          correct: true,
          feedback: 'At the midpoint the diagonal Hamiltonian vanishes.'
        },
        {
          label: 'Rotate from Z to X',
          feedback: 'Both coefficients have magnitude 1/2 there, leaving a nonzero splitting.'
        }
      ]
    }
  },
  amplification: {
    title: 'Reduce decision error by repetition',
    Component: AmplificationWidget,
    check: {
      question: 'Why can RP accept as soon as any run accepts?',
      options: [
        {
          label: 'A no instance never accepts',
          correct: true,
          feedback: 'Taking the union of impossible false acceptances preserves the guarantee.'
        },
        {
          label: 'Each run is error-free',
          feedback: 'An RP run can reject a yes instance. Extra runs give it more chances to accept.'
        }
      ]
    }
  },
  grover: {
    title: 'Rotate toward the marked labels',
    Component: GroverWidget,
    check: {
      question: 'With 4 marked labels, what happens if you add a second call after the first peak?',
      options: [
        {
          label: 'Success falls to 25%',
          correct: true,
          feedback: 'The second rotation takes the angle from π/2 to 5π/6.'
        },
        { label: 'Success stays at 100%', feedback: 'The rotation continues past the marked axis.' }
      ]
    }
  },
  trotterBudget: {
    title: 'Budget the product-formula steps',
    Component: TrotterBudgetWidget,
    check: {
      question: 'For the X and Z pair, what happens to the bound when you double the time?',
      options: [
        {
          label: 'It needs four times the steps',
          correct: true,
          feedback: 'The global error bound grows with the square of the duration at fixed step count.'
        },
        {
          label: 'It needs twice the steps',
          feedback: 'The duration is squared in the numerator of the bound.'
        }
      ]
    }
  }
} satisfies Record<string, WidgetSpec>;

import { useState } from 'react';
import type { Vec2 } from '../../lib/lessonWidgets';
import {
  PlaneArrow,
  planePoint,
  VectorPlane,
  WidgetRange,
  WidgetSelect,
  WidgetValues,
  type WidgetSpec
} from './WidgetParts';

function InverseWidget() {
  const [modulus, setModulus] = useState(5);
  const [factor, setFactor] = useState(3);
  const row = Array.from({ length: modulus }, (_, n) => (factor * n) % modulus);
  const inverse = row.indexOf(1);
  return (
    <>
      <div className="widget-selects">
        <WidgetSelect
          label="Modulus"
          value={modulus}
          options={[
            [5, '5'],
            [6, '6']
          ]}
          onChange={(next) => {
            setModulus(next);
            setFactor(Math.min(factor, next - 1));
          }}
        />
        <WidgetSelect
          label="Multiplier"
          value={factor}
          options={row.slice(1).map((_, i) => [i + 1, String(i + 1)])}
          onChange={setFactor}
        />
      </div>
      <figure>
        <ol className="widget-tiles" aria-label="Products by residue, starting with zero">
          {row.map((result, n) => (
            <li key={n} className={result === 1 ? 'widget-tile widget-tile-marked' : 'widget-tile'}>
              <span>
                {factor} × {n}
              </span>
              <strong>{result}</strong>
            </li>
          ))}
        </ol>
        <figcaption>
          An inverse is a multiplier that makes the product equal to 1 modulo {modulus}.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          [`Inverse of ${factor}`, inverse === -1 ? 'None' : inverse],
          ['Distinct products', `${new Set(row).size} of ${modulus}`]
        ]}
      />
    </>
  );
}

function ProjectionWidget() {
  const [angle, setAngle] = useState(30);
  const radians = (angle * Math.PI) / 180;
  const q: Vec2 = [Math.cos(radians), Math.sin(radians)];
  const projection: Vec2 = [3 * q[0] ** 2, 3 * q[0] * q[1]];
  const endpoints = [planePoint([-4 * q[0], -4 * q[1]]), planePoint([4 * q[0], 4 * q[1]])];
  const length = Math.hypot(...projection);
  return (
    <>
      <WidgetRange
        label="Line angle"
        min={0}
        max={90}
        step={5}
        value={angle}
        onChange={setAngle}
        formatValue={(n) => `${n}°`}
      />
      <figure>
        <VectorPlane
          label={`Projection of (3, 0) onto a line at ${angle} degrees. Projection length ${length.toFixed(2)}.`}
        >
          <line
            x1={endpoints[0][0]}
            y1={endpoints[0][1]}
            x2={endpoints[1][0]}
            y2={endpoints[1][1]}
            className="visual-curve"
          />
          <PlaneArrow to={[3, 0]} secondary />
          <PlaneArrow from={projection} to={[3, 0]} secondary />
          <PlaneArrow to={projection} />
          <circle
            cx={planePoint(projection)[0]}
            cy={planePoint(projection)[1]}
            r="4"
            className="visual-dot"
          />
        </VectorPlane>
        <figcaption>
          The green arrow is the projection of (3, 0) in the real plane. The segment from its tip to the
          original tip is perpendicular to the dotted line.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          ['Projection length', length.toFixed(2)],
          ['Residual length', Math.hypot(3 - projection[0], projection[1]).toFixed(2)]
        ]}
      />
    </>
  );
}

function PowerWidget() {
  const [start, setStart] = useState('diagonal');
  const [steps, setSteps] = useState(0);
  const ratio = start === 'diagonal' ? 4 ** steps : 0;
  const norm = Math.hypot(ratio, 1);
  const x = ratio / norm;
  const y = 1 / norm;
  const eigenvalue = 4 * x ** 2 + y ** 2;
  return (
    <>
      <WidgetSelect
        label="Starting direction"
        value={start}
        options={[
          ['diagonal', '(1, 1)'],
          ['vertical', '(0, 1)']
        ]}
        onChange={(next) => {
          setStart(next);
          setSteps(0);
        }}
      />
      <WidgetRange label="Iterations" min={0} max={6} value={steps} onChange={setSteps} />
      <figure>
        <VectorPlane label={`Normalized iterate (${x.toFixed(3)}, ${y.toFixed(3)}) after ${steps} steps`}>
          <PlaneArrow to={[3, 0]} secondary />
          <PlaneArrow to={[3 * x, 3 * y]} />
        </VectorPlane>
        <figcaption>
          Each step applies A = diag(4, 1), then rescales to length one. Both arrows are drawn at three times
          their unit length.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          ['Rayleigh quotient', eigenvalue.toFixed(4)],
          ['Residual length', Math.hypot((4 - eigenvalue) * x, (1 - eigenvalue) * y).toFixed(4)]
        ]}
      />
    </>
  );
}

function RefinementWidget() {
  const [marked, setMarked] = useState(false);
  const [round, setRound] = useState(0);
  const classes =
    round === 0 ? [0, marked ? 1 : 0, marked ? 1 : 0, marked ? 1 : 0] : marked ? [0, 1, 2, 3] : [0, 1, 1, 0];
  const labels = ['a', 'b', 'c', 'd'];
  const groups = [...new Set(classes)].map(
    (group) => `{${labels.filter((_, i) => classes[i] === group).join(', ')}}`
  );
  return (
    <>
      <label className="widget-toggle">
        <input
          type="checkbox"
          checked={marked}
          onChange={(event) => {
            setMarked(event.target.checked);
            setRound(0);
          }}
        />
        Mark endpoint a
      </label>
      <WidgetRange label="Refinement rounds" min={0} max={3} value={round} onChange={setRound} />
      <figure>
        <svg viewBox="0 0 360 100" role="img" aria-label={`Path a–b–c–d, classes ${groups.join(', ')}`}>
          <path d="M 48 39 H 312" className="visual-axis" />
          {labels.map((letter, i) => (
            <g key={letter}>
              <circle cx={48 + 88 * i} cy="39" r="20" className="visual-tensor" />
              <text x={48 + 88 * i} y="45" textAnchor="middle">
                {letter}
              </text>
              <text x={48 + 88 * i} y="83" textAnchor="middle">{`Class ${classes[i] + 1}`}</text>
            </g>
          ))}
        </svg>
        <figcaption>
          Split each class by its neighbor counts into every current class. Marking a gives it a separate
          starting class.
        </figcaption>
      </figure>
      <WidgetValues
        values={[[`Classes after ${round} ${round === 1 ? 'round' : 'rounds'}`, groups.join(' · ')]]}
      />
    </>
  );
}

export const MATH_PRACTICE_WIDGETS = {
  inverse: {
    title: 'Find the inverse',
    Component: InverseWidget,
    check: {
      question: 'Does 3 have a multiplicative inverse modulo 6?',
      options: [
        { label: 'Yes', feedback: 'The row for 3 contains only 0 and 3.' },
        {
          label: 'No',
          correct: true,
          feedback: 'Every multiple of 3 is divisible by 3, so none is congruent to 1 modulo 6.'
        }
      ]
    }
  },
  projection: {
    title: 'Drop the perpendicular',
    Component: ProjectionWidget,
    check: {
      question: 'When does the projection of (3, 0) vanish?',
      options: [
        { label: '0°', feedback: 'At 0°, the line contains the whole vector.' },
        {
          label: '90°',
          correct: true,
          feedback: 'The y-axis is perpendicular to (3, 0), so their inner product is zero.'
        }
      ]
    }
  },
  power: {
    title: 'Find the dominant direction',
    Component: PowerWidget,
    check: {
      question: 'Which starting vector stays on the y-axis?',
      options: [
        {
          label: '(1, 1)',
          feedback: 'Multiplication boosts its x component by a factor of four at each step.'
        },
        {
          label: '(0, 1)',
          correct: true,
          feedback: 'Its x component starts at zero. The diagonal matrix cannot create a new x component.'
        }
      ]
    }
  },
  refinement: {
    title: 'Split the vertex classes',
    Component: RefinementWidget,
    check: {
      question: 'In the unmarked path, do a and d ever get different classes?',
      options: [
        { label: 'Yes', feedback: 'Each endpoint has one neighbor in the interior class in every round.' },
        {
          label: 'No',
          correct: true,
          feedback: 'Reflection swaps the endpoints and preserves all neighbor counts.'
        }
      ]
    }
  }
} satisfies Record<string, WidgetSpec>;

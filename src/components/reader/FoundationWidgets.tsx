import { useId, useState } from 'react';
import { mapProperties, modularOrbit, PLANE_MAPS, transformVector, type Vec2 } from '../../lib/lessonWidgets';
import {
  PlaneArrow,
  planePolygon,
  VectorPlane,
  WidgetRange,
  WidgetValues,
  type WidgetSpec
} from './WidgetParts';

function MapWidget() {
  const arrowId = useId();
  const [outputs, setOutputs] = useState([0, 0, 1]);
  const [size, setSize] = useState(3);
  const result = mapProperties(outputs, size);
  return (
    <>
      <p className="widget-prompt">
        Give every input a different output. Then add a fourth point to the codomain.
      </p>
      <div className="widget-selects">
        {['a', 'b', 'c'].map((letter, i) => (
          <label key={letter}>
            {`f(${letter})`}
            <select
              aria-label={`Output of ${letter}`}
              value={outputs[i]}
              onChange={(event) =>
                setOutputs(outputs.map((v, j) => (i === j ? Number(event.target.value) : v)))
              }
            >
              {Array.from({ length: size }, (_, n) => (
                <option key={n} value={n}>
                  {n + 1}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          Codomain
          <select
            aria-label="Codomain size"
            value={size}
            onChange={(event) => {
              const next = Number(event.target.value);
              setSize(next);
              setOutputs(outputs.map((v) => Math.min(v, next - 1)));
            }}
          >
            <option value="3">3 points</option>
            <option value="4">4 points</option>
          </select>
        </label>
      </div>
      <figure>
        <svg
          viewBox="0 0 360 285"
          role="img"
          aria-label={`Map: a to ${outputs[0] + 1}, b to ${outputs[1] + 1}, c to ${outputs[2] + 1}`}
        >
          <defs>
            <marker id={arrowId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6" className="visual-dot" />
            </marker>
          </defs>
          <text x="65" y="25" textAnchor="middle">
            Inputs
          </text>
          <text x="285" y="25" textAnchor="middle">
            Codomain
          </text>
          {outputs.map((target, i) => (
            <line
              key={i}
              x1="87"
              y1={70 + 75 * i}
              x2="260"
              y2={60 + (target * 180) / (size - 1)}
              className="visual-vector"
              markerEnd={`url(#${arrowId})`}
            />
          ))}
          {['a', 'b', 'c'].map((letter, i) => (
            <g key={letter}>
              <circle cx="65" cy={70 + i * 75} r="22" className="visual-tensor" />
              <text x="65" y={76 + i * 75} textAnchor="middle">
                {letter}
              </text>
            </g>
          ))}
          {Array.from({ length: size }, (_, i) => (
            <g key={i}>
              <circle
                cx="285"
                cy={60 + (i * 180) / (size - 1)}
                r="22"
                className={outputs.includes(i) ? 'visual-tensor' : 'visual-outline'}
              />
              <text x="285" y={66 + (i * 180) / (size - 1)} textAnchor="middle">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
        <figcaption>
          One arrow per input makes a function. Shared targets prevent injectivity; unused targets prevent
          surjectivity.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          ['Injective', result.injective ? 'Yes' : 'No'],
          ['Surjective', result.surjective ? 'Yes' : 'No'],
          ['Image size', result.imageSize]
        ]}
      />
    </>
  );
}

function ClockWidget() {
  const [modulus, setModulus] = useState(6);
  const [step, setStep] = useState(2);
  const [count, setCount] = useState(1);
  const orbit = modularOrbit(modulus, step);
  const position = (n: number) => [
    180 + 102 * Math.sin((2 * Math.PI * n) / modulus),
    150 - 102 * Math.cos((2 * Math.PI * n) / modulus)
  ];
  const visited = new Set(orbit.slice(0, count + 1));
  return (
    <>
      <p className="widget-prompt">
        Keep adding the same number. Can you visit every position before returning to zero?
      </p>
      <label className="lesson-widget-control">
        Clock size
        <select
          aria-label="Clock size"
          value={modulus}
          onChange={(event) => {
            const next = Number(event.target.value);
            setModulus(next);
            setStep(Math.min(step, next - 1));
            setCount(0);
          }}
        >
          {[5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <WidgetRange
        label="Add each step"
        min={1}
        max={modulus - 1}
        value={step}
        onChange={(value) => {
          setStep(value);
          setCount(0);
        }}
      />
      <WidgetRange label="Steps taken" min={0} max={modulus} value={count} onChange={setCount} />
      <figure>
        <svg
          viewBox="0 0 360 300"
          role="img"
          aria-label={`Adding ${step} modulo ${modulus}; after ${count} steps the position is ${orbit[count]}`}
        >
          <circle cx="180" cy="150" r="102" className="visual-outline" />
          {orbit.slice(1, count + 1).map((n, i) => {
            const [x1, y1] = position(orbit[i]);
            const [x2, y2] = position(n);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="visual-vector" />;
          })}
          {Array.from({ length: modulus }, (_, n) => {
            const [x, y] = position(n);
            return (
              <g key={n}>
                <circle
                  cx={x}
                  cy={y}
                  r="21"
                  className={visited.has(n) ? 'visual-tensor' : 'visual-outline'}
                />
                {orbit[count] === n && <circle cx={x} cy={y} r="26" className="widget-target" />}
                <text x={x} y={y + 6} textAnchor="middle">
                  {n}
                </text>
              </g>
            );
          })}
        </svg>
        <figcaption>
          The outer ring marks your position. Addition wraps around; some step sizes visit only a subgroup of
          this clock.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          ['Current position', orbit[count]],
          ['Reachable positions', `${new Set(orbit).size} of ${modulus}`]
        ]}
      />
    </>
  );
}

function VectorWidget() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const result: Vec2 = [a + b, b];
  return (
    <>
      <p className="widget-prompt">Combine u = (1, 0) and v = (1, 1) to reach the orange target (1, 2).</p>
      <WidgetRange label="Coefficient a" min={-2} max={2} step={0.5} value={a} onChange={setA} />
      <WidgetRange label="Coefficient b" min={-2} max={2} step={0.5} value={b} onChange={setB} />
      <figure>
        <VectorPlane label={`Vector a u + b v = (${result.join(', ')}); target (1, 2)`}>
          <PlaneArrow to={[a, 0]} secondary />
          <PlaneArrow from={[a, 0]} to={result} secondary />
          <PlaneArrow to={result} />
          <circle cx="212" cy="96" r="9" className="widget-target" />
        </VectorPlane>
        <figcaption>
          Over the real numbers, coefficients scale and reverse vectors. Follow the amber contributions tip to
          tail; the green arrow is their sum.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          ['a u + b v', `(${result.join(', ')})`],
          ['Target', result[0] === 1 && result[1] === 2 ? 'Reached' : '(1, 2)']
        ]}
      />
    </>
  );
}

function MatrixWidget() {
  const [map, setMap] = useState('shear');
  const [x, setX] = useState(1);
  const [y, setY] = useState(1);
  const { matrix, formula } = PLANE_MAPS[map];
  const transformed = transformVector(matrix, [x, y]);
  const square: Vec2[] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1]
  ];
  const determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  return (
    <>
      <p className="widget-prompt">
        Transform a vector and the unit square. Try projection: which inputs collapse to zero?
      </p>
      <label className="lesson-widget-control">
        Transformation
        <select aria-label="Transformation" value={map} onChange={(event) => setMap(event.target.value)}>
          {Object.entries(PLANE_MAPS).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </label>
      <WidgetRange label="Input x" min={-2} max={2} step={0.5} value={x} onChange={setX} />
      <WidgetRange label="Input y" min={-2} max={2} step={0.5} value={y} onChange={setY} />
      <p className="lesson-widget-formula">{formula}</p>
      <figure>
        <VectorPlane label={`Real linear map: (${x}, ${y}) becomes (${transformed.join(', ')})`}>
          <polygon points={planePolygon(square)} className="widget-original-area" />
          <polygon
            points={planePolygon(square.map((v) => transformVector(matrix, v)))}
            className="widget-mapped-area"
          />
          <PlaneArrow to={[x, y]} secondary />
          <PlaneArrow to={transformed} />
        </VectorPlane>
        <figcaption>
          Amber shows the input, green the output. The shaded square transforms with the same real matrix; a
          projection flattens it to a line.
        </figcaption>
      </figure>
      <WidgetValues
        values={[
          ['Output vector', `(${transformed.join(', ')})`],
          ['Area scale |det T|', Math.abs(determinant)],
          ['Kernel dimension', determinant === 0 ? 1 : 0]
        ]}
      />
    </>
  );
}

export const FOUNDATION_WIDGETS = {
  maps: {
    title: 'Maps and inverses',
    Component: MapWidget,
    check: {
      question: 'Can three inputs cover a four-point codomain?',
      options: [
        {
          label: 'Yes, with different arrows',
          feedback: 'Each input has just one output. Three arrows can reach at most three points.'
        },
        {
          label: 'No',
          correct: true,
          feedback: 'At least one target stays unused, so the function cannot be surjective.'
        }
      ]
    }
  },
  clock: {
    title: 'Modular clock',
    Component: ClockWidget,
    check: {
      question: 'Which step visits every position modulo 6?',
      options: [
        { label: 'Add 2', feedback: 'Starting at zero, adding 2 visits only 0, 2, and 4.' },
        { label: 'Add 3', feedback: 'Adding 3 alternates between 0 and 3.' },
        {
          label: 'Add 5',
          correct: true,
          feedback: '5 and 6 are coprime, so repeated addition visits all six positions.'
        }
      ]
    }
  },
  vectors: {
    title: 'Build a vector',
    Component: VectorWidget,
    check: {
      question: 'Which coefficients reach (1, 2)?',
      options: [
        {
          label: 'a = 1, b = 2',
          feedback: 'This gives (3, 2). The second vector contributes to both coordinates.'
        },
        {
          label: 'a = −1, b = 2',
          correct: true,
          feedback: '−(1, 0) + 2(1, 1) = (1, 2). A negative coefficient reverses u.'
        },
        { label: 'a = 2, b = −1', feedback: 'This gives (1, −1). Look at the vertical contribution of b.' }
      ]
    }
  },
  matrix: {
    title: 'Transform the plane',
    Component: MatrixWidget,
    check: {
      question: 'Which vectors does projection onto x send to zero?',
      options: [
        { label: 'Only (0, 0)', feedback: 'Try (0, 1). Projection discards its y coordinate too.' },
        {
          label: 'Every (0, y)',
          correct: true,
          feedback: 'The whole y-axis is the kernel: T(0, y) = (0, 0).'
        },
        {
          label: 'Every (x, 0)',
          feedback: 'Vectors on the x-axis remain unchanged, so most do not become zero.'
        }
      ]
    }
  }
} satisfies Record<string, WidgetSpec>;

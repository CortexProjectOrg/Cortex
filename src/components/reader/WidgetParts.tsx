import { useState, type ComponentType, type ReactNode } from 'react';
import type { Vec2 } from '../../lib/lessonWidgets';

export interface WidgetCheck {
  question: string;
  options: { label: string; correct?: boolean; feedback: string }[];
}
export interface WidgetSpec {
  title: string;
  Component: ComponentType;
  check: WidgetCheck;
}

export function QuickCheck({ question, options }: WidgetCheck) {
  const [answer, setAnswer] = useState<number | null>(null);
  const selected = answer === null ? undefined : options[answer];
  return (
    <fieldset className="widget-check">
      <legend>{question}</legend>
      <div className="widget-options">
        {options.map((option, index) => (
          <button
            type="button"
            key={option.label}
            className="widget-answer"
            aria-pressed={answer === index}
            onClick={() => setAnswer(index)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="widget-feedback" role="status">
        {selected && (
          <>
            <strong>{selected.correct ? 'Yes.' : 'Try again.'}</strong> {selected.feedback}
          </>
        )}
      </p>
    </fieldset>
  );
}

export function WidgetRange({
  label,
  value,
  min,
  max,
  step = 1,
  formatValue = String,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="lesson-widget-control widget-range">
      <span>{label}</span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output>{formatValue(value)}</output>
    </label>
  );
}

export function WidgetValues({ values }: { values: [string, ReactNode][] }) {
  return (
    <dl className="lesson-widget-values" aria-live="polite">
      {values.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const point = ([x, y]: Vec2) => [180 + x * 32, 160 - y * 32];
export function PlaneArrow({
  from = [0, 0],
  to,
  secondary = false
}: {
  from?: Vec2;
  to: Vec2;
  secondary?: boolean;
}) {
  const [x1, y1] = point(from);
  const [x2, y2] = point(to);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = [
    x2,
    y2,
    x2 - 10 * Math.cos(angle - 0.4),
    y2 - 10 * Math.sin(angle - 0.4),
    x2 - 10 * Math.cos(angle + 0.4),
    y2 - 10 * Math.sin(angle + 0.4)
  ].join(' ');
  return (
    <g className={secondary ? 'widget-arrow-secondary' : 'widget-arrow'}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {Math.hypot(x2 - x1, y2 - y1) > 1 && <polygon points={head} />}
    </g>
  );
}

export function VectorPlane({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 360 320" role="img" aria-label={label}>
      {[-4, -3, -2, -1, 1, 2, 3, 4].map((n) => (
        <g key={n} className="widget-grid">
          <line x1={180 + n * 32} y1="32" x2={180 + n * 32} y2="288" />
          <line x1="52" y1={160 + n * 32} x2="308" y2={160 + n * 32} />
        </g>
      ))}
      <path d="M 42 160 H 320 M 180 300 V 20" className="visual-axis" />
      <text x="326" y="166">
        x
      </text>
      <text x="189" y="25">
        y
      </text>
      <text x="168" y="179">
        0
      </text>
      <text x="207" y="179">
        1
      </text>
      <text x="164" y="133">
        1
      </text>
      {children}
    </svg>
  );
}

export function planePolygon(points: Vec2[]) {
  return points.map((p) => point(p).join(',')).join(' ');
}

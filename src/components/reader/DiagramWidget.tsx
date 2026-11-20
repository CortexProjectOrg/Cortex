import { useState } from 'react';
import { WidgetSelect } from './WidgetParts';

export type DiagramRow = readonly [label: string, ...cells: string[]];
export type DiagramView = {
  label: string;
  caption: string;
  rows: readonly DiagramRow[];
};
export type DiagramSpec = { title: string; views: readonly [DiagramView, ...DiagramView[]] };

export const view = (label: string, caption: string, ...rows: DiagramRow[]): DiagramView => ({
  label,
  caption,
  rows
});
export const diagram = (title: string, first: DiagramView, ...views: DiagramView[]): DiagramSpec => ({
  title,
  views: [first, ...views]
});

export function DiagramWidget({ spec }: { spec: DiagramSpec }) {
  const [index, setIndex] = useState(0);
  const example = spec.views[index];
  return (
    <details className="lesson-widget" data-reading-only>
      <summary>
        {spec.views.length > 1 ? 'Explore' : 'Diagram'}: {spec.title}
      </summary>
      <div className="lesson-widget-body">
        {spec.views.length > 1 && (
          <WidgetSelect
            label="Example"
            options={spec.views.map(({ label }, i) => [i, label])}
            value={index}
            onChange={setIndex}
          />
        )}
        <figure className="widget-diagram" aria-label={example.label} aria-live="polite" aria-atomic="true">
          <dl>
            {example.rows.map(([label, ...cells], row) => {
              const flow = cells.includes('→');
              const compact = flow && cells.length <= 7 && cells.every((cell) => cell.length <= 3);
              const layout = flow
                ? compact
                  ? 'widget-flow widget-flow-compact'
                  : 'widget-flow'
                : 'widget-tiles';
              return (
                <div key={row}>
                  <dt>{label}</dt>
                  <dd>
                    <ul className={layout}>
                      {cells.map((cell, i) => (
                        <li key={i} className={cell === '→' ? 'widget-flow-arrow' : 'widget-tile'}>
                          {cell}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              );
            })}
          </dl>
          <figcaption>{example.caption}</figcaption>
        </figure>
        {spec.views.length > 1 && (
          <button className="button secondary widget-reset" type="button" onClick={() => setIndex(0)}>
            Reset example
          </button>
        )}
      </div>
    </details>
  );
}

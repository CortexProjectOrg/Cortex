import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { computeTopDownDagLayout } from '../lib/dagLayoutEngine';
import { projectCatalogStudyGraph, type KnowledgeDAG } from '../lib/knowledgeGraph';
import { visibleBranch, type Expansions } from '../lib/visibleBranch';
import { CompactNode } from './graph/CompactNode';
type Camera = { x: number; y: number; zoom: number };
export type CanvasSnapshot = { open: Expansions; camera: Camera | null };
export function InteractiveDagCanvas({
  dag,
  root,
  onInfo,
  historyEntry
}: {
  dag: KnowledgeDAG;
  root: string;
  onInfo: (id: string, opener: HTMLButtonElement) => void;
  historyEntry: CanvasSnapshot;
}) {
  const graph = projectCatalogStudyGraph(dag);
  const [open, setOpen] = useState(historyEntry.open),
    [camera, setCamera] = useState<Camera>(historyEntry.camera ?? { x: 0, y: 0, zoom: 1 });
  const svg = useRef<SVGSVGElement>(null),
    drag = useRef<{ x: number; y: number; start: Camera } | null>(null);
  const initial = useRef(historyEntry.camera === null);
  const { seen, limited } = useMemo(() => visibleBranch(graph, root, open), [graph, root, open]);
  const { layoutMap, bounds } = useMemo(
    () =>
      computeTopDownDagLayout(
        [...seen].map((id) => dag.nodes.get(id)!),
        dag,
        { nodeWidth: 240, nodeHeight: 118, levelHeight: 176, minNodeGap: 30 }
      ),
    [seen, dag]
  );
  useLayoutEffect(() => {
    if (initial.current && svg.current) {
      const box = svg.current.getBoundingClientRect(),
        node = layoutMap.get(root)!;
      if (box.width) {
        setCamera({
          x: box.width / 2 - node.x - node.width / 2,
          y: box.height / 2 - node.y - node.height / 2,
          zoom: 1
        });
        initial.current = false;
      }
    }
  }, [root, layoutMap]);
  useEffect(() => {
    historyEntry.open = open;
    historyEntry.camera = camera;
  }, [open, camera, historyEntry]);
  function zoomAt(factor: number, x: number, y: number) {
    setCamera((c) => {
      const zoom = Math.min(2.5, Math.max(0.1, c.zoom * factor));
      return { zoom, x: x - ((x - c.x) * zoom) / c.zoom, y: y - ((y - c.y) * zoom) / c.zoom };
    });
  }
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const box = el.getBoundingClientRect();
      zoomAt(e.deltaY > 0 ? 0.9 : 1.1, e.clientX - box.left, e.clientY - box.top);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);
  function fit() {
    const box = svg.current!.getBoundingClientRect();
    const zoom = Math.min(1.2, (box.width - 32) / bounds.width, (box.height - 32) / bounds.height);
    if (zoom > 0)
      setCamera({
        zoom,
        x: box.width / 2 - (bounds.minX + bounds.width / 2) * zoom,
        y: box.height / 2 - (bounds.minY + bounds.height / 2) * zoom
      });
  }
  return (
    <>
      <div className="study-actions canvas-actions">
        {[
          { title: 'Zoom in', Icon: ZoomIn, factor: 1.2 },
          { title: 'Zoom out', Icon: ZoomOut, factor: 1 / 1.2 }
        ].map(({ title, Icon, factor }) => (
          <button
            key={title}
            className="icon-button"
            aria-label={title}
            title={title}
            onClick={() => {
              const b = svg.current!.getBoundingClientRect();
              zoomAt(factor, b.width / 2, b.height / 2);
            }}
          >
            <Icon size={17} />
          </button>
        ))}
        <button
          className="icon-button"
          aria-label="Fit visible graph"
          title="Fit visible graph"
          onClick={fit}
        >
          <Maximize2 size={17} />
        </button>
        <Link className="text-link" to={'/connections/lecture/' + root}>
          View all connections
        </Link>
      </div>
      {limited && (
        <p role="status">Showing {seen.size} nodes. Open a node’s info to see all its connections.</p>
      )}
      <svg
        className="study-canvas"
        ref={svg}
        role="group"
        aria-label="Lecture connections"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.target !== svg.current) return;
          const offsets: Record<string, [number, number]> = {
            ArrowUp: [0, 45],
            ArrowDown: [0, -45],
            ArrowRight: [-45, 0],
            ArrowLeft: [45, 0]
          };
          const d = offsets[e.key];
          if (d) {
            e.preventDefault();
            setCamera((c) => ({ ...c, x: c.x + d[0], y: c.y + d[1] }));
          }
        }}
        onPointerDown={(e) => {
          if (e.button !== 0 || (e.target as Element).closest('button')) return;
          drag.current = { x: e.clientX, y: e.clientY, start: camera };
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) setCamera({ ...d.start, x: d.start.x + e.clientX - d.x, y: d.start.y + e.clientY - d.y });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <defs>
          <marker
            id="study-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10" fill="var(--accent)" />
          </marker>
        </defs>
        <g transform={'translate(' + camera.x + ' ' + camera.y + ') scale(' + camera.zoom + ')'}>
          {[...layoutMap.values()].flatMap((to) =>
            (graph.incoming.get(to.node.id) ?? []).map((id) => {
              const from = layoutMap.get(id);
              if (!from) return null;
              const mid = (from.outY + to.inY) / 2;
              return (
                <path
                  key={id + ':' + to.node.id}
                  d={`M ${from.outX} ${from.outY} C ${from.outX} ${mid}, ${to.inX} ${mid}, ${to.inX} ${to.inY}`}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="none"
                  markerEnd="url(#study-arrow)"
                />
              );
            })
          )}
          {[...layoutMap.values()].map(({ node, x, y, width, height }) => (
            <foreignObject key={node.id} {...{ x, y, width, height }}>
              <CompactNode
                title={node.title}
                selected={node.id === root}
                incoming={graph.incoming.get(node.id)?.length ?? 0}
                outgoing={graph.outgoing.get(node.id)?.length ?? 0}
                isOpen={(d) => open[node.id]?.[d] ?? node.id === root}
                toggle={(d) =>
                  setOpen((old) => ({
                    ...old,
                    [node.id]: { ...old[node.id], [d]: !(old[node.id]?.[d] ?? node.id === root) }
                  }))
                }
                info={(opener) => onInfo(node.id, opener)}
              />
            </foreignObject>
          ))}
        </g>
      </svg>
    </>
  );
}

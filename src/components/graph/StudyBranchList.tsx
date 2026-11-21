import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { StudyDirection, StudyGraph, StudyNode } from '../../lib/studyGraph';

const PAGE_SIZE = 20;

interface Occurrence {
  node: StudyNode;
  key: string;
  depth: number;
  children: Occurrence[];
  reference?: string;
}

interface Props {
  graph: StudyGraph;
  root: string;
  direction: StudyDirection;
  depth: number;
  selected: string | null;
  completed?: ReadonlySet<string>;
  showCompleted?: boolean;
  selectedLabel?: string;
  renderNode: (node: StudyNode) => ReactNode;
}

export function StudyBranchList({
  graph,
  root,
  direction,
  depth,
  selected,
  completed,
  showCompleted = true,
  selectedLabel = 'Selected lesson',
  renderNode
}: Props) {
  const namespace = useId();
  const focusTarget = useRef<string | null>(null);
  const [expanded, setExpanded] = useState(new Map<string, boolean>());
  const [pages, setPages] = useState(new Map<string, number>());
  const adjacency = direction === 'prerequisites' ? graph.incoming : graph.outgoing;
  const rootNode = graph.nodes.get(root);
  const compact = (id: string) => !showCompleted && id !== root && id !== selected && completed?.has(id);
  const isOpen = (entry: Occurrence) =>
    expanded.get(entry.node.id) ?? (!compact(entry.node.id) && entry.depth < depth);
  const makeKey = (parent: string, id: string) => `${parent}/${encodeURIComponent(id)}`;
  const domId = (key: string) => `${namespace}${key}`;
  const top: Occurrence | null = rootNode
    ? { node: rootNode, key: makeKey('', root), depth: 0, children: [] }
    : null;
  const visible = new Map<string, string>();

  // Breadth-first discovery gives the shallowest visible occurrence its disclosure.
  if (top) {
    const queue = [top];
    visible.set(root, top.key);
    for (let index = 0; index < queue.length; index++) {
      const item = queue[index];
      if (!isOpen(item)) continue;
      const neighbors = adjacency.get(item.node.id) ?? [];
      for (const id of neighbors.slice(0, (pages.get(item.node.id) ?? 1) * PAGE_SIZE)) {
        const child = {
          node: graph.nodes.get(id)!,
          key: makeKey(item.key, id),
          depth: item.depth + 1,
          children: [],
          reference: visible.get(id)
        };
        item.children.push(child);
        if (child.reference) continue;
        visible.set(id, child.key);
        queue.push(child);
      }
    }
  }

  useLayoutEffect(() => {
    if (!focusTarget.current) return;
    document.getElementById(focusTarget.current)?.focus();
    focusTarget.current = null;
  }, [pages]);

  const renderBranch = (entry: Occurrence): ReactNode => {
    const { node, key, reference, children } = entry;
    if (reference) {
      return (
        <li key={key}>
          <button
            type="button"
            id={domId(key)}
            className="text-button study-reference"
            onClick={() => document.getElementById(domId(reference))?.focus()}
          >
            {node.title} <span>· Shared</span>
          </button>
        </li>
      );
    }
    const neighbors = adjacency.get(node.id) ?? [];
    const open = isOpen(entry);
    const remaining = neighbors.length - children.length;
    return (
      <li key={key} className="study-branch">
        {compact(node.id) ? (
          <div id={domId(key)} tabIndex={-1} className="study-compact">
            {node.title} <span>· Done</span>
          </div>
        ) : (
          <div id={domId(key)} tabIndex={-1}>
            {renderNode(node)}
          </div>
        )}
        {neighbors.length > 0 && (
          <button
            className="text-button study-disclosure"
            type="button"
            aria-expanded={open}
            aria-label={`${open ? 'Hide' : 'Show'} ${direction} for ${node.title}`}
            onClick={(event) => {
              event.currentTarget.focus();
              setExpanded((current) => new Map(current).set(node.id, !open));
            }}
          >
            {open ? 'Hide' : 'Show'} {direction} ({neighbors.length})
          </button>
        )}
        {open && children.length > 0 && <ul>{children.map(renderBranch)}</ul>}
        {open && remaining > 0 && (
          <button
            className="button small secondary"
            type="button"
            aria-label={`Show more for ${node.title}`}
            onClick={() => {
              focusTarget.current = domId(makeKey(key, neighbors[children.length]));
              setPages((current) => new Map(current).set(node.id, (current.get(node.id) ?? 1) + 1));
            }}
          >
            Show more ({remaining})
          </button>
        )}
      </li>
    );
  };

  const pinned = selected && !visible.has(selected) ? graph.nodes.get(selected) : undefined;
  return (
    <div className="study-branches">
      {pinned && (
        <div className="study-pinned">
          <p>{selectedLabel}</p>
          {renderNode(pinned)}
        </div>
      )}
      {top && <ul>{renderBranch(top)}</ul>}
    </div>
  );
}

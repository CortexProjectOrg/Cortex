import {
  CornerDownRight,
  GitBranch,
  GitFork,
  Maximize2,
  Minimize2,
  Network,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TOPICS } from '../lib/curriculumCatalog';
import {
  collapseNodePrerequisites,
  collapseNodeUnlocks,
  computeTopDownDagLayout,
  expandFullTreeFromNode,
  expandNodePrerequisites,
  expandNodeUnlocks,
  getOneHopNeighborhood
} from '../lib/dagLayoutEngine';
import { computeNodeReadiness, type KnowledgeDAG } from '../lib/knowledgeGraph';
import { NodeCard, type StudyCardActions } from './graph/NodeCard';

interface Point {
  x: number;
  y: number;
}

interface InteractiveDagCanvasProps {
  dag: KnowledgeDAG;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onShowDetails: (id: string, opener: HTMLButtonElement) => void;
  studyActions?: StudyCardActions;
  completedSet: Set<string>;
  filteredNodeIds: Set<string>;
  onSelectTopic?: (topicId: string) => void;
}

export const TOPIC_PALETTE = TOPICS.map((topic, index) => ({
  id: topic.id,
  number: topic.number,
  name: topic.title,
  shortName: topic.title,
  color: [
    '#4a6741',
    '#0284c7',
    '#4f46e5',
    '#7c3aed',
    '#059669',
    '#0891b2',
    '#d97706',
    '#dc2626',
    '#db2777',
    '#0d9488'
  ][index % 10]
}));

const TOPIC_COLORS: Record<number, string> = Object.fromEntries(
  TOPIC_PALETTE.map((t) => [t.number, t.color])
);

export function InteractiveDagCanvas({
  dag,
  selectedNodeId,
  onSelectNode,
  onShowDetails,
  studyActions,
  completedSet,
  filteredNodeIds,
  onSelectTopic
}: InteractiveDagCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Toggle to optionally show derived (indirect / transitive) dependencies
  const [showDerived, setShowDerived] = useState(false);

  // Progressive visible node set: holds all nodes expanded so far
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(() => {
    const initialId =
      selectedNodeId && filteredNodeIds.has(selectedNodeId)
        ? selectedNodeId
        : dag.nodeList.find((n) => filteredNodeIds.has(n.id))?.id || '';
    return initialId ? getOneHopNeighborhood(initialId, dag, false) : new Set();
  });

  // When selectedNodeId changes, ensure it and its direct connections are added to the expanded visible set
  useEffect(() => {
    if (selectedNodeId && dag.nodes.has(selectedNodeId)) {
      setVisibleNodeIds((prev) => {
        const next = new Set(prev);
        next.add(selectedNodeId);
        const node = dag.nodes.get(selectedNodeId);
        node?.prerequisites.forEach((p) => next.add(p));
        node?.unlockedLectures.forEach((u) => next.add(u));
        if (showDerived) {
          node?.derivedPrerequisites.forEach((p) => next.add(p));
          node?.derivedUnlocked.forEach((u) => next.add(u));
        }
        return next;
      });
    }
  }, [selectedNodeId, dag, showDerived]);

  // Filter visible nodes according to active search / topic filter
  const effectiveVisibleNodeIds = useMemo(() => {
    if (filteredNodeIds.size === dag.nodeList.length) {
      return visibleNodeIds;
    }
    const filtered = new Set<string>();
    visibleNodeIds.forEach((id) => {
      if (filteredNodeIds.has(id)) {
        filtered.add(id);
      }
    });
    return filtered.size > 0 ? filtered : new Set(filteredNodeIds);
  }, [visibleNodeIds, filteredNodeIds, dag.nodeList.length]);

  const visibleNodes = useMemo(() => {
    return dag.nodeList.filter((n) => effectiveVisibleNodeIds.has(n.id));
  }, [dag, effectiveVisibleNodeIds]);
  const focalId =
    selectedNodeId && effectiveVisibleNodeIds.has(selectedNodeId)
      ? selectedNodeId
      : (visibleNodes[0]?.id ?? '');
  const focalNode = dag.nodes.get(focalId);

  // Expansion and exploration handlers
  const handleTogglePrerequisites = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = dag.nodes.get(nodeId);
    if (!node) return;

    const hidden = node.prerequisites.filter((pId) => !effectiveVisibleNodeIds.has(pId));
    if (hidden.length > 0) {
      setVisibleNodeIds((prev) => expandNodePrerequisites(prev, nodeId, dag));
    } else {
      const protectedSet = new Set<string>([focalId].filter(Boolean));
      setVisibleNodeIds((prev) => collapseNodePrerequisites(prev, nodeId, dag, protectedSet));
    }
  };

  const handleToggleUnlocks = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = dag.nodes.get(nodeId);
    if (!node) return;

    const hidden = node.unlockedLectures.filter((uId) => !effectiveVisibleNodeIds.has(uId));
    if (hidden.length > 0) {
      setVisibleNodeIds((prev) => expandNodeUnlocks(prev, nodeId, dag));
    } else {
      const protectedSet = new Set<string>([focalId].filter(Boolean));
      setVisibleNodeIds((prev) => collapseNodeUnlocks(prev, nodeId, dag, protectedSet));
    }
  };

  const handleExpandFromNode = (nodeId: string) => {
    onSelectNode(nodeId);
    const node = dag.nodes.get(nodeId);
    if (!node) return;

    const hiddenPrereqs = node.prerequisites.filter((pId) => !effectiveVisibleNodeIds.has(pId));
    const hiddenUnlocks = node.unlockedLectures.filter((uId) => !effectiveVisibleNodeIds.has(uId));

    if (hiddenPrereqs.length > 0 || hiddenUnlocks.length > 0) {
      setVisibleNodeIds((prev) => {
        let next = expandNodePrerequisites(prev, nodeId, dag);
        next = expandNodeUnlocks(next, nodeId, dag);
        return next;
      });
    } else {
      const protectedSet = new Set<string>([focalId].filter(Boolean));
      setVisibleNodeIds((prev) => collapseNodeUnlocks(prev, nodeId, dag, protectedSet));
    }
  };

  const handleExplore = (id: string) => {
    onSelectNode(id);
    setVisibleNodeIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      const target = dag.nodes.get(id);
      target?.prerequisites.forEach((p) => next.add(p));
      target?.unlockedLectures.forEach((u) => next.add(u));
      return next;
    });
  };

  const isAllExpanded =
    visibleNodes.length >= (filteredNodeIds.size > 0 ? filteredNodeIds.size : dag.nodeList.length);

  const handleToggleExpandAll = () => {
    if (isAllExpanded) {
      setVisibleNodeIds(getOneHopNeighborhood(focalId, dag, showDerived));
    } else {
      setVisibleNodeIds(new Set(dag.nodeList.map((n) => n.id)));
    }
  };

  const handleExpandTree = () => {
    const treeSet = expandFullTreeFromNode(focalId, dag);
    setVisibleNodeIds((prev) => new Set([...prev, ...treeSet]));
  };

  const handleResetOneHop = () => {
    setVisibleNodeIds(getOneHopNeighborhood(focalId, dag, showDerived));
  };

  // Pan & Zoom camera state
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState<Point>({ x: 300, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const panStartRef = useRef<Point>({ x: 0, y: 0 });

  // Hover state for tooltip / edge glow
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute clean top-down Sugiyama barycentric layout for the 1-hop cluster
  const { layoutMap, bounds } = useMemo(() => {
    return computeTopDownDagLayout(visibleNodes, dag, {
      nodeWidth: 300,
      nodeHeight: studyActions ? 224 : 190,
      levelHeight: studyActions ? 304 : 270,
      minNodeGap: 60,
      extraBranchGap: 40,
      topPadding: 50
    });
  }, [visibleNodes, dag, studyActions]);

  // Fit camera to center the 1-hop neighborhood
  const fitToCurrentBounds = useCallback(() => {
    if (!containerRef.current || bounds.width === 0 || bounds.height === 0) return;

    const container = containerRef.current.getBoundingClientRect();
    if (!container.width || !container.height) return;
    const padX = 24;
    const padY = 24;

    const scaleX = (container.width - padX * 2) / Math.max(1, bounds.width);
    const scaleY = (container.height - padY * 2) / Math.max(1, bounds.height);
    const newZoom = Math.min(1.2, scaleX, scaleY);

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    const newPanX = container.width / 2 - centerX * newZoom;
    const newPanY = container.height / 2 - centerY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [bounds]);

  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setViewport((current) =>
        current.width === width && current.height === height ? current : { width, height }
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const focalLayout = layoutMap.get(focalId);
  const anchorX = focalLayout && focalLayout.x + focalLayout.width / 2;
  const anchorY = focalLayout && focalLayout.y + focalLayout.height / 2;
  const previousAnchor = useRef<{ id: string; x: number; y: number; width: number; height: number } | null>(
    null
  );
  useLayoutEffect(() => {
    if (anchorX === undefined || anchorY === undefined || !viewport.width || !viewport.height) return;
    const previous = previousAnchor.current;
    if (
      !previous ||
      previous.id !== focalId ||
      previous.width !== viewport.width ||
      previous.height !== viewport.height
    ) {
      const scale = Math.min(1, (viewport.width - 24) / 300);
      setZoom(scale);
      setPan({ x: viewport.width / 2 - anchorX * scale, y: viewport.height / 2 - anchorY * scale });
    } else if (anchorX !== previous.x || anchorY !== previous.y) {
      // Expansion can reposition the focal card in the layout. Keep its screen position.
      setPan((position) => ({
        x: position.x + (previous.x - anchorX) * zoom,
        y: position.y + (previous.y - anchorY) * zoom
      }));
    }
    previousAnchor.current = { id: focalId, x: anchorX, y: anchorY, ...viewport };
  }, [anchorX, anchorY, focalId, viewport, zoom]);

  const zoomAt = useCallback(
    (newZoom: number, x: number, y: number) => {
      setPan((position) => ({
        x: x - (x - position.x) * (newZoom / zoom),
        y: y - (y - position.y) * (newZoom / zoom)
      }));
      setZoom(newZoom);
    },
    [zoom]
  );

  // Pan interaction handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest('button, a, [role="button"]')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      if (e.currentTarget.hasPointerCapture?.(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const newZoom = Math.max(0.15, Math.min(2.2, zoom * (event.deltaY > 0 ? 0.9 : 1.1)));
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      zoomAt(newZoom, x, y);
    };
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [zoom, zoomAt]);

  // Pre-calculate Directed Edges for 1-Hop cluster
  const { directEdges, derivedEdges } = useMemo(() => {
    const dList: Array<{
      id: string;
      fromId: string;
      toId: string;
      d: string;
      isHighlighted: boolean;
      isDimmed: boolean;
    }> = [];

    const derList: Array<{
      id: string;
      fromId: string;
      toId: string;
      d: string;
      isHighlighted: boolean;
      isDimmed: boolean;
    }> = [];

    // 1. Direct dependencies: node.prerequisites -> node.id
    visibleNodes.forEach((toNode) => {
      toNode.prerequisites.forEach((fromId) => {
        const fromLayout = layoutMap.get(fromId);
        const toLayout = layoutMap.get(toNode.id);
        if (!fromLayout || !toLayout) return;

        const x1 = fromLayout.outX;
        const y1 = fromLayout.outY;
        const x2 = toLayout.inX;
        const y2 = toLayout.inY;
        const dy = Math.max(25, (y2 - y1) * 0.5);

        const d = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

        const isHighlighted =
          hoveredNodeId === fromId ||
          hoveredNodeId === toNode.id ||
          focalId === fromId ||
          focalId === toNode.id;

        const isDimmed = Boolean(hoveredNodeId) && !isHighlighted;

        dList.push({
          id: `${fromId}->${toNode.id}`,
          fromId,
          toId: toNode.id,
          d,
          isHighlighted,
          isDimmed
        });
      });
    });

    // 2. Derived dependencies (if enabled)
    if (showDerived) {
      visibleNodes.forEach((toNode) => {
        (toNode.derivedPrerequisites || []).forEach((fromId) => {
          const fromLayout = layoutMap.get(fromId);
          const toLayout = layoutMap.get(toNode.id);
          if (!fromLayout || !toLayout) return;

          // Side-curved dashed arc for derived
          const fromRight = fromLayout.x <= toLayout.x;
          const x1 = fromRight ? fromLayout.x + fromLayout.width : fromLayout.x;
          const y1 = fromLayout.y + fromLayout.height / 2;
          const x2 = fromRight ? toLayout.x : toLayout.x + toLayout.width;
          const y2 = toLayout.y + toLayout.height / 2;

          const midX = (x1 + x2) / 2 + (fromRight ? 40 : -40);
          const midY = (y1 + y2) / 2;
          const d = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

          const isHighlighted =
            hoveredNodeId === fromId ||
            hoveredNodeId === toNode.id ||
            focalId === fromId ||
            focalId === toNode.id;

          const isDimmed = Boolean(hoveredNodeId) && !isHighlighted;

          derList.push({
            id: `derived:${fromId}->${toNode.id}`,
            fromId,
            toId: toNode.id,
            d,
            isHighlighted,
            isDimmed
          });
        });
      });
    }

    return { directEdges: dList, derivedEdges: derList };
  }, [visibleNodes, layoutMap, focalId, hoveredNodeId, showDerived]);

  const focalTopicColor = focalNode
    ? TOPIC_COLORS[focalNode.topicNumber] || 'var(--accent)'
    : 'var(--accent)';

  return (
    <div className="dag-canvas">
      <div className="dag-canvas-toolbar">
        <strong className="dag-canvas-focus" style={{ borderColor: focalTopicColor }}>
          {focalNode?.title}
        </strong>
        <div className="dag-canvas-controls">
          <button
            type="button"
            className="button small secondary"
            onClick={() => {
              const startId = dag.nodeList.find((node) => filteredNodeIds.has(node.id))?.id;
              if (startId) {
                onSelectNode(startId);
                setVisibleNodeIds((prev) => {
                  const next = new Set(prev);
                  next.add(startId);
                  const node = dag.nodes.get(startId);
                  node?.prerequisites.forEach((p) => next.add(p));
                  node?.unlockedLectures.forEach((u) => next.add(u));
                  return next;
                });
              }
            }}
          >
            <GitBranch size={14} /> Start
          </button>
          <button
            type="button"
            className="button small secondary"
            aria-pressed={isAllExpanded}
            onClick={handleToggleExpandAll}
            aria-label={isAllExpanded ? 'Collapse to 1-hop' : 'Expand all'}
          >
            <Network size={14} /> {isAllExpanded ? 'Collapse to 1-hop' : 'Expand all'}
          </button>
          <button
            type="button"
            className="button small secondary"
            onClick={handleExpandTree}
            aria-label="Expand tree"
            title={`Expand full dependency tree from ${focalNode?.title || 'selected node'}`}
          >
            <GitFork size={14} /> Expand tree
          </button>
          <button
            type="button"
            className="button small secondary"
            onClick={handleResetOneHop}
            aria-label="1-Hop"
            title="Reset to 1-hop neighborhood of selected node"
          >
            <Minimize2 size={14} /> 1-Hop
          </button>
          <button
            type="button"
            className="button small secondary"
            aria-pressed={showDerived}
            onClick={() => setShowDerived((value) => !value)}
          >
            <CornerDownRight size={14} /> Indirect
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Zoom in"
            onClick={() => zoomAt(Math.min(2.2, zoom * 1.2), viewport.width / 2, viewport.height / 2)}
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Zoom out"
            onClick={() => zoomAt(Math.max(0.05, zoom / 1.2), viewport.width / 2, viewport.height / 2)}
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Fit visible graph"
            title="Fit visible graph"
            onClick={fitToCurrentBounds}
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
      <div className="dag-canvas-viewport" ref={containerRef}>
        <svg
          ref={svgRef}
          role="group"
          aria-label="Lecture connections"
          style={{
            width: '100%',
            height: '100%',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            {/* Direct Dependency Downward Arrowhead Marker */}
            <marker
              id="arrow-direct-down"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3b82f6" />
            </marker>

            {/* Highlighted Arrowhead Marker */}
            <marker
              id="arrow-highlight-down"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
            </marker>

            {/* Derived Dependency Arrowhead Marker */}
            <marker
              id="arrow-derived-down"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d97706" />
            </marker>

            {/* Focal Node Glow Shadow */}
            <filter id="glow-focal" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#3a5d49" floodOpacity="0.28" />
            </filter>
          </defs>

          {/* Graph Transform Container */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Direct Dependency Bezier Curves */}
            <g className="dag-direct-edges">
              {directEdges.map((edge) => {
                const markerUrl = edge.isHighlighted
                  ? 'url(#arrow-highlight-down)'
                  : 'url(#arrow-direct-down)';

                const strokeColor = edge.isHighlighted ? '#10b981' : '#93c5fd';
                const strokeWidth = edge.isHighlighted ? 2.8 : 1.8;
                const opacity = edge.isDimmed ? 0.15 : 0.9;

                return (
                  <path
                    key={edge.id}
                    d={edge.d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    markerEnd={markerUrl}
                    opacity={opacity}
                    style={{ transition: 'stroke 0.2s, opacity 0.2s, stroke-width 0.2s' }}
                  />
                );
              })}
            </g>

            {/* Derived Dependency Curves (Dashed Amber) */}
            <g className="dag-derived-edges">
              {derivedEdges.map((edge) => {
                return (
                  <path
                    key={edge.id}
                    d={edge.d}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth={edge.isHighlighted ? 2.2 : 1.3}
                    strokeDasharray="4,4"
                    markerEnd="url(#arrow-derived-down)"
                    opacity={edge.isDimmed ? 0.1 : 0.75}
                    style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
                  >
                    <title>Derived Dependency: indirect connection through intermediate lectures</title>
                  </path>
                );
              })}
            </g>

            {/* Graph Nodes */}
            <g className="dag-nodes">
              {Array.from(layoutMap.values()).map((layout) => {
                const { node, x, y, width, height } = layout;
                const isFocal = node.id === focalId;

                const isDirectPrereq = focalNode?.prerequisites.includes(node.id);
                const isDerivedPrereq = focalNode?.derivedPrerequisites.includes(node.id);
                const isDirectUnlock = focalNode?.unlockedLectures.includes(node.id);
                const isDerivedUnlock = focalNode?.derivedUnlocked.includes(node.id);

                const isCompleted = completedSet.has(node.id);
                const topicColor = TOPIC_COLORS[node.topicNumber] || 'var(--accent)';

                const borderColor = isFocal
                  ? topicColor
                  : isDirectPrereq
                    ? '#10b981'
                    : isDirectUnlock
                      ? '#3b82f6'
                      : isDerivedPrereq || isDerivedUnlock
                        ? '#d97706'
                        : 'var(--line)';

                const borderWidth = isFocal ? 3 : isDirectPrereq || isDirectUnlock ? 2 : 1.2;

                const hiddenPrereqs = node.prerequisites.filter((pId) => !effectiveVisibleNodeIds.has(pId));
                const visiblePrereqs = node.prerequisites.filter((pId) => effectiveVisibleNodeIds.has(pId));
                const hasHiddenPrereqs = hiddenPrereqs.length > 0;

                const hiddenUnlocks = node.unlockedLectures.filter(
                  (uId) => !effectiveVisibleNodeIds.has(uId)
                );
                const visibleUnlocks = node.unlockedLectures.filter((uId) =>
                  effectiveVisibleNodeIds.has(uId)
                );
                const hasHiddenUnlocks = hiddenUnlocks.length > 0;

                const isCardExpanded = !hasHiddenPrereqs && !hasHiddenUnlocks;

                return (
                  <g
                    key={node.id}
                    className="dag-node-card"
                    transform={`translate(${x}, ${y})`}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                  >
                    {/* Card Background Rect */}
                    <rect
                      width={width}
                      height={height}
                      rx={10}
                      ry={10}
                      fill={isFocal || isCompleted ? 'var(--soft)' : 'var(--surface)'}
                      stroke={borderColor}
                      strokeWidth={borderWidth}
                      strokeDasharray={isDerivedPrereq || isDerivedUnlock ? '4,3' : undefined}
                      filter={isFocal ? 'url(#glow-focal)' : undefined}
                    />

                    {/* Left Topic Indicator Color Bar */}
                    <rect x={0} y={0} width={6} height={height} rx={3} fill={topicColor} />

                    <foreignObject x={7} y={2} width={width - 9} height={height - 4}>
                      <NodeCard
                        node={node}
                        readiness={computeNodeReadiness(node.id, completedSet, dag)}
                        isSelected={isFocal}
                        isExpanded={isCardExpanded}
                        variant="canvas"
                        context={
                          isFocal
                            ? 'Selected'
                            : isDirectPrereq
                              ? 'Prerequisite'
                              : isDirectUnlock
                                ? 'Next lecture'
                                : isDerivedPrereq || isDerivedUnlock
                                  ? 'Indirect'
                                  : undefined
                        }
                        onExplore={() => handleExplore(node.id)}
                        onExpand={() => handleExpandFromNode(node.id)}
                        onDetails={(opener) => onShowDetails(node.id, opener)}
                        studyActions={studyActions}
                      />
                    </foreignObject>

                    {/* Top Expand Pill (Prerequisites Entering Port) */}
                    {node.prerequisites.length > 0 ? (
                      <foreignObject x={width / 2 - 58} y={-13} width={116} height={26}>
                        <button
                          type="button"
                          className="dag-port"
                          onClick={(event) => handleTogglePrerequisites(node.id, event)}
                          aria-label={`${hasHiddenPrereqs ? 'Expand' : 'Hide'} prerequisites for ${node.title}`}
                        >
                          {hasHiddenPrereqs
                            ? `+ ${hiddenPrereqs.length} prereqs`
                            : `Hide ${visiblePrereqs.length} prereqs`}
                        </button>
                      </foreignObject>
                    ) : (
                      <circle cx={width / 2} cy={0} r={3.5} fill="#4a6741" stroke="#fff" strokeWidth={1} />
                    )}

                    {/* Bottom Expand Pill (Unlocks Outgoing Port) */}
                    {node.unlockedLectures.length > 0 ? (
                      <foreignObject x={width / 2 - 58} y={height - 13} width={116} height={26}>
                        <button
                          type="button"
                          className="dag-port"
                          onClick={(event) => handleToggleUnlocks(node.id, event)}
                          aria-label={`${hasHiddenUnlocks ? 'Expand' : 'Hide'} unlocks for ${node.title}`}
                        >
                          {hasHiddenUnlocks
                            ? `+ ${hiddenUnlocks.length} next`
                            : `Hide ${visibleUnlocks.length} next`}
                        </button>
                      </foreignObject>
                    ) : (
                      <circle
                        cx={width / 2}
                        cy={height}
                        r={3.5}
                        fill="var(--line)"
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>
      <div className="dag-canvas-topics" aria-label="Filter by topic">
        {TOPIC_PALETTE.map((topic) => (
          <button
            type="button"
            key={topic.id}
            onClick={() => onSelectTopic?.(topic.id)}
            aria-label={`Filter by ${topic.name}`}
          >
            <span style={{ background: topic.color }} /> {topic.shortName}
          </button>
        ))}
      </div>
    </div>
  );
}

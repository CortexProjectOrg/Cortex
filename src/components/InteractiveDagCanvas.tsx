import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Share2,
  Layers,
  ChevronRight,
  Network
} from 'lucide-react';
import {
  type GraphNode,
  type KnowledgeDAG,
  type NodeReadiness,
  computeNodeReadiness
} from '../lib/knowledgeGraph';
import { TOPICS } from '../lib/curriculum';

interface Point {
  x: number;
  y: number;
}

interface NodeLayout {
  node: GraphNode;
  x: number;
  y: number;
  width: number;
  height: number;
  inX: number;
  inY: number;
  outX: number;
  outY: number;
}

interface InteractiveDagCanvasProps {
  dag: KnowledgeDAG;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  completedSet: Set<string>;
  focusedTopicId?: string;
  onSelectTopic?: (topicId: string) => void;
}

const NODE_WIDTH = 210;
const NODE_HEIGHT = 68;
const RANK_SPACING = 280;
const ROW_SPACING = 105;
const CANVAS_Y_CENTER = 450;

export function InteractiveDagCanvas({
  dag,
  selectedNodeId,
  onSelectNode,
  completedSet,
  focusedTopicId,
  onSelectTopic
}: InteractiveDagCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState<Point>({ x: 40, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const panStartRef = useRef<Point>({ x: 0, y: 0 });

  // Hover state for tooltip / edge glow
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showSoftLinks, setShowSoftLinks] = useState(true);

  // History trail of explored nodes for DAG walking
  const [historyTrail, setHistoryTrail] = useState<string[]>(() => {
    return selectedNodeId ? [selectedNodeId] : ['L01-sets-maps-proofs'];
  });

  // Calculate layout coordinates for all 60 nodes
  const layoutMap = useMemo(() => {
    const map = new Map<string, NodeLayout>();

    dag.layers.forEach(layer => {
      const x = layer.rank * RANK_SPACING + 60;
      const count = layer.nodes.length;
      const totalColHeight = (count - 1) * ROW_SPACING;
      const startY = CANVAS_Y_CENTER - totalColHeight / 2;

      layer.nodes.forEach((node, index) => {
        const y = startY + index * ROW_SPACING;
        map.set(node.id, {
          node,
          x,
          y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          inX: x,
          inY: y + NODE_HEIGHT / 2,
          outX: x + NODE_WIDTH,
          outY: y + NODE_HEIGHT / 2
        });
      });
    });

    return map;
  }, [dag]);

  // Determine active highlighted ancestral and descendant sets
  const activeFocusId = hoveredNodeId || selectedNodeId;
  const activeNode = activeFocusId ? dag.nodes.get(activeFocusId) : null;

  const { ancestorSet, descendantSet, softLinkSet } = useMemo(() => {
    const aSet = new Set<string>();
    const dSet = new Set<string>();
    const sSet = new Set<string>();

    if (activeNode) {
      // Direct and transitive ancestors
      activeNode.allPrerequisites.forEach(p => aSet.add(p));
      activeNode.prerequisites.forEach(p => aSet.add(p));

      // Direct and transitive descendants
      activeNode.allUnlocked.forEach(u => dSet.add(u));
      activeNode.unlockedLectures.forEach(u => dSet.add(u));

      // Soft links
      activeNode.softLinks.forEach(s => sSet.add(s.targetId));
    }

    return { ancestorSet: aSet, descendantSet: dSet, softLinkSet: sSet };
  }, [activeNode]);

  // Center on focal node when requested
  const centerOnNode = useCallback(
    (nodeId: string, smooth = true) => {
      const layout = layoutMap.get(nodeId);
      if (!layout || !containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const targetX = containerWidth / 2 - (layout.x + layout.width / 2) * zoom;
      const targetY = containerHeight / 2 - (layout.y + layout.height / 2) * zoom;

      setPan({ x: targetX, y: targetY });
    },
    [layoutMap, zoom]
  );

  // When selectedNodeId changes, update history trail and optionally center
  useEffect(() => {
    if (selectedNodeId) {
      setHistoryTrail(prev => {
        if (prev[prev.length - 1] === selectedNodeId) return prev;
        return [...prev.slice(-6), selectedNodeId];
      });
    }
  }, [selectedNodeId]);

  // Fit to screen calculation
  const handleFitToView = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const maxX = Math.max(...Array.from(layoutMap.values()).map(l => l.x + l.width)) + 100;
    const maxY = Math.max(...Array.from(layoutMap.values()).map(l => l.y + l.height)) + 100;
    const minY = Math.min(...Array.from(layoutMap.values()).map(l => l.y)) - 50;

    const graphWidth = maxX;
    const graphHeight = maxY - minY;

    const scaleX = (containerWidth - 60) / graphWidth;
    const scaleY = (containerHeight - 60) / graphHeight;
    const newZoom = Math.max(0.2, Math.min(1.0, Math.min(scaleX, scaleY)));

    setZoom(newZoom);
    setPan({
      x: 30,
      y: (containerHeight - graphHeight * newZoom) / 2 - minY * newZoom
    });
  }, [layoutMap]);

  // Pointer drag handling for pan
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.dag-node-card')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
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

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom handling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.2, Math.min(2.5, zoom * zoomFactor));

    if (!containerRef.current) {
      setZoom(newZoom);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom centered on mouse pointer
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Pre-calculate edges
  const hardEdges = useMemo(() => {
    const list: Array<{
      id: string;
      fromId: string;
      toId: string;
      d: string;
      isAncestor: boolean;
      isDescendant: boolean;
      isDimmed: boolean;
    }> = [];

    dag.nodeList.forEach(toNode => {
      toNode.prerequisites.forEach(fromId => {
        const fromLayout = layoutMap.get(fromId);
        const toLayout = layoutMap.get(toNode.id);
        if (!fromLayout || !toLayout) return;

        const x1 = fromLayout.outX;
        const y1 = fromLayout.outY;
        const x2 = toLayout.inX;
        const y2 = toLayout.inY;
        const dx = Math.max(40, (x2 - x1) / 2);

        const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        const isAncestor =
          activeFocusId === toNode.id ||
          (ancestorSet.has(fromId) && (ancestorSet.has(toNode.id) || activeFocusId === toNode.id));

        const isDescendant =
          activeFocusId === fromId ||
          (descendantSet.has(toNode.id) && (descendantSet.has(fromId) || activeFocusId === fromId));

        const isDimmed =
          Boolean(activeFocusId) && !isAncestor && !isDescendant && fromId !== activeFocusId && toNode.id !== activeFocusId;

        list.push({
          id: `${fromId}->${toNode.id}`,
          fromId,
          toId: toNode.id,
          d,
          isAncestor,
          isDescendant,
          isDimmed
        });
      });
    });

    return list;
  }, [dag, layoutMap, activeFocusId, ancestorSet, descendantSet]);

  // Pre-calculate soft link curves
  const softEdges = useMemo(() => {
    if (!showSoftLinks) return [];

    const list: Array<{
      id: string;
      fromId: string;
      toId: string;
      d: string;
      relationship: string;
      isActive: boolean;
      isDimmed: boolean;
    }> = [];

    dag.nodeList.forEach(fromNode => {
      fromNode.softLinks.forEach(link => {
        const fromLayout = layoutMap.get(fromNode.id);
        const toLayout = layoutMap.get(link.targetId);
        if (!fromLayout || !toLayout) return;

        const x1 = fromLayout.x + fromLayout.width / 2;
        const y1 = fromLayout.y + (fromLayout.y > toLayout.y ? 0 : fromLayout.height);
        const x2 = toLayout.x + toLayout.width / 2;
        const y2 = toLayout.y + (toLayout.y > fromLayout.y ? 0 : toLayout.height);

        const midX = (x1 + x2) / 2;
        const arcY = Math.min(y1, y2) - 60 - Math.abs(x2 - x1) * 0.05;

        const d = `M ${x1} ${y1} Q ${midX} ${arcY} ${x2} ${y2}`;

        const isActive =
          activeFocusId === fromNode.id || activeFocusId === link.targetId || softLinkSet.has(link.targetId);

        const isDimmed = Boolean(activeFocusId) && !isActive;

        list.push({
          id: `soft:${fromNode.id}->${link.targetId}`,
          fromId: fromNode.id,
          toId: link.targetId,
          d,
          relationship: link.relationship,
          isActive,
          isDimmed
        });
      });
    });

    return list;
  }, [dag, layoutMap, showSoftLinks, activeFocusId, softLinkSet]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '720px',
        background: '#f8f8f2',
        border: '1px solid var(--line)',
        borderRadius: '10px',
        overflow: 'hidden',
        userSelect: 'none'
      }}
      ref={containerRef}
    >
      {/* Top Floating Control Bar */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '16px',
          right: '16px',
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'none'
        }}
      >
        {/* Navigation Breadcrumbs & Walking Trail */}
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflowX: 'auto',
            maxWidth: '65%'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>
            DAG TRAIL:
          </span>
          {historyTrail.map((nodeId, idx) => {
            const node = dag.nodes.get(nodeId);
            if (!node) return null;
            const isLast = idx === historyTrail.length - 1;

            return (
              <React.Fragment key={nodeId + idx}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectNode(nodeId);
                    centerOnNode(nodeId);
                  }}
                  style={{
                    background: isLast ? 'var(--soft)' : 'none',
                    border: 'none',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: isLast ? 700 : 500,
                    color: isLast ? 'var(--accent)' : 'var(--ink)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  L{String(node.lectureNumber).padStart(2, '0')}
                </button>
                {!isLast && <ChevronRight size={12} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Canvas Zoom & Tool Controls */}
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <button
            type="button"
            className="icon-button"
            style={{ width: '32px', height: '32px' }}
            onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            style={{ width: '32px', height: '32px' }}
            onClick={() => setZoom(z => Math.max(0.2, z - 0.15))}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            style={{ width: '32px', height: '32px' }}
            onClick={handleFitToView}
            title="Fit Full DAG"
          >
            <Maximize2 size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            style={{ width: '32px', height: '32px' }}
            onClick={() => {
              setZoom(0.85);
              setPan({ x: 40, y: 30 });
            }}
            title="Reset View"
          >
            <RotateCcw size={16} />
          </button>
          <div style={{ width: '1px', height: '18px', background: 'var(--line)', margin: '0 4px' }} />
          <button
            type="button"
            className={`button small ${showSoftLinks ? 'soft' : 'secondary'}`}
            style={{ minHeight: '30px', padding: '4px 9px', fontSize: '10px' }}
            onClick={() => setShowSoftLinks(v => !v)}
            title="Toggle cross-disciplinary soft links"
          >
            <Share2 size={12} /> Soft Links
          </button>
        </div>
      </div>

      {/* Legend & Ramification Color Code */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '16px',
          zIndex: 20,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '8px 14px',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          pointerEvents: 'none'
        }}
      >
        <span style={{ fontWeight: 650, color: 'var(--muted)', fontSize: '10px' }}>RAMIFICATION KEY:</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '3px', background: '#10b981', borderRadius: '2px' }} />
          Upstream Dependencies (Ancestors)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '3px', background: '#3b82f6', borderRadius: '2px' }} />
          Downstream Unlocks (Next Topics)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '2px', background: '#d97706', borderTop: '1px dashed #d97706' }} />
          Cross-Field Contamination
        </span>
      </div>

      {/* Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <defs>
          {/* Default Edge Arrow */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#b8c2b0" />
          </marker>

          {/* Ancestor Green Arrow */}
          <marker
            id="arrow-ancestor"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
          </marker>

          {/* Descendant Blue Arrow */}
          <marker
            id="arrow-descendant"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3b82f6" />
          </marker>

          {/* Selected Node Glow Filter */}
          <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#3a5d49" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Graph Transform Container */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Layer / Tier Background Guidelines */}
          {dag.layers.map(layer => {
            const x = layer.rank * RANK_SPACING + 60;
            return (
              <g key={`col-${layer.rank}`}>
                <line
                  x1={x + NODE_WIDTH / 2}
                  y1={50}
                  x2={x + NODE_WIDTH / 2}
                  y2={850}
                  stroke="var(--line)"
                  strokeDasharray="4,6"
                  opacity={0.5}
                />
                <text
                  x={x + NODE_WIDTH / 2}
                  y={40}
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize={10}
                  fontWeight={600}
                >
                  Rank {layer.rank}
                </text>
              </g>
            );
          })}

          {/* Hard Prerequisite Directed Edges */}
          <g className="dag-edges">
            {hardEdges.map(edge => {
              const markerUrl = edge.isAncestor
                ? 'url(#arrow-ancestor)'
                : edge.isDescendant
                ? 'url(#arrow-descendant)'
                : 'url(#arrow)';

              const strokeColor = edge.isAncestor
                ? '#10b981'
                : edge.isDescendant
                ? '#3b82f6'
                : '#cfd7c7';

              const strokeWidth = edge.isAncestor || edge.isDescendant ? 2.8 : 1.2;
              const opacity = edge.isDimmed ? 0.08 : edge.isAncestor || edge.isDescendant ? 1 : 0.65;

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

          {/* Soft Links (Cross-Disciplinary Connections) */}
          <g className="dag-soft-edges">
            {softEdges.map(edge => {
              const strokeColor = edge.isActive ? '#d97706' : '#e6b980';
              const strokeWidth = edge.isActive ? 2.5 : 1.2;
              const opacity = edge.isDimmed ? 0.08 : edge.isActive ? 1 : 0.55;

              return (
                <path
                  key={edge.id}
                  d={edge.d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray="5,4"
                  opacity={opacity}
                  style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
                />
              );
            })}
          </g>

          {/* Graph Nodes */}
          <g className="dag-nodes">
            {Array.from(layoutMap.values()).map(layout => {
              const { node, x, y, width, height } = layout;
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isAncestor = ancestorSet.has(node.id);
              const isDescendant = descendantSet.has(node.id);
              const isSoftLinked = softLinkSet.has(node.id);

              const isCompleted = completedSet.has(node.id);
              const readiness = computeNodeReadiness(node.id, completedSet);
              const isReady = readiness.status === 'ready';

              const isDimmed =
                Boolean(activeFocusId) &&
                !isSelected &&
                !isHovered &&
                !isAncestor &&
                !isDescendant &&
                !isSoftLinked;

              const borderColor = isSelected
                ? 'var(--accent)'
                : isAncestor
                ? '#10b981'
                : isDescendant
                ? '#3b82f6'
                : isSoftLinked
                ? '#d97706'
                : isCompleted
                ? '#a5c09e'
                : 'var(--line)';

              const borderWidth = isSelected ? 2.5 : isAncestor || isDescendant ? 2 : 1.2;

              return (
                <g
                  key={node.id}
                  className="dag-node-card"
                  transform={`translate(${x}, ${y})`}
                  opacity={isDimmed ? 0.15 : 1}
                  style={{
                    cursor: 'pointer',
                    transition: 'opacity 0.2s, transform 0.15s ease'
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectNode(node.id);
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Card Rect */}
                  <rect
                    width={width}
                    height={height}
                    rx={8}
                    ry={8}
                    fill={isSelected ? '#f4f8f2' : isCompleted ? '#fcfffa' : '#ffffff'}
                    stroke={borderColor}
                    strokeWidth={borderWidth}
                    filter={isSelected ? 'url(#glow-selected)' : undefined}
                  />

                  {/* Topic color bar on left edge */}
                  <rect
                    x={0}
                    y={0}
                    width={5}
                    height={height}
                    rx={2}
                    fill={
                      node.topicNumber === 1
                        ? '#5d7356'
                        : node.topicNumber === 2
                        ? '#3b82f6'
                        : node.topicNumber === 3
                        ? '#8b5cf6'
                        : node.topicNumber === 4
                        ? '#10b981'
                        : node.topicNumber === 5
                        ? '#06b6d4'
                        : node.topicNumber === 6
                        ? '#f59e0b'
                        : node.topicNumber === 7
                        ? '#ef4444'
                        : node.topicNumber === 8
                        ? '#ec4899'
                        : node.topicNumber === 9
                        ? '#6366f1'
                        : '#14b8a6'
                    }
                  />

                  {/* Card Header: Node ID & Topic */}
                  <text
                    x={12}
                    y={18}
                    fontSize={10}
                    fontWeight={700}
                    fill="var(--muted)"
                    letterSpacing="0.5px"
                  >
                    L{String(node.lectureNumber).padStart(2, '0')} · T{node.topicNumber}
                  </text>

                  {/* Status Indicator Icon / Text */}
                  <text
                    x={width - 10}
                    y={18}
                    textAnchor="end"
                    fontSize={10}
                    fontWeight={600}
                    fill={isCompleted ? '#2d6a4f' : isReady ? '#1a73e8' : '#9e7b28'}
                  >
                    {isCompleted ? '✓ Done' : isReady ? '★ Ready' : `🔒 ${readiness.missingPrereqs.length}`}
                  </text>

                  {/* Node Title */}
                  <text
                    x={12}
                    y={36}
                    fontSize={12}
                    fontWeight={600}
                    fill="var(--ink)"
                    fontFamily="var(--serif)"
                  >
                    {node.title.length > 24 ? node.title.slice(0, 23) + '…' : node.title}
                  </text>

                  {/* Subtitle / Subtext */}
                  <text
                    x={12}
                    y={52}
                    fontSize={9.5}
                    fill="var(--muted)"
                  >
                    {node.prerequisites.length} prereq{node.prerequisites.length === 1 ? '' : 's'} →{' '}
                    {node.unlockedLectures.length} next
                  </text>

                  {/* Soft Links Indicator badge */}
                  {node.softLinks.length > 0 && (
                    <g transform={`translate(${width - 24}, ${height - 20})`}>
                      <circle cx={10} cy={10} r={7} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1} />
                      <text x={10} y={13} fontSize={8} fontWeight={700} textAnchor="middle" fill="#b45309">
                        ~
                      </text>
                    </g>
                  )}

                  {/* Input Port Dot (Left) */}
                  <circle
                    cx={0}
                    cy={height / 2}
                    r={3.5}
                    fill={isAncestor ? '#10b981' : 'var(--line)'}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />

                  {/* Output Port Dot (Right) */}
                  <circle
                    cx={width}
                    cy={height / 2}
                    r={3.5}
                    fill={isDescendant ? '#3b82f6' : 'var(--line)'}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}

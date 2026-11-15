import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sparkles,
  GitBranch,
  CornerDownRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  type GraphNode,
  type KnowledgeDAG,
  computeNodeReadiness
} from '../lib/knowledgeGraph';
import {
  computeTopDownDagLayout,
  getOneHopNeighborhood,
  type NodeLayout
} from '../lib/dagLayoutEngine';

interface Point {
  x: number;
  y: number;
}

interface InteractiveDagCanvasProps {
  dag: KnowledgeDAG;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  completedSet: Set<string>;
  focusedTopicId?: string;
  onSelectTopic?: (topicId: string) => void;
}

export const TOPIC_PALETTE: Array<{ number: number; name: string; shortName: string; color: string }> = [
  { number: 1, name: 'Mathematical Foundations', shortName: 'Math', color: '#4a6741' },
  { number: 2, name: 'Quantum Mechanics Essentials', shortName: 'Quantum', color: '#0284c7' },
  { number: 3, name: 'Pauli Group & Symplectic Rep', shortName: 'Pauli', color: '#4f46e5' },
  { number: 4, name: 'Clifford Group & Tableaux', shortName: 'Clifford', color: '#7c3aed' },
  { number: 5, name: 'Stabilizer Formalism', shortName: 'Stabilizer', color: '#059669' },
  { number: 6, name: 'Stabilizer Codes & CSS', shortName: 'CSS Codes', color: '#0891b2' },
  { number: 7, name: 'Surface Codes & Decoders', shortName: 'Surface', color: '#d97706' },
  { number: 8, name: 'Color Codes & Topological QEC', shortName: 'Color/Topo', color: '#dc2626' },
  { number: 9, name: 'Fault-Tolerant Architectures', shortName: 'Fault-Tol', color: '#db2777' },
  { number: 10, name: 'Frontiers & Mixed Systems', shortName: 'Frontiers', color: '#0d9488' }
];

const TOPIC_COLORS: Record<number, string> = Object.fromEntries(
  TOPIC_PALETTE.map(t => [t.number, t.color])
);

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

  // Active focal lecture (defaults to foundational root L01 if none selected)
  const focalId = selectedNodeId && dag.nodes.has(selectedNodeId)
    ? selectedNodeId
    : dag.nodeList[0]?.id || 'L01-sets-maps-proofs';

  const focalNode = dag.nodes.get(focalId);

  // Toggle to optionally show derived (indirect / transitive) dependencies
  const [showDerived, setShowDerived] = useState(false);

  // 1-Hop Neighborhood is the exclusive exploration model
  // Deterministically contains focal node + direct prerequisites + direct unlocks
  // (plus derived dependencies when showDerived is enabled)
  const visibleNodeIds = useMemo(() => {
    return getOneHopNeighborhood(focalId, dag, showDerived);
  }, [focalId, dag, showDerived]);

  const visibleNodes = useMemo(() => {
    return dag.nodeList.filter(n => visibleNodeIds.has(n.id));
  }, [dag, visibleNodeIds]);

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
      nodeWidth: 230,
      nodeHeight: 82,
      levelHeight: 185,
      minNodeGap: 60,
      extraBranchGap: 40,
      topPadding: 50
    });
  }, [visibleNodes, dag]);

  // Fit camera to center the 1-hop neighborhood
  const fitToCurrentBounds = useCallback(() => {
    if (!containerRef.current || bounds.width === 0 || bounds.height === 0) return;

    const container = containerRef.current.getBoundingClientRect();
    const padX = 80;
    const padY = 80;

    const scaleX = (container.width - padX * 2) / Math.max(1, bounds.width);
    const scaleY = (container.height - padY * 2) / Math.max(1, bounds.height);
    const newZoom = Math.max(0.4, Math.min(1.15, Math.min(scaleX, scaleY)));

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    const newPanX = container.width / 2 - centerX * newZoom;
    const newPanY = container.height / 2 - centerY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [bounds]);

  // Automatically center whenever focal node changes
  useEffect(() => {
    fitToCurrentBounds();
  }, [focalId, showDerived, fitToCurrentBounds]);

  // Pan interaction handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
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

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  // Wheel zoom handling centered on mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(2.2, zoom * zoomFactor));

    if (!containerRef.current) {
      setZoom(newZoom);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

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
    visibleNodes.forEach(toNode => {
      toNode.prerequisites.forEach(fromId => {
        if (!visibleNodeIds.has(fromId)) return;
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
      visibleNodes.forEach(toNode => {
        (toNode.derivedPrerequisites || []).forEach(fromId => {
          if (!visibleNodeIds.has(fromId)) return;
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
  }, [visibleNodes, visibleNodeIds, layoutMap, focalId, hoveredNodeId, showDerived]);

  const focalTopicColor = focalNode ? (TOPIC_COLORS[focalNode.topicNumber] || 'var(--accent)') : 'var(--accent)';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '740px',
        background: '#f8f8f2',
        border: '1px solid var(--line)',
        borderRadius: '10px',
        overflow: 'hidden',
        userSelect: 'none'
      }}
      ref={containerRef}
    >
      {/* Top Clean 1-Hop Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '14px',
          right: '14px',
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'none'
        }}
      >
        {/* Left: Focal Lecture Identity & Jump to Root */}
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: focalTopicColor,
              boxShadow: '0 0 0 2px rgba(0,0,0,0.08)'
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>
            Focal: L{focalNode ? String(focalNode.lectureNumber).padStart(2, '0') : '01'} · {focalNode?.title}
          </span>

          <div style={{ width: '1px', height: '14px', background: 'var(--line)', margin: '0 2px' }} />

          <button
            type="button"
            className="button small secondary"
            style={{ minHeight: '26px', padding: '2px 8px', fontSize: '10.5px' }}
            onClick={() => onSelectNode('L01-sets-maps-proofs')}
            title="Reset focus to foundational bedrock root L01"
          >
            <GitBranch size={12} style={{ marginRight: '4px' }} />
            L01 Root
          </button>
        </div>

        {/* Right: 1-Hop Exploration Tools */}
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          {/* Explicit 1-Hop Mode Pill */}
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--accent)',
              background: 'var(--soft)',
              padding: '2px 7px',
              borderRadius: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            1-Hop View
          </span>

          {/* Derived Dependencies Toggle */}
          <button
            type="button"
            className={`button small ${showDerived ? 'soft' : 'secondary'}`}
            style={{ minHeight: '26px', padding: '2px 8px', fontSize: '10.5px' }}
            onClick={() => setShowDerived(v => !v)}
            title="Flag and display derived (transitive / indirect) dependencies"
          >
            <CornerDownRight size={12} style={{ marginRight: '4px' }} />
            {showDerived ? 'Hide Derived' : 'Show Derived'}
          </button>

          <div style={{ width: '1px', height: '16px', background: 'var(--line)', margin: '0 2px' }} />

          {/* Camera Controls */}
          <button
            type="button"
            className="icon-button"
            style={{ width: '28px', height: '28px' }}
            onClick={() => setZoom(z => Math.min(2.2, z + 0.15))}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            className="icon-button"
            style={{ width: '28px', height: '28px' }}
            onClick={() => setZoom(z => Math.max(0.3, z - 0.15))}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            className="icon-button"
            style={{ width: '28px', height: '28px' }}
            onClick={fitToCurrentBounds}
            title="Center 1-Hop Neighborhood"
          >
            <Maximize2 size={14} />
          </button>
          <button
            type="button"
            className="icon-button"
            style={{ width: '28px', height: '28px' }}
            onClick={() => {
              setZoom(0.9);
              setPan({ x: 300, y: 80 });
            }}
            title="Reset Pan & Zoom"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Bottom Floating Topic Color Palette & Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '14px',
          right: '14px',
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          pointerEvents: 'none'
        }}
      >
        {/* Topic Color Palette Chips */}
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflowX: 'auto',
            maxWidth: '72%'
          }}
        >
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            TOPIC COLORS:
          </span>
          {TOPIC_PALETTE.map(topic => (
            <span
              key={topic.number}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
              title={`Topic ${topic.number}: ${topic.name}`}
              onClick={() => onSelectTopic?.(topic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: topic.color
                }}
              />
              <span style={{ color: 'var(--muted)' }}>
                {topic.shortName}
              </span>
            </span>
          ))}
        </div>

        {/* Link Styles Key */}
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '5px 12px',
            fontSize: '10.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--ink)' }}>
            <span style={{ width: '12px', height: '2.5px', background: '#3b82f6', borderRadius: '2px' }} />
            Direct Dependency
          </span>
          {showDerived && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#b45309' }}>
              <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #d97706' }} />
              Derived Dependency (Indirect)
            </span>
          )}
        </div>
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
            {directEdges.map(edge => {
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
            {derivedEdges.map(edge => {
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
            {Array.from(layoutMap.values()).map(layout => {
              const { node, x, y, width, height } = layout;
              const isFocal = node.id === focalId;
              const isHovered = hoveredNodeId === node.id;

              const isDirectPrereq = focalNode?.prerequisites.includes(node.id);
              const isDerivedPrereq = focalNode?.derivedPrerequisites.includes(node.id);
              const isDirectUnlock = focalNode?.unlockedLectures.includes(node.id);
              const isDerivedUnlock = focalNode?.derivedUnlocked.includes(node.id);

              const isCompleted = completedSet.has(node.id);
              const readiness = computeNodeReadiness(node.id, completedSet);
              const isReady = readiness.status === 'ready';

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

              return (
                <g
                  key={node.id}
                  className="dag-node-card"
                  transform={`translate(${x}, ${y})`}
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    // Clicking any node transitions focal 1-hop view to that node
                    onSelectNode(node.id);
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Card Background Rect */}
                  <rect
                    width={width}
                    height={height}
                    rx={10}
                    ry={10}
                    fill={isFocal ? '#f4f8f2' : isCompleted ? '#fcfffa' : '#ffffff'}
                    stroke={borderColor}
                    strokeWidth={borderWidth}
                    strokeDasharray={isDerivedPrereq || isDerivedUnlock ? '4,3' : undefined}
                    filter={isFocal ? 'url(#glow-focal)' : undefined}
                  />

                  {/* Left Topic Indicator Color Bar */}
                  <rect
                    x={0}
                    y={0}
                    width={6}
                    height={height}
                    rx={3}
                    fill={topicColor}
                  />

                  {/* Top Header: Lecture Badge in Topic Color & Context Tag */}
                  <text
                    x={14}
                    y={21}
                    fontSize={11}
                    fontWeight={800}
                    fill={topicColor}
                    letterSpacing="0.5px"
                  >
                    L{String(node.lectureNumber).padStart(2, '0')}
                  </text>

                  {/* Role Tag in 1-Hop context */}
                  <text
                    x={44}
                    y={20.5}
                    fontSize={9.5}
                    fontWeight={700}
                    fill={
                      isFocal
                        ? 'var(--accent)'
                        : isDirectPrereq
                        ? '#047857'
                        : isDirectUnlock
                        ? '#1d4ed8'
                        : '#b45309'
                    }
                  >
                    {isFocal
                      ? '● FOCAL'
                      : isDirectPrereq
                      ? '▲ PREREQUISITE'
                      : isDirectUnlock
                      ? '▼ DIRECT UNLOCK'
                      : isDerivedPrereq
                      ? '▲ DERIVED PREREQ'
                      : '▼ DERIVED UNLOCK'}
                  </text>

                  {/* Readiness Status Badge */}
                  <text
                    x={width - 12}
                    y={21}
                    textAnchor="end"
                    fontSize={10}
                    fontWeight={650}
                    fill={isCompleted ? '#2d6a4f' : isReady ? '#1a73e8' : '#9e7b28'}
                  >
                    {isCompleted ? '✓ Done' : isReady ? '★ Ready' : `🔒 ${readiness.missingPrereqs.length}`}
                  </text>

                  {/* Node Title */}
                  <text
                    x={14}
                    y={40}
                    fontSize={12}
                    fontWeight={600}
                    fill="var(--ink)"
                    fontFamily="var(--serif)"
                  >
                    {node.title.length > 25 ? `${node.title.slice(0, 24)}…` : node.title}
                  </text>

                  {/* Subtitle / Navigation Instruction */}
                  <text
                    x={14}
                    y={58}
                    fontSize={9.5}
                    fill={isFocal ? 'var(--ink)' : 'var(--muted)'}
                  >
                    {isFocal
                      ? `${node.prerequisites.length} direct prereq${node.prerequisites.length === 1 ? '' : 's'} · ${node.unlockedLectures.length} direct unlock${node.unlockedLectures.length === 1 ? '' : 's'}${node.derivedUnlocked.length > 0 ? ` (${node.derivedUnlocked.length} derived)` : ''}`
                      : 'Click to shift 1-hop view to this lecture →'}
                  </text>

                  {/* Top Direct Port Marker */}
                  <circle
                    cx={width / 2}
                    cy={0}
                    r={3}
                    fill={isDirectPrereq || isFocal ? '#10b981' : topicColor}
                    stroke="#fff"
                    strokeWidth={1}
                  />

                  {/* Bottom Direct Port Marker */}
                  <circle
                    cx={width / 2}
                    cy={height}
                    r={3}
                    fill={isDirectUnlock || isFocal ? '#3b82f6' : 'var(--line)'}
                    stroke="#fff"
                    strokeWidth={1}
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

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sparkles,
  Share2,
  Layers,
  ChevronRight,
  GitBranch,
  Compass,
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
  expandNodePrerequisites,
  collapseNodePrerequisites,
  expandNodeUnlocks,
  collapseNodeUnlocks,
  expandAllAncestors,
  expandAllDescendants,
  getOneHopNeighborhood,
  getBedrockRootNodeIds,
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

const TOPIC_COLORS: Record<number, string> = {
  1: '#5d7356',
  2: '#3b82f6',
  3: '#8b5cf6',
  4: '#10b981',
  5: '#06b6d4',
  6: '#f59e0b',
  7: '#ef4444',
  8: '#ec4899',
  9: '#6366f1',
  10: '#14b8a6'
};

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

  // Dynamic set of visible node IDs on canvas
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(() => {
    if (selectedNodeId && dag.nodes.has(selectedNodeId)) {
      return getOneHopNeighborhood(selectedNodeId, dag);
    }
    const roots = getBedrockRootNodeIds(dag);
    return roots.size > 0 ? roots : new Set([dag.nodeList[0]?.id || 'L01-sets-maps-proofs']);
  });

  // Pan & Zoom camera state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState<Point>({ x: 300, y: 80 });
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

  // Ensure selectedNodeId is visible whenever it changes
  useEffect(() => {
    if (selectedNodeId && dag.nodes.has(selectedNodeId)) {
      setVisibleNodeIds(prev => {
        if (prev.has(selectedNodeId)) return prev;
        const next = new Set(prev);
        next.add(selectedNodeId);
        // Also expand immediate prerequisites so user sees its direct provenance
        const node = dag.nodes.get(selectedNodeId);
        node?.prerequisites.forEach(p => next.add(p));
        return next;
      });

      setHistoryTrail(trail => {
        if (trail[trail.length - 1] === selectedNodeId) return trail;
        return [...trail.slice(-6), selectedNodeId];
      });
    }
  }, [selectedNodeId, dag]);

  // Derive visible GraphNode objects
  const visibleNodes = useMemo(() => {
    return dag.nodeList.filter(n => visibleNodeIds.has(n.id));
  }, [dag, visibleNodeIds]);

  // Compute top-down Sugiyama barycentric layout
  const { layoutMap, bounds } = useMemo(() => {
    return computeTopDownDagLayout(visibleNodes, dag, {
      nodeWidth: 230,
      nodeHeight: 84,
      levelHeight: 165,
      minNodeGap: 40,
      topPadding: 60
    });
  }, [visibleNodes, dag]);

  // Highlight sets for active node
  const activeFocusId = hoveredNodeId || selectedNodeId;
  const { ancestorSet, descendantSet, softLinkSet } = useMemo(() => {
    const aSet = new Set<string>();
    const dSet = new Set<string>();
    const sSet = new Set<string>();

    if (!activeFocusId) return { ancestorSet: aSet, descendantSet: dSet, softLinkSet: sSet };

    const activeNode = dag.nodes.get(activeFocusId);
    if (!activeNode) return { ancestorSet: aSet, descendantSet: dSet, softLinkSet: sSet };

    // Direct and transitive ancestors
    activeNode.allPrerequisites.forEach(id => aSet.add(id));
    // Direct and transitive descendants
    activeNode.allUnlocked.forEach(id => dSet.add(id));
    // Soft links
    activeNode.softLinks.forEach(l => sSet.add(l.targetId));

    return { ancestorSet: aSet, descendantSet: dSet, softLinkSet: sSet };
  }, [dag, activeFocusId]);

  // Fit camera to framed bounding box
  const fitToCurrentBounds = useCallback(() => {
    if (!containerRef.current || bounds.width === 0 || bounds.height === 0) return;

    const container = containerRef.current.getBoundingClientRect();
    const padX = 80;
    const padY = 80;

    const scaleX = (container.width - padX * 2) / Math.max(1, bounds.width);
    const scaleY = (container.height - padY * 2) / Math.max(1, bounds.height);
    const newZoom = Math.max(0.25, Math.min(1.2, Math.min(scaleX, scaleY)));

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    const newPanX = container.width / 2 - centerX * newZoom;
    const newPanY = container.height / 2 - centerY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [bounds]);

  // Auto-fit on first load or when visible set changes significantly
  const prevCountRef = useRef(visibleNodes.length);
  useEffect(() => {
    if (Math.abs(prevCountRef.current - visibleNodes.length) >= 3 || prevCountRef.current === 0) {
      fitToCurrentBounds();
    }
    prevCountRef.current = visibleNodes.length;
  }, [visibleNodes.length, fitToCurrentBounds]);

  // Pan interaction handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary button
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
    const newZoom = Math.max(0.2, Math.min(2.5, zoom * zoomFactor));

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

  // Top/bottom expand & collapse actions for node pills
  const handleTogglePrerequisites = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = dag.nodes.get(nodeId);
    if (!node) return;

    const hidden = node.prerequisites.filter(pId => !visibleNodeIds.has(pId));
    if (hidden.length > 0) {
      setVisibleNodeIds(prev => expandNodePrerequisites(prev, nodeId, dag));
    } else {
      const protectedSet = new Set<string>([selectedNodeId].filter(Boolean) as string[]);
      setVisibleNodeIds(prev => collapseNodePrerequisites(prev, nodeId, dag, protectedSet));
    }
  };

  const handleToggleUnlocks = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = dag.nodes.get(nodeId);
    if (!node) return;

    const hidden = node.unlockedLectures.filter(uId => !visibleNodeIds.has(uId));
    if (hidden.length > 0) {
      setVisibleNodeIds(prev => expandNodeUnlocks(prev, nodeId, dag));
    } else {
      const protectedSet = new Set<string>([selectedNodeId].filter(Boolean) as string[]);
      setVisibleNodeIds(prev => collapseNodeUnlocks(prev, nodeId, dag, protectedSet));
    }
  };

  // Action helpers for toolbar
  const handleFocusOneHop = () => {
    const focusId = selectedNodeId || dag.nodeList[0]?.id;
    if (!focusId) return;
    setVisibleNodeIds(getOneHopNeighborhood(focusId, dag));
  };

  const handleExpandAncestors = () => {
    const focusId = selectedNodeId || dag.nodeList[0]?.id;
    if (!focusId) return;
    setVisibleNodeIds(prev => expandAllAncestors(prev, focusId, dag));
  };

  const handleExpandDescendants = () => {
    const focusId = selectedNodeId || dag.nodeList[0]?.id;
    if (!focusId) return;
    setVisibleNodeIds(prev => expandAllDescendants(prev, focusId, dag));
  };

  const handleResetToAxioms = () => {
    setVisibleNodeIds(getBedrockRootNodeIds(dag));
  };

  // Pre-calculate visible directed Bezier edges (flowing strictly top-to-bottom)
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
        const dy = Math.max(30, (y2 - y1) * 0.5);

        // Smooth cubic vertical Bezier flowing top to bottom
        const d = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

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
  }, [visibleNodes, visibleNodeIds, layoutMap, activeFocusId, ancestorSet, descendantSet]);

  // Pre-calculate visible soft link curves (cross-contamination / cross-disciplinary)
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

    visibleNodes.forEach(fromNode => {
      fromNode.softLinks.forEach(link => {
        if (!visibleNodeIds.has(link.targetId)) return;
        const fromLayout = layoutMap.get(fromNode.id);
        const toLayout = layoutMap.get(link.targetId);
        if (!fromLayout || !toLayout) return;

        // Connect from side borders with a curved arc
        const fromRight = fromLayout.x < toLayout.x;
        const x1 = fromRight ? fromLayout.x + fromLayout.width : fromLayout.x;
        const y1 = fromLayout.y + fromLayout.height / 2;
        const x2 = fromRight ? toLayout.x : toLayout.x + toLayout.width;
        const y2 = toLayout.y + toLayout.height / 2;

        const midX = (x1 + x2) / 2 + (fromRight ? 30 : -30);
        const midY = (y1 + y2) / 2;

        const d = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

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
  }, [visibleNodes, visibleNodeIds, layoutMap, showSoftLinks, activeFocusId, softLinkSet]);

  // Distinct active levels for level background guidelines
  const visibleLevels = useMemo(() => {
    const levels = new Set<number>();
    layoutMap.forEach(l => levels.add(l.level));
    return Array.from(levels).sort((a, b) => a - b);
  }, [layoutMap]);

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
      {/* Top Floating Control Bar */}
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
          pointerEvents: 'none',
          flexWrap: 'wrap'
        }}
      >
        {/* Navigation Breadcrumbs & Walking Trail */}
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
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflowX: 'auto',
            maxWidth: '55%'
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
                  title={node.title}
                >
                  L{String(node.lectureNumber).padStart(2, '0')}
                </button>
                {!isLast && <ChevronRight size={12} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Dynamic Subgraph Quick Action Buttons & Canvas Tools */}
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
            gap: '5px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          {/* Subgraph size indicator */}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 650,
              color: 'var(--muted)',
              padding: '0 6px',
              borderRight: '1px solid var(--line)',
              whiteSpace: 'nowrap'
            }}
          >
            {visibleNodes.length} / {dag.nodeList.length} Nodes
          </span>

          {/* Quick Subgraph Filter Presets */}
          <button
            type="button"
            className="button small secondary"
            style={{ minHeight: '28px', padding: '3px 8px', fontSize: '11px' }}
            onClick={handleFocusOneHop}
            title="Focus on selected node + direct 1-hop prerequisites and unlocks"
          >
            <Compass size={13} style={{ marginRight: '4px' }} />
            1-Hop
          </button>

          <button
            type="button"
            className="button small secondary"
            style={{ minHeight: '28px', padding: '3px 8px', fontSize: '11px' }}
            onClick={handleExpandAncestors}
            title="Expand entire upstream prerequisite tree up to bedrock axioms"
          >
            <ArrowUp size={13} style={{ marginRight: '3px' }} />
            Ancestors
          </button>

          <button
            type="button"
            className="button small secondary"
            style={{ minHeight: '28px', padding: '3px 8px', fontSize: '11px' }}
            onClick={handleExpandDescendants}
            title="Expand entire downstream unlocked branches"
          >
            <ArrowDown size={13} style={{ marginRight: '3px' }} />
            Unlocks
          </button>

          <button
            type="button"
            className="button small secondary"
            style={{ minHeight: '28px', padding: '3px 8px', fontSize: '11px' }}
            onClick={handleResetToAxioms}
            title="Reset visible canvas to foundational bedrock axioms (in-degree 0)"
          >
            <GitBranch size={13} style={{ marginRight: '3px' }} />
            Axioms
          </button>

          <div style={{ width: '1px', height: '18px', background: 'var(--line)', margin: '0 2px' }} />

          {/* Camera Controls */}
          <button
            type="button"
            className="icon-button"
            style={{ width: '30px', height: '30px' }}
            onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            className="icon-button"
            style={{ width: '30px', height: '30px' }}
            onClick={() => setZoom(z => Math.max(0.2, z - 0.15))}
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            type="button"
            className="icon-button"
            style={{ width: '30px', height: '30px' }}
            onClick={fitToCurrentBounds}
            title="Fit Subgraph into Canvas View"
          >
            <Maximize2 size={15} />
          </button>
          <button
            type="button"
            className="icon-button"
            style={{ width: '30px', height: '30px' }}
            onClick={() => {
              setZoom(0.85);
              setPan({ x: 300, y: 80 });
            }}
            title="Reset Pan & Zoom"
          >
            <RotateCcw size={15} />
          </button>

          <div style={{ width: '1px', height: '18px', background: 'var(--line)', margin: '0 2px' }} />

          <button
            type="button"
            className={`button small ${showSoftLinks ? 'soft' : 'secondary'}`}
            style={{ minHeight: '28px', padding: '3px 8px', fontSize: '11px' }}
            onClick={() => setShowSoftLinks(v => !v)}
            title="Toggle cross-disciplinary soft links"
          >
            <Share2 size={12} style={{ marginRight: '4px' }} />
            Soft
          </button>
        </div>
      </div>

      {/* Bottom Floating Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '14px',
          zIndex: 20,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          pointerEvents: 'none'
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--muted)', fontSize: '10px' }}>TOP-DOWN FLOW:</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '3px', background: '#10b981', borderRadius: '2px' }} />
          Upstream Ancestors (▲ Prereqs)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '3px', background: '#3b82f6', borderRadius: '2px' }} />
          Downstream Unlocks (▼ Next)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '2px', background: '#d97706', borderTop: '1px dashed #d97706' }} />
          Cross-Disciplinary Soft Link
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
          {/* Default Downward Arrowhead Marker */}
          <marker
            id="arrow-down"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#b8c2b0" />
          </marker>

          {/* Ancestor Green Arrowhead Marker */}
          <marker
            id="arrow-ancestor-down"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
          </marker>

          {/* Descendant Blue Arrowhead Marker */}
          <marker
            id="arrow-descendant-down"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3b82f6" />
          </marker>

          {/* Selected Node Glow Shadow */}
          <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#3a5d49" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Graph Transform Container */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Top-to-Bottom Level Stratum Guidelines */}
          {visibleLevels.map(lvl => {
            const levelY = 60 + lvl * 165;
            return (
              <g key={`level-guideline-${lvl}`}>
                <line
                  x1={bounds.minX - 160}
                  y1={levelY - 24}
                  x2={bounds.maxX + 160}
                  y2={levelY - 24}
                  stroke="var(--line)"
                  strokeDasharray="4,6"
                  opacity={0.35}
                />
                <text
                  x={bounds.minX - 150}
                  y={levelY - 10}
                  fill="var(--muted)"
                  fontSize={10}
                  fontWeight={650}
                  letterSpacing="0.5px"
                >
                  {lvl === 0 ? 'BEDROCK / ROOTS' : `TIER ${lvl + 1}`}
                </text>
              </g>
            );
          })}

          {/* Hard Directed Downward Bezier Edges */}
          <g className="dag-edges">
            {hardEdges.map(edge => {
              const markerUrl = edge.isAncestor
                ? 'url(#arrow-ancestor-down)'
                : edge.isDescendant
                ? 'url(#arrow-descendant-down)'
                : 'url(#arrow-down)';

              const strokeColor = edge.isAncestor
                ? '#10b981'
                : edge.isDescendant
                ? '#3b82f6'
                : '#cbd5e1';

              const strokeWidth = edge.isAncestor || edge.isDescendant ? 2.8 : 1.3;
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
              const strokeColor = edge.isActive ? '#d97706' : '#f59e0b';
              const strokeWidth = edge.isActive ? 2.5 : 1.2;
              const opacity = edge.isDimmed ? 0.08 : edge.isActive ? 1 : 0.5;

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

              // Top prerequisites expand/collapse calculation
              const hiddenPrereqs = node.prerequisites.filter(pId => !visibleNodeIds.has(pId));
              const visiblePrereqs = node.prerequisites.filter(pId => visibleNodeIds.has(pId));
              const hasPrereqs = node.prerequisites.length > 0;
              const hasHiddenPrereqs = hiddenPrereqs.length > 0;

              // Bottom unlocks expand/collapse calculation
              const hiddenUnlocks = node.unlockedLectures.filter(uId => !visibleNodeIds.has(uId));
              const visibleUnlocks = node.unlockedLectures.filter(uId => visibleNodeIds.has(uId));
              const hasUnlocks = node.unlockedLectures.length > 0;
              const hasHiddenUnlocks = hiddenUnlocks.length > 0;

              const topicColor = TOPIC_COLORS[node.topicNumber] || 'var(--accent)';

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
                  {/* Card Background Rect */}
                  <rect
                    width={width}
                    height={height}
                    rx={10}
                    ry={10}
                    fill={isSelected ? '#f4f8f2' : isCompleted ? '#fcfffa' : '#ffffff'}
                    stroke={borderColor}
                    strokeWidth={borderWidth}
                    filter={isSelected ? 'url(#glow-selected)' : undefined}
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

                  {/* Top Header: Lecture ID & Topic */}
                  <text
                    x={14}
                    y={22}
                    fontSize={10.5}
                    fontWeight={700}
                    fill="var(--muted)"
                    letterSpacing="0.5px"
                  >
                    L{String(node.lectureNumber).padStart(2, '0')} · T{node.topicNumber}
                  </text>

                  {/* Readiness Status Badge */}
                  <text
                    x={width - 12}
                    y={22}
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
                    y={42}
                    fontSize={12.5}
                    fontWeight={600}
                    fill="var(--ink)"
                    fontFamily="var(--serif)"
                  >
                    {node.title.length > 25 ? `${node.title.slice(0, 24)}…` : node.title}
                  </text>

                  {/* Subtitle: Direct Count Stats */}
                  <text
                    x={14}
                    y={60}
                    fontSize={10}
                    fill="var(--muted)"
                  >
                    {node.prerequisites.length} prereq{node.prerequisites.length === 1 ? '' : 's'} ·{' '}
                    {node.unlockedLectures.length} unlocks
                  </text>

                  {/* Soft Links Indicator icon if applicable */}
                  {node.softLinks.length > 0 && (
                    <g transform={`translate(${width - 24}, ${height - 24})`}>
                      <circle cx={10} cy={10} r={7} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1} />
                      <text x={10} y={13} fontSize={8} fontWeight={700} textAnchor="middle" fill="#b45309">
                        ~
                      </text>
                    </g>
                  )}

                  {/* ======================================================== */}
                  {/* TOP EXPAND / COLLAPSE PILL (Prerequisites Entering Port) */}
                  {/* ======================================================== */}
                  {hasPrereqs ? (
                    <g
                      className="dag-expand-pill-top"
                      transform={`translate(${width / 2 - 44}, -10)`}
                      onClick={e => handleTogglePrerequisites(node.id, e)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        width={88}
                        height={18}
                        rx={9}
                        fill={hasHiddenPrereqs ? '#ecfdf5' : '#f1f5f9'}
                        stroke={hasHiddenPrereqs ? '#10b981' : '#94a3b8'}
                        strokeWidth={1.2}
                      />
                      <text
                        x={44}
                        y={12.5}
                        fontSize={9.5}
                        fontWeight={650}
                        textAnchor="middle"
                        fill={hasHiddenPrereqs ? '#047857' : '#475569'}
                      >
                        {hasHiddenPrereqs ? `▲ +${hiddenPrereqs.length} Prereqs` : `▲ Hide (${visiblePrereqs.length})`}
                      </text>
                    </g>
                  ) : (
                    /* Root / Axiom Bedrock Port Marker */
                    <circle
                      cx={width / 2}
                      cy={0}
                      r={3}
                      fill="#5d7356"
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  )}

                  {/* ======================================================== */}
                  {/* BOTTOM EXPAND / COLLAPSE PILL (Unlocks Outgoing Port)     */}
                  {/* ======================================================== */}
                  {hasUnlocks ? (
                    <g
                      className="dag-expand-pill-bottom"
                      transform={`translate(${width / 2 - 44}, ${height - 8})`}
                      onClick={e => handleToggleUnlocks(node.id, e)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        width={88}
                        height={18}
                        rx={9}
                        fill={hasHiddenUnlocks ? '#eff6ff' : '#f1f5f9'}
                        stroke={hasHiddenUnlocks ? '#3b82f6' : '#94a3b8'}
                        strokeWidth={1.2}
                      />
                      <text
                        x={44}
                        y={12.5}
                        fontSize={9.5}
                        fontWeight={650}
                        textAnchor="middle"
                        fill={hasHiddenUnlocks ? '#1d4ed8' : '#475569'}
                      >
                        {hasHiddenUnlocks ? `▼ +${hiddenUnlocks.length} Next` : `▼ Hide (${visibleUnlocks.length})`}
                      </text>
                    </g>
                  ) : (
                    /* Terminal Application Port Marker */
                    <circle
                      cx={width / 2}
                      cy={height}
                      r={3}
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
  );
}

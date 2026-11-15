import React from 'react';
import type { KnowledgeDAG, computeNodeReadiness } from '../../lib/knowledgeGraph';
import { NodeCard } from './NodeCard';

interface StratifiedTreeViewProps {
  dag: KnowledgeDAG;
  filteredNodeIds: Set<string>;
  nodeReadinessMap: Map<string, ReturnType<typeof computeNodeReadiness>>;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

export function StratifiedTreeView({
  dag,
  filteredNodeIds,
  nodeReadinessMap,
  selectedNodeId,
  onSelectNode
}: StratifiedTreeViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {dag.layers.map(layer => {
        const visibleNodes = layer.nodes.filter(n => filteredNodeIds.has(n.id));
        if (visibleNodes.length === 0) return null;

        return (
          <div
            key={layer.rank}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '9px',
              padding: '18px 20px',
              position: 'relative'
            }}
          >
            {/* Layer Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--line)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--soft)',
                    color: 'var(--accent)',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {layer.rank}
                </span>
                <div>
                  <h4 style={{ fontFamily: 'var(--serif)', fontSize: '16px', margin: 0 }}>
                    {layer.title}
                  </h4>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    Topological Depth {layer.rank} · {visibleNodes.length} Monothematic Concepts
                  </span>
                </div>
              </div>
            </div>

            {/* Nodes Grid in this Layer */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '12px'
              }}
            >
              {visibleNodes.map(node => {
                const readiness = nodeReadinessMap.get(node.id)!;
                const isSelected = selectedNodeId === node.id;

                return (
                  <NodeCard
                    key={node.id}
                    node={node}
                    readiness={readiness}
                    isSelected={isSelected}
                    onClick={() => onSelectNode(node.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

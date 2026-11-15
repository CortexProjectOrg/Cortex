import React from 'react';
import { Search, X, Layers, Network, Workflow, GitFork } from 'lucide-react';
import { TOPICS } from '../../lib/curriculum';

export type ViewMode = 'hierarchical' | 'canvas' | 'ramifications' | 'stratified';
export type StatusFilter = 'all' | 'ready' | 'completed' | 'locked';

interface GraphToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  topicFilter: string;
  setTopicFilter: (topicId: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  totalNodes: number;
  stats: {
    ready: number;
    completed: number;
    locked: number;
  };
}

export function GraphToolbar({
  searchQuery,
  setSearchQuery,
  topicFilter,
  setTopicFilter,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  totalNodes,
  stats
}: GraphToolbarProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: '9px',
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px' }}>
        {/* Search Field */}
        <div className="search-field small" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search concepts, questions, or lecture titles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Topic Select */}
        <select
          value={topicFilter}
          onChange={e => setTopicFilter(e.target.value)}
          style={{
            border: '1px solid var(--line)',
            background: 'var(--bg)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '11px',
            color: 'var(--ink)'
          }}
        >
          <option value="all">All 10 Topics</option>
          {TOPICS.map(t => (
            <option key={t.id} value={t.id}>
              Topic {t.number}: {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Status Pill Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted)', marginRight: '4px' }}>Status:</span>
        {(
          [
            { key: 'all', label: `All (${totalNodes})` },
            { key: 'ready', label: `Ready (${stats.ready})` },
            { key: 'completed', label: `Mastered (${stats.completed})` },
            { key: 'locked', label: `Locked (${stats.locked})` }
          ] as const
        ).map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`button small ${statusFilter === tab.key ? 'primary' : 'secondary'}`}
            style={{
              minHeight: '32px',
              padding: '5px 11px',
              fontSize: '11px',
              borderRadius: '6px'
            }}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="segmented">
        <button
          type="button"
          className={viewMode === 'hierarchical' ? 'selected' : ''}
          onClick={() => setViewMode('hierarchical')}
          title="Scalable Topic DAG with Entering & Outgoing Connections and Expandable Nodes"
        >
          <Layers size={14} /> Topic DAG (Expandable)
        </button>
        <button
          type="button"
          className={viewMode === 'canvas' ? 'selected' : ''}
          onClick={() => setViewMode('canvas')}
          title="Real Interactive 2D DAG Graph Canvas"
        >
          <Network size={14} /> 2D Graph Canvas
        </button>
        <button
          type="button"
          className={viewMode === 'ramifications' ? 'selected' : ''}
          onClick={() => setViewMode('ramifications')}
          title="Topic & Lecture Ramification Explorer"
        >
          <Workflow size={14} /> Ramifications
        </button>
        <button
          type="button"
          className={viewMode === 'stratified' ? 'selected' : ''}
          onClick={() => setViewMode('stratified')}
          title="Stratified Layered DAG Tree"
        >
          <GitFork size={14} /> Stratified Tiers
        </button>
      </div>
    </div>
  );
}

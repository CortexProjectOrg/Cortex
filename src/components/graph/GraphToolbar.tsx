import { GitFork, Layers, Network, Search, Workflow, X } from 'lucide-react';
import { TOPICS } from '../../lib/curriculumCatalog';

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
      className="graph-toolbar"
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
      <div className="graph-query">
        {/* Search Field */}
        <div className="search-field small" style={{ flex: 1, minWidth: 0 }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search lectures"
            aria-label="Search knowledge map"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Topic Select */}
        <select
          aria-label="Topic"
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          style={{
            border: '1px solid var(--line)',
            background: 'var(--bg)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '11px',
            color: 'var(--ink)'
          }}
        >
          <option value="all">All topics</option>
          {TOPICS.map((t) => (
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
            { key: 'completed', label: `Done (${stats.completed})` },
            { key: 'locked', label: `Locked (${stats.locked})` }
          ] as const
        ).map((tab) => (
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
            aria-pressed={statusFilter === tab.key}
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
          aria-pressed={viewMode === 'hierarchical'}
          onClick={() => setViewMode('hierarchical')}
          title="Browse by topic"
        >
          <Layers size={14} /> Topics
        </button>
        <button
          type="button"
          className={viewMode === 'canvas' ? 'selected' : ''}
          aria-pressed={viewMode === 'canvas'}
          onClick={() => setViewMode('canvas')}
          title="Explore prerequisite connections"
        >
          <Network size={14} /> Graph
        </button>
        <button
          type="button"
          className={viewMode === 'ramifications' ? 'selected' : ''}
          aria-pressed={viewMode === 'ramifications'}
          onClick={() => setViewMode('ramifications')}
          title="Prerequisites and next lectures"
        >
          <Workflow size={14} /> Connections
        </button>
        <button
          type="button"
          className={viewMode === 'stratified' ? 'selected' : ''}
          aria-pressed={viewMode === 'stratified'}
          onClick={() => setViewMode('stratified')}
          title="Browse by prerequisite level"
        >
          <GitFork size={14} /> Levels
        </button>
      </div>
    </div>
  );
}

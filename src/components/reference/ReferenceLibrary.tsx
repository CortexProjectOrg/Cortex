import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Code2, BookOpen, Bookmark, ArrowUpRight, Check } from 'lucide-react';
import { documents, kinds } from '../../lib/content';
import { docRoute } from '../../lib/model';
import { useWorkspace } from '../../lib/workspace';

const join = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

export function ReferenceLibrary() {
  const { data } = useWorkspace();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = documents.filter(
    doc =>
      (filter === 'all' || filter === 'bookmarks'
        ? filter !== 'bookmarks' || data.bookmarks.includes(doc.id)
        : doc.kind === filter) &&
      (!query || `${doc.title} ${doc.text}`.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="page library">
      <span className="eyebrow">THE REFERENCE SHELF</span>
      <div className="page-title-row">
        <div>
          <h1>Reference Shelf</h1>
          <p>Codebase architecture maps, glossaries, and practice guides.</p>
        </div>
        <span className="library-count">
          {documents.length}
          <span>study pages</span>
        </span>
      </div>

      <div className="library-controls">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search library"
            placeholder="Find a topic, an equation, a question…"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </label>
        <div className="filter-tabs">
          {[
            ['all', 'All pages'],
            ['guide', 'Guides'],
            ['theory', 'Theory'],
            ['code', 'Code tours'],
            ['bookmarks', 'Saved']
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={filter === id ? 'active' : ''}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="library-grid">
        {filtered.map(doc => (
          <Link className="library-card" key={doc.id} to={docRoute(doc.id)}>
            <div className="library-card-top">
              <span className={join('kind-label', doc.kind)}>
                {doc.kind === 'code' ? (
                  <Code2 size={13} />
                ) : (
                  <BookOpen size={13} />
                )}
                {kinds[doc.kind] || 'Reference'}
              </span>
              {data.bookmarks.includes(doc.id) ? (
                <Bookmark size={15} fill="currentColor" />
              ) : (
                <ArrowUpRight size={16} />
              )}
            </div>
            <h3>{doc.title}</h3>
            <p>
              Reference & orientation · {doc.minutes} min read
            </p>
            {data.read.includes(doc.id) && (
              <span className="read-label">
                <Check size={12} /> Read
              </span>
            )}
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon"><Search /></span>
          <h3>No pages found</h3>
          <p>Try a different word or choose another category.</p>
        </div>
      )}
    </div>
  );
}

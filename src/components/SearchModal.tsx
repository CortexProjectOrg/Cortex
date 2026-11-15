import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, FileText, PencilLine, ArrowUpRight } from 'lucide-react';
import { ALL_LECTURES } from '../lib/curriculum';
import { documents } from '../lib/content';
import { docRoute } from '../lib/model';
import { useWorkspace } from '../lib/workspace';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const { data } = useWorkspace();

  const lectureMatches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ALL_LECTURES.filter(
      l =>
        l.title.toLowerCase().includes(q) ||
        l.question.toLowerCase().includes(q) ||
        l.content.theory.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  const docMatches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return documents
      .filter(doc => `${doc.title} ${doc.text}`.toLowerCase().includes(q))
      .slice(0, 4);
  }, [query]);

  const noteMatches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return data.notes
      .filter(note => `${note.title} ${note.body}`.toLowerCase().includes(q))
      .slice(0, 4);
  }, [query, data.notes]);

  if (!open) return null;

  return (
    <dialog open className="modal search-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-inner">
        <label className="search-field">
          <Search size={19} />
          <input
            autoFocus
            aria-label="Search all study material"
            placeholder="Try “symplectic”, “Lanczos”, “Clifford”, or “AQUIRE”…"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <button type="button" className="icon-button" onClick={onClose}>
            ✕
          </button>
        </label>
        <div className="search-results">
          {!query && (
            <p className="search-hint">Search 60 lectures, reference shelf, and your own notes.</p>
          )}
          {query &&
            lectureMatches.length === 0 &&
            docMatches.length === 0 &&
            noteMatches.length === 0 && (
              <p className="search-hint">No matches found for “{query}”.</p>
            )}

          {lectureMatches.map(l => (
            <Link
              key={l.id}
              to={`/topics/${l.topicId}/${l.id}`}
              onClick={onClose}
              style={{ textDecoration: 'none' }}
            >
              <span className="search-result-icon">
                <BookOpen size={18} />
              </span>
              <div>
                <strong>{l.title}</strong>
                <span>
                  Pack {l.packNumber ?? l.sundaySession}, Slot {l.packSlot ?? l.sundaySlot} · 60 min
                </span>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          ))}

          {docMatches.map(doc => (
            <Link key={doc.id} to={docRoute(doc.id)} onClick={onClose} style={{ textDecoration: 'none' }}>
              <span className="search-result-icon">
                <FileText size={18} />
              </span>
              <div>
                <strong>{doc.title}</strong>
                <span>Reference Shelf</span>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          ))}

          {noteMatches.map(note => (
            <Link key={note.id} to={`/notes/${note.id}`} onClick={onClose} style={{ textDecoration: 'none' }}>
              <span className="search-result-icon">
                <PencilLine size={18} />
              </span>
              <div>
                <strong>{note.title}</strong>
                <span>From your notebook</span>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </div>
    </dialog>
  );
}

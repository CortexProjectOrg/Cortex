import { ArrowUpRight, BookOpen, FileText, PencilLine, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { documents } from '../lib/content';
import { ALL_LECTURES, TOPICS } from '../lib/curriculum';
import { docRoute } from '../lib/model';
import {
  discoverTopics,
  getTopicSubfield,
  matchesStudyQuery,
  SUBFIELDS,
  topicSearchTerms
} from '../lib/topicDiscovery';
import { useWorkspace } from '../lib/workspace';
import { SubfieldIcon } from './SubfieldIcon';
import { Modal } from './ui/Modal';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const { data } = useWorkspace();
  const hasQuery = Boolean(query.trim());
  const topicMatches = useMemo(() => (hasQuery ? discoverTopics(query) : []), [query, hasQuery]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const lectureMatches = useMemo(() => {
    if (!query.trim()) return [];
    return ALL_LECTURES.map((lecture) => {
      const topic = TOPICS.find((item) => item.id === lecture.topicId)!;
      const metadata = [lecture.title, lecture.question, lecture.subtitle, ...topicSearchTerms(topic)];
      const score = matchesStudyQuery(query, lecture.title)
        ? 3
        : matchesStudyQuery(query, ...metadata)
          ? 2
          : matchesStudyQuery(query, ...metadata, lecture.content.theory)
            ? 1
            : 0;
      return { lecture, score };
    })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((match) => match.lecture);
  }, [query]);

  const docMatches = useMemo(() => {
    if (!query.trim()) return [];
    return documents.filter((doc) => matchesStudyQuery(query, doc.title, doc.text));
  }, [query]);

  const noteMatches = useMemo(() => {
    if (!query.trim()) return [];
    return data.notes.filter((note) => matchesStudyQuery(query, note.title, note.body));
  }, [query, data.notes]);

  const filters = [
    {
      id: 'all',
      label: 'All',
      count: topicMatches.length + lectureMatches.length + docMatches.length + noteMatches.length
    },
    { id: 'topics', label: 'Topics', count: topicMatches.length },
    { id: 'lectures', label: 'Lectures', count: lectureMatches.length },
    { id: 'references', label: 'References', count: docMatches.length },
    { id: 'notes', label: 'Notes', count: noteMatches.length }
  ];
  const resultCount = filters.find((filter) => filter.id === kind)!.count;
  const limit = kind === 'all' ? 4 : undefined;

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} label="Search" className="search-modal">
      <div className="modal-inner">
        <div className="search-dialog-heading">
          <h2>Find something to study</h2>
          <button type="button" className="icon-button" aria-label="Close search" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <label className="search-field">
          <Search size={19} aria-hidden="true" />
          <input
            ref={inputRef}
            autoFocus
            aria-label="Search all study material"
            placeholder="Search a subfield, topic, lecture, or note…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              type="button"
              className="icon-button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </label>
        {!hasQuery ? (
          <div className="search-discover">
            <p className="search-hint">Browse a subfield</p>
            <div className="search-subfields">
              {SUBFIELDS.map((field) => (
                <Link key={field.id} to={`/topics?field=${field.id}`} onClick={onClose}>
                  <SubfieldIcon field={field} size={17} />
                  <span>{field.title}</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              ))}
            </div>
            <p className="search-hint">Try a concept</p>
            <div className="search-suggestions">
              {['Bayes', 'Group theory', 'Complexity theory', 'Entanglement'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setQuery(suggestion);
                    setKind('all');
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="search-kind-filters" role="group" aria-label="Result type">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={kind === filter.id}
                  className={kind === filter.id ? 'selected' : ''}
                  onClick={() => setKind(filter.id)}
                >
                  {filter.label}
                  <span>{filter.count}</span>
                </button>
              ))}
            </div>
            <p className="search-hint" role="status">
              {resultCount} {resultCount === 1 ? 'result' : 'results'} for “{query.trim()}”
            </p>
            <div className="search-results">
              {resultCount === 0 && (
                <div className="search-empty">
                  <Search size={25} aria-hidden="true" />
                  <strong>No matches here</strong>
                  <p>
                    Try a broader term
                    {kind !== 'all' ? ' or switch to All results' : ', such as “algebra” or “quantum”'}.
                  </p>
                </div>
              )}
              {(kind === 'all' || kind === 'topics') && topicMatches.length > 0 && (
                <section aria-label="Topic results">
                  <div className="search-section-heading">
                    <h3>Topics</h3>
                    {kind === 'all' && topicMatches.length > 4 && (
                      <button type="button" className="text-button" onClick={() => setKind('topics')}>
                        View all {topicMatches.length}
                      </button>
                    )}
                  </div>
                  {topicMatches.slice(0, limit).map((topic) => (
                    <Link
                      key={topic.id}
                      to={`/topics?field=${getTopicSubfield(topic.id).id}#${topic.id}`}
                      onClick={onClose}
                    >
                      <SubfieldIcon field={getTopicSubfield(topic.id)} size={18} />
                      <div>
                        <strong>{topic.title}</strong>
                        <span>
                          {getTopicSubfield(topic.id).title} · {topic.lectureIds.length} lectures
                        </span>
                      </div>
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </Link>
                  ))}
                </section>
              )}
              {(kind === 'all' || kind === 'lectures') && lectureMatches.length > 0 && (
                <section aria-label="Lecture results">
                  <div className="search-section-heading">
                    <h3>Lectures</h3>
                    {kind === 'all' && lectureMatches.length > 4 && (
                      <button type="button" className="text-button" onClick={() => setKind('lectures')}>
                        View all {lectureMatches.length}
                      </button>
                    )}
                  </div>
                  {lectureMatches.slice(0, limit).map((l) => (
                    <Link key={l.id} to={`/topics/${l.topicId}/${l.id}`} onClick={onClose}>
                      <SubfieldIcon field={getTopicSubfield(l.topicId)} size={18} />
                      <div>
                        <strong>{l.title}</strong>
                        <span>
                          {getTopicSubfield(l.topicId).title} · ~{l.durationMinutes} min
                        </span>
                      </div>
                      <ArrowUpRight size={17} />
                    </Link>
                  ))}
                </section>
              )}

              {(kind === 'all' || kind === 'references') && docMatches.length > 0 && (
                <section aria-label="Reference results">
                  <div className="search-section-heading">
                    <h3>References</h3>
                    {kind === 'all' && docMatches.length > 4 && (
                      <button type="button" className="text-button" onClick={() => setKind('references')}>
                        View all {docMatches.length}
                      </button>
                    )}
                  </div>
                  {docMatches.slice(0, limit).map((doc) => (
                    <Link key={doc.id} to={docRoute(doc.id)} onClick={onClose}>
                      <span className="search-result-icon">
                        <FileText size={18} />
                      </span>
                      <div>
                        <strong>{doc.title}</strong>
                        <span>Library</span>
                      </div>
                      <ArrowUpRight size={17} />
                    </Link>
                  ))}
                </section>
              )}

              {(kind === 'all' || kind === 'notes') && noteMatches.length > 0 && (
                <section aria-label="Note results">
                  <div className="search-section-heading">
                    <h3>Notes</h3>
                    {kind === 'all' && noteMatches.length > 4 && (
                      <button type="button" className="text-button" onClick={() => setKind('notes')}>
                        View all {noteMatches.length}
                      </button>
                    )}
                  </div>
                  {noteMatches.slice(0, limit).map((note) => (
                    <Link key={note.id} to={`/notes/${note.id}`} onClick={onClose}>
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
                </section>
              )}
            </div>
          </>
        )}
        <div className="search-dialog-footer">
          <BookOpen size={14} aria-hidden="true" />
          <span>Search across your study material</span>
          <span>
            <kbd>Esc</kbd> to close
          </span>
        </div>
      </div>
    </Modal>
  );
}

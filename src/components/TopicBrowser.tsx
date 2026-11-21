import { ArrowRight, Check, Layers, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ALL_LECTURES, LECTURE_MAP, TOPICS } from '../lib/curriculumCatalog';
import { lectureRoute } from '../lib/model';
import { discoverTopics, getTopicSubfield, SUBFIELDS } from '../lib/topicDiscovery';
import { useWorkspace } from '../lib/workspace';
import { SubfieldIcon } from './SubfieldIcon';

export function TopicBrowser() {
  const { data } = useWorkspace();
  const { hash } = useLocation();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const selectedField = SUBFIELDS.find((field) => field.id === params.get('field'));
  const active = TOPICS.find((topic) => `#${topic.id}` === hash);
  const matches = discoverTopics(query, selectedField?.id);
  const groups = SUBFIELDS.map((field) => ({
    field,
    topics: matches.filter((topic) => getTopicSubfield(topic.id).id === field.id)
  })).filter((group) => group.topics.length > 0);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'nearest' });
  }, [hash]);

  function resetFilters() {
    setQuery('');
    setParams({}, { preventScrollReset: true });
  }

  return (
    <div className="page topics-page">
      <div className="page-title-row">
        <h1>Topics</h1>
        <span className="subtle">
          {TOPICS.length} topics · {ALL_LECTURES.length} lectures
        </span>
      </div>
      <p className="topics-intro">
        Find your next idea. Browse by subfield, or search for a concept you want to understand.
      </p>
      <label className="search-field topic-search">
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          aria-label="Search topics and lectures"
          placeholder="Try probability, group theory, or Grover…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button
            type="button"
            className="icon-button"
            aria-label="Clear topic search"
            onClick={() => setQuery('')}
          >
            <X size={17} />
          </button>
        )}
      </label>

      <div className="subfield-filters" role="group" aria-label="Filter by subfield">
        <button
          type="button"
          className={`subfield-filter ${!selectedField ? 'selected' : ''}`}
          aria-pressed={!selectedField}
          onClick={() => setParams({}, { preventScrollReset: true })}
        >
          <span className="subfield-icon sage" aria-hidden="true">
            <Layers size={20} />
          </span>
          <span>
            <strong>All subfields</strong>
            <small>{TOPICS.length} topics</small>
          </span>
        </button>
        {SUBFIELDS.map((field) => (
          <button
            key={field.id}
            type="button"
            className={`subfield-filter ${selectedField?.id === field.id ? 'selected' : ''}`}
            aria-pressed={selectedField?.id === field.id}
            onClick={() => setParams({ field: field.id }, { preventScrollReset: true })}
            title={field.description}
          >
            <SubfieldIcon field={field} />
            <span>
              <strong>{field.title}</strong>
              <small>
                {field.topicIds.length} {field.topicIds.length === 1 ? 'topic' : 'topics'}
              </small>
            </span>
          </button>
        ))}
      </div>

      <div className="topic-results-heading">
        <p role="status">
          {matches.length} {matches.length === 1 ? 'topic' : 'topics'}
          {selectedField ? ` in ${selectedField.title}` : ' across all subfields'}
          {query.trim() ? ` matching “${query.trim()}”` : ''}
        </p>
        {(query || selectedField) && (
          <button type="button" className="text-button" onClick={resetFilters}>
            Reset filters <X size={14} />
          </button>
        )}
      </div>
      {matches.length === 0 && (
        <div className="topic-empty">
          <Search size={28} aria-hidden="true" />
          <h2>No topics found</h2>
          <p>Try a broader term, a lecture title, or another subfield.</p>
          <button type="button" className="button secondary small" onClick={resetFilters}>
            Show all topics
          </button>
        </div>
      )}

      <div className="topic-groups">
        {groups.map(({ field, topics }) => (
          <section key={field.id} className="topic-group" aria-labelledby={`subfield-${field.id}`}>
            <div className="topic-group-heading">
              <SubfieldIcon field={field} />
              <div>
                <h2 id={`subfield-${field.id}`}>{field.title}</h2>
                <p>{field.description}</p>
              </div>
            </div>
            <div className="topic-card-grid">
              {topics.map((topic) => {
                const completed = topic.lectureIds.filter((id) => data.completedLectures.includes(id)).length;
                const expanded = active?.id === topic.id;
                return (
                  <div key={topic.id} id={topic.id} className={`topic-card ${expanded ? 'expanded' : ''}`}>
                    <button
                      type="button"
                      className="topic-card-trigger"
                      aria-expanded={expanded}
                      aria-controls={`lectures-${topic.id}`}
                      onClick={() =>
                        navigate(
                          { search: params.toString(), hash: expanded ? '' : `#${topic.id}` },
                          { preventScrollReset: true }
                        )
                      }
                    >
                      <SubfieldIcon field={field} size={19} />
                      <span className="topic-card-copy">
                        <strong>{topic.title}</strong>
                        <span>{topic.description}</span>
                        <small>
                          {topic.lectureIds.length} {topic.lectureIds.length === 1 ? 'lecture' : 'lectures'} ·{' '}
                          {completed}/{topic.lectureIds.length} complete
                        </small>
                      </span>
                      <ArrowRight size={18} className="topic-card-arrow" aria-hidden="true" />
                    </button>
                    <div id={`lectures-${topic.id}`} hidden={!expanded} className="topic-lecture-list">
                      {expanded &&
                        topic.lectureIds.map((id) => {
                          const lecture = LECTURE_MAP.get(id)!;
                          const done = data.completedLectures.includes(id);
                          return (
                            <Link key={id} to={lectureRoute(topic.id, id)}>
                              {done ? (
                                <Check size={16} aria-label="Completed" />
                              ) : (
                                <span className="lecture-number">{lecture.lectureNumber}</span>
                              )}
                              <strong>{lecture.title}</strong>
                              <span className="subtle">~{lecture.durationMinutes} min</span>
                              <ArrowRight size={14} aria-hidden="true" />
                            </Link>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

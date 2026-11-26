import { Download, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { lectureRoute, makeNote } from '../../lib/model';
import { MAX_PAPER_TREE_BYTES, PAPER_TARGET_ID, paperPlanMarkdown } from '../../lib/paperPlan';
import { usePaperStudySession } from '../../lib/paperStudySession';
import { LectureProgressButtons } from '../ui/StudyControls';
import { getReadiness, getStudyOrder, type StudyNode } from '../../lib/studyGraph';
import { formatStudyTime } from '../../lib/studyTime';
import { useWorkspace } from '../../lib/workspace';
import { MarkdownView } from '../MarkdownView';
import { PaperBranch } from './PaperBranch';
import { DagRamificationExplorer } from '../DagRamificationExplorer';
import '../paperPlanner.css';

export function PaperStudyResult() {
  const { active, revision, updateActive } = usePaperStudySession();
  const { data, loaded, update } = useWorkspace();
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const [exportError, setExportError] = useState('');
  const savedNoteId = active?.savedNoteId ?? null;
  useEffect(() => {
    if (revision) resultHeading.current?.focus();
    setExportError('');
  }, [revision]);
  useEffect(() => {
    if (loaded && savedNoteId && !data.notes.some((note) => note.id === savedNoteId))
      updateActive(revision, (current) => ({ ...current, savedNoteId: null }));
  }, [data.notes, loaded, revision, savedNoteId, updateActive]);

  if (!active)
    return (
      <section className="page study-page">
        <h1>Paper study tree</h1>
        <p>Open a saved tree or build one from a paper to explore its prerequisites.</p>
        <div className="study-actions">
          <Link className="button secondary" to="/papers#open-saved-tree">
            Open saved tree
          </Link>
          <Link className="button primary" to="/papers">
            Build a tree
          </Link>
        </div>
      </section>
    );
  const { plan, evidenceStatus } = active;
  const { graph } = plan;
  const theorem = plan.analysis.theorem!;
  const selected = graph.nodes.get(active.selected) ?? graph.nodes.get(PAPER_TARGET_ID)!;
  const metadata = plan.metadataById.get(selected.id)!;
  const recorded = new Set(data.completedLectures);
  const completed = new Set(active.known);
  for (const node of graph.nodes.values()) {
    if (node.catalogLectureId && recorded.has(node.catalogLectureId)) completed.add(node.id);
  }
  const order = getStudyOrder(graph, PAPER_TARGET_ID, completed);
  const next = order.next ? graph.nodes.get(order.next) : undefined;
  const nextLecture = next ? plan.metadataById.get(next.id)?.lecture : undefined;
  const select = (id: string) => updateActive(revision, (current) => ({ ...current, selected: id }));

  const renderNode = (node: StudyNode) => {
    const status = getReadiness(graph, node.id, completed).status;
    const readiness =
      status === 'completed' ? 'Done' : status === 'ready' ? 'Ready' : 'Prerequisites to study';
    const duration =
      node.minutes !== null && status !== 'completed' ? ` · ${formatStudyTime(node.minutes)}` : '';
    const description = `${readiness}${duration}`;
    return (
      <button
        type="button"
        className={selected.id === node.id ? 'selected' : ''}
        aria-label={node.kind === 'target' ? undefined : `${node.title} ${description}`}
        aria-pressed={selected.id === node.id}
        onClick={() => select(node.id)}
      >
        {node.title}
        {node.kind !== 'target' && <small>{description}</small>}
      </button>
    );
  };

  const exportTree = () => {
    const blob = new Blob([JSON.stringify({ version: 1, analysis: plan.analysis })], {
      type: 'application/json'
    });
    if (blob.size > MAX_PAPER_TREE_BYTES) {
      setExportError('Choose a narrower theorem before exporting.');
      return;
    }
    setExportError('');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'paper-study-tree.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const saveNote = () => {
    const note = makeNote(
      `Study: ${plan.analysis.paperTitle}`,
      undefined,
      undefined,
      paperPlanMarkdown(plan, evidenceStatus)
    );
    update((workspace) => ({ ...workspace, notes: [note, ...workspace.notes] }));
    updateActive(revision, (current) => ({ ...current, savedNoteId: note.id }));
  };

  return (
    <section className="page study-page paper-result" aria-label="Study plan">
      <div className="page-title-row">
        <h1 ref={resultHeading} tabIndex={-1}>
          {plan.analysis.paperTitle}
        </h1>
        <div className="paper-actions">
          <Link className="button secondary small" to="/papers">
            Change paper or theorem
          </Link>
          <button className="button secondary small" type="button" onClick={exportTree}>
            <Download size={15} /> Export tree
          </button>
          {savedNoteId ? (
            <Link className="button secondary small" to={`/notes/${savedNoteId}`}>
              Open study note
            </Link>
          ) : (
            <button className="button secondary small" type="button" onClick={saveNote}>
              <Save size={15} /> Add to notebook
            </button>
          )}
        </div>
      </div>
      {exportError && (
        <p role="alert" className="paper-error">
          {exportError}
        </p>
      )}
      <article className="paper-theorem">
        <h3>{theorem.title}</h3>
        <MarkdownView allowImages={false} source={theorem.statement} />
        <details>
          <summary>
            {evidenceStatus} · {theorem.location}
          </summary>
          <blockquote>{theorem.quote}</blockquote>
        </details>
      </article>
      <div className="paper-study-summary">
        <p>
          {order.remaining.length} remaining · {formatStudyTime(order.remainingMinutes)}
          {order.unknownDurationCount > 0 && ` · ${order.unknownDurationCount} without an estimate`}
        </p>
        {next ? (
          <p>
            Next: {next.title}{' '}
            {nextLecture ? (
              <Link className="text-link" to={lectureRoute(nextLecture.topicId, nextLecture.id)}>
                Read lesson
              </Link>
            ) : (
              <button className="text-button" type="button" onClick={() => select(next.id)}>
                View prerequisite
              </button>
            )}
          </p>
        ) : (
          getReadiness(graph, PAPER_TARGET_ID, completed).status === 'ready' && <p>Ready to read theorem</p>
        )}
      </div>
      <details className="paper-review">
        <summary>Review AI suggestions</summary>
        {plan.warnings.map((warning) => (
          <p key={warning}>{warning}</p>
        ))}
      </details>
      <div className="paper-result-grid">
        <aside>
          <PaperBranch
            graph={graph}
            root={PAPER_TARGET_ID}
            selected={selected.id}
            branches={active.branches}
            inspect={select}
            toggle={(id, d) =>
              updateActive(revision, (current) => ({
                ...current,
                branches: {
                  ...current.branches,
                  [id]: {
                    ...current.branches[id],
                    [d]: !(current.branches[id]?.[d] ?? id === PAPER_TARGET_ID)
                  }
                }
              }))
            }
          />
          <details className="study-disclosure">
            <summary>Study order</summary>
            <nav aria-label="Study order">
              <ol className="paper-study-order">
                {order.remaining.map((id) => (
                  <li key={id}>
                    {renderNode(graph.nodes.get(id)!)}
                    {order.background.has(id) && <small>Background to revisit</small>}
                  </li>
                ))}
              </ol>
              {order.remaining.length === 0 && <p>All prerequisites complete.</p>}
            </nav>
          </details>
        </aside>
        <DagRamificationExplorer graph={graph} id={selected.id} completed={completed} onSelect={select}>
          <article className="paper-lesson" aria-label="Selected lesson">
            <h3>{selected.title}</h3>
            {selected.kind !== 'target' && (
              <div className="paper-actions">
                <button
                  type="button"
                  className="button secondary small"
                  aria-pressed={active.known.has(selected.id)}
                  onClick={() => {
                    updateActive(revision, (current) => {
                      const known = new Set(current.known);
                      if (known.has(selected.id)) known.delete(selected.id);
                      else known.add(selected.id);
                      return { ...current, known };
                    });
                  }}
                >
                  Known for this paper
                </button>
                {metadata.lecture && (
                  <>
                    <Link
                      className="button primary small"
                      to={lectureRoute(metadata.lecture.topicId, metadata.lecture.id)}
                    >
                      Read lesson
                    </Link>
                    <LectureProgressButtons id={metadata.lecture.id} />
                  </>
                )}
              </div>
            )}
            {metadata.concepts.map((concept) => (
              <section key={concept.id} className="paper-concept">
                {(metadata.lecture || metadata.concepts.length > 1) && <h4>{concept.title}</h4>}
                <p>{concept.reason}</p>
                <ul>
                  {concept.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
                <MarkdownView allowImages={false} source={concept.explanation} />
                <h4>Worked example</h4>
                <MarkdownView allowImages={false} source={concept.example} />
                <h4>Practice · {concept.practiceMinutes} min</h4>
                <MarkdownView allowImages={false} source={concept.exercise} />
                {concept.evidence ? (
                  <details>
                    <summary>
                      {evidenceStatus} · {concept.source}
                    </summary>
                    <blockquote>{concept.evidence}</blockquote>
                  </details>
                ) : (
                  <p className="subtle">Background prerequisite</p>
                )}
              </section>
            ))}
            {metadata.suggestions.length > 0 && (
              <section>
                <h4>Possible matches</h4>
                <ul>
                  {metadata.suggestions.map((lecture) => (
                    <li key={lecture.id}>
                      <Link to={lectureRoute(lecture.topicId, lecture.id)}>{lecture.title}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {graph.incoming.get(selected.id)!.length > 0 && (
              <section>
                <h4>Learn first</h4>
                <ul>
                  {graph.incoming.get(selected.id)!.map((id) => {
                    const sources =
                      graph.edges.find(
                        (edge) => edge.prerequisiteId === id && edge.dependentId === selected.id
                      )?.sources ?? [];
                    return (
                      <li key={id}>
                        <button type="button" className="text-button" onClick={() => select(id)}>
                          {graph.nodes.get(id)!.title}
                        </button>
                        {sources.includes('catalog') && (
                          <small> · Catalog{sources.includes('paper') && ' and paper'}</small>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </article>
        </DagRamificationExplorer>
      </div>
    </section>
  );
}

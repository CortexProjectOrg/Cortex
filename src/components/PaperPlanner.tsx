import { Download, FileText, Network, Save, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  analyzePaper,
  DEFAULT_GEMINI_MODEL,
  MAX_PAPER_TEXT,
  readPaperFile,
  type PaperInput
} from '../lib/gemini';
import { buildPaperPlan, paperPlanMarkdown, type PaperPlan } from '../lib/paperPlan';
import { formatStudyTime } from '../lib/studyTime';
import { lectureRoute, makeNote } from '../lib/model';
import { useWorkspace } from '../lib/workspace';
import { MarkdownView } from './MarkdownView';
import './paperPlanner.css';

function PrerequisiteTree({
  plan,
  select,
  selected
}: {
  plan: PaperPlan;
  select: (id: string) => void;
  selected: string;
}) {
  const seen = new Set<string>();
  const branch = (id: string) => {
    const node = plan.nodes.get(id)!;
    const shared = seen.has(id);
    seen.add(id);
    return (
      <li key={id}>
        <button
          type="button"
          className={selected === id ? 'selected' : ''}
          onClick={() => select(id)}
          aria-pressed={selected === id}
        >
          {node.title}
          {shared && <small>Shared prerequisite</small>}
        </button>
        {!shared && !!node.prerequisites.length && (
          <details open>
            <summary>Prerequisites ({node.prerequisites.length})</summary>
            <ul>{node.prerequisites.map(branch)}</ul>
          </details>
        )}
      </li>
    );
  };
  return (
    <nav className="paper-tree" aria-label="Theorem dependency tree">
      <strong>{plan.analysis.theorem?.title}</strong>
      <ul>{plan.roots.map(branch)}</ul>
    </nav>
  );
}

export function PaperPlanner() {
  const { update, data } = useWorkspace();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_GEMINI_MODEL);
  const [sourceText, setSourceText] = useState('');
  const [file, setFile] = useState<PaperInput | null>(null);
  const [fileName, setFileName] = useState('');
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<PaperPlan | null>(null);
  const [selected, setSelected] = useState('');
  const [savedId, setSavedId] = useState('');
  const [view, setView] = useState<'tree' | 'order'>('tree');
  const [editing, setEditing] = useState(false);
  const request = useRef<AbortController | null>(null);
  const fileRequest = useRef(0);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(
    () => () => {
      request.current?.abort();
      fileRequest.current++;
    },
    []
  );
  useEffect(() => {
    if (plan) resultHeading.current?.focus();
  }, [plan]);
  const acceptPlan = (next: PaperPlan) => {
    setPlan(next);
    setSelected(next.order[0] || '');
    setSavedId('');
    setEditing(false);
  };
  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    const controller = new AbortController();
    request.current = controller;
    try {
      const next = await analyzePaper({
        apiKey,
        model: model.trim(),
        paper: file || { kind: 'text', text: sourceText },
        target,
        signal: controller.signal
      });
      if (!controller.signal.aborted) acceptPlan(next);
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(failure instanceof Error ? failure.message : 'Could not generate the tree.');
    } finally {
      if (request.current === controller) {
        setBusy(false);
        request.current = null;
      }
    }
  };
  const selectedNode = plan?.nodes.get(selected);
  return (
    <div className="page paper-planner">
      <div className="page-title-row">
        <h1>Paper study</h1>
        <label className="button secondary small paper-import">
          Open saved tree
          <input
            type="file"
            accept=".json"
            disabled={busy || reading}
            onChange={async (event) => {
              const selectedFile = event.target.files?.[0];
              event.target.value = '';
              if (!selectedFile) return;
              const sequence = ++fileRequest.current;
              setReading(true);
              setError('');
              try {
                if (selectedFile.size > 1_000_000) throw new Error('Choose a saved tree under 1 MB.');
                const input = JSON.parse(await selectedFile.text());
                if (input.version !== 1) throw new Error('This study tree format is not supported.');
                const next = buildPaperPlan(input.analysis);
                if (sequence === fileRequest.current) acceptPlan(next);
              } catch (failure) {
                if (sequence === fileRequest.current)
                  setError(
                    failure instanceof SyntaxError
                      ? 'This file is not a saved study tree.'
                      : failure instanceof Error
                        ? failure.message
                        : 'Could not open this tree.'
                  );
              } finally {
                if (sequence === fileRequest.current) setReading(false);
              }
            }}
          />
        </label>
      </div>
      {plan && (
        <button
          className="button secondary small"
          type="button"
          onClick={() => setEditing((value) => !value)}
        >
          {editing ? 'Close settings' : 'Change paper or theorem'}
        </button>
      )}
      <form onSubmit={generate} className="paper-form" hidden={!!plan && !editing}>
        <fieldset disabled={busy || reading}>
          <legend>Build a prerequisite tree</legend>
          <div className="paper-input-grid">
            <div className="paper-source">
              <label htmlFor="paper-file">Paper file</label>
              <input
                id="paper-file"
                type="file"
                accept=".pdf,.txt,.md,.tex"
                onChange={async (event) => {
                  const selectedFile = event.target.files?.[0];
                  event.target.value = '';
                  if (!selectedFile) return;
                  const sequence = ++fileRequest.current;
                  setReading(true);
                  setError('');
                  setFile(null);
                  setFileName('');
                  try {
                    const next = await readPaperFile(selectedFile);
                    if (sequence === fileRequest.current) {
                      setFile(next);
                      setFileName(selectedFile.name);
                    }
                  } catch (failure) {
                    if (sequence === fileRequest.current)
                      setError(failure instanceof Error ? failure.message : 'Could not read this file.');
                  } finally {
                    if (sequence === fileRequest.current) setReading(false);
                  }
                }}
              />
              <small>PDF, TXT, Markdown, or LaTeX · up to 8 MB</small>
              {file ? (
                <div className="paper-file">
                  <FileText size={18} />
                  <span>{fileName}</span>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Remove paper"
                    onClick={() => {
                      setFile(null);
                      setFileName('');
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <label htmlFor="paper-text">Or paste the theorem and proof</label>
                  <textarea
                    id="paper-text"
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    maxLength={MAX_PAPER_TEXT}
                    rows={7}
                    placeholder="Include definitions, assumptions, and the proof."
                  />
                </>
              )}
            </div>
            <div className="paper-options">
              <label htmlFor="gemini-key">Gemini API key</label>
              <div className="paper-key">
                <input
                  id="gemini-key"
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  maxLength={1024}
                  required
                />
                <button
                  type="button"
                  className="text-button"
                  disabled={!apiKey}
                  onClick={() => setApiKey('')}
                >
                  Clear
                </button>
              </div>
              <small>
                Kept in memory; sent only to Google.{' '}
                <a
                  className="text-link"
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get a key
                </a>
              </small>
              <label htmlFor="paper-target">
                Theorem to study <small>(optional)</small>
              </label>
              <input
                id="paper-target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                maxLength={500}
                placeholder="Main theorem, or e.g. Theorem 3.2"
              />
              <details>
                <summary>Model</summary>
                <label htmlFor="gemini-model">Gemini model ID</label>
                <input
                  id="gemini-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  maxLength={87}
                  required
                />
              </details>
            </div>
          </div>
        </fieldset>
        <div className="paper-actions">
          <button
            className="button primary"
            type="submit"
            disabled={busy || reading || !apiKey.trim() || (!file && sourceText.trim().length < 100)}
          >
            <Network size={17} />
            {busy ? 'Building tree…' : 'Generate tree'}
          </button>
          {busy && (
            <button type="button" className="button secondary" onClick={() => request.current?.abort()}>
              Cancel
            </button>
          )}
          <small>Your paper is sent to Gemini. Your API usage may incur charges.</small>
        </div>
        {(busy || reading) && (
          <p role="status">{reading ? 'Reading paper…' : 'Identifying the theorem and its prerequisites…'}</p>
        )}
      </form>
      {error && (
        <p className="paper-error" role="alert">
          {error}
        </p>
      )}
      {plan && (
        <section className="paper-result" aria-label="Study plan">
          <div className="page-title-row">
            <h2 ref={resultHeading} tabIndex={-1}>
              {plan.analysis.paperTitle}
            </h2>
            <div className="paper-actions">
              <button
                type="button"
                className="button small secondary"
                onClick={() => {
                  const blob = new Blob([JSON.stringify({ version: 1, analysis: plan.analysis }, null, 2)], {
                    type: 'application/json'
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'paper-study-tree.json';
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                <Download size={15} />
                Export tree
              </button>
              <button
                type="button"
                className="button small secondary"
                disabled={!!savedId}
                onClick={() => {
                  const note = makeNote(
                    `Study: ${plan.analysis.paperTitle}`,
                    undefined,
                    undefined,
                    paperPlanMarkdown(plan)
                  );
                  update((ws) => ({ ...ws, notes: [note, ...ws.notes] }));
                  setSavedId(note.id);
                }}
              >
                <Save size={15} />
                {savedId ? 'Added to notebook' : 'Add to notebook'}
              </button>
            </div>
          </div>
          {savedId && (
            <p role="status">
              <Link className="text-link" to={`/notes/${savedId}`}>
                Open study note
              </Link>
            </p>
          )}
          {plan.analysis.theorem ? (
            <>
              <article className="paper-theorem">
                <span className="eyebrow">Target theorem</span>
                <h3>{plan.analysis.theorem.title}</h3>
                <MarkdownView allowImages={false} source={plan.analysis.theorem.statement} />
                <details>
                  <summary>Paper evidence · {plan.analysis.theorem.location}</summary>
                  <blockquote>{plan.analysis.theorem.quote}</blockquote>
                </details>
              </article>
              <p className="subtle">
                {plan.order.length} lessons · ~{formatStudyTime(plan.totalMinutes)} including practice
              </p>
              <details className="paper-review">
                <summary>Review AI suggestions</summary>
                {plan.warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </details>
              <div className="paper-result-grid">
                <aside>
                  <div className="paper-view-switch" role="group" aria-label="Plan view">
                    <button
                      type="button"
                      className={view === 'tree' ? 'selected' : ''}
                      aria-pressed={view === 'tree'}
                      onClick={() => setView('tree')}
                    >
                      Dependencies
                    </button>
                    <button
                      type="button"
                      className={view === 'order' ? 'selected' : ''}
                      aria-pressed={view === 'order'}
                      onClick={() => setView('order')}
                    >
                      Study order
                    </button>
                  </div>
                  {view === 'tree' ? (
                    <PrerequisiteTree plan={plan} selected={selected} select={setSelected} />
                  ) : (
                    <nav aria-label="Study order">
                      <ol className="paper-study-order">
                        {plan.order.map((id) => {
                          const node = plan.nodes.get(id)!;
                          return (
                            <li key={id}>
                              <button
                                type="button"
                                className={selected === id ? 'selected' : ''}
                                aria-pressed={selected === id}
                                onClick={() => setSelected(id)}
                              >
                                {node.title}
                                <small>
                                  {node.lecture && data.completedLectures.includes(node.lecture.id)
                                    ? 'Done'
                                    : `~${formatStudyTime(node.minutes)}`}
                                </small>
                              </button>
                            </li>
                          );
                        })}
                      </ol>
                    </nav>
                  )}
                </aside>
                <article className="paper-lesson" aria-label="Selected lesson">
                  {selectedNode && (
                    <>
                      <span className="eyebrow">{selectedNode.concept?.topic || 'Course prerequisite'}</span>
                      <h3>{selectedNode.title}</h3>
                      <p className="subtle">
                        ~{formatStudyTime(selectedNode.minutes)} ·{' '}
                        {selectedNode.concept ? 'AI lesson draft' : 'Course prerequisite'}
                      </p>
                      {selectedNode.lecture && (
                        <Link
                          className="button primary small"
                          to={lectureRoute(selectedNode.lecture.topicId, selectedNode.lecture.id)}
                        >
                          Read lecture
                        </Link>
                      )}
                      {selectedNode.concept && (
                        <>
                          <p>{selectedNode.concept.reason}</p>
                          <ul>
                            {selectedNode.concept.objectives.map((goal) => (
                              <li key={goal}>{goal}</li>
                            ))}
                          </ul>
                          <MarkdownView allowImages={false} source={selectedNode.concept.explanation} />
                          <h4>Worked example</h4>
                          <MarkdownView allowImages={false} source={selectedNode.concept.example} />
                          <h4>Practice · {selectedNode.concept.practiceMinutes} min</h4>
                          <MarkdownView allowImages={false} source={selectedNode.concept.exercise} />
                          <details>
                            <summary>Dependency evidence</summary>
                            <p>{selectedNode.concept.source}</p>
                            {selectedNode.concept.evidence && (
                              <blockquote>{selectedNode.concept.evidence}</blockquote>
                            )}
                          </details>
                        </>
                      )}
                      {!!selectedNode.prerequisites.length && (
                        <>
                          <h4>Learn first</h4>
                          <ul>
                            {selectedNode.prerequisites.map((id) => (
                              <li key={id}>
                                <button type="button" className="text-button" onClick={() => setSelected(id)}>
                                  {plan.nodes.get(id)!.title}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </>
                  )}
                </article>
              </div>
            </>
          ) : (
            <p role="status">{plan.analysis.explanation}</p>
          )}
        </section>
      )}
    </div>
  );
}

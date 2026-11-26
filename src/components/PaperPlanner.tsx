import { FileText, Network, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { analyzePaper, describePaperAnalysisError, MAX_PAPER_TEXT, readPaperFile } from '../lib/gemini';
import { buildPaperPlan, MAX_PAPER_TREE_BYTES, type PaperPlan } from '../lib/paperPlan';
import { usePaperStudySession, type EvidenceStatus } from '../lib/paperStudySession';
import { Link, useNavigate } from 'react-router-dom';
import './paperPlanner.css';

interface PendingProposal {
  plan: PaperPlan;
  target: string;
  evidenceStatus: EvidenceStatus;
  revision: number;
}

export function PaperPlanner() {
  const { active, revision, acceptPlan, draft, editDraft } = usePaperStudySession();
  const navigate = useNavigate();
  const { apiKey, model, sourceText, file, fileName, target } = draft;
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [guidance, setGuidance] = useState('');
  const [proposal, setProposal] = useState<PendingProposal | null>(null);
  const request = useRef<AbortController | null>(null);
  const fileRequest = useRef(0);
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  useEffect(
    () => () => {
      request.current?.abort();
      fileRequest.current++;
    },
    []
  );
  useEffect(() => {
    if (proposal?.revision === revision) confirmationHeading.current?.focus();
  }, [proposal, revision]);
  const showResult = (plan: PaperPlan, evidenceStatus: EvidenceStatus, expectedRevision?: number) => {
    if (!plan.graph || !plan.analysis.theorem) {
      setGuidance(plan.analysis.explanation);
      return;
    }
    setProposal(null);
    setGuidance('');
    acceptPlan(plan, evidenceStatus, expectedRevision);
    navigate('/papers/result');
  };
  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (request.current || reading) return;
    setError('');
    setGuidance('');
    setProposal(null);
    setBusy(true);
    const paper = file ?? { kind: 'text' as const, text: sourceText };
    const requested = target.trim();
    const evidenceStatus = paper.kind === 'text' ? 'Checked against text' : 'Check in paper';
    const controller = new AbortController();
    request.current = controller;
    try {
      const next = await analyzePaper({
        apiKey,
        model: model.trim(),
        paper,
        target: requested,
        signal: controller.signal
      });
      if (controller.signal.aborted) return;
      if (requested && next.graph && next.analysis.theorem) {
        setProposal({ plan: next, target: requested, evidenceStatus, revision });
      } else {
        showResult(next, evidenceStatus);
      }
    } catch (failure) {
      if (!controller.signal.aborted) setError(describePaperAnalysisError(failure));
    } finally {
      if (request.current === controller) {
        setBusy(false);
        request.current = null;
      }
    }
  };
  return (
    <section className="page study-page paper-planner" aria-label="Paper to tree">
      <div className="page-title-row">
        <h1>Paper to Tree</h1>
        {active && (
          <Link className="button secondary small" to="/papers/result">
            Resume paper
          </Link>
        )}
        <label className="button secondary small paper-import">
          Open saved tree
          <input
            id="open-saved-tree"
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
              setGuidance('');
              try {
                if (selectedFile.size > MAX_PAPER_TREE_BYTES) {
                  if (sequence === fileRequest.current) setError('Choose a saved tree under 1 MB.');
                  return;
                }
                const input = JSON.parse(await selectedFile.text());
                if (input?.version !== 1) {
                  if (sequence === fileRequest.current) setError('This study tree format is not supported.');
                  return;
                }
                const next = buildPaperPlan(input.analysis);
                if (sequence === fileRequest.current) showResult(next, 'Check in paper');
              } catch {
                if (sequence === fileRequest.current) setError('This file is not a valid saved study tree.');
              } finally {
                if (sequence === fileRequest.current) setReading(false);
              }
            }}
          />
        </label>
      </div>
      <form onSubmit={generate} className="paper-form">
        <fieldset disabled={busy || reading} aria-label="Build a prerequisite tree">
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
                  setProposal(null);
                  editDraft({ file: null });
                  editDraft({ fileName: '' });
                  try {
                    const next = await readPaperFile(selectedFile);
                    if (sequence === fileRequest.current) {
                      editDraft({ file: next });
                      editDraft({ fileName: selectedFile.name });
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
                      setProposal(null);
                      editDraft({ file: null });
                      editDraft({ fileName: '' });
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
                    onChange={(event) => {
                      setProposal(null);
                      editDraft({ sourceText: event.target.value });
                    }}
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
                  onChange={(e) => editDraft({ apiKey: e.target.value })}
                  maxLength={1024}
                  required
                />
                <button
                  type="button"
                  className="text-button"
                  disabled={!apiKey}
                  onClick={() => editDraft({ apiKey: '' })}
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
                onChange={(event) => {
                  setProposal(null);
                  editDraft({ target: event.target.value });
                }}
                maxLength={500}
                placeholder="Main theorem, or e.g. Theorem 3.2"
              />
              <details>
                <summary>Model</summary>
                <label htmlFor="gemini-model">Gemini model ID</label>
                <input
                  id="gemini-model"
                  value={model}
                  onChange={(e) => editDraft({ model: e.target.value })}
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
      {guidance && <p role="status">{guidance}</p>}
      {proposal && proposal.revision === revision && (
        <section className="paper-target-review" aria-label="Confirm theorem">
          <p>Requested: {proposal.target}</p>
          <h2 ref={confirmationHeading} tabIndex={-1}>
            {proposal.plan.analysis.theorem!.title}
          </h2>
          <p>
            {proposal.evidenceStatus} · {proposal.plan.analysis.theorem!.location}
          </p>
          <blockquote>{proposal.plan.analysis.theorem!.quote}</blockquote>
          <button
            type="button"
            className="button primary small"
            disabled={busy || reading}
            onClick={() => {
              showResult(proposal.plan, proposal.evidenceStatus, proposal.revision);
            }}
          >
            Use this theorem
          </button>
        </section>
      )}
    </section>
  );
}

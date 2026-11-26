import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { ALL_LECTURES, FOUR_HOUR_MASTERY_PATH, LECTURE_MAP } from '../lib/curriculumCatalog';
import { getKnowledgeDAG, projectCatalogStudyGraph } from '../lib/knowledgeGraph';
import { getReadiness, getShortestRoute, getStudyOrder } from '../lib/studyGraph';
import { trackAnchor } from '../lib/studyDashboard';
import { formatStudyTime } from '../lib/studyTime';
import { lectureRoute } from '../lib/model';
import { usePaperStudySession } from '../lib/paperStudySession';
import { useWorkspace } from '../lib/workspace';
import { DagRamificationExplorer } from './DagRamificationExplorer';
import { InteractiveDagCanvas, type CanvasSnapshot } from './InteractiveDagCanvas';
import { LectureProgressButtons } from './ui/StudyControls';
import { Modal } from './ui/Modal';
import { useMediaQuery } from './ui/useMediaQuery';
import './knowledgeMap.css';

const graph = projectCatalogStudyGraph(getKnowledgeDAG());
const lectureUrl = (id: string) => '/connections/lecture/' + encodeURIComponent(id);
export function LegacyTree() {
  const { active } = usePaperStudySession();
  const location = useLocation(),
    q = new URLSearchParams(location.search),
    id = q.get('focus');
  return (
    <Navigate
      replace
      to={
        (q.get('study') === 'paper'
          ? active
            ? '/papers/result'
            : '/papers'
          : id && graph.nodes.has(id)
            ? lectureUrl(id)
            : '/graph') + location.hash
      }
    />
  );
}
function CatalogConnections({
  id,
  select,
  track
}: {
  id: string;
  select: (id: string) => void;
  track?: Set<string>;
}) {
  const { data } = useWorkspace(),
    lecture = LECTURE_MAP.get(id)!;
  const done = useMemo(() => new Set(data.completedLectures), [data.completedLectures]);
  const readiness = getReadiness(graph, id, done),
    order = getStudyOrder(graph, id, done);
  const [start, setStart] = useState('');
  const route = start ? getShortestRoute(graph, start, id) : [];
  return (
    <>
      <DagRamificationExplorer graph={graph} id={id} completed={done} onSelect={select} track={track}>
        <div className="section-title">
          <h2>{lecture.title}</h2>
        </div>
        <p className="subtle">
          {'Lecture ' +
            lecture.lectureNumber +
            ' · ' +
            formatStudyTime(lecture.durationMinutes) +
            ' · Pack ' +
            lecture.packNumber}
        </p>
        <p>{lecture.question}</p>
        <p>
          {readiness.status === 'completed'
            ? 'Completed'
            : data.lectureProgress[id]?.startedAt
              ? 'In progress'
              : readiness.status === 'ready'
                ? 'Ready to study'
                : readiness.missingPrereqs.length + ' prerequisites to study'}
        </p>
        <div className="study-actions">
          <Link className="button primary small" to={lectureRoute(lecture.topicId, id)}>
            Read lecture
          </Link>
          <LectureProgressButtons id={id} />
        </div>
      </DagRamificationExplorer>
      <div className="study-actions">
        <Link className="text-link" to={'/graph?focus=' + encodeURIComponent(id)}>
          Open in graph
        </Link>
      </div>
      <details className="study-disclosure">
        <summary>Study order</summary>
        <ol>
          {order.ordered.map((key) => (
            <li key={key}>
              <button className="text-button" onClick={() => select(key)}>
                {graph.nodes.get(key)!.title}
              </button>{' '}
              {done.has(key) ? 'Done' : order.background.has(key) ? 'Background to revisit' : ''}
            </li>
          ))}
        </ol>
      </details>
      <details className="study-disclosure">
        <summary>Compare a starting lecture</summary>
        <label>
          Starting lecture{' '}
          <select value={start} onChange={(e) => setStart(e.target.value)}>
            <option value="">Choose a lecture</option>
            {ALL_LECTURES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        {start &&
          (route.length ? (
            <ol>
              {route.map((n) => (
                <li key={n}>{graph.nodes.get(n)!.title}</li>
              ))}
            </ol>
          ) : (
            <p>No directed prerequisite route connects these lectures.</p>
          ))}
      </details>
      {!!lecture.softLinks?.length && (
        <details className="study-disclosure">
          <summary>Related lectures</summary>
          {lecture.softLinks
            .filter((l) => graph.nodes.has(l.targetId))
            .map((l) => (
              <button key={l.targetId} className="study-row text-button" onClick={() => select(l.targetId)}>
                {graph.nodes.get(l.targetId)!.title} · {l.relationship}
              </button>
            ))}
        </details>
      )}
    </>
  );
}
export function ConnectionsPage() {
  const { lectureId, trackId } = useParams(),
    [q] = useSearchParams(),
    navigate = useNavigate(),
    { data } = useWorkspace();
  const pack = FOUR_HOUR_MASTERY_PATH.packs.find((p) => String(p.packNumber) === trackId);
  const focus = q.get('focus');
  const id = pack
    ? focus && graph.nodes.has(focus)
      ? focus
      : trackAnchor(pack.lectureIds, data.completedLectures)
    : lectureId;
  const select = (key: string) =>
    navigate(
      pack ? '/connections/track/' + pack.packNumber + '?focus=' + encodeURIComponent(key) : lectureUrl(key)
    );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [id]);
  if (!id || !graph.nodes.has(id))
    return (
      <div className="page">
        <h1>Study item unavailable</h1>
        <Link to="/">Return to My Study</Link>
      </div>
    );
  return (
    <div className="page study-page">
      <header className="page-title-row">
        <h1 ref={heading} tabIndex={-1}>
          {pack ? pack.title : 'Connections'}
        </h1>
      </header>
      {pack && (
        <details className="study-disclosure">
          <summary>Lectures in this track ({pack.lectureIds.length})</summary>
          {pack.lectureIds.map((key) => (
            <button key={key} className="study-row text-button" onClick={() => select(key)}>
              {graph.nodes.get(key)?.title}
            </button>
          ))}
        </details>
      )}
      <CatalogConnections id={id} select={select} track={pack && new Set(pack.lectureIds)} />
    </div>
  );
}
export function KnowledgeGraphView({ history }: { history?: Map<string, CanvasSnapshot> }) {
  const [q] = useSearchParams(),
    location = useLocation(),
    navigate = useNavigate();
  const root = q.get('focus') && graph.nodes.has(q.get('focus')!) ? q.get('focus')! : ALL_LECTURES[0].id;
  const historyKey = location.key + ':' + root;
  const snapshot = useMemo(() => {
    const found = history?.get(historyKey);
    if (found) return found;
    const next = { open: {}, camera: null };
    history?.set(historyKey, next);
    return next;
  }, [historyKey, history]);
  const [info, setInfo] = useState<string | null>(null),
    opener = useRef<HTMLButtonElement | null>(null),
    heading = useRef<HTMLHeadingElement>(null),
    page = useRef<HTMLDivElement>(null);
  const compact = useMediaQuery('(max-width: 760px)');
  useLayoutEffect(() => {
    if (info) heading.current?.focus();
    else if (opener.current) {
      (opener.current.isConnected ? opener.current : page.current)?.focus();
      opener.current = null;
    }
  }, [info]);
  useEffect(() => {
    if (!info) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfo(null);
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [info]);
  const content = info && (
    <>
      <header className="section-title">
        <h2 tabIndex={-1} ref={heading}>
          Lecture info
        </h2>
        <button className="icon-button" aria-label="Close lecture info" onClick={() => setInfo(null)}>
          <X size={18} />
        </button>
      </header>
      <CatalogConnections id={info} select={setInfo} />
    </>
  );
  return (
    <div className="page study-page" tabIndex={-1} ref={page}>
      <header className="page-title-row">
        <h1>Graph</h1>
        <label>
          Focus lecture{' '}
          <select value={root} onChange={(e) => navigate('/graph?focus=' + e.target.value)}>
            {ALL_LECTURES.map((l) => (
              <option value={l.id} key={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className="graph-stage">
        <InteractiveDagCanvas
          key={historyKey}
          dag={getKnowledgeDAG()}
          root={root}
          historyEntry={snapshot}
          onInfo={(id, button) => {
            opener.current = button;
            setInfo(id);
          }}
        />
        {info &&
          (compact ? (
            <Modal className="graph-info-modal" label="Lecture info" onClose={() => setInfo(null)}>
              {content}
            </Modal>
          ) : (
            <aside className="graph-info" aria-label="Lecture info">
              {content}
            </aside>
          ))}
      </div>
    </div>
  );
}

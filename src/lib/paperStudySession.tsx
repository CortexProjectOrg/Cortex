import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { PAPER_TARGET_ID, type PaperPlan } from './paperPlan';
import type { StudyGraph } from './studyGraph';

export type EvidenceStatus = 'Checked against text' | 'Check in paper';

interface ActivePaperStudy {
  revision: number;
  plan: PaperPlan & { graph: StudyGraph };
  evidenceStatus: EvidenceStatus;
  selected: string;
  root: string;
  depth: number;
  view: 'tree' | 'order';
  showCompleted: boolean;
  known: ReadonlySet<string>;
  savedNoteId: string | null;
}

interface Session {
  active: ActivePaperStudy | null;
  revision: number;
  acceptPlan: (plan: PaperPlan, evidenceStatus: EvidenceStatus, expectedRevision?: number) => void;
  updateActive: (revision: number, update: (current: ActivePaperStudy) => ActivePaperStudy) => void;
}

const PaperStudyContext = createContext<Session | null>(null);

export function PaperStudySessionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActivePaperStudy | null>(null);
  const acceptPlan = useCallback<Session['acceptPlan']>((plan, evidenceStatus, expectedRevision) => {
    const graph = plan.graph;
    if (!graph || !plan.analysis.theorem) return;
    setActive((current) => {
      const revision = current?.revision ?? 0;
      if (expectedRevision !== undefined && expectedRevision !== revision) return current;
      return {
        revision: revision + 1,
        plan: { ...plan, graph },
        evidenceStatus,
        selected: PAPER_TARGET_ID,
        root: PAPER_TARGET_ID,
        depth: 2,
        view: 'tree',
        showCompleted: true,
        known: new Set(),
        savedNoteId: null
      };
    });
  }, []);
  const updateActive = useCallback<Session['updateActive']>((revision, update) => {
    setActive((current) => (current?.revision === revision ? update(current) : current));
  }, []);
  const value = useMemo(
    () => ({ active, revision: active?.revision ?? 0, acceptPlan, updateActive }),
    [active, acceptPlan, updateActive]
  );
  return <PaperStudyContext.Provider value={value}>{children}</PaperStudyContext.Provider>;
}

export function usePaperStudySession() {
  const session = useContext(PaperStudyContext);
  if (!session) throw new Error('Paper Study requires a session provider.');
  return session;
}

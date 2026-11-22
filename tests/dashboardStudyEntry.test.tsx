// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { Dashboard } from '../src/components/Dashboard';
import { LECTURE_MAP } from '../src/lib/curriculumCatalog';
import { emptyWorkspace, lectureRoute } from '../src/lib/model';
import { buildPaperPlan } from '../src/lib/paperPlan';
import { PaperStudySessionProvider, usePaperStudySession } from '../src/lib/paperStudySession';
import { paperAnalysis } from './fixtures/paperAnalysis';

const workspace = vi.hoisted(() => ({ data: {} }));
vi.mock('../src/lib/workspace', () => ({ useWorkspace: () => workspace }));
afterEach(cleanup);

function DashboardWithPaper() {
  const { acceptPlan } = usePaperStudySession();
  useEffect(() => acceptPlan(buildPaperPlan(paperAnalysis), 'Check in paper'), [acceptPlan]);
  return <Dashboard />;
}

it.each([false, true])(
  'keeps study entry points and the catalog resume route with an active paper = %s',
  (active) => {
    const next = LECTURE_MAP.get('L02-groups-modular-arithmetic')!;
    workspace.data = { ...emptyWorkspace(), lastRead: { id: next.id, at: '2026-11-21T09:00:00.000Z' } };
    render(
      <MemoryRouter>
        <PaperStudySessionProvider>
          {active ? <DashboardWithPaper /> : <Dashboard />}
        </PaperStudySessionProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Explore the Knowledge Map' }).getAttribute('href')).toBe(
      '/tree'
    );
    expect(
      screen.getByRole('link', { name: active ? 'Resume paper' : 'Study a paper' }).getAttribute('href')
    ).toBe('/tree?study=paper');
    expect(screen.getByRole('link', { name: 'Continue' }).getAttribute('href')).toBe(
      lectureRoute(next.topicId, next.id)
    );
  }
);

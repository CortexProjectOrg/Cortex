// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { emptyWorkspace } from '../shared/workspace';
import { WorkspaceProvider, useWorkspace } from '../src/lib/workspace';
import { makeNote } from '../src/lib/model';

const { storage, auth, put } = vi.hoisted(() => {
  const storage = new Map<string, unknown>();
  const put = vi.fn(async (_store: string, value: unknown, key: string) => {
    storage.set(key, structuredClone(value));
  });
  return {
    storage,
    put,
    auth: { user: null as null | { uid: string }, isLoading: false, token: null, invalidateSession: vi.fn() }
  };
});
vi.mock('../src/lib/auth', () => ({ useAuth: () => auth }));
vi.mock('idb', () => ({
  openDB: async () => ({ get: async (_store: string, key: string) => storage.get(key), put })
}));
let current: ReturnType<typeof useWorkspace>;
function Consumer() {
  current = useWorkspace();
  return (
    <div>{current.loaded ? current.data.notes.map((n) => n.title).join(',') || 'empty' : 'loading'}</div>
  );
}
afterEach(() => {
  cleanup();
  storage.clear();
  vi.clearAllMocks();
});
it('isolates real provider mounts across A → anonymous → B → A in StrictMode', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  storage.set('user:A', { ...emptyWorkspace(), notes: [makeNote('Private A')] });
  storage.set('main', { ...emptyWorkspace(), notes: [makeNote('Anonymous')] });
  auth.user = { uid: 'A' };
  const tree = () => (
    <StrictMode>
      <WorkspaceProvider>
        <Consumer />
      </WorkspaceProvider>
    </StrictMode>
  );
  const view = render(tree());
  await screen.findByText('Private A');
  act(() => current.update((ws) => ({ ...ws, theme: 'dark' })));
  auth.user = null;
  view.rerender(tree());
  await screen.findByText('Anonymous');
  auth.user = { uid: 'B' };
  view.rerender(tree());
  await screen.findByText('empty');
  act(() => current.update((ws) => ({ ...ws, notes: [makeNote('Private B')] })));
  await act(() => current.flush());
  auth.user = { uid: 'A' };
  view.rerender(tree());
  await screen.findByText('Private A');
  await waitFor(() => expect(current.data.theme).toBe('dark'));
  for (const [, value, key] of put.mock.calls) {
    const serialized = JSON.stringify(value);
    if (key === 'user:B') expect(serialized).not.toContain('Private A');
    if (key === 'main') expect(serialized).not.toContain('Private A');
  }
});

// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { GoogleSignInButton } from '../src/components/ui/GoogleSignInButton';
import type { GoogleIdentity } from '../src/lib/googleIdentity';

const clientId = '123-test.apps.googleusercontent.com';
let auth: ReturnType<typeof useAuth>;
function SignIn() {
  auth = useAuth();
  return (
    <>
      <GoogleSignInButton />
      <span>{auth.authWarning}</span>
    </>
  );
}
function mount() {
  return render(
    <StrictMode>
      <AuthProvider>
        <SignIn />
      </AuthProvider>
    </StrictMode>
  );
}
function google() {
  const identity: GoogleIdentity = {
    initialize: vi.fn(),
    renderButton: vi.fn((element) => {
      const button = document.createElement('button');
      button.textContent = 'Sign in with Google';
      element.append(button);
    }),
    disableAutoSelect: vi.fn()
  };
  window.google = { accounts: { id: identity } };
  return identity;
}
beforeEach(() => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
  sessionStorage.clear();
  localStorage.clear();
  delete window.google;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ clientId }))
  );
});
afterEach(() => {
  cleanup();
  document
    .querySelectorAll('script[src="https://accounts.google.com/gsi/client"]')
    .forEach((el) => el.remove());
  delete window.google;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('renders the real Google button when its SDK loads after the sign-in panel', async () => {
  mount();
  expect(screen.getByRole('status').textContent).toBe('Loading Google sign-in…');
  expect(screen.queryByText('Sign-in is unavailable.')).toBeNull();
  await waitFor(() =>
    expect(document.querySelector('script[src="https://accounts.google.com/gsi/client"]')).not.toBeNull()
  );
  const identity = google();
  act(() => document.querySelector('script')!.dispatchEvent(new Event('load')));
  await screen.findByRole('button', { name: 'Sign in with Google' });
  expect(identity.initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: clientId }));
  expect(identity.renderButton).toHaveBeenCalled();
  expect(screen.queryByText('Loading Google sign-in…')).toBeNull();
});
it('recovers from a failed configuration request using the retry action', async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({}, { status: 503 }));
  google();
  mount();
  const retry = await screen.findByRole('button', { name: 'Retry Google sign-in' });
  expect(auth.token).toBeNull();
  vi.mocked(fetch).mockImplementation(async () => Response.json({ clientId }));
  fireEvent.click(retry);
  await screen.findByRole('button', { name: 'Sign in with Google' });
  expect(auth.authWarning).toBeNull();
});
it('allows retry after a blocked Google script instead of leaving a dead button', async () => {
  mount();
  await waitFor(() =>
    expect(document.querySelector('script[src="https://accounts.google.com/gsi/client"]')).not.toBeNull()
  );
  act(() => document.querySelector('script')!.dispatchEvent(new Event('error')));
  const retry = await screen.findByRole('button', { name: 'Retry Google sign-in' });
  expect(screen.queryByRole('button', { name: 'Sign in with Google' })).toBeNull();
  google();
  fireEvent.click(retry);
  await screen.findByRole('button', { name: 'Sign in with Google' });
});
it('enables cloud identity only after the returned credential is verified by the server', async () => {
  const identity = google();
  mount();
  await screen.findByRole('button', { name: 'Sign in with Google' });
  const callback = vi.mocked(identity.initialize).mock.calls.at(-1)![0].callback;
  const jwt = `header.${btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 }))}.signature`;
  const user = { uid: 'verified-account', name: 'Student', email: '', picture: '' };
  vi.mocked(fetch).mockImplementation(async () => Response.json({ user }));
  await act(() => callback({ credential: jwt }));
  await waitFor(() => expect(auth.token).toBe(jwt));
  expect(fetch).toHaveBeenCalledWith(
    '/api/auth/verify',
    expect.objectContaining({ method: 'POST', headers: { Authorization: `Bearer ${jwt}` } })
  );
  expect(auth.user).toEqual(user);
});

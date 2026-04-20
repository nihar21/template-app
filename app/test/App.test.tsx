import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockedResponse } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { CURRENT_TIME } from '../src/useCurrentTime';

vi.mock('../src/auth/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: { id: 'test-user', name: 'Test User', roles: ['authenticated'] },
    roles: ['authenticated'],
    loading: false,
  }),
}));

function renderAt(path: string, mocks: readonly MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </MockedProvider>
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state then the server time on the home route', async () => {
    const mocks = [
      {
        request: { query: CURRENT_TIME },
        result: { data: { currentTime: '2026-04-20T12:00:00.000Z' } },
      },
    ];
    renderAt('/', mocks);
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    expect(
      await screen.findByText('2026-04-20T12:00:00.000Z')
    ).toBeInTheDocument();
  });

  it('renders the About page on /about', () => {
    renderAt('/about');
    expect(screen.getByText('About this template')).toBeInTheDocument();
  });

  it('shows the signed-in user in the nav', () => {
    renderAt('/about');
    expect(screen.getByText('Signed in as Test User')).toBeInTheDocument();
  });
});

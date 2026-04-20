import { useEffect, useState } from 'react';

/**
 * Reads the authenticated user from Static Web Apps' built-in `/.auth/me`
 * endpoint. When the app runs locally via `swa start`, the SWA CLI emulates
 * this endpoint with whatever mock principal you configure. When running
 * `npm run dev` standalone (no SWA CLI in front), the fetch fails and the
 * hook returns a dev fallback so the UI doesn't break.
 *
 * Shape returned by SWA:
 *   { clientPrincipal: { userId, userDetails, identityProvider, userRoles } }
 * `clientPrincipal` is null when the caller is not signed in.
 */

export interface CurrentUser {
  id: string;
  name: string;
  roles: string[];
}

interface ClientPrincipalResponse {
  clientPrincipal: {
    userId: string;
    userDetails: string;
    identityProvider: string;
    userRoles: string[];
  } | null;
}

const DEV_FALLBACK: CurrentUser = {
  id: 'dev-user',
  name: 'Local Dev',
  roles: ['authenticated'],
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/.auth/me')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: ClientPrincipalResponse) => {
        if (cancelled) return;
        if (data.clientPrincipal) {
          setUser({
            id: data.clientPrincipal.userId,
            name: data.clientPrincipal.userDetails,
            roles: data.clientPrincipal.userRoles,
          });
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        // /.auth/me isn't reachable — running without SWA CLI. Use fallback
        // so the UI still renders in plain `npm run dev` mode.
        if (!cancelled) setUser(DEV_FALLBACK);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, roles: user?.roles ?? [], loading };
}

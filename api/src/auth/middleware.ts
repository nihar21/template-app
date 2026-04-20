/**
 * Authentication middleware — parses Azure Static Web Apps Easy Auth principals.
 *
 * This api is designed to sit behind SWA's Linked Backend feature. SWA handles
 * all identity (Entra / AAD) at the edge, then forwards every request to the
 * container app with the authenticated user encoded in an `x-ms-client-principal`
 * header (base64 JSON). The BE's only job is to decode that header and expose
 * the resulting user + roles on the GraphQL context.
 *
 * Header present   → decode, attach `req.authContext = { user, roles }`
 * Header missing   → attach a mock user. This is the "standalone dev" fallback
 *                    for running `npm run dev` in api/ without the SWA CLI in
 *                    front. Also covers anything hitting `/health`.
 *
 * Notes for downstream clones:
 * - No JWT validation happens here. SWA already did it. Never expose the api
 *   to the public internet without SWA (or an equivalent auth proxy) in front.
 * - Role-gating belongs in resolvers: `if (!context.auth.roles.includes('admin'))`.
 * - To tighten the fallback to "401 when header missing" (prod-hardening),
 *   replace the mock branch with `res.status(401).json({ error: 'unauthorized' })`.
 */

import type { RequestHandler } from 'express';

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
}

export interface AuthContext {
  user: AuthUser;
  roles: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authContext?: AuthContext;
    }
  }
}

const MOCK_AUTH: AuthContext = {
  user: { id: 'dev-user', name: 'Local Dev', email: 'dev@localhost' },
  roles: ['authenticated'],
};

interface EasyAuthClaim {
  typ: string;
  val: string;
}
interface EasyAuthPrincipal {
  auth_typ?: string;
  claims?: EasyAuthClaim[];
  name_typ?: string;
  role_typ?: string;
  userId?: string;
  userDetails?: string;
  userRoles?: string[];
}

function parsePrincipal(header: string): AuthContext | null {
  let principal: EasyAuthPrincipal;
  try {
    principal = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
  } catch {
    return null;
  }

  // SWA's simpler shape uses top-level userRoles/userId/userDetails. Easy Auth
  // (App Service) uses the claims[] shape. Support both.
  if (principal.userRoles || principal.userId) {
    return {
      user: {
        id: principal.userId ?? 'unknown',
        name: principal.userDetails,
        email: principal.userDetails,
      },
      roles: principal.userRoles ?? [],
    };
  }

  const claims = principal.claims ?? [];
  const roleTyp = principal.role_typ ?? 'roles';
  const nameTyp = principal.name_typ ?? 'name';
  const roles = claims.filter((c) => c.typ === roleTyp).map((c) => c.val);
  const nameClaim = claims.find((c) => c.typ === nameTyp);
  const oidClaim = claims.find(
    (c) =>
      c.typ === 'http://schemas.microsoft.com/identity/claims/objectidentifier' || c.typ === 'oid',
  );
  const emailClaim = claims.find((c) => c.typ === 'preferred_username' || c.typ === 'email');

  return {
    user: {
      id: oidClaim?.val ?? principal.userId ?? 'unknown',
      name: nameClaim?.val ?? principal.userDetails,
      email: emailClaim?.val,
    },
    roles,
  };
}

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.header('x-ms-client-principal');
  if (header) {
    const parsed = parsePrincipal(header);
    req.authContext = parsed ?? MOCK_AUTH;
  } else {
    req.authContext = MOCK_AUTH;
  }
  next();
};

# TemplateApp

Starter monorepo with two independent packages:

- `api/` — Node.js + TypeScript GraphQL backend (Apollo Server on Express). Deploys to Azure Container Apps via the included Dockerfile.
- `app/` — React 19 + TypeScript + Vite frontend (Tailwind v4, Apollo Client, React Router v7). Deploys to Azure Static Web Apps.

Each package has its own `package.json` and is managed independently.

## Architecture

Auth is handled by **MSAL** on the frontend and **Easy Auth** on the backend:

```
Browser ──▶ MSAL login (Entra ID) ──▶ acquires Bearer token
              │
              ├── SWA serves static app/dist
              └── GraphQL requests with Bearer token ──▶ ACA (api/)
                    ACA Easy Auth validates token,
                    injects x-ms-client-principal header
```

The frontend uses `@azure/msal-browser` to authenticate users and attaches Bearer tokens to every GraphQL request. ACA Easy Auth validates the token and injects the `x-ms-client-principal` header. The backend middleware (`api/src/auth/middleware.ts`) parses this header to provide user identity and roles to GraphQL resolvers.

## Prerequisites

- Node.js 22+
- npm 10+
- Docker (only if you want to build/run the api container)

## Run locally

Install deps once per package:
```
cd api && npm install && cd ..
cd app && npm install && cd ..
```

### With MSAL auth (recommended once Entra ID is provisioned)

Fill in the MSAL env vars in `app/.env`:
```
VITE_CLIENT_ID=<your-entra-app-client-id>
VITE_TENANT_ID=<your-entra-tenant-id>
VITE_API_IDENTIFIER_URI=api://<your-client-id>
```

Add `http://localhost:5173` as a Redirect URI in your Entra ID App Registration.

Then from the repo root:
```
npm run dev
```

This starts both the Vite dev server (`:5173`) and the api (`:4000`). MSAL will redirect to the Microsoft login page. After login, Bearer tokens are attached to all GraphQL requests automatically.

The backend sees no `x-ms-client-principal` header in local dev (that's only injected by ACA Easy Auth in Azure), so it falls back to a mock user context. This is safe — the mock fallback is disabled in production via `NODE_ENV=production`.

### Without auth (quick iteration)

Leave the MSAL env vars empty in `app/.env`:
```
VITE_CLIENT_ID=
VITE_TENANT_ID=
VITE_API_IDENTIFIER_URI=
```

Run:
```
npm run dev
```

Auth is automatically bypassed on both sides:
- **Frontend**: `ProtectedRoute` passes through without redirecting to login. Displays "Signed in as Local Dev".
- **Backend**: Falls back to a mock user (`dev-user`, roles `['authenticated']`).

No tokens are needed. This is controlled by the `AUTH_ENABLED` build-time flag in `app/src/config/constants.ts`, which is `false` when `VITE_CLIENT_ID` and `VITE_TENANT_ID` are empty.

## Scripts

Both packages expose:

- `dev` — local dev mode with watch
- `build` — production build
- `lint` — ESLint
- `format` — Prettier write
- `test` — Vitest

`api/` also exposes:

- `docker-build` / `docker-run` — container image build/run
- `postbuild` — copies `schema.graphql` into `dist/` (runs automatically)

Root:

- `npm run dev` — starts both frontend and backend concurrently

## Project layout

```
TemplateApp/
├── api/
│   ├── Dockerfile               # multi-stage, node:22-alpine
│   ├── scripts/copy-assets.mjs  # postbuild: schema.graphql -> dist/
│   ├── src/
│   │   ├── auth/middleware.ts   # parses x-ms-client-principal
│   │   ├── graphql/
│   │   │   ├── schema.graphql   # SDL
│   │   │   └── resolvers.ts
│   │   └── index.ts             # Apollo + Express bootstrap
│   └── test/resolvers.test.ts
└── app/
    ├── staticwebapp.config.json # SWA routing config
    ├── src/
    │   ├── auth/
    │   │   ├── msalConfig.ts    # MSAL configuration
    │   │   └── ProtectedRoute.tsx
    │   ├── config/constants.ts  # centralized env access + AUTH_ENABLED flag
    │   ├── routes/              # Home, About
    │   ├── apollo.ts            # Apollo Client with MSAL auth link
    │   ├── App.tsx
    │   └── main.tsx
    └── test/App.test.tsx
```

## Deployment notes

- **FE** → Azure Static Web Apps. Set `VITE_CLIENT_ID`, `VITE_TENANT_ID`, and `VITE_API_IDENTIFIER_URI` as build-time env vars. Set `AAD_CLIENT_ID` and `AAD_CLIENT_SECRET` as SWA environment variables for the custom auth provider in `staticwebapp.config.json`.
- **BE** → Azure Container Apps. Build with `npm run docker-build` or `az acr build`. Configure ACA Easy Auth with your Entra ID App Registration. Link the ACA to SWA via the APIs menu.
- No secrets live in this repo. `.env` files are gitignored; `.env.example` shows the shape.

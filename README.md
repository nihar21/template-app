# TemplateApp

Starter monorepo with two independent packages:

- `api/` — Node.js + TypeScript GraphQL backend (Apollo Server v4 on Express). Deploys to Azure Container Apps via the included Dockerfile.
- `app/` — React 19 + TypeScript + Vite frontend (Tailwind v4, Apollo Client v4, React Router v7). Deploys to Azure Static Web Apps.

Each package has its own `package.json` and is managed independently — no root `package.json`, no npm workspaces.

## Architecture

Auth is handled at the SWA edge via the **Static Web Apps Linked Backend** pattern:

```
Browser ──▶ SWA (Entra sign-in, session cookie)
              │
              ├── serves static app/dist
              └── proxies /api/* ──▶ linked ACA (api/)
                                        injects x-ms-client-principal header
```

The api does not validate JWTs or call MSAL — it only parses the `x-ms-client-principal` header injected by SWA. See `api/src/auth/middleware.ts` and `app/staticwebapp.config.json`.

## Prerequisites

- Node.js 22+
- npm 10+
- Docker (only if you want to build/run the api container)
- For full local auth: [`@azure/static-web-apps-cli`](https://azure.github.io/static-web-apps-cli/) (via `npx`, no install needed)

## Run locally

### Primary flow — SWA CLI (recommended)

Use this when you want the full linked-backend experience locally: SWA CLI emulates Easy Auth, injects `x-ms-client-principal`, and proxies `/api/*` to the api.

Install deps once per package:
```
cd api && npm install && cd ..
cd app && npm install && cd ..
```

Then from the repo root:
```
npx @azure/static-web-apps-cli start
```

This reads `swa-cli.config.json` and:
- Starts the Vite dev server on 5173
- Starts the api on 4000
- Serves the unified app at **`http://localhost:4300`** with auth emulation

Open `http://localhost:4300`. To sign in as a mock user, visit `http://localhost:4300/.auth/login/aad`. SWA CLI prompts for a userId and roles; pick any values (include `authenticated` in roles to satisfy `staticwebapp.config.json`'s `/*` rule). After submit, you'll land back in the app with the header set on every `/api/*` request.

Sign out: `http://localhost:4300/.auth/logout`.

### Fallback flow — standalone (no auth)

Use this when iterating on just the BE or FE without wanting auth in the loop. The api sees no `x-ms-client-principal` header and falls back to a mock user (`dev-user`, roles `['authenticated']`). The FE falls back to a hardcoded dev user when `/.auth/me` is unreachable.

Two terminals:

```
# terminal 1
cd api && npm run dev       # serves http://localhost:4000/graphql

# terminal 2
cd app && npm run dev       # serves http://localhost:5173
```

In `app/.env`, flip `VITE_API_URL` from `/api/graphql` to `http://localhost:4000/graphql` (the commented fallback is already in the file). Swap back when returning to the SWA CLI flow.

## Role-gated routes

Routes are protected at the SWA edge via `app/staticwebapp.config.json`. The config ships with a working example:

```json
{ "route": "/admin/*", "allowedRoles": ["admin"] }
```

SWA enforces this before the request reaches either the FE or api. To also hide UI elements by role, read `useCurrentUser()` from `app/src/auth/useCurrentUser.ts`:

```tsx
const { roles } = useCurrentUser();
{roles.includes('admin') && <AdminLink />}
```

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

## Project layout

```
TemplateApp/
├── swa-cli.config.json          # SWA CLI dev coordinator
├── api/
│   ├── Dockerfile               # multi-stage, node:22-alpine
│   ├── scripts/copy-assets.mjs  # postbuild: schema.graphql → dist/
│   ├── src/
│   │   ├── auth/middleware.ts   # parses x-ms-client-principal
│   │   ├── graphql/
│   │   │   ├── schema.graphql   # SDL
│   │   │   └── resolvers.ts
│   │   └── index.ts             # Apollo + Express bootstrap
│   └── test/resolvers.test.ts
└── app/
    ├── staticwebapp.config.json # SWA routing + auth config
    ├── src/
    │   ├── auth/useCurrentUser.ts
    │   ├── config/constants.ts  # centralized env access
    │   ├── routes/              # Home, About
    │   ├── apollo.ts
    │   ├── App.tsx              # declarative <Routes>
    │   └── main.tsx
    └── test/App.test.tsx
```

## Deployment notes

- **FE** → Azure Static Web Apps. The deployment picks up `staticwebapp.config.json` automatically. Set app settings `AAD_CLIENT_ID` and `AAD_CLIENT_SECRET` to a registered Entra app; set `<TENANT_ID>` in the config's `openIdIssuer` URL.
- **BE** → Azure Container Apps. Build with `npm run docker-build`. After deploy, link it to the SWA via `az staticwebapp backends link` so SWA proxies `/api/*` and injects the principal header.
- No secrets live in this repo. `.env` files are gitignored; `.env.example` shows the shape.

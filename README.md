# PipeStock

PipeStock is a mobile-first material tracking application for plumbers and installers.

The project follows the proven WorkTrack conventions while keeping PipeStock domain logic separate:

- React + Vite frontend
- Redux Toolkit / RTK Query
- React Router
- shared frontend layer for reusable application infrastructure
- native Node.js HTTP backend (no Express)
- Prisma ORM with PostgreSQL
- company-scoped authorization (`User` + `CompanyMembership`)
- manager / employee role flows
- Cloudinary-backed project photo uploads
- centralized design tokens and mobile-first UI rules

## Structure

```text
backend/                     Node HTTP API + Prisma
frontend/shared/             reusable app infrastructure and theme
frontend/webApp/             PipeStock web application
frontend/webApp/public/      Netlify redirects + static material assets
frontend/webApp/src/react-app
  components/                app-level reusable components
  features/                  API/state/domain features
  pages/                     route pages
  router.jsx                 routing
  store.js                   Redux store
tools/                       local development utilities
```

## Local setup

Create `backend/.env` from `backend/.env.example`. `frontend/webApp/.env` is optional because local frontend defaults to `http://localhost:3001/api`.

Install dependencies:

```bash
npm install
npm --prefix backend install
```

Generate Prisma Client and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

Run frontend and backend together:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3001`  
Health: `http://localhost:3001/api/health`

## Production architecture

Production is split between Netlify and Render:

- **Netlify** serves the Vite frontend from `dist/`.
- `frontend/webApp/public/_redirects` proxies browser requests from `/api/*` to the Render backend. Keeping API calls same-origin in the browser is important for the HttpOnly refresh-cookie flow.
- **Render** runs the Node backend only.
- Render applies Prisma migrations through `preDeployCommand` before starting the service.
- PostgreSQL is accessed through Prisma.
- Project photos are uploaded directly to Cloudinary using signed upload parameters issued by the backend.

The frontend production API base should stay:

```text
VITE_API_BASE_URL=/api
```

Do not point the browser directly at the Render API unless the cookie/CORS design is intentionally changed as well.

## Render environment variables

Required backend variables:

```text
DATABASE_URL
AUTH_TOKEN_SECRET
CLIENT_ORIGIN
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Optional:

```text
DIRECT_DATABASE_URL
TZ
```

`AUTH_TOKEN_SECRET` must contain at least 32 random characters. `CLOUDINARY_API_SECRET` is backend-only and must never be exposed through a `VITE_*` variable.

## Core domain

The current application includes:

- users and refresh-token sessions;
- companies and manager/employee memberships;
- project assignments;
- projects / objects;
- material catalog items and personal favorites/recent materials;
- draft, submitted, and completed orders;
- immutable submitted-order snapshots;
- order lifecycle history;
- generated PDF material documents.

Tenant access is always enforced on the backend. Frontend role checks are only for navigation and UX, never the source of authorization truth.

## Verification

Run the same high-level checks used by CI:

```bash
npm run verify
```

This runs backend tests, Prisma Client generation, and the production frontend build.

# PipeStock

PipeStock is a mobile-first material tracking application for plumbers and installers.

The project intentionally follows the proven WorkTrack conventions while keeping PipeStock domain logic separate:

- React + Vite frontend
- Redux Toolkit / RTK Query
- React Router
- shared frontend layer for reusable application infrastructure
- native Node.js HTTP backend (no Express)
- Prisma ORM with PostgreSQL
- company-scoped authorization model (`User` + `CompanyMembership`)
- centralized design tokens and mobile-first UI rules
- one Render web service serving both the React build and `/api`

## Structure

```text
backend/                     Node HTTP API + Prisma
frontend/shared/             reusable app infrastructure and theme
frontend/webApp/             PipeStock web application
frontend/webApp/src/react-app
  app/                       app-level wiring
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

## Production on Render

`render.yaml` defines one Node web service. Render builds the React app, runs Prisma migrations in `preDeployCommand`, then starts the Node server. The Node server handles `/api/*` and serves the Vite `dist` directory for all other routes, including React Router SPA fallbacks.

Required Render environment variables:

```text
DATABASE_URL
```

Reserved for the upcoming authentication flow:

```text
AUTH_TOKEN_SECRET
```

`DIRECT_DATABASE_URL` is optional and reserved for database providers that expose a separate direct connection for migration tooling.

## Data model

The initial schema keeps only the proven WorkTrack multi-tenant foundation: `User`, `Session`, `Company`, `CompanyMembership`, and `Project`.

PipeStock material, catalog, order, order item, PDF history, and inventory models are intentionally not guessed during bootstrap. They will be introduced with the approved PipeStock business flow so the initial database does not lock the product into the wrong model.

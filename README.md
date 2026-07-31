# Firehawk Automobile — Frontend

Angular frontend for browsing the "Auto MPG" automobile dataset served by the Firehawk backend.
Built with standalone components, Angular Material, and a feature-based architecture. Talks to
the backend exclusively over its REST API — it does not access Firestore, or any other data
store, directly.

> This repository contains the frontend only. The backend lives in a separate repository and is
> the single source of truth for all data; this app is purely a REST client for it.

See [`USER_GUIDE.md`](USER_GUIDE.md) for a plain-language guide to using the deployed site — this
README is for developers.

## Features

- **Automobile table** — sortable (client-side, over the current search result), paginated
  Angular Material table.
- **Server-side search & filtering** — debounced search by name plus filters for origin,
  cylinders, and an MPG range, all sent to the backend as query params and built with Reactive
  Forms and RxJS.
- **Automobile details dialog** — inspect a single record's full details.
- **Summary statistics cards** — total count, average MPG, average horsepower, and average
  weight, computed over whatever the current search/filter currently has loaded.
- **CSV export** — downloads the full (not just currently-loaded-page) matching result set
  directly from the backend's `/cars/export` endpoint, honoring the current filters and sort.
- **Add a car** — a simple form (`/add`) for adding a new automobile, gated behind a shared admin
  key (`core/services/admin-auth.ts`, sessionStorage-backed) since the backend has no
  user-account system. See [`USER_GUIDE.md`](USER_GUIDE.md) for the end-user walkthrough.
- **Persisted view state** — search, filters, sort order, current page, and page size are saved
  to `localStorage` and restored automatically on reload.
- **Empty states & feedback** — contextual empty states (no data / no matches / load error) with
  a one-click "Reset Filters" action, and snack bar confirmations/errors for key actions.
- **Responsive application shell** — collapsible sidenav + toolbar that adapts to
  handset-sized viewports.
- **REST API client** — a reusable `Api` service (`core/services/api.ts`) wrapping `HttpClient`
  against `environment.apiBaseUrl`, unwrapping the backend's `{ success, data }` envelope, plus a
  global HTTP error interceptor that turns failed requests into friendly snack bar messages
  (preferring the backend's own error message when it sends one).

## Tech Stack

| Layer              | Technology                                        |
| ------------------- | -------------------------------------------------- |
| Framework           | Angular 21 (standalone components, signals)         |
| UI                  | Angular Material 21 (Material 3)                    |
| Data                | REST over `HttpClient`, talking to the backend API  |
| Forms & State       | Reactive Forms, RxJS, Angular signals                |
| Styling             | SCSS                                                |
| Testing             | Vitest (via Angular's built-in unit-test builder)   |
| Linting/Formatting  | ESLint (`angular-eslint`) + Prettier                 |
| Deployment          | Vercel (static SPA), or a multi-stage Docker build served by Nginx |

## Project Structure

```
src/app/
  core/                     # Singleton, app-wide concerns
    services/                 # REST API client, admin-key auth, local storage, feedback, file download
    interceptors/              # HTTP interceptors (global error handling)
  shared/                   # Reusable, feature-agnostic building blocks
    components/                # e.g. EmptyState
    models/                    # Shared TypeScript types
  layout/                   # Application shell (toolbar, main layout/sidenav, nav links)
  features/
    automobile/               # The automobile domain feature
      components/                # CarTable, CarFilters, CarStats, CarDetailsDialog, CarForm
      services/                  # AutomobileRepository, view-state store
      models/                    # Car, filter criteria, stats, and shared enum-option types
      utils/                     # Pure functions: calculateCarStats
```

Cross-feature rule: `shared` and `core` never import from `features`; features never
import from each other.

## Prerequisites

- **Node.js** — one of `22.22.3+`, `24.15.0+`, or `26.0.0+` (required by Angular CLI
  21). Verify with `node -v`.
- **npm** — 11+ recommended (ships with the Node versions above).
- The backend running locally (or deployed) and reachable at whatever URL you configure below.

## Installation

```bash
git clone <this-repository-url>
cd frontend
npm install
```

## Environment Variables

This app doesn't use `.env` files at runtime — Angular compiles configuration into the bundle at
**build time** via environment files, swapped per build configuration:

| File                                          | Used for                                  |
| ---------------------------------------------- | ------------------------------------------ |
| `src/environments/environment.development.ts`  | `ng serve` / development builds            |
| `src/environments/environment.ts`               | `ng build` (production, default config)    |

Each file exports the same shape (see `src/app/shared/models/environment.model.ts`):

```ts
export const environment: Environment = {
  production: boolean,
  appName: string,
  apiBaseUrl: string, // backend API base URL, including its path prefix (e.g. "/api")
};
```

`apiBaseUrl` in the production file can additionally be overridden **without editing source** at
build time: `npm run build` runs `scripts/set-env.mjs` as an npm `prebuild` hook, which patches
`environment.ts`'s `apiBaseUrl` from an `API_BASE_URL` environment variable if one is set (see
[`.env.example`](.env.example) and [Deployment (Vercel)](#deployment-vercel) below). If
`API_BASE_URL` isn't set, the build leaves the committed value untouched, so this is a no-op for
local builds.

**The backend must allow this app's origin via CORS** (its `CORS_ORIGIN` env var) — see the
backend's README. A CORS error in the browser console almost always means the backend's allow-list
doesn't include the URL this app is actually running at.

## Running Locally

```bash
npm start
```

Starts the dev server at **http://localhost:4200** with hot reload, using
`environment.development.ts` (defaults to `http://localhost:3000/api` — point this at your local
backend). If the table shows its load-error empty state, check that the backend is running and
that its `CORS_ORIGIN` includes `http://localhost:4200`.

## Testing

```bash
npm test           # run the unit test suite (Vitest, via Angular's unit-test builder)
npm run lint        # ESLint
npm run format:check # Prettier check (use `npm run format` to auto-fix)
```

The suite covers the REST API client (envelope unwrapping, custom headers), the error
interceptor, the automobile repository (query-param mapping, cursor-pagination looping,
`createCar`), admin-key persistence (`AdminAuth`), local storage persistence, and component
behavior — including the add-car form's unlock flow and its handling of a rejected admin key.

## Docker

A multi-stage `Dockerfile` builds the production bundle with Node, then serves the static output
with Nginx — the final image contains no Node.js or `node_modules`.

```bash
docker build -t firehawk-automobile-frontend .
docker run --rm -p 8080:80 firehawk-automobile-frontend
# open http://localhost:8080
```

Because `apiBaseUrl` is baked in at build time (see above), make sure
`src/environments/environment.ts` (or an `API_BASE_URL` build arg/env var feeding
`scripts/set-env.mjs`) points at the right backend URL *before* running `docker build`.

## Deployment (Vercel)

The app is a static SPA, so it deploys to Vercel without Docker/Nginx. `vercel.json` at the
project root configures everything Vercel needs:

- `buildCommand: "npm run build"` — runs the production build (and its `prebuild` hook, see
  above).
- `outputDirectory: "dist/firehawk-automobile/browser"` — Angular nests the actual static output
  a level deeper than Vercel's default `dist/`.
- `rewrites` — sends every path to `index.html` so client-side routing (deep links, page
  refreshes on non-root routes) doesn't 404, mirroring the `try_files` rule in `nginx.conf`.
- `headers` — long-lived immutable caching for hashed JS/CSS/font/image assets, and `no-cache`
  for `index.html` so a new deploy is always picked up immediately.

Steps:

1. In the Vercel dashboard, create a project pointing at this repo with **Root Directory** set to
   `frontend/`.
2. Under **Project Settings → Environment Variables**, add `API_BASE_URL` set to your deployed
   backend's URL, including its `/api` prefix (e.g. `https://your-backend.onrender.com/api`) —
   see [`.env.example`](.env.example).
3. On the **backend**, add this Vercel deployment's URL to `CORS_ORIGIN` (comma-separated if you
   also need `http://localhost:4200` for local dev). Note that Vercel *preview* deployments (one
   per branch/PR) get a new random subdomain each time — those won't be covered by a fixed
   `CORS_ORIGIN` entry unless you add each one, so CORS errors on preview URLs (not production)
   are expected unless you keep the backend's allow-list in sync.
4. Push/deploy. Vercel runs `npm run build` per `vercel.json` and serves
   `dist/firehawk-automobile/browser`.

## Available Scripts

| Command                 | Description                                      |
| ------------------------ | -------------------------------------------------- |
| `npm start`               | Run the dev server (`ng serve`)                     |
| `npm run build`            | Production build to `dist/firehawk-automobile/`     |
| `npm run watch`            | Development build in watch mode                     |
| `npm test`                 | Run the Vitest unit test suite                      |
| `npm run lint`             | Lint with ESLint                                    |
| `npm run format`           | Format source files with Prettier                    |
| `npm run format:check`     | Check formatting without writing changes             |

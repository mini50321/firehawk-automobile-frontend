# Firehawk Automobile — Frontend

Angular frontend for browsing and managing an automobile inventory backed by Firebase
Firestore. Built with standalone components, Angular Material, and a feature-based
architecture.

> This repository contains the frontend only. The backend lives in a separate
> repository/directory and is consumed by this app at the API/Firestore level.

## Features

- **Automobile inventory table** — sortable, paginated Angular Material table backed
  by Firestore.
- **Reactive search & filtering** — debounced search by make/model plus filters for
  origin, cylinders, model year, and MPG/horsepower/weight ranges, all built with
  Reactive Forms and RxJS.
- **Automobile details dialog** — inspect a single vehicle's full record.
- **Summary statistics cards** — total count, average MPG, average horsepower, and
  average weight, computed live from whatever is currently filtered.
- **CSV export** — download the currently filtered result set as a CSV file.
- **Persisted view state** — search, filters, sort order, current page, and page size
  are saved to `localStorage` and restored automatically on reload.
- **Empty states & feedback** — contextual empty states (no data / no matches / load
  error) with a one-click "Reset Filters" action, and snack bar confirmations for key
  actions.
- **Responsive application shell** — collapsible sidenav + toolbar that adapts to
  handset-sized viewports.
- **Firebase/Firestore integration** — via [AngularFire](https://github.com/angular/angularfire),
  routed through a single core service so Firestore calls aren't scattered across the
  app.
- **REST API client** — a reusable `Api` service (`core/services/api.ts`) wrapping
  `HttpClient` against `environment.apiBaseUrl`, plus a global HTTP error interceptor
  that turns failed requests into friendly snack bar messages.

## Tech Stack

| Layer            | Technology                                             |
| ----------------- | ------------------------------------------------------- |
| Framework          | Angular 21 (standalone components, signals)              |
| UI                | Angular Material 21 (Material 3)                         |
| Data              | Firebase / Firestore via AngularFire                     |
| Forms & State     | Reactive Forms, RxJS, Angular signals                    |
| Styling           | SCSS                                                     |
| Testing           | Vitest (via Angular's built-in unit-test builder)        |
| Linting/Formatting| ESLint (`angular-eslint`) + Prettier                     |
| Deployment        | Multi-stage Docker build served by Nginx, or Vercel        |

## Project Structure

```
src/app/
  core/                     # Singleton, app-wide concerns
    services/                 # Firebase/Firestore access, REST API client, local storage, feedback, file download
    interceptors/              # HTTP interceptors (global error handling)
  shared/                   # Reusable, feature-agnostic building blocks
    components/                # e.g. EmptyState
    models/                    # Shared TypeScript types
  layout/                   # Application shell (toolbar, main layout/sidenav)
  features/
    automobile/               # The automobile domain feature
      components/                # CarTable, CarFilters, CarStats, CarDetailsDialog
      services/                  # AutomobileRepository, view-state store
      models/                    # Car, filter criteria, stats types
      utils/                     # Pure functions: filterCars, carsToCsv, calculateCarStats
```

Cross-feature rule: `shared` and `core` never import from `features`; features never
import from each other.

## Prerequisites

- **Node.js** — one of `22.22.3+`, `24.15.0+`, or `26.0.0+` (required by Angular CLI
  21). Verify with `node -v`.
- **npm** — 11+ recommended (ships with the Node versions above).
- A **Firebase project** with Firestore enabled (see [Firebase Configuration](#firebase-configuration)).

## Installation

```bash
git clone <this-repository-url>
cd frontend
npm install
```

## Environment Variables

This app doesn't use `.env` files — Angular compiles configuration into the bundle at
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
  apiBaseUrl: string, // backend API base URL
  firebase: {
    apiKey: string,
    authDomain: string,
    projectId: string,
    storageBucket: string,
    messagingSenderId: string,
    appId: string,
  },
};
```

Both files currently ship with **placeholder values** (`YOUR_DEV_API_KEY`, etc.) and
must be edited with real values before the app can talk to Firebase or your backend —
see below.

`apiBaseUrl` in the production file can additionally be overridden **without editing
source** at build time: `npm run build` runs `scripts/set-env.mjs` as an npm
`prebuild` hook, which patches `environment.ts`'s `apiBaseUrl` from an `API_BASE_URL`
environment variable if one is set (see [`.env.example`](.env.example) and
[Deployment (Vercel)](#deployment-vercel) below). If `API_BASE_URL` isn't set, the
build leaves the committed value untouched, so this is a no-op for local builds.

## Firebase Configuration

The app uses [AngularFire](https://github.com/angular/angularfire) for Firestore
access only (Auth/Storage are not wired up). To connect it to your own Firebase
project:

1. Create a project at the [Firebase console](https://console.firebase.google.com/)
   (or use an existing one), then enable **Firestore Database**.
2. In **Project settings → General → Your apps**, add a **Web app** and copy the
   `firebaseConfig` object it gives you.
3. Paste those values into the `firebase` block of `src/environments/environment.development.ts`
   (for local development) and `src/environments/environment.ts` (for production
   builds) — ideally pointing at two separate Firebase projects so local development
   never touches production data.
4. The app expects a Firestore collection named **`cars`**, with documents shaped like
   `src/app/features/automobile/models/car.model.ts` (`make`, `model`, `year`, `vin`,
   `color`, `mileage`, `price`, `status`, `origin`, `cylinders`, `mpg`, `horsepower`,
   `weight`).
5. All Firestore reads/writes are centralized in `src/app/core/services/firebase.ts` —
   nothing else in the app imports `@angular/fire` directly.

> Until real credentials are supplied, the app will build and render, but any
> Firestore read/write will fail (the table will show its load-error empty state).

## Running Locally

```bash
npm start
```

Starts the dev server at **http://localhost:4200** with hot reload. Uses
`environment.development.ts`.

## Testing

```bash
npm test           # run the unit test suite (Vitest, via Angular's unit-test builder)
npm run lint        # ESLint
npm run format:check # Prettier check (use `npm run format` to auto-fix)
```

The suite covers filtering/search logic, the Firestore service, local storage
persistence, CSV export, and component behavior (128 tests as of this writing).

## Docker

A multi-stage `Dockerfile` builds the production bundle with Node, then serves the
static output with Nginx — the final image contains no Node.js or `node_modules`.

```bash
docker build -t firehawk-automobile-frontend .
docker run --rm -p 8080:80 firehawk-automobile-frontend
# open http://localhost:8080
```

Because environment values are baked in at build time (see above), make sure
`src/environments/environment.ts` has the correct **production** Firebase config
*before* running `docker build`.

## Deployment (Vercel)

The app is a static SPA, so it deploys to Vercel without Docker/Nginx. `vercel.json`
at the project root configures everything Vercel needs:

- `buildCommand: "npm run build"` — runs the production build (and its `prebuild`
  hook, see above).
- `outputDirectory: "dist/firehawk-automobile/browser"` — Angular nests the actual
  static output a level deeper than Vercel's default `dist/`.
- `rewrites` — sends every path to `index.html` so client-side routing (deep links,
  page refreshes on non-root routes) doesn't 404, mirroring the `try_files` rule in
  `nginx.conf`.
- `headers` — long-lived immutable caching for hashed JS/CSS/font/image assets, and
  `no-cache` for `index.html` so a new deploy is always picked up immediately.

Steps:

1. In the Vercel dashboard, create a project pointing at this repo with **Root
   Directory** set to `frontend/`.
2. Under **Project Settings → Environment Variables**, add `API_BASE_URL` (see
   [`.env.example`](.env.example)) if the app needs to reach a backend other than
   the URL already committed in `environment.ts`.
3. Firebase config isn't read from environment variables — before the first deploy,
   make sure `src/environments/environment.ts` has the correct **production**
   Firebase project values (see [Firebase Configuration](#firebase-configuration)).
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

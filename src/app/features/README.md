# Features

Each feature is a self-contained, lazily-routed slice of the application. No feature imports from another feature — cross-feature communication goes through `core` or `shared`.

Suggested shape for a new feature (e.g. `features/dashboard/`):

```
features/dashboard/
  dashboard.routes.ts     # lazy-loaded route definitions for this feature
  components/             # feature-scoped standalone components
  services/                # feature-scoped services
  models/                  # feature-scoped types
```

Register a feature's routes in `app.routes.ts` via `loadChildren`.

No features exist yet — this directory is scaffolding for the next stage.

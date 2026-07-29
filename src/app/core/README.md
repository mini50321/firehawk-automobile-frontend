# Core

Singleton, application-wide concerns that are instantiated once and imported only by `app.config.ts`. Never import `core` from a feature module.

- `guards/` — route guards (`CanActivate`, `CanDeactivate`, etc.)
- `interceptors/` — `HttpInterceptorFn` implementations
- `services/` — app-wide singleton services (auth session, logging, etc.)

import type { Environment } from '../app/shared/models/environment.model';

export const environment: Environment = {
  production: true,
  appName: 'Firehawk Automobile',
  // Overridden at build time from the API_BASE_URL env var by scripts/set-env.mjs (e.g. on
  // Vercel) — this committed value is just the fallback for a local `npm run build`.
  apiBaseUrl: 'https://your-backend.onrender.com/api',
};

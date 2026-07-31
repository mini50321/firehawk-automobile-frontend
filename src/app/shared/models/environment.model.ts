export interface Environment {
  production: boolean;
  appName: string;
  /** Base URL of the backend REST API, including any path prefix (e.g. `/api`). */
  apiBaseUrl: string;
}

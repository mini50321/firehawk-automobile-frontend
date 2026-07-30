#!/usr/bin/env node
// Runs as the npm "prebuild" hook (before `ng build`). Angular has no concept of
// runtime env vars in the browser bundle — everything is compiled in at build time
// from src/environments/*.ts. To let a deployment platform (Vercel) configure the
// backend URL per-environment without editing source, this patches apiBaseUrl in
// the production environment file from process.env.API_BASE_URL right before the
// build reads it. If the var isn't set, it's a no-op and the file is left as-is.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFilePath = join(__dirname, '../src/environments/environment.ts');

// Vercel injects env vars directly into process.env at build time, so this is
// only needed for local testing: load a .env file, if present, without adding
// a dotenv dependency. Real platform env vars always take precedence.
const dotEnvPath = join(__dirname, '../.env');
if (existsSync(dotEnvPath)) {
  for (const line of readFileSync(dotEnvPath, 'utf8').split('\n')) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (match) {
      const [, key, rawValue = ''] = match;
      const value = rawValue.trim().replace(/^['"]|['"]$/g, '');
      process.env[key] ??= value;
    }
  }
}

const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  console.log('[set-env] API_BASE_URL not set — keeping existing apiBaseUrl in environment.ts');
  process.exit(0);
}

const source = readFileSync(envFilePath, 'utf8');
const updated = source.replace(/apiBaseUrl:\s*'[^']*'/, `apiBaseUrl: '${apiBaseUrl}'`);

if (updated === source) {
  console.error('[set-env] Could not find an apiBaseUrl field to replace in environment.ts');
  process.exit(1);
}

writeFileSync(envFilePath, updated);
console.log('[set-env] apiBaseUrl set from API_BASE_URL env var.');

import type { Environment } from '../app/shared/models/environment.model';

export const environment: Environment = {
  production: false,
  appName: 'Firehawk Automobile (Dev)',
  apiBaseUrl: 'http://localhost:3000',
  // TODO: replace with the development/staging Firebase project config (Firebase console > Project settings).
  firebase: {
    apiKey: 'YOUR_DEV_API_KEY',
    authDomain: 'YOUR_DEV_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_DEV_PROJECT_ID',
    storageBucket: 'YOUR_DEV_PROJECT_ID.firebasestorage.app',
    messagingSenderId: 'YOUR_DEV_MESSAGING_SENDER_ID',
    appId: 'YOUR_DEV_APP_ID',
  },
};

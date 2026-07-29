import type { Environment } from '../app/shared/models/environment.model';

export const environment: Environment = {
  production: true,
  appName: 'Firehawk Automobile',
  apiBaseUrl: 'https://api.firehawk-automobile.com',
  // TODO: replace with the production Firebase project config (Firebase console > Project settings).
  firebase: {
    apiKey: 'YOUR_PROD_API_KEY',
    authDomain: 'YOUR_PROD_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROD_PROJECT_ID',
    storageBucket: 'YOUR_PROD_PROJECT_ID.firebasestorage.app',
    messagingSenderId: 'YOUR_PROD_MESSAGING_SENDER_ID',
    appId: 'YOUR_PROD_APP_ID',
  },
};

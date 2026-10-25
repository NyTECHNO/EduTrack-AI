const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();
// Keep in sync with VITE_FUNCTIONS_REGION in the web app's .env
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 10 });

Object.assign(exports, require('./auth/accounts'));
// Later phases add: schedules/, reminders/, notifications/, grades/

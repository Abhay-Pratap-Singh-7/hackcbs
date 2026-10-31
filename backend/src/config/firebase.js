const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');
const fs = require('fs');

let isInitialized = false;
let messagingInstance = null;
let appInstance = null;
let initError = null;

try {
  let serviceAccount = null;

  // 1. Search for any env key containing firebase or service_account
  let rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
               process.env.FIREBASE_SERVICE_ACCOUNT ||
               process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
               process.env.FIREBASE_CREDENTIALS ||
               process.env.FIREBASE_CONFIG ||
               process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!rawEnv) {
    const matchedKey = Object.keys(process.env).find(
      (k) => (k.toLowerCase().includes('firebase') || k.toLowerCase().includes('service_account')) &&
             process.env[k] &&
             (process.env[k].includes('{') || process.env[k].startsWith('ey'))
    );
    if (matchedKey) {
      rawEnv = process.env[matchedKey];
    }
  }

  if (rawEnv) {
    try {
      const raw = rawEnv.trim();
      let jsonString;
      if (raw.startsWith('{')) {
        jsonString = raw;
      } else {
        try {
          const decoded = Buffer.from(raw, 'base64').toString('utf8');
          jsonString = decoded.startsWith('{') ? decoded : raw;
        } catch (_) {
          jsonString = raw;
        }
      }

      try {
        serviceAccount = JSON.parse(jsonString);
      } catch (parseErr) {
        // Handle unescaped newlines in JSON strings
        const sanitized = jsonString.replace(/\r?\n/g, '\\n');
        serviceAccount = JSON.parse(sanitized);
      }
    } catch (e) {
      initError = `Failed parsing env service account: ${e.message}`;
      console.warn('[Firebase Config] Failed parsing env service account:', e.message);
    }
  }

  // 2. Check secret file paths (including Render /etc/secrets/ and local config)
  if (!serviceAccount) {
    const potentialPaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      '/etc/secrets/firebase-service-account.json',
      '/etc/secrets/firebase-service-account',
      '/etc/secrets/FIREBASE_SERVICE_ACCOUNT_KEY',
      path.join(__dirname, 'firebase-service-account.json')
    ];

    for (const p of potentialPaths) {
      if (p && fs.existsSync(p)) {
        try {
          const resolved = path.resolve(p);
          const raw = fs.readFileSync(resolved, 'utf8');
          serviceAccount = JSON.parse(raw);
          break;
        } catch (fileErr) {
          console.warn(`[Firebase Config] Failed reading file at ${p}:`, fileErr.message);
        }
      }
    }
  }

  if (serviceAccount) {
    // Ensure private_key has real newlines (common issue when parsed from env)
    if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    appInstance = getApps().length === 0
      ? initializeApp({ credential: cert(serviceAccount) })
      : getApps()[0];
    messagingInstance = getMessaging(appInstance);
    isInitialized = true;
    console.log(`[Firebase Admin] Successfully initialized Firebase Admin SDK for project: ${serviceAccount.project_id || 'unknown'}`);
  } else {
    if (!initError) {
      initError = 'No service account found in env or local file';
    }
    console.warn('[Firebase Admin] Notice: No Firebase service account configured.');
    console.warn('[Firebase Admin] Place "firebase-service-account.json" in "src/config/" or set FIREBASE_SERVICE_ACCOUNT_KEY in .env to enable real push notifications.');
  }
} catch (err) {
  initError = err.message;
  console.error('[Firebase Admin Initialization Error]:', err.message);
}

module.exports = {
  app: appInstance,
  messaging: messagingInstance,
  isFirebaseInitialized: () => isInitialized,
  getInitError: () => initError
};

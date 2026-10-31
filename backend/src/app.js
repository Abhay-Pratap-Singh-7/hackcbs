const express = require('express');
const applySecurityMiddlewares = require('./config/security');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const problemRoutes = require('./routes/problemRoutes');
const errorHandler = require('./middlewares/errorHandlerMiddleware');

const app = express();

// Trust reverse proxy (Required for Render, Heroku, AWS ELB rate limiting)
app.set('trust proxy', 1);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply Security Middlewares (Helmet, CORS, MongoSanitize, Global RateLimiter)
applySecurityMiddlewares(app);

// API Health Check Route
app.get('/api/health', async (req, res) => {
  const { isFirebaseInitialized, getInitError } = require('./config/firebase');
  const { getYugabytePool } = require('./config/yugabyte');
  const detectedEnvKeys = Object.keys(process.env).filter((k) =>
    k.toLowerCase().includes('firebase') ||
    k.toLowerCase().includes('google') ||
    k.toLowerCase().includes('service_account')
  );

  let yugabyteStatus = 'NOT_CONFIGURED';
  try {
    const p = getYugabytePool();
    if (p) {
      await p.query('SELECT 1');
      yugabyteStatus = 'CONNECTED';
    }
  } catch (err) {
    yugabyteStatus = 'ERROR: ' + err.message;
  }

  res.status(200).json({
    status: 'UP',
    message: 'SIH Backend API is operational',
    yugabyte: yugabyteStatus,
    firebaseInitialized: isFirebaseInitialized(),
    firebaseError: getInitError(),
    detectedEnvKeys,
    timestamp: new Date().toISOString(),
    env: {
      enableRecaptcha: process.env.ENABLE_RECAPTCHA === 'true'
    }
  });
});

// YugabyteDB Detailed Health & Info Probe
app.get('/api/health/yugabyte', async (req, res) => {
  const { getYugabytePool } = require('./config/yugabyte');
  const p = getYugabytePool();
  if (!p) {
    return res.status(503).json({ success: false, message: 'YugabyteDB pool not configured. Check DATABASE_URL.' });
  }

  const start = Date.now();
  try {
    const info = await p.query('SELECT current_database() as db, current_user as user, version() as version, now() as server_time');
    const latency = Date.now() - start;
    const tables = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");

    return res.status(200).json({
      success: true,
      status: 'CONNECTED',
      latencyMs: latency,
      database: info.rows[0].db,
      user: info.rows[0].user,
      serverTime: info.rows[0].server_time,
      version: info.rows[0].version.split('\n')[0],
      publicTables: tables.rows.map(r => r.table_name)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      status: 'ERROR',
      error: err.message
    });
  }
});

// Diagnostic route to trigger a direct FCM push from Render cloud
app.post('/api/test-direct-push', async (req, res) => {
  try {
    const { token } = req.body;
    const { messaging, isFirebaseInitialized } = require('./config/firebase');
    if (!isFirebaseInitialized() || !messaging) {
      return res.status(500).json({ success: false, error: 'Firebase not initialized on server' });
    }

    const { User } = require('./models/User');
    let targetToken = token;

    if (!targetToken) {
      const userWithToken = await User.findOne({ 'fcmTokens.0': { $exists: true } }).sort({ updatedAt: -1 });
      targetToken = userWithToken?.fcmTokens?.[userWithToken.fcmTokens.length - 1];
    }

    if (!targetToken) {
      return res.status(404).json({ success: false, error: 'No FCM token found in database or request' });
    }

    const message = {
      token: targetToken,
      notification: {
        title: 'Jharkhand Samadhan Live Test 🔔',
        body: 'Push notification from Render cloud server works perfectly!'
      },
      data: { type: 'TEST' },
      android: {
        priority: 'high',
        notification: {
          channelId: 'civic_notifications_high_importance',
          sound: 'default'
        }
      }
    };

    const response = await messaging.send(message);
    return res.status(200).json({
      success: true,
      messageId: response,
      tokenUsed: targetToken.substring(0, 15) + '...'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }
});

const uploadRoutes = require('./routes/uploadRoutes');
const universityRoutes = require('./routes/universityRoutes');
const industryRoutes = require('./routes/industryRoutes');
const govtRoutes = require('./routes/govtRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const translationRoutes = require('./routes/translationRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/govt', govtRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/translate', translationRoutes);

// Android AssetLinks verification route
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.example.sih_2026',
      sha256_cert_fingerprints: [
        'FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C'
      ]
    }
  }]);
});

// Web Deep Link Fallback Route:
// Opens app directly via Chrome Intent / custom scheme if installed; provides direct button and Play Store fallback.
app.get('/issue/:id', async (req, res) => {
  const problemId = req.params.id;
  const playStoreUrl = process.env.PLAYSTORE_URL || 'https://play.google.com/store/apps/details?id=com.example.sih_2026';
  const appSchemeUrl = `jharkhandsamadhan://issue/${problemId}`;
  const chromeIntentUrl = `intent://issue/${problemId}#Intent;scheme=jharkhandsamadhan;package=com.example.sih_2026;end`;

  try {
    const ProblemStatement = require('./models/ProblemStatement');
    const problem = await ProblemStatement.findById(problemId).lean();
    const title = problem ? (problem.title || 'Civic Issue') : 'Civic Report on Jharkhand Samadhan';
    const description = problem ? (problem.description ? problem.description.substring(0, 160) + '...' : '') : 'Report and track civic issues in Jharkhand.';
    const image = (problem && problem.imagesAndMedia && problem.imagesAndMedia.length > 0)
      ? problem.imagesAndMedia[0].url
      : 'https://picsum.photos/600/400';

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Jharkhand Samadhan</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="https://sih-26-jarr.onrender.com/issue/${problemId}" />
  <meta property="al:android:url" content="${appSchemeUrl}" />
  <meta property="al:android:package" content="com.example.sih_2026" />
  <meta property="al:android:app_name" content="Jharkhand Samadhan" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px 20px; background: #f8fafc; color: #1e293b; }
    .card { max-width: 480px; margin: 0 auto; background: white; border-radius: 20px; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
    .btn { display: inline-block; padding: 14px 24px; font-weight: bold; border-radius: 12px; text-decoration: none; margin: 8px 0; font-size: 15px; }
    .btn-primary { background: #16a34a; color: white; width: 85%; }
    .btn-secondary { background: #e2e8f0; color: #334155; width: 85%; }
  </style>
  <script>
    // Launch installed app via Chrome Intent or custom scheme
    window.location.href = "${chromeIntentUrl}";
    setTimeout(function() {
      window.location.href = "${appSchemeUrl}";
    }, 400);
  </script>
</head>
<body>
  <div class="card">
    <div style="font-size: 44px; margin-bottom: 12px;">🏛️</div>
    <h2 style="margin: 0 0 8px 0; font-size: 20px;">${title}</h2>
    <p style="color: #64748b; font-size: 14px; line-height: 1.5;">${description}</p>
    <div style="margin-top: 24px;">
      <a href="${appSchemeUrl}" class="btn btn-primary">Open in Jharkhand Samadhan App</a><br/>
      <a href="${playStoreUrl}" class="btn btn-secondary">Get on Google Play</a>
    </div>
  </div>
</body>
</html>`);
  } catch (_) {
    res.redirect(playStoreUrl);
  }
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;

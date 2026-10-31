const { createClient } = require('redis');

// If REDIS_URI is not provided (like on Render by default), we gracefully disable caching
// instead of spamming connection refused errors to localhost.
if (!process.env.REDIS_URI) {
  console.warn('[Redis Warning] REDIS_URI not set. Caching is gracefully DISABLED.');
  module.exports = { isReady: false };
} else {
  const uri = process.env.REDIS_URI;
  const isUpstash = uri.includes('upstash.io');
  
  // Force 'rediss://' (secure) if using Upstash to prevent "Socket closed unexpectedly"
  const finalUri = isUpstash ? uri.replace(/^redis:\/\//, 'rediss://') : uri;

  const redisClient = createClient({
    url: finalUri,
    socket: isUpstash ? { tls: true, rejectUnauthorized: false } : undefined
  });

  redisClient.on('error', (err) => {
    // Only log the message to prevent huge stack traces
    console.error('[Redis Error]:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  // Immediately connect
  (async () => {
    try {
      await redisClient.connect();
    } catch (err) {
      console.warn('[Redis Warning] Failed to connect initially. Proceeding without cache if offline.');
    }
  })();

  module.exports = redisClient;
}

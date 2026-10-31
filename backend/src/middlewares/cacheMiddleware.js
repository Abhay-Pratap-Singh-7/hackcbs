const redisClient = require('../config/redis');

/**
 * Express middleware to cache HTTP GET responses in Redis.
 * @param {number} durationInSeconds - How long the cache should live (TTL)
 */
const cacheMiddleware = (durationInSeconds) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if Redis is ready
    if (!redisClient.isReady) {
      return next();
    }

    try {
      // Create a unique cache key based on URL, query params, and user ID (if authenticated)
      const userId = req.user ? req.user._id.toString() : 'guest';
      const cacheKey = `cache:${userId}:${req.originalUrl || req.url}`;

      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        // Return cached response instantly
        return res.status(200).json(JSON.parse(cachedData));
      }

      // If not cached, we need to intercept the response
      // Override res.json to capture the data before sending it
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
          redisClient.setEx(cacheKey, durationInSeconds, JSON.stringify(body))
            .catch(err => console.error('[Redis Cache Set Error]:', err));
        }
        
        // Call the original res.json
        originalJson(body);
      };

      next();
    } catch (err) {
      console.error('[Redis Cache Middleware Error]:', err);
      // Fallback to normal execution if Redis fails
      next();
    }
  };
};

module.exports = cacheMiddleware;

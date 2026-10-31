const rateLimit = require('express-rate-limit');

// Rate Limiter: Maximum 5 OTP requests (generate/resend) per IP address every 15 minutes
const otpIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP address. Maximum 5 requests allowed per 15 minutes.'
  }
});

module.exports = { otpIpRateLimiter };

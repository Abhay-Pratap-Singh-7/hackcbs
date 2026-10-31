const express = require('express');
const router = express.Router();

const {
  signup,
  verifySignupOtp,
  resendOtp,
  login,
  verifyLoginOtp,
  refreshToken,
  logout,
  continueWithGoogle,
  getDigiLockerUrl,
  handleDigiLockerCallback,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const { otpIpRateLimiter } = require('../middlewares/rateLimiterMiddleware');
const { verifyRecaptcha } = require('../middlewares/recaptchaMiddleware');

// Signup Route (Supports reCAPTCHA check if enabled)
router.post('/signup', verifyRecaptcha, signup);

// Verify Signup OTP Route
router.post('/verify-signup-otp', verifySignupOtp);

// Resend OTP Route (IP Rate limited: max 5 attempts per 15 minutes)
router.post('/resend-otp', otpIpRateLimiter, resendOtp);

// Login Route (Supports reCAPTCHA check if enabled)
router.post('/login', verifyRecaptcha, login);

// Verify Login 2FA OTP Route
router.post('/verify-login-otp', verifyLoginOtp);

// Refresh Access Token Route
router.post('/refresh-token', refreshToken);

// Logout Route
router.post('/logout', logout);

// Continue with Google OAuth Route
router.post('/google', continueWithGoogle);

// Forgot Password Route
router.post('/forgot-password', forgotPassword);

// Reset Password Route
router.post('/reset-password', resetPassword);

// DigiLocker OAuth Routes
router.get('/digilocker/url', getDigiLockerUrl);
router.post('/digilocker/callback', handleDigiLockerCallback);

module.exports = router;

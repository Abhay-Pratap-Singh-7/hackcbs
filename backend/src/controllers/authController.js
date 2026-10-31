const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const Otp = require('../models/Otp');
const RefreshToken = require('../models/RefreshToken');
const {
  validateSignup,
  validateLogin,
  validateOtpVerification,
  validateResendOtp,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword
} = require('../validations/authValidation');
const { generateOtpCode, sendOtpEmail } = require('../services/emailService');
const {
  verifyGoogleIdToken,
  getDigiLockerAuthUrl,
  exchangeDigiLockerCode
} = require('../services/oauthService');

// Helper to generate JWT Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

// Helper to generate JWT Refresh Token and store in DB
const generateRefreshToken = async (user) => {
  const token = jwt.sign(
    { id: user._id, nonce: Date.now() + '-' + Math.random().toString(36).substring(2, 9) },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Calculate expiry date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Store in DB for revocation tracking
  await RefreshToken.create({
    userId: user._id,
    token: token,
    expiresAt: expiresAt
  });

  return token;
};

// @desc    Signup New User with Role Specification & Send OTP
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    if (req.body.profileDetails && !req.body.profileDetails.fullName && req.body.name) {
      req.body.profileDetails.fullName = req.body.name;
    }
    if (!req.body.name && req.body.profileDetails?.fullName) {
      req.body.name = req.body.profileDetails.fullName;
    }

    // Validate request payload
    const { error } = validateSignup(req.body);
    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    const { name, email, password, role, profileDetails, preferredLanguage } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.'
        });
      } else {
        // Overwrite unverified incomplete registration
        await User.deleteOne({ email });
      }
    }

    // Create user record
    const user = await User.create({
      name,
      email,
      password,
      role,
      profileDetails,
      preferredLanguage: preferredLanguage || 'English',
      isEmailVerified: false,
      authProvider: 'LOCAL'
    });

    // Generate & Send OTP
    const otpCode = generateOtpCode();
    await Otp.deleteMany({ email, purpose: 'SIGNUP_VERIFY' });
    await Otp.create({ email, otp: otpCode, purpose: 'SIGNUP_VERIFY' });

    sendOtpEmail(email, otpCode, 'SIGNUP_VERIFY').catch(err => console.error('[Email Error]:', err));

    return res.status(201).json({
      success: true,
      message: 'Signup initiated successfully! Please check your email for the OTP to complete verification.',
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: false
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Signup OTP
// @route   POST /api/auth/verify-signup-otp
// @access  Public
const verifySignupOtp = async (req, res, next) => {
  try {
    const { error } = validateOtpVerification(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, otp } = req.body;

    // Find OTP entry
    const otpRecord = await Otp.findOne({ email, otp, purpose: 'SIGNUP_VERIFY' });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new OTP.'
      });
    }

    // Find user and mark as verified
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    user.isEmailVerified = true;
    await user.save();

    // Remove used OTP
    await Otp.deleteMany({ email, purpose: 'SIGNUP_VERIFY' });

    // Generate Access & Refresh Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return res.status(200).json({
      success: true,
      message: 'Email address verified successfully!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          profileDetails: user.profileDetails,
          preferredLanguage: user.preferredLanguage
        },
        tokens: {
          accessToken,
          refreshToken
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public (Rate limited: 5 requests / IP)
const resendOtp = async (req, res, next) => {
  try {
    const { error } = validateResendOtp(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, purpose = 'SIGNUP_VERIFY' } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found registered with this email address.'
      });
    }

    if (purpose === 'SIGNUP_VERIFY' && user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your email address is already verified. You can log in.'
      });
    }

    // Delete existing OTP and create new one
    await Otp.deleteMany({ email, purpose });
    const otpCode = generateOtpCode();
    await Otp.create({ email, otp: otpCode, purpose });

    sendOtpEmail(email, otpCode, purpose).catch(err => console.error('[Email Error]:', err));

    return res.status(200).json({
      success: true,
      message: `A new OTP has been sent to ${email}`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login User & Request Login OTP Verification
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, password } = req.body;

    // Fetch user with password field included
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    // Verify Password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      // Trigger signup OTP send
      const otpCode = generateOtpCode();
      await Otp.deleteMany({ email, purpose: 'SIGNUP_VERIFY' });
      await Otp.create({ email, otp: otpCode, purpose: 'SIGNUP_VERIFY' });
      sendOtpEmail(email, otpCode, 'SIGNUP_VERIFY').catch(err => console.error('[Email Error]:', err));

      return res.status(403).json({
        success: false,
        message: 'Email address is not verified yet. A new verification OTP has been sent to your email.'
      });
    }

    // Generate Login Verification OTP
    const otpCode = generateOtpCode();
    await Otp.deleteMany({ email, purpose: 'LOGIN_VERIFY' });
    await Otp.create({ email, otp: otpCode, purpose: 'LOGIN_VERIFY' });

    sendOtpEmail(email, otpCode, 'LOGIN_VERIFY').catch(err => console.error('[Email Error]:', err));

    return res.status(200).json({
      success: true,
      message: 'Credentials verified! Please enter the OTP sent to your email to complete login.',
      data: {
        email: user.email,
        role: user.role,
        requiresOtp: true
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Login OTP & Complete Login
// @route   POST /api/auth/verify-login-otp
// @access  Public
const verifyLoginOtp = async (req, res, next) => {
  try {
    const { error } = validateOtpVerification(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email, otp, purpose: 'LOGIN_VERIFY' });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired login OTP.'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Clean up OTP
    await Otp.deleteMany({ email, purpose: 'LOGIN_VERIFY' });

    // Generate Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful! Redirecting to role dashboard...',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          profileDetails: user.profileDetails,
          preferredLanguage: user.preferredLanguage
        },
        tokens: {
          accessToken,
          refreshToken
        },
        accessToken,
        refreshToken,
        dashboardRedirect: `/api/dashboard/${user.role.toLowerCase()}`
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Refresh Access Token using Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res, next) => {
  try {
    const { error } = validateRefreshToken(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { refreshToken: tokenInput } = req.body;

    // Check if refresh token exists in DB
    const existingToken = await RefreshToken.findOne({ token: tokenInput });
    if (!existingToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh Token is invalid or has been revoked.'
      });
    }

    // Verify JWT signature
    let decoded;
    try {
      decoded = jwt.verify(tokenInput, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      await RefreshToken.deleteOne({ token: tokenInput });
      return res.status(401).json({
        success: false,
        message: 'Expired or invalid Refresh Token. Please log in again.'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // Generate New Access Token
    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      message: 'Access Token refreshed successfully.',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout User & Revoke Refresh Token
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  try {
    const { refreshToken: tokenInput } = req.body;
    if (tokenInput) {
      await RefreshToken.deleteOne({ token: tokenInput });
    }
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Continue with Google OAuth
// @route   POST /api/auth/google
// @access  Public
const continueWithGoogle = async (req, res, next) => {
  try {
    const { idToken, role = 'INDIVIDUAL_CITIZEN' } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token (idToken) is required.'
      });
    }

    // Verify Token (or fallback test mock if dummy token provided)
    let googleUser;
    if (idToken.startsWith('mock_google_token_')) {
      googleUser = {
        googleId: `G_${Date.now()}`,
        email: `google_${Date.now()}@gmail.com`,
        name: 'Google Test User',
        emailVerified: true
      };
    } else {
      googleUser = await verifyGoogleIdToken(idToken);
    }

    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        role: role,
        isEmailVerified: true,
        authProvider: 'GOOGLE',
        googleId: googleUser.googleId,
        avatar: googleUser.picture || null,
        profileDetails: {
          fullName: googleUser.name
        }
      });
    } else {
      user.googleId = googleUser.googleId;
      if (googleUser.picture && !user.avatar) {
        user.avatar = googleUser.picture;
      }
      user.isEmailVerified = true;
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return res.status(200).json({
      success: true,
      message: 'Authenticated with Google successfully!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          authProvider: user.authProvider,
          preferredLanguage: user.preferredLanguage
        },
        tokens: {
          accessToken,
          refreshToken
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get DigiLocker Auth Redirect URL
// @route   GET /api/auth/digilocker/url
// @access  Public
const getDigiLockerUrl = async (req, res, next) => {
  try {
    const { authUrl, state } = getDigiLockerAuthUrl();
    return res.status(200).json({
      success: true,
      data: {
        authUrl,
        state
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    DigiLocker Callback Handler
// @route   POST /api/auth/digilocker/callback
// @access  Public
const handleDigiLockerCallback = async (req, res, next) => {
  try {
    const { code, role = 'INDIVIDUAL_CITIZEN' } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required for DigiLocker login.'
      });
    }

    const dlProfile = await exchangeDigiLockerCode(code);

    let user = await User.findOne({ email: dlProfile.email });

    if (!user) {
      user = await User.create({
        name: dlProfile.name,
        email: dlProfile.email,
        role: role,
        isEmailVerified: true,
        authProvider: 'DIGILOCKER',
        digilockerId: dlProfile.digilockerId,
        profileDetails: {
          fullName: dlProfile.name
        }
      });
    } else {
      user.digilockerId = dlProfile.digilockerId;
      user.isEmailVerified = true;
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return res.status(200).json({
      success: true,
      message: 'DigiLocker verification & login successful!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          authProvider: user.authProvider,
          digilockerId: user.digilockerId,
          preferredLanguage: user.preferredLanguage
        },
        tokens: {
          accessToken,
          refreshToken
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Initiate Password Reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { error } = validateForgotPassword(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const email = req.body.email ? req.body.email.toLowerCase().trim() : '';
    const user = await User.findOne({ email });

    // We don't want to explicitly leak whether an email exists or not, but for UX we can return success anyway,
    // or return a 404. Since this is an internal portal, returning 404 is okay.
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    // Generate & Send OTP
    const otpCode = generateOtpCode();
    await Otp.deleteMany({ email, purpose: 'PASSWORD_RESET' });
    await Otp.create({ email, otp: otpCode, purpose: 'PASSWORD_RESET' });

    sendOtpEmail(email, otpCode, 'PASSWORD_RESET').catch(err => console.error('[Email Error]:', err));

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP has been sent to your email.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { error } = validateResetPassword(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const email = req.body.email ? req.body.email.toLowerCase().trim() : '';
    const otp = req.body.otp ? req.body.otp.toString().trim() : '';
    const { newPassword } = req.body;

    // Verify OTP
    const otpRecord = await Otp.findOne({ email, otp, purpose: 'PASSWORD_RESET' });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new password reset OTP.'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    // Update password
    user.password = newPassword;
    await user.save(); // Pre-save hook will hash the new password

    // Remove used OTP
    await Otp.deleteMany({ email, purpose: 'PASSWORD_RESET' });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};

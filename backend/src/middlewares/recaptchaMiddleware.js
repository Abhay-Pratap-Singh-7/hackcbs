const axios = require('axios');

const verifyRecaptcha = async (req, res, next) => {
  const enableRecaptcha = process.env.ENABLE_RECAPTCHA === 'true';

  if (!enableRecaptcha) {
    // Captcha disabled for testing / Postman testing
    return next();
  }

  const token = req.body.recaptchaToken || req.headers['x-recaptcha-token'];

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Google reCAPTCHA token is required when reCAPTCHA is enabled.'
    });
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    );

    if (response.data && response.data.success) {
      return next();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Google reCAPTCHA verification failed. Please try again.',
        errorCodes: response.data['error-codes'] || []
      });
    }
  } catch (error) {
    console.error('reCAPTCHA Verification Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error verifying reCAPTCHA.'
    });
  }
};

module.exports = { verifyRecaptcha };

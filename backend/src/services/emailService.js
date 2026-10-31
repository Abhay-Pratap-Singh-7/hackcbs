const nodemailer = require('nodemailer');
const axios = require('axios');

// Generate random 6-digit numeric OTP
const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getEmailContent = (otp, purpose) => {
  const isLogin = purpose === 'LOGIN_VERIFY';
  const isReset = purpose === 'PASSWORD_RESET';
  
  const title = isLogin 
    ? 'Login Verification' 
    : isReset ? 'Password Reset' : 'Account Registration';
    
  const subtitle = isLogin
    ? 'Welcome back to Samadhan Setu. Please verify your login attempt.'
    : isReset
    ? 'You have requested to reset your password. Use the OTP below.'
    : 'Welcome to Samadhan Setu! Please verify your email to activate your account.';

  // Indian Flag Colors: Saffron (#FF9933), Navy Blue (#000080), Green (#138808)
  const headerGradient = 'linear-gradient(135deg, #FF9933 0%, #E67E22 100%)'; // Saffron theme
  const accentColor = '#000080'; // Navy Blue for OTP text and accents
  const footerBorder = '#138808'; // Green accent for footer border

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Samadhan Setu OTP Verification</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 40px 0;">
      <tr>
        <td align="center">
          <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e9ecef;">
            <!-- Header -->
            <tr>
              <td align="center" style="background: ${headerGradient}; padding: 40px 20px; border-bottom: 4px solid #138808;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Samadhan Setu</h1>
                <p style="color: #ffffff; opacity: 0.9; margin: 10px 0 0 0; font-size: 16px; font-weight: 500; letter-spacing: 0.5px;">${title}</p>
              </td>
            </tr>
            <!-- Body Content -->
            <tr>
              <td style="padding: 40px 40px 20px 40px;">
                <p style="margin: 0 0 20px 0; color: #212529; font-size: 16px; line-height: 24px; font-weight: 600;">Namaskar,</p>
                <p style="margin: 0 0 30px 0; color: #495057; font-size: 16px; line-height: 24px;">${subtitle}</p>
                
                <!-- OTP Box -->
                <div style="background-color: #f8f9fa; border: 2px dashed ${accentColor}; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 30px;">
                  <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">Your Verification Code</p>
                  <div style="font-size: 40px; font-weight: 800; color: ${accentColor}; letter-spacing: 12px; margin-left: 12px;">
                    ${otp}
                  </div>
                </div>

                <p style="margin: 0 0 20px 0; color: #6c757d; font-size: 14px; line-height: 22px;">
                  This code is strictly confidential and valid for <strong>10 minutes</strong>. Do not share this code with anyone.
                </p>
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                <p style="margin: 0; color: #adb5bd; font-size: 12px; line-height: 18px; text-align: center;">
                  If you did not request this verification code, please ignore this email. No further action is required.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #dee2e6;">
                <p style="margin: 0; color: #495057; font-size: 13px; font-weight: 600;">
                  &copy; ${new Date().getFullYear()} Samadhan Setu. All rights reserved.
                </p>
                <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
                  Empowering Citizens. Enabling Solutions.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

/**
 * Send OTP Email via Brevo REST API (HTTPS Port 443)
 * Completely bypasses cloud provider (Render/AWS/GCP) SMTP port 587 timeouts!
 */
const sendEmailViaBrevoApi = async (email, otp, purpose) => {
  const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;
  const senderEmail = process.env.SENDER_EMAIL || process.env.FROM_EMAIL || 'varshneydev365@gmail.com';
  const senderName = process.env.SENDER_NAME || 'devdeveloper';

  const subject =
    purpose === 'LOGIN_VERIFY'
      ? 'SIH Portal - Login Verification OTP'
      : purpose === 'PASSWORD_RESET'
      ? 'SIH Portal - Password Reset OTP'
      : 'SIH Portal - Account Registration Verification OTP';

  const htmlContent = getEmailContent(otp, purpose);

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: email }],
    subject: subject,
    htmlContent: htmlContent
  };

  const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    timeout: 10000
  });

  console.log(`[Brevo REST API - Port 443]: OTP Email successfully sent to ${email} (MessageId: ${response.data.messageId || 'OK'})`);
  return true;
};

/**
 * Fallback Mailer using Standard SMTP Relay
 */
const sendEmailViaSmtp = async (email, otp, purpose) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 5000
  });

  const subject =
    purpose === 'LOGIN_VERIFY'
      ? 'SIH Portal - Login Verification OTP'
      : purpose === 'PASSWORD_RESET'
      ? 'SIH Portal - Password Reset OTP'
      : 'SIH Portal - Account Registration Verification OTP';

  const htmlContent = getEmailContent(otp, purpose);

  await transporter.sendMail({
    from: `"${process.env.SENDER_NAME || 'devdeveloper'}" <${process.env.SENDER_EMAIL || process.env.FROM_EMAIL || 'varshneydev365@gmail.com'}>`,
    to: email,
    subject: subject,
    html: htmlContent
  });

  console.log(`[Brevo SMTP Relay]: OTP Email successfully sent to ${email}`);
  return true;
};

// Main Unified Send Function
const sendOtpEmail = async (email, otp, purpose = 'SIGNUP_VERIFY') => {
  const brevoKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;

  // Option 1: Brevo REST API over HTTPS Port 443 (GUARANTEED TO WORK ON RENDER)
  if (brevoKey && brevoKey !== 'your_brevo_api_key_here') {
    try {
      return await sendEmailViaBrevoApi(email, otp, purpose);
    } catch (err) {
      console.warn('[Brevo REST API Warning]:', err.response ? JSON.stringify(err.response.data) : err.message);
      console.warn('[Fallback]: Attempting SMTP relay...');
    }
  }

  // Option 2: SMTP Relay
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      return await sendEmailViaSmtp(email, otp, purpose);
    } catch (err) {
      console.error('[SMTP Relay Error]:', err.message);
    }
  }

  // Option 3: Local Dev Mock Logger Fallback
  console.log('\n======================================================');
  console.log(`[DEV MOCK OTP SENDER] Target Email: ${email}`);
  console.log(`[DEV MOCK OTP SENDER] Purpose: ${purpose}`);
  console.log(`[DEV MOCK OTP SENDER] OTP CODE: >>> ${otp} <<<`);
  console.log('======================================================\n');
  return true;
};

module.exports = {
  generateOtpCode,
  sendOtpEmail
};

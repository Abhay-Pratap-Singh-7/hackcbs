const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google ID Token
const verifyGoogleIdToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified
    };
  } catch (error) {
    // If client ID unconfigured or payload parsing fallback for test token
    console.error('Google ID Token verification failed:', error.message);
    throw new Error('Invalid or expired Google OAuth Token.');
  }
};

// Generate DigiLocker Authorization URL
const getDigiLockerAuthUrl = () => {
  const clientId = process.env.DIGILOCKER_CLIENT_ID || 'mock_digilocker_client_id';
  const redirectUri = encodeURIComponent(
    process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:5000/api/auth/digilocker/callback'
  );
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://api.digitallocker.gov.in/public/oauth2/1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  return { authUrl, state };
};

// Exchange DigiLocker Code for User Profile Data
const exchangeDigiLockerCode = async (code) => {
  // If DigiLocker credentials are placeholder, return test profile
  const isDefaultCredentials =
    !process.env.DIGILOCKER_CLIENT_SECRET ||
    process.env.DIGILOCKER_CLIENT_SECRET === 'your_digilocker_client_secret_here';

  if (isDefaultCredentials) {
    console.log('[DigiLocker Mock OAuth Triggered]: Code =', code);
    return {
      digilockerId: `DL_${Date.now()}`,
      name: 'DigiLocker Verified Citizen',
      email: `digilocker_${Date.now()}@user.nic.in`,
      dob: '01/01/1995',
      gender: 'M'
    };
  }

  try {
    const tokenResponse = await axios.post(
      'https://api.digitallocker.gov.in/public/oauth2/1/token',
      new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        client_id: process.env.DIGILOCKER_CLIENT_ID,
        client_secret: process.env.DIGILOCKER_CLIENT_SECRET,
        redirect_uri: process.env.DIGILOCKER_REDIRECT_URI
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { access_token } = tokenResponse.data;

    // Fetch user details from DigiLocker API
    const userProfileResponse = await axios.get(
      'https://api.digitallocker.gov.in/public/oauth2/1/user',
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );

    return {
      digilockerId: userProfileResponse.data.digilockerid,
      name: userProfileResponse.data.name,
      email: userProfileResponse.data.email,
      dob: userProfileResponse.data.dob,
      gender: userProfileResponse.data.gender
    };
  } catch (error) {
    console.error('DigiLocker Code Exchange Error:', error.message);
    throw new Error('Failed to exchange code with DigiLocker API.');
  }
};

module.exports = {
  verifyGoogleIdToken,
  getDigiLockerAuthUrl,
  exchangeDigiLockerCode
};

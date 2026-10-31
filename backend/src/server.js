const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { connectYugabyte } = require('./config/yugabyte');

const PORT = process.env.PORT || 5000;

// Connect to Databases and start server
const startServer = async () => {
  try {
    await connectDB();
    await connectYugabyte();

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`[HackCBS Server Running]: Listening on port ${PORT}`);
      console.log(`[Environment]: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[reCAPTCHA Security]: ${process.env.ENABLE_RECAPTCHA === 'true' ? 'ENABLED' : 'DISABLED (Postman Testing Mode)'}`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

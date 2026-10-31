const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.warn('[MongoDB Warning]: MONGO_URI is missing or contains placeholders in backend/.env.');
    console.warn('[MongoDB Notice]: Database buffering disabled. Set a valid MONGO_URI to enable database operations.');
    mongoose.set('bufferCommands', false);
    return;
  }
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB Connected]: Host ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.warn('[MongoDB Notice]: Running without active MongoDB connection.');
    mongoose.set('bufferCommands', false);
  }
};

module.exports = connectDB;

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.warn('[MongoDB Notice]: MONGO_URI not configured. Operating in SQL/YugabyteDB mode.');
    return;
  }
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB Connected]: Host ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.warn('[MongoDB Notice]: Running without active MongoDB connection. Operating in SQL/YugabyteDB mode.');
  }
};

module.exports = connectDB;

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    otp: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: ['SIGNUP_VERIFY', 'LOGIN_VERIFY', 'PASSWORD_RESET'],
      default: 'SIGNUP_VERIFY'
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600 // Automatically delete from DB after 10 minutes (600 seconds)
    }
  }
);

const Otp = mongoose.model('Otp', otpSchema);

const yugabyteService = require('../services/yugabyteDataService');

const OtpProxy = new Proxy(Otp, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop === 'findOne') return (q) => yugabyteService.otps.findOne(q);
    if (prop === 'create') return (data) => yugabyteService.otps.create(data);
    if (prop === 'deleteMany') return (q) => yugabyteService.otps.deleteMany(q);
    return target[prop];
  }
});

module.exports = OtpProxy;

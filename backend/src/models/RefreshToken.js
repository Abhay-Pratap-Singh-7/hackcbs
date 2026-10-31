const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

// Index to automatically remove expired refresh tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

const yugabyteService = require('../services/yugabyteDataService');

const RefreshTokenProxy = new Proxy(RefreshToken, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop === 'create') return (data) => yugabyteService.refreshTokens.create(data);
    if (prop === 'findOne') return (q) => yugabyteService.refreshTokens.findOne(q);
    if (prop === 'deleteOne') return (q) => yugabyteService.refreshTokens.deleteOne(q);
    if (prop === 'deleteMany') return (q) => yugabyteService.refreshTokens.deleteMany(q);
    return target[prop];
  }
});

module.exports = RefreshTokenProxy;

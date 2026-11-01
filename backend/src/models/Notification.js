const mongoose = require('mongoose');

const NOTIFICATION_TYPES = {
  PROBLEM_POSTED: 'PROBLEM_POSTED',
  NEARBY_PROBLEM: 'NEARBY_PROBLEM',
  FOLLOWED_UPDATE: 'FOLLOWED_UPDATE',
  SYSTEM: 'SYSTEM'
};

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.SYSTEM,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProblemStatement',
      default: null,
      index: true
    },
    distanceKm: {
      type: Number,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying user notifications sorted by recent
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

const yugabyteService = require('../services/yugabyteDataService');

const NotificationProxy = new Proxy(Notification, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop === 'create') return (data) => yugabyteService.notifications.create(data);
    if (prop === 'find') return (q) => yugabyteService.notifications.find(q);
    return target[prop];
  }
});

module.exports = NotificationProxy;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;

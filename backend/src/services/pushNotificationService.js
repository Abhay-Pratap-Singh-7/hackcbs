const { messaging, isFirebaseInitialized } = require('../config/firebase');
const { User } = require('../models/User');

/**
 * Format key-value data payload so all values are strings (FCM requirement).
 */
const formatDataPayload = (data = {}) => {
  const formatted = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && val !== null) {
      formatted[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
    }
  }
  return formatted;
};

/**
 * Send push notification to a single user (across all their active devices).
 * Prunes expired or unregistered tokens automatically.
 */
const sendPushToUser = async (userId, { title, body, data = {} }) => {
  try {
    if (!isFirebaseInitialized() || !messaging) {
      console.log(`[PushService (Mock)] To User: ${userId} | Title: "${title}" | Body: "${body}"`);
      return { success: false, reason: 'Firebase not configured' };
    }

    const user = await User.findById(userId).select('fcmTokens').lean();
    if (!user || !Array.isArray(user.fcmTokens) || user.fcmTokens.length === 0) {
      console.warn(`[PushService] User ${userId} has no registered FCM tokens in DB`);
      return { success: false, reason: 'No registered device tokens' };
    }

    const tokens = [...new Set(user.fcmTokens)];
    const message = {
      tokens,
      notification: {
        title: title || 'Jharkhand Samadhan',
        body: body || ''
      },
      data: formatDataPayload(data),
      android: {
        priority: 'high',
        notification: {
          channelId: 'civic_notifications_high_importance',
          sound: 'default'
        }
      }
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log(`[PushService] Dispatched push to ${tokens.length} token(s) for user ${userId}. Success: ${response.successCount}, Failure: ${response.failureCount}`);

    // Prune stale or invalid tokens
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errCode = resp.error?.code;
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token' ||
          errCode === 'messaging/invalid-argument'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { $in: invalidTokens } }
      });
      console.log(`[PushService] Pruned ${invalidTokens.length} expired FCM tokens for user ${userId}`);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (err) {
    console.error(`[PushService Error - sendPushToUser]:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send push notification to multiple users simultaneously.
 */
const sendPushToUsers = async (userIds, { title, body, data = {} }) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { success: false, reason: 'No user IDs provided' };
    }

    if (!isFirebaseInitialized() || !messaging) {
      console.log(`[PushService (Mock Multicast)] To ${userIds.length} users | Title: "${title}"`);
      return { success: false, reason: 'Firebase not configured' };
    }

    const users = await User.find({
      _id: { $in: userIds },
      fcmTokens: { $exists: true, $not: { $size: 0 } }
    }).select('_id fcmTokens').lean();

    if (!users || users.length === 0) {
      return { success: false, reason: 'No users with FCM tokens found' };
    }

    // Collect all tokens with map back to userId
    const tokenToUserMap = new Map();
    for (const u of users) {
      for (const t of u.fcmTokens) {
        if (t && !tokenToUserMap.has(t)) {
          tokenToUserMap.set(t, u._id);
        }
      }
    }

    const allTokens = Array.from(tokenToUserMap.keys());
    if (allTokens.length === 0) return { success: false, reason: 'No tokens found' };

    // Batch send in chunks of 500 (FCM multicast max limit)
    const chunkSize = 500;
    const invalidTokens = [];
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < allTokens.length; i += chunkSize) {
      const chunk = allTokens.slice(i, i + chunkSize);
      const message = {
        tokens: chunk,
        notification: {
          title: title || 'Civic Alert',
          body: body || ''
        },
        data: formatDataPayload(data),
        android: {
          priority: 'high',
          notification: {
            channelId: 'civic_notifications_high_importance',
            sound: 'default'
          }
        }
      };

      const response = await messaging.sendEachForMulticast(message);
      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === 'messaging/registration-token-not-registered' ||
            errCode === 'messaging/invalid-registration-token'
          ) {
            invalidTokens.push(chunk[idx]);
          }
        }
      });
    }

    // Clean up stale tokens across users
    if (invalidTokens.length > 0) {
      await User.updateMany(
        { fcmTokens: { $in: invalidTokens } },
        { $pull: { fcmTokens: { $in: invalidTokens } } }
      );
      console.log(`[PushService] Pruned ${invalidTokens.length} expired FCM tokens from multicast.`);
    }

    return {
      success: true,
      totalSuccess,
      totalFailure
    };
  } catch (err) {
    console.error(`[PushService Error - sendPushToUsers]:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send push notification to a topic (e.g. 'district_ranchi' or 'all_citizens').
 */
const sendPushToTopic = async (topic, { title, body, data = {} }) => {
  try {
    if (!isFirebaseInitialized() || !messaging) {
      console.log(`[PushService (Mock Topic)] Topic: ${topic} | Title: "${title}"`);
      return { success: false, reason: 'Firebase not configured' };
    }

    // Normalize topic name: letters, numbers, hyphens, underscores only
    const sanitizedTopic = topic.replace(/[^a-zA-Z0-9-_.~%]+/g, '_');

    const message = {
      topic: sanitizedTopic,
      notification: {
        title: title || 'Civic Alert',
        body: body || ''
      },
      data: formatDataPayload(data),
      android: {
        priority: 'high',
        notification: {
          channelId: 'civic_notifications_high_importance',
          sound: 'default'
        }
      }
    };

    const response = await messaging.send(message);
    return { success: true, messageId: response };
  } catch (err) {
    console.error(`[PushService Error - sendPushToTopic]:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendPushToUser,
  sendPushToUsers,
  sendPushToTopic
};

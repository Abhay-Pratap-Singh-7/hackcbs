const Notification = require('../models/Notification');
const { User } = require('../models/User');

// @desc    Get current user's notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const query = { recipient: userId };
    if (req.query.type && req.query.type !== 'ALL') {
      query.type = req.query.type;
    }
    if (req.query.unreadOnly === 'true') {
      query.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate({
          path: 'problemId',
          select: '_id title location status isDuplicate duplicateOf masterTicketId imagesAndMedia'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false })
    ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      meta: {
        total,
        unreadCount,
        page,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });
    return res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update current user's live GPS location for nearby alerts
// @route   POST /api/notifications/update-location
// @access  Private
const updateUserLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, district } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      lastKnownLocation: {
        coordinates: {
          latitude: Number(latitude),
          longitude: Number(longitude)
        },
        district: district || req.user.profileDetails?.district || '',
        updatedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'User location updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register / Update FCM device token for current user
// @route   POST /api/notifications/fcm-token
// @access  Private
const registerFcmToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { fcmTokens: token.trim() }
    });

    return res.status(200).json({
      success: true,
      message: 'FCM device token registered successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unregister / Remove FCM device token (e.g. on logout)
// @route   DELETE /api/notifications/fcm-token
// @access  Private
const unregisterFcmToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      // If no token provided, clear all tokens for this user
      await User.findByIdAndUpdate(req.user._id, { $set: { fcmTokens: [] } });
    } else {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { fcmTokens: token.trim() }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'FCM device token unregistered successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get FCM configuration status & user token count (Diagnostic)
// @route   GET /api/notifications/fcm-status
// @access  Private
const getFcmStatus = async (req, res, next) => {
  try {
    const { isFirebaseInitialized } = require('../config/firebase');
    const user = await User.findById(req.user._id).select('fcmTokens').lean();
    return res.status(200).json({
      success: true,
      isFirebaseInitialized: isFirebaseInitialized(),
      tokensRegisteredCount: user?.fcmTokens?.length || 0,
      tokens: user?.fcmTokens || []
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send test push notification to current user (Diagnostic)
// @route   POST /api/notifications/test-push
// @access  Private
const sendTestPush = async (req, res, next) => {
  try {
    const pushNotificationService = require('../services/pushNotificationService');
    const result = await pushNotificationService.sendPushToUser(req.user._id, {
      title: 'HackCBS Portal Test 🔔',
      body: 'Push notification service is active and working properly!',
      data: { type: 'TEST' }
    });
    return res.status(200).json({
      success: true,
      result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  updateUserLocation,
  registerFcmToken,
  unregisterFcmToken,
  getFcmStatus,
  sendTestPush
};


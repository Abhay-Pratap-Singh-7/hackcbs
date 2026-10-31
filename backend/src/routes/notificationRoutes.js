const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');
const cache = require('../middlewares/cacheMiddleware');

router.use(protect);

router.get('/', cache(10), getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/fcm-status', getFcmStatus);
router.post('/test-push', sendTestPush);
router.put('/mark-all-read', markAllNotificationsAsRead);
router.put('/:id/read', markNotificationAsRead);
router.delete('/:id', deleteNotification);
router.post('/update-location', updateUserLocation);
router.post('/fcm-token', registerFcmToken);
router.delete('/fcm-token', unregisterFcmToken);

module.exports = router;

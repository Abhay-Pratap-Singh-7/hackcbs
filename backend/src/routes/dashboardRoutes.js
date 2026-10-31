const express = require('express');
const router = express.Router();
const { getDashboardData, updateProfile } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const cache = require('../middlewares/cacheMiddleware');

// Protected Dashboard route for authenticated user
router.route('/me')
  .get(protect, cache(120), getDashboardData)
  .put(protect, updateProfile);

// Specific role dashboard routes (all protected by JWT token, cached for 2 mins)
router.get('/:role', protect, cache(120), getDashboardData);

module.exports = router;

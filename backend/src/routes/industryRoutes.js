const express = require('express');
const router = express.Router();
const {
  getAllocatedSolutions,
  updateSolutionStatus,
  getAcceptedSolutions
} = require('../controllers/industryController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const cache = require('../middlewares/cacheMiddleware');
const { ROLES } = require('../models/User');

// Protect all industry routes and authorize only INDUSTRY_PARTNER
router.use(protect);
router.use(authorizeRoles(ROLES.INDUSTRY_PARTNER));

// Dashboard routes (Cached for 2 minutes)
router.get('/allocated-solutions', cache(120), getAllocatedSolutions);
router.get('/accepted-solutions', cache(120), getAcceptedSolutions);

// Status update routes
router.put('/solutions/:teamId/status', updateSolutionStatus);

module.exports = router;

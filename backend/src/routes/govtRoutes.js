const express = require('express');
const router = express.Router();
const { getGovtDashboard } = require('../controllers/govtController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const cache = require('../middlewares/cacheMiddleware');
const { ROLES } = require('../models/User');

// Protect all govt routes and authorize only GOVT_OFFICER
router.use(protect);
router.use(authorizeRoles(ROLES.GOVT_OFFICER));

// Dashboard route (Cached for 3 minutes)
router.get('/dashboard', cache(180), getGovtDashboard);

module.exports = router;

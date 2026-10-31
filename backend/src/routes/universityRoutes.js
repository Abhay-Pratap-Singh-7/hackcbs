const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { 
    getUniversityAllocatedProblems, 
    getUniversityDashboard, 
    updateProblemAllocationStatus, 
    getUniversityAcceptedProblems 
} = require('../controllers/universityController');

const {
    registerTeam,
    getUniversityTeams,
    submitSolution
} = require('../controllers/teamController');
const cache = require('../middlewares/cacheMiddleware');

// All routes require JWT login + INSTITUTE_ADMIN role
router.use(protect, authorizeRoles('INSTITUTE_ADMIN'));

// GET /api/university/dashboard — summary stats for university dashboard
router.get('/dashboard', cache(120), getUniversityDashboard);

// GET /api/university/allocated-problems — paginated list of allocated problems
router.get('/allocated-problems', cache(120), getUniversityAllocatedProblems);

// PUT /api/university/problems/:id/status — accept or reject an allocated problem
router.put('/problems/:id/status', updateProblemAllocationStatus);

// GET /api/university/accepted-problems — paginated list of problems accepted by this university
router.get('/accepted-problems', cache(120), getUniversityAcceptedProblems);

// ==========================================
// TEAMS & SOLUTIONS
// ==========================================

// POST /api/university/teams — register a new team for an accepted problem
router.post('/teams', registerTeam);

// GET /api/university/teams — get all registered teams
router.get('/teams', cache(120), getUniversityTeams);

// POST /api/university/teams/:id/solution — submit solution for a team
router.post('/teams/:id/solution', submitSolution);

module.exports = router;

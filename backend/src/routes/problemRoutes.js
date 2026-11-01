const express = require('express');
const router = express.Router();
const {
  createProblemStatement,
  getAllProblemStatements,
  getProblemStatementById,
  updateProblemStatement,
  deleteProblemStatement,
  toggleUpvote,
  toggleSaveProblem,
  toggleFollowProblem,
  reportDuplicate,
  reportProblemContent,
  addComment,
  getComments,
  getMatchedCompaniesForProblem,
  matchCompaniesForProblem,
  getMatchedCollegesForProblem,
  matchCollegesForProblem,
  replyToComment,
  toggleCommentLike,
  editComment,
  deleteComment
} = require('../controllers/problemController');
const { protect } = require('../middlewares/authMiddleware');
const cache = require('../middlewares/cacheMiddleware');

// All problem submission routes require JWT authentication token
router.use(protect);

// POST /api/problems/match-companies
router.post('/match-companies', matchCompaniesForProblem);
// POST /api/problems/match-colleges
router.post('/match-colleges', matchCollegesForProblem);

router
  .route('/')
  .post(createProblemStatement)
  .get(getAllProblemStatements);

router.post('/:id/upvote', toggleUpvote);
router.post('/:id/save', toggleSaveProblem);
router.post('/:id/follow', toggleFollowProblem);
router.post('/:id/duplicate-report', reportDuplicate);
router.post('/:id/report', reportProblemContent);

router.route('/:id/comments')
  .post(addComment)
  .get(getComments);

// Comment Actions (Reply, Like, Edit, Delete)
router.post('/comments/:commentId/reply', replyToComment);
router.post('/comments/:commentId/like', toggleCommentLike);
router.route('/comments/:commentId')
  .put(editComment)
  .delete(deleteComment);

router.get('/:id/matched-companies', getMatchedCompaniesForProblem);
router.get('/:id/matched-colleges', getMatchedCollegesForProblem);

router
  .route('/:id')
  .get(getProblemStatementById)
  .put(updateProblemStatement)
  .delete(deleteProblemStatement);

module.exports = router;


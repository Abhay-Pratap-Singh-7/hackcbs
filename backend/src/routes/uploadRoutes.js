const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFiles } = require('../controllers/uploadController');
const { protect } = require('../middlewares/authMiddleware');

// Set up multer to store files in memory (so we can pass the buffer directly to R2)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// @route   POST /api/upload and POST /api/upload/media
// @desc    Upload multiple files to Cloudflare R2
// @access  Private
router.post('/', protect, upload.array('files', 5), uploadFiles);
router.post('/media', protect, upload.array('files', 5), uploadFiles);

module.exports = router;

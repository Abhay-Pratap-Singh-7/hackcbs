const express = require('express');
const router = express.Router();
const { translateBatch, translateFromEnglish } = require('../services/translationService');

// @route   POST /api/translate/batch
// @desc    Translate an array of texts to the target language
// @access  Public
router.post('/batch', async (req, res, next) => {
  try {
    const { texts, targetLang } = req.body;
    if (!Array.isArray(texts)) {
      return res.status(400).json({ success: false, message: 'texts must be an array of strings' });
    }
    const translations = await translateBatch(texts, targetLang || 'Hindi');
    return res.status(200).json({ success: true, data: translations });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/translate/text
// @desc    Translate a single text string
// @access  Public
router.post('/text', async (req, res, next) => {
  try {
    const { text, targetLang } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'text is required' });
    }
    const translated = await translateFromEnglish(text, targetLang || 'Hindi');
    return res.status(200).json({ success: true, data: { original: text, translated } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

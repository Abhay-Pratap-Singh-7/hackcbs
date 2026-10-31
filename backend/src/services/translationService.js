let googleTranslateLib = null;
try {
  googleTranslateLib = require('@vitalets/google-translate-api').translate;
} catch (_) {
  // Graceful fallback to native fetch if package is not locally installed
}

const inMemoryCache = new Map();
const MAX_CACHE_SIZE = 2000;

const LANGUAGE_MAP = {
  'english': 'en',
  'hindi': 'hi',
  'marathi': 'mr',
  'tamil': 'ta',
  'telugu': 'te',
  'bengali': 'bn',
  'gujarati': 'gu',
  'kannada': 'kn',
  'malayalam': 'ml',
  'punjabi': 'pa',
  'urdu': 'ur',
  'odia': 'or',
  'santhali': 'sat',
  // Regional tribal language fallbacks to Hindi
  'khortha': 'hi',
  'nagpuri': 'hi',
  'kurukh': 'hi',
  'mundari': 'hi',
  'ho': 'hi',
  // ISO codes
  'en': 'en',
  'hi': 'hi',
  'mr': 'mr',
  'ta': 'ta',
  'te': 'te',
  'bn': 'bn',
  'gu': 'gu',
  'kn': 'kn',
  'ml': 'ml',
  'pa': 'pa',
  'ur': 'ur',
  'or': 'or',
  'sat': 'sat',
  'kht': 'hi',
  'sck': 'hi',
  'kru': 'hi',
  'unr': 'hi',
  'hoc': 'hi'
};

const getLanguageCode = (langNameOrCode) => {
  if (!langNameOrCode) return 'en';
  const key = langNameOrCode.toString().toLowerCase().trim();
  return LANGUAGE_MAP[key] || 'en';
};

/**
 * Low-level translator executing via library or public HTTP endpoint with timeout.
 */
const executeTranslation = async (text, targetCode) => {
  if (!text || !text.trim() || targetCode === 'en') return text;

  const trimmed = text.trim();
  const cacheKey = `${targetCode}:${trimmed}`;
  if (inMemoryCache.has(cacheKey)) {
    return inMemoryCache.get(cacheKey);
  }

  // 1. Try library if available
  if (googleTranslateLib) {
    try {
      const res = await googleTranslateLib(trimmed, { to: targetCode });
      if (res && res.text) {
        setCache(cacheKey, res.text);
        return res.text;
      }
    } catch (_) {}
  }

  // 2. Direct HTTP fallback (fast & resilient)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetCode}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map(segment => segment[0]).join('');
        if (translated) {
          setCache(cacheKey, translated);
          return translated;
        }
      }
    }
  } catch (error) {
    console.error(`[TranslationService] HTTP translation error for "${trimmed.slice(0, 30)}...":`, error.message);
  }

  return text;
};

const setCache = (key, value) => {
  if (inMemoryCache.size >= MAX_CACHE_SIZE) {
    const firstKeys = inMemoryCache.keys();
    for (let i = 0; i < 200; i++) {
      inMemoryCache.delete(firstKeys.next().value);
    }
  }
  inMemoryCache.set(key, value);
};

/**
 * Translates any given text to English.
 */
const translateToEnglish = async (text, sourceLangName = 'English') => {
  if (!text) return text;
  const sourceLang = getLanguageCode(sourceLangName);
  if (sourceLang === 'en') return text;
  return executeTranslation(text, 'en');
};

/**
 * Translates English text back to the user's preferred language.
 */
const translateFromEnglish = async (text, targetLangName) => {
  if (!text) return text;
  const targetLang = getLanguageCode(targetLangName);
  if (!targetLang || targetLang === 'en') return text;
  return executeTranslation(text, targetLang);
};

/**
 * Batch translates a list of texts into target language.
 * Returns an object map { [originalText]: translatedText }.
 */
const translateBatch = async (texts = [], targetLang = 'English') => {
  const targetCode = getLanguageCode(targetLang);
  const result = {};

  if (!Array.isArray(texts) || texts.length === 0 || targetCode === 'en') {
    for (const t of texts || []) {
      result[t] = t;
    }
    return result;
  }

  const uniqueTexts = Array.from(new Set(texts.filter(t => typeof t === 'string' && t.trim().length > 0)));

  // Run in chunks of 5 parallel requests
  const chunkSize = 5;
  for (let i = 0; i < uniqueTexts.length; i += chunkSize) {
    const chunk = uniqueTexts.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (text) => {
        const translated = await executeTranslation(text, targetCode);
        result[text] = translated;
      })
    );
  }

  return result;
};

module.exports = {
  getLanguageCode,
  translateToEnglish,
  translateFromEnglish,
  translateBatch
};

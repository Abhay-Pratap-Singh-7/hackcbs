import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Service responsible for real-time dynamic translation of text
/// from API responses, user feeds, and notifications.
class DynamicTranslationService {
  static final DynamicTranslationService _instance =
      DynamicTranslationService._internal();

  factory DynamicTranslationService() => _instance;

  DynamicTranslationService._internal();

  final http.Client _httpClient = http.Client();

  // In-memory cache: "targetCode_sourceText" -> "translatedText"
  final Map<String, String> _cache = {};
  static const int _maxCacheSize = 1500;

  /// Regional & standard language mapping for Google Translate.
  /// Tribal dialects without independent MT models are mapped to Hindi (hi)
  /// so citizens can read the civic content in familiar Devanagari script.
  static const Map<String, String> _languageCodeMap = {
    'en': 'en',
    'hi': 'hi',
    'bn': 'bn',
    'or': 'or',
    'sat': 'sat',
    'kht': 'hi', // Khortha -> Hindi fallback
    'sck': 'hi', // Nagpuri -> Hindi fallback
    'kru': 'hi', // Kurukh -> Hindi fallback
    'unr': 'hi', // Mundari -> Hindi fallback
    'hoc': 'hi', // Ho -> Hindi fallback
  };

  /// Resolves an app language code to a valid Google Translate target code.
  String resolveTargetLanguage(String? langCode) {
    if (langCode == null || langCode.isEmpty) return 'en';
    return _languageCodeMap[langCode.toLowerCase()] ?? langCode.toLowerCase();
  }

  /// Translates a single string into the target language.
  Future<String> translateText(
    String text, {
    required String targetLang,
  }) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return text;

    final targetCode = resolveTargetLanguage(targetLang);
    if (targetCode == 'en') return text;

    final cacheKey = '${targetCode}_$trimmed';
    if (_cache.containsKey(cacheKey)) {
      return _cache[cacheKey]!;
    }

    try {
      final uri = Uri.parse(
        'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=$targetCode&dt=t&q=${Uri.encodeComponent(trimmed)}',
      );

      final res = await _httpClient.get(uri).timeout(
            const Duration(seconds: 5),
          );

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (decoded is List && decoded.isNotEmpty && decoded[0] is List) {
          final segments = decoded[0] as List;
          final buffer = StringBuffer();
          for (final segment in segments) {
            if (segment is List && segment.isNotEmpty && segment[0] != null) {
              buffer.write(segment[0].toString());
            }
          }
          final translated = buffer.toString();
          if (translated.isNotEmpty) {
            _saveToCache(cacheKey, translated);
            return translated;
          }
        }
      }
    } catch (e) {
      debugPrint('[DynamicTranslation] Error translating "$trimmed": $e');
    }

    // Graceful fallback to original text on network or parse error
    return text;
  }

  /// Batch translates a collection of distinct texts concurrently.
  /// Returns a map of { originalText : translatedText }.
  Future<Map<String, String>> translateBatch(
    List<String> texts, {
    required String targetLang,
  }) async {
    final targetCode = resolveTargetLanguage(targetLang);
    final result = <String, String>{};

    if (targetCode == 'en' || texts.isEmpty) {
      for (final t in texts) {
        result[t] = t;
      }
      return result;
    }

    // Filter unique, non-empty strings
    final uniqueTexts = texts
        .where((t) => t.trim().isNotEmpty)
        .toSet()
        .toList(growable: false);

    final uncached = <String>[];
    for (final text in uniqueTexts) {
      final key = '${targetCode}_${text.trim()}';
      if (_cache.containsKey(key)) {
        result[text] = _cache[key]!;
      } else {
        uncached.add(text);
      }
    }

    if (uncached.isEmpty) {
      return result;
    }

    // Process uncached items in small concurrent chunks (max 5 parallel requests)
    const chunkSize = 5;
    for (var i = 0; i < uncached.length; i += chunkSize) {
      final end = (i + chunkSize < uncached.length) ? i + chunkSize : uncached.length;
      final chunk = uncached.sublist(i, end);

      await Future.wait(
        chunk.map((text) async {
          final translated = await translateText(text, targetLang: targetCode);
          result[text] = translated;
        }),
      );
    }

    return result;
  }

  void _saveToCache(String key, String value) {
    if (_cache.length >= _maxCacheSize) {
      // Remove oldest 20% entries when capacity is reached
      final keysToRemove = _cache.keys.take(200).toList();
      for (final k in keysToRemove) {
        _cache.remove(k);
      }
    }
    _cache[key] = value;
  }

  /// Clear in-memory translation cache
  void clearCache() {
    _cache.clear();
  }
}

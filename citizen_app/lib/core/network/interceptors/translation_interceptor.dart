import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../localization/services/dynamic_translation_service.dart';

/// Interceptor that transparently translates dynamic API response payloads
/// (e.g. civic problems, comments, notifications) into the citizen's selected language
/// before the data is parsed into repository models.
class TranslationInterceptor extends Interceptor {
  final DynamicTranslationService _translationService =
      DynamicTranslationService();

  static const String _langPrefKey = 'selected_app_language_code';

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final langCode = prefs.getString(_langPrefKey) ?? 'en';
      options.headers['Accept-Language'] = langCode;
    } catch (_) {}
    return handler.next(options);
  }

  @override
  void onResponse(
    Response response,
    ResponseInterceptorHandler handler,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final langCode = prefs.getString(_langPrefKey) ?? 'en';

      // English requires no translation mid-way
      if (langCode == 'en' || response.data == null) {
        return handler.next(response);
      }

      final path = response.requestOptions.path;

      // Handle Problem comments
      if (path.contains('/comments')) {
        await _translateComments(response.data, langCode);
      }
      // Handle Problems feed & Single Problem details
      else if (path.contains('/problems')) {
        await _translateProblems(response.data, langCode);
      }
      // Handle Citizen Notifications
      else if (path.contains('/notifications')) {
        await _translateNotifications(response.data, langCode);
      }
    } catch (e, stack) {
      debugPrint('[TranslationInterceptor] Interception error: $e\n$stack');
    }

    return handler.next(response);
  }

  Future<void> _translateProblems(dynamic data, String langCode) async {
    if (data is! Map) return;

    final dynamic content = data['data'];
    final textsToTranslate = <String>[];

    void collectProblemTexts(Map item) {
      if (item['title'] is String && (item['title'] as String).isNotEmpty) {
        textsToTranslate.add(item['title']);
      }
      if (item['description'] is String && (item['description'] as String).isNotEmpty) {
        textsToTranslate.add(item['description']);
      }
      if (item['location'] is Map) {
        final loc = item['location'] as Map;
        if (loc['landmark'] is String && (loc['landmark'] as String).isNotEmpty) {
          textsToTranslate.add(loc['landmark']);
        }
      }
      if (item['aiAnalysis'] is Map) {
        final ai = item['aiAnalysis'] as Map;
        if (ai['summary'] is String && (ai['summary'] as String).isNotEmpty) {
          textsToTranslate.add(ai['summary']);
        }
        if (ai['suggested_solution'] is String &&
            (ai['suggested_solution'] as String).isNotEmpty) {
          textsToTranslate.add(ai['suggested_solution']);
        }
        if (ai['problem_classification'] is String &&
            (ai['problem_classification'] as String).isNotEmpty) {
          textsToTranslate.add(ai['problem_classification']);
        }
      }
    }

    void applyProblemTranslations(Map item, Map<String, String> translationMap) {
      if (item['title'] is String && translationMap.containsKey(item['title'])) {
        item['title'] = translationMap[item['title']];
      }
      if (item['description'] is String &&
          translationMap.containsKey(item['description'])) {
        item['description'] = translationMap[item['description']];
      }
      if (item['location'] is Map) {
        final loc = item['location'] as Map;
        if (loc['landmark'] is String &&
            translationMap.containsKey(loc['landmark'])) {
          loc['landmark'] = translationMap[loc['landmark']];
        }
      }
      if (item['aiAnalysis'] is Map) {
        final ai = item['aiAnalysis'] as Map;
        if (ai['summary'] is String && translationMap.containsKey(ai['summary'])) {
          ai['summary'] = translationMap[ai['summary']];
        }
        if (ai['suggested_solution'] is String &&
            translationMap.containsKey(ai['suggested_solution'])) {
          ai['suggested_solution'] = translationMap[ai['suggested_solution']];
        }
        if (ai['problem_classification'] is String &&
            translationMap.containsKey(ai['problem_classification'])) {
          ai['problem_classification'] =
              translationMap[ai['problem_classification']];
        }
      }
    }

    if (content is List) {
      for (final item in content) {
        if (item is Map) collectProblemTexts(item);
      }

      if (textsToTranslate.isNotEmpty) {
        final translationMap = await _translationService.translateBatch(
          textsToTranslate,
          targetLang: langCode,
        );

        for (final item in content) {
          if (item is Map) applyProblemTranslations(item, translationMap);
        }
      }
    } else if (content is Map) {
      collectProblemTexts(content);

      if (textsToTranslate.isNotEmpty) {
        final translationMap = await _translationService.translateBatch(
          textsToTranslate,
          targetLang: langCode,
        );

        applyProblemTranslations(content, translationMap);
      }
    }
  }

  Future<void> _translateComments(dynamic data, String langCode) async {
    if (data is! Map) return;
    final dynamic content = data['data'];
    if (content is! List) return;

    final texts = <String>[];
    for (final item in content) {
      if (item is Map && item['text'] is String && (item['text'] as String).isNotEmpty) {
        texts.add(item['text']);
      }
    }

    if (texts.isEmpty) return;

    final translationMap = await _translationService.translateBatch(
      texts,
      targetLang: langCode,
    );

    for (final item in content) {
      if (item is Map && item['text'] is String && translationMap.containsKey(item['text'])) {
        item['text'] = translationMap[item['text']];
      }
    }
  }

  Future<void> _translateNotifications(dynamic data, String langCode) async {
    if (data is! Map) return;
    final dynamic content = data['data'];
    if (content is! List) return;

    final texts = <String>[];
    for (final item in content) {
      if (item is Map) {
        if (item['title'] is String && (item['title'] as String).isNotEmpty) {
          texts.add(item['title']);
        }
        if (item['message'] is String && (item['message'] as String).isNotEmpty) {
          texts.add(item['message']);
        }
      }
    }

    if (texts.isEmpty) return;

    final translationMap = await _translationService.translateBatch(
      texts,
      targetLang: langCode,
    );

    for (final item in content) {
      if (item is Map) {
        if (item['title'] is String && translationMap.containsKey(item['title'])) {
          item['title'] = translationMap[item['title']];
        }
        if (item['message'] is String &&
            translationMap.containsKey(item['message'])) {
          item['message'] = translationMap[item['message']];
        }
      }
    }
  }
}

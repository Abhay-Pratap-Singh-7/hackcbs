import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app_language.dart';
import 'services/dynamic_translation_service.dart';

class LanguageCubit extends Cubit<AppLanguage> {
  static const String _prefKey = 'selected_app_language_code';

  LanguageCubit() : super(AppLanguage.english) {
    loadSavedLanguage();
  }

  Future<void> loadSavedLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final code = prefs.getString(_prefKey);
      if (code != null) {
        emit(AppLanguage.fromCode(code));
      }
    } catch (_) {}
  }

  Future<void> changeLanguage(AppLanguage language) async {
    DynamicTranslationService().clearCache();
    emit(language);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefKey, language.code);
    } catch (_) {}
  }
}

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

/// Fallback Material Localizations Delegate that supplies standard MaterialLocalizations
/// (defaulting to Hindi/English) for regional and indigenous dialects not built into Flutter SDK (like sat, kht, sck, kru, unr, hoc).
class FallbackMaterialLocalizationsDelegate extends LocalizationsDelegate<MaterialLocalizations> {
  const FallbackMaterialLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<MaterialLocalizations> load(Locale locale) async {
    try {
      if (GlobalMaterialLocalizations.delegate.isSupported(locale)) {
        return await GlobalMaterialLocalizations.delegate.load(locale);
      }
    } catch (_) {}
    // Fallback to Hindi if available, otherwise English
    try {
      return await GlobalMaterialLocalizations.delegate.load(const Locale('hi'));
    } catch (_) {
      return await GlobalMaterialLocalizations.delegate.load(const Locale('en'));
    }
  }

  @override
  bool shouldReload(FallbackMaterialLocalizationsDelegate old) => false;
}

/// Fallback Cupertino Localizations Delegate
class FallbackCupertinoLocalizationsDelegate extends LocalizationsDelegate<CupertinoLocalizations> {
  const FallbackCupertinoLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<CupertinoLocalizations> load(Locale locale) async {
    try {
      if (GlobalCupertinoLocalizations.delegate.isSupported(locale)) {
        return await GlobalCupertinoLocalizations.delegate.load(locale);
      }
    } catch (_) {}
    return await GlobalCupertinoLocalizations.delegate.load(const Locale('en'));
  }

  @override
  bool shouldReload(FallbackCupertinoLocalizationsDelegate old) => false;
}

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../language_cubit.dart';
import '../app_language.dart';
import '../services/dynamic_translation_service.dart';

/// A reactive Text widget that automatically translates dynamic strings
/// whenever the user switches the active app language in [LanguageCubit].
class DynamicText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  const DynamicText(
    this.text, {
    super.key,
    this.style,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LanguageCubit, AppLanguage>(
      builder: (context, currentLanguage) {
        if (currentLanguage.code == 'en' || text.trim().isEmpty) {
          return Text(
            text,
            style: style,
            textAlign: textAlign,
            maxLines: maxLines,
            overflow: overflow,
          );
        }

        return FutureBuilder<String>(
          future: DynamicTranslationService().translateText(
            text,
            targetLang: currentLanguage.code,
          ),
          initialData: text,
          builder: (context, snapshot) {
            final displayText = snapshot.data ?? text;
            return Text(
              displayText,
              style: style,
              textAlign: textAlign,
              maxLines: maxLines,
              overflow: overflow,
            );
          },
        );
      },
    );
  }
}

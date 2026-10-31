enum AppLanguage {
  english('en', 'English', 'English', '🇬🇧'),
  hindi('hi', 'Hindi', 'हिन्दी', '🇮🇳'),
  santhali('sat', 'Santhali', 'ᱥᱟᱱᱛᱟᱲᱤ / संथाली', '🏹'),
  khortha('kht', 'Khortha', 'खोरठा', '🌾'),
  nagpuri('sck', 'Nagpuri / Sadri', 'नागपुरी / सादरी', '🏞️'),
  bengali('bn', 'Bengali', 'বাংলা', '🇮🇳'),
  odia('or', 'Odia', 'ଓଡ଼ିଆ', '🇮🇳'),
  kurukh('kru', 'Kurukh / Oraon', 'कुड़ुख़', '🌿'),
  mundari('unr', 'Mundari', 'मुण्डारी', '⛰️'),
  ho('hoc', 'Ho', 'हो / ᱦᱳ', '🌳');

  final String code;
  final String englishName;
  final String nativeName;
  final String icon;

  const AppLanguage(this.code, this.englishName, this.nativeName, this.icon);

  static AppLanguage fromCode(String? code) {
    if (code == null) return AppLanguage.english;
    return AppLanguage.values.firstWhere(
      (lang) => lang.code == code,
      orElse: () => AppLanguage.english,
    );
  }
}

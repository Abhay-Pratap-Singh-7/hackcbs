class AppConstants {
  static const String appTitle = 'Samadhan';
  static const String appTagline = 'Aapka Gaon, Hamari Zimmedari';

  // Assets
  static const String appLogo = 'assets/images/logo.png';
  static const String authBackground = 'assets/images/auth_bg.png';

  // Regex Patterns
  static final RegExp phoneRegex = RegExp(r'^[6-9]\d{9}$');
  static final RegExp emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  // India Districts (24 Districts)
  static const List<String> indiaDistricts = [
    'Bokaro',
    'Chatra',
    'Deoghar',
    'Dhanbad',
    'Dumka',
    'East Singhbhum (Jamshedpur)',
    'Garhwa',
    'Giridih',
    'Godda',
    'Gumla',
    'Hazaribagh',
    'Jamtara',
    'Khunti',
    'Koderma',
    'Latehar',
    'Lohardaga',
    'Pakur',
    'Palamu',
    'Ramgarh',
    'Ranchi',
    'Sahebganj',
    'Seraikela Kharsawan',
    'Simdega',
    'West Singhbhum (Chaibasa)',
  ];
}

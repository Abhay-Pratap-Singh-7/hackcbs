import 'package:flutter_test/flutter_test.dart';
import 'package:sih_2026/main.dart';

void main() {
  testWidgets('App launches with Onboarding screen', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    await tester.pump();

    // Verify Onboarding / App displays
    expect(find.text('Skip'), findsOneWidget);
  });
}

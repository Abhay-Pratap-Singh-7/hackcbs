import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:sih_2026/core/theme/app_theme.dart';
import 'package:sih_2026/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:sih_2026/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_event.dart';
import 'package:sih_2026/features/auth/presentation/pages/login_page.dart';
import 'package:sih_2026/features/auth/presentation/pages/signup_page.dart';
import 'package:sih_2026/features/home/presentation/pages/home_page.dart';
import 'package:sih_2026/features/home/presentation/pages/main_scaffold.dart';
import 'package:sih_2026/features/onboarding/presentation/pages/onboarding_page.dart';
import 'package:sih_2026/features/onboarding/presentation/pages/splash_page.dart';
import 'package:sih_2026/features/reports/presentation/pages/my_reports_page.dart';
import 'package:sih_2026/features/reports/presentation/pages/report_issue_page.dart';
import 'package:sih_2026/features/reports/presentation/pages/issue_details_page.dart';
import 'package:sih_2026/features/reports/presentation/pages/ai_analysis_page.dart';
import 'package:latlong2/latlong.dart';
import 'package:sih_2026/features/explore/presentation/pages/explore_map_page.dart';
import 'package:sih_2026/features/profile/presentation/pages/profile_page.dart';
import 'package:sih_2026/features/profile/presentation/pages/activity_page.dart';
import 'package:sih_2026/features/profile/presentation/pages/civic_score_page.dart';
import 'package:sih_2026/features/notifications/presentation/pages/notification_page.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:sih_2026/core/services/push_notification_service.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:sih_2026/core/localization/language_cubit.dart';
import 'package:sih_2026/core/localization/app_language.dart';
import 'package:sih_2026/core/localization/fallback_localizations_delegate.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('[Firebase Core Init Error]: $e');
  }
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final AuthRepositoryImpl _authRepository;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    final authRemoteDataSource = AuthRemoteDataSourceImpl();
    _authRepository = AuthRepositoryImpl(
      remoteDataSource: authRemoteDataSource,
    );

    _router = _buildRouter();

    // Initialize Push Notifications with deep linking navigation
    PushNotificationService().initialize(
      onNavigate: (path) {
        try {
          _router.push(path);
        } catch (_) {
          _router.go(path);
        }
      },
    );
  }

  GoRouter _buildRouter() {
    return GoRouter(
      initialLocation: '/splash',
      routes: [
        GoRoute(
          path: '/splash',
          builder: (context, state) => const SplashPage(),
        ),
        GoRoute(
          path: '/onboarding',
          builder: (context, state) => const OnboardingPage(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginPage(),
        ),
        GoRoute(
          path: '/signup',
          builder: (context, state) => const SignUpPage(),
        ),
        ShellRoute(
          builder: (context, state, child) {
            // Determine current index based on route
            int currentIndex = 0;
            if (state.uri.path.startsWith('/explore')) currentIndex = 1;
            if (state.uri.path.startsWith('/activity')) currentIndex = 2;
            if (state.uri.path.startsWith('/profile')) currentIndex = 3;
            
            return MainScaffold(
              currentIndex: currentIndex,
              child: child,
            );
          },
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomePage(),
            ),
            GoRoute(
              path: '/explore',
              builder: (context, state) {
                final problemId = state.uri.queryParameters['problemId'];
                LatLng? location;
                if (state.extra is LatLng) {
                  location = state.extra as LatLng;
                } else {
                  final lat = double.tryParse(state.uri.queryParameters['lat'] ?? '');
                  final lng = double.tryParse(state.uri.queryParameters['lng'] ?? '');
                  if (lat != null && lng != null) {
                    location = LatLng(lat, lng);
                  }
                }
                return ExploreMapPage(
                  initialProblemId: problemId,
                  initialLocation: location,
                );
              },
            ),
            GoRoute(
              path: '/activity',
              builder: (context, state) => const ActivityPage(),
            ),
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfilePage(),
            ),
          ],
        ),
        GoRoute(
          path: '/report_issue',
          builder: (context, state) => const ReportIssuePage(),
        ),
        GoRoute(
          path: '/issue_details',
          builder: (context, state) {
            final args = state.extra as Map<String, dynamic>?;
            final problemId = state.uri.queryParameters['id'] ?? state.uri.queryParameters['problemId'];
            return IssueDetailsPage(args: args, problemId: problemId);
          },
        ),
        // Deep Link destination route: /issue/:id
        GoRoute(
          path: '/issue/:id',
          builder: (context, state) {
            final id = state.pathParameters['id'];
            final args = state.extra as Map<String, dynamic>?;
            return IssueDetailsPage(args: args, problemId: id);
          },
        ),
        GoRoute(
          path: '/ai_analysis',
          builder: (context, state) {
            final args = state.extra as Map<String, dynamic>?;
            return AiAnalysisPage(analysisData: args);
          },
        ),
        GoRoute(
          path: '/my_reports',
          builder: (context, state) => const MyReportsPage(),
        ),
        GoRoute(
          path: '/civic_score',
          builder: (context, state) => const CivicScorePage(),
        ),
        GoRoute(
          path: '/notifications',
          builder: (context, state) => const NotificationPage(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return RepositoryProvider<AuthRepositoryImpl>.value(
      value: _authRepository,
      child: MultiBlocProvider(
        providers: [
          BlocProvider(
            create: (context) => AuthBloc(authRepository: _authRepository)..add(const CheckAuthStatusEvent()),
          ),
          BlocProvider(
            create: (context) => LanguageCubit(),
          ),
        ],
        child: BlocBuilder<LanguageCubit, AppLanguage>(
          builder: (context, currentLanguage) {
            return MaterialApp.router(
              title: 'Jharkhand Samadhan',
              debugShowCheckedModeBanner: false,
              theme: AppTheme.lightTheme,
              locale: Locale(currentLanguage.code),
              supportedLocales: AppLanguage.values.map((l) => Locale(l.code)).toList(),
              localizationsDelegates: const [
                FallbackMaterialLocalizationsDelegate(),
                FallbackCupertinoLocalizationsDelegate(),
                GlobalMaterialLocalizations.delegate,
                GlobalWidgetsLocalizations.delegate,
                GlobalCupertinoLocalizations.delegate,
              ],
              routerConfig: _router,
            );
          },
        ),
      ),
    );
  }
}


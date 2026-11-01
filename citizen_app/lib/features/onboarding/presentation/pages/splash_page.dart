import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/constants/app_constants.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_state.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _slideAnimation;

  DateTime? _initTime;
  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();
    _initTime = DateTime.now();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: const Interval(0.0, 0.75, curve: Curves.easeIn),
    );

    _scaleAnimation = Tween<double>(begin: 0.88, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.0, 0.85, curve: Curves.easeOutBack),
      ),
    );

    _slideAnimation = Tween<double>(begin: 20.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.2, 0.9, curve: Curves.easeOutCubic),
      ),
    );

    _animController.forward();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkExistingState();
    });
  }

  void _checkExistingState() {
    final currentStatus = context.read<AuthBloc>().state.status;
    if (currentStatus == AuthStatus.authenticated) {
      _navigateWithDelay('/home');
    } else if (currentStatus == AuthStatus.unauthenticated) {
      _navigateWithDelay('/onboarding');
    }
  }

  void _navigateWithDelay(String targetRoute) async {
    if (_hasNavigated) return;
    final elapsed = DateTime.now().difference(_initTime!).inMilliseconds;
    const minSplashDuration = 1800; // Allow sufficient time for brand impression
    if (elapsed < minSplashDuration) {
      await Future.delayed(Duration(milliseconds: minSplashDuration - elapsed));
    }
    if (mounted && !_hasNavigated) {
      _hasNavigated = true;
      context.go(targetRoute);
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state.status == AuthStatus.authenticated) {
          _navigateWithDelay('/home');
        } else if (state.status == AuthStatus.unauthenticated) {
          _navigateWithDelay('/onboarding');
        }
      },
      child: Scaffold(
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF042F22), // Deep Evergreen
                Color(0xFF064E3B), // Primary Deep Forest Green
                Color(0xFF021B13), // Rich Dark Night Green
              ],
              stops: [0.0, 0.5, 1.0],
            ),
          ),
          child: Stack(
            children: [
              // Atmospheric glowing orbs
              Positioned(
                top: -80,
                right: -80,
                child: Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.primaryLight.withValues(alpha: 0.12),
                  ),
                ),
              ),
              Positioned(
                bottom: -100,
                left: -80,
                child: Container(
                  width: 320,
                  height: 320,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF10B981).withValues(alpha: 0.10),
                  ),
                ),
              ),

              // Soft central radial aura behind logo
              Center(
                child: Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.white.withValues(alpha: 0.08),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),

              // Centered Main Content
              SafeArea(
                child: Column(
                  children: [
                    const Spacer(flex: 2),

                    // Animated Logo & Identity
                    Center(
                      child: FadeTransition(
                        opacity: _fadeAnimation,
                        child: ScaleTransition(
                          scale: _scaleAnimation,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Emblem with shadow
                              Container(
                                constraints: BoxConstraints(
                                  maxWidth: size.width * 0.78,
                                  maxHeight: 220,
                                ),
                                decoration: BoxDecoration(
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.35),
                                      blurRadius: 32,
                                      spreadRadius: -4,
                                      offset: const Offset(0, 14),
                                    ),
                                  ],
                                ),
                                child: Image.asset(
                                  AppConstants.appLogo,
                                  fit: BoxFit.contain,
                                ),
                              ),

                              const SizedBox(height: 28),

                              // Animated Badge & Tagline
                              AnimatedBuilder(
                                animation: _slideAnimation,
                                builder: (context, child) {
                                  return Transform.translate(
                                    offset: Offset(0, _slideAnimation.value),
                                    child: child,
                                  );
                                },
                                child: Column(
                                  children: [
                                    // Glassmorphism Department / Identity Chip
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(
                                          color: Colors.white.withValues(alpha: 0.22),
                                          width: 1,
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                            width: 7,
                                            height: 7,
                                            decoration: const BoxDecoration(
                                              color: Color(0xFF86EFAC),
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'INDIA SAMADHAN',
                                            style: GoogleFonts.poppins(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF86EFAC),
                                              letterSpacing: 2.0,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),

                                    const SizedBox(height: 14),

                                    // Main Tagline
                                    Text(
                                      AppConstants.appTagline,
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.poppins(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white.withValues(alpha: 0.95),
                                        letterSpacing: 0.4,
                                        shadows: [
                                          Shadow(
                                            color: Colors.black.withValues(alpha: 0.4),
                                            blurRadius: 8,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                    ),

                                    const SizedBox(height: 6),

                                    // Secondary Slogan
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        'Our People. Our India. A Better Tomorrow.',
                                        textAlign: TextAlign.center,
                                        maxLines: 1,
                                        softWrap: false,
                                        style: GoogleFonts.caveat(
                                          fontSize: 18,
                                          color: const Color(0xFFD1FAE5),
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    const Spacer(flex: 3),

                    // Elegant loader & government footer
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Color(0xFF86EFAC),
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),
                          Text(
                            'Government of India • Civic Initiative',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              color: Colors.white.withValues(alpha: 0.55),
                              letterSpacing: 0.8,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

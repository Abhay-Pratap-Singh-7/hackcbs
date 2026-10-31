import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/constants/app_constants.dart';
import 'package:sih_2026/core/theme/app_colors.dart';

class AuthBackgroundScaffold extends StatelessWidget {
  final Widget child;
  final bool showBackButton;
  final VoidCallback? onBack;

  const AuthBackgroundScaffold({
    super.key,
    required this.child,
    this.showBackButton = false,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final topPadding = mediaQuery.padding.top;

    return Scaffold(
      backgroundColor: AppColors.neutral100,
      body: Stack(
        children: [
          // Background Asset filling full screen
          Positioned.fill(
            child: Image.asset(
              AppConstants.authBackground,
              fit: BoxFit.cover,
              alignment: Alignment.topCenter,
            ),
          ),

          // Dark gradient overlay on image asset
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.95),
                    Colors.black.withValues(alpha: 0.85),
                    Colors.black.withValues(alpha: 0.45),
                    Colors.black.withValues(alpha: 0.10),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.25, 0.55, 0.75, 1.0],
                ),
              ),
            ),
          ),

          // Static Brand Logo and Tagline
          Positioned(
            top: topPadding + 10,
            left: 24,
            right: 24,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Image.asset(
                  AppConstants.appLogo,
                  height: 105,
                  fit: BoxFit.contain,
                ),
                const SizedBox(height: 8),
                Text(
                  AppConstants.appTagline,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E3A5F),
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),

          // Scrollable Content Layer
          SafeArea(
            top: false,
            bottom: true,
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight,
                    ),
                    child: IntrinsicHeight(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Top visual breathing room (reveals static logo & artwork)
                          SizedBox(
                            height: constraints.maxHeight * 0.40,
                          ),

                          // Form Area
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              child: child,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Optional Floating Back Button
          if (showBackButton)
            Positioned(
              top: topPadding + 8,
              left: 16,
              child: _FloatingBackButton(onPressed: onBack),
            ),
        ],
      ),
    );
  }
}

class _FloatingBackButton extends StatelessWidget {
  final VoidCallback? onPressed;

  const _FloatingBackButton({this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white.withValues(alpha: 0.85),
        shape: BoxShape.circle,
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: IconButton(
        icon: const Icon(Icons.arrow_back, color: AppColors.primary, size: 22),
        onPressed: onPressed ?? () => Navigator.of(context).maybePop(),
        tooltip: 'Back',
      ),
    );
  }
}

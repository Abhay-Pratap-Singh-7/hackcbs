import 'package:flutter/material.dart';
import 'package:sih_2026/core/theme/app_typography.dart';
import 'package:sih_2026/core/theme/app_colors.dart';

class OnboardingSlide extends StatelessWidget {
  final String title;
  final String subtitle;
  final String imagePath;
  final Widget? topWidget;

  const OnboardingSlide({
    super.key,
    required this.title,
    required this.subtitle,
    required this.imagePath,
    this.topWidget,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Full screen background image
        Positioned.fill(
          child: Image.asset(
            imagePath,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                color: AppColors.neutral200,
                child: const Center(
                  child: Icon(
                    Icons.image,
                    size: 100,
                    color: AppColors.neutral400,
                  ),
                ),
              );
            },
          ),
        ),

        // Dark linear gradient overlay from bottom
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
                  Colors.black.withValues(alpha: 0.1),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.25, 0.55, 0.75, 1.0],
              ),
            ),
          ),
        ),

        // Optional Top Widget (Logo)
        if (topWidget != null)
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 24,
            right: 24,
            child: topWidget!,
          ),

        // Text Content positioned in the bottom area over gradient
        Positioned(
          bottom: 120,
          left: 24,
          right: 24,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTypography.heading1.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  height: 1.2,
                  shadows: [
                    Shadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text(
                subtitle,
                style: AppTypography.body1.copyWith(
                  color: Colors.white.withValues(alpha: 0.9),
                  shadows: [
                    Shadow(
                      color: Colors.black.withValues(alpha: 0.4),
                      blurRadius: 6,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

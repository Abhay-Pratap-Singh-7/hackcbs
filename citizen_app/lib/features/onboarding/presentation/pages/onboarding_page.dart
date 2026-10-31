import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/constants/app_constants.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/features/onboarding/presentation/bloc/onboarding_bloc.dart';
import 'package:sih_2026/features/onboarding/presentation/widgets/dot_indicator.dart';
import 'package:sih_2026/features/onboarding/presentation/widgets/onboarding_slide.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  final List<Map<String, String>> _onboardingData = [
    {
      'title': 'Report real\nproblems in\nyour community',
      'subtitle': 'Help make your village or city\na better place to live.',
      'image': 'assets/images/onboarding1.png',
    },
    {
      'title': 'Your report\nreaches real\nexperts',
      'subtitle': 'Universities and industry\npartners work together to\nfind smart solutions.',
      'image': 'assets/images/onboarding2.png',
    },
    {
      'title': 'Track your problem\nuntil it\'s solved',
      'subtitle': 'Stay updated at every step.\nWe don\'t stop, until it\'s done.',
      'image': 'assets/images/onboarding3.png',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => OnboardingBloc(),
      child: Scaffold(
        body: Stack(
          children: [
            // Background Slider
            BlocBuilder<OnboardingBloc, OnboardingState>(
              builder: (context, state) {
                return PageView.builder(
                  controller: _pageController,
                  itemCount: _onboardingData.length,
                  onPageChanged: (index) {
                    context
                        .read<OnboardingBloc>()
                        .add(PageChangedEvent(index));
                  },
                  itemBuilder: (context, index) {
                    final data = _onboardingData[index];
                    return OnboardingSlide(
                      title: data['title']!,
                      subtitle: data['subtitle']!,
                      imagePath: data['image']!,
                      topWidget: index == 0
                          ? Column(
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
                            )
                          : null,
                    );
                  },
                );
              },
            ),
            
            // Skip Button
            SafeArea(
              child: Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8.0, right: 16.0),
                  child: TextButton(
                    onPressed: () {
                      context.go('/login');
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.primaryDark,
                    ),
                    child: const Text('Skip'),
                  ),
                ),
              ),
            ),

            // Bottom Controls
            Positioned(
              bottom: 40,
              left: 24,
              right: 24,
              child: BlocBuilder<OnboardingBloc, OnboardingState>(
                builder: (context, state) {
                  final isLastPage =
                      state.currentPageIndex == _onboardingData.length - 1;

                  return Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      DotIndicator(
                        itemCount: _onboardingData.length,
                        currentIndex: state.currentPageIndex,
                      ),
                      if (isLastPage)
                        ElevatedButton(
                          onPressed: () {
                            context.go('/login');
                          },
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Get Started'),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 20),
                            ],
                          ),
                        )
                      else
                        FloatingActionButton(
                          onPressed: () {
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                            );
                          },
                          backgroundColor: AppColors.primary,
                          elevation: 0,
                          shape: const CircleBorder(),
                          child: const Icon(
                            Icons.arrow_forward,
                            color: AppColors.white,
                          ),
                        ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

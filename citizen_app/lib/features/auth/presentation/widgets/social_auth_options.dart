import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/theme/app_colors.dart';

class SocialAuthOptions extends StatelessWidget {
  final VoidCallback onGoogleLogin;
  final VoidCallback onDigiLockerLogin;
  final VoidCallback onGuestLogin;

  const SocialAuthOptions({
    super.key,
    required this.onGoogleLogin,
    required this.onDigiLockerLogin,
    required this.onGuestLogin,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            const Expanded(child: Divider(color: AppColors.neutral200)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'Or sign in with',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppColors.neutral300,
                ),
              ),
            ),
            const Expanded(child: Divider(color: AppColors.neutral200)),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _CivicOptionButton(
                iconWidget: Image.asset('assets/images/google_logo.png', width: 24, height: 24),
                label: 'Google',
                onTap: onGoogleLogin,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _CivicOptionButton(
                iconWidget: Image.asset(
                  'assets/images/digilocker_logo.png',
                  height: 24,
                  fit: BoxFit.contain,
                ),
                onTap: onDigiLockerLogin,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Center(
          child: TextButton.icon(
            onPressed: onGuestLogin,
            icon: const Icon(Icons.person_outline, size: 18),
            label: const Text('Explore as Guest (अतिथि)'),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.neutral400,
              textStyle: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _CivicOptionButton extends StatelessWidget {
  final Widget iconWidget;
  final String? label;
  final VoidCallback onTap;

  const _CivicOptionButton({
    required this.iconWidget,
    this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.neutral100,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.inputBorder),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              iconWidget,
              if (label != null) ...[
                const SizedBox(width: 8),
                Text(
                  label!,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.neutral500,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

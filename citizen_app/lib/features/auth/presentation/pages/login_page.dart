import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_event.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_state.dart';
import 'package:sih_2026/features/auth/presentation/widgets/auth_background_scaffold.dart';
import 'package:sih_2026/features/auth/presentation/widgets/auth_button.dart';
import 'package:sih_2026/features/auth/presentation/widgets/auth_text_field.dart';
import 'package:sih_2026/features/auth/presentation/widgets/social_auth_options.dart';
import 'package:sih_2026/core/localization/app_localizations.dart';
import 'package:sih_2026/core/localization/widgets/language_selector_button.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _identifierController;
  late final TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _identifierController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onLoginPressed(BuildContext context) {
    if (_formKey.currentState?.validate() ?? false) {
      context.read<AuthBloc>().add(
            LoginSubmittedEvent(
              email: _identifierController.text.trim(),
              password: _passwordController.text,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: _handleAuthListener,
      child: AuthBackgroundScaffold(
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(
                color: Color(0x18000000),
                blurRadius: 20,
                offset: Offset(0, 4),
              ),
            ],
          ),
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const _LoginHeader(),
                const SizedBox(height: 20),
                _buildIdentifierField(),
                const SizedBox(height: 16),
                _buildPasswordField(),
                _buildForgotPasswordRow(),
                const SizedBox(height: 16),
                _buildSubmitButton(),
                const SizedBox(height: 20),
                SocialAuthOptions(
                  onGoogleLogin: () => _handleGoogleLogin(context),
                  onDigiLockerLogin: () => _handleDigiLockerLogin(context),
                  onGuestLogin: () => context.go('/home'),
                ),
                const SizedBox(height: 16),
                const _SignUpFooter(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _handleAuthListener(BuildContext context, AuthState state) {
    if (state.status == AuthStatus.error && state.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.errorMessage!),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else if (state.status == AuthStatus.requiresLoginOtp) {
      _showVerifyOtpDialog(context, state.tempEmail ?? _identifierController.text.trim());
    } else if (state.status == AuthStatus.requiresPasswordResetOtp) {
      _showResetPasswordDialog(context, state.tempEmail ?? _identifierController.text.trim());
    } else if (state.status == AuthStatus.passwordResetComplete) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password reset successfully! Please log in.'),
          backgroundColor: AppColors.primary,
          behavior: SnackBarBehavior.floating,
        ),
      );
      context.read<AuthBloc>().add(const AuthResetStatusEvent());
    } else if (state.status == AuthStatus.digilockerUrlReady && state.digilockerUrl != null) {
      _launchDigiLocker(context, state.digilockerUrl!);
      context.read<AuthBloc>().add(const AuthResetStatusEvent());
    } else if (state.status == AuthStatus.authenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Welcome back, ${state.user?.name ?? "Citizen"}!'),
          backgroundColor: AppColors.primary,
          behavior: SnackBarBehavior.floating,
        ),
      );
      context.go('/home');
    }
  }

  Future<void> _handleGoogleLogin(BuildContext context) async {
    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
      );
      final GoogleSignInAccount? account = await googleSignIn.signIn();
      if (account != null) {
        final GoogleSignInAuthentication auth = await account.authentication;
        if (auth.idToken != null) {
          if (context.mounted) {
             context.read<AuthBloc>().add(GoogleLoginRequested(idToken: auth.idToken!, role: 'INDIVIDUAL_CITIZEN'));
          }
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Google Sign In failed: $e'), backgroundColor: AppColors.error));
      }
    }
  }

  void _handleDigiLockerLogin(BuildContext context) {
    context.read<AuthBloc>().add(const DigiLockerLoginRequested());
  }

  Future<void> _launchDigiLocker(BuildContext context, String url) async {
    try {
      final result = await FlutterWebAuth2.authenticate(
        url: url,
        callbackUrlScheme: "citizenapp", // Must match backend configured redirect scheme
      );
      final code = Uri.parse(result).queryParameters['code'];
      if (code != null && context.mounted) {
        context.read<AuthBloc>().add(DigiLockerCallbackRequested(code: code, role: 'INDIVIDUAL_CITIZEN'));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('DigiLocker Sign In cancelled or failed.'), backgroundColor: AppColors.error));
      }
    }
  }

  void _showVerifyOtpDialog(BuildContext context, String email) {
    final otpController = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Verification Required',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Enter the 6-digit OTP sent to $email.',
              style: GoogleFonts.poppins(fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: otpController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(
                labelText: 'OTP',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(dialogCtx);
              context.read<AuthBloc>().add(const AuthResetStatusEvent());
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final otp = otpController.text.trim();
              if (otp.length == 6) {
                Navigator.pop(dialogCtx);
                context.read<AuthBloc>().add(VerifyLoginOtpEvent(email: email, otp: otp));
              }
            },
            child: const Text('Verify'),
          ),
        ],
      ),
    );
  }

  Widget _buildIdentifierField() {
    return AuthTextField(
      controller: _identifierController,
      label: 'Email Address',
      hintText: 'Enter registered email',
      prefixIcon: Icons.email_outlined,
      keyboardType: TextInputType.emailAddress,
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Please enter your email';
        }
        return null;
      },
    );
  }

  Widget _buildPasswordField() {
    return BlocBuilder<AuthBloc, AuthState>(
      buildWhen: (prev, curr) =>
          prev.isPasswordObscured != curr.isPasswordObscured,
      builder: (context, state) {
        return AuthTextField(
          controller: _passwordController,
          label: 'Password',
          hintText: 'Enter your password',
          prefixIcon: Icons.lock_outline,
          obscureText: state.isPasswordObscured,
          textInputAction: TextInputAction.done,
          suffixIcon: IconButton(
            icon: Icon(
              state.isPasswordObscured
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              size: 20,
              color: AppColors.neutral400,
            ),
            onPressed: () {
              context
                  .read<AuthBloc>()
                  .add(const TogglePasswordVisibilityEvent());
            },
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter your password';
            }
            if (value.length < 6) {
              return 'Password must be at least 6 characters';
            }
            return null;
          },
        );
      },
    );
  }

  Widget _buildForgotPasswordRow() {
    return Align(
      alignment: Alignment.centerRight,
      child: TextButton(
        onPressed: () => _showForgotPasswordDialog(context),
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        ),
        child: Text(
          'Forgot Password?',
          style: GoogleFonts.poppins(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return BlocBuilder<AuthBloc, AuthState>(
      buildWhen: (prev, curr) => prev.status != curr.status,
      builder: (context, state) {
        return AuthButton(
          text: 'Sign In (लॉगिन करें)',
          isLoading: state.status == AuthStatus.loading,
          icon: Icons.arrow_forward,
          onPressed: () => _onLoginPressed(context),
        );
      },
    );
  }

  void _showForgotPasswordDialog(BuildContext context) {
    final emailController = TextEditingController(text: _identifierController.text.trim());
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Reset Password',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Enter your registered email address. We will send you an OTP to reset your password.',
              style: GoogleFonts.poppins(fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email Address',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final email = emailController.text.trim();
              if (email.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter your email address'), backgroundColor: AppColors.error),
                );
                return;
              }
              if (!email.contains('@') || !email.contains('.')) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter a valid email address'), backgroundColor: AppColors.error),
                );
                return;
              }
              Navigator.pop(dialogCtx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Sending password reset OTP to $email...'),
                  backgroundColor: AppColors.primary,
                  behavior: SnackBarBehavior.floating,
                ),
              );
              context.read<AuthBloc>().add(ForgotPasswordSubmittedEvent(email: email));
            },
            child: const Text('Send OTP'),
          ),
        ],
      ),
    );
  }

  void _showResetPasswordDialog(BuildContext context, String email) {
    final otpController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Reset Password',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Enter the 6-digit OTP sent to $email along with your new password.',
                style: GoogleFonts.poppins(fontSize: 13),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: const InputDecoration(labelText: 'OTP'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: newPasswordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'New Password (min 6 chars)'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: confirmPasswordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Confirm Password'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(dialogCtx);
              context.read<AuthBloc>().add(const AuthResetStatusEvent());
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final otp = otpController.text.trim();
              final newPassword = newPasswordController.text;
              final confirmPassword = confirmPasswordController.text;

              if (otp.length != 6) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter the 6-digit OTP'), backgroundColor: AppColors.error),
                );
                return;
              }
              if (newPassword.length < 6) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Password must be at least 6 characters'), backgroundColor: AppColors.error),
                );
                return;
              }
              if (newPassword != confirmPassword) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Passwords do not match'), backgroundColor: AppColors.error),
                );
                return;
              }

              Navigator.pop(dialogCtx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Resetting password...'),
                  backgroundColor: AppColors.primary,
                  behavior: SnackBarBehavior.floating,
                ),
              );
              context.read<AuthBloc>().add(ResetPasswordSubmittedEvent(
                email: email,
                otp: otp,
                newPassword: newPassword,
                confirmPassword: confirmPassword,
              ));
            },
            child: const Text('Reset Password'),
          ),
        ],
      ),
    );
  }
}

class _LoginHeader extends StatelessWidget {
  const _LoginHeader();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              context.tr('login'),
              style: GoogleFonts.poppins(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.neutral500,
              ),
            ),
            const LanguageSelectorButton(compact: true),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          context.tr('login_subtitle'),
          style: GoogleFonts.poppins(
            fontSize: 12,
            color: AppColors.neutral400,
          ),
        ),
      ],
    );
  }
}

class _SignUpFooter extends StatelessWidget {
  const _SignUpFooter();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            "${context.tr('dont_have_account')} ",
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: AppColors.neutral400,
            ),
          ),
          GestureDetector(
            onTap: () => context.go('/signup'),
            child: Text(
              context.tr('signup'),
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/constants/app_constants.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_event.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_state.dart';
import 'package:sih_2026/features/auth/presentation/widgets/auth_background_scaffold.dart';
import 'package:sih_2026/features/auth/presentation/widgets/auth_button.dart';
import 'package:sih_2026/features/auth/presentation/widgets/auth_text_field.dart';
import 'package:sih_2026/features/auth/presentation/widgets/district_dropdown.dart';
import 'package:sih_2026/core/localization/app_localizations.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  late final TextEditingController _confirmPasswordController;
  late final TextEditingController _pincodeController;
  
  String? _selectedDistrict;
  bool _agreedToTerms = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _phoneController = TextEditingController();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _confirmPasswordController = TextEditingController();
    _pincodeController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _pincodeController.dispose();
    super.dispose();
  }

  void _onSignUpPressed(BuildContext context) {
    if (!_agreedToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please accept the Terms & Conditions to proceed.'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (_formKey.currentState?.validate() ?? false) {
      context.read<AuthBloc>().add(
            SignUpSubmittedEvent(
              name: _nameController.text.trim(),
              email: _emailController.text.trim(),
              password: _passwordController.text,
              confirmPassword: _confirmPasswordController.text,
              role: 'INDIVIDUAL_CITIZEN',
              profileDetails: {
                'fullName': _nameController.text.trim(),
                'phone': _phoneController.text.trim(),
                'district': _selectedDistrict ?? '',
                'state': 'Jharkhand',
                'pincode': _pincodeController.text.trim(),
              },
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: _handleAuthListener,
      child: AuthBackgroundScaffold(
        showBackButton: true,
        onBack: () => context.go('/login'),
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
                const _SignUpHeader(),
                const SizedBox(height: 20),
                _buildNameField(),
                const SizedBox(height: 14),
                _buildPhoneField(),
                const SizedBox(height: 14),
                _buildEmailField(),
                const SizedBox(height: 14),
                _buildDistrictDropdown(),
                const SizedBox(height: 14),
                _buildPincodeField(),
                const SizedBox(height: 14),
                _buildPasswordField(),
                const SizedBox(height: 14),
                _buildConfirmPasswordField(),
                const SizedBox(height: 12),
                _buildTermsCheckbox(),
                const SizedBox(height: 16),
                _buildSubmitButton(),
                const SizedBox(height: 16),
                const _SignInFooter(),
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
    } else if (state.status == AuthStatus.requiresSignupOtp) {
      _showVerifyOtpDialog(context, state.tempEmail ?? _emailController.text.trim());
    } else if (state.status == AuthStatus.authenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Account verified! Welcome, ${state.user?.name}!'),
          backgroundColor: AppColors.primary,
          behavior: SnackBarBehavior.floating,
        ),
      );
      context.go('/home');
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
          'Email Verification',
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
                context.read<AuthBloc>().add(VerifySignupOtpEvent(email: email, otp: otp));
              }
            },
            child: const Text('Verify'),
          ),
        ],
      ),
    );
  }

  Widget _buildNameField() {
    return AuthTextField(
      controller: _nameController,
      label: 'Full Name',
      hintText: 'Enter full name',
      prefixIcon: Icons.person_outline,
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Please enter your name';
        }
        return null;
      },
    );
  }

  Widget _buildPincodeField() {
    return AuthTextField(
      controller: _pincodeController,
      label: 'Pincode',
      hintText: '6-digit pincode',
      prefixIcon: Icons.pin_drop_outlined,
      keyboardType: TextInputType.number,
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Please enter your pincode';
        }
        if (value.trim().length != 6) {
          return 'Enter valid 6-digit pincode';
        }
        return null;
      },
    );
  }

  Widget _buildPhoneField() {
    return AuthTextField(
      controller: _phoneController,
      label: 'Mobile Number (मोबाइल नंबर)',
      hintText: '10-digit mobile number',
      prefixIcon: Icons.phone_android_outlined,
      keyboardType: TextInputType.phone,
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Please enter mobile number';
        }
        if (!AppConstants.phoneRegex.hasMatch(value.trim())) {
          return 'Enter valid 10-digit mobile number';
        }
        return null;
      },
    );
  }

  Widget _buildEmailField() {
    return AuthTextField(
      controller: _emailController,
      label: 'Email Address',
      hintText: 'name@example.com',
      prefixIcon: Icons.email_outlined,
      keyboardType: TextInputType.emailAddress,
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Please enter your email';
        }
        if (!AppConstants.emailRegex.hasMatch(value.trim())) {
          return 'Enter valid email address';
        }
        return null;
      },
    );
  }

  Widget _buildDistrictDropdown() {
    return DistrictDropdown(
      selectedDistrict: _selectedDistrict,
      onChanged: (val) => setState(() => _selectedDistrict = val),
      validator: (val) =>
          val == null ? 'Please select your home district' : null,
    );
  }


  Widget _buildPasswordField() {
    return BlocBuilder<AuthBloc, AuthState>(
      buildWhen: (prev, curr) =>
          prev.isPasswordObscured != curr.isPasswordObscured,
      builder: (context, state) {
        return AuthTextField(
          controller: _passwordController,
          label: 'Create Password (पासवर्ड)',
          hintText: 'Min. 6 characters',
          prefixIcon: Icons.lock_outline,
          obscureText: state.isPasswordObscured,
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
              return 'Please create a password';
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

  Widget _buildConfirmPasswordField() {
    return BlocBuilder<AuthBloc, AuthState>(
      buildWhen: (prev, curr) =>
          prev.isConfirmPasswordObscured != curr.isConfirmPasswordObscured,
      builder: (context, state) {
        return AuthTextField(
          controller: _confirmPasswordController,
          label: 'Confirm Password',
          hintText: 'Re-enter your password',
          prefixIcon: Icons.lock_reset_outlined,
          obscureText: state.isConfirmPasswordObscured,
          textInputAction: TextInputAction.done,
          suffixIcon: IconButton(
            icon: Icon(
              state.isConfirmPasswordObscured
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              size: 20,
              color: AppColors.neutral400,
            ),
            onPressed: () {
              context
                  .read<AuthBloc>()
                  .add(const ToggleConfirmPasswordVisibilityEvent());
            },
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please confirm your password';
            }
            if (value != _passwordController.text) {
              return 'Passwords do not match';
            }
            return null;
          },
        );
      },
    );
  }

  Widget _buildTermsCheckbox() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SizedBox(
          height: 24,
          width: 24,
          child: Checkbox(
            value: _agreedToTerms,
            activeColor: AppColors.primary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(4),
            ),
            onChanged: (val) => setState(() => _agreedToTerms = val ?? false),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            'I agree to the Terms of Service & Privacy Policy',
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: AppColors.neutral400,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return BlocBuilder<AuthBloc, AuthState>(
      buildWhen: (prev, curr) => prev.status != curr.status,
      builder: (context, state) {
        return AuthButton(
          text: 'Register (पंजीकरण करें)',
          isLoading: state.status == AuthStatus.loading,
          icon: Icons.check_circle_outline,
          onPressed: () => _onSignUpPressed(context),
        );
      },
    );
  }
}

class _SignUpHeader extends StatelessWidget {
  const _SignUpHeader();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              context.tr('signup'),
              style: GoogleFonts.poppins(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.neutral500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Register to report problems and track solutions in Jharkhand',
          style: GoogleFonts.poppins(
            fontSize: 12,
            color: AppColors.neutral400,
          ),
        ),
      ],
    );
  }
}

class _SignInFooter extends StatelessWidget {
  const _SignInFooter();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            "${context.tr('already_have_account')} ",
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: AppColors.neutral400,
            ),
          ),
          GestureDetector(
            onTap: () => context.go('/login'),
            child: Text(
              context.tr('login'),
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

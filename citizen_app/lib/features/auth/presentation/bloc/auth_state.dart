import 'package:equatable/equatable.dart';
import 'package:sih_2026/features/auth/domain/entities/user_entity.dart';

enum AuthStatus { 
  initial, 
  loading, 
  authenticated, 
  requiresLoginOtp, 
  requiresSignupOtp, 
  requiresPasswordResetOtp,
  otpSent, 
  passwordResetComplete,
  digilockerUrlReady,
  unauthenticated,
  error 
}

class AuthState extends Equatable {
  final AuthStatus status;
  final UserEntity? user;
  final String? errorMessage;
  final bool isPasswordObscured;
  final bool isConfirmPasswordObscured;
  final String? tempEmail; // To store email during OTP flow
  final String? digilockerUrl;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
    this.isPasswordObscured = true,
    this.isConfirmPasswordObscured = true,
    this.tempEmail,
    this.digilockerUrl,
  });

  AuthState copyWith({
    AuthStatus? status,
    UserEntity? user,
    String? errorMessage,
    bool? isPasswordObscured,
    bool? isConfirmPasswordObscured,
    String? tempEmail,
    String? digilockerUrl,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage, // Nullify if not explicitly passed? Let's assume we want to clear error messages often, but typical copyWith just uses the passed value or current. To explicitly nullify, we might need a wrapped value or just set it manually when needed. But we'll follow the existing pattern.
      isPasswordObscured: isPasswordObscured ?? this.isPasswordObscured,
      isConfirmPasswordObscured:
          isConfirmPasswordObscured ?? this.isConfirmPasswordObscured,
      tempEmail: tempEmail ?? this.tempEmail,
      digilockerUrl: digilockerUrl ?? this.digilockerUrl,
    );
  }
  
  // Custom copyWith to clear errorMessage
  AuthState clearError() {
    return AuthState(
      status: status,
      user: user,
      errorMessage: null,
      isPasswordObscured: isPasswordObscured,
      isConfirmPasswordObscured: isConfirmPasswordObscured,
      tempEmail: tempEmail,
      digilockerUrl: digilockerUrl,
    );
  }

  @override
  List<Object?> get props => [
        status,
        user,
        errorMessage,
        isPasswordObscured,
        isConfirmPasswordObscured,
        tempEmail,
        digilockerUrl,
      ];
}

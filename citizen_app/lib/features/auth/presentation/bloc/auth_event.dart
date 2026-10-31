import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class CheckAuthStatusEvent extends AuthEvent {
  const CheckAuthStatusEvent();
}

class LoginSubmittedEvent extends AuthEvent {
  final String email;
  final String password;

  const LoginSubmittedEvent({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

class SignUpSubmittedEvent extends AuthEvent {
  final String name;
  final String email;
  final String password;
  final String confirmPassword;
  final String role;
  final Map<String, dynamic> profileDetails;

  const SignUpSubmittedEvent({
    required this.name,
    required this.email,
    required this.password,
    required this.confirmPassword,
    required this.role,
    required this.profileDetails,
  });

  @override
  List<Object?> get props => [name, email, password, confirmPassword, role, profileDetails];
}

class VerifyLoginOtpEvent extends AuthEvent {
  final String email;
  final String otp;

  const VerifyLoginOtpEvent({
    required this.email,
    required this.otp,
  });

  @override
  List<Object?> get props => [email, otp];
}

class VerifySignupOtpEvent extends AuthEvent {
  final String email;
  final String otp;

  const VerifySignupOtpEvent({
    required this.email,
    required this.otp,
  });

  @override
  List<Object?> get props => [email, otp];
}

class ResendOtpEvent extends AuthEvent {
  final String email;
  final String purpose;

  const ResendOtpEvent({required this.email, required this.purpose});

  @override
  List<Object?> get props => [email, purpose];
}

class ForgotPasswordSubmittedEvent extends AuthEvent {
  final String email;

  const ForgotPasswordSubmittedEvent({required this.email});

  @override
  List<Object?> get props => [email];
}

class ResetPasswordSubmittedEvent extends AuthEvent {
  final String email;
  final String otp;
  final String newPassword;
  final String confirmPassword;

  const ResetPasswordSubmittedEvent({
    required this.email,
    required this.otp,
    required this.newPassword,
    required this.confirmPassword,
  });

  @override
  List<Object?> get props => [email, otp, newPassword, confirmPassword];
}

class TogglePasswordVisibilityEvent extends AuthEvent {
  const TogglePasswordVisibilityEvent();
}

class ToggleConfirmPasswordVisibilityEvent extends AuthEvent {
  const ToggleConfirmPasswordVisibilityEvent();
}

class AuthResetStatusEvent extends AuthEvent {
  const AuthResetStatusEvent();
}

class GoogleLoginRequested extends AuthEvent {
  final String idToken;
  final String role;
  const GoogleLoginRequested({required this.idToken, required this.role});

  @override
  List<Object?> get props => [idToken, role];
}

class DigiLockerLoginRequested extends AuthEvent {
  const DigiLockerLoginRequested();
}

class DigiLockerCallbackRequested extends AuthEvent {
  final String code;
  final String role;
  
  const DigiLockerCallbackRequested({required this.code, required this.role});

  @override
  List<Object?> get props => [code, role];
}

class LogoutRequested extends AuthEvent {
  const LogoutRequested();
}

class UpdateProfileRequested extends AuthEvent {
  final String? avatar;
  final Map<String, dynamic>? profileDetails;

  const UpdateProfileRequested({this.avatar, this.profileDetails});

  @override
  List<Object?> get props => [avatar, profileDetails];
}

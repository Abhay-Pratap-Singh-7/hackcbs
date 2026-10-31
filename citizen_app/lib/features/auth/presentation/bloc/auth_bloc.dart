import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:sih_2026/core/services/push_notification_service.dart';
import 'package:sih_2026/features/auth/domain/repositories/auth_repository.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_event.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc({required this.authRepository}) : super(const AuthState()) {
    on<CheckAuthStatusEvent>(_onCheckAuthStatus);
    on<LoginSubmittedEvent>(_onLoginSubmitted);
    on<SignUpSubmittedEvent>(_onSignUpSubmitted);
    on<VerifyLoginOtpEvent>(_onVerifyLoginOtpSubmitted);
    on<VerifySignupOtpEvent>(_onVerifySignupOtpSubmitted);
    on<ResendOtpEvent>(_onResendOtp);
    on<TogglePasswordVisibilityEvent>(_onTogglePasswordVisibility);
    on<ToggleConfirmPasswordVisibilityEvent>(_onToggleConfirmPasswordVisibility);
    on<AuthResetStatusEvent>(_onResetStatus);
    on<ForgotPasswordSubmittedEvent>(_onForgotPasswordSubmitted);
    on<ResetPasswordSubmittedEvent>(_onResetPasswordSubmitted);
    on<GoogleLoginRequested>(_onGoogleLoginRequested);
    on<DigiLockerLoginRequested>(_onDigiLockerLoginRequested);
    on<DigiLockerCallbackRequested>(_onDigiLockerCallbackRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<UpdateProfileRequested>(_onUpdateProfileRequested);
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatusEvent event,
    Emitter<AuthState> emit,
  ) async {
    final cachedUser = await authRepository.getCachedUser();
    if (cachedUser != null) {
      emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: cachedUser,
      ));
      PushNotificationService().syncTokenWithBackend();
    }

    final result = await authRepository.checkAuthStatus();
    result.fold(
      (failure) {
        if (cachedUser == null) {
          emit(state.copyWith(
            status: AuthStatus.unauthenticated,
            user: null,
          ));
        }
      },
      (user) {
        if (user != null) {
          emit(state.copyWith(
            status: AuthStatus.authenticated,
            user: user,
          ));
          PushNotificationService().syncTokenWithBackend();
        } else {
          emit(state.copyWith(
            status: AuthStatus.unauthenticated,
            user: null,
          ));
        }
      },
    );
  }

  Future<void> _onLoginSubmitted(
    LoginSubmittedEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.login(
      email: event.email,
      password: event.password,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (requiresOtp) {
        if (requiresOtp) {
          emit(state.copyWith(
            status: AuthStatus.requiresLoginOtp,
            tempEmail: event.email,
          ));
        } else {
          // If for some reason it doesn't require OTP
          emit(state.copyWith(status: AuthStatus.authenticated));
        }
      },
    );
  }

  Future<void> _onSignUpSubmitted(
    SignUpSubmittedEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.signup(
      name: event.name,
      email: event.email,
      password: event.password,
      confirmPassword: event.confirmPassword,
      role: event.role,
      profileDetails: event.profileDetails,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (user) {
        emit(state.copyWith(
          status: AuthStatus.requiresSignupOtp,
          tempEmail: event.email,
          user: user,
        ));
      },
    );
  }

  Future<void> _onVerifyLoginOtpSubmitted(
    VerifyLoginOtpEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.verifyLoginOtp(
      email: event.email,
      otp: event.otp,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (user) => emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
      )),
    );
  }

  Future<void> _onVerifySignupOtpSubmitted(
    VerifySignupOtpEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.verifySignupOtp(
      email: event.email,
      otp: event.otp,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (user) => emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
      )),
    );
  }

  Future<void> _onResendOtp(
    ResendOtpEvent event,
    Emitter<AuthState> emit,
  ) async {
    // We don't want to show full page loading, just a snackbar perhaps, 
    // but we can emit a loading state if needed.
    // For simplicity, we just trigger it and let the UI handle success/error.
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.resendOtp(
      email: event.email,
      purpose: event.purpose,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (_) {
        // Return to the previous status that required OTP
        if (event.purpose == 'LOGIN_VERIFY') {
          emit(state.copyWith(status: AuthStatus.requiresLoginOtp));
        } else {
          emit(state.copyWith(status: AuthStatus.requiresSignupOtp));
        }
      },
    );
  }

  void _onTogglePasswordVisibility(
    TogglePasswordVisibilityEvent event,
    Emitter<AuthState> emit,
  ) {
    emit(state.copyWith(isPasswordObscured: !state.isPasswordObscured));
  }

  void _onToggleConfirmPasswordVisibility(
    ToggleConfirmPasswordVisibilityEvent event,
    Emitter<AuthState> emit,
  ) {
    emit(state.copyWith(
      isConfirmPasswordObscured: !state.isConfirmPasswordObscured,
    ));
  }

  void _onResetStatus(
    AuthResetStatusEvent event,
    Emitter<AuthState> emit,
  ) {
    emit(state.clearError().copyWith(status: AuthStatus.initial));
  }


  Future<void> _onForgotPasswordSubmitted(
    ForgotPasswordSubmittedEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.forgotPassword(
      email: event.email,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (_) {
        emit(state.copyWith(
          status: AuthStatus.requiresPasswordResetOtp,
          tempEmail: event.email,
        ));
      },
    );
  }

  Future<void> _onResetPasswordSubmitted(
    ResetPasswordSubmittedEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.resetPassword(
      email: event.email,
      otp: event.otp,
      newPassword: event.newPassword,
      confirmPassword: event.confirmPassword,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (_) {
        emit(state.copyWith(
          status: AuthStatus.passwordResetComplete,
        ));
      },
    );
  }

  Future<void> _onGoogleLoginRequested(
    GoogleLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.googleLogin(
      idToken: event.idToken,
      role: event.role,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (user) => emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
      )),
    );
  }

  Future<void> _onDigiLockerLoginRequested(
    DigiLockerLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.getDigilockerUrl();

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (url) => emit(state.copyWith(
        status: AuthStatus.digilockerUrlReady,
        digilockerUrl: url,
      )),
    );
  }

  Future<void> _onDigiLockerCallbackRequested(
    DigiLockerCallbackRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.digilockerCallback(
      code: event.code,
      role: event.role,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (user) => emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
      )),
    );
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.logout();

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (_) => emit(const AuthState(
        status: AuthStatus.unauthenticated,
      )),
    );
  }

  Future<void> _onUpdateProfileRequested(
    UpdateProfileRequested event,
    Emitter<AuthState> emit,
  ) async {
    if (state.user == null) return;
    emit(state.clearError().copyWith(status: AuthStatus.loading));
    final result = await authRepository.updateProfile(
      avatar: event.avatar,
      profileDetails: event.profileDetails,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure,
      )),
      (user) => emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
      )),
    );
  }
}

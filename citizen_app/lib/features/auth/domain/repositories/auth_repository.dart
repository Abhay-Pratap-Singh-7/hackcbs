import 'package:dartz/dartz.dart';
import 'package:sih_2026/features/auth/domain/entities/user_entity.dart';

abstract class AuthRepository {
  Future<Either<String, UserEntity?>> checkAuthStatus();

  Future<UserEntity?> getCachedUser();

  Future<Either<String, bool>> login({
    required String email,
    required String password,
  });

  Future<Either<String, UserEntity>> verifyLoginOtp({
    required String email,
    required String otp,
  });

  Future<Either<String, UserEntity>> signup({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
    required String role,
    required Map<String, dynamic> profileDetails,
  });

  Future<Either<String, UserEntity>> verifySignupOtp({
    required String email,
    required String otp,
  });

  Future<Either<String, void>> resendOtp({
    required String email,
    required String purpose,
  });

  Future<Either<String, void>> forgotPassword({
    required String email,
  });

  Future<Either<String, void>> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
    required String confirmPassword,
  });

  Future<Either<String, void>> logout();

  Future<Either<String, UserEntity>> googleLogin({
    required String idToken,
    required String role,
  });

  Future<Either<String, String>> getDigilockerUrl();

  Future<Either<String, UserEntity>> digilockerCallback({
    required String code,
    required String role,
  });

  Future<Either<String, UserEntity>> updateProfile({
    String? avatar,
    Map<String, dynamic>? profileDetails,
  });
}

import 'package:dartz/dartz.dart';

import 'package:sih_2026/features/auth/domain/repositories/auth_repository.dart';

class ResetPasswordUseCase {
  final AuthRepository repository;

  const ResetPasswordUseCase(this.repository);

  Future<Either<String, void>> call({
    required String email,
    required String otp,
    required String newPassword,
    required String confirmPassword,
  }) {
    return repository.resetPassword(
      email: email,
      otp: otp,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    );
  }
}

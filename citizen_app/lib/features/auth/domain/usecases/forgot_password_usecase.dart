import 'package:dartz/dartz.dart';

import 'package:sih_2026/features/auth/domain/repositories/auth_repository.dart';

class ForgotPasswordUseCase {
  final AuthRepository repository;

  const ForgotPasswordUseCase(this.repository);

  Future<Either<String, void>> call({
    required String email,
  }) {
    return repository.forgotPassword(email: email);
  }
}

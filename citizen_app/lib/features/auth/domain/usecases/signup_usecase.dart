import 'package:dartz/dartz.dart';
import 'package:sih_2026/features/auth/domain/entities/user_entity.dart';
import 'package:sih_2026/features/auth/domain/repositories/auth_repository.dart';

class SignUpUseCase {
  final AuthRepository repository;

  const SignUpUseCase(this.repository);

  Future<Either<String, UserEntity>> call({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
    required String role,
    required Map<String, dynamic> profileDetails,
  }) {
    return repository.signup(
      name: name,
      email: email,
      password: password,
      confirmPassword: confirmPassword,
      role: role,
      profileDetails: profileDetails,
    );
  }
}

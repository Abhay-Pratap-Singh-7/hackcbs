import 'package:dartz/dartz.dart';
import 'package:sih_2026/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:sih_2026/features/auth/domain/entities/user_entity.dart';
import 'package:sih_2026/features/auth/domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;

  AuthRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<String, UserEntity?>> checkAuthStatus() async {
    try {
      final user = await remoteDataSource.checkAuthStatus();
      return Right(user);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<UserEntity?> getCachedUser() async {
    try {
      return await remoteDataSource.getCachedUser();
    } catch (_) {
      return null;
    }
  }

  @override
  Future<Either<String, bool>> login({
    required String email,
    required String password,
  }) async {
    try {
      final requiresOtp = await remoteDataSource.login(
        email: email,
        password: password,
      );
      return Right(requiresOtp);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<Either<String, UserEntity>> verifyLoginOtp({
    required String email,
    required String otp,
  }) async {
    try {
      final user = await remoteDataSource.verifyLoginOtp(
        email: email,
        otp: otp,
      );
      return Right(user);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<Either<String, UserEntity>> signup({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
    required String role,
    required Map<String, dynamic> profileDetails,
  }) async {
    try {
      final user = await remoteDataSource.signup(
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        role: role,
        profileDetails: profileDetails,
      );
      return Right(user);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<Either<String, UserEntity>> verifySignupOtp({
    required String email,
    required String otp,
  }) async {
    try {
      final user = await remoteDataSource.verifySignupOtp(
        email: email,
        otp: otp,
      );
      return Right(user);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<Either<String, void>> resendOtp({
    required String email,
    required String purpose,
  }) async {
    try {
      await remoteDataSource.resendOtp(email: email, purpose: purpose);
      return const Right(null);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<Either<String, void>> forgotPassword({
    required String email,
  }) async {
    try {
      await remoteDataSource.forgotPassword(email: email);
      return const Right(null);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<Either<String, void>> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      await remoteDataSource.resetPassword(
        email: email,
        otp: otp,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      return const Right(null);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<Either<String, void>> logout() async {
    try {
      await remoteDataSource.logout();
      return const Right(null);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<Either<String, UserEntity>> googleLogin({
    required String idToken,
    required String role,
  }) async {
    try {
      final user = await remoteDataSource.googleLogin(
        idToken: idToken,
        role: role,
      );
      return Right(user);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<Either<String, String>> getDigilockerUrl() async {
    try {
      final url = await remoteDataSource.getDigilockerUrl();
      return Right(url);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<Either<String, UserEntity>> digilockerCallback({
    required String code,
    required String role,
  }) async {
    try {
      final user = await remoteDataSource.digilockerCallback(
        code: code,
        role: role,
      );
      return Right(user);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<Either<String, UserEntity>> updateProfile({
    String? avatar,
    Map<String, dynamic>? profileDetails,
  }) async {
    try {
      final user = await remoteDataSource.updateProfile(
        avatar: avatar,
        profileDetails: profileDetails,
      );
      return Right(user);
    } catch (e) {
      return Left(e.toString().replaceAll('Exception: ', ''));
    }
  }
}

import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String id;
  final String name;
  final String? phone;
  final String? email;
  final String? district;
  final String role;
  final bool? isEmailVerified;
  final String? avatar;
  final Map<String, dynamic>? profileDetails;

  const UserEntity({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.district,
    this.role = 'INDIVIDUAL_CITIZEN',
    this.isEmailVerified,
    this.avatar,
    this.profileDetails,
  });

  @override
  List<Object?> get props => [id, name, phone, email, district, role, isEmailVerified, avatar, profileDetails];
}

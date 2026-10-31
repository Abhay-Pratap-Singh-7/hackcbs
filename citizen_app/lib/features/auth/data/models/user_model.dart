import 'package:sih_2026/features/auth/domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.name,
    super.phone,
    super.email,
    super.district,
    super.role = 'INDIVIDUAL_CITIZEN',
    super.isEmailVerified,
    super.avatar,
    super.profileDetails,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    String? parseAvatar(dynamic val) {
      if (val == null) return null;
      final str = val.toString().trim();
      return str.isNotEmpty ? str : null;
    }

    final rawDetails = json['profileDetails'] as Map<String, dynamic>?;

    final avatar = parseAvatar(json['avatar']) ??
        parseAvatar(json['avatarUrl']) ??
        parseAvatar(rawDetails?['avatar']) ??
        parseAvatar(rawDetails?['profilePhoto']) ??
        parseAvatar(rawDetails?['photo']) ??
        parseAvatar(json['picture']);

    return UserModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? json['userId']?.toString() ?? '',
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String? ?? rawDetails?['phone'] as String?,
      email: json['email'] as String?,
      district: json['district'] as String? ?? rawDetails?['district'] as String?,
      role: json['role'] as String? ?? 'INDIVIDUAL_CITIZEN',
      isEmailVerified: json['isEmailVerified'] as bool?,
      avatar: avatar,
      profileDetails: rawDetails,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'district': district,
      'role': role,
      'isEmailVerified': isEmailVerified,
      'avatar': avatar,
      'profileDetails': profileDetails,
    };
  }

  factory UserModel.fromEntity(UserEntity entity) {
    return UserModel(
      id: entity.id,
      name: entity.name,
      phone: entity.phone,
      email: entity.email,
      district: entity.district,
      role: entity.role,
      isEmailVerified: entity.isEmailVerified,
      avatar: entity.avatar,
      profileDetails: entity.profileDetails,
    );
  }
}

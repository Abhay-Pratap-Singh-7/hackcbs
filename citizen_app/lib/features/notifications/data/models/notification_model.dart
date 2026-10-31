class NotificationModel {
  final String id;
  final String type; // PROBLEM_POSTED, NEARBY_PROBLEM, FOLLOWED_UPDATE, SYSTEM
  final String title;
  final String message;
  final String? problemId;
  final double? distanceKm;
  final bool isRead;
  final Map<String, dynamic>? metadata;
  final DateTime? createdAt;

  NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.problemId,
    this.distanceKm,
    this.isRead = false,
    this.metadata,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    String? pId;
    if (json['problemId'] != null) {
      if (json['problemId'] is Map) {
        pId = json['problemId']['_id']?.toString() ?? json['problemId']['id']?.toString();
      } else {
        pId = json['problemId'].toString();
      }
    }

    return NotificationModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'SYSTEM',
      title: json['title']?.toString() ?? 'Notification',
      message: json['message']?.toString() ?? '',
      problemId: pId,
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      isRead: json['isRead'] == true,
      metadata: json['metadata'] is Map ? Map<String, dynamic>.from(json['metadata'] as Map) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  NotificationModel copyWith({bool? isRead}) {
    return NotificationModel(
      id: id,
      type: type,
      title: title,
      message: message,
      problemId: problemId,
      distanceKm: distanceKm,
      isRead: isRead ?? this.isRead,
      metadata: metadata,
      createdAt: createdAt,
    );
  }
}

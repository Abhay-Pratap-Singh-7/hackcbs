import 'package:sih_2026/features/reports/data/models/problem_statement_model.dart';

class ReplyModel {
  final String id;
  final SubmittedByModel author;
  final String text;
  final int likesCount;
  final List<String> likes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ReplyModel({
    required this.id,
    required this.author,
    required this.text,
    this.likesCount = 0,
    this.likes = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory ReplyModel.fromJson(Map<String, dynamic> json) {
    return ReplyModel(
      id: json['_id'] ?? '',
      author: json['author'] != null
          ? (json['author'] is Map<String, dynamic>
              ? SubmittedByModel.fromJson(json['author'])
              : SubmittedByModel(id: json['author'].toString(), name: 'Citizen'))
          : SubmittedByModel(id: 'unknown', name: 'Citizen'),
      text: json['text'] ?? '',
      likesCount: json['likesCount'] ?? 0,
      likes: (json['likes'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) : null,
    );
  }
}

class CommentModel {
  final String id;
  final String problemId;
  final SubmittedByModel author;
  final String text;
  final List<MediaModel> images;
  final int likesCount;
  final List<String> likes;
  final List<ReplyModel> replies;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  CommentModel({
    required this.id,
    required this.problemId,
    required this.author,
    required this.text,
    this.images = const [],
    this.likesCount = 0,
    this.likes = const [],
    this.replies = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: json['_id'] ?? '',
      problemId: json['problemId']?.toString() ?? '',
      author: json['author'] != null
          ? (json['author'] is Map<String, dynamic>
              ? SubmittedByModel.fromJson(json['author'])
              : SubmittedByModel(id: json['author'].toString(), name: 'Citizen'))
          : SubmittedByModel(id: 'unknown', name: 'Citizen'),
      text: json['text'] ?? '',
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => MediaModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      likesCount: json['likesCount'] ?? 0,
      likes: (json['likes'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      replies: (json['replies'] as List<dynamic>?)
              ?.map((e) => ReplyModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) : null,
    );
  }
}

import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sih_2026/core/network/api_client.dart';
import 'package:sih_2026/features/notifications/data/repositories/notification_repository.dart';
import 'package:sih_2026/features/reports/data/models/comment_model.dart';

class ProblemRepository {
  final ApiClient _apiClient = ApiClient();

  Future<Map<String, dynamic>> submitProblemStatement(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.post('/problems', data: data);
      if (response.data['success'] == true) {
        NotificationRepository.unreadCountNotifier.value++;
        NotificationRepository().getUnreadCount();
      }
      return response.data;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to submit problem');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<List<dynamic>> uploadImages(List<String> filePaths) async {
    try {
      FormData formData = FormData();
      for (var path in filePaths) {
        formData.files.add(MapEntry(
          'files',
          await MultipartFile.fromFile(path),
        ));
      }

      final response = await _apiClient.dio.post(
        '/upload',
        data: formData,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );
      
      if (response.data != null && response.data['data'] != null) {
        return response.data['data'] as List<dynamic>;
      }
      return [];
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to upload images');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<Map<String, dynamic>> fetchProblems({
    int page = 1,
    int limit = 10,
    String? district,
    String? sortBy,
    String? status,
    bool? my,
  }) async {
    try {
      final connectivityResult = await (Connectivity().checkConnectivity());
      final isOffline = connectivityResult.contains(ConnectivityResult.none) || 
                        (connectivityResult.length == 1 && connectivityResult.first == ConnectivityResult.none);
                        
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = 'cached_problems_feed_page_${page}_limit_${limit}_my_$my';

      if (isOffline) {
        final cachedData = prefs.getString(cacheKey);
        if (cachedData != null) {
          final decodedData = jsonDecode(cachedData);
          return {
            'data': decodedData['data'] as List<dynamic>,
            'pagination': decodedData['pagination']
          };
        } else {
          throw Exception('You are offline and no cached data is available.');
        }
      }

      final queryParams = {
        'page': page,
        'limit': limit,
        'district': district,
        'sortBy': sortBy,
        'status': status,
        'my': my == true ? 'true' : null,
      };

      final response = await _apiClient.dio.get('/problems', queryParameters: queryParams);
      if (response.data != null && response.data['data'] != null) {
        // Cache the response
        await prefs.setString(cacheKey, jsonEncode(response.data));

        return {
          'data': response.data['data'] as List<dynamic>,
          'pagination': response.data['pagination']
        };
      }
      return {'data': [], 'pagination': null};
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to fetch problems');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<Map<String, dynamic>> fetchProblemById(String problemId) async {
    try {
      final response = await _apiClient.dio.get('/problems/$problemId');
      return response.data;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to fetch problem details');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<Map<String, dynamic>> upvoteProblem(String problemId) async {
    try {
      final response = await _apiClient.dio.post('/problems/$problemId/upvote');
      return response.data;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to upvote problem');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<Map<String, dynamic>> toggleSaveProblem(String problemId) async {
    try {
      final response = await _apiClient.dio.post('/problems/$problemId/save');
      return response.data;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to update bookmark');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<Map<String, dynamic>> toggleFollowProblem(String problemId) async {
    try {
      final response = await _apiClient.dio.post('/problems/$problemId/follow');
      return response.data;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to update follow status');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<Map<String, dynamic>> reportDuplicate(String problemId, {String? notes, String? masterTicketId}) async {
    try {
      final response = await _apiClient.dio.post('/problems/$problemId/duplicate-report', data: {
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        if (masterTicketId != null && masterTicketId.isNotEmpty) 'masterTicketId': masterTicketId,
      });
      return response.data;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to report duplicate');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<Map<String, dynamic>> reportProblemContent(String problemId, {required String reason, String? details}) async {
    try {
      final response = await _apiClient.dio.post('/problems/$problemId/report', data: {
        'reason': reason,
        if (details != null && details.isNotEmpty) 'details': details,
      });
      return response.data;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to submit report');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<List<CommentModel>> fetchComments(String problemId) async {
    try {
      final response = await _apiClient.dio.get('/problems/$problemId/comments');
      if (response.data != null && response.data['data'] != null) {
        final List<dynamic> data = response.data['data'];
        return data.map((json) => CommentModel.fromJson(json)).toList();
      }
      return [];
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to fetch comments');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<CommentModel> addComment(String problemId, String text) async {
    try {
      final response = await _apiClient.dio.post('/problems/$problemId/comments', data: {'text': text});
      return CommentModel.fromJson(response.data['data'] ?? response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to post comment');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<CommentModel> replyToComment(String commentId, String text) async {
    try {
      final response = await _apiClient.dio.post('/problems/comments/$commentId/reply', data: {'text': text});
      return CommentModel.fromJson(response.data['data'] ?? response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to reply');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<CommentModel> toggleCommentLike(String commentId, {String? replyId}) async {
    try {
      final response = await _apiClient.dio.post('/problems/comments/$commentId/like', data: {
        if (replyId != null) 'replyId': replyId
      });
      return CommentModel.fromJson(response.data['data'] ?? response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to toggle like');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<CommentModel> editComment(String commentId, String text, {String? replyId}) async {
    try {
      final response = await _apiClient.dio.put('/problems/comments/$commentId', data: {
        'text': text,
        if (replyId != null) 'replyId': replyId
      });
      return CommentModel.fromJson(response.data['data'] ?? response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to edit comment');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<Map<String, dynamic>> deleteComment(String commentId, {String? replyId}) async {
    try {
      final response = await _apiClient.dio.delete('/problems/comments/$commentId', data: {
        if (replyId != null) 'replyId': replyId
      });
      return response.data;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Failed to delete comment');
      } else {
        throw Exception(e.message ?? 'Network error occurred');
      }
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:sih_2026/features/reports/data/repositories/problem_repository.dart';
import 'package:sih_2026/features/reports/data/models/comment_model.dart';

class CommentsBottomSheet extends StatefulWidget {
  final String problemId;
  final VoidCallback? onCommentAdded;

  const CommentsBottomSheet({super.key, required this.problemId, this.onCommentAdded});

  static void show(BuildContext context, String problemId, {VoidCallback? onCommentAdded}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CommentsBottomSheet(problemId: problemId, onCommentAdded: onCommentAdded),
    );
  }

  @override
  State<CommentsBottomSheet> createState() => _CommentsBottomSheetState();
}

class _CommentsBottomSheetState extends State<CommentsBottomSheet> {
  final ProblemRepository _repository = ProblemRepository();
  final TextEditingController _commentController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  
  List<CommentModel> _comments = [];
  bool _isLoading = true;
  bool _isPosting = false;
  String? _error;

  String? _replyingToCommentId;
  String? _replyingToAuthorName;

  @override
  void initState() {
    super.initState();
    _fetchComments();
  }

  Future<void> _fetchComments() async {
    try {
      final comments = await _repository.fetchComments(widget.problemId);
      setState(() {
        _comments = comments;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _postCommentOrReply() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isPosting = true);
    
    try {
      if (_replyingToCommentId != null) {
        final updatedComment = await _repository.replyToComment(_replyingToCommentId!, text);
        setState(() {
          final index = _comments.indexWhere((c) => c.id == updatedComment.id);
          if (index != -1) {
            _comments[index] = updatedComment;
          }
          _cancelReply();
        });
      } else {
        final comment = await _repository.addComment(widget.problemId, text);
        setState(() {
          _comments.insert(0, comment);
          _commentController.clear();
        });
        widget.onCommentAdded?.call();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  void _cancelReply() {
    setState(() {
      _replyingToCommentId = null;
      _replyingToAuthorName = null;
      _commentController.clear();
    });
    _focusNode.unfocus();
  }

  Future<void> _toggleLike(String commentId, {String? replyId}) async {
    try {
      final updatedComment = await _repository.toggleCommentLike(commentId, replyId: replyId);
      setState(() {
        final index = _comments.indexWhere((c) => c.id == updatedComment.id);
        if (index != -1) {
          _comments[index] = updatedComment;
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  void _showOptions(BuildContext context, {required String commentId, String? replyId, required bool isAuthor, required String currentText}) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isAuthor) ...[
                ListTile(
                  leading: const Icon(Icons.edit, color: Colors.blue),
                  title: const Text('Edit'),
                  onTap: () {
                    Navigator.pop(context);
                    _showEditDialog(commentId: commentId, replyId: replyId, currentText: currentText);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.delete, color: Colors.red),
                  title: const Text('Delete', style: TextStyle(color: Colors.red)),
                  onTap: () {
                    Navigator.pop(context);
                    _deleteComment(commentId, replyId: replyId);
                  },
                ),
              ] else ...[
                ListTile(
                  leading: const Icon(Icons.report, color: Colors.orange),
                  title: const Text('Report'),
                  onTap: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(this.context).showSnackBar(const SnackBar(content: Text('Report submitted')));
                  },
                ),
              ]
            ],
          ),
        );
      },
    );
  }

  Future<void> _deleteComment(String commentId, {String? replyId}) async {
    try {
      if (replyId != null) {
        final response = await _repository.deleteComment(commentId, replyId: replyId);
        setState(() {
          final index = _comments.indexWhere((c) => c.id == commentId);
          if (index != -1 && response['data'] != null) {
            _comments[index] = CommentModel.fromJson(response['data']);
          }
        });
      } else {
        await _repository.deleteComment(commentId);
        setState(() {
          _comments.removeWhere((c) => c.id == commentId);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  void _showEditDialog({required String commentId, String? replyId, required String currentText}) {
    final editController = TextEditingController(text: currentText);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Comment'),
        content: TextField(
          controller: editController,
          maxLines: null,
          decoration: const InputDecoration(border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              final newText = editController.text.trim();
              if (newText.isEmpty) return;
              Navigator.pop(context);
              try {
                final updatedComment = await _repository.editComment(commentId, newText, replyId: replyId);
                setState(() {
                  final index = _comments.indexWhere((c) => c.id == updatedComment.id);
                  if (index != -1) {
                    _comments[index] = updatedComment;
                  }
                });
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(this.context).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _commentController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Widget _buildCommentItem(CommentModel comment, String? currentUserId) {
    final authorName = comment.author.name.isNotEmpty ? comment.author.name : 'Citizen';
    final isAuthor = comment.author.id == currentUserId;
    final hasLiked = currentUserId != null && comment.likes.contains(currentUserId);
    
    String time = 'Just now';
    if (comment.createdAt != null) {
      time = comment.createdAt.toString().split(' ').first;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: const Color(0xFFF1F5F9),
              backgroundImage: comment.author.avatar != null
                  ? NetworkImage(comment.author.avatar!)
                  : null,
              child: comment.author.avatar == null
                  ? Text(
                      authorName.isNotEmpty ? authorName[0].toUpperCase() : 'C',
                      style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12).copyWith(topLeft: const Radius.circular(0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(authorName, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                            Row(
                              children: [
                                Text(time, style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF94A3B8))),
                                const SizedBox(width: 4),
                                GestureDetector(
                                  onTap: () => _showOptions(context, commentId: comment.id, isAuthor: isAuthor, currentText: comment.text),
                                  child: const Icon(Icons.more_horiz, size: 16, color: Color(0xFF94A3B8)),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(comment.text, style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF475569))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const SizedBox(width: 12),
                      GestureDetector(
                        onTap: () => _toggleLike(comment.id),
                        child: Row(
                          children: [
                            Icon(hasLiked ? Icons.favorite : Icons.favorite_border, size: 14, color: hasLiked ? Colors.red : const Color(0xFF94A3B8)),
                            const SizedBox(width: 4),
                            Text(
                              comment.likesCount > 0 ? '${comment.likesCount}' : 'Like',
                              style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF94A3B8), fontWeight: hasLiked ? FontWeight.bold : FontWeight.normal),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _replyingToCommentId = comment.id;
                            _replyingToAuthorName = authorName;
                          });
                          _focusNode.requestFocus();
                        },
                        child: Text(
                          'Reply',
                          style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF94A3B8)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        if (comment.replies.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(left: 44, top: 12),
            child: Column(
              children: comment.replies.map((reply) {
                final replyAuthorName = reply.author.name.isNotEmpty ? reply.author.name : 'Citizen';
                final isReplyAuthor = reply.author.id == currentUserId;
                final replyHasLiked = currentUserId != null && reply.likes.contains(currentUserId);
                
                String replyTime = 'Just now';
                if (reply.createdAt != null) {
                  replyTime = reply.createdAt.toString().split(' ').first;
                }
                
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 12,
                        backgroundColor: const Color(0xFFE2E8F0),
                        backgroundImage: reply.author.avatar != null
                            ? NetworkImage(reply.author.avatar!)
                            : null,
                        child: reply.author.avatar == null
                            ? Text(
                                replyAuthorName.isNotEmpty ? replyAuthorName[0].toUpperCase() : 'C',
                                style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary),
                              )
                            : null,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(10).copyWith(topLeft: const Radius.circular(0)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(replyAuthorName, style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                                      Row(
                                        children: [
                                          Text(replyTime, style: GoogleFonts.poppins(fontSize: 9, color: const Color(0xFF94A3B8))),
                                          const SizedBox(width: 4),
                                          GestureDetector(
                                            onTap: () => _showOptions(context, commentId: comment.id, replyId: reply.id, isAuthor: isReplyAuthor, currentText: reply.text),
                                            child: const Icon(Icons.more_horiz, size: 14, color: Color(0xFF94A3B8)),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(reply.text, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF475569))),
                                ],
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const SizedBox(width: 8),
                                GestureDetector(
                                  onTap: () => _toggleLike(comment.id, replyId: reply.id),
                                  child: Row(
                                    children: [
                                      Icon(replyHasLiked ? Icons.favorite : Icons.favorite_border, size: 12, color: replyHasLiked ? Colors.red : const Color(0xFF94A3B8)),
                                      const SizedBox(width: 4),
                                      Text(
                                        reply.likesCount > 0 ? '${reply.likesCount}' : 'Like',
                                        style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF94A3B8), fontWeight: replyHasLiked ? FontWeight.bold : FontWeight.normal),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final currentUserId = context.read<AuthBloc>().state.user?.id;
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.75 + bottomInset,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag Handle & Title
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Community Comments',
                  style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                ),
                const Divider(color: Color(0xFFE2E8F0)),
              ],
            ),
          ),
          
          // Comments List
          Expanded(
            child: _isLoading 
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _error != null
                    ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
                    : _comments.isEmpty
                        ? Center(
                            child: Text(
                              'No comments yet. Be the first to add info!',
                              style: GoogleFonts.poppins(color: const Color(0xFF94A3B8)),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            itemCount: _comments.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 16),
                            itemBuilder: (context, index) {
                              return _buildCommentItem(_comments[index], currentUserId);
                            },
                          ),
          ),
          
          // Input Area
          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 12,
              bottom: 12 + bottomInset,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  offset: const Offset(0, -4),
                  blurRadius: 10,
                )
              ]
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_replyingToAuthorName != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8.0, left: 4),
                    child: Row(
                      children: [
                        Text(
                          'Replying to @$_replyingToAuthorName',
                          style: GoogleFonts.poppins(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: _cancelReply,
                          child: const Icon(Icons.close, size: 16, color: Colors.grey),
                        )
                      ],
                    ),
                  ),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _commentController,
                        focusNode: _focusNode,
                        decoration: InputDecoration(
                          hintText: _replyingToAuthorName != null ? 'Write a reply...' : 'Add info or comment...',
                          hintStyle: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF94A3B8)),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: const Color(0xFFF1F5F9),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                        maxLines: null,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _postCommentOrReply(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: _isPosting ? null : _postCommentOrReply,
                      child: CircleAvatar(
                        backgroundColor: AppColors.primary,
                        radius: 20,
                        child: _isPosting 
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.send, color: Colors.white, size: 18),
                      ),
                    )
                  ],
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}

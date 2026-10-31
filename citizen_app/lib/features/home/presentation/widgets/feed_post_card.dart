import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/core/utils/share_helper.dart';
import 'package:sih_2026/features/notifications/data/repositories/notification_repository.dart';
import 'package:sih_2026/features/reports/data/repositories/problem_repository.dart';
import 'package:sih_2026/features/reports/presentation/widgets/comments_bottom_sheet.dart';
import 'package:sih_2026/core/localization/app_localizations.dart';

class FeedPostCard extends StatefulWidget {
  final String? badgeText;
  final Color? badgeColor;
  final Color? badgeBgColor;
  final IconData? badgeIcon;
  final String timeOrDistance;
  final String title;
  final String description;
  final List<String> images;
  final String location;
  final String? peopleAffectedOrBenefited;
  final String? categoryText;
  final Color? categoryColor;
  final Color? categoryBgColor;
  final IconData? categoryIcon;
  final String? urgencyText;
  final Color? urgencyColor;
  final Color? urgencyBgColor;
  final Color? urgencyIconColor;
  final List<String>? tags;
  final String? reporterName;
  final String? reporterTime;
  final String? reporterAvatar;
  final List<String>? bottomAvatars;
  final String? interactionText;
  final String actionButtonText;
  final VoidCallback onActionPressed;
  final Widget? extraStatsRow;
  final int upvotes;
  final int comments;
  final int shares;
  final bool hasUpvoted;
  final String? problemId;
  final bool isBookmarked;
  final bool isFollowing;
  final double? latitude;
  final double? longitude;
  final void Function(bool hasUpvoted, int upvotesCount)? onUpvoteToggled;
  final void Function(int commentsCount)? onCommentAdded;

  const FeedPostCard({
    super.key,
    this.badgeText,
    this.badgeColor,
    this.badgeBgColor,
    this.badgeIcon,
    required this.timeOrDistance,
    required this.title,
    required this.description,
    required this.images,
    required this.location,
    this.peopleAffectedOrBenefited,
    this.categoryText,
    this.categoryColor,
    this.categoryBgColor,
    this.categoryIcon,
    this.urgencyText,
    this.urgencyColor,
    this.urgencyBgColor,
    this.urgencyIconColor,
    this.tags,
    this.reporterName,
    this.reporterTime,
    this.reporterAvatar,
    this.bottomAvatars,
    this.interactionText,
    this.actionButtonText = 'View Details',
    required this.onActionPressed,
    this.extraStatsRow,
    this.upvotes = 0,
    this.comments = 0,
    this.shares = 0,
    this.hasUpvoted = false,
    this.problemId,
    this.isBookmarked = false,
    this.isFollowing = false,
    this.latitude,
    this.longitude,
    this.onUpvoteToggled,
    this.onCommentAdded,
  });

  @override
  State<FeedPostCard> createState() => _FeedPostCardState();
}

class _FeedPostCardState extends State<FeedPostCard> {
  int _currentImageIndex = 0;
  late bool _hasUpvoted;
  late int _upvotesCount;
  late int _commentsCount;
  late bool _isBookmarked;
  late bool _isFollowing;
  final ProblemRepository _repository = ProblemRepository();
  bool _isDescriptionExpanded = false;
  late final PageController _pageController;

  @override
  void initState() {
    super.initState();
    _hasUpvoted = widget.hasUpvoted;
    _upvotesCount = widget.upvotes;
    _commentsCount = widget.comments;
    _isBookmarked = widget.isBookmarked;
    _isFollowing = widget.isFollowing;
    _pageController = PageController();
  }

  @override
  void didUpdateWidget(FeedPostCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.comments != widget.comments) {
      _commentsCount = widget.comments;
    }
    if (oldWidget.upvotes != widget.upvotes) {
      _upvotesCount = widget.upvotes;
    }
    if (oldWidget.hasUpvoted != widget.hasUpvoted) {
      _hasUpvoted = widget.hasUpvoted;
    }
    if (oldWidget.isBookmarked != widget.isBookmarked) {
      _isBookmarked = widget.isBookmarked;
    }
    if (oldWidget.isFollowing != widget.isFollowing) {
      _isFollowing = widget.isFollowing;
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _toggleUpvote() async {
    if (widget.problemId == null) return;

    HapticFeedback.lightImpact();

    final wasUpvoted = _hasUpvoted;
    final previousCount = _upvotesCount;

    // Instant optimistic update on frame 0
    setState(() {
      _hasUpvoted = !wasUpvoted;
      _upvotesCount += _hasUpvoted ? 1 : -1;
    });
    widget.onUpvoteToggled?.call(_hasUpvoted, _upvotesCount);

    try {
      final response = await _repository.upvoteProblem(widget.problemId!);
      if (response['data'] != null && mounted) {
        setState(() {
          _hasUpvoted = response['data']['hasUpvoted'] == true;
          _upvotesCount = (response['data']['upvotesCount'] as num?)?.toInt() ?? _upvotesCount;
        });
        widget.onUpvoteToggled?.call(_hasUpvoted, _upvotesCount);
      }
    } catch (e) {
      if (mounted) {
        // Revert optimistic update on failure
        setState(() {
          _hasUpvoted = wasUpvoted;
          _upvotesCount = previousCount;
        });
        widget.onUpvoteToggled?.call(_hasUpvoted, _upvotesCount);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  void _showOptionsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (bottomSheetContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Handle Bar
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Header Info
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: const Color(0xFFF1F5F9),
                          backgroundImage: widget.reporterAvatar != null
                              ? NetworkImage(widget.reporterAvatar!)
                              : null,
                          child: widget.reporterAvatar == null
                              ? const Icon(Icons.person, color: Color(0xFF64748B))
                              : null,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF1E293B),
                                ),
                              ),
                              Text(
                                '${widget.reporterName ?? "Citizen"} • ${widget.location}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 8),

                  // 1. Share / Copy Link
                  _buildOptionItem(
                    icon: Icons.share_outlined,
                    title: 'Share Issue Link',
                    subtitle: 'Share with local authorities or community',
                    onTap: () {
                      Navigator.pop(bottomSheetContext);
                      _shareIssue(context);
                    },
                  ),

                  // 2. Bookmark / Save Post
                  _buildOptionItem(
                    icon: _isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                    iconColor: _isBookmarked ? AppColors.primary : const Color(0xFF1E293B),
                    title: _isBookmarked ? 'Saved to Bookmarks' : 'Save Issue',
                    subtitle: 'Bookmark to review in your saved reports',
                    onTap: () => _toggleSave(context, setModalState),
                  ),

                  // 3. Follow Updates
                  _buildOptionItem(
                    icon: _isFollowing ? Icons.notifications_active : Icons.notifications_none_rounded,
                    iconColor: _isFollowing ? Colors.orange : const Color(0xFF1E293B),
                    title: _isFollowing ? 'Following Updates' : 'Follow for Updates',
                    subtitle: 'Get notified when authorities take action',
                    onTap: () => _toggleFollow(context, setModalState),
                  ),

                  // 4. View on Live Map
                  _buildOptionItem(
                    icon: Icons.map_outlined,
                    title: 'View on Live Map',
                    subtitle: 'Locate nearby issues on the interactive map',
                    onTap: () {
                      Navigator.pop(bottomSheetContext);
                      _viewOnLiveMap(context);
                    },
                  ),

                  // 5. Report Duplicate
                  _buildOptionItem(
                    icon: Icons.copy_rounded,
                    title: 'Mark as Duplicate',
                    subtitle: 'Link this to an already existing problem',
                    onTap: () {
                      Navigator.pop(bottomSheetContext);
                      _showDuplicateConfirmation(context);
                    },
                  ),

                  // 6. Report Inappropriate / Spam
                  _buildOptionItem(
                    icon: Icons.flag_outlined,
                    iconColor: Colors.red,
                    title: 'Report Content',
                    subtitle: 'Flag inappropriate media, fake info, or spam',
                    textColor: Colors.red,
                    onTap: () {
                      Navigator.pop(bottomSheetContext);
                      _showReportContentDialog(context);
                    },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _shareIssue(BuildContext context) {
    ShareHelper.showShareModal(
      context: context,
      problemId: widget.problemId ?? '',
      title: widget.title,
      location: widget.location,
      images: widget.images,
    );
  }

  Future<void> _toggleSave(BuildContext context, StateSetter setModalState) async {
    if (widget.problemId == null) return;
    final previousState = _isBookmarked;

    setModalState(() {
      _isBookmarked = !previousState;
    });
    setState(() {
      _isBookmarked = !previousState;
    });

    try {
      final res = await _repository.toggleSaveProblem(widget.problemId!);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message'] ?? (_isBookmarked ? 'Saved to bookmarks!' : 'Removed from saved reports')),
            backgroundColor: AppColors.primary,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      setModalState(() {
        _isBookmarked = previousState;
      });
      setState(() {
        _isBookmarked = previousState;
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update bookmark: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _toggleFollow(BuildContext context, StateSetter setModalState) async {
    if (widget.problemId == null) return;
    final previousState = _isFollowing;

    setModalState(() {
      _isFollowing = !previousState;
    });
    setState(() {
      _isFollowing = !previousState;
    });

    try {
      final res = await _repository.toggleFollowProblem(widget.problemId!);
      if (_isFollowing) {
        NotificationRepository.unreadCountNotifier.value++;
        NotificationRepository().getUnreadCount();
      } else {
        NotificationRepository().getUnreadCount();
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message'] ??
                (_isFollowing
                    ? 'Following updates! You will receive status notifications.'
                    : 'Unfollowed issue updates.')),
            backgroundColor: AppColors.primary,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      setModalState(() {
        _isFollowing = previousState;
      });
      setState(() {
        _isFollowing = previousState;
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update follow status: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _viewOnLiveMap(BuildContext context) {
    if (widget.problemId != null) {
      final latParam = widget.latitude != null ? '&lat=${widget.latitude}' : '';
      final lngParam = widget.longitude != null ? '&lng=${widget.longitude}' : '';
      context.push('/explore?problemId=${widget.problemId}$latParam$lngParam');
    } else {
      context.push('/explore');
    }
  }

  void _showDuplicateConfirmation(BuildContext context) {
    final noteController = TextEditingController();
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(
            'Report as Duplicate',
            style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Linking this report to an existing issue helps authorities prioritize faster by consolidating reports.',
                style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: noteController,
                maxLines: 2,
                decoration: InputDecoration(
                  labelText: 'Reference Note or Ticket ID (Optional)',
                  labelStyle: GoogleFonts.poppins(fontSize: 12),
                  hintText: 'e.g., Same pothole near Main Road reported yesterday',
                  hintStyle: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF94A3B8)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  contentPadding: const EdgeInsets.all(12),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: isSubmitting ? null : () => Navigator.pop(dialogCtx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: isSubmitting || widget.problemId == null
                  ? null
                  : () async {
                      setDialogState(() => isSubmitting = true);
                      try {
                        final res = await _repository.reportDuplicate(
                          widget.problemId!,
                          notes: noteController.text.trim(),
                        );
                        if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res['message'] ?? 'Duplicate report submitted for verification.'),
                              backgroundColor: AppColors.primary,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      } catch (e) {
                        setDialogState(() => isSubmitting = false);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('$e'.replaceAll('Exception: ', '')),
                              backgroundColor: Colors.red,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      }
                    },
              child: isSubmitting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Submit Match', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  void _showReportContentDialog(BuildContext context) {
    final reasons = [
      'Spam or Advertising',
      'False / Misleading Information',
      'Offensive or Inappropriate Media',
      'Duplicate Post',
      'Other'
    ];
    String selectedReason = reasons.first;
    final detailsController = TextEditingController();
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(
            'Report Content',
            style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Help us understand the issue with this post:',
                  style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B)),
                ),
                const SizedBox(height: 12),
                ...reasons.map((reason) {
                  final isSelected = selectedReason == reason;
                  return InkWell(
                    onTap: () => setDialogState(() => selectedReason = reason),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          Icon(
                            isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                            color: isSelected ? Colors.red : const Color(0xFF94A3B8),
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              reason,
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                color: isSelected ? const Color(0xFF1E293B) : const Color(0xFF64748B),
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 12),
                TextField(
                  controller: detailsController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    labelText: 'Additional Details (Optional)',
                    labelStyle: GoogleFonts.poppins(fontSize: 12),
                    hintText: 'Briefly describe the violation...',
                    hintStyle: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF94A3B8)),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    contentPadding: const EdgeInsets.all(12),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isSubmitting ? null : () => Navigator.pop(dialogCtx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: isSubmitting || widget.problemId == null
                  ? null
                  : () async {
                      setDialogState(() => isSubmitting = true);
                      try {
                        final res = await _repository.reportProblemContent(
                          widget.problemId!,
                          reason: selectedReason,
                          details: detailsController.text.trim(),
                        );
                        if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res['message'] ?? 'Report submitted for review.'),
                              backgroundColor: Colors.red,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      } catch (e) {
                        setDialogState(() => isSubmitting = false);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('$e'.replaceAll('Exception: ', '')),
                              backgroundColor: Colors.red,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      }
                    },
              child: isSubmitting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Submit Report', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color? iconColor,
    Color? textColor,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: (iconColor ?? const Color(0xFF1E293B)).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor ?? const Color(0xFF1E293B), size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: textColor ?? const Color(0xFF1E293B),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, size: 18, color: Color(0xFFCBD5E1)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. TOP IMAGE AREA WITH FULL-BLEED OVERLAYS & INSTAGRAM CAROUSEL
            _buildTopImageSection(),

            // 2. BODY CONTENT (Title, Description, Tags, Action Buttons)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Upper Clickable Area (Title, Description, Tags -> details)
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: widget.onActionPressed,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title
                        Text(
                          widget.title,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF0F172A),
                            height: 1.35,
                          ),
                          softWrap: true,
                        ),
                        const SizedBox(height: 6),

                        // Description
                        if (widget.description.isNotEmpty) ...[
                          AnimatedSize(
                            duration: const Duration(milliseconds: 200),
                            alignment: Alignment.topLeft,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.description,
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    color: const Color(0xFF64748B),
                                    height: 1.45,
                                  ),
                                  maxLines: _isDescriptionExpanded ? null : 1,
                                  overflow: _isDescriptionExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
                                ),
                                if (widget.description.length > 40) ...[
                                  const SizedBox(height: 4),
                                  GestureDetector(
                                    behavior: HitTestBehavior.opaque,
                                    onTap: () {
                                      setState(() {
                                        _isDescriptionExpanded = !_isDescriptionExpanded;
                                      });
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 2.0),
                                      child: Text(
                                        _isDescriptionExpanded ? context.tr('show_less') : context.tr('read_more'),
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 14),

                        // Tag Chips Row
                        _buildTagChipsRow(),
                      ],
                    ),
                  ),

                  if (widget.extraStatsRow != null) ...[
                    const SizedBox(height: 12),
                    widget.extraStatsRow!,
                  ],

                  const SizedBox(height: 16),

                  // Bottom Action Bar (Upvote, Comment, Share) - Dedicated, zero gesture conflicts
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          _buildActionStat(
                            Icons.arrow_upward_rounded,
                            _upvotesCount,
                            onTap: _toggleUpvote,
                            isActive: _hasUpvoted,
                            activeColor: AppColors.primary,
                          ),
                          const SizedBox(width: 8),
                          _buildActionStat(
                            Icons.chat_bubble_rounded,
                            _commentsCount,
                            onTap: () {
                              if (widget.problemId != null) {
                                CommentsBottomSheet.show(
                                  context,
                                  widget.problemId!,
                                  onCommentAdded: () {
                                    if (mounted) {
                                      setState(() {
                                        _commentsCount++;
                                      });
                                      widget.onCommentAdded?.call(_commentsCount);
                                    }
                                  },
                                );
                              }
                            },
                          ),
                          const SizedBox(width: 8),
                          _buildActionStat(
                            Icons.share_rounded,
                            widget.shares,
                            onTap: () => _shareIssue(context),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopImageSection() {
    final hasMultipleImages = widget.images.length > 1;

    return SizedBox(
      height: 270,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Image Carousel / PageView (Instagram style)
          PageView.builder(
            controller: _pageController,
            physics: const BouncingScrollPhysics(),
            itemCount: widget.images.isNotEmpty ? widget.images.length : 1,
            onPageChanged: (index) {
              setState(() {
                _currentImageIndex = index;
              });
            },
            itemBuilder: (context, index) {
              final imageUrl = widget.images.isNotEmpty
                  ? widget.images[index]
                  : 'https://placehold.co/600x400?text=No+Image';
              return GestureDetector(
                onTap: widget.onActionPressed,
                child: Image.network(
                  imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: const Color(0xFFE2E8F0),
                    child: const Icon(
                      Icons.image_not_supported_outlined,
                      color: Color(0xFF94A3B8),
                      size: 40,
                    ),
                  ),
                ),
              );
            },
          ),

          // 2. Vignette gradient for top and bottom overlay contrast (wrapped in IgnorePointer so swiping works)
          Positioned.fill(
            child: IgnorePointer(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.45),
                      Colors.transparent,
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.55),
                    ],
                    stops: const [0.0, 0.25, 0.7, 1.0],
                  ),
                ),
              ),
            ),
          ),

          // 3. TOP OVERLAYS
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Top Left: "Civic Concern" Pill with Leaf (IgnorePointer so swipes pass through)
                IgnorePointer(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.92),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.eco, size: 15, color: Color(0xFF15803D)),
                        const SizedBox(width: 5),
                        Text(
                          widget.badgeText ?? 'Civic Concern',
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF166534),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Top Right: Urgency Pill + Time Ago + 3-Dots Options Menu
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Urgency Pill (e.g. ! Medium)
                    if (widget.urgencyText != null)
                      IgnorePointer(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: widget.urgencyBgColor ?? const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.error_rounded,
                                size: 14,
                                color: widget.urgencyIconColor ??
                                    widget.urgencyColor ??
                                    const Color(0xFF92400E),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                widget.urgencyText!,
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: widget.urgencyColor ?? const Color(0xFF92400E),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(width: 8),

                    // Time Ago Text
                    IgnorePointer(
                      child: Text(
                        widget.timeOrDistance,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                          shadows: [
                            Shadow(
                              color: Colors.black.withValues(alpha: 0.6),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),

                    // 3 Vertical Dots (Interactive Options Menu)
                    GestureDetector(
                      onTap: () => _showOptionsMenu(context),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.25),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.more_vert,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // 4. INSTAGRAM-STYLE DOTS INDICATOR (Centered at bottom of image)
          if (hasMultipleImages)
            Positioned(
              bottom: 14,
              left: 0,
              right: 0,
              child: IgnorePointer(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    widget.images.length,
                    (index) {
                      final isSelected = _currentImageIndex == index;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeInOut,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: isSelected ? 18 : 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(3),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.3),
                              blurRadius: 3,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),

          // 5. BOTTOM OVERLAYS (Location Pill + Counter Pill)
          Positioned(
            bottom: 12,
            left: 12,
            right: 12,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Bottom Left: Location Pill (IgnorePointer so swipes pass through)
                Flexible(
                  child: IgnorePointer(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.location_on, size: 14, color: Colors.white),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              widget.location,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Bottom Right: Image Counter Pill (e.g. 1/4)
                if (hasMultipleImages)
                  IgnorePointer(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${_currentImageIndex + 1} / ${widget.images.length}',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTagChipsRow() {
    final chips = widget.tags ?? [
      if (widget.categoryText != null) widget.categoryText!,
      'Public Concern',
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 6,
      children: chips.asMap().entries.map((entry) {
        final idx = entry.key;
        final tag = entry.value;

        final isFirst = idx == 0;
        final isGreenTint = idx == 1;

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isGreenTint ? const Color(0xFFF0FDF4) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isFirst) ...[
                const Icon(Icons.domain_rounded, size: 13, color: Color(0xFF475569)),
                const SizedBox(width: 4),
              ],
              Text(
                tag,
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isGreenTint ? const Color(0xFF166534) : const Color(0xFF475569),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildActionStat(
    IconData icon,
    int count, {
    required VoidCallback onTap,
    bool isActive = false,
    Color? activeColor,
  }) {
    final Color iconColor = isActive ? (activeColor ?? AppColors.primary) : const Color(0xFF64748B);
    final Color textColor = isActive ? (activeColor ?? AppColors.primary) : const Color(0xFF334155);
    final Color bgColor = isActive
        ? (activeColor ?? AppColors.primary).withValues(alpha: 0.12)
        : const Color(0xFFF1F5F9);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          curve: Curves.easeInOut,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: iconColor),
              const SizedBox(width: 6),
              Text(
                count.toString(),
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: textColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

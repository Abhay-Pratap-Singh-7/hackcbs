import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/core/localization/app_localizations.dart';
import 'package:sih_2026/features/notifications/data/models/notification_model.dart';
import 'package:sih_2026/features/notifications/data/repositories/notification_repository.dart';

class NotificationPage extends StatefulWidget {
  const NotificationPage({super.key});

  @override
  State<NotificationPage> createState() => _NotificationPageState();
}

class _NotificationPageState extends State<NotificationPage> {
  final NotificationRepository _repository = NotificationRepository();
  List<NotificationModel> _notifications = [];
  bool _isLoading = true;
  String _selectedFilter = 'ALL'; // ALL, NEARBY_PROBLEM, FOLLOWED_UPDATE, PROBLEM_POSTED

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    final list = await _repository.fetchNotifications(
      type: _selectedFilter == 'ALL' ? null : _selectedFilter,
    );
    if (mounted) {
      setState(() {
        _notifications = list;
        _isLoading = false;
      });
      NotificationRepository.unreadCountNotifier.value = list.where((n) => !n.isRead).length;
    }
  }

  Future<void> _markAllAsRead() async {
    final success = await _repository.markAllAsRead();
    if (success && mounted) {
      setState(() {
        _notifications = _notifications.map((n) => n.copyWith(isRead: true)).toList();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('all_notifications_read'), style: GoogleFonts.poppins(fontSize: 12)),
          backgroundColor: AppColors.primary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _handleNotificationTap(NotificationModel notification) async {
    if (!notification.isRead) {
      _repository.markAsRead(notification.id);
      setState(() {
        final index = _notifications.indexWhere((n) => n.id == notification.id);
        if (index != -1) {
          _notifications[index] = _notifications[index].copyWith(isRead: true);
        }
      });
    }

    if (notification.problemId != null && notification.problemId!.isNotEmpty) {
      context.push('/issue/${notification.problemId}');
    }
  }

  Future<void> _deleteNotification(NotificationModel notification) async {
    final id = notification.id;
    setState(() {
      _notifications.removeWhere((n) => n.id == id);
    });
    await _repository.deleteNotification(id);
    NotificationRepository.unreadCountNotifier.value = _notifications.where((n) => !n.isRead).length;
  }

  int get _unreadCount => _notifications.where((n) => !n.isRead).length;

  List<NotificationModel> get _filteredList {
    if (_selectedFilter == 'ALL') return _notifications;
    return _notifications.where((n) => n.type == _selectedFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1E293B), size: 18),
          onPressed: () => context.pop(),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              context.tr('notifications_title'),
              style: GoogleFonts.poppins(
                color: const Color(0xFF1E293B),
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (_unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$_unreadCount ${context.tr('new_label')}',
                  style: GoogleFonts.poppins(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ],
        ),
        centerTitle: true,
        actions: [
          if (_notifications.any((n) => !n.isRead))
            IconButton(
              icon: const Icon(Icons.done_all_rounded, color: AppColors.primary, size: 22),
              tooltip: context.tr('mark_all_read'),
              onPressed: _markAllAsRead,
            ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips Row
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildFilterChip(context.tr('filter_all'), 'ALL'),
                  const SizedBox(width: 8),
                  _buildFilterChip(context.tr('filter_nearby_notif'), 'NEARBY_PROBLEM'),
                  const SizedBox(width: 8),
                  _buildFilterChip(context.tr('filter_followed_updates'), 'FOLLOWED_UPDATE'),
                  const SizedBox(width: 8),
                  _buildFilterChip(context.tr('filter_my_reports_notif'), 'PROBLEM_POSTED'),
                ],
              ),
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Notifications List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : RefreshIndicator(
                    color: AppColors.primary,
                    onRefresh: _loadNotifications,
                    child: _filteredList.isEmpty
                        ? _buildEmptyState(context)
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredList.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final notification = _filteredList[index];
                              return _buildNotificationCard(context, notification);
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String typeKey) {
    final isSelected = _selectedFilter == typeKey;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedFilter = typeKey);
        _loadNotifications();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0)),
        ),
        child: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationCard(BuildContext context, NotificationModel notification) {
    final config = _getNotificationConfig(context, notification);

    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: Colors.red.shade400,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete_outline_rounded, color: Colors.white, size: 24),
      ),
      onDismissed: (_) => _deleteNotification(notification),
      child: Material(
        color: notification.isRead ? Colors.white : const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(16),
        elevation: 0,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _handleNotificationTap(notification),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: notification.isRead ? const Color(0xFFE2E8F0) : AppColors.primary.withValues(alpha: 0.3),
                width: notification.isRead ? 1 : 1.5,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon Avatar
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: config.iconBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(config.icon, color: config.iconColor, size: 22),
                ),
                const SizedBox(width: 12),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Badge & Timestamp row
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: config.badgeBg,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              config.badgeText,
                              style: GoogleFonts.poppins(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: config.badgeColor,
                              ),
                            ),
                          ),
                          if (notification.distanceKm != null) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '📍 ${notification.distanceKm!.toStringAsFixed(1)} km',
                                style: GoogleFonts.poppins(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF2563EB),
                                ),
                              ),
                            ),
                          ],
                          const Spacer(),
                          Text(
                            context.formatTimeAgo(notification.createdAt),
                            style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF94A3B8)),
                          ),
                          if (!notification.isRead) ...[
                            const SizedBox(width: 6),
                            Container(
                              width: 7,
                              height: 7,
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 6),

                      // Title
                      Text(
                        context.trNotificationTitle(notification.title, notification.type),
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Message Body
                      Text(
                        context.trNotificationMessage(notification.message, notification.type),
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: const Color(0xFF64748B),
                          height: 1.35,
                        ),
                      ),

                      // View Issue Link
                      if (notification.problemId != null && notification.problemId!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Text(
                              context.tr('view_issue_details'),
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.arrow_forward_rounded, size: 12, color: AppColors.primary),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.notifications_none_rounded, size: 48, color: AppColors.primary),
            ),
            const SizedBox(height: 16),
            Text(
              context.tr('notifications_empty_title'),
              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
            ),
            const SizedBox(height: 6),
            Text(
              _selectedFilter == 'ALL'
                  ? context.tr('notifications_empty_sub_all')
                  : context.tr('notifications_empty_sub_filter'),
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B), height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  _NotificationConfig _getNotificationConfig(BuildContext context, NotificationModel n) {
    if (n.type == 'NEARBY_PROBLEM') {
      return _NotificationConfig(
        icon: Icons.location_on_rounded,
        iconColor: const Color(0xFF059669),
        iconBg: const Color(0xFFECFDF5),
        badgeText: context.tr('badge_nearby'),
        badgeColor: const Color(0xFF065F46),
        badgeBg: const Color(0xFFD1FAE5),
      );
    } else if (n.type == 'FOLLOWED_UPDATE') {
      final isAdopted = n.title.contains('Adopted') || n.message.contains('adopted');
      if (isAdopted) {
        return _NotificationConfig(
          icon: Icons.school_rounded,
          iconColor: const Color(0xFF4F46E5),
          iconBg: const Color(0xFFEEF2FF),
          badgeText: context.tr('badge_uni_adopted'),
          badgeColor: const Color(0xFF3730A3),
          badgeBg: const Color(0xFFE0E7FF),
        );
      }
      return _NotificationConfig(
        icon: Icons.notifications_active_rounded,
        iconColor: const Color(0xFFD97706),
        iconBg: const Color(0xFFFEF3C7),
        badgeText: context.tr('badge_followed_update'),
        badgeColor: const Color(0xFF92400E),
        badgeBg: const Color(0xFFFDE68A),
      );
    } else if (n.type == 'PROBLEM_POSTED') {
      return _NotificationConfig(
        icon: Icons.task_alt_rounded,
        iconColor: AppColors.primary,
        iconBg: const Color(0xFFF0FDF4),
        badgeText: context.tr('badge_my_report'),
        badgeColor: AppColors.primary,
        badgeBg: const Color(0xFFDCFCE7),
      );
    }
    return _NotificationConfig(
      icon: Icons.info_outline_rounded,
      iconColor: const Color(0xFF64748B),
      iconBg: const Color(0xFFF1F5F9),
      badgeText: context.tr('badge_system'),
      badgeColor: const Color(0xFF475569),
      badgeBg: const Color(0xFFE2E8F0),
    );
  }
}

class _NotificationConfig {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String badgeText;
  final Color badgeColor;
  final Color badgeBg;

  _NotificationConfig({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.badgeText,
    required this.badgeColor,
    required this.badgeBg,
  });
}

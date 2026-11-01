import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/features/reports/data/repositories/problem_repository.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_state.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_event.dart';
import 'package:sih_2026/features/reports/data/models/problem_statement_model.dart';
import 'package:shimmer/shimmer.dart';
import 'package:geolocator/geolocator.dart';
import 'package:sih_2026/features/notifications/data/repositories/notification_repository.dart';
import 'package:sih_2026/core/services/push_notification_service.dart';
import 'package:sih_2026/core/localization/app_localizations.dart';
import 'package:sih_2026/core/localization/widgets/language_selector_button.dart';
import '../widgets/feed_post_card.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with WidgetsBindingObserver {
  final ProblemRepository _repository = ProblemRepository();
  final NotificationRepository _notificationRepository = NotificationRepository();
  final ScrollController _scrollController = ScrollController();
  
  List<dynamic> _problems = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  int _currentPage = 1;
  String _selectedFilter = 'All'; // 'All', 'Nearby', 'Trending', etc.
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _scrollController.addListener(_onScroll);
    _fetchInitialProblems();
    _fetchUnreadNotificationsCount();
    _syncUserLocation();
    PushNotificationService().syncTokenWithBackend();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<AuthBloc>().add(const CheckAuthStatusEvent());
        PushNotificationService().syncTokenWithBackend();
      }
    });
  }

  Future<void> _fetchUnreadNotificationsCount() async {
    await _notificationRepository.getUnreadCount();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _fetchUnreadNotificationsCount();
      PushNotificationService().syncTokenWithBackend();
    }
  }

  Future<void> _syncUserLocation() async {
    try {
      final district = mounted ? context.read<AuthBloc>().state.user?.district : null;
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.always || permission == LocationPermission.whileInUse) {
        final pos = await Geolocator.getLastKnownPosition() ??
            await Geolocator.getCurrentPosition(
              locationSettings: const LocationSettings(
                accuracy: LocationAccuracy.medium,
                timeLimit: Duration(seconds: 5),
              ),
            );
        await _notificationRepository.updateLocation(pos.latitude, pos.longitude, district: district);
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 &&
        !_isLoadingMore &&
        _hasMore) {
      _loadMoreProblems();
    }
  }

  Future<void> _fetchInitialProblems() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _currentPage = 1;
      _hasMore = true;
      _problems = [];
    });

    try {
      final district = _selectedFilter == 'Nearby' ? context.read<AuthBloc>().state.user?.district : null;
      String? sortBy;
      String? status;
      
      if (_selectedFilter == 'Trending') {
        sortBy = 'upvotesCount'; // backend needs to support this
      } else if (_selectedFilter == 'Solved') {
        status = 'DEPLOYED';
      } else if (_selectedFilter == 'Needs Support') {
        status = 'SUBMITTED';
      }
      
      final response = await _repository.fetchProblems(
        page: _currentPage,
        limit: 10,
        district: district,
        sortBy: sortBy,
        status: status,
      );
      
      setState(() {
        _problems = response['data'] ?? [];
        final pagination = response['pagination'];
        if (pagination != null && pagination['pages'] != null) {
          _hasMore = _currentPage < (pagination['pages'] as num).toInt();
        } else {
          _hasMore = false;
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMoreProblems() async {
    setState(() => _isLoadingMore = true);
    try {
      _currentPage++;
      final district = _selectedFilter == 'Nearby' ? context.read<AuthBloc>().state.user?.district : null;
      String? sortBy;
      String? status;
      
      if (_selectedFilter == 'Trending') {
        sortBy = 'upvotesCount';
      } else if (_selectedFilter == 'Solved') {
        status = 'DEPLOYED';
      } else if (_selectedFilter == 'Needs Support') {
        status = 'SUBMITTED';
      }
      
      final response = await _repository.fetchProblems(
        page: _currentPage,
        limit: 10,
        district: district,
        sortBy: sortBy,
        status: status,
      );
      
      setState(() {
        final newProblems = response['data'] ?? [];
        _problems.addAll(newProblems);
        final pagination = response['pagination'];
        if (pagination != null && pagination['pages'] != null) {
          _hasMore = _currentPage < (pagination['pages'] as num).toInt();
        } else {
          _hasMore = false;
        }
      });
    } catch (e) {
      // maybe show a snackbar
    } finally {
      setState(() => _isLoadingMore = false);
    }
  }

  Future<void> _refresh() async {
    await _fetchInitialProblems();
  }

  void _onFilterSelected(String filter) {
    if (_selectedFilter == filter) return;
    setState(() {
      _selectedFilter = filter;
    });
    _fetchInitialProblems();
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // 1. Static Background Image + Gradient (anchored to top)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Stack(
              children: [
                Image.asset(
                  'assets/images/header_bg.png',
                  width: double.infinity,
                  height: 245 + topPadding,
                  fit: BoxFit.cover,
                  alignment: const Alignment(0.3, 0.0),
                ),
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.8),
                          Colors.black.withValues(alpha: 0.45),
                          Colors.black.withValues(alpha: 0.75),
                        ],
                        stops: const [0.0, 0.45, 1.0],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // 2. SCROLL VIEW (Scrolls all the way to top of screen)
          Positioned.fill(
            child: RefreshIndicator(
              edgeOffset: topPadding,
              onRefresh: _refresh,
              child: SingleChildScrollView(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SafeArea(
                      bottom: false,
                      child: Padding(
                        padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 16.0, bottom: 20.0),
                        child: _buildHeader(context),
                      ),
                    ),
                    
                    // The White Container with rounded corners
                      Container(
                        decoration: const BoxDecoration(
                          color: Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 10,
                              offset: Offset(0, -2),
                            )
                          ]
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 24),
                          _buildCivicFeedHeader(),
                          const SizedBox(height: 16),
                          _buildFilterChips(),
                          const SizedBox(height: 16),
                          
                          // DYNAMIC POSTS FROM DB
                          if (_isLoading)
                            ListView.separated(
                              shrinkWrap: true,
                              padding: EdgeInsets.zero,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: 3,
                              separatorBuilder: (context, index) => const SizedBox(height: 16),
                              itemBuilder: (context, index) => _buildShimmerCard(),
                            )
                          else if (_error != null)
                            Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: Center(
                                child: Column(
                                  children: [
                                    const Icon(Icons.error_outline, color: Colors.red, size: 40),
                                    const SizedBox(height: 12),
                                    Text(
                                      'Failed to load feed.\n$_error',
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.poppins(color: Colors.red, fontSize: 12),
                                    ),
                                    const SizedBox(height: 12),
                                    ElevatedButton(
                                      onPressed: _refresh,
                                      child: const Text('Retry'),
                                    )
                                  ],
                                ),
                              ),
                            )
                          else if (_problems.isEmpty)
                            Padding(
                              padding: const EdgeInsets.all(40.0),
                              child: Center(
                                child: Text(
                                  'No problems reported yet in your area.',
                                  style: GoogleFonts.poppins(color: const Color(0xFF94A3B8)),
                                ),
                              ),
                            )
                          else
                            ListView.separated(
                              shrinkWrap: true,
                              padding: EdgeInsets.zero,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _problems.length + (_hasMore ? 1 : 0),
                              separatorBuilder: (context, index) => const SizedBox(height: 16),
                              itemBuilder: (context, index) {
                                if (index == _problems.length) {
                                  return const Padding(
                                    padding: EdgeInsets.all(20.0),
                                    child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                                  );
                                }
                                return _buildDynamicProblemCard(context, _problems[index]);
                              },
                            ),

                          const SizedBox(height: 80), // Padding for BottomNavBar
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDynamicProblemCard(BuildContext context, dynamic problemRaw) {
    // Parse using our model
    final problem = ProblemStatementModel.fromJson(problemRaw as Map<String, dynamic>);

    final title = problem.title;
    final description = problem.description;
    
    // Address / District formatting
    String location;
    if (problem.location?.address != null && problem.location!.address!.isNotEmpty) {
      location = problem.location!.address!;
    } else {
      final district = problem.location?.district ?? 'Ranchi';
      final state = problem.location?.state ?? 'India';
      location = '$district, $state';
    }
    
    // Extract images safely
    List<String> images = problem.imagesAndMedia.asMap().entries.map((entry) {
      final idx = entry.key;
      final m = entry.value;
      String url = m.url;
      if (url.contains("placeholder-url.com") || url.contains("placehold.co")) {
        url = "https://picsum.photos/600/400?random=${problem.id.hashCode + idx * 19}";
      }
      return url;
    }).toList();

    if (images.isEmpty) {
      images = [
        'https://picsum.photos/600/400?random=${problem.id.hashCode}',
        'https://picsum.photos/600/400?random=${problem.id.hashCode + 11}',
        'https://picsum.photos/600/400?random=${problem.id.hashCode + 23}',
      ];
    }

    // Urgency Chip
    String urgencyText = 'Medium';
    Color urgencyColor = const Color(0xFF92400E);
    Color urgencyBgColor = const Color(0xFFFEF3C7);
    Color urgencyIconColor = const Color(0xFFD97706);

    final urgencyRaw = (problem.supportingInfo?.urgency ?? 'MEDIUM').toUpperCase();
    if (urgencyRaw == 'HIGH' || urgencyRaw == 'CRITICAL') {
      urgencyText = urgencyRaw == 'CRITICAL' ? 'Critical' : 'High';
      urgencyColor = const Color(0xFF991B1B);
      urgencyBgColor = const Color(0xFFFEE2E2);
      urgencyIconColor = const Color(0xFFDC2626);
    } else if (urgencyRaw == 'LOW') {
      urgencyText = 'Low';
      urgencyColor = const Color(0xFF166534);
      urgencyBgColor = const Color(0xFFDCFCE7);
      urgencyIconColor = const Color(0xFF16A34A);
    } else {
      urgencyText = 'Medium';
      urgencyColor = const Color(0xFF92400E);
      urgencyBgColor = const Color(0xFFFEF3C7);
      urgencyIconColor = const Color(0xFFD97706);
    }

    final categoryText = problem.aiAnalysis?.problemClassification ?? 'Infrastructure';
    
    // Dynamic tags row
    List<String> tags = [categoryText];
    if (problem.selfTags?.suggestedDomain != null && problem.selfTags!.suggestedDomain!.isNotEmpty) {
      tags.add(problem.selfTags!.suggestedDomain!);
    }
    if (problem.selfTags?.keywords != null && problem.selfTags!.keywords.isNotEmpty) {
      tags.addAll(problem.selfTags!.keywords);
    } else {
      tags.add('Road Safety');
    }
    tags.add('Public Concern');
    tags = tags.toSet().take(3).toList();

    final reporterName = problem.submittedBy?.name ?? 'Citizen';
    final problemId = problem.id;
    final upvotesCount = problem.upvotesCount;
    
    // Check if current user has upvoted, bookmarked, or following
    final currentUserId = context.read<AuthBloc>().state.user?.id;
    final hasUpvoted = currentUserId != null && problem.upvotedBy.contains(currentUserId);
    final isBookmarked = currentUserId != null && problem.savedBy.contains(currentUserId);
    final isFollowing = currentUserId != null && problem.followers.contains(currentUserId);
    final commentsCount = problem.commentsCount;
    
    final timeStr = context.trTimeAgo(problem.createdAt);

    return FeedPostCard(
      problemId: problemId,
      badgeText: context.tr('civic_concern'),
      urgencyText: context.trUrgency(urgencyText),
      urgencyColor: urgencyColor,
      urgencyBgColor: urgencyBgColor,
      urgencyIconColor: urgencyIconColor,
      timeOrDistance: timeStr,
      title: title,
      description: description,
      images: images,
      location: location,
      latitude: problem.location?.latitude,
      longitude: problem.location?.longitude,
      tags: tags.map((t) => t == 'Public Concern' ? context.tr('public_concern') : context.trCategory(t)).toList(),
      categoryText: context.trCategory(categoryText),
      reporterName: reporterName,
      reporterTime: timeStr,
      reporterAvatar: problem.submittedBy?.avatar,
      actionButtonText: context.tr('view_details'),
      upvotes: upvotesCount,
      hasUpvoted: hasUpvoted,
      isBookmarked: isBookmarked,
      isFollowing: isFollowing,
      comments: commentsCount,
      shares: 0,
      onUpvoteToggled: (hasUpvoted, count) {
        final currentUserId = context.read<AuthBloc>().state.user?.id;
        setState(() {
          problemRaw['upvotesCount'] = count;
          List upvotedBy = List.from(problemRaw['upvotedBy'] ?? []);
          if (hasUpvoted) {
            if (currentUserId != null && !upvotedBy.contains(currentUserId)) {
              upvotedBy.add(currentUserId);
            }
          } else {
            if (currentUserId != null) {
              upvotedBy.remove(currentUserId);
            }
          }
          problemRaw['upvotedBy'] = upvotedBy;
        });
      },
      onCommentAdded: (count) {
        setState(() {
          problemRaw['commentsCount'] = count;
        });
      },
      onActionPressed: () async {
        final result = await context.push('/issue_details', extra: problemRaw);
        if (result is Map<String, dynamic> && mounted) {
          setState(() {
            if (result.containsKey('upvotesCount')) {
              problemRaw['upvotesCount'] = result['upvotesCount'];
            }
            if (result.containsKey('hasUpvoted')) {
              final currentUserId = context.read<AuthBloc>().state.user?.id;
              final bool hasUpvoted = result['hasUpvoted'] == true;
              List upvotedBy = List.from(problemRaw['upvotedBy'] ?? []);
              if (hasUpvoted) {
                if (currentUserId != null && !upvotedBy.contains(currentUserId)) {
                  upvotedBy.add(currentUserId);
                }
              } else {
                if (currentUserId != null) {
                  upvotedBy.remove(currentUserId);
                }
              }
              problemRaw['upvotedBy'] = upvotedBy;
            }
            if (result.containsKey('commentsCount')) {
              problemRaw['commentsCount'] = result['commentsCount'];
            }
          });
        }
      },
    );
  }

  Widget _buildHeader(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final userName = state.user?.name ?? 'Citizen';
        final userDistrict = state.user?.district ?? 'Your Location';
        final userAvatar = state.user?.avatar?.trim();
        final hasAvatar = userAvatar != null && userAvatar.isNotEmpty;
        final hour = DateTime.now().hour;
        final greeting = hour < 12 
            ? context.tr('good_morning') 
            : (hour < 17 ? context.tr('good_afternoon') : context.tr('good_evening'));
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: Colors.white.withValues(alpha: 0.2),
                        backgroundImage: hasAvatar ? NetworkImage(userAvatar) : null,
                        onBackgroundImageError: hasAvatar ? (e, s) {} : null,
                        child: !hasAvatar
                            ? Text(
                                userName.isNotEmpty ? userName[0].toUpperCase() : 'C',
                                style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                              )
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            RichText(
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              text: TextSpan(
                                text: '$greeting,\n${userName.split(" ").first}! ',
                                style: GoogleFonts.poppins(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  shadows: [
                                    Shadow(
                                      color: Colors.black.withValues(alpha: 0.5),
                                      blurRadius: 10,
                                    )
                                  ]
                                ),
                                children: const [
                                  TextSpan(text: '👋', style: TextStyle(fontSize: 22)),
                                ],
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.location_on, size: 14, color: Colors.white),
                                const SizedBox(width: 4),
                                Flexible(
                                  child: Text(
                                    userDistrict,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.poppins(
                                      fontSize: 12, 
                                      color: Colors.white, 
                                      fontWeight: FontWeight.w600,
                                      shadows: [
                                        Shadow(
                                          color: Colors.black.withValues(alpha: 0.5),
                                          blurRadius: 5,
                                        )
                                      ]
                                    ),
                                  ),
                                ),
                                const Icon(Icons.chevron_right, size: 16, color: Colors.white),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const LanguageSelectorButton(isDark: true, compact: true),
                    const SizedBox(width: 8),
                    ValueListenableBuilder<int>(
                      valueListenable: NotificationRepository.unreadCountNotifier,
                      builder: (context, unreadCount, _) {
                        return InkWell(
                          onTap: () async {
                            await context.push('/notifications');
                            _fetchUnreadNotificationsCount();
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.notifications_outlined, size: 24, color: Colors.white),
                              ),
                              if (unreadCount > 0)
                                Positioned(
                                  right: -2,
                                  top: -2,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFEF4444),
                                      shape: BoxShape.circle,
                                    ),
                                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                    child: Center(
                                      child: Text(
                                        unreadCount > 9 ? '9+' : '$unreadCount',
                                        style: GoogleFonts.poppins(
                                          color: Colors.white,
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                context.tr('india_motto'),
                maxLines: 1,
                softWrap: false,
                style: GoogleFonts.caveat(
                  fontSize: 22,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  shadows: [
                    Shadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 5,
                    )
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }


  Widget _buildCivicFeedHeader() {
    return Row(
      children: [
        Text(context.tr('civic_feed'), style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
        const SizedBox(width: 6),
        const Icon(Icons.eco, color: AppColors.primary, size: 18),
      ],
    );
  }

  Widget _buildFilterChips() {
    final filters = [
      {'key': 'All', 'label': context.tr('filter_all')},
      {'key': 'Nearby', 'label': context.tr('filter_nearby')},
      {'key': 'Trending', 'label': context.tr('filter_trending')},
      {'key': 'Needs Support', 'label': context.tr('filter_needs_support')},
      {'key': 'Solved', 'label': context.tr('filter_solved')},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          ...filters.map((f) => Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: _buildChip(f['key']!, f['label']!),
          )),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFE2E8F0)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.tune, size: 16, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  Widget _buildChip(String key, String label) {
    final isSelected = _selectedFilter == key;
    return GestureDetector(
      onTap: () => _onFilterSelected(key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0)),
        ),
        child: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildShimmerCard() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        height: 350,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Container(width: 80, height: 24, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))),
                  const Spacer(),
                  Container(width: 100, height: 16, color: Colors.white),
                ],
              ),
            ),
            Container(height: 200, color: Colors.white),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: double.infinity, height: 20, color: Colors.white),
                  const SizedBox(height: 8),
                  Container(width: 150, height: 14, color: Colors.white),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/core/localization/app_localizations.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:sih_2026/features/reports/data/repositories/problem_repository.dart';
import 'package:sih_2026/features/reports/data/models/problem_statement_model.dart';

class ActivityPage extends StatefulWidget {
  const ActivityPage({super.key});

  @override
  State<ActivityPage> createState() => _ActivityPageState();
}

class _ActivityPageState extends State<ActivityPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ProblemRepository _repository = ProblemRepository();
  
  List<ProblemStatementModel> _myProblems = [];
  List<ProblemStatementModel> _supportedProblems = [];
  bool _isLoading = true;
  String _selectedStatusFilter = 'All';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadActivityData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadActivityData() async {
    final currentUserId = context.read<AuthBloc>().state.user?.id;
    setState(() => _isLoading = true);
    try {
      // 1. Fetch user's submitted problems
      final myResponse = await _repository.fetchProblems(my: true, limit: 50);
      final myRawList = myResponse['data'] as List<dynamic>? ?? [];
      final myModels = myRawList
          .map((e) => ProblemStatementModel.fromJson(e as Map<String, dynamic>))
          .toList();

      // 2. Fetch all problems to filter user's upvoted/supported issues
      final allResponse = await _repository.fetchProblems(limit: 50);
      final allRawList = allResponse['data'] as List<dynamic>? ?? [];

      final supportedModels = allRawList
          .map((e) => ProblemStatementModel.fromJson(e as Map<String, dynamic>))
          .where((p) => currentUserId != null && p.upvotedBy.contains(currentUserId))
          .toList();

      if (mounted) {
        setState(() {
          _myProblems = myModels;
          _supportedProblems = supportedModels;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  int get _acceptedCount => _myProblems.where((p) => p.acceptedByUniversityName != null || ['ACCEPTED', 'IN_PROGRESS', 'PROPOSAL', 'PROTOTYPE', 'VALIDATED', 'DEPLOYED'].contains(p.status)).length;
  int get _totalUpvotesReceived => _myProblems.fold(0, (sum, p) => sum + p.upvotesCount);

  List<ProblemStatementModel> get _filteredMyProblems {
    if (_selectedStatusFilter == 'All') return _myProblems;
    if (_selectedStatusFilter == 'Classified') {
      return _myProblems.where((p) => p.status == 'CLASSIFIED').toList();
    }
    if (_selectedStatusFilter == 'Accepted') {
      return _myProblems.where((p) => p.status == 'ACCEPTED' || p.acceptedByUniversityName != null).toList();
    }
    if (_selectedStatusFilter == 'In Progress') {
      return _myProblems.where((p) => ['IN_PROGRESS', 'PROTOTYPE', 'VALIDATED'].contains(p.status)).toList();
    }
    if (_selectedStatusFilter == 'Deployed') {
      return _myProblems.where((p) => p.status == 'DEPLOYED').toList();
    }
    return _myProblems;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          context.tr('activity_and_tracking'),
          style: GoogleFonts.poppins(
            color: const Color(0xFF1E293B),
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF64748B)),
            onPressed: _loadActivityData,
            tooltip: context.tr('refresh_tooltip'),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.primary,
              indicatorWeight: 3,
              labelColor: AppColors.primary,
              unselectedLabelColor: const Color(0xFF64748B),
              labelPadding: const EdgeInsets.symmetric(horizontal: 4),
              labelStyle: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.bold),
              unselectedLabelStyle: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w500),
              tabs: [
                Tab(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      '${context.tr('my_issues_tab')} (${_myProblems.length})',
                      maxLines: 1,
                    ),
                  ),
                ),
                Tab(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      context.tr('live_updates_tab'),
                      maxLines: 1,
                    ),
                  ),
                ),
                Tab(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      '${context.tr('supported_tab')} (${_supportedProblems.length})',
                      maxLines: 1,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: _loadActivityData,
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildMyIssuesTab(context),
                  _buildLiveUpdatesTab(context),
                  _buildSupportedTab(context),
                ],
              ),
            ),
    );
  }

  // 1. My Issues Tab
  Widget _buildMyIssuesTab(BuildContext context) {
    return CustomScrollView(
      slivers: [
        // Summary Stat Row
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _buildStatBadge(context.tr('stat_reported'), '${_myProblems.length}', const Color(0xFFEFF6FF), const Color(0xFF2563EB), Icons.assignment_outlined),
                const SizedBox(width: 8),
                _buildStatBadge(context.tr('stat_uni_adopted'), '$_acceptedCount', const Color(0xFFF3E8FF), const Color(0xFF7E22CE), Icons.school_outlined),
                const SizedBox(width: 8),
                _buildStatBadge(context.tr('stat_upvotes'), '$_totalUpvotesReceived', const Color(0xFFF0FDF4), const Color(0xFF16A34A), Icons.arrow_upward_rounded),
              ],
            ),
          ),
        ),

        // Status Filter Chips
        SliverToBoxAdapter(
          child: SizedBox(
            height: 38,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _buildFilterChip('All', context.tr('filter_all')),
                _buildFilterChip('Classified', context.tr('filter_classified')),
                _buildFilterChip('Accepted', context.tr('filter_accepted')),
                _buildFilterChip('In Progress', context.tr('filter_in_progress')),
                _buildFilterChip('Deployed', context.tr('filter_deployed')),
              ],
            ),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 12)),

        // Problems List or Empty
        _filteredMyProblems.isEmpty
            ? SliverFillRemaining(
                hasScrollBody: false,
                child: _buildEmptyState(
                  title: context.tr('no_reports_found'),
                  subtitle: _selectedStatusFilter == 'All'
                      ? context.tr('no_reports_sub_all')
                      : context.tr('no_reports_sub_filter'),
                  buttonText: context.tr('report_issue'),
                  onTap: () => context.push('/report_issue'),
                ),
              )
            : SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final problem = _filteredMyProblems[index];
                      return _buildProblemTrackingCard(context, problem);
                    },
                    childCount: _filteredMyProblems.length,
                  ),
                ),
              ),
      ],
    );
  }

  // 2. Live Updates Tab
  Widget _buildLiveUpdatesTab(BuildContext context) {
    final events = _generateLiveEvents(context);
    if (events.isEmpty) {
      return _buildEmptyState(
        title: context.tr('no_live_updates_title'),
        subtitle: context.tr('no_live_updates_sub'),
        buttonText: context.tr('report_issue'),
        onTap: () => context.push('/report_issue'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: events.length,
      itemBuilder: (context, index) {
        final ev = events[index];
        return _buildTimelineEventCard(ev, isLast: index == events.length - 1);
      },
    );
  }

  // 3. Supported Tab
  Widget _buildSupportedTab(BuildContext context) {
    if (_supportedProblems.isEmpty) {
      return _buildEmptyState(
        title: context.tr('no_supported_title'),
        subtitle: context.tr('no_supported_sub'),
        buttonText: context.tr('explore_issues_btn'),
        onTap: () => context.go('/home'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _supportedProblems.length,
      itemBuilder: (context, index) {
        final problem = _supportedProblems[index];
        return _buildProblemTrackingCard(context, problem);
      },
    );
  }

  Widget _buildStatBadge(String label, String count, Color bgColor, Color textColor, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
              child: Icon(icon, color: textColor, size: 15),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      count,
                      style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                    ),
                  ),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      label,
                      style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF64748B)),
                      maxLines: 1,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label) {
    final isSelected = _selectedStatusFilter == filterKey;
    return GestureDetector(
      onTap: () => setState(() => _selectedStatusFilter = filterKey),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0)),
        ),
        child: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildProblemTrackingCard(BuildContext context, ProblemStatementModel problem) {
    final status = problem.status.toUpperCase();
    final category = context.trCategory(problem.aiAnalysis?.problemClassification).toUpperCase();
    final district = problem.location?.district ?? context.tr('local_area');
    final state = problem.location?.state ?? '';
    final address = '$district${state.isNotEmpty ? ', $state' : ''}';
    final acceptedBy = problem.acceptedByUniversityName;

    Color statusColor = AppColors.primary;
    Color statusBg = const Color(0xFFF0FDF4);
    String statusLabel = context.trStatus(problem.status);

    if (status == 'ACCEPTED' || acceptedBy != null) {
      statusColor = const Color(0xFF1D4ED8);
      statusBg = const Color(0xFFEFF6FF);
      statusLabel = context.tr('status_accepted_by_uni');
    } else if (status == 'IN_PROGRESS' || ['PROPOSAL', 'PROTOTYPE', 'VALIDATED'].contains(status)) {
      statusColor = const Color(0xFF6D28D9);
      statusBg = const Color(0xFFF5F3FF);
      statusLabel = context.tr('status_in_progress_badge');
    } else if (status == 'DEPLOYED') {
      statusColor = const Color(0xFF15803D);
      statusBg = const Color(0xFFDCFCE7);
      statusLabel = context.tr('status_deployed_badge');
    } else if (status == 'DUPLICATE') {
      statusColor = const Color(0xFFD97706);
      statusBg = const Color(0xFFFEF3C7);
      statusLabel = context.tr('status_duplicate_linked');
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [BoxShadow(color: Color(0x04000000), blurRadius: 6, offset: Offset(0, 2))],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            context.push('/issue_details', extra: {
              '_id': problem.id,
              'title': problem.title,
              'description': problem.description,
              'location': {
                'address': problem.location?.address,
                'district': problem.location?.district,
                'state': problem.location?.state,
                'coordinates': {
                  'latitude': problem.location?.latitude,
                  'longitude': problem.location?.longitude,
                }
              },
              'imagesAndMedia': problem.imagesAndMedia.map((m) => {'url': m.url, 'mediaType': m.mediaType, 'name': m.name}).toList(),
              'aiAnalysis': {
                'summary': problem.aiAnalysis?.summary,
                'key_points': problem.aiAnalysis?.keyPoints,
                'problem_classification': problem.aiAnalysis?.problemClassification,
                'severity': problem.aiAnalysis?.severity,
                'suggested_solution': problem.aiAnalysis?.suggestedSolution,
                'required_expertise': problem.aiAnalysis?.requiredExpertise,
              },
              'status': problem.status,
              'acceptedByUniversityName': problem.acceptedByUniversityName,
              'collegeSuggestions': problem.collegeSuggestions.map((c) => {
                'college_name': c.collegeName,
                'district': c.district,
                'domain': c.domain,
                'match_score': c.matchScore,
                'faculty_expertise': c.facultyExpertise,
              }).toList(),
              'isDuplicate': problem.isDuplicate,
              'masterTicketId': problem.masterTicketId,
              'duplicateOf': problem.duplicateOf != null
                  ? {
                      'problemId': problem.duplicateOf?.problemId,
                      'distanceKm': problem.duplicateOf?.distanceKm,
                      'similarityScore': problem.duplicateOf?.similarityScore,
                    }
                  : null,
              'upvotesCount': problem.upvotesCount,
              'commentsCount': problem.commentsCount,
              'submittedBy': {'name': problem.submittedBy?.name ?? context.tr('role_citizen')},
              'createdAt': problem.createdAt?.toIso8601String(),
            });
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Category & Status Badge
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        category,
                        style: GoogleFonts.poppins(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusBg,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                      ),
                      child: Text(
                        statusLabel,
                        style: GoogleFonts.poppins(fontSize: 9, fontWeight: FontWeight.bold, color: statusColor),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Title
                Text(
                  problem.title,
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),

                // AI Summary / Description
                Text(
                  problem.aiAnalysis?.summary ?? problem.description,
                  style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B)),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),

                // Accepted by University Pill (if any)
                if (acceptedBy != null && acceptedBy.isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.school, size: 14, color: Color(0xFF2563EB)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '${context.tr('adopted_by_uni')} $acceptedBy',
                            style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF1E40AF)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],

                // Footer Row: Location & Metrics
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF94A3B8)),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        address,
                        style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF94A3B8)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.arrow_upward_rounded, size: 14, color: Color(0xFF64748B)),
                        const SizedBox(width: 2),
                        Text('${problem.upvotesCount}', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
                        const SizedBox(width: 10),
                        const Icon(Icons.chat_bubble_outline_rounded, size: 13, color: Color(0xFF64748B)),
                        const SizedBox(width: 3),
                        Text('${problem.commentsCount}', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _generateLiveEvents(BuildContext context) {
    List<Map<String, dynamic>> events = [];
    for (var problem in _myProblems) {
      final title = problem.title.length > 35 ? '${problem.title.substring(0, 32)}...' : problem.title;
      final time = context.formatTimeAgo(problem.createdAt);

      // Event 1: Accepted by University
      if (problem.acceptedByUniversityName != null && problem.acceptedByUniversityName!.isNotEmpty) {
        events.add({
          'icon': Icons.school_rounded,
          'iconColor': const Color(0xFF2563EB),
          'iconBg': const Color(0xFFEFF6FF),
          'title': '${problem.acceptedByUniversityName} ${context.tr('event_accepted_title')}',
          'subtitle': '${context.tr('event_accepted_sub')} "$title".',
          'time': time,
          'problem': problem,
        });
      }

      // Event 2: AI Classification & Match
      if (problem.status == 'CLASSIFIED' || problem.collegeSuggestions.isNotEmpty) {
        final domainName = context.trCategory(problem.aiAnalysis?.problemClassification);
        events.add({
          'icon': Icons.auto_awesome,
          'iconColor': AppColors.primary,
          'iconBg': const Color(0xFFF0FDF4),
          'title': '${context.tr('event_classified_title')} "$title"',
          'subtitle': '${context.tr('event_classified_sub_domain')}: $domainName. ${context.tr('event_classified_sub_matched')} ${problem.collegeSuggestions.length} ${context.tr('event_classified_sub_institutions')}',
          'time': time,
          'problem': problem,
        });
      }

      // Event 3: Upvote milestone
      if (problem.upvotesCount > 0) {
        events.add({
          'icon': Icons.thumb_up_alt_outlined,
          'iconColor': const Color(0xFFD97706),
          'iconBg': const Color(0xFFFEF3C7),
          'title': '${problem.upvotesCount} ${context.tr('event_upvotes_title')}',
          'subtitle': '${context.tr('event_upvotes_sub')} "$title".',
          'time': time,
          'problem': problem,
        });
      }
    }
    return events;
  }

  Widget _buildTimelineEventCard(Map<String, dynamic> ev, {bool isLast = false}) {
    final problem = ev['problem'] as ProblemStatementModel;
    return GestureDetector(
      onTap: () {
        context.push('/issue_details', extra: {
          '_id': problem.id,
          'title': problem.title,
          'description': problem.description,
          'location': {
            'address': problem.location?.address,
            'district': problem.location?.district,
            'state': problem.location?.state,
            'coordinates': {
              'latitude': problem.location?.latitude,
              'longitude': problem.location?.longitude,
            }
          },
          'imagesAndMedia': problem.imagesAndMedia.map((m) => {'url': m.url, 'mediaType': m.mediaType, 'name': m.name}).toList(),
          'aiAnalysis': {
            'summary': problem.aiAnalysis?.summary,
            'key_points': problem.aiAnalysis?.keyPoints,
            'problem_classification': problem.aiAnalysis?.problemClassification,
            'severity': problem.aiAnalysis?.severity,
            'suggested_solution': problem.aiAnalysis?.suggestedSolution,
            'required_expertise': problem.aiAnalysis?.requiredExpertise,
          },
          'status': problem.status,
          'acceptedByUniversityName': problem.acceptedByUniversityName,
          'collegeSuggestions': problem.collegeSuggestions.map((c) => {
            'college_name': c.collegeName,
            'district': c.district,
            'domain': c.domain,
            'match_score': c.matchScore,
            'faculty_expertise': c.facultyExpertise,
          }).toList(),
          'isDuplicate': problem.isDuplicate,
          'masterTicketId': problem.masterTicketId,
          'duplicateOf': problem.duplicateOf != null
              ? {
                  'problemId': problem.duplicateOf?.problemId,
                  'distanceKm': problem.duplicateOf?.distanceKm,
                  'similarityScore': problem.duplicateOf?.similarityScore,
                }
              : null,
          'upvotesCount': problem.upvotesCount,
          'commentsCount': problem.commentsCount,
          'submittedBy': {'name': problem.submittedBy?.name ?? context.tr('role_citizen')},
          'createdAt': problem.createdAt?.toIso8601String(),
        });
      },
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: ev['iconBg'] as Color,
                  shape: BoxShape.circle,
                  border: Border.all(color: (ev['iconColor'] as Color).withValues(alpha: 0.3)),
                ),
                child: Icon(ev['icon'] as IconData, color: ev['iconColor'] as Color, size: 18),
              ),
              if (!isLast)
                Container(
                  width: 2,
                  height: 48,
                  color: const Color(0xFFE2E8F0),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 2, bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          ev['title'] as String,
                          style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        ev['time'] as String,
                        style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    ev['subtitle'] as String,
                    style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B), height: 1.3),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState({
    required String title,
    required String subtitle,
    required String buttonText,
    required VoidCallback onTap,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.assignment_turned_in_outlined, color: AppColors.primary, size: 40),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B), height: 1.4),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: onTap,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(
                buttonText,
                style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

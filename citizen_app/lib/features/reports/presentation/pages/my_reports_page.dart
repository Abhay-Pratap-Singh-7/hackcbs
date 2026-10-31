import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/features/reports/data/repositories/problem_repository.dart';
import 'package:sih_2026/features/reports/data/models/problem_statement_model.dart';
import 'package:sih_2026/features/home/presentation/widgets/feed_post_card.dart';

class MyReportsPage extends StatefulWidget {
  const MyReportsPage({super.key});

  @override
  State<MyReportsPage> createState() => _MyReportsPageState();
}

class _MyReportsPageState extends State<MyReportsPage> {
  final ProblemRepository _repository = ProblemRepository();
  List<dynamic> _problems = [];
  bool _isLoading = true;
  String _selectedStatus = 'All';

  @override
  void initState() {
    super.initState();
    _fetchMyReports();
  }

  Future<void> _fetchMyReports() async {
    setState(() => _isLoading = true);
    try {
      String? statusFilter;
      if (_selectedStatus == 'In Progress') statusFilter = 'IN_PROGRESS';
      if (_selectedStatus == 'Resolved') statusFilter = 'RESOLVED';
      if (_selectedStatus == 'Rejected') statusFilter = 'REJECTED';

      final response = await _repository.fetchProblems(
        my: true,
        limit: 50,
        status: statusFilter,
      );
      
      final dataList = response['data'] as List<dynamic>;
      setState(() {
        _problems = dataList;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
        setState(() => _isLoading = false);
      }
    }
  }

  void _onTabSelected(String status) {
    setState(() {
      _selectedStatus = status;
    });
    _fetchMyReports();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Color(0xFF1E293B), size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'My Reports',
          style: GoogleFonts.poppins(
            color: const Color(0xFF1E293B),
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildTab('All', _selectedStatus == 'All'),
                  const SizedBox(width: 8),
                  _buildTab('In Progress', _selectedStatus == 'In Progress'),
                  const SizedBox(width: 8),
                  _buildTab('Resolved', _selectedStatus == 'Resolved'),
                  const SizedBox(width: 8),
                  _buildTab('Rejected', _selectedStatus == 'Rejected'),
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _problems.isEmpty
                    ? Center(
                        child: Text(
                          'No reports found.',
                          style: GoogleFonts.poppins(color: const Color(0xFF64748B)),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _problems.length,
                        itemBuilder: (context, index) {
                          return _buildDynamicProblemCard(context, _problems[index]);
                        },
                      ),
          )
        ],
      ),
    );
  }

  Widget _buildTab(String label, bool isSelected) {
    return GestureDetector(
      onTap: () => _onTabSelected(label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0)),
        ),
        child: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            color: isSelected ? AppColors.primary : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildDynamicProblemCard(BuildContext context, dynamic problemRaw) {
    final problem = ProblemStatementModel.fromJson(problemRaw as Map<String, dynamic>);
    
    final title = problem.title;
    final description = problem.description;
    final district = problem.location?.district ?? 'Unknown';
    final state = problem.location?.state ?? 'Location';
    final location = '$district, $state';
    
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

    // Urgency
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
    final commentsCount = problem.commentsCount;
    
    String timeStr = 'Recently';
    if (problem.createdAt != null) {
      timeStr = problem.createdAt.toString().split(' ').first;
    }

    return FeedPostCard(
      problemId: problemId,
      badgeText: 'Civic Concern',
      urgencyText: urgencyText,
      urgencyColor: urgencyColor,
      urgencyBgColor: urgencyBgColor,
      urgencyIconColor: urgencyIconColor,
      timeOrDistance: timeStr,
      title: title,
      description: description,
      images: images,
      location: location,
      tags: tags,
      categoryText: categoryText,
      reporterName: reporterName,
      reporterTime: timeStr,
      actionButtonText: 'View Details',
      upvotes: upvotesCount,
      hasUpvoted: false,
      comments: commentsCount,
      shares: 0,
      onActionPressed: () {
        context.push('/issue_details', extra: problemRaw);
      },
    );
  }
}

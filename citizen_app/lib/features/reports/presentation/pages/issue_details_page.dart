import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/localization/app_localizations.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/core/utils/share_helper.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:sih_2026/features/reports/data/repositories/problem_repository.dart';
import 'package:sih_2026/features/reports/presentation/widgets/comments_bottom_sheet.dart';
import 'package:sih_2026/features/reports/data/models/problem_statement_model.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class IssueDetailsPage extends StatefulWidget {
  final Map<String, dynamic>? args;
  final String? problemId;
  const IssueDetailsPage({super.key, this.args, this.problemId});

  @override
  State<IssueDetailsPage> createState() => _IssueDetailsPageState();
}

class _IssueDetailsPageState extends State<IssueDetailsPage> {
  int _currentImageIndex = 0;
  ProblemStatementModel _problem = ProblemStatementModel(
    id: '',
    title: '',
    description: '',
    status: 'SUBMITTED',
  );
  List<String> _images = [];
  bool _hasUpvoted = false;
  int _upvotesCount = 0;
  int _commentsCount = 0;
  bool _isUpvoting = false;
  bool _isLoading = false;
  String? _errorMessage;
  final ProblemRepository _repository = ProblemRepository();

  @override
  void initState() {
    super.initState();
    if (widget.args != null && widget.args!.isNotEmpty) {
      final model = ProblemStatementModel.fromJson(widget.args!);
      _initProblem(model);
      if (model.id.isNotEmpty) {
        _fetchProblemDetailsSilent(model.id);
      }
    } else if (widget.problemId != null && widget.problemId!.isNotEmpty) {
      _fetchProblemDetails(widget.problemId!);
    } else {
      _errorMessage = 'no_issue_details';
    }
  }

  void _initProblem(ProblemStatementModel model) {
    _problem = model;
    _images = _extractImages(model);
    _upvotesCount = model.upvotesCount;
    _commentsCount = model.commentsCount;
    final currentUserId = context.read<AuthBloc>().state.user?.id;
    if (currentUserId != null) {
      _hasUpvoted = model.upvotedBy.contains(currentUserId);
    }
  }

  Future<void> _fetchProblemDetails(String id) async {
    setState(() => _isLoading = true);
    try {
      final res = await _repository.fetchProblemById(id);
      if (res['data'] != null && mounted) {
        final model = ProblemStatementModel.fromJson(res['data'] as Map<String, dynamic>);
        setState(() {
          _initProblem(model);
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'issue_not_found';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = '$e';
        });
      }
    }
  }

  Future<void> _fetchProblemDetailsSilent(String id) async {
    try {
      final res = await _repository.fetchProblemById(id);
      if (res['data'] != null && mounted) {
        final model = ProblemStatementModel.fromJson(res['data'] as Map<String, dynamic>);
        final currentUserId = context.read<AuthBloc>().state.user?.id;
        setState(() {
          _problem = model;
          _images = _extractImages(model);
          _upvotesCount = model.upvotesCount;
          _commentsCount = model.commentsCount;
          if (currentUserId != null) {
            _hasUpvoted = model.upvotedBy.contains(currentUserId);
          }
        });
      }
    } catch (_) {
      // Harmless background fetch error
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final currentUserId = context.read<AuthBloc>().state.user?.id;
    final upvotedByList = _problem.upvotedBy;
    _hasUpvoted = currentUserId != null && upvotedByList.contains(currentUserId);
  }

  void _popWithResult() {
    if (context.canPop()) {
      context.pop({
        'hasUpvoted': _hasUpvoted,
        'upvotesCount': _upvotesCount,
        'commentsCount': _commentsCount,
      });
    } else {
      context.go('/home');
    }
  }

  Future<void> _toggleUpvote() async {
    final problemId = _problem.id;
    if (problemId.isEmpty || _isUpvoting) return;

    final wasUpvoted = _hasUpvoted;
    final previousCount = _upvotesCount;

    setState(() {
      _isUpvoting = true;
      _hasUpvoted = !wasUpvoted;
      _upvotesCount += _hasUpvoted ? 1 : -1;
    });

    try {
      final response = await _repository.upvoteProblem(problemId);
      if (response['data'] != null) {
        setState(() {
          _hasUpvoted = response['data']['hasUpvoted'] == true;
          _upvotesCount = (response['data']['upvotesCount'] as num?)?.toInt() ?? _upvotesCount;
          
          final currentUserId = context.read<AuthBloc>().state.user?.id;
          if (currentUserId != null) {
            final list = List<String>.from(_problem.upvotedBy);
            if (_hasUpvoted && !list.contains(currentUserId)) {
              list.add(currentUserId);
            } else if (!_hasUpvoted) {
              list.remove(currentUserId);
            }
            _problem = _problem.copyWith(upvotedBy: list, upvotesCount: _upvotesCount);
          }
        });
      }
    } catch (e) {
      setState(() {
        _hasUpvoted = wasUpvoted;
        _upvotesCount = previousCount;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _isUpvoting = false);
    }
  }

  List<String> _extractImages(ProblemStatementModel problem) {
    if (problem.imagesAndMedia.isEmpty) return ['https://picsum.photos/600/350?random=${problem.id.hashCode}'];
    List<String> images = [];
    for (var media in problem.imagesAndMedia) {
      if (media.url.isNotEmpty) {
        String url = media.url;
        if (url.contains("placeholder-url.com") || url.contains("placehold.co")) {
          url = "https://picsum.photos/600/350?random=${images.length + problem.id.hashCode}";
        }
        images.add(url);
      }
    }
    if (images.isEmpty) {
      images = ['https://picsum.photos/600/350?random=${problem.id.hashCode}'];
    }
    return images;
  }

  Future<void> _navigateToMasterProblem() async {
    String? masterId = _problem.masterTicketId ?? _problem.duplicateOf?.problemId;
    if (masterId != null && masterId.isNotEmpty) {
      context.push('/issue/$masterId');
      return;
    }

    if (_problem.id.isNotEmpty) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
      try {
        final res = await _repository.fetchProblemById(_problem.id);
        if (mounted) Navigator.of(context, rootNavigator: true).pop();
        if (res['data'] != null && mounted) {
          final fullModel = ProblemStatementModel.fromJson(res['data'] as Map<String, dynamic>);
          setState(() => _initProblem(fullModel));
          final fetchedMasterId = fullModel.masterTicketId ?? fullModel.duplicateOf?.problemId;
          if (fetchedMasterId != null && fetchedMasterId.isNotEmpty && mounted) {
            context.push('/issue/$fetchedMasterId');
            return;
          }
        }
      } catch (_) {
        if (mounted) Navigator.of(context, rootNavigator: true).pop();
      }
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr('master_problem_unavailable'),
            style: GoogleFonts.poppins(fontSize: 12),
          ),
          backgroundColor: const Color(0xFFD97706),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
            onPressed: () => context.pop(),
          ),
          title: Text(
            context.tr('loading_issue'),
            style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (_errorMessage != null || (_problem.id.isEmpty && widget.problemId == null && (widget.args == null || widget.args!.isEmpty))) {
      final errorDisplay = _errorMessage == 'no_issue_details'
          ? context.tr('no_issue_details')
          : (_errorMessage == 'issue_not_found'
              ? context.tr('issue_not_found')
              : (_errorMessage != null ? '${context.tr('failed_to_load_issue')}$_errorMessage' : context.tr('issue_not_found')));

      return Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  errorDisplay,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.go('/home'),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                child: Text(context.tr('back_to_home'), style: const TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }

    final title = _problem.title.isNotEmpty ? _problem.title : context.tr('civic_issue_fallback');
    final description = _problem.description.isNotEmpty ? _problem.description : context.tr('no_description_provided');
    
    final district = _problem.location?.district?.isNotEmpty == true ? _problem.location!.district! : 'Ranchi';
    final state = _problem.location?.state?.isNotEmpty == true ? _problem.location!.state! : 'India';
    final address = _problem.location?.address?.isNotEmpty == true ? _problem.location!.address! : '$district, $state';
    
    final status = _problem.status.toUpperCase();
    final isDuplicate = _problem.isDuplicate;

    final aiAnalysis = _problem.aiAnalysis;
    final rawCategory = aiAnalysis?.problemClassification ?? _problem.selfTags?.suggestedDomain ?? 'CIVIC CONCERN';
    final categoryText = context.trCategory(rawCategory).toUpperCase();
    final aiSummary = aiAnalysis?.summary ?? description;
    final keyPoints = aiAnalysis?.keyPoints;
    final requiredExpertise = aiAnalysis?.requiredExpertise ?? [];
    final rawSeverity = aiAnalysis?.severity ?? _problem.supportingInfo?.urgency ?? 'MEDIUM';
    final severity = context.trUrgency(rawSeverity).toUpperCase();

    // Severity Colors
    Color severityColor = const Color(0xFFD97706);
    Color severityBg = const Color(0xFFFEF3C7);
    final sevUpper = rawSeverity.toUpperCase();
    if (sevUpper == 'HIGH' || sevUpper == 'CRITICAL') {
      severityColor = const Color(0xFFDC2626);
      severityBg = const Color(0xFFFEE2E2);
    } else if (sevUpper == 'LOW') {
      severityColor = const Color(0xFF16A34A);
      severityBg = const Color(0xFFDCFCE7);
    }

    // Status Colors & Badge text
    Color statusColor = AppColors.primary;
    Color statusBg = const Color(0xFFF0FDF4);
    String statusDisplay = context.trStatus(status);

    if (status == 'ACCEPTED') {
      statusColor = const Color(0xFF1D4ED8);
      statusBg = const Color(0xFFEFF6FF);
      statusDisplay = context.tr('status_accepted_by_university');
    } else if (status == 'IN_PROGRESS') {
      statusColor = const Color(0xFF6D28D9);
      statusBg = const Color(0xFFF5F3FF);
      statusDisplay = context.tr('status_in_progress');
    } else if (status == 'PROTOTYPE' || status == 'VALIDATED') {
      statusColor = const Color(0xFF7E22CE);
      statusBg = const Color(0xFFFAF5FF);
      statusDisplay = status == 'VALIDATED' ? context.tr('status_field_validated') : context.tr('status_prototype_ready');
    } else if (status == 'DEPLOYED') {
      statusColor = const Color(0xFF15803D);
      statusBg = const Color(0xFFDCFCE7);
      statusDisplay = context.tr('status_deployed');
    } else if (status == 'DUPLICATE') {
      statusColor = const Color(0xFFD97706);
      statusBg = const Color(0xFFFEF3C7);
      statusDisplay = context.tr('status_duplicate');
    } else if (status == 'SUBMITTED') {
      statusColor = const Color(0xFF64748B);
      statusBg = const Color(0xFFF1F5F9);
      statusDisplay = context.tr('status_submitted');
    }

    final collegeSuggestions = _problem.collegeSuggestions;
    final acceptedUniversity = _problem.acceptedByUniversityName;
    final reporterName = _problem.submittedBy?.name.isNotEmpty == true ? _problem.submittedBy!.name : context.tr('citizen_user');
    
    String dateStr = '2026-09-04';
    if (_problem.createdAt != null) {
      dateStr = _problem.createdAt.toString().split(' ').first;
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _popWithResult();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF1E293B), size: 18),
            onPressed: _popWithResult,
          ),
          title: Text(
            context.tr('issue_details_title'),
            style: GoogleFonts.poppins(
              color: const Color(0xFF1E293B),
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          centerTitle: true,
          actions: [
            IconButton(
              icon: const Icon(Icons.share_outlined, color: Color(0xFF1E293B), size: 20),
              tooltip: context.tr('share'),
              onPressed: () {
                ShareHelper.showShareModal(
                  context: context,
                  problemId: _problem.id,
                  title: title,
                  location: _problem.location?.address ?? '',
                  images: _images,
                );
              },
            ),
          ],
        ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Media Carousel
            SizedBox(
              height: 250,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  PageView.builder(
                    itemCount: _images.length,
                    onPageChanged: (index) {
                      setState(() {
                        _currentImageIndex = index;
                      });
                    },
                    itemBuilder: (context, index) {
                      return Image.network(
                        _images[index],
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: const Color(0xFFE2E8F0),
                          child: const Icon(Icons.image_not_supported_outlined, color: Color(0xFF94A3B8), size: 36),
                        ),
                      );
                    },
                  ),

                  // Civic Badge & Urgency Pill Overlay
                  Positioned(
                    top: 16,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.eco_rounded, color: Colors.white, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            categoryText,
                            style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                  ),

                  Positioned(
                    top: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: severityBg,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: severityColor.withValues(alpha: 0.3)),
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
                      ),
                      child: Text(
                        severity,
                        style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: severityColor),
                      ),
                    ),
                  ),

                  // Carousel Dots
                  if (_images.length > 1)
                    Positioned(
                      bottom: 12,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _images.length,
                          (index) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: _currentImageIndex == index ? 20 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: _currentImageIndex == index ? AppColors.primary : Colors.white.withValues(alpha: 0.7),
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // 2. Issue Title & Details Content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    softWrap: true,
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1E293B),
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF64748B)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(address, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                      ),
                      Text(dateStr, style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF94A3B8))),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Reporter & Live DB Status
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                          backgroundImage: _problem.submittedBy?.avatar != null
                              ? NetworkImage(_problem.submittedBy!.avatar!)
                              : null,
                          child: _problem.submittedBy?.avatar == null
                              ? Text(
                                  reporterName.isNotEmpty ? reporterName[0].toUpperCase() : 'C',
                                  style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 13),
                                )
                              : null,
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(context.tr('reported_by'), style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF94A3B8))),
                            Text(reporterName, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                          ],
                        ),
                        const Spacer(),
                        Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: (status == 'DUPLICATE' || isDuplicate) ? _navigateToMasterProblem : null,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: statusBg,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    statusDisplay,
                                    style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                                  ),
                                  if (status == 'DUPLICATE' || isDuplicate) ...[
                                    const SizedBox(width: 4),
                                    Icon(
                                      Icons.open_in_new_rounded,
                                      size: 11,
                                      color: statusColor,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Official University Acceptance Banner (if accepted)
                  if (acceptedUniversity != null && acceptedUniversity.isNotEmpty) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFEFF6FF), Color(0xFFDBEAFE)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF93C5FD)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2563EB),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.verified_rounded, color: Colors.white, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  context.tr('adopted_for_research'),
                                  style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF1E40AF)),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  acceptedUniversity,
                                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  context.tr('adopted_desc'),
                                  style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF3B82F6)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // 3. AI Ground Reality Analysis Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 8, offset: Offset(0, 3))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.auto_awesome, color: AppColors.primary, size: 18),
                            const SizedBox(width: 8),
                            Text(context.tr('ai_problem_analysis'), style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(aiSummary, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF475569), height: 1.4)),
                        if (keyPoints != null && keyPoints.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(context.tr('key_focus'), style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
                          Text(keyPoints, style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 4. Required Technical Expertise Pills
                  if (requiredExpertise.isNotEmpty) ...[
                    Text(
                      context.tr('required_technical_expertise'),
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: requiredExpertise.map((exp) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: Text(
                            exp,
                            style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF1E40AF)),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 6. Matched Academic Institutions for R&D
                  if (collegeSuggestions.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          acceptedUniversity != null ? context.tr('academic_matches') : context.tr('ai_matched_institutions'),
                          style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                        ),
                        Text(
                          '${collegeSuggestions.length} ${context.tr('n_matches')}',
                          style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      acceptedUniversity != null
                          ? context.tr('institutions_with_faculty')
                          : context.tr('candidate_institutions_matched'),
                      style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 10),
                    ...collegeSuggestions.map((college) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: college.collegeName == acceptedUniversity
                              ? const Color(0xFF3B82F6)
                              : const Color(0xFFE2E8F0),
                          width: college.collegeName == acceptedUniversity ? 1.5 : 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: college.collegeName == acceptedUniversity ? const Color(0xFFDBEAFE) : const Color(0xFFF3E8FF),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              college.collegeName == acceptedUniversity ? Icons.verified_user : Icons.school_outlined,
                              color: college.collegeName == acceptedUniversity ? const Color(0xFF1D4ED8) : const Color(0xFF7E22CE),
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  college.collegeName ?? 'Institute',
                                  style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                                ),
                                Text(
                                  '${college.district ?? district} • ${college.domain ?? "Engineering"}',
                                  style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B)),
                                ),
                                if (college.facultyExpertise != null && college.facultyExpertise!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      '${context.tr('expertise_prefix')}${college.facultyExpertise}',
                                      style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF94A3B8)),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0FDF4),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${college.formattedMatchScore}% ${context.tr('match_suffix')}',
                              style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary),
                            ),
                          ),
                        ],
                      ),
                    )),
                    const SizedBox(height: 16),
                  ],

                  // 7. Duplicate Alert Card
                  if (isDuplicate || status == 'DUPLICATE') ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFCD34D)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.copy_rounded, color: Color(0xFFD97706), size: 16),
                              const SizedBox(width: 8),
                              Text(context.tr('duplicate_issue_linked'), style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF92400E))),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            context.tr('duplicate_issue_desc'),
                            style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFFB45309)),
                          ),
                          if (_problem.duplicateOf?.distanceKm != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                'Distance: ${_problem.duplicateOf!.distanceKm!.toStringAsFixed(2)} ${context.tr('distance_away')}',
                                style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600, color: const Color(0xFF92400E)),
                              ),
                            ),
                          const SizedBox(height: 10),
                          InkWell(
                            onTap: _navigateToMasterProblem,
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD97706),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.open_in_new_rounded, size: 13, color: Colors.white),
                                  const SizedBox(width: 6),
                                  Text(
                                    context.tr('view_master_problem'),
                                    style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // 8. Ground Reality Full Description
                  Text(context.tr('description_heading'), style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  const SizedBox(height: 6),
                  Text(
                    description,
                    style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF475569), height: 1.4),
                  ),
                  const SizedBox(height: 20),

                  // 9. Location Mini Map
                  if (_problem.location?.latitude != null && _problem.location?.longitude != null) ...[
                    Text(context.tr('location_pinned'), style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                    const SizedBox(height: 8),
                    Container(
                      height: 120,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: FlutterMap(
                          options: MapOptions(
                            initialCenter: LatLng(_problem.location!.latitude!, _problem.location!.longitude!),
                            initialZoom: 15.0,
                            interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
                          ),
                          children: [
                            TileLayer(
                              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.sih_2026.app',
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: LatLng(_problem.location!.latitude!, _problem.location!.longitude!),
                                  width: 32,
                                  height: 32,
                                  child: const Icon(Icons.location_on, color: AppColors.primary, size: 32),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 10. Dynamic Resolution Timeline Roadmap
                  Text(context.tr('timeline_heading'), style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  const SizedBox(height: 12),
                  _buildTimelineStep(
                    context.tr('timeline_submitted'),
                    dateStr,
                    true,
                    true,
                  ),
                  _buildTimelineStep(
                    context.tr('timeline_ai_analyzed'),
                    status != 'SUBMITTED' ? '${context.tr('timeline_classification_complete')} ($categoryText)' : context.tr('timeline_pending_ai'),
                    status != 'SUBMITTED',
                    status != 'SUBMITTED',
                  ),
                  _buildTimelineStep(
                    context.tr('timeline_university_review'),
                    acceptedUniversity != null
                        ? '${context.tr('timeline_accepted_by')} $acceptedUniversity'
                        : (collegeSuggestions.isNotEmpty
                            ? '${collegeSuggestions.length} ${context.tr('timeline_candidates_matched')}'
                            : context.tr('timeline_pending_matching')),
                    acceptedUniversity != null || ['ACCEPTED', 'IN_PROGRESS', 'PROPOSAL', 'PROTOTYPE', 'VALIDATED', 'DEPLOYED'].contains(status),
                    collegeSuggestions.isNotEmpty || acceptedUniversity != null,
                  ),
                  _buildTimelineStep(
                    context.tr('timeline_research_prototype'),
                    ['PROTOTYPE', 'VALIDATED', 'DEPLOYED'].contains(status)
                        ? context.tr('timeline_prototype_developed')
                        : (status == 'IN_PROGRESS' ? context.tr('timeline_in_progress_team') : context.tr('timeline_pending_research')),
                    ['PROTOTYPE', 'VALIDATED', 'DEPLOYED'].contains(status),
                    ['IN_PROGRESS', 'PROTOTYPE', 'VALIDATED', 'DEPLOYED'].contains(status),
                  ),
                  _buildTimelineStep(
                    context.tr('timeline_deployment'),
                    status == 'DEPLOYED' ? context.tr('timeline_deployed_community') : context.tr('timeline_pending_deployment'),
                    status == 'DEPLOYED',
                    status == 'DEPLOYED',
                    isLast: true,
                  ),

                  const SizedBox(height: 80),
                ],
              ),
            ),
          ],
        ),
      ),

      // Bottom Bar (Upvote & Actions)
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _isUpvoting ? null : _toggleUpvote,
                  icon: Icon(
                    _hasUpvoted ? Icons.arrow_upward : Icons.arrow_upward_rounded,
                    size: 18,
                    color: Colors.white,
                  ),
                  label: Text(
                    _hasUpvoted ? '${context.tr('upvoted_supported')} ($_upvotesCount)' : '${context.tr('upvote_support_this')} ($_upvotesCount)',
                    style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _hasUpvoted ? const Color(0xFF144A2C) : AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildBottomAction(Icons.add_comment_outlined, '${context.tr('discuss_comments')} ($_commentsCount)', () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      useRootNavigator: true,
                      backgroundColor: Colors.transparent,
                      builder: (ctx) => CommentsBottomSheet(
                        problemId: _problem.id,
                        onCommentAdded: () {
                          if (mounted) {
                            setState(() {
                              _commentsCount++;
                            });
                          }
                        },
                      ),
                    );
                  }),
                  _buildBottomAction(Icons.report_outlined, context.tr('report_content'), () {
                    _showReportContentDialog(context);
                  }),
                ],
              ),
            ],
          ),
        ),
      ),
    ),
    );
  }

  void _showReportContentDialog(BuildContext context) {
    final reasons = [
      context.tr('report_reason_spam'),
      context.tr('report_reason_false_info'),
      context.tr('report_reason_offensive'),
      context.tr('report_reason_duplicate'),
      context.tr('report_reason_other'),
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
            context.tr('report_content_title'),
            style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.tr('report_dialog_subtitle'),
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
                    labelText: context.tr('report_additional_details'),
                    labelStyle: GoogleFonts.poppins(fontSize: 12),
                    hintText: context.tr('report_violation_hint'),
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
              child: Text(context.tr('cancel')),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: isSubmitting || _problem.id.isEmpty
                  ? null
                  : () async {
                      setDialogState(() => isSubmitting = true);
                      try {
                        final res = await _repository.reportProblemContent(
                          _problem.id,
                          reason: selectedReason,
                          details: detailsController.text.trim(),
                        );
                        if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res['message'] ?? context.tr('report_submitted_success')),
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
                  : Text(context.tr('submit_report'), style: const TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomAction(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: const Color(0xFF64748B)),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF64748B))),
        ],
      ),
    );
  }

  Widget _buildTimelineStep(String title, String subtitle, bool isCompleted, bool isActive, {bool isLast = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: isCompleted ? AppColors.primary : const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isCompleted ? AppColors.primary : const Color(0xFFCBD5E1),
                ),
              ),
              child: isCompleted
                  ? const Icon(Icons.check, size: 12, color: Colors.white)
                  : null,
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 28,
                color: isCompleted ? AppColors.primary : const Color(0xFFE2E8F0),
              )
          ],
        ),
        const SizedBox(width: 12),
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: isCompleted ? const Color(0xFF1E293B) : const Color(0xFF94A3B8),
                  fontWeight: isCompleted ? FontWeight.bold : FontWeight.w500,
                ),
              ),
              Text(
                subtitle,
                style: GoogleFonts.poppins(
                  fontSize: 10,
                  color: isActive ? AppColors.primary : const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

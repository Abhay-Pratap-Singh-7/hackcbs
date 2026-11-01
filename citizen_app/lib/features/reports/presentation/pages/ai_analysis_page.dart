import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/theme/app_colors.dart';

class AiAnalysisPage extends StatelessWidget {
  final Map<String, dynamic>? analysisData;

  const AiAnalysisPage({super.key, this.analysisData});

  @override
  Widget build(BuildContext context) {
    // Extract dynamic AI result or provide solid fallbacks
    final aiResult = analysisData?['aiAnalysis'] as Map<String, dynamic>? ?? {};
    final category = (aiResult['problem_classification'] ?? analysisData?['selfTags']?['suggestedDomain'] ?? 'Civic Concern').toString().toUpperCase();
    final severity = (aiResult['severity'] ?? analysisData?['supportingInfo']?['urgency'] ?? 'MEDIUM').toString().toUpperCase();
    final summary = aiResult['summary'] ?? analysisData?['description'] ?? 'AI classification completed and registered on the civic ledger.';
    final keyPoints = aiResult['key_points'] as String?;
    final suggestedSolution = aiResult['suggested_solution'] as String?;
    final requiredExpertise = (aiResult['required_expertise'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [];

    // Deduplication details
    final bool isDuplicate = analysisData?['isDuplicate'] == true;
    final duplicateDetails = analysisData?['deduplicationDetails'] as Map<String, dynamic>?;
    final similarityScore = duplicateDetails != null
        ? ((duplicateDetails['similarity_score'] ?? 0) * 100).toStringAsFixed(1)
        : '0';
    final distanceKm = duplicateDetails?['distance_km'] != null ? '${duplicateDetails!['distance_km']} km' : 'nearby';

    // University match suggestions
    final List<dynamic> collegeSuggestions = analysisData?['collegeSuggestions'] as List<dynamic>? ?? [];
    final int matchedColleges = collegeSuggestions.length;

    // Severity Colors
    Color severityColor = const Color(0xFFD97706); // Amber
    Color severityBg = const Color(0xFFFEF3C7);
    IconData severityIcon = Icons.warning_amber_rounded;

    if (severity == 'HIGH' || severity == 'CRITICAL') {
      severityColor = const Color(0xFFDC2626); // Red
      severityBg = const Color(0xFFFEE2E2);
      severityIcon = Icons.priority_high_rounded;
    } else if (severity == 'LOW') {
      severityColor = const Color(0xFF16A34A); // Green
      severityBg = const Color(0xFFDCFCE7);
      severityIcon = Icons.check_circle_outline_rounded;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Color(0xFF1E293B), size: 22),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
        title: Text(
          'AI Intelligence Review',
          style: GoogleFonts.poppins(
            color: const Color(0xFF1E293B),
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Success Badge Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDuplicate
                      ? [const Color(0xFFFEF3C7), const Color(0xFFFFFBEB)]
                      : [const Color(0xFFECFDF5), const Color(0xFFF0FDF4)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDuplicate ? const Color(0xFFFCD34D) : const Color(0xFFA7F3D0),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDuplicate ? const Color(0xFFD97706) : AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isDuplicate ? Icons.copy_all_rounded : Icons.auto_awesome_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    isDuplicate ? 'Linked to Existing Issue' : 'Report Verified by AI',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isDuplicate ? const Color(0xFF92400E) : const Color(0xFF065F46),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    isDuplicate
                        ? 'Vector similarity ($similarityScore%) matched this with an active report ($distanceKm away). Upvote recorded.'
                        : 'Classified & vectorized for municipal routing and academic research.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: isDuplicate ? const Color(0xFFB45309) : const Color(0xFF047857),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // AI Classification & Severity Cards
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('AI Classification', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                        const SizedBox(height: 4),
                        Text(
                          category,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: severityBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: severityColor.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Severity Level', style: GoogleFonts.poppins(fontSize: 11, color: severityColor)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(severityIcon, size: 16, color: severityColor),
                            const SizedBox(width: 4),
                            Text(
                              severity,
                              style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: severityColor),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // AI Ground Reality Summary Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: const [
                  BoxShadow(color: Color(0x06000000), blurRadius: 10, offset: Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.analytics_outlined, color: AppColors.primary, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Ground Reality Summary',
                        style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    summary,
                    style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF334155), height: 1.5),
                  ),
                  if (keyPoints != null && keyPoints.isNotEmpty) ...[
                    const Divider(color: Color(0xFFF1F5F9), height: 24),
                    Text('Key Focus Points', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
                    const SizedBox(height: 6),
                    Text(
                      keyPoints,
                      style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF475569), height: 1.4),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Suggested Solutions (if generated by Groq)
            if (suggestedSolution != null && suggestedSolution.isNotEmpty) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.lightbulb_outline_rounded, color: Color(0xFF16A34A), size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Suggested Technical Solution',
                          style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF15803D)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      suggestedSolution,
                      style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF166534), height: 1.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Required Engineering Expertise
            if (requiredExpertise.isNotEmpty) ...[
              Text(
                'Required Technical Expertise',
                style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
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

            // Matched Universities Card
            if (matchedColleges > 0) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3E8FF),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.school_outlined, color: Color(0xFF7E22CE), size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Academic Allocation',
                            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                          ),
                          Text(
                            'Matched with $matchedColleges India institute(s) for engineering review and solutions.',
                            style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Resolution Lifecycle Progress
            Text(
              'Resolution Roadmap',
              style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
            ),
            const SizedBox(height: 12),
            _buildTimelineItem('AI Ingestion & Deduplication', 'Completed', true, true),
            _buildTimelineItem('Municipal Ward Routing', 'In Progress', true, false),
            _buildTimelineItem('Engineering Team Deployment', 'Pending', false, false),
            _buildTimelineItem('Field Verification & Closure', 'Pending', false, false, isLast: true),

            const SizedBox(height: 32),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
          ),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.go('/explore'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    side: const BorderSide(color: AppColors.primary),
                  ),
                  child: Text(
                    'Explore on Map',
                    style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => context.go('/my_reports'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    'My Submissions',
                    style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTimelineItem(String title, String subtitle, bool isDone, bool isActive, {bool isLast = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: isDone ? AppColors.primary : const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDone || isActive ? AppColors.primary : const Color(0xFFCBD5E1),
                  width: isActive ? 2 : 1,
                ),
              ),
              child: isDone
                  ? const Icon(Icons.check, size: 12, color: Colors.white)
                  : null,
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 28,
                color: isDone ? AppColors.primary : const Color(0xFFE2E8F0),
              ),
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
                  fontWeight: isActive || isDone ? FontWeight.bold : FontWeight.w500,
                  color: isActive || isDone ? const Color(0xFF1E293B) : const Color(0xFF94A3B8),
                ),
              ),
              Text(
                subtitle,
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  color: isActive ? AppColors.primary : const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

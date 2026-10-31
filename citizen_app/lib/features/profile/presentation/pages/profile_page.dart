import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_event.dart';
import 'package:sih_2026/features/auth/presentation/bloc/auth_state.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/core/localization/app_localizations.dart';
import 'package:sih_2026/core/localization/language_cubit.dart';
import 'package:sih_2026/core/localization/widgets/language_picker_sheet.dart';

import 'package:image_picker/image_picker.dart';
import 'package:sih_2026/features/reports/data/repositories/problem_repository.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  bool _isUploadingAvatar = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<AuthBloc>().add(const CheckAuthStatusEvent());
      }
    });
  }

  Future<void> _pickAndUploadAvatar() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (image == null) return;

      setState(() {
        _isUploadingAvatar = true;
      });

      final problemRepository = ProblemRepository();
      final urls = await problemRepository.uploadImages([image.path]);
      
      if (!mounted) return;

      if (urls.isNotEmpty) {
        final firstItem = urls.first;
        String? avatarUrl;
        if (firstItem is Map) {
          avatarUrl = firstItem['url']?.toString();
        } else if (firstItem is String) {
          avatarUrl = firstItem;
        }

        if (avatarUrl != null && avatarUrl.isNotEmpty) {
          context.read<AuthBloc>().add(UpdateProfileRequested(avatar: avatarUrl));
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(context.tr('profile_avatar_updated')),
              backgroundColor: const Color(0xFF16A34A),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${context.tr('profile_avatar_failed')}: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploadingAvatar = false;
        });
      }
    }
  }

  void _showHelplinesModal(BuildContext context) {
    final scale = (MediaQuery.of(context).size.width / 375.0).clamp(0.85, 1.25);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => SafeArea(
        child: Container(
          padding: EdgeInsets.all((24 * scale).clamp(16.0, 28.0)),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: EdgeInsets.all((8 * scale).clamp(6.0, 10.0)),
                    decoration: const BoxDecoration(
                      color: Color(0xFFFEE2E2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.phone_in_talk, color: const Color(0xFFDC2626), size: (20 * scale).clamp(16.0, 22.0)),
                  ),
                  SizedBox(width: (12 * scale).clamp(8.0, 14.0)),
                  Expanded(
                    child: Text(
                      context.tr('helplines_title'),
                      style: GoogleFonts.poppins(
                        fontSize: (16 * scale).clamp(14.0, 18.0),
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: (16 * scale).clamp(12.0, 20.0)),
              _buildHelplineRow(context.tr('helpline_national_emergency'), '112', Icons.emergency, scale),
              _buildHelplineRow(context.tr('helpline_municipal'), '1916', Icons.location_city, scale),
              _buildHelplineRow(context.tr('helpline_police'), '100', Icons.local_police, scale),
              _buildHelplineRow(context.tr('helpline_fire'), '101', Icons.local_fire_department, scale),
              _buildHelplineRow(context.tr('helpline_ambulance'), '108', Icons.medical_services, scale),
              SizedBox(height: (12 * scale).clamp(8.0, 16.0)),
            ],
          ),
        ),
      ),
    );
  }

  static Widget _buildHelplineRow(String service, String number, IconData icon, double scale) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: (8 * scale).clamp(6.0, 10.0)),
      child: Row(
        children: [
          Icon(icon, size: (18 * scale).clamp(15.0, 20.0), color: const Color(0xFF64748B)),
          SizedBox(width: (12 * scale).clamp(8.0, 14.0)),
          Expanded(
            child: Text(
              service,
              style: GoogleFonts.poppins(
                fontSize: (13 * scale).clamp(11.0, 14.5),
                color: const Color(0xFF334155),
              ),
            ),
          ),
          Container(
            padding: EdgeInsets.symmetric(
              horizontal: (10 * scale).clamp(8.0, 12.0),
              vertical: (4 * scale).clamp(3.0, 6.0),
            ),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFBFDBFE)),
            ),
            child: Text(
              number,
              style: GoogleFonts.poppins(
                fontSize: (12 * scale).clamp(10.5, 13.5),
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1D4ED8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    final scale = (MediaQuery.of(context).size.width / 375.0).clamp(0.85, 1.25);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          context.tr('logout'),
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            fontSize: (16 * scale).clamp(14.0, 18.0),
          ),
        ),
        content: Text(
          context.tr('logout_confirm_msg'),
          style: GoogleFonts.poppins(
            fontSize: (13 * scale).clamp(11.5, 14.5),
            color: const Color(0xFF475569),
          ),
        ),
        actionsPadding: EdgeInsets.symmetric(
          horizontal: (16 * scale).clamp(12.0, 20.0),
          vertical: (12 * scale).clamp(8.0, 16.0),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              context.tr('cancel'),
              style: GoogleFonts.poppins(
                color: const Color(0xFF64748B),
                fontSize: (13 * scale).clamp(11.5, 14.5),
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.read<AuthBloc>().add(LogoutRequested());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              padding: EdgeInsets.symmetric(
                horizontal: (16 * scale).clamp(12.0, 20.0),
                vertical: (10 * scale).clamp(8.0, 12.0),
              ),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(
              context.tr('logout'),
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.bold,
                color: Colors.white,
                fontSize: (13 * scale).clamp(11.5, 14.5),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final scale = (screenWidth / 375.0).clamp(0.85, 1.25);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          context.tr('tab_profile'),
          style: GoogleFonts.poppins(
            color: const Color(0xFF1E293B),
            fontWeight: FontWeight.bold,
            fontSize: (16 * scale).clamp(14.0, 18.0),
          ),
        ),
        centerTitle: true,
      ),
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state.status == AuthStatus.unauthenticated) {
            context.go('/login');
          }
        },
        builder: (context, state) {
          final user = state.user;
          final userName = user?.name ?? context.tr('role_citizen');
          final userEmail = user?.email ?? 'citizen@sih2026.gov.in';
          final userLocation = user?.district ?? user?.profileDetails?['district'] ?? context.tr('local_area');
          final userAvatar = user?.avatar?.trim();
          final hasAvatar = userAvatar != null && userAvatar.isNotEmpty;

          return SingleChildScrollView(
            child: Column(
              children: [
                // Header Card
                Container(
                  color: Colors.white,
                  padding: EdgeInsets.symmetric(
                    horizontal: (24 * scale).clamp(16.0, 28.0),
                    vertical: (20 * scale).clamp(16.0, 24.0),
                  ),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: _pickAndUploadAvatar,
                        child: Stack(
                          children: [
                            CircleAvatar(
                              radius: (32 * scale).clamp(26.0, 38.0),
                              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                              backgroundImage: hasAvatar ? NetworkImage(userAvatar) : null,
                              onBackgroundImageError: hasAvatar ? (e, s) {} : null,
                              child: _isUploadingAvatar
                                  ? const CircularProgressIndicator()
                                  : (!hasAvatar
                                      ? Text(
                                          userName.isNotEmpty ? userName[0].toUpperCase() : 'C',
                                          style: GoogleFonts.poppins(
                                            fontSize: (24 * scale).clamp(20.0, 28.0),
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.primary,
                                          ),
                                        )
                                      : null),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: EdgeInsets.all((4 * scale).clamp(3.0, 6.0)),
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.edit, size: (12 * scale).clamp(10.0, 14.0), color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(width: (16 * scale).clamp(12.0, 20.0)),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              userName,
                              style: GoogleFonts.poppins(
                                fontSize: (17 * scale).clamp(14.0, 20.0),
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF1E293B),
                                height: 1.25,
                              ),
                              softWrap: true,
                            ),
                            SizedBox(height: (2 * scale).clamp(2.0, 4.0)),
                            Text(
                              userEmail,
                              style: GoogleFonts.poppins(
                                fontSize: (12 * scale).clamp(10.5, 14.0),
                                color: const Color(0xFF64748B),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            SizedBox(height: (6 * scale).clamp(4.0, 8.0)),
                            Row(
                              children: [
                                Icon(Icons.location_on_outlined, size: (14 * scale).clamp(12.0, 16.0), color: const Color(0xFF64748B)),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    userLocation,
                                    style: GoogleFonts.poppins(
                                      fontSize: (12 * scale).clamp(10.5, 14.0),
                                      color: const Color(0xFF64748B),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
                SizedBox(height: (16 * scale).clamp(12.0, 20.0)),

                // Operational Shortcuts
                Container(
                  color: Colors.white,
                  child: Column(
                    children: [
                      _buildProfileOption(
                        context,
                        Icons.assignment_outlined,
                        context.tr('my_reports'),
                        subtitle: context.tr('my_reports_sub'),
                        onTap: () => context.go('/activity'),
                      ),
                      _buildDivider(),
                      _buildProfileOption(
                        context,
                        Icons.map_outlined,
                        context.tr('tab_explore'),
                        subtitle: context.tr('explore_sub'),
                        onTap: () => context.go('/explore'),
                      ),
                      _buildDivider(),
                      _buildProfileOption(
                        context,
                        Icons.verified_user_outlined,
                        context.tr('civic_score'),
                        subtitle: context.tr('civic_score_sub'),
                        onTap: () => context.push('/civic_score'),
                      ),
                      _buildDivider(),
                      _buildProfileOption(
                        context,
                        Icons.translate_rounded,
                        context.tr('app_language'),
                        subtitle: '${context.watch<LanguageCubit>().state.icon} ${context.watch<LanguageCubit>().state.nativeName} (${context.watch<LanguageCubit>().state.englishName})',
                        onTap: () => LanguagePickerSheet.show(context),
                      ),
                      _buildDivider(),
                      _buildProfileOption(
                        context,
                        Icons.emergency_outlined,
                        context.tr('helplines_title'),
                        subtitle: context.tr('helplines_sub'),
                        onTap: () => _showHelplinesModal(context),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: (16 * scale).clamp(12.0, 20.0)),

                // App Info & Logout
                Container(
                  color: Colors.white,
                  child: Column(
                    children: [
                      _buildProfileOption(
                        context,
                        Icons.info_outline,
                        context.tr('about_platform_title'),
                        subtitle: context.tr('about_platform_sub'),
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(context.tr('about_platform_snackbar'))),
                          );
                        },
                      ),
                      _buildDivider(),
                      InkWell(
                        onTap: () => _showLogoutDialog(context),
                        child: Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: (24 * scale).clamp(16.0, 28.0),
                            vertical: (16 * scale).clamp(12.0, 18.0),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: EdgeInsets.all((8 * scale).clamp(6.0, 10.0)),
                                decoration: const BoxDecoration(
                                  color: Color(0xFFFEE2E2),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.logout, color: const Color(0xFFDC2626), size: (18 * scale).clamp(15.0, 22.0)),
                              ),
                              SizedBox(width: (16 * scale).clamp(12.0, 20.0)),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      context.tr('logout'),
                                      style: GoogleFonts.poppins(
                                        fontSize: (14 * scale).clamp(12.0, 16.0),
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFFDC2626),
                                      ),
                                    ),
                                    Text(
                                      context.tr('logout_sub'),
                                      style: GoogleFonts.poppins(
                                        fontSize: (11 * scale).clamp(9.5, 13.0),
                                        color: const Color(0xFF94A3B8),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(Icons.chevron_right, color: const Color(0xFFCBD5E1), size: (20 * scale).clamp(16.0, 22.0)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: (48 * scale).clamp(32.0, 56.0)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildProfileOption(BuildContext context, IconData icon, String title, {String? subtitle, VoidCallback? onTap}) {
    final scale = (MediaQuery.of(context).size.width / 375.0).clamp(0.85, 1.25);
    final horizontalPad = (24 * scale).clamp(16.0, 28.0);
    final verticalPad = (16 * scale).clamp(12.0, 18.0);
    final iconContainerPad = (8 * scale).clamp(6.0, 10.0);
    final iconSize = (18 * scale).clamp(15.0, 22.0);
    final spacing = (16 * scale).clamp(12.0, 20.0);
    final titleSize = (14 * scale).clamp(12.0, 16.0);
    final subtitleSize = (11 * scale).clamp(9.5, 13.0);
    final chevronSize = (20 * scale).clamp(16.0, 22.0);

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: horizontalPad, vertical: verticalPad),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(iconContainerPad),
              decoration: const BoxDecoration(
                color: Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: const Color(0xFF475569), size: iconSize),
            ),
            SizedBox(width: spacing),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: titleSize,
                      color: const Color(0xFF1E293B),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.poppins(fontSize: subtitleSize, color: const Color(0xFF94A3B8)),
                    ),
                  ],
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: const Color(0xFFCBD5E1), size: chevronSize),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Builder(
      builder: (context) {
        final scale = (MediaQuery.of(context).size.width / 375.0).clamp(0.85, 1.25);
        final horizontalPad = (24 * scale).clamp(16.0, 28.0);
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: horizontalPad),
          child: const Divider(height: 1, color: Color(0xFFE2E8F0)),
        );
      },
    );
  }
}

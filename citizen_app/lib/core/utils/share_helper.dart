import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/theme/app_colors.dart';

class ShareHelper {
  static void showShareModal({
    required BuildContext context,
    required String problemId,
    required String title,
    required String location,
    List<String>? images,
  }) {
    final deepLinkUrl = 'https://sih-26-jarr.onrender.com/issue/$problemId';
    final playStoreUrl = 'https://play.google.com/store/apps/details?id=com.sih_2026.app';
    final shareMessage =
        '🚨 Civic Report: "$title"\n'
        '📍 Location: $location\n\n'
        '🔗 View in Jharkhand Samadhan App:\n$deepLinkUrl\n\n'
        '📲 Don\'t have the app? Get it on Google Play:\n$playStoreUrl';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetContext) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.share_rounded, color: AppColors.primary, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Share Civic Report',
                        style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                      ),
                      Text(
                        'Share with your community, officials, or social networks',
                        style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Issue mini preview card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: (images != null && images.isNotEmpty)
                        ? Image.network(
                            images.first,
                            width: 50,
                            height: 50,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(
                              width: 50,
                              height: 50,
                              color: const Color(0xFFE2E8F0),
                              child: const Icon(Icons.broken_image, size: 20, color: Color(0xFF94A3B8)),
                            ),
                          )
                        : Container(
                            width: 50,
                            height: 50,
                            color: const Color(0xFFE2E8F0),
                            child: const Icon(Icons.image, size: 20, color: Color(0xFF94A3B8)),
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.location_on, size: 12, color: Color(0xFF64748B)),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                location,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            Text(
              'Share via Application',
              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
            ),
            const SizedBox(height: 14),

            // Share App Icons Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildShareAppButton(
                  icon: Icons.chat_bubble_rounded,
                  iconColor: const Color(0xFF25D366),
                  bgColor: const Color(0xFFDCFCE7),
                  label: 'WhatsApp',
                  onTap: () {
                    Navigator.pop(sheetContext);
                    _triggerShare(context, shareMessage, title: title, packageName: 'com.whatsapp');
                  },
                ),
                _buildShareAppButton(
                  icon: Icons.mail_rounded,
                  iconColor: const Color(0xFFEA4335),
                  bgColor: const Color(0xFFFEE2E2),
                  label: 'Mail',
                  onTap: () {
                    Navigator.pop(sheetContext);
                    _triggerShare(context, shareMessage, title: title, packageName: 'com.google.android.gm');
                  },
                ),
                _buildShareAppButton(
                  icon: Icons.cloud_upload_rounded,
                  iconColor: const Color(0xFF0061FF),
                  bgColor: const Color(0xFFDBEAFE),
                  label: 'Dropbox',
                  onTap: () {
                    Navigator.pop(sheetContext);
                    _triggerShare(context, shareMessage, title: title, packageName: 'com.dropbox.android');
                  },
                ),
                _buildShareAppButton(
                  icon: Icons.sms_rounded,
                  iconColor: const Color(0xFF0284C7),
                  bgColor: const Color(0xFFE0F2FE),
                  label: 'Messages',
                  onTap: () {
                    Navigator.pop(sheetContext);
                    _triggerShare(context, shareMessage, title: title, packageName: 'com.google.android.apps.messaging');
                  },
                ),
                _buildShareAppButton(
                  icon: Icons.more_horiz_rounded,
                  iconColor: const Color(0xFF475569),
                  bgColor: const Color(0xFFF1F5F9),
                  label: 'More Apps',
                  onTap: () {
                    Navigator.pop(sheetContext);
                    _triggerShare(context, shareMessage, title: title);
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            const SizedBox(height: 16),

            // Quick Copy Action
            InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                Navigator.pop(sheetContext);
                Clipboard.setData(ClipboardData(text: deepLinkUrl));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Row(
                      children: [
                        Icon(Icons.check_circle, color: Colors.white, size: 20),
                        SizedBox(width: 10),
                        Expanded(child: Text('Official issue link copied to clipboard!')),
                      ],
                    ),
                    backgroundColor: AppColors.primary,
                    behavior: SnackBarBehavior.floating,
                    duration: Duration(seconds: 3),
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.link_rounded, color: AppColors.primary, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        deepLinkUrl,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF334155), fontWeight: FontWeight.w500),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Copy',
                        style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _buildShareAppButton({
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: bgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w500, color: const Color(0xFF475569)),
          ),
        ],
      ),
    );
  }

  static Future<void> _triggerShare(BuildContext context, String text, {required String title, String? packageName}) async {
    const channel = MethodChannel('com.sih_2026.app/share');
    try {
      await channel.invokeMethod('share', {
        'text': text,
        'subject': 'Civic Report: $title',
        ...?packageName != null ? {'packageName': packageName} : null,
      });
    } catch (_) {
      await Clipboard.setData(ClipboardData(text: text));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Report details copied to clipboard!'),
            backgroundColor: AppColors.primary,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}

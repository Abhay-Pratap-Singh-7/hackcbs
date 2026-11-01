import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sih_2026/core/constants/app_constants.dart';
import 'package:sih_2026/core/theme/app_colors.dart';

class DistrictDropdown extends StatelessWidget {
  final String? selectedDistrict;
  final ValueChanged<String?> onChanged;
  final String? Function(String?)? validator;

  const DistrictDropdown({
    super.key,
    required this.selectedDistrict,
    required this.onChanged,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'District (जिला)',
          style: GoogleFonts.poppins(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.neutral500,
          ),
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          initialValue: selectedDistrict,
          isExpanded: true,
          icon: const Icon(
            Icons.keyboard_arrow_down,
            color: AppColors.neutral400,
          ),
          decoration: const InputDecoration(
            hintText: 'Select your district',
            prefixIcon: Icon(
              Icons.location_on_outlined,
              size: 20,
              color: AppColors.neutral400,
            ),
            contentPadding: EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
          ),
          style: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppColors.neutral500,
          ),
          items: AppConstants.indiaDistricts.map((district) {
            return DropdownMenuItem<String>(
              value: district,
              child: Text(
                district,
                overflow: TextOverflow.ellipsis,
              ),
            );
          }).toList(),
          onChanged: onChanged,
          validator: validator,
        ),
      ],
    );
  }
}

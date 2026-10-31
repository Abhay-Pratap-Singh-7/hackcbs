import 'package:flutter/material.dart';
import 'package:sih_2026/features/auth/presentation/widgets/auth_text_field.dart';

class RoleSpecificFields extends StatelessWidget {
  final String role;
  final Map<String, TextEditingController> controllers;

  const RoleSpecificFields({
    super.key,
    required this.role,
    required this.controllers,
  });

  @override
  Widget build(BuildContext context) {
    switch (role) {
      case 'INDIVIDUAL_CITIZEN':
        return Column(
          children: [
            AuthTextField(
              controller: controllers['fullName']!,
              label: 'Full Name',
              hintText: 'Enter full name',
            ),
            const SizedBox(height: 14),
            AuthTextField(
              controller: controllers['pincode']!,
              label: 'Pincode',
              hintText: '6-digit pincode',
            ),
          ],
        );
      case 'NGO_COMMUNITY':
        return Column(
          children: [
            AuthTextField(
              controller: controllers['organizationName']!,
              label: 'Organization Name',
            ),
            const SizedBox(height: 14),
            AuthTextField(
              controller: controllers['authorizedRepresentativeName']!,
              label: 'Authorized Rep Name',
            ),
          ],
        );
      case 'LOCAL_BODY':
        return Column(
          children: [
            AuthTextField(
              controller: controllers['localBodyName']!,
              label: 'Local Body Name',
            ),
            const SizedBox(height: 14),
            AuthTextField(
              controller: controllers['lgdCode']!,
              label: 'LGD Code',
            ),
          ],
        );
      case 'GOVT_OFFICER':
        return Column(
          children: [
            AuthTextField(
              controller: controllers['officialGovEmail']!,
              label: 'Official Government Email',
              hintText: 'name@gov.in / name@nic.in',
              prefixIcon: Icons.email_outlined,
            ),
            const SizedBox(height: 14),
            AuthTextField(
              controller: controllers['employeeId']!,
              label: 'Employee ID / Staff Number',
              hintText: 'Enter your ID',
              prefixIcon: Icons.badge_outlined,
            ),
          ],
        );
      case 'INDUSTRY_PARTNER':
        return Column(
          children: [
            AuthTextField(
              controller: controllers['companyName']!,
              label: 'Company Name',
              hintText: 'Enter registered company name',
              prefixIcon: Icons.business_center_outlined,
            ),
            const SizedBox(height: 14),
            AuthTextField(
              controller: controllers['cin']!,
              label: 'Corporate Identification Number (CIN)',
              hintText: 'Enter 21-digit CIN (Optional)',
              prefixIcon: Icons.numbers_outlined,
            ),
          ],
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

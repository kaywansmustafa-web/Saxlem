import 'package:flutter/material.dart';

import '../../../../core/models/specialty.dart';
import 'dashboard_section_header.dart';
import 'specialty_card.dart';

class PopularSpecialtiesSection extends StatelessWidget {
  const PopularSpecialtiesSection({
    required this.title,
    required this.specialties,
    required this.semanticLabelBuilder,
    this.onSpecialtySelected,
    super.key,
  });

  final String title;
  final List<Specialty> specialties;
  final String Function(Specialty specialty) semanticLabelBuilder;
  final ValueChanged<Specialty>? onSpecialtySelected;

  @override
  Widget build(BuildContext context) {
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1, 2);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DashboardSectionHeader(title: title),
        const SizedBox(height: 12),
        SizedBox(
          height: 112 + ((textScale - 1) * 36),
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.zero,
            itemCount: specialties.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final specialty = specialties[index];
              return SpecialtyCard(
                specialty: specialty,
                semanticLabel: semanticLabelBuilder(specialty),
                onTap: onSpecialtySelected == null
                    ? null
                    : () => onSpecialtySelected!(specialty),
              );
            },
          ),
        ),
      ],
    );
  }
}

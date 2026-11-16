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
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      DashboardSectionHeader(title: title),
      const SizedBox(height: 12),
      LayoutBuilder(
        builder: (context, constraints) {
          const gap = 10.0;
          final columns = constraints.maxWidth >= 520 ? 5 : 3;
          final width = (constraints.maxWidth - gap * (columns - 1)) / columns;
          return Wrap(
            spacing: gap,
            runSpacing: gap,
            children: [
              for (final specialty in specialties)
                SizedBox(
                  width: width,
                  child: SpecialtyCard(
                    specialty: specialty,
                    semanticLabel: semanticLabelBuilder(specialty),
                    onTap: onSpecialtySelected == null
                        ? null
                        : () => onSpecialtySelected!(specialty),
                  ),
                ),
            ],
          );
        },
      ),
    ],
  );
}

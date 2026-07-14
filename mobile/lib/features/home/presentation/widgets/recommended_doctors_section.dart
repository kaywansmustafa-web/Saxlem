import 'package:flutter/material.dart';

import '../../../../core/models/recommended_doctor.dart';
import 'dashboard_section_header.dart';
import 'recommended_doctor_card.dart';

class RecommendedDoctorsSection extends StatelessWidget {
  const RecommendedDoctorsSection({
    required this.title,
    required this.doctors,
    required this.bookLabel,
    required this.priceLabelBuilder,
    required this.semanticLabelBuilder,
    this.actionLabel,
    this.onActionPressed,
    this.onBookPressed,
    super.key,
  });

  final String title;
  final List<RecommendedDoctor> doctors;
  final String bookLabel;
  final String Function(RecommendedDoctor doctor) priceLabelBuilder;
  final String Function(RecommendedDoctor doctor) semanticLabelBuilder;
  final String? actionLabel;
  final VoidCallback? onActionPressed;
  final ValueChanged<RecommendedDoctor>? onBookPressed;

  @override
  Widget build(BuildContext context) {
    final cardWidth = (MediaQuery.sizeOf(context).width - 48).clamp(
      250.0,
      300.0,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DashboardSectionHeader(
          title: title,
          actionLabel: actionLabel,
          onActionPressed: onActionPressed,
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 218,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: doctors.length,
            separatorBuilder: (context, index) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final doctor = doctors[index];
              return SizedBox(
                width: cardWidth,
                child: RecommendedDoctorCard(
                  doctor: doctor,
                  bookLabel: bookLabel,
                  priceLabel: priceLabelBuilder(doctor),
                  semanticLabel: semanticLabelBuilder(doctor),
                  onBookPressed: onBookPressed == null
                      ? null
                      : () => onBookPressed!(doctor),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

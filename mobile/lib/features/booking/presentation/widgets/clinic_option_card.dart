import 'package:flutter/material.dart';
import '../../domain/entities/booking_clinic_option.dart';
import '../../../../design_system/components/content/saxlem_card.dart';

class ClinicOptionCard extends StatelessWidget {
  const ClinicOptionCard({
    required this.clinic,
    required this.onTap,
    super.key,
  });
  final BookingClinicOption clinic;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: clinic.displayName,
      child: Padding(
        padding: const EdgeInsetsDirectional.only(bottom: 12),
        child: SaxlemCard(
          onTap: onTap,
          padding: const EdgeInsetsDirectional.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                clinic.displayName,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

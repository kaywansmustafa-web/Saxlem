import 'package:flutter/material.dart';
import '../../domain/entities/booking_clinic_option.dart';
import '../booking_copy.dart';

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
    const copy = BookingCopy();
    return Semantics(
      button: true,
      label:
          '${clinic.displayName}, ${copy.fee(clinic.consultationFeeIqd)}, ${clinic.durationMinutes} minutes',
      child: Card(
        margin: const EdgeInsetsDirectional.only(bottom: 12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsetsDirectional.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  clinic.displayName,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 5),
                Text('${clinic.areaDisplayName}, ${clinic.cityDisplayName}'),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 14,
                  runSpacing: 6,
                  children: [
                    Text(copy.fee(clinic.consultationFeeIqd)),
                    Text('${clinic.durationMinutes} min'),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

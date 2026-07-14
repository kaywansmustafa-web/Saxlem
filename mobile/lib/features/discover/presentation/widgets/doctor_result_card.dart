import 'package:flutter/material.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../../domain/entities/discovery_types.dart';
import '../discover_copy.dart';

class DoctorResultCard extends StatelessWidget {
  const DoctorResultCard({
    required this.doctor,
    required this.copy,
    required this.onFavorite,
    required this.onProfile,
    required this.onBook,
    super.key,
  });
  final DoctorDiscoveryResult doctor;
  final DiscoverCopy copy;
  final VoidCallback onFavorite, onProfile, onBook;
  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final a = doctor.availability;
    return Semantics(
      container: true,
      label:
          '${doctor.doctorDisplayName}, ${copy.specialty(doctor.specialty)}, ${copy.availability(a.status)}, ${copy.fee(doctor.consultationFeeIqd)}',
      child: Container(
        padding: const EdgeInsetsDirectional.all(18),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: c.outlineVariant),
          boxShadow: [
            BoxShadow(
              color: c.shadow.withValues(alpha: .05),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: c.primaryContainer,
                  child: Icon(Icons.person_rounded, color: c.primary, size: 34),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              doctor.doctorDisplayName,
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ),
                          if (doctor.verified) ...[
                            const SizedBox(width: 5),
                            Icon(
                              Icons.verified_rounded,
                              size: 18,
                              color: c.primary,
                            ),
                          ],
                        ],
                      ),
                      Text(
                        '${copy.specialty(doctor.specialty)} · ${doctor.subSpecialtyDisplayName}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 5),
                      Text(
                        '${doctor.clinicDisplayName} · ${doctor.location.areaDisplayName}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: onFavorite,
                  tooltip: doctor.isInMyDoctors
                      ? 'Remove from My Doctors'
                      : 'Add to My Doctors',
                  icon: Icon(
                    doctor.isInMyDoctors
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    color: doctor.isInMyDoctors ? c.error : c.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                _Info(
                  Icons.star_rounded,
                  '${doctor.patientRating.toStringAsFixed(1)} · ${doctor.totalRatings} ratings',
                ),
                _Info(
                  Icons.chat_bubble_outline_rounded,
                  '${doctor.totalReviews} reviews',
                ),
                _Info(
                  Icons.payments_outlined,
                  copy.fee(doctor.consultationFeeIqd),
                ),
                _Info(Icons.schedule_rounded, copy.availability(a.status)),
                if (a.expectedWaitMinutes != null)
                  _Info(
                    Icons.hourglass_bottom_rounded,
                    '${a.expectedWaitMinutes} min wait',
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              doctor.languages.map(copy.language).join(' · '),
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onProfile,
                    child: const Text('View profile'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: a.status == AvailabilityStatus.fullyBooked
                        ? null
                        : onBook,
                    child: const Text('Book'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Info extends StatelessWidget {
  const _Info(this.icon, this.text);
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Semantics(
    label: text,
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 17, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 4),
        Text(text, style: Theme.of(context).textTheme.bodySmall),
      ],
    ),
  );
}

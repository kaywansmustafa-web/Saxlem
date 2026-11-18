import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import 'applied_doctor_filters.dart';
import 'visit_facts.dart';

class DoctorResultCard extends StatelessWidget {
  const DoctorResultCard({
    required this.doctor,
    required this.onProfile,
    super.key,
  });

  final DoctorDiscoveryResult doctor;
  final VoidCallback onProfile;

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    final semanticParts = <String>[
      doctor.doctorDisplayName,
      doctor.primarySpecialtyDisplayName,
      strings.yearsExperience(doctor.yearsOfExperience),
      if (doctor.clinics.isNotEmpty)
        '${strings.clinicsLabel}: ${doctor.clinics.map((item) => item.name).join(', ')}',
      if (doctor.languages.isNotEmpty)
        '${strings.languagesLabel}: ${doctor.languages.map((item) => localizedDoctorLanguage(context, item)).join(', ')}',
      if (doctor.fees case final fees?)
        '${strings.feeFirstVisit}: ${feeText(context, fees.firstVisitIqd)}',
      if (doctor.availability.nextAvailableAt case final next?)
        '${strings.nextFreeLabel}: ${nextFreeText(context, next)}',
      doctor.photoUrl == null
          ? strings.profileImageFallback(doctor.doctorDisplayName)
          : strings.profileImageLabel(doctor.doctorDisplayName),
    ];
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final available =
        doctor.availability.status == DoctorAvailabilityStatus.available;
    return SaxlemCard(
      onTap: onProfile,
      semanticLabel:
          '${semanticParts.join('. ')}. ${strings.viewDoctorProfile(doctor.doctorDisplayName)}',
      padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 8),
      child: ExcludeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SaxlemAvatar(
                  size: 56,
                  ring: true,
                  imageUrl: doctor.photoUrl,
                  initials: doctorInitials(doctor.doctorDisplayName),
                  semanticLabel: doctor.photoUrl == null
                      ? strings.profileImageFallback(doctor.doctorDisplayName)
                      : strings.profileImageLabel(doctor.doctorDisplayName),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doctor.doctorDisplayName,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontFamily: theme.textTheme.titleLarge?.fontFamily,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        doctor.primarySpecialtyDisplayName,
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                SaxlemStatusPill(
                  label: available
                      ? strings.doctorAvailable
                      : strings.doctorUnavailable,
                  tone: available
                      ? SaxlemStatusTone.positive
                      : SaxlemStatusTone.neutral,
                ),
              ],
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _Info(
                  icon: Icons.work_history_outlined,
                  text: strings.yearsExperience(doctor.yearsOfExperience),
                ),
                if (doctor.languages.isNotEmpty)
                  _Info(
                    icon: Icons.translate_rounded,
                    text: doctor.languages
                        .map((item) => localizedDoctorLanguage(context, item))
                        .join(' · '),
                  ),
                if (doctor.clinics.isNotEmpty)
                  _Info(
                    icon: Icons.location_on_outlined,
                    text: doctor.clinics.map((item) => item.name).join(', '),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Divider(height: 16, color: colors.divider),
            Row(
              children: [
                if (doctor.fees case final fees?)
                  Expanded(
                    child: _Fact(
                      label: strings.feeFirstVisit,
                      value: feeText(context, fees.firstVisitIqd),
                    ),
                  ),
                if (doctor.availability.nextAvailableAt case final next?)
                  Expanded(
                    child: _Fact(
                      label: strings.nextFreeLabel,
                      value: nextFreeText(context, next),
                      accent: true,
                    ),
                  ),
                if (doctor.fees == null &&
                    doctor.availability.nextAvailableAt == null)
                  Expanded(
                    child: Text(
                      strings.viewProfile,
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: colors.brandPrimary,
                      ),
                    ),
                  ),
                Icon(
                  Directionality.of(context) == TextDirection.rtl
                      ? Icons.chevron_left_rounded
                      : Icons.chevron_right_rounded,
                  color: colors.brandPrimary,
                ),
              ],
            ),
            const SizedBox(height: 6),
          ],
        ),
      ),
    );
  }
}

String doctorInitials(String name) => name
    .replaceFirst(RegExp(r'^(Dr\.?|د\.)\s*', caseSensitive: false), '')
    .split(RegExp(r'\s+'))
    .where((p) => p.isNotEmpty)
    .take(2)
    .map((p) => p.characters.first.toUpperCase())
    .join();

class _Info extends StatelessWidget {
  const _Info({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 300),
      child: Container(
        padding: const EdgeInsetsDirectional.symmetric(
          horizontal: 10,
          vertical: 6,
        ),
        decoration: BoxDecoration(
          color: colors.surfaceSunken,
          borderRadius: BorderRadius.circular(SaxlemRadii.small),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: colors.textSecondary),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                text,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colors.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A small label over a bold value, for the card's footer.
class _Fact extends StatelessWidget {
  const _Fact({required this.label, required this.value, this.accent = false});
  final String label, value;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: theme.textTheme.labelSmall?.copyWith(
            color: colors.textSecondary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: theme.textTheme.titleSmall?.copyWith(
            color: accent ? colors.brandPrimary : colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

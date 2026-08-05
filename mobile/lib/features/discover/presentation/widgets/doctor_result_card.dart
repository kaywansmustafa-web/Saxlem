import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/components/content/saxlem_avatar.dart';
import '../../../../design_system/components/content/saxlem_card.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import 'applied_doctor_filters.dart';

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
      doctor.photoUrl == null
          ? strings.profileImageFallback(doctor.doctorDisplayName)
          : strings.profileImageLabel(doctor.doctorDisplayName),
    ];
    return SaxlemCard(
      elevation: SaxlemCardElevation.low,
      onTap: onProfile,
      semanticLabel:
          '${semanticParts.join('. ')}. ${strings.viewDoctorProfile(doctor.doctorDisplayName)}',
      padding: const EdgeInsetsDirectional.all(18),
      child: ExcludeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SaxlemAvatar(
                  size: 60,
                  imageUrl: doctor.photoUrl,
                  semanticLabel: doctor.photoUrl == null
                      ? strings.profileImageFallback(doctor.doctorDisplayName)
                      : strings.profileImageLabel(doctor.doctorDisplayName),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doctor.doctorDisplayName,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(doctor.primarySpecialtyDisplayName),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 12,
              runSpacing: 10,
              children: [
                _Info(
                  icon: Icons.work_history_outlined,
                  text: strings.yearsExperience(doctor.yearsOfExperience),
                ),
                if (doctor.languages.isNotEmpty)
                  _Info(
                    icon: Icons.language_rounded,
                    text: doctor.languages
                        .map((item) => localizedDoctorLanguage(context, item))
                        .join(', '),
                  ),
                if (doctor.clinics.isNotEmpty)
                  _Info(
                    icon: Icons.local_hospital_outlined,
                    text: doctor.clinics.map((item) => item.name).join(', '),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Flexible(
                  child: Text(
                    strings.viewProfile,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                const Icon(Icons.arrow_forward_rounded, size: 20),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Info extends StatelessWidget {
  const _Info({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => ConstrainedBox(
    constraints: const BoxConstraints(maxWidth: 280),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 17),
        const SizedBox(width: 5),
        Flexible(
          child: Text(text, style: Theme.of(context).textTheme.bodySmall),
        ),
      ],
    ),
  );
}

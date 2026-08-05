import 'package:flutter/material.dart';
import '../../../../design_system/components/content/saxlem_card.dart';
import '../../domain/entities/doctor_discovery_result.dart';

class DoctorResultCard extends StatelessWidget {
  const DoctorResultCard({
    required this.doctor,
    required this.onProfile,
    super.key,
  });
  final DoctorDiscoveryResult doctor;
  final VoidCallback onProfile;
  @override
  Widget build(BuildContext context) => Semantics(
    container: true,
    button: true,
    label: '${doctor.doctorDisplayName}, ${doctor.primarySpecialtyDisplayName}',
    child: SaxlemCard(
      elevation: SaxlemCardElevation.low,
      padding: const EdgeInsetsDirectional.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundImage: doctor.photoUrl == null
                    ? null
                    : NetworkImage(doctor.photoUrl!),
                child: doctor.photoUrl == null
                    ? const Icon(Icons.person_rounded, size: 34)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor.doctorDisplayName,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(doctor.primarySpecialtyDisplayName),
                    if (doctor.clinics.isNotEmpty)
                      Text(
                        doctor.clinics.map((clinic) => clinic.name).join(', '),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              _Info(
                Icons.work_history_outlined,
                '${doctor.yearsOfExperience} years experience',
              ),
              if (doctor.languages.isNotEmpty)
                _Info(Icons.language_rounded, doctor.languages.join(', ')),
              _Info(
                Icons.event_available_outlined,
                doctor.availability.acceptingNewPatients
                    ? 'Accepting new patients'
                    : 'Not accepting new patients',
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onProfile,
              child: const Text('View profile'),
            ),
          ),
        ],
      ),
    ),
  );
}

class _Info extends StatelessWidget {
  const _Info(this.icon, this.text);
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 17),
      const SizedBox(width: 4),
      Text(text, style: Theme.of(context).textTheme.bodySmall),
    ],
  );
}

import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/doctor_reference.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../../design_system/design_system.dart';
import '../../../appointments/domain/entities/patient_appointment.dart';
import '../../../appointments/domain/repositories/patient_appointments_repository.dart';
import '../../../discover/presentation/widgets/doctor_result_card.dart';

/// "Book again": doctors this patient has seen in the last year, most
/// recent first. Quietly absent until there is someone to show.
class RecentDoctorsStrip extends StatefulWidget {
  const RecentDoctorsStrip({
    required this.repository,
    required this.profileId,
    required this.onBook,
    this.onFound,
    this.now = DateTime.now,
    super.key,
  });

  /// Called once this finds something to show (the patient has booked before).
  final VoidCallback? onFound;
  final PatientAppointmentsRepository repository;
  final PatientProfileId profileId;
  final ValueChanged<DoctorReference> onBook;
  final DateTime Function() now;

  @override
  State<RecentDoctorsStrip> createState() => _RecentDoctorsStripState();
}

class _RecentDoctorsStripState extends State<RecentDoctorsStrip> {
  List<DoctorReference> _doctors = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(RecentDoctorsStrip old) {
    super.didUpdateWidget(old);
    if (old.profileId != widget.profileId) _load();
  }

  Future<void> _load() async {
    final now = widget.now();
    try {
      final page = await widget.repository.list(
        AppointmentListRequest(
          profileId: widget.profileId,
          from: now.subtract(const Duration(days: 365)),
          to: now,
          status: PatientAppointmentStatus.completed,
          pageSize: 20,
        ),
      );
      final seen = <String>{};
      final doctors = [
        for (final item in [
          ...page.items,
        ]..sort((a, b) => b.startsAt.compareTo(a.startsAt)))
          if (seen.add(item.doctor.id)) item.doctor,
      ].take(6).toList();
      if (mounted) setState(() => _doctors = doctors);
      if (doctors.isNotEmpty) widget.onFound?.call();
    } catch (_) {
      if (mounted) setState(() => _doctors = const []);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_doctors.isEmpty) return const SizedBox.shrink();
    final strings = context.l10n;
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    return Padding(
      padding: const EdgeInsetsDirectional.only(top: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            header: true,
            child: Text(
              strings.bookAgainTitle,
              style: theme.textTheme.titleMedium,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 144,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _doctors.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final doctor = _doctors[index];
                return SizedBox(
                  width: 168,
                  child: SaxlemCard(
                    onTap: () => widget.onBook(doctor),
                    semanticLabel: strings.bookAgainAction(doctor.displayName),
                    padding: const EdgeInsets.all(14),
                    child: ExcludeSemantics(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SaxlemAvatar(
                            size: 40,
                            ring: true,
                            imageUrl: doctor.photoUrl,
                            initials: doctorInitials(doctor.displayName),
                            semanticLabel: doctor.displayName,
                          ),
                          const Spacer(),
                          Text(
                            doctor.displayName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleSmall,
                          ),
                          Text(
                            strings.bookAgainTitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: colors.brandPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../../domain/entities/discovery_types.dart';
import '../discover_copy.dart';
import '../../../booking/booking_feature.dart';
import '../../../booking/domain/entities/booking_doctor_reference.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/components/layout/saxlem_responsive_content.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';

class DoctorDetailsPage extends StatelessWidget {
  const DoctorDetailsPage({
    required this.doctor,
    this.bookingEmphasized = false,
    this.onOpenAppointments,
    this.guestMode = false,
    this.profilesController,
    super.key,
  });
  final DoctorDiscoveryResult doctor;
  final bool bookingEmphasized;
  final VoidCallback? onOpenAppointments;
  final bool guestMode;
  final PatientProfilesController? profilesController;
  @override
  Widget build(BuildContext context) {
    const copy = DiscoverCopy();
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(context.l10n.doctorProfile)),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsetsDirectional.only(top: 20, bottom: 36),
          child: SaxlemResponsiveContent(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundColor: Theme.of(
                    context,
                  ).colorScheme.primaryContainer,
                  child: Icon(
                    Icons.person_rounded,
                    size: 54,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  doctor.doctorDisplayName,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  '${copy.specialty(doctor.specialty)} · ${doctor.subSpecialtyDisplayName}',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                _Panel(
                  children: [
                    _row('Clinic', doctor.clinicDisplayName),
                    _row(
                      'Location',
                      '${doctor.location.areaDisplayName}, ${doctor.location.cityDisplayName}',
                    ),
                    _row(
                      'Availability',
                      copy.availability(doctor.availability.status),
                    ),
                    _row('Consultation', copy.fee(doctor.consultationFeeIqd)),
                    _row(
                      'Patient rating',
                      '${doctor.patientRating.toStringAsFixed(1)} from ${doctor.totalRatings} ratings',
                    ),
                    _row('Written reviews', '${doctor.totalReviews}'),
                  ],
                ),
                const SizedBox(height: 18),
                _Panel(
                  children: [
                    Text(
                      'About this profile',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      context.l10n.findRightCareBody,
                      style: TextStyle(height: 1.5),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed:
                      doctor.availability.status ==
                          AvailabilityStatus.fullyBooked
                      ? null
                      : guestMode
                      ? () => ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(context.l10n.personalizedFeatureBody),
                          ),
                        )
                      : () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => BookingFeature(
                              doctor: BookingDoctorReference(
                                id: doctor.doctorId,
                                displayName: doctor.doctorDisplayName,
                                specialtyDisplayName: copy.specialty(
                                  doctor.specialty,
                                ),
                                photoUrl: doctor.photoUrl,
                              ),
                              onOpenAppointments: onOpenAppointments,
                              profilesController: profilesController,
                            ),
                          ),
                        ),
                  child: Text(
                    bookingEmphasized
                        ? context.l10n.chooseAppointment
                        : context.l10n.bookAppointment,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static Widget _row(String label, String value) => Padding(
    padding: const EdgeInsetsDirectional.symmetric(vertical: 7),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label)),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsetsDirectional.all(18),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surface,
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
    ),
  );
}

import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../../domain/entities/discovery_types.dart';
import '../discover_copy.dart';
import '../../../booking/booking_feature.dart';
import '../../../booking/domain/entities/booking_doctor_reference.dart';

class DoctorDetailsPage extends StatelessWidget {
  const DoctorDetailsPage({
    required this.doctor,
    this.bookingEmphasized = false,
    super.key,
  });
  final DoctorDiscoveryResult doctor;
  final bool bookingEmphasized;
  @override
  Widget build(BuildContext context) {
    const copy = DiscoverCopy();
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Doctor Profile')),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsetsDirectional.fromSTEB(24, 20, 24, 36),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              CircleAvatar(
                radius: 48,
                backgroundColor: Theme.of(context).colorScheme.primaryContainer,
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
                  const Text(
                    'This permanent profile foundation will support qualifications, services, clinic schedules, reviews, and booking as those capabilities are delivered.',
                    style: TextStyle(height: 1.5),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed:
                    doctor.availability.status == AvailabilityStatus.fullyBooked
                    ? null
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
                          ),
                        ),
                      ),
                child: Text(
                  bookingEmphasized
                      ? 'Choose an appointment'
                      : 'Book appointment',
                ),
              ),
            ],
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

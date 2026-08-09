import 'package:flutter/material.dart';
import '../discover/discover_feature.dart';
import 'domain/repositories/patient_appointments_repository.dart';
import 'presentation/controllers/appointments_controller.dart';
import 'presentation/pages/appointments_page.dart';
import '../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../core/models/patient_profile.dart';
import '../discover/domain/repositories/doctor_discovery_repository.dart';
import '../discover/data/repositories/unavailable_doctor_discovery_repository.dart';
import '../booking/domain/repositories/booking_repository.dart';
import '../booking/data/repositories/backend_booking_repository.dart';

class AppointmentsFeature extends StatefulWidget {
  const AppointmentsFeature({
    required this.repository,
    this.bookingRepository = const UnavailableBookingRepository(),
    this.onOpenDiscover,
    this.profilesController,
    this.doctorDiscoveryRepository =
        const UnavailableDoctorDiscoveryRepository(),
    this.onAuthenticationRequired,
    super.key,
  });
  final PatientAppointmentsRepository repository;
  final BookingRepository bookingRepository;
  final VoidCallback? onOpenDiscover;
  final PatientProfilesController? profilesController;
  final DoctorDiscoveryRepository doctorDiscoveryRepository;
  final Future<void> Function()? onAuthenticationRequired;
  @override
  State<AppointmentsFeature> createState() => _AppointmentsFeatureState();
}

class _AppointmentsFeatureState extends State<AppointmentsFeature> {
  late final AppointmentsController controller;
  @override
  void initState() {
    super.initState();
    controller = AppointmentsController(widget.repository)
      ..load(widget.profilesController?.activeProfileId ?? PatientProfileId.me);
    widget.profilesController?.addListener(_profileChanged);
  }

  void _profileChanged() =>
      controller.load(widget.profilesController!.activeProfileId);

  @override
  void dispose() {
    widget.profilesController?.removeListener(_profileChanged);
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AppointmentsPage(
    controller: controller,
    profilesController: widget.profilesController,
    repository: widget.repository,
    bookingRepository: widget.bookingRepository,
    onAppointmentsChanged: () => controller.load(
      widget.profilesController?.activeProfileId ?? PatientProfileId.me,
    ),
    onDiscover:
        widget.onOpenDiscover ??
        () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => Scaffold(
              body: SafeArea(
                child: DiscoverFeature(
                  repository: widget.doctorDiscoveryRepository,
                  onAuthenticationRequired: widget.onAuthenticationRequired,
                ),
              ),
            ),
          ),
        ),
  );
}

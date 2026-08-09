import 'package:flutter/material.dart';
import '../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import 'domain/entities/doctor_search_criteria.dart';
import 'domain/repositories/doctor_discovery_repository.dart';
import 'data/repositories/unavailable_doctor_discovery_repository.dart';
import 'presentation/controllers/discover_controller.dart';
import 'presentation/pages/discover_page.dart';
import '../booking/domain/repositories/booking_repository.dart';
import '../booking/data/repositories/backend_booking_repository.dart';

class DiscoverFeature extends StatefulWidget {
  const DiscoverFeature({
    this.repository = const UnavailableDoctorDiscoveryRepository(),
    this.initialCriteria,
    this.focusSearch = false,
    this.openFilters = false,
    this.onOpenAppointments,
    this.guestMode = false,
    this.profilesController,
    this.onAuthenticationRequired,
    this.bookingRepository = const UnavailableBookingRepository(),
    super.key,
  });
  final DoctorDiscoveryRepository repository;
  final DoctorSearchCriteria? initialCriteria;
  final bool focusSearch;
  final bool openFilters;
  final VoidCallback? onOpenAppointments;
  final bool guestMode;
  final PatientProfilesController? profilesController;
  final Future<void> Function()? onAuthenticationRequired;
  final BookingRepository bookingRepository;
  @override
  State<DiscoverFeature> createState() => _DiscoverFeatureState();
}

class _DiscoverFeatureState extends State<DiscoverFeature> {
  late final DiscoverController controller;
  @override
  void initState() {
    super.initState();
    controller = DiscoverController(widget.repository, guest: widget.guestMode)
      ..load(withCriteria: widget.initialCriteria);
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => DiscoverPage(
    controller: controller,
    focusSearch: widget.focusSearch,
    openFilters: widget.openFilters,
    onOpenAppointments: widget.onOpenAppointments,
    guestMode: widget.guestMode,
    profilesController: widget.profilesController,
    onAuthenticationRequired: widget.onAuthenticationRequired,
    bookingRepository: widget.bookingRepository,
  );
}

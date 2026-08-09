import 'package:flutter/material.dart';
import 'domain/entities/booking_doctor_reference.dart';
import 'domain/repositories/booking_repository.dart';
import 'domain/services/booking_operation_id.dart';
import 'presentation/controllers/booking_controller.dart';
import 'presentation/pages/booking_flow_page.dart';
import '../family_profiles/presentation/controllers/patient_profiles_controller.dart';

class BookingFeature extends StatefulWidget {
  const BookingFeature({
    required this.doctor,
    required this.repository,
    required this.profilesController,
    super.key,
  });
  final BookingDoctorReference doctor;
  final BookingRepository repository;
  final PatientProfilesController profilesController;
  @override
  State<BookingFeature> createState() => _BookingFeatureState();
}

class _BookingFeatureState extends State<BookingFeature> {
  late final BookingController controller;
  @override
  void initState() {
    super.initState();
    controller = BookingController(
      doctor: widget.doctor,
      repository: widget.repository,
      operationIds: SecureBookingOperationIdGenerator(),
      profileId: widget.profilesController.activeProfileId,
    )..load();
    widget.profilesController.addListener(_profileChanged);
  }

  void _profileChanged() =>
      controller.selectProfile(widget.profilesController.activeProfileId);

  @override
  void dispose() {
    widget.profilesController.removeListener(_profileChanged);
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => BookingFlowPage(
    controller: controller,
    profilesController: widget.profilesController,
    onViewDoctor: () => Navigator.pop(context),
    onReturnHome: () => Navigator.popUntil(context, (route) => route.isFirst),
  );
}

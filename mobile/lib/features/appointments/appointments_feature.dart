import 'package:flutter/material.dart';
import '../discover/discover_feature.dart';
import 'data/repositories/in_memory_patient_appointments_repository.dart';
import 'domain/repositories/patient_appointments_repository.dart';
import 'presentation/controllers/appointments_controller.dart';
import 'presentation/pages/appointments_page.dart';
import '../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../core/models/patient_profile.dart';

class AppointmentsFeature extends StatefulWidget {
  const AppointmentsFeature({
    this.repository,
    this.onOpenDiscover,
    this.profilesController,
    super.key,
  });
  final PatientAppointmentsRepository? repository;
  final VoidCallback? onOpenDiscover;
  final PatientProfilesController? profilesController;
  @override
  State<AppointmentsFeature> createState() => _AppointmentsFeatureState();
}

class _AppointmentsFeatureState extends State<AppointmentsFeature> {
  late final AppointmentsController controller;
  @override
  void initState() {
    super.initState();
    controller = AppointmentsController(
      widget.repository ?? InMemoryPatientAppointmentsRepository.shared,
    )..load(widget.profilesController?.activeProfileId ?? PatientProfileId.me);
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
    onDiscover:
        widget.onOpenDiscover ??
        () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) =>
                const Scaffold(body: SafeArea(child: DiscoverFeature())),
          ),
        ),
  );
}

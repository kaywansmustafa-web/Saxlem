import 'package:flutter/material.dart';
import '../discover/discover_feature.dart';
import 'data/repositories/in_memory_patient_appointments_repository.dart';
import 'domain/repositories/patient_appointments_repository.dart';
import 'presentation/controllers/appointments_controller.dart';
import 'presentation/pages/appointments_page.dart';

class AppointmentsFeature extends StatefulWidget {
  const AppointmentsFeature({this.repository, this.onOpenDiscover, super.key});
  final PatientAppointmentsRepository? repository;
  final VoidCallback? onOpenDiscover;
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
    )..load();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AppointmentsPage(
    controller: controller,
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

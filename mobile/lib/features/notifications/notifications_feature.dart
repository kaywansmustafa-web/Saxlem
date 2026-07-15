import 'package:flutter/material.dart';
import 'presentation/controllers/notifications_controller.dart';
import 'presentation/pages/notifications_page.dart';
import '../family_profiles/presentation/controllers/patient_profiles_controller.dart';

class NotificationsFeature extends StatelessWidget {
  const NotificationsFeature({
    required this.controller,
    this.profilesController,
    super.key,
  });
  final NotificationsController controller;
  final PatientProfilesController? profilesController;
  @override
  Widget build(BuildContext context) => NotificationsPage(
    controller: controller,
    profilesController: profilesController,
  );
}

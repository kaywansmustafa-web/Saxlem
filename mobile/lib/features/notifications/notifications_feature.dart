import 'package:flutter/material.dart';
import 'presentation/controllers/notifications_controller.dart';
import 'presentation/pages/notifications_page.dart';

class NotificationsFeature extends StatelessWidget {
  const NotificationsFeature({required this.controller, super.key});
  final NotificationsController controller;
  @override
  Widget build(BuildContext context) =>
      NotificationsPage(controller: controller);
}

import 'package:flutter/material.dart';
import 'domain/repositories/live_queue_repository.dart';
import 'presentation/controllers/live_queue_controller.dart';
import 'presentation/pages/live_queue_page.dart';

class LiveQueueFeature extends StatefulWidget {
  const LiveQueueFeature({
    required this.appointmentId,
    required this.repository,
    super.key,
  });
  final String appointmentId;
  final LiveQueueRepository repository;
  @override
  State<LiveQueueFeature> createState() => _State();
}

class _State extends State<LiveQueueFeature> {
  late final LiveQueueController controller;
  @override
  void initState() {
    super.initState();
    controller = LiveQueueController(
      appointmentId: widget.appointmentId,
      repository: widget.repository,
    )..load();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => LiveQueuePage(controller: controller);
}

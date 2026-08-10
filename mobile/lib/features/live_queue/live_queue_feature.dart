import 'package:flutter/material.dart';
import 'dart:async';
import 'domain/repositories/live_queue_repository.dart';
import 'presentation/controllers/live_queue_controller.dart';
import 'presentation/pages/live_queue_page.dart';
import '../notifications/domain/entities/notification_page.dart';

class LiveQueueFeature extends StatefulWidget {
  const LiveQueueFeature({
    required this.appointmentId,
    required this.repository,
    this.notificationSignals,
    super.key,
  });
  final String appointmentId;
  final LiveQueueRepository repository;
  final Stream<NotificationSignal>? notificationSignals;
  @override
  State<LiveQueueFeature> createState() => _State();
}

class _State extends State<LiveQueueFeature> {
  late final LiveQueueController controller;
  StreamSubscription<NotificationSignal>? subscription;
  Timer? debounce;
  @override
  void initState() {
    super.initState();
    controller = LiveQueueController(
      appointmentId: widget.appointmentId,
      repository: widget.repository,
    )..load();
    subscription = widget.notificationSignals?.listen((_) {
      debounce?.cancel();
      debounce = Timer(const Duration(milliseconds: 300), controller.load);
    }, onError: (_) => controller.invalidate());
  }

  @override
  void dispose() {
    debounce?.cancel();
    subscription?.cancel();
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => LiveQueuePage(controller: controller);
}

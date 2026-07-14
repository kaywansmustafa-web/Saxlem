import 'package:flutter/material.dart';

import 'data/data_sources/mock_live_queue_data_source.dart';
import 'data/mappers/patient_queue_snapshot_mapper.dart';
import 'data/repositories/live_queue_repository_impl.dart';
import 'domain/services/queue_guidance_service.dart';
import 'domain/use_cases/perform_queue_action.dart';
import 'domain/use_cases/watch_patient_queue.dart';
import 'presentation/controllers/live_queue_controller.dart';
import 'presentation/pages/live_queue_page.dart';

class LiveQueueFeature extends StatefulWidget {
  const LiveQueueFeature({required this.queueEntryId, super.key});
  final String queueEntryId;

  @override
  State<LiveQueueFeature> createState() => _LiveQueueFeatureState();
}

class _LiveQueueFeatureState extends State<LiveQueueFeature> {
  late final LiveQueueController _controller;

  @override
  void initState() {
    super.initState();
    final repository = LiveQueueRepositoryImpl(
      MockLiveQueueDataSource(),
      const PatientQueueSnapshotMapper(RuleBasedQueueGuidanceService()),
    );
    _controller = LiveQueueController(
      queueEntryId: widget.queueEntryId,
      watchQueue: WatchPatientQueue(repository),
      performAction: PerformQueueAction(repository),
      repository: repository,
    )..load();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => LiveQueuePage(controller: _controller);
}

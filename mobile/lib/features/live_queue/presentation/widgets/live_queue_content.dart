import 'package:flutter/material.dart';

import '../../domain/entities/patient_queue_snapshot.dart';
import '../../domain/entities/queue_types.dart';
import '../live_queue_copy.dart';
import 'connection_status_banner.dart';
import 'live_queue_actions.dart';
import 'live_queue_estimate_card.dart';
import 'live_queue_header.dart';
import 'live_queue_position_card.dart';
import 'live_queue_session_message.dart';
import 'queue_status_indicator.dart';

class LiveQueueContent extends StatelessWidget {
  const LiveQueueContent({
    required this.snapshot,
    required this.copy,
    required this.onAction,
    this.connectionStatus,
    this.pendingAction,
    this.feedbackMessage,
    super.key,
  });

  final PatientQueueSnapshot snapshot;
  final LiveQueueCopy copy;
  final ValueChanged<PatientQueueAction> onAction;
  final QueueConnectionStatus? connectionStatus;
  final PatientQueueAction? pendingAction;
  final String? feedbackMessage;

  @override
  Widget build(BuildContext context) {
    final isInactive = snapshot.sessionStatus != QueueSessionStatus.open;
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.fromSTEB(24, 12, 24, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (connectionStatus case final status?) ...[
            ConnectionStatusBanner(status: status),
            const SizedBox(height: 20),
          ],
          Row(
            children: [
              Expanded(
                child: QueueStatusIndicator(status: snapshot.sessionStatus),
              ),
            ],
          ),
          const SizedBox(height: 22),
          LiveQueueHeader(snapshot: snapshot),
          const SizedBox(height: 24),
          LiveQueuePositionCard(snapshot: snapshot, copy: copy),
          const SizedBox(height: 16),
          LiveQueueEstimateCard(snapshot: snapshot, copy: copy),
          if (isInactive) ...[
            const SizedBox(height: 16),
            LiveQueueSessionMessage(status: snapshot.sessionStatus),
          ],
          if (feedbackMessage case final message?) ...[
            const SizedBox(height: 16),
            Semantics(
              liveRegion: true,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsetsDirectional.all(14),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(message),
              ),
            ),
          ],
          const SizedBox(height: 24),
          LiveQueueActions(
            allowedActions: snapshot.allowedActions,
            copy: copy,
            pendingAction: pendingAction,
            onAction: onAction,
          ),
        ],
      ),
    );
  }
}

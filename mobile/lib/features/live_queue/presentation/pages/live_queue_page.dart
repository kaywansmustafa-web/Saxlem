import 'package:flutter/material.dart';

import '../../../../config/theme/app_colors.dart';
import '../../domain/entities/queue_types.dart';
import '../controllers/live_queue_controller.dart';
import '../live_queue_copy.dart';
import '../state/live_queue_state.dart';
import '../widgets/live_queue_content.dart';
import '../widgets/live_queue_failure_view.dart';
import '../widgets/live_queue_loading_view.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/widgets/patient_selector.dart';
import '../../../../core/localization/localization_extensions.dart';

class LiveQueuePage extends StatelessWidget {
  const LiveQueuePage({
    required this.controller,
    this.copy = const LiveQueueCopy(),
    this.profilesController,
    super.key,
  });

  final LiveQueueController controller;
  final LiveQueueCopy copy;
  final PatientProfilesController? profilesController;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(copy.pageTitle)),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            if (profilesController != null)
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(24, 12, 24, 0),
                child: PatientSelector(
                  controller: profilesController!,
                  label: context.l10n.currentPatient,
                ),
              ),
            Expanded(
              child: ListenableBuilder(
                listenable: controller,
                builder: (context, _) => AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  child: _bodyFor(controller.state),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bodyFor(LiveQueueState state) {
    return switch (state) {
      LiveQueueInitial() || LiveQueueLoading() => const LiveQueueLoadingView(
        key: ValueKey('loading'),
      ),
      LiveQueueFailure(:final message, :final value) when value == null =>
        LiveQueueFailureView(
          key: const ValueKey('failure'),
          message: message,
          retryLabel: copy.retry,
          onRetry: controller.retry,
        ),
      LiveQueueActionPending(:final value, :final action) => LiveQueueContent(
        key: const ValueKey('content'),
        snapshot: value,
        copy: copy,
        pendingAction: action,
        onAction: controller.perform,
      ),
      LiveQueueReconnecting(:final value) => LiveQueueContent(
        key: const ValueKey('content'),
        snapshot: value,
        copy: copy,
        connectionStatus: QueueConnectionStatus.reconnecting,
        onAction: controller.perform,
      ),
      LiveQueueStale(:final value) => LiveQueueContent(
        key: const ValueKey('content'),
        snapshot: value,
        copy: copy,
        connectionStatus: QueueConnectionStatus.stale,
        onAction: controller.perform,
      ),
      LiveQueueOffline(:final value) when value != null => LiveQueueContent(
        key: const ValueKey('content'),
        snapshot: value,
        copy: copy,
        connectionStatus: QueueConnectionStatus.offline,
        onAction: controller.perform,
      ),
      LiveQueueOffline() => LiveQueueFailureView(
        key: const ValueKey('offline-empty'),
        message: 'You are offline and no saved queue update is available.',
        retryLabel: copy.retry,
        onRetry: controller.retry,
      ),
      LiveQueuePaused(:final value) ||
      LiveQueueClosed(:final value) => LiveQueueContent(
        key: const ValueKey('content'),
        snapshot: value,
        copy: copy,
        onAction: controller.perform,
      ),
      LiveQueueFailure(:final message, :final value) => LiveQueueContent(
        key: const ValueKey('content'),
        snapshot: value!,
        copy: copy,
        feedbackMessage: message,
        onAction: controller.perform,
      ),
      LiveQueueLive(:final value, :final feedbackMessage) => LiveQueueContent(
        key: const ValueKey('content'),
        snapshot: value,
        copy: copy,
        feedbackMessage: feedbackMessage,
        onAction: controller.perform,
      ),
    };
  }
}

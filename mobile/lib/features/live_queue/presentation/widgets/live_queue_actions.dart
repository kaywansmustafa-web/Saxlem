import 'package:flutter/material.dart';

import '../../domain/entities/queue_types.dart';
import '../live_queue_copy.dart';

class LiveQueueActions extends StatelessWidget {
  const LiveQueueActions({
    required this.allowedActions,
    required this.copy,
    required this.onAction,
    this.pendingAction,
    super.key,
  });

  final Set<PatientQueueAction> allowedActions;
  final LiveQueueCopy copy;
  final ValueChanged<PatientQueueAction> onAction;
  final PatientQueueAction? pendingAction;

  @override
  Widget build(BuildContext context) {
    final primary = [
      PatientQueueAction.onMyWay,
      PatientQueueAction.arrived,
      PatientQueueAction.runningLate,
    ].where(allowedActions.contains).toList();
    final secondary = [
      PatientQueueAction.requestHelp,
      PatientQueueAction.cancel,
    ].where(allowedActions.contains).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final action in primary) ...[
          Semantics(
            button: true,
            label: _label(action),
            child: FilledButton(
              onPressed: pendingAction == null ? () => onAction(action) : null,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                child: pendingAction == action
                    ? const SizedBox(
                        key: ValueKey('pending'),
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(_label(action), key: ValueKey(action)),
              ),
            ),
          ),
          const SizedBox(height: 10),
        ],
        if (secondary.isNotEmpty)
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 4,
            children: secondary
                .map(
                  (action) => TextButton(
                    onPressed: pendingAction == null
                        ? () => onAction(action)
                        : null,
                    child: Text(_label(action)),
                  ),
                )
                .toList(),
          ),
      ],
    );
  }

  String _label(PatientQueueAction action) => switch (action) {
    PatientQueueAction.onMyWay => copy.onMyWay,
    PatientQueueAction.arrived => copy.arrived,
    PatientQueueAction.runningLate => copy.runningLate,
    PatientQueueAction.cancel => copy.cancel,
    PatientQueueAction.requestHelp => copy.requestHelp,
  };
}

import 'package:flutter/material.dart';

import '../../domain/entities/patient_queue_snapshot.dart';

class LiveQueueHeader extends StatelessWidget {
  const LiveQueueHeader({required this.snapshot, super.key});
  final PatientQueueSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      header: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            snapshot.careProviderDisplayName,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            snapshot.serviceDisplayName,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          Semantics(
            liveRegion: true,
            label: snapshot.guidanceMessage,
            child: Text(
              snapshot.guidanceMessage,
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w600,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

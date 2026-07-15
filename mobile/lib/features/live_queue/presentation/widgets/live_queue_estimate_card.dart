import 'package:flutter/material.dart';

import '../../domain/entities/patient_queue_snapshot.dart';
import '../live_queue_copy.dart';
import '../../../../design_system/components/content/saxlem_card.dart';
import '../../../../design_system/foundations/saxlem_motion.dart';
import '../../../../design_system/foundations/saxlem_typography.dart';

class LiveQueueEstimateCard extends StatelessWidget {
  const LiveQueueEstimateCard({
    required this.snapshot,
    required this.copy,
    super.key,
  });
  final PatientQueueSnapshot snapshot;
  final LiveQueueCopy copy;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final status = copy.doctorStatusFor(snapshot.doctorTimingMinutes);
    final confidence = copy.confidenceLabel(snapshot.estimateConfidence);
    return Semantics(
      container: true,
      label:
          '${copy.estimatedWait} ${snapshot.estimatedWaitLowerMinutes} to '
          '${snapshot.estimatedWaitUpperMinutes} minutes. '
          '${copy.estimateConfidence}: $confidence. '
          '${copy.doctorStatus}: $status.',
      child: SaxlemCard(
        padding: const EdgeInsetsDirectional.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(copy.estimatedWait, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 5),
            AnimatedSwitcher(
              duration: SaxlemMotion.standard,
              child: Text(
                '${snapshot.estimatedWaitLowerMinutes}–${snapshot.estimatedWaitUpperMinutes} min',
                key: ValueKey(
                  '${snapshot.estimatedWaitLowerMinutes}-${snapshot.estimatedWaitUpperMinutes}',
                ),
                style: SaxlemTypography.numeric(context, emphasized: true),
              ),
            ),
            const SizedBox(height: 18),
            _Detail(
              icon: Icons.verified_outlined,
              label: copy.estimateConfidence,
              value: confidence,
            ),
            const SizedBox(height: 12),
            _Detail(
              icon: Icons.schedule_rounded,
              label: copy.doctorStatus,
              value: status,
            ),
            const SizedBox(height: 12),
            _Detail(
              icon: Icons.sync_rounded,
              label: '',
              value: copy.relativeUpdateFor(
                snapshot.lastUpdatedAt,
                DateTime.now(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Detail extends StatelessWidget {
  const _Detail({required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
      const SizedBox(width: 10),
      Expanded(
        child: Text(
          label.isEmpty ? value : '$label · $value',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.4),
        ),
      ),
    ],
  );
}

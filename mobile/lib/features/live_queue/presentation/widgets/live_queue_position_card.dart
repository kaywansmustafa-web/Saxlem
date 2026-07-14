import 'package:flutter/material.dart';

import '../../domain/entities/patient_queue_snapshot.dart';
import '../live_queue_copy.dart';

class LiveQueuePositionCard extends StatelessWidget {
  const LiveQueuePositionCard({
    required this.snapshot,
    required this.copy,
    super.key,
  });
  final PatientQueueSnapshot snapshot;
  final LiveQueueCopy copy;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Semantics(
      container: true,
      label:
          '${copy.currentPatient} ${snapshot.anonymousCurrentToken ?? 'not available'}. '
          '${copy.yourNumber} ${snapshot.patientNumber}. '
          '${snapshot.patientsAhead} ${copy.patientsAhead}.',
      child: Container(
        padding: const EdgeInsetsDirectional.all(20),
        decoration: BoxDecoration(
          color: colors.primary,
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: colors.primary.withValues(alpha: 0.18),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: _Number(
                    label: copy.currentPatient,
                    value: snapshot.anonymousCurrentToken ?? '—',
                  ),
                ),
                Container(
                  width: 1,
                  height: 70,
                  color: colors.onPrimary.withValues(alpha: 0.22),
                ),
                Expanded(
                  child: _Number(
                    label: copy.yourNumber,
                    value: snapshot.patientNumber,
                    emphasized: true,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsetsDirectional.symmetric(
                horizontal: 14,
                vertical: 12,
              ),
              decoration: BoxDecoration(
                color: colors.onPrimary.withValues(alpha: 0.11),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                '${snapshot.patientsAhead} ${copy.patientsAhead.toLowerCase()}',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: colors.onPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Number extends StatelessWidget {
  const _Number({
    required this.label,
    required this.value,
    this.emphasized = false,
  });
  final String label;
  final String value;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.onPrimary;
    return Column(
      children: [
        Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(color: color.withValues(alpha: 0.75)),
        ),
        const SizedBox(height: 5),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: Text(
            value,
            key: ValueKey(value),
            style: TextStyle(
              color: color,
              fontSize: emphasized ? 38 : 34,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    );
  }
}

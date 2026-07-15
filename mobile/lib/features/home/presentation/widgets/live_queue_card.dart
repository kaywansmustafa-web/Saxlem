import 'package:flutter/material.dart';

import '../../../live_queue/domain/entities/patient_queue_snapshot.dart';
import '../../../../design_system/components/content/saxlem_card.dart';

class LiveQueueLabels {
  const LiveQueueLabels({
    required this.title,
    required this.live,
    required this.currentPatient,
    required this.youAre,
    required this.patientsAhead,
    required this.estimatedWait,
    required this.doctorDelay,
    required this.minutes,
    required this.action,
    required this.semanticSummary,
  });

  final String title;
  final String live;
  final String currentPatient;
  final String youAre;
  final String patientsAhead;
  final String estimatedWait;
  final String doctorDelay;
  final String minutes;
  final String action;
  final String semanticSummary;
}

class LiveQueueCard extends StatelessWidget {
  const LiveQueueCard({
    required this.queue,
    required this.labels,
    this.onActionPressed,
    super.key,
  });

  final PatientQueueSnapshot queue;
  final LiveQueueLabels labels;
  final VoidCallback? onActionPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return Semantics(
      container: true,
      label: labels.semanticSummary,
      child: SaxlemCard(
        backgroundColor: colors.primary,
        borderColor: Colors.transparent,
        elevation: SaxlemCardElevation.medium,
        radius: 28,
        padding: const EdgeInsetsDirectional.fromSTEB(20, 20, 20, 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _QueueHeader(queue: queue, labels: labels),
            const SizedBox(height: 20),
            _QueueNumbers(queue: queue, labels: labels),
            const SizedBox(height: 16),
            _QueueMetrics(queue: queue, labels: labels),
            const SizedBox(height: 18),
            Semantics(
              button: true,
              label: labels.action,
              child: FilledButton(
                onPressed: onActionPressed,
                style: FilledButton.styleFrom(
                  backgroundColor: colors.surface,
                  foregroundColor: colors.primary,
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Text(labels.action),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QueueHeader extends StatelessWidget {
  const _QueueHeader({required this.queue, required this.labels});

  final PatientQueueSnapshot queue;
  final LiveQueueLabels labels;

  @override
  Widget build(BuildContext context) {
    final onPrimary = Theme.of(context).colorScheme.onPrimary;
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      labels.title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: onPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 9,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: onPrimary.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: Text(
                      labels.live,
                      style: TextStyle(
                        color: onPrimary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 5),
              Text(
                '${queue.careProviderDisplayName} · ${queue.serviceDisplayName}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: onPrimary.withValues(alpha: 0.76)),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Icon(Icons.podcasts_rounded, color: onPrimary),
      ],
    );
  }
}

class _QueueNumbers extends StatelessWidget {
  const _QueueNumbers({required this.queue, required this.labels});

  final PatientQueueSnapshot queue;
  final LiveQueueLabels labels;

  @override
  Widget build(BuildContext context) {
    final onPrimary = Theme.of(context).colorScheme.onPrimary;
    return Row(
      children: [
        Expanded(
          child: _QueueNumber(
            label: labels.currentPatient,
            value: queue.anonymousCurrentToken ?? '—',
            color: onPrimary,
          ),
        ),
        Container(
          width: 1,
          height: 54,
          color: onPrimary.withValues(alpha: 0.2),
        ),
        Expanded(
          child: _QueueNumber(
            label: labels.youAre,
            value: queue.patientNumber,
            color: onPrimary,
          ),
        ),
      ],
    );
  }
}

class _QueueNumber extends StatelessWidget {
  const _QueueNumber({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Text(label, style: TextStyle(color: color.withValues(alpha: 0.72))),
      const SizedBox(height: 4),
      Text(
        value,
        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
          color: color,
          fontWeight: FontWeight.w800,
        ),
      ),
    ],
  );
}

class _QueueMetrics extends StatelessWidget {
  const _QueueMetrics({required this.queue, required this.labels});

  final PatientQueueSnapshot queue;
  final LiveQueueLabels labels;

  @override
  Widget build(BuildContext context) {
    final entries = [
      (labels.patientsAhead, '${queue.patientsAhead}', Icons.groups_rounded),
      (
        labels.estimatedWait,
        '${queue.estimatedWaitLowerMinutes}–${queue.estimatedWaitUpperMinutes} ${labels.minutes}',
        Icons.schedule_rounded,
      ),
      (
        labels.doctorDelay,
        _doctorStatus(queue.doctorTimingMinutes),
        Icons.history_rounded,
      ),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth >= 380
            ? (constraints.maxWidth - 16) / 3
            : (constraints.maxWidth - 8) / 2;
        return Wrap(
          spacing: 8,
          runSpacing: 8,
          children: entries
              .map(
                (entry) => SizedBox(
                  width: width,
                  child: _QueueMetric(
                    label: entry.$1,
                    value: entry.$2,
                    icon: entry.$3,
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }

  String _doctorStatus(int minutes) {
    if (minutes.abs() <= 2) return 'On time';
    if (minutes > 0) return '$minutes ${labels.minutes} late';
    return '${minutes.abs()} ${labels.minutes} early';
  }
}

class _QueueMetric extends StatelessWidget {
  const _QueueMetric({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.onPrimary;
    return Container(
      padding: const EdgeInsetsDirectional.all(10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color.withValues(alpha: 0.8)),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(color: color, fontWeight: FontWeight.w700),
          ),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: color.withValues(alpha: 0.68),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

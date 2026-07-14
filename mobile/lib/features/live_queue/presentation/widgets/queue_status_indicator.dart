import 'package:flutter/material.dart';

import '../../domain/entities/queue_types.dart';

class QueueStatusIndicator extends StatelessWidget {
  const QueueStatusIndicator({required this.status, super.key});
  final QueueSessionStatus status;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final (label, icon, color) = switch (status) {
      QueueSessionStatus.open => (
        'Queue is live',
        Icons.podcasts_rounded,
        colors.primary,
      ),
      QueueSessionStatus.paused => (
        'Queue is paused',
        Icons.pause_circle_outline_rounded,
        colors.tertiary,
      ),
      QueueSessionStatus.closed => (
        'Queue is closed',
        Icons.check_circle_outline_rounded,
        colors.onSurfaceVariant,
      ),
    };
    return Semantics(
      label: 'Queue status: $label',
      child: Container(
        padding: const EdgeInsetsDirectional.symmetric(
          horizontal: 12,
          vertical: 8,
        ),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 7),
            Flexible(
              child: Text(
                label,
                style: TextStyle(color: color, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

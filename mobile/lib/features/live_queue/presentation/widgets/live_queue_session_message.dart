import 'package:flutter/material.dart';

import '../../domain/entities/queue_types.dart';

class LiveQueueSessionMessage extends StatelessWidget {
  const LiveQueueSessionMessage({required this.status, super.key});
  final QueueSessionStatus status;

  @override
  Widget build(BuildContext context) {
    final (icon, title, message) = status == QueueSessionStatus.paused
        ? (
            Icons.pause_circle_outline_rounded,
            'The queue is temporarily paused',
            "Your place is safe. We'll update you when the queue resumes.",
          )
        : (
            Icons.check_circle_outline_rounded,
            'This queue has closed',
            'For assistance with your appointment, please contact reception.',
          );
    final colors = Theme.of(context).colorScheme;
    return Semantics(
      container: true,
      label: '$title. $message',
      child: Container(
        padding: const EdgeInsetsDirectional.all(18),
        decoration: BoxDecoration(
          color: colors.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(22),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: colors.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: TextStyle(
                      color: colors.onSurfaceVariant,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../../domain/entities/queue_types.dart';

class ConnectionStatusBanner extends StatelessWidget {
  const ConnectionStatusBanner({required this.status, super.key});
  final QueueConnectionStatus status;

  @override
  Widget build(BuildContext context) {
    final (icon, title, message) = switch (status) {
      QueueConnectionStatus.connected => (
        Icons.cloud_done_outlined,
        'Connected',
        'Your queue is live.',
      ),
      QueueConnectionStatus.reconnecting => (
        Icons.sync_rounded,
        'Reconnecting',
        'Showing your latest queue update.',
      ),
      QueueConnectionStatus.stale => (
        Icons.history_rounded,
        'Update delayed',
        'This information may be out of date.',
      ),
      QueueConnectionStatus.offline => (
        Icons.cloud_off_outlined,
        'You are offline',
        'Showing the last queue update saved on this device.',
      ),
    };
    final colors = Theme.of(context).colorScheme;
    return Semantics(
      liveRegion: true,
      label: '$title. $message',
      child: Container(
        width: double.infinity,
        padding: const EdgeInsetsDirectional.all(14),
        decoration: BoxDecoration(
          color: colors.tertiaryContainer,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: colors.onTertiaryContainer),
            const SizedBox(width: 11),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: colors.onTertiaryContainer,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    message,
                    style: TextStyle(color: colors.onTertiaryContainer),
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

import 'package:flutter/material.dart';

import '../../domain/entities/queue_types.dart';
import '../../../../l10n/app_localizations.dart';

class ConnectionStatusBanner extends StatelessWidget {
  const ConnectionStatusBanner({required this.status, super.key});
  final QueueConnectionStatus status;

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context);
    final (icon, title, message) = switch (status) {
      QueueConnectionStatus.connected => (
        Icons.cloud_done_outlined,
        localizations.queueConnectedTitle,
        localizations.queueConnectedBody,
      ),
      QueueConnectionStatus.reconnecting => (
        Icons.sync_rounded,
        localizations.queueReconnectingTitle,
        localizations.queueReconnectingBody,
      ),
      QueueConnectionStatus.stale => (
        Icons.history_rounded,
        localizations.queueDelayedTitle,
        localizations.queueDelayedBody,
      ),
      QueueConnectionStatus.offline => (
        Icons.cloud_off_outlined,
        localizations.queueOfflineTitle,
        localizations.queueOfflineBody,
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

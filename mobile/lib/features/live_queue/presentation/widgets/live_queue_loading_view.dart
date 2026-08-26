import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';

class LiveQueueLoadingView extends StatelessWidget {
  const LiveQueueLoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context);
    return Center(
      child: Semantics(
        liveRegion: true,
        label: localizations.loadingYourLiveQueue,
        child: const Padding(
          padding: EdgeInsetsDirectional.all(48),
          child: CircularProgressIndicator(),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

class LiveQueueLoadingView extends StatelessWidget {
  const LiveQueueLoadingView({super.key});

  @override
  Widget build(BuildContext context) => Center(
    child: Semantics(
      liveRegion: true,
      label: 'Loading your live queue',
      child: const Padding(
        padding: EdgeInsetsDirectional.all(48),
        child: CircularProgressIndicator(),
      ),
    ),
  );
}

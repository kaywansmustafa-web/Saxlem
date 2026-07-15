import 'package:flutter/material.dart';
import '../actions/saxlem_button.dart';
import '../../foundations/saxlem_spacing.dart';

enum SaxlemStateKind {
  empty,
  error,
  offline,
  maintenance,
  success,
  permissionRequired,
}

class SaxlemStateView extends StatelessWidget {
  const SaxlemStateView({
    required this.kind,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
    this.icon,
    super.key,
  });
  final SaxlemStateKind kind;
  final String title, message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Semantics(
    container: true,
    liveRegion:
        kind == SaxlemStateKind.error ||
        kind == SaxlemStateKind.offline ||
        kind == SaxlemStateKind.success,
    label: '$title. $message',
    child: Center(
      child: SingleChildScrollView(
        padding: const EdgeInsetsDirectional.all(SaxlemSpacing.four),
        child: Column(
          children: [
            Icon(icon ?? _icon, size: 56, color: _color(context)),
            const SizedBox(height: SaxlemSpacing.two),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: SaxlemSpacing.one),
            Text(message, textAlign: TextAlign.center),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: SaxlemSpacing.three),
              SaxlemButton(label: actionLabel!, onPressed: onAction),
            ],
          ],
        ),
      ),
    ),
  );

  IconData get _icon => switch (kind) {
    SaxlemStateKind.empty => Icons.inbox_outlined,
    SaxlemStateKind.error => Icons.error_outline_rounded,
    SaxlemStateKind.offline => Icons.cloud_off_outlined,
    SaxlemStateKind.maintenance => Icons.build_outlined,
    SaxlemStateKind.success => Icons.check_circle_outline_rounded,
    SaxlemStateKind.permissionRequired => Icons.lock_outline_rounded,
  };

  Color _color(BuildContext context) => switch (kind) {
    SaxlemStateKind.error => Theme.of(context).colorScheme.error,
    _ => Theme.of(context).colorScheme.primary,
  };
}

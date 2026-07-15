import 'package:flutter/material.dart';

class InformationalPage extends StatelessWidget {
  const InformationalPage({
    required this.title,
    required this.message,
    required this.icon,
    required this.semanticLabel,
    this.actionLabel,
    this.onAction,
    super.key,
  });
  final String title;
  final String message;
  final IconData icon;
  final String semanticLabel;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Semantics(
    container: true,
    label: semanticLabel,
    child: Center(
      child: SingleChildScrollView(
        padding: const EdgeInsetsDirectional.all(32),
        child: Column(
          children: [
            Icon(icon, size: 64, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 20),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            Text(message, textAlign: TextAlign.center),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 24),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    ),
  );
}

import 'package:flutter/material.dart';

import '../../../../design_system/design_system.dart';

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
            Container(
              width: 76,
              height: 76,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: context.saxlemColors.deepAura,
                borderRadius: BorderRadius.circular(26),
                boxShadow: SaxlemElevation.glow(
                  context.saxlemColors.brandPrimary,
                ),
              ),
              child: Icon(icon, size: 34, color: context.saxlemColors.onFill),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 340),
              child: Text(
                message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: context.saxlemColors.textSecondary,
                ),
              ),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 28),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 340),
                child: SaxlemButton(
                  label: actionLabel!,
                  onPressed: onAction,
                  expand: true,
                ),
              ),
            ],
          ],
        ),
      ),
    ),
  );
}

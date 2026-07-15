import 'package:flutter/material.dart';
import '../actions/saxlem_button.dart';

class SaxlemSectionHeader extends StatelessWidget {
  const SaxlemSectionHeader({
    required this.title,
    this.actionLabel,
    this.onAction,
    super.key,
  });
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(
        child: Semantics(
          header: true,
          child: Text(title, style: Theme.of(context).textTheme.titleLarge),
        ),
      ),
      if (actionLabel != null && onAction != null)
        SaxlemButton(
          label: actionLabel!,
          hierarchy: SaxlemButtonHierarchy.tertiary,
          onPressed: onAction,
        ),
    ],
  );
}

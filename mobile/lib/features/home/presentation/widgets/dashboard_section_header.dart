import 'package:flutter/material.dart';
import '../../../../design_system/components/content/saxlem_section_header.dart';

class DashboardSectionHeader extends StatelessWidget {
  const DashboardSectionHeader({
    required this.title,
    this.actionLabel,
    this.onActionPressed,
    super.key,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onActionPressed;

  @override
  Widget build(BuildContext context) => SaxlemSectionHeader(
    title: title,
    actionLabel: actionLabel,
    onAction: onActionPressed,
  );
}

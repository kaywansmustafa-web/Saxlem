import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/components/feedback/saxlem_state_view.dart';

class AppointmentsEmptyState extends StatelessWidget {
  const AppointmentsEmptyState({
    required this.firstTime,
    required this.onDiscover,
    super.key,
  });
  final bool firstTime;
  final VoidCallback onDiscover;
  @override
  Widget build(BuildContext context) => SaxlemStateView(
    kind: SaxlemStateKind.empty,
    icon: Icons.calendar_month_outlined,
    title: firstTime
        ? context.l10n.firstAppointmentTitle
        : context.l10n.emptyAppointmentsTitle,
    message: firstTime
        ? context.l10n.firstAppointmentBody
        : context.l10n.emptyAppointmentsBody,
    actionLabel: context.l10n.discoverDoctors,
    onAction: onDiscover,
  );
}

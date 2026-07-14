import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';

class AppointmentsEmptyState extends StatelessWidget {
  const AppointmentsEmptyState({
    required this.firstTime,
    required this.onDiscover,
    super.key,
  });
  final bool firstTime;
  final VoidCallback onDiscover;
  @override
  Widget build(BuildContext context) => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsetsDirectional.all(32),
      child: Column(
        children: [
          Icon(
            Icons.calendar_month_outlined,
            size: 64,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 18),
          Text(
            firstTime
                ? context.l10n.firstAppointmentTitle
                : context.l10n.emptyAppointmentsTitle,
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            firstTime
                ? context.l10n.firstAppointmentBody
                : context.l10n.emptyAppointmentsBody,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 22),
          FilledButton(
            onPressed: onDiscover,
            child: Text(context.l10n.discoverDoctors),
          ),
        ],
      ),
    ),
  );
}

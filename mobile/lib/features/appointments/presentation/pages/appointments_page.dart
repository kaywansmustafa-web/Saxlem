import 'package:flutter/material.dart';
import '../controllers/appointments_controller.dart';
import '../state/appointments_state.dart';
import '../widgets/appointment_card.dart';
import '../widgets/appointments_empty_state.dart';
import 'appointment_details_page.dart';

class AppointmentsPage extends StatelessWidget {
  const AppointmentsPage({
    required this.controller,
    required this.onDiscover,
    super.key,
  });
  final AppointmentsController controller;
  final VoidCallback onDiscover;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) => switch (controller.state) {
      AppointmentsLoading() => const Center(child: CircularProgressIndicator()),
      AppointmentsFailure(:final message) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: controller.load,
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
      AppointmentsReady() => _ready(
        context,
        controller.state as AppointmentsReady,
      ),
    },
  );

  Widget _ready(BuildContext context, AppointmentsReady state) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(24, 24, 24, 14),
        child: Text(
          'My Appointments',
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
      SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsetsDirectional.symmetric(horizontal: 18),
        child: SegmentedButton<AppointmentsTab>(
          showSelectedIcon: false,
          segments: AppointmentsTab.values
              .map(
                (tab) => ButtonSegment(
                  value: tab,
                  label: Text('${_label(tab)} (${state.count(tab)})'),
                ),
              )
              .toList(),
          selected: {state.selectedTab},
          onSelectionChanged: (selection) => controller.select(selection.first),
        ),
      ),
      const SizedBox(height: 14),
      Expanded(
        child: state.visible.isEmpty
            ? AppointmentsEmptyState(
                firstTime: !state.snapshot.hasAppointmentHistory,
                onDiscover: onDiscover,
              )
            : ListView.separated(
                padding: const EdgeInsetsDirectional.fromSTEB(24, 8, 24, 32),
                itemCount: state.visible.length,
                separatorBuilder: (_, _) => const SizedBox(height: 14),
                itemBuilder: (context, index) {
                  final appointment = state.visible[index];
                  return AppointmentCard(
                    appointment: appointment,
                    onView: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            AppointmentDetailsPage(appointment: appointment),
                      ),
                    ),
                  );
                },
              ),
      ),
    ],
  );

  String _label(AppointmentsTab tab) => switch (tab) {
    AppointmentsTab.upcoming => 'Upcoming',
    AppointmentsTab.completed => 'Completed',
    AppointmentsTab.cancelled => 'Cancelled',
  };
}

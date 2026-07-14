import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../controllers/booking_controller.dart';
import '../state/booking_state.dart';
import '../widgets/clinic_option_card.dart';
import '../widgets/date_selector.dart';
import '../widgets/slot_grid.dart';
import 'booking_review_page.dart';
import 'booking_success_page.dart';

class BookingFlowPage extends StatelessWidget {
  const BookingFlowPage({
    required this.controller,
    required this.onViewDoctor,
    required this.onMyAppointments,
    required this.onReturnHome,
    super.key,
  });
  final BookingController controller;
  final VoidCallback onViewDoctor, onMyAppointments, onReturnHome;
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(title: const Text('Book appointment')),
    body: SafeArea(
      top: false,
      child: ListenableBuilder(
        listenable: controller,
        builder: (context, _) => AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: _body(context, controller.state),
        ),
      ),
    ),
  );
  Widget _body(BuildContext context, BookingState state) => switch (state) {
    BookingLoading() => Center(
      child: Semantics(
        label: 'Loading booking options',
        child: const CircularProgressIndicator(),
      ),
    ),
    BookingSelectingClinic(:final doctor, :final clinics) => _scroll(
      context,
      'Choose a clinic',
      doctor.displayName,
      clinics
          .map(
            (c) => ClinicOptionCard(
              clinic: c,
              onTap: () => controller.selectClinic(c),
            ),
          )
          .toList(),
    ),
    BookingSelectingDate(:final draft, :final availability) => _scroll(
      context,
      'Choose a date',
      draft.clinic.displayName,
      [
        DateSelector(
          days: availability.days,
          onSelected: controller.selectDate,
        ),
      ],
    ),
    BookingSelectingSlot(:final draft, :final day) => _scroll(
      context,
      'Choose a time',
      draft.clinic.displayName,
      [SlotGrid(slots: day.slots, onSelected: controller.selectSlot)],
    ),
    BookingReviewing(:final quote) => BookingReviewPage(
      quote: quote,
      onConfirm: controller.confirm,
      confirming: false,
    ),
    BookingConfirming(:final quote) => BookingReviewPage(
      quote: quote,
      onConfirm: controller.confirm,
      confirming: true,
    ),
    BookingSuccess(:final confirmation) => BookingSuccessPage(
      confirmation: confirmation,
      onViewDoctor: onViewDoctor,
      onMyAppointments: onMyAppointments,
      onReturnHome: onReturnHome,
    ),
    BookingSlotUnavailable(:final message) => _error(
      context,
      'Time unavailable',
      message,
    ),
    BookingFailure(:final message) => _error(
      context,
      'Booking unavailable',
      message,
    ),
    BookingInitial() => const SizedBox.shrink(),
  };
  Widget _scroll(
    BuildContext context,
    String title,
    String subtitle,
    List<Widget> children,
  ) => SingleChildScrollView(
    padding: const EdgeInsetsDirectional.fromSTEB(24, 18, 24, 36),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          title,
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 5),
        Text(subtitle),
        const SizedBox(height: 22),
        ...children,
      ],
    ),
  );
  Widget _error(BuildContext context, String title, String message) => Center(
    child: Padding(
      padding: const EdgeInsetsDirectional.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.event_busy_outlined, size: 54),
          const SizedBox(height: 16),
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: controller.restart,
            child: const Text('Try again'),
          ),
        ],
      ),
    ),
  );
}

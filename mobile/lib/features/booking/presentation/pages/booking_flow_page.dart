import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../controllers/booking_controller.dart';
import '../state/booking_state.dart';
import '../widgets/clinic_option_card.dart';
import '../widgets/date_selector.dart';
import '../widgets/slot_grid.dart';
import 'booking_review_page.dart';
import 'booking_success_page.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/widgets/patient_selector.dart';

class BookingFlowPage extends StatelessWidget {
  const BookingFlowPage({
    required this.controller,
    required this.onViewDoctor,
    required this.onMyAppointments,
    required this.onReturnHome,
    this.profilesController,
    super.key,
  });
  final BookingController controller;
  final VoidCallback onViewDoctor, onMyAppointments, onReturnHome;
  final PatientProfilesController? profilesController;
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(title: Text(context.l10n.bookAppointment)),
    body: SafeArea(
      top: false,
      child: ListenableBuilder(
        listenable: controller,
        builder: (context, _) => Column(
          children: [
            if (profilesController != null)
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(24, 12, 24, 0),
                child: PatientSelector(
                  controller: profilesController!,
                  label: context.l10n.bookingFor,
                ),
              ),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: _body(context, controller.state),
              ),
            ),
          ],
        ),
      ),
    ),
  );
  Widget _body(BuildContext context, BookingState state) => switch (state) {
    BookingLoading() => Center(
      child: Semantics(
        label: context.l10n.loadingBooking,
        child: const CircularProgressIndicator(),
      ),
    ),
    BookingSelectingClinic(:final doctor, :final clinics) => _scroll(
      context,
      context.l10n.chooseClinic,
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
      context.l10n.chooseDate,
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
      context.l10n.chooseTime,
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
      context.l10n.timeUnavailable,
      message,
    ),
    BookingFailure(:final message) => _error(
      context,
      context.l10n.bookingUnavailable,
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
            child: Text(context.l10n.tryAgain),
          ),
        ],
      ),
    ),
  );
}

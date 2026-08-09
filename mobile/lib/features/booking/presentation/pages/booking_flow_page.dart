import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../controllers/booking_controller.dart';
import '../state/booking_state.dart';
import '../widgets/slot_grid.dart';
import 'booking_review_page.dart';
import 'booking_success_page.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/widgets/patient_selector.dart';
import '../../domain/entities/booking_clinic_option.dart';
import '../../domain/entities/booking_doctor_reference.dart';
import '../../domain/entities/booking_types.dart';

class BookingFlowPage extends StatelessWidget {
  const BookingFlowPage({
    required this.controller,
    required this.onViewDoctor,
    required this.onReturnHome,
    this.profilesController,
    super.key,
  });
  final BookingController controller;
  final VoidCallback onViewDoctor, onReturnHome;
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
            if (profilesController != null &&
                controller.state is! BookingConfirming &&
                controller.state is! BookingSuccess)
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
    BookingLoadingOptions() => Center(
      child: Semantics(
        label: context.l10n.loadingBooking,
        child: const CircularProgressIndicator(),
      ),
    ),
    BookingSetup(:final doctor) => _setup(context, doctor),
    BookingOptionsReady(:final availability) => _scroll(
      context,
      context.l10n.chooseTime,
      availability.clinicName,
      availability.days
          .map(
            (day) => Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Semantics(
                  header: true,
                  child: Text(
                    MaterialLocalizations.of(
                      context,
                    ).formatMediumDate(day.date),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                const SizedBox(height: 8),
                if (day.slots.isEmpty)
                  Text(context.l10n.noAvailableSlots)
                else
                  SlotGrid(
                    slots: day.slots,
                    timezone: availability.clinicTimezone,
                    onSelected: controller.selectSlot,
                  ),
                const SizedBox(height: 20),
              ],
            ),
          )
          .toList(),
    ),
    BookingEmpty() => _error(
      context,
      context.l10n.bookingUnavailable,
      context.l10n.noAvailableSlots,
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
      onReturnHome: onReturnHome,
    ),
    BookingProblemState(:final problem) => _error(
      context,
      problem == BookingProblem.conflict
          ? context.l10n.timeUnavailable
          : context.l10n.bookingUnavailable,
      _problemCopy(context, problem),
    ),
    BookingInitial() => const SizedBox.shrink(),
  };

  Widget _setup(BuildContext context, BookingDoctorReference doctor) =>
      SingleChildScrollView(
        padding: const EdgeInsetsDirectional.fromSTEB(24, 18, 24, 36),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Semantics(
              header: true,
              child: Text(
                context.l10n.chooseAppointment,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ),
            const SizedBox(height: 20),
            DropdownButtonFormField<BookingClinicOption>(
              autofocus: controller.clinic == null,
              initialValue: controller.clinic,
              decoration: InputDecoration(labelText: context.l10n.chooseClinic),
              items: doctor.clinics
                  .map(
                    (clinic) => DropdownMenuItem(
                      value: clinic,
                      child: Text(clinic.displayName),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) controller.selectClinic(value);
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<BookingAppointmentType>(
              initialValue: controller.appointmentType,
              decoration: InputDecoration(
                labelText: context.l10n.appointmentType,
              ),
              items: [
                DropdownMenuItem(
                  value: BookingAppointmentType.initial,
                  child: Text(context.l10n.initialAppointment),
                ),
                DropdownMenuItem(
                  value: BookingAppointmentType.followUp,
                  child: Text(context.l10n.followUpAppointment),
                ),
              ],
              onChanged: (value) {
                if (value != null) controller.setAppointmentType(value);
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              autofocus:
                  controller.clinic != null &&
                  (controller.reason.trim().isEmpty ||
                      controller.reason.trim().length > 500),
              initialValue: controller.reason,
              maxLength: 500,
              minLines: 2,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: context.l10n.appointmentReason,
              ),
              onChanged: controller.setReason,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: controller.loadOptions,
              child: Text(context.l10n.checkAvailability),
            ),
          ],
        ),
      );

  String _problemCopy(BuildContext context, BookingProblem problem) =>
      switch (problem) {
        BookingProblem.offline => context.l10n.offlineBody,
        BookingProblem.timeout => context.l10n.bookingTimeout,
        BookingProblem.forbidden => context.l10n.discoveryForbiddenBody,
        BookingProblem.sessionExpired => context.l10n.sessionExpiredBody,
        BookingProblem.malformedResponse =>
          context.l10n.malformedDoctorDataBody,
        BookingProblem.conflict => context.l10n.slotTaken,
        BookingProblem.validation => context.l10n.bookingValidationFailure,
        BookingProblem.unknownOutcome => context.l10n.bookingUnknownOutcome,
        _ => context.l10n.bookingUnavailable,
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
        Semantics(
          header: true,
          child: Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
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
          Focus(
            autofocus: true,
            child: Semantics(
              header: true,
              liveRegion: true,
              child: Text(title, style: Theme.of(context).textTheme.titleLarge),
            ),
          ),
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

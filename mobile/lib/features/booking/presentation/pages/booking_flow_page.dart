import 'package:flutter/material.dart';
import '../../../../design_system/design_system.dart';
import '../controllers/booking_controller.dart';
import '../state/booking_state.dart';
import '../widgets/booking_day_picker.dart';
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
    appBar: AppBar(
      title: Text(context.l10n.bookAppointment),
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
    ),
    body: SaxlemAuraBackdrop(
      strength: .7,
      child: SafeArea(
        top: false,
        child: ListenableBuilder(
          listenable: controller,
          builder: (context, _) => Column(
            children: [
              if (profilesController != null &&
                  controller.state is! BookingConfirming &&
                  controller.state is! BookingSuccess)
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(20, 12, 20, 0),
                  child: PatientSelector(
                    controller: profilesController!,
                    label: context.l10n.bookingFor,
                  ),
                ),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  layoutBuilder: (current, previous) => Stack(
                    alignment: AlignmentDirectional.topStart,
                    fit: StackFit.expand,
                    children: [...previous, ?current],
                  ),
                  child: _body(context, controller.state),
                ),
              ),
            ],
          ),
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
    BookingOptionsReady(:final availability) =>
      _scroll(context, context.l10n.chooseTime, availability.clinicName, [
        _DoctorStrip(
          name: availability.doctorName,
          detail: availability.clinicName,
        ),
        const SizedBox(height: 20),
        BookingDayPicker(
          days: availability.days,
          timezone: availability.clinicTimezone,
          emptyLabel: context.l10n.noAvailableSlots,
          onSelected: controller.selectSlot,
        ),
      ], showSubtitle: false),
    BookingEmpty() => _error(
      context,
      context.l10n.bookingUnavailable,
      context.l10n.noAvailableSlots,
    ),
    BookingReviewing(:final quote) => BookingReviewPage(
      quote: quote,
      onConfirm: controller.confirm,
      confirming: false,
      paymentMethod: controller.paymentMethod,
      onlinePaymentAvailable: controller.onlinePaymentAvailable,
      loadingPaymentOptions: controller.loadingPaymentOptions,
      onPaymentMethodChanged: controller.setPaymentMethod,
    ),
    BookingConfirming(:final quote) => BookingReviewPage(
      quote: quote,
      onConfirm: controller.confirm,
      confirming: true,
      paymentMethod: controller.paymentMethod,
      onlinePaymentAvailable: controller.onlinePaymentAvailable,
    ),
    BookingSuccess(:final confirmation) => BookingSuccessPage(
      confirmation: confirmation,
      onViewDoctor: onViewDoctor,
      onReturnHome: onReturnHome,
      paymentMethod: controller.paymentMethod,
      payments: controller.payments,
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
        padding: const EdgeInsetsDirectional.fromSTEB(20, 16, 20, 36),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _DoctorStrip(name: doctor.displayName),
            const SizedBox(height: 24),
            Semantics(
              header: true,
              child: Text(
                context.l10n.chooseAppointment,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ),
            const SizedBox(height: 16),
            if (doctor.clinics.length == 1)
              _FixedClinic(name: doctor.clinics.single.displayName)
            else
              DropdownButtonFormField<BookingClinicOption>(
                autofocus: controller.clinic == null,
                initialValue: controller.clinic,
                decoration: InputDecoration(
                  labelText: context.l10n.chooseClinic,
                ),
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
            const SizedBox(height: 18),
            Text(
              context.l10n.appointmentType,
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 8),
            SegmentedButton<BookingAppointmentType>(
              showSelectedIcon: false,
              segments: [
                ButtonSegment(
                  value: BookingAppointmentType.initial,
                  label: Text(context.l10n.initialAppointment),
                ),
                ButtonSegment(
                  value: BookingAppointmentType.followUp,
                  label: Text(context.l10n.followUpAppointment),
                ),
              ],
              selected: {controller.appointmentType},
              onSelectionChanged: (value) =>
                  controller.setAppointmentType(value.first),
            ),
            const SizedBox(height: 18),
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
            SaxlemButton(
              label: context.l10n.checkAvailability,
              trailingIcon: Icons.arrow_forward_rounded,
              expand: true,
              onPressed: controller.loadOptions,
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
    List<Widget> children, {
    bool showSubtitle = true,
  }) => SingleChildScrollView(
    padding: const EdgeInsetsDirectional.fromSTEB(20, 16, 20, 36),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          header: true,
          child: Text(title, style: Theme.of(context).textTheme.headlineSmall),
        ),
        if (showSubtitle) ...[const SizedBox(height: 5), Text(subtitle)],
        const SizedBox(height: 18),
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

class _DoctorStrip extends StatelessWidget {
  const _DoctorStrip({required this.name, this.detail});
  final String name;
  final String? detail;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final initials = name
        .replaceFirst(RegExp(r'^(Dr\.?|د\.)\s*', caseSensitive: false), '')
        .split(RegExp(r'\s+'))
        .where((p) => p.isNotEmpty)
        .take(2)
        .map((p) => p.characters.first.toUpperCase())
        .join();
    return Container(
      padding: const EdgeInsetsDirectional.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceRaised,
        borderRadius: BorderRadius.circular(SaxlemRadii.card),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          SaxlemAvatar(
            semanticLabel: name,
            initials: initials,
            size: 48,
            ring: true,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontFamily: theme.textTheme.titleLarge?.fontFamily,
                  ),
                ),
                if (detail != null)
                  Text(detail!, style: theme.textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// The only clinic this doctor works at, shown as a fact instead of a choice.
class _FixedClinic extends StatelessWidget {
  const _FixedClinic({required this.name});
  final String name;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: colors.brandTint,
        borderRadius: BorderRadius.circular(SaxlemRadii.large),
      ),
      child: Row(
        children: [
          Icon(Icons.location_on_rounded, color: colors.brandPrimary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              name,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(color: colors.brandPrimary),
            ),
          ),
        ],
      ),
    );
  }
}

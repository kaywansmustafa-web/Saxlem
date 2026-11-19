import '../../../saved_doctors/presentation/save_doctor_button.dart';
import '../../../reviews/presentation/doctor_reviews.dart';
import '../../../reviews/presentation/rating_stars.dart';
import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../widgets/doctor_result_card.dart';
import '../widgets/visit_facts.dart';
import '../widgets/clinic_location_tile.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../controllers/discover_controller.dart';
import '../state/discover_state.dart';
import '../widgets/applied_doctor_filters.dart';
import '../../../booking/booking_feature.dart';
import '../../../booking/domain/entities/booking_clinic_option.dart';
import '../../../booking/domain/entities/booking_doctor_reference.dart';
import '../../../booking/domain/repositories/booking_repository.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../../core/app_config/app_config_store.dart';

class DoctorDetailsPage extends StatefulWidget {
  const DoctorDetailsPage({
    required this.controller,
    required this.doctorId,
    this.onAuthenticationRequired,
    required this.bookingRepository,
    required this.guestMode,
    this.profilesController,
    super.key,
  });

  final DiscoverController controller;
  final String doctorId;
  final Future<void> Function()? onAuthenticationRequired;
  final BookingRepository bookingRepository;
  final bool guestMode;
  final PatientProfilesController? profilesController;

  @override
  State<DoctorDetailsPage> createState() => _DoctorDetailsPageState();
}

class _DoctorDetailsPageState extends State<DoctorDetailsPage> {
  final _headingFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_focusReadyHeading);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) widget.controller.loadDoctor(widget.doctorId);
    });
  }

  void _focusReadyHeading() {
    if (widget.controller.detailState is DoctorDetailReady) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _headingFocus.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_focusReadyHeading);
    _headingFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    extendBodyBehindAppBar: true,
    appBar: AppBar(
      title: Text(context.l10n.doctorProfile),
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      actions: [
        if (widget.controller.savedDoctors case final saved?
            when context.appConfig.savedDoctorsOn)
          ListenableBuilder(
            listenable: widget.controller,
            builder: (context, _) => switch (widget.controller.detailState) {
              DoctorDetailReady(:final doctor) => SaveDoctorButton(
                doctorId: doctor.doctorId,
                doctorName: doctor.doctorDisplayName,
                source: saved,
              ),
              _ => const SizedBox.shrink(),
            },
          ),
      ],
    ),
    body: SaxlemAuraBackdrop(
      child: SafeArea(
        bottom: false,
        child: ListenableBuilder(
          listenable: widget.controller,
          builder: (context, _) => switch (widget.controller.detailState) {
            DoctorDetailInitial() || DoctorDetailLoading() => Semantics(
              liveRegion: true,
              label: context.l10n.loadingDoctors,
              child: const Center(child: CircularProgressIndicator()),
            ),
            DoctorDetailNotFound() => SaxlemStateView(
              kind: SaxlemStateKind.empty,
              title: context.l10n.doctorNotFound,
              message: context.l10n.doctorNotFoundBody,
              icon: Icons.person_off_outlined,
            ),
            DoctorDetailFailure(:final problem) => _failure(problem),
            DoctorDetailReady(:final doctor) => _profile(doctor),
          },
        ),
      ),
    ),
  );

  Widget _failure(DiscoverProblem problem) {
    final copy = switch (problem) {
      DiscoverProblem.offline => (
        context.l10n.offlineTitle,
        context.l10n.offlineBody,
      ),
      DiscoverProblem.forbidden => (
        context.l10n.discoveryForbiddenTitle,
        context.l10n.discoveryForbiddenBody,
      ),
      DiscoverProblem.sessionExpired => (
        context.l10n.sessionExpiredTitle,
        context.l10n.sessionExpiredBody,
      ),
      DiscoverProblem.malformedResponse => (
        context.l10n.malformedDoctorDataTitle,
        context.l10n.malformedDoctorDataBody,
      ),
      DiscoverProblem.backendUnavailable => (
        context.l10n.discoveryUnavailableTitle,
        context.l10n.discoveryUnavailableBody,
      ),
      DiscoverProblem.unknown => (
        context.l10n.discoveryErrorTitle,
        context.l10n.discoveryErrorBody,
      ),
    };
    return SaxlemStateView(
      kind: problem == DiscoverProblem.offline
          ? SaxlemStateKind.offline
          : problem == DiscoverProblem.forbidden ||
                problem == DiscoverProblem.sessionExpired
          ? SaxlemStateKind.permissionRequired
          : SaxlemStateKind.error,
      title: copy.$1,
      message: copy.$2,
      actionLabel:
          problem == DiscoverProblem.sessionExpired &&
              widget.onAuthenticationRequired != null
          ? context.l10n.verifyNumber
          : context.l10n.tryAgain,
      onAction:
          problem == DiscoverProblem.sessionExpired &&
              widget.onAuthenticationRequired != null
          ? () {
              widget.onAuthenticationRequired!();
            }
          : () => widget.controller.loadDoctor(widget.doctorId),
    );
  }

  Widget _profile(DoctorDiscoveryResult doctor) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final available =
        doctor.availability.status == DoctorAvailabilityStatus.available;
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsetsDirectional.fromSTEB(0, 8, 0, 24),
            child: SaxlemResponsiveContent(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsetsDirectional.all(20),
                    decoration: BoxDecoration(
                      color: colors.surfaceRaised,
                      borderRadius: BorderRadius.circular(SaxlemRadii.hero),
                      border: Border.all(color: colors.border),
                      boxShadow: colors.cardShadow,
                    ),
                    child: Column(
                      children: [
                        SaxlemAvatar(
                          size: 88,
                          ring: true,
                          imageUrl: doctor.photoUrl,
                          initials: doctorInitials(doctor.doctorDisplayName),
                          semanticLabel: doctor.photoUrl == null
                              ? context.l10n.profileImageFallback(
                                  doctor.doctorDisplayName,
                                )
                              : context.l10n.profileImageLabel(
                                  doctor.doctorDisplayName,
                                ),
                        ),
                        const SizedBox(height: 16),
                        Focus(
                          focusNode: _headingFocus,
                          child: Semantics(
                            header: true,
                            child: Text(
                              doctor.doctorDisplayName,
                              textAlign: TextAlign.center,
                              style: theme.textTheme.headlineSmall,
                            ),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          context.specialtyLabel(
                            doctor.primarySpecialtyDisplayName,
                          ),
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: colors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Wrap(
                          alignment: WrapAlignment.center,
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            SaxlemStatusPill(
                              label: available
                                  ? context.l10n.doctorAvailable
                                  : context.l10n.doctorUnavailable,
                              tone: available
                                  ? SaxlemStatusTone.positive
                                  : SaxlemStatusTone.neutral,
                            ),
                            if (doctor.rating case final rating?
                                when rating.count > 0 &&
                                    context.appConfig.reviewsOn)
                              RatingLine(
                                average: rating.average,
                                count: rating.count,
                              ),
                            SaxlemStatusPill(
                              label: doctor.availability.acceptingNewPatients
                                  ? context.l10n.acceptingNewPatients
                                  : context.l10n.notAcceptingNewPatients,
                              tone: doctor.availability.acceptingNewPatients
                                  ? SaxlemStatusTone.informative
                                  : SaxlemStatusTone.caution,
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        IntrinsicHeight(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _Stat(
                                icon: Icons.work_history_outlined,
                                label: context.l10n.experienceLabel,
                                value: context.l10n.yearsShort(
                                  doctor.yearsOfExperience,
                                ),
                              ),
                              const SizedBox(width: 10),
                              if (doctor.fees case final fees?)
                                _Stat(
                                  icon: Icons.payments_outlined,
                                  label: context.l10n.feeFirstVisit,
                                  value: feeText(context, fees.firstVisitIqd),
                                )
                              else
                                _Stat(
                                  icon: Icons.person_outline_rounded,
                                  label: context.l10n.gender,
                                  value: _genderLabel(doctor.gender),
                                ),
                              if (doctor.availability.nextAvailableAt
                                  case final next?) ...[
                                const SizedBox(width: 10),
                                _Stat(
                                  icon: Icons.event_available_rounded,
                                  label: context.l10n.nextFreeLabel,
                                  value: nextFreeText(context, next),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (doctor.fees case final fees?) ...[
                    const SizedBox(height: 14),
                    _Section(
                      title: context.l10n.feesTitle,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _FeeRow(
                            label: context.l10n.feeFirstVisit,
                            value: feeText(context, fees.firstVisitIqd),
                          ),
                          _FeeRow(
                            label: context.l10n.feeFollowUp,
                            value: feeText(context, fees.followUpIqd),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            context.l10n.feesNote,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (widget.controller.reviews case final reviews?
                      when context.appConfig.reviewsOn) ...[
                    const SizedBox(height: 14),
                    _Section(
                      title: context.l10n.reviewsTitle,
                      child: DoctorReviewsSection(
                        doctorId: doctor.doctorId,
                        doctorName: doctor.doctorDisplayName,
                        source: reviews,
                      ),
                    ),
                  ],
                  if (doctor.biography case final biography?) ...[
                    const SizedBox(height: 14),
                    _Section(
                      title: context.l10n.biographyLabel,
                      child: Text(biography, style: theme.textTheme.bodyLarge),
                    ),
                  ],
                  if (doctor.specialties.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    _Section(
                      title: context.l10n.specialtiesLabel,
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: doctor.specialties
                            .map((item) => _Tag(item.displayName))
                            .toList(),
                      ),
                    ),
                  ],
                  if (doctor.languages.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    _Section(
                      title: context.l10n.languagesLabel,
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: doctor.languages
                            .map(
                              (item) =>
                                  _Tag(localizedDoctorLanguage(context, item)),
                            )
                            .toList(),
                      ),
                    ),
                  ],
                  if (doctor.clinics.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    _Section(
                      title: context.l10n.clinicsLabel,
                      child: Column(
                        children: [
                          for (final (index, clinic)
                              in doctor.clinics.indexed) ...[
                            if (index > 0)
                              Divider(height: 24, color: colors.divider),
                            ClinicLocationTile(
                              clinicId: clinic.id,
                              clinicName: clinic.name,
                              source: widget.controller.clinicLocations,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: colors.surfaceRaised,
            border: Border(top: BorderSide(color: colors.border)),
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(20, 12, 20, 12),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // The owner can stop app bookings for a doctor; reception
                  // still books by phone.
                  if (!available || !doctor.availability.acceptingNewPatients)
                    Padding(
                      padding: const EdgeInsetsDirectional.only(bottom: 8),
                      child: Text(
                        available
                            ? context.l10n.doctorFollowUpOnly
                            : context.l10n.doctorNotBookable,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.textSecondary,
                        ),
                      ),
                    ),
                  SaxlemButton(
                    label: context.l10n.bookAppointment,
                    leadingIcon: Icons.calendar_month_rounded,
                    expand: true,
                    onPressed: available ? () => _book(doctor) : null,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _book(DoctorDiscoveryResult doctor) async {
    if (widget.guestMode || widget.profilesController == null) {
      await widget.onAuthenticationRequired?.call();
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => BookingFeature(
          doctor: BookingDoctorReference(
            id: doctor.doctorId,
            displayName: doctor.doctorDisplayName,
            clinics: doctor.clinics
                .map(
                  (clinic) => BookingClinicOption(
                    id: clinic.id,
                    displayName: clinic.name,
                  ),
                )
                .toList(growable: false),
            followUpOnly: !doctor.availability.acceptingNewPatients,
          ),
          repository: widget.bookingRepository,
          profilesController: widget.profilesController!,
        ),
      ),
    );
  }

  String _genderLabel(BackendDoctorGender gender) => switch (gender) {
    BackendDoctorGender.female => context.l10n.genderFemale,
    BackendDoctorGender.male => context.l10n.genderMale,
    BackendDoctorGender.unspecified => context.l10n.genderUnspecified,
  };
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) => SaxlemCard(
    padding: const EdgeInsetsDirectional.all(18),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          header: true,
          child: Text(title, style: Theme.of(context).textTheme.titleMedium),
        ),
        const SizedBox(height: 12),
        child,
      ],
    ),
  );
}

class _Tag extends StatelessWidget {
  const _Tag(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsetsDirectional.symmetric(horizontal: 12, vertical: 7),
    decoration: BoxDecoration(
      color: context.saxlemColors.brandTint,
      borderRadius: BorderRadius.circular(SaxlemRadii.full),
    ),
    child: Text(
      text,
      style: Theme.of(context).textTheme.labelMedium?.copyWith(
        color: context.saxlemColors.brandPrimary,
      ),
    ),
  );
}

class _Stat extends StatelessWidget {
  const _Stat({required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label, value;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Expanded(
      child: Container(
        padding: const EdgeInsetsDirectional.all(12),
        decoration: BoxDecoration(
          color: colors.surfaceSunken,
          borderRadius: BorderRadius.circular(SaxlemRadii.medium),
        ),
        // Stacked, so three facts fit side by side on a phone.
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20, color: colors.brandPrimary),
            const SizedBox(height: 8),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.labelSmall,
            ),
            Text(
              value,
              maxLines: 2,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeeRow extends StatelessWidget {
  const _FeeRow({required this.label, required this.value});
  final String label, value;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.symmetric(vertical: 6),
    child: Row(
      children: [
        Expanded(
          child: Text(label, style: Theme.of(context).textTheme.bodyLarge),
        ),
        Text(
          value,
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
      ],
    ),
  );
}

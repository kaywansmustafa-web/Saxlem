import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/components/content/saxlem_avatar.dart';
import '../../../../design_system/components/content/saxlem_card.dart';
import '../../../../design_system/components/feedback/saxlem_state_view.dart';
import '../../../../design_system/components/layout/saxlem_responsive_content.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../controllers/discover_controller.dart';
import '../state/discover_state.dart';
import '../widgets/applied_doctor_filters.dart';

class DoctorDetailsPage extends StatefulWidget {
  const DoctorDetailsPage({
    required this.controller,
    required this.doctorId,
    this.onAuthenticationRequired,
    super.key,
  });

  final DiscoverController controller;
  final String doctorId;
  final Future<void> Function()? onAuthenticationRequired;

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
    appBar: AppBar(title: Text(context.l10n.doctorProfile)),
    body: ListenableBuilder(
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

  Widget _profile(DoctorDiscoveryResult doctor) => SingleChildScrollView(
    padding: const EdgeInsetsDirectional.symmetric(vertical: 24),
    child: SaxlemResponsiveContent(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Align(
            child: SaxlemAvatar(
              size: 96,
              imageUrl: doctor.photoUrl,
              semanticLabel: doctor.photoUrl == null
                  ? context.l10n.profileImageFallback(doctor.doctorDisplayName)
                  : context.l10n.profileImageLabel(doctor.doctorDisplayName),
            ),
          ),
          const SizedBox(height: 18),
          Focus(
            focusNode: _headingFocus,
            child: Semantics(
              header: true,
              child: Text(
                doctor.doctorDisplayName,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            doctor.primarySpecialtyDisplayName,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 24),
          SaxlemCard(
            child: Column(
              children: [
                _DetailRow(
                  label: context.l10n.experienceLabel,
                  value: context.l10n.yearsExperience(doctor.yearsOfExperience),
                ),
                _DetailRow(
                  label: context.l10n.gender,
                  value: _genderLabel(doctor.gender),
                ),
              ],
            ),
          ),
          if (doctor.biography case final biography?) ...[
            const SizedBox(height: 20),
            _Section(
              title: context.l10n.biographyLabel,
              child: Text(biography),
            ),
          ],
          if (doctor.specialties.isNotEmpty) ...[
            const SizedBox(height: 20),
            _Section(
              title: context.l10n.specialtiesLabel,
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: doctor.specialties
                    .map((item) => Chip(label: Text(item.displayName)))
                    .toList(),
              ),
            ),
          ],
          if (doctor.languages.isNotEmpty) ...[
            const SizedBox(height: 20),
            _Section(
              title: context.l10n.languagesLabel,
              child: Text(
                doctor.languages
                    .map((item) => localizedDoctorLanguage(context, item))
                    .join(', '),
              ),
            ),
          ],
          if (doctor.clinics.isNotEmpty) ...[
            const SizedBox(height: 20),
            _Section(
              title: context.l10n.clinicsLabel,
              child: Column(
                children: doctor.clinics
                    .map(
                      (clinic) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.local_hospital_outlined),
                        title: Text(clinic.name),
                      ),
                    )
                    .toList(),
              ),
            ),
          ],
          const SizedBox(height: 20),
          _Section(
            title: context.l10n.availabilityLabel,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doctor.availability.status ==
                          DoctorAvailabilityStatus.available
                      ? context.l10n.doctorAvailable
                      : context.l10n.doctorUnavailable,
                ),
                const SizedBox(height: 4),
                Text(
                  doctor.availability.acceptingNewPatients
                      ? context.l10n.acceptingNewPatients
                      : context.l10n.notAcceptingNewPatients,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Semantics(
            button: true,
            enabled: false,
            label: context.l10n.bookingComingSoon,
            child: FilledButton.icon(
              onPressed: null,
              icon: const Icon(Icons.calendar_month_outlined),
              label: Text(context.l10n.bookingComingSoon),
            ),
          ),
        ],
      ),
    ),
  );

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
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          header: true,
          child: Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: 10),
        child,
      ],
    ),
  );
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.symmetric(vertical: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label)),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    ),
  );
}

import '../../../saved_doctors/domain/saved_doctors.dart';
import '../../../saved_doctors/presentation/saved_doctors.dart';
import '../../../appointments/domain/repositories/patient_appointments_repository.dart';
import 'next_visit_card.dart';
import 'recent_doctors_strip.dart';
import 'home_discovery_sections.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../discover/domain/repositories/doctor_discovery_repository.dart';
import '../../../live_queue/domain/repositories/live_queue_repository.dart';
import '../../../../l10n/app_localizations.dart';
import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/specialty.dart';
import '../../../../design_system/design_system.dart';
import '../../../discover/domain/entities/doctor_search_criteria.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/widgets/patient_selector.dart';
import 'dashboard_header.dart';
import 'dashboard_search_bar.dart';

/// Home (v2 "Aura"): a greeting, one hero card that leads straight to search,
/// a shortcut to the patient's appointments and the specialty grid. Only real
/// data is shown: the name comes from the active patient profile.
class DashboardView extends StatelessWidget {
  const DashboardView({
    required this.onOpenDiscover,
    required this.onOpenAlerts,
    required this.onOpenAppointments,
    this.onOpenFamily,
    this.profilesController,
    this.appointmentsRepository,
    this.unreadNotifications = 0,
    this.discoveryRepository,
    this.liveQueueRepository,
    this.onOpenDoctor,
    this.onOpenVisit,
    this.returning,
    super.key,
  });

  /// The doctor directory: symptoms, doctors free today, real specialties.
  final DoctorDiscoveryRepository? discoveryRepository;

  /// Lets the next-visit card follow today's live queue.
  final LiveQueueRepository? liveQueueRepository;

  /// Opens one doctor's page.
  final ValueChanged<String>? onOpenDoctor;

  /// Opens a visit: its live queue, or its page to check in.
  final void Function(String appointmentId, {required bool inQueue})?
  onOpenVisit;

  /// True once the patient has booked before; "How Saxlem works" is for
  /// first-timers only.
  final ValueNotifier<bool>? returning;
  final void Function({
    DoctorSearchCriteria? criteria,
    bool focus,
    bool openFilters,
  })
  onOpenDiscover;
  final VoidCallback onOpenAlerts;
  final VoidCallback onOpenAppointments;

  /// Opens family profiles (the Profile tab).
  final VoidCallback? onOpenFamily;
  final PatientProfilesController? profilesController;

  /// When set (signed-in patients), Home shows the next booked visit.
  final PatientAppointmentsRepository? appointmentsRepository;

  /// Unread notifications for the bell in the header.
  final int unreadNotifications;

  static List<Specialty> _specialties(AppLocalizations strings) => [
    Specialty(
      id: 'dentist',
      name: strings.specialtyDentist,
      iconKey: 'dentist',
    ),
    Specialty(
      id: 'cardiology',
      name: strings.specialtyCardiology,
      iconKey: 'cardiology',
    ),
    Specialty(
      id: 'pediatrics',
      name: strings.specialtyPediatrics,
      iconKey: 'pediatrics',
    ),
    Specialty(id: 'eye', name: strings.specialtyEye, iconKey: 'eye'),
    Specialty(
      id: 'neurology',
      name: strings.specialtyNeurology,
      iconKey: 'neurology',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    final profiles = profilesController;
    void openSpecialty(Specialty item) => onOpenDiscover(
      criteria: DoctorSearchCriteria(
        specialtyCode: item.id == 'eye' ? 'ophthalmology' : item.id,
      ),
      focus: false,
      openFilters: false,
    );
    final specialtyFallback = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 26),
        Semantics(
          header: true,
          child: Text(
            strings.popularSpecialties,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
        const SizedBox(height: 12),
        _SpecialtyStrip(
          specialties: _specialties(strings),
          semanticLabelBuilder: strings.browseSpecialty,
          onSelected: openSpecialty,
        ),
      ],
    );
    return SaxlemAuraBackdrop(
      child: SingleChildScrollView(
        padding: const EdgeInsetsDirectional.fromSTEB(20, 18, 20, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            profiles == null
                ? _header(context, null)
                : ListenableBuilder(
                    listenable: profiles,
                    builder: (context, _) =>
                        _header(context, profiles.activeProfile?.firstName),
                  ),
            if (profiles != null) ...[
              const SizedBox(height: 14),
              PatientSelector(
                controller: profiles,
                label: strings.currentPatient,
              ),
              if (appointmentsRepository != null)
                ListenableBuilder(
                  listenable: profiles,
                  builder: (context, _) => NextVisitCard(
                    repository: appointmentsRepository!,
                    profileId: profiles.activeProfileId,
                    onOpen: onOpenAppointments,
                    liveQueue: liveQueueRepository,
                    onOpenVisit: onOpenVisit,
                    onFound: () => returning?.value = true,
                  ),
                ),
            ],
            const SizedBox(height: 18),
            DashboardSearchBar(
              hintText: strings.searchHint,
              searchSemanticLabel: strings.openHealthcareSearch,
              filterSemanticLabel: strings.openSearchFilters,
              onTap: () => onOpenDiscover(focus: true, openFilters: false),
              onFilterPressed: () =>
                  onOpenDiscover(focus: false, openFilters: true),
            ),
            const SizedBox(height: 12),
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    child: _QuickTile(
                      icon: Icons.add_rounded,
                      title: strings.bookAppointment,
                      subtitle: strings.doctorDiscoveryTitle,
                      filled: true,
                      stacked: profiles != null,
                      onTap: () =>
                          onOpenDiscover(focus: false, openFilters: false),
                    ),
                  ),
                  if (profiles != null) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: _QuickTile(
                        icon: Icons.family_restroom_rounded,
                        title: strings.familyTileTitle,
                        subtitle: strings.familyTileSubtitle,
                        stacked: true,
                        onTap: onOpenFamily ?? onOpenAppointments,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (discoveryRepository != null && onOpenDoctor != null)
              HomeDiscoverySections(
                repository: discoveryRepository!,
                onOpenDiscover: ({criteria}) => onOpenDiscover(
                  criteria: criteria,
                  focus: false,
                  openFilters: false,
                ),
                onOpenDoctor: onOpenDoctor!,
                fallback: specialtyFallback,
              )
            else
              specialtyFallback,
            if (profiles != null && onOpenDoctor != null)
              if (discoveryRepository case final SavedDoctorsSource saved)
                SavedDoctorsStrip(source: saved, onOpenDoctor: onOpenDoctor!),
            if (profiles != null && appointmentsRepository != null)
              ListenableBuilder(
                listenable: profiles,
                builder: (context, _) => RecentDoctorsStrip(
                  repository: appointmentsRepository!,
                  profileId: profiles.activeProfileId,
                  onFound: () => returning?.value = true,
                  onBook: (doctor) => onOpenDoctor != null
                      ? onOpenDoctor!(doctor.id)
                      : onOpenDiscover(
                          criteria: DoctorSearchCriteria(
                            query: doctor.displayName,
                          ),
                        ),
                ),
              ),
            const SizedBox(height: 22),
            _QuickTile(
              icon: Icons.emergency_outlined,
              title: strings.emergencyTitle,
              subtitle: strings.emergencySubtitle,
              danger: true,
              onTap: () => _confirmEmergency(context),
            ),
            ValueListenableBuilder<bool>(
              valueListenable: returning ?? ValueNotifier(false),
              builder: (context, isReturning, _) => isReturning
                  ? const SizedBox.shrink()
                  : Padding(
                      padding: const EdgeInsetsDirectional.only(top: 22),
                      child: _HowItWorks(
                        title: strings.howItWorks,
                        steps: [
                          (Icons.event_available_rounded, strings.stepBook),
                          (Icons.how_to_reg_rounded, strings.stepCheckIn),
                          (
                            Icons.notifications_active_rounded,
                            strings.stepCalled,
                          ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  /// Never dials by accident: the patient confirms first.
  static Future<void> _confirmEmergency(BuildContext context) async {
    final strings = context.l10n;
    final call = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.emergency_outlined),
        title: Text(strings.emergencyConfirmTitle),
        content: Text(strings.emergencyConfirmBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(strings.cancelAction),
          ),
          FilledButton.icon(
            onPressed: () => Navigator.pop(context, true),
            icon: const Icon(Icons.call_rounded),
            label: Text(strings.emergencyCall),
          ),
        ],
      ),
    );
    if (call == true) await launchUrl(Uri(scheme: 'tel', path: '122'));
  }

  Widget _header(BuildContext context, String? name) {
    final greeting = _greeting(context, DateTime.now().hour);
    final hasName = name != null && name.trim().isNotEmpty;
    return DashboardHeader(
      greeting: hasName ? greeting : '',
      userName: hasName
          ? name.trim()
          : greeting.replaceAll(RegExp(r'[,،]\s*$'), ''),
      notificationLabel: unreadNotifications > 0
          ? '${context.l10n.notifications}. '
                '${context.l10n.unreadNotifications(unreadNotifications)}'
          : context.l10n.notifications,
      onNotificationPressed: onOpenAlerts,
      unreadCount: unreadNotifications,
    );
  }

  String _greeting(BuildContext context, int hour) {
    if (hour < 12) return context.l10n.goodMorning;
    if (hour < 17) return context.l10n.goodAfternoon;
    return context.l10n.goodEvening;
  }
}

/// Specialties as a sideways strip of glowing tiles.
class _SpecialtyStrip extends StatelessWidget {
  const _SpecialtyStrip({
    required this.specialties,
    required this.semanticLabelBuilder,
    required this.onSelected,
  });
  final List<Specialty> specialties;
  final String Function(String name) semanticLabelBuilder;
  final ValueChanged<Specialty> onSelected;

  static const _icons = {
    'dentist': Icons.medical_services_outlined,
    'cardiology': Icons.favorite_border_rounded,
    'pediatrics': Icons.child_care_rounded,
    'eye': Icons.remove_red_eye_outlined,
    'neurology': Icons.psychology_outlined,
  };

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return SizedBox(
      height: 112,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        itemCount: specialties.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final item = specialties[index];
          return Semantics(
            button: true,
            label: semanticLabelBuilder(item.name),
            child: ExcludeSemantics(
              child: Material(
                type: MaterialType.transparency,
                child: Ink(
                  width: 104,
                  decoration: BoxDecoration(
                    color: colors.surfaceRaised,
                    borderRadius: BorderRadius.circular(SaxlemRadii.card),
                    border: Border.all(color: colors.border),
                    boxShadow: colors.cardShadow,
                  ),
                  child: InkWell(
                    onTap: () => onSelected(item),
                    borderRadius: BorderRadius.circular(SaxlemRadii.card),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 46,
                          height: 46,
                          decoration: BoxDecoration(
                            color: colors.brandTint,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(
                            _icons[item.id] ?? Icons.local_hospital_outlined,
                            color: colors.brandPrimary,
                            size: 22,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Padding(
                          padding: const EdgeInsetsDirectional.symmetric(
                            horizontal: 6,
                          ),
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              item.name,
                              maxLines: 1,
                              style: theme.textTheme.labelLarge,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _QuickTile extends StatelessWidget {
  const _QuickTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.danger = false,
    this.filled = false,
    this.stacked = false,
  });
  final IconData icon;
  final String title, subtitle;
  final VoidCallback onTap;

  /// Emergency: red, so it is never mistaken for an ordinary shortcut.
  final bool danger;

  /// The main shortcut (Book): a solid blue icon.
  final bool filled;

  /// Icon above the words, for the half-width tiles, so long titles
  /// (and Kurdish or Arabic) wrap between words instead of inside them.
  final bool stacked;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final (wash, tint) = danger
        ? (colors.criticalSurface, colors.criticalContent)
        : filled
        ? (colors.brandFill, colors.onFill)
        : (colors.brandTint, colors.brandPrimary);
    return Semantics(
      button: true,
      label: '$title. $subtitle',
      child: ExcludeSemantics(
        child: Material(
          type: MaterialType.transparency,
          child: Ink(
            decoration: BoxDecoration(
              color: colors.surfaceRaised,
              borderRadius: BorderRadius.circular(SaxlemRadii.card),
              border: Border.all(color: colors.border),
              boxShadow: colors.cardShadow,
            ),
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(SaxlemRadii.card),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Flex(
                  direction: stacked ? Axis.vertical : Axis.horizontal,
                  crossAxisAlignment: stacked
                      ? CrossAxisAlignment.start
                      : CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: wash,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: filled
                            ? SaxlemElevation.glow(colors.brandFill)
                            : null,
                      ),
                      child: Icon(icon, color: tint, size: 22),
                    ),
                    SizedBox(width: 12, height: stacked ? 12 : 0),
                    Flexible(
                      fit: stacked ? FlexFit.loose : FlexFit.tight,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleSmall,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            subtitle,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colors.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The live-queue idea in three steps, for people new to Saxlem.
class _HowItWorks extends StatelessWidget {
  const _HowItWorks({required this.title, required this.steps});
  final String title;
  final List<(IconData, String)> steps;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: colors.surfaceRaised,
        borderRadius: BorderRadius.circular(SaxlemRadii.hero),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            header: true,
            child: Text(title, style: theme.textTheme.titleMedium),
          ),
          const SizedBox(height: 14),
          for (var i = 0; i < steps.length; i++)
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          gradient: colors.aura,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          steps[i].$1,
                          size: 18,
                          color: colors.onFill,
                        ),
                      ),
                      if (i < steps.length - 1)
                        Expanded(
                          child: Container(
                            width: 2,
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            color: colors.brandTint,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: EdgeInsetsDirectional.only(
                        top: 6,
                        bottom: i < steps.length - 1 ? 18 : 0,
                      ),
                      child: Text(
                        steps[i].$2,
                        style: theme.textTheme.titleSmall,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

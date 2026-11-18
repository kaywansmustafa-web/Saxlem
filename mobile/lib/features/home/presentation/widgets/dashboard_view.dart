import '../../../appointments/domain/repositories/patient_appointments_repository.dart';
import 'next_visit_card.dart';
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
    this.profilesController,
    this.appointmentsRepository,
    this.unreadNotifications = 0,
    super.key,
  });
  final void Function({
    DoctorSearchCriteria? criteria,
    bool focus,
    bool openFilters,
  })
  onOpenDiscover;
  final VoidCallback onOpenAlerts;
  final VoidCallback onOpenAppointments;
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
                  ),
                ),
            ],
            const SizedBox(height: 18),
            _SearchPanel(
              title: strings.welcomeBook,
              subtitle: strings.welcomeQueue,
              search: DashboardSearchBar(
                hintText: strings.searchHint,
                searchSemanticLabel: strings.openHealthcareSearch,
                filterSemanticLabel: strings.openSearchFilters,
                onTap: () => onOpenDiscover(focus: true, openFilters: false),
                onFilterPressed: () =>
                    onOpenDiscover(focus: false, openFilters: true),
              ),
            ),
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
            const SizedBox(height: 22),
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    child: _QuickTile(
                      icon: Icons.calendar_month_rounded,
                      title: strings.appointments,
                      subtitle: strings.welcomeAppointments,
                      onTap: onOpenAppointments,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickTile(
                      icon: Icons.notifications_active_outlined,
                      title: strings.alerts,
                      subtitle: strings.alertsSubtitle,
                      onTap: onOpenAlerts,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            _HowItWorks(
              title: strings.howItWorks,
              steps: [
                (Icons.event_available_rounded, strings.stepBook),
                (Icons.how_to_reg_rounded, strings.stepCheckIn),
                (Icons.notifications_active_rounded, strings.stepCalled),
              ],
            ),
          ],
        ),
      ),
    );
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

/// The search, on frosted glass over the aura.
class _SearchPanel extends StatelessWidget {
  const _SearchPanel({
    required this.title,
    required this.subtitle,
    required this.search,
  });
  final String title, subtitle;
  final Widget search;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(18, 18, 18, 16),
      decoration: BoxDecoration(
        color: colors.surfaceRaised,
        borderRadius: BorderRadius.circular(SaxlemRadii.hero),
        border: Border.all(color: colors.border),
        boxShadow: SaxlemElevation.level1(colors.night),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colors.textSecondary,
            ),
          ),
          const SizedBox(height: 14),
          search,
        ],
      ),
    );
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
                    boxShadow: SaxlemElevation.level1(colors.night),
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
                            gradient: colors.deepAura,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: SaxlemElevation.glow(
                              colors.brandPrimary,
                            ),
                          ),
                          child: Icon(
                            _icons[item.id] ?? Icons.local_hospital_outlined,
                            color: colors.onFill,
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
  });
  final IconData icon;
  final String title, subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
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
              boxShadow: SaxlemElevation.level1(colors.night),
            ),
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(SaxlemRadii.card),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: colors.brandTint,
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: Icon(icon, color: colors.brandPrimary, size: 22),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      title,
                      maxLines: 1,
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
        boxShadow: SaxlemElevation.level1(colors.night),
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

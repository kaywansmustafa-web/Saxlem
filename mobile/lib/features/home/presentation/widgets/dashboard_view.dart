import '../../../appointments/domain/repositories/patient_appointments_repository.dart';
import 'next_visit_card.dart';
import '../../../../l10n/app_localizations.dart';
import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/specialty.dart';
import '../../../../design_system/foundations/saxlem_elevation.dart';
import '../../../../design_system/foundations/saxlem_radii.dart';
import '../../../../design_system/theme/saxlem_colors.dart';
import '../../../discover/domain/entities/doctor_search_criteria.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/widgets/patient_selector.dart';
import 'dashboard_header.dart';
import 'dashboard_search_bar.dart';
import 'popular_specialties_section.dart';

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
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.fromSTEB(20, 20, 20, 32),
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
            const SizedBox(height: 16),
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
          const SizedBox(height: 20),
          _SearchHero(
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
          const SizedBox(height: 16),
          _ShortcutCard(
            icon: Icons.calendar_month_rounded,
            title: strings.appointments,
            subtitle: strings.welcomeAppointments,
            onTap: onOpenAppointments,
          ),
          const SizedBox(height: 28),
          PopularSpecialtiesSection(
            title: strings.popularSpecialties,
            specialties: _specialties(strings),
            semanticLabelBuilder: (item) => strings.browseSpecialty(item.name),
            onSpecialtySelected: (item) => onOpenDiscover(
              criteria: DoctorSearchCriteria(
                specialtyCode: item.id == 'eye' ? 'ophthalmology' : item.id,
              ),
              focus: false,
              openFilters: false,
            ),
          ),
        ],
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
      notificationLabel: context.l10n.alerts,
      onNotificationPressed: onOpenAlerts,
    );
  }

  String _greeting(BuildContext context, int hour) {
    if (hour < 12) return context.l10n.goodMorning;
    if (hour < 17) return context.l10n.goodAfternoon;
    return context.l10n.goodEvening;
  }
}

class _SearchHero extends StatelessWidget {
  const _SearchHero({
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
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        gradient: colors.deepAura,
        borderRadius: BorderRadius.circular(SaxlemRadii.hero),
        boxShadow: SaxlemElevation.glow(colors.brandPrimary),
      ),
      child: Stack(
        children: [
          // The logo's two shapes, faint, as texture.
          PositionedDirectional(
            end: -26,
            top: 14,
            child: _Leaf(color: colors.onFill.withValues(alpha: .12)),
          ),
          PositionedDirectional(
            end: 18,
            top: 102,
            child: _Leaf(
              color: colors.auraEnd.withValues(alpha: .28),
              flipped: true,
            ),
          ),
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(20, 22, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 250),
                  child: Text(
                    title,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: colors.onFill,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 260),
                  child: Text(
                    subtitle,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colors.onFill.withValues(alpha: .9),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                search,
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// One of the logo's two rounded shapes: two big corners, one small, one square.
class _Leaf extends StatelessWidget {
  const _Leaf({required this.color, this.flipped = false});
  final Color color;
  final bool flipped;

  @override
  Widget build(BuildContext context) => Container(
    width: 132,
    height: 88,
    decoration: BoxDecoration(
      color: color,
      borderRadius: flipped
          ? const BorderRadius.only(
              topLeft: Radius.circular(44),
              bottomRight: Radius.circular(44),
              bottomLeft: Radius.circular(14),
            )
          : const BorderRadius.only(
              topLeft: Radius.circular(44),
              bottomRight: Radius.circular(44),
              topRight: Radius.circular(14),
            ),
    ),
  );
}

class _ShortcutCard extends StatelessWidget {
  const _ShortcutCard({
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
            child: Container(
              padding: const EdgeInsetsDirectional.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(SaxlemRadii.card),
              ),
              child: ExcludeSemantics(
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: colors.brandTint,
                        borderRadius: BorderRadius.circular(SaxlemRadii.medium),
                      ),
                      child: Icon(icon, color: colors.brandPrimary),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: theme.textTheme.titleMedium),
                          const SizedBox(height: 2),
                          Text(subtitle, style: theme.textTheme.bodySmall),
                        ],
                      ),
                    ),
                    Icon(
                      Directionality.of(context) == TextDirection.rtl
                          ? Icons.chevron_left_rounded
                          : Icons.chevron_right_rounded,
                      color: colors.textSecondary,
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

import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../../design_system/design_system.dart';
import '../controllers/patient_profiles_controller.dart';
import 'add_patient_page.dart';

/// Profile tab (v2 "Aura"): the active patient on a hero card, the family
/// list (tap to switch), add a family member, and log out.
class PatientProfilesPage extends StatelessWidget {
  const PatientProfilesPage({
    required this.controller,
    this.onLogout,
    super.key,
  });
  final PatientProfilesController controller;
  final Future<void> Function()? onLogout;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) {
      final active = controller.activeProfile;
      final colors = context.saxlemColors;
      final theme = Theme.of(context);
      return SaxlemResponsiveContent(
        child: ListView(
          padding: const EdgeInsetsDirectional.fromSTEB(0, 20, 0, 32),
          children: [
            Semantics(
              header: true,
              child: Text(
                context.l10n.profile,
                style: theme.textTheme.headlineMedium,
              ),
            ),
            const SizedBox(height: 16),
            if (active != null) _ActiveHero(profile: active),
            if (controller.failure != null) ...[
              const SizedBox(height: 12),
              Semantics(
                liveRegion: true,
                child: Text(
                  context.l10n.profileSelectionFailed,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colors.criticalContent,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 26),
            Semantics(
              header: true,
              child: Text(
                context.l10n.familyMembersTitle.toUpperCase(),
                style: theme.textTheme.labelSmall?.copyWith(letterSpacing: .8),
              ),
            ),
            const SizedBox(height: 10),
            if (controller.profiles.isEmpty)
              Text(
                context.l10n.emptyPatientProfiles,
                style: theme.textTheme.bodyMedium,
              )
            else
              Container(
                decoration: BoxDecoration(
                  color: colors.surfaceRaised,
                  borderRadius: BorderRadius.circular(SaxlemRadii.card),
                  border: Border.all(color: colors.border),
                  boxShadow: SaxlemElevation.level1(colors.night),
                ),
                child: Column(
                  children: [
                    for (var i = 0; i < controller.profiles.length; i++) ...[
                      if (i > 0)
                        Divider(height: 1, indent: 76, color: colors.divider),
                      _ProfileRow(
                        profile: controller.profiles[i],
                        selected:
                            controller.profiles[i].id ==
                            controller.activeProfileId,
                        onTap:
                            controller.status == PatientProfilesStatus.selecting
                            ? null
                            : () =>
                                  controller.select(controller.profiles[i].id),
                      ),
                    ],
                  ],
                ),
              ),
            const SizedBox(height: 14),
            SaxlemButton(
              label: context.l10n.addPatient,
              leadingIcon: Icons.person_add_alt_1_rounded,
              hierarchy: SaxlemButtonHierarchy.secondary,
              onPressed: controller.guest
                  ? null
                  : () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => AddPatientPage(controller: controller),
                      ),
                    ),
              expand: true,
            ),
            if (onLogout != null) ...[
              const SizedBox(height: 22),
              TextButton.icon(
                onPressed: onLogout,
                style: TextButton.styleFrom(
                  foregroundColor: colors.criticalContent,
                  minimumSize: const Size.fromHeight(48),
                ),
                icon: const Icon(Icons.logout_rounded, size: 20),
                label: Text(context.l10n.logOut),
              ),
            ],
          ],
        ),
      );
    },
  );
}

class _ActiveHero extends StatelessWidget {
  const _ActiveHero({required this.profile});
  final PatientProfile profile;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Semantics(
      container: true,
      label:
          '${context.l10n.currentPatient}. ${profile.displayName}. '
          '${context.l10n.patientRelationship(profile.relationship.name)}',
      child: ExcludeSemantics(
        child: Container(
          clipBehavior: Clip.antiAlias,
          padding: const EdgeInsetsDirectional.all(20),
          decoration: BoxDecoration(
            gradient: colors.deepAura,
            borderRadius: BorderRadius.circular(SaxlemRadii.hero),
            boxShadow: SaxlemElevation.glow(colors.brandPrimary),
          ),
          child: Row(
            children: [
              Container(
                width: 64,
                height: 64,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: colors.onFill.withValues(alpha: .2),
                  border: Border.all(
                    color: colors.onFill.withValues(alpha: .5),
                    width: 2,
                  ),
                ),
                child: Text(
                  profile.initials,
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: colors.onFill,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.l10n.currentPatient,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colors.onFill.withValues(alpha: .85),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      profile.displayName,
                      style: theme.textTheme.titleLarge?.copyWith(
                        color: colors.onFill,
                      ),
                    ),
                    Text(
                      context.l10n.patientRelationship(
                        profile.relationship.name,
                      ),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colors.onFill.withValues(alpha: .88),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  const _ProfileRow({
    required this.profile,
    required this.selected,
    required this.onTap,
  });
  final PatientProfile profile;
  final bool selected;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Semantics(
      button: true,
      selected: selected,
      label:
          '${profile.displayName}, ${context.l10n.patientRelationship(profile.relationship.name)}',
      child: InkWell(
        onTap: onTap,
        child: ExcludeSemantics(
          child: Padding(
            padding: const EdgeInsetsDirectional.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            child: Row(
              children: [
                SaxlemAvatar(
                  semanticLabel: profile.displayName,
                  initials: profile.initials,
                  size: 44,
                  ring: selected,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profile.displayName,
                        style: theme.textTheme.titleSmall,
                      ),
                      Text(
                        context.l10n.patientRelationship(
                          profile.relationship.name,
                        ),
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                if (selected)
                  Icon(Icons.check_circle_rounded, color: colors.brandPrimary)
                else
                  Icon(
                    Icons.radio_button_unchecked_rounded,
                    color: colors.border,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

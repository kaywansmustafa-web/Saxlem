import 'package:url_launcher/url_launcher.dart';
import '../../../../config/environment/support_links.dart';
import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../../design_system/design_system.dart';
import '../controllers/patient_profiles_controller.dart';
import 'add_patient_page.dart';
import '../../../../core/localization/supported_app_locale.dart';
import '../../domain/repositories/patient_profiles_repository.dart';

/// Profile tab (v2 "Aura"): the active patient on a hero card, the family
/// list (tap to switch), add a family member, and log out.
class PatientProfilesPage extends StatelessWidget {
  const PatientProfilesPage({
    required this.controller,
    this.onLogout,
    this.onChangeLanguage,
    super.key,
  });
  final PatientProfilesController controller;
  final Future<void> Function()? onLogout;
  final Future<bool> Function(SupportedAppLocale locale)? onChangeLanguage;
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
            const SizedBox(height: 28),
            Semantics(
              header: true,
              child: Text(
                context.l10n.settingsTitle.toUpperCase(),
                style: theme.textTheme.labelSmall?.copyWith(letterSpacing: .8),
              ),
            ),
            const SizedBox(height: 10),
            _SettingsCard(
              children: [
                if (onChangeLanguage != null)
                  _SettingsRow(
                    icon: Icons.translate_rounded,
                    label: context.l10n.appLanguage,
                    value: _languageName(Localizations.localeOf(context)),
                    onTap: () => _chooseLanguage(context),
                  ),
                if (onLogout != null)
                  _SettingsRow(
                    icon: Icons.logout_rounded,
                    label: context.l10n.logOut,
                    onTap: onLogout,
                  ),
                if (onLogout != null && !controller.guest)
                  _SettingsRow(
                    icon: Icons.delete_outline_rounded,
                    label: context.l10n.deleteAccount,
                    destructive: true,
                    onTap: () => _confirmDelete(context),
                  ),
              ],
            ),
            if (SupportLinks.whatsApp != null ||
                SupportLinks.terms != null ||
                SupportLinks.privacy != null) ...[
              const SizedBox(height: 28),
              Semantics(
                header: true,
                child: Text(
                  context.l10n.helpTitle.toUpperCase(),
                  style: theme.textTheme.labelSmall?.copyWith(
                    letterSpacing: .8,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              _SettingsCard(
                children: [
                  if (SupportLinks.whatsApp case final uri?)
                    _SettingsRow(
                      icon: Icons.chat_outlined,
                      label: context.l10n.contactSaxlem,
                      onTap: () => _open(uri),
                    ),
                  if (SupportLinks.terms case final uri?)
                    _SettingsRow(
                      icon: Icons.description_outlined,
                      label: context.l10n.termsOfUse,
                      onTap: () => _open(uri),
                    ),
                  if (SupportLinks.privacy case final uri?)
                    _SettingsRow(
                      icon: Icons.privacy_tip_outlined,
                      label: context.l10n.privacyPolicy,
                      onTap: () => _open(uri),
                    ),
                ],
              ),
            ],
            if (SupportLinks.version.isNotEmpty) ...[
              const SizedBox(height: 16),
              Center(
                child: Text(
                  context.l10n.appVersion(SupportLinks.version),
                  style: theme.textTheme.labelSmall,
                ),
              ),
            ],
          ],
        ),
      );
    },
  );

  static Future<void> _open(Uri uri) =>
      launchUrl(uri, mode: LaunchMode.externalApplication);

  static String _languageName(Locale locale) => switch (locale.languageCode) {
    'ar' => 'العربية',
    'ku' => 'کوردی (بادینی)',
    _ => 'English',
  };

  Future<void> _chooseLanguage(BuildContext context) async {
    final current = Localizations.localeOf(context).languageCode;
    final chosen = await showModalBottomSheet<SupportedAppLocale>(
      context: context,
      showDragHandle: true,
      builder: (sheet) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final option in const [
              SupportedAppLocale.badini,
              SupportedAppLocale.arabic,
              SupportedAppLocale.english,
            ])
              ListTile(
                minTileHeight: 56,
                title: Text(_languageName(option.locale)),
                trailing: option.locale.languageCode == current
                    ? Icon(
                        Icons.check_circle_rounded,
                        color: sheet.saxlemColors.brandPrimary,
                      )
                    : null,
                onTap: () => Navigator.of(sheet).pop(option),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (chosen != null) await onChangeLanguage?.call(chosen);
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final strings = context.l10n;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialog) => AlertDialog(
        title: Text(strings.deleteAccountTitle),
        content: Text(strings.deleteAccountBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialog).pop(false),
            child: Text(strings.cancelAction),
          ),
          TextButton(
            style: TextButton.styleFrom(
              foregroundColor: dialog.saxlemColors.criticalContent,
            ),
            onPressed: () => Navigator.of(dialog).pop(true),
            child: Text(strings.deleteAccountConfirm),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    final outcome = await controller.deleteAccount();
    if (!context.mounted) return;
    if (outcome == DeleteAccountOutcome.deleted) {
      await onLogout?.call();
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          outcome == DeleteAccountOutcome.upcomingAppointments
              ? strings.deleteAccountUpcoming
              : strings.deleteAccountFailed,
        ),
      ),
    );
  }
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

class _SettingsCard extends StatelessWidget {
  const _SettingsCard({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceRaised,
        borderRadius: BorderRadius.circular(SaxlemRadii.card),
        border: Border.all(color: colors.border),
        boxShadow: SaxlemElevation.level1(colors.night),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) Divider(height: 1, indent: 60, color: colors.divider),
            children[i],
          ],
        ],
      ),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({
    required this.icon,
    required this.label,
    required this.onTap,
    this.value,
    this.destructive = false,
  });
  final IconData icon;
  final String label;
  final String? value;
  final bool destructive;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final tint = destructive ? colors.criticalContent : colors.brandPrimary;
    return Semantics(
      button: true,
      child: InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 60),
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(16, 10, 12, 10),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: destructive
                        ? colors.criticalSurface
                        : colors.brandTint,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, size: 18, color: tint),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: destructive ? colors.criticalContent : null,
                    ),
                  ),
                ),
                if (value != null)
                  Text(
                    value!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colors.textSecondary,
                    ),
                  ),
                if (!destructive)
                  Icon(
                    Directionality.of(context) == TextDirection.rtl
                        ? Icons.chevron_left_rounded
                        : Icons.chevron_right_rounded,
                    color: colors.textMuted,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

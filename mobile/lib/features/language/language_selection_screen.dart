import 'package:flutter/material.dart';

import '../../design_system/design_system.dart';
import '../../app/app_controller.dart';
import '../../core/localization/localization_extensions.dart';
import '../../core/localization/supported_app_locale.dart';

class LanguageSelectionScreen extends StatefulWidget {
  const LanguageSelectionScreen({required this.controller, super.key});
  final AppController controller;

  @override
  State<LanguageSelectionScreen> createState() =>
      _LanguageSelectionScreenState();
}

class _LanguageSelectionScreenState extends State<LanguageSelectionScreen> {
  SupportedAppLocale? selectedLanguage;

  Future<void> _continueToHome() async {
    if (selectedLanguage == null) return;
    await widget.controller.selectLocale(selectedLanguage!);
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(24, 32, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              const Center(
                child: SaxlemMark(size: 56, semanticLabel: 'Saxlem'),
              ),
              const SizedBox(height: 20),
              Text(
                strings.chooseLanguage,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                strings.languageCanChange,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 40),
              _LanguageCard(
                title: 'کوردی (بادینی)',
                titleFont: 'Rudaw',
                badge: 'ک',
                subtitle: strings.badiniKurdish,
                isSelected: selectedLanguage == SupportedAppLocale.badini,
                onTap: () {
                  setState(() {
                    selectedLanguage = SupportedAppLocale.badini;
                  });
                },
              ),
              const SizedBox(height: 12),
              _LanguageCard(
                title: 'English',
                badge: 'En',
                subtitle: strings.english,
                isSelected: selectedLanguage == SupportedAppLocale.english,
                onTap: () {
                  setState(() {
                    selectedLanguage = SupportedAppLocale.english;
                  });
                },
              ),
              const SizedBox(height: 12),
              _LanguageCard(
                title: 'العربية',
                titleFont: 'Cairo',
                badge: 'ع',
                subtitle: strings.arabic,
                isSelected: selectedLanguage == SupportedAppLocale.arabic,
                onTap: () {
                  setState(() {
                    selectedLanguage = SupportedAppLocale.arabic;
                  });
                },
              ),
              const Spacer(),
              if (widget.controller.localeFailure != null) ...[
                Text(
                  strings.languageSaveFailed,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
                const SizedBox(height: 12),
              ],
              Semantics(
                liveRegion: widget.controller.savingLocale,
                label: widget.controller.savingLocale
                    ? strings.savingLanguage
                    : null,
                child: SaxlemButton(
                  label: strings.continueLabel,
                  expand: true,
                  loading: widget.controller.savingLocale,
                  trailingIcon: Icons.arrow_forward_rounded,
                  onPressed: selectedLanguage == null ? null : _continueToHome,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LanguageCard extends StatelessWidget {
  const _LanguageCard({
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.isSelected,
    required this.onTap,
    this.titleFont,
  });

  final String title, subtitle, badge;
  final String? titleFont;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Semantics(
      button: true,
      selected: isSelected,
      label: '$title, $subtitle',
      child: Material(
        type: MaterialType.transparency,
        child: Ink(
          decoration: BoxDecoration(
            color: colors.surfaceRaised,
            borderRadius: BorderRadius.circular(SaxlemRadii.card),
            border: Border.all(
              color: isSelected ? colors.brandPrimary : colors.border,
              width: isSelected ? 2 : 1,
            ),
            boxShadow: colors.cardShadow,
          ),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(SaxlemRadii.card),
            child: ExcludeSemantics(
              child: Padding(
                padding: const EdgeInsetsDirectional.all(16),
                child: Row(
                  children: [
                    AnimatedContainer(
                      duration: SaxlemMotion.standard,
                      width: 48,
                      height: 48,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isSelected ? null : colors.brandTint,
                        gradient: isSelected ? colors.deepAura : null,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        badge,
                        style: TextStyle(
                          fontFamily: titleFont ?? SaxlemTypography.display,
                          fontSize: titleFont == null ? 16 : 22,
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? colors.onFill
                              : colors.brandPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontFamily: titleFont,
                              fontSize: titleFont == null ? 17 : 19,
                            ),
                          ),
                          Text(subtitle, style: theme.textTheme.bodySmall),
                        ],
                      ),
                    ),
                    AnimatedSwitcher(
                      duration: SaxlemMotion.fast,
                      child: isSelected
                          ? Icon(
                              Icons.check_circle_rounded,
                              key: const ValueKey('selected'),
                              color: colors.brandPrimary,
                            )
                          : Icon(
                              Icons.radio_button_unchecked_rounded,
                              key: const ValueKey('not-selected'),
                              color: colors.border,
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

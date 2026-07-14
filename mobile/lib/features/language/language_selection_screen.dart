import 'package:flutter/material.dart';

import '../../config/theme/app_colors.dart';
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
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(24, 32, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
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
                title: 'کوردی بادینی',
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
                title: strings.english,
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
                child: ElevatedButton(
                  onPressed:
                      selectedLanguage == null || widget.controller.savingLocale
                      ? null
                      : _continueToHome,
                  child: widget.controller.savingLocale
                      ? const SizedBox.square(
                          dimension: 22,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(strings.continueLabel),
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
    required this.isSelected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected
          ? AppColors.primary.withValues(alpha: 0.07)
          : AppColors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          padding: const EdgeInsetsDirectional.symmetric(
            horizontal: 18,
            vertical: 18,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.border,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : AppColors.background,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.language_rounded,
                  color: isSelected ? AppColors.white : AppColors.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(
                        context,
                      ).textTheme.titleLarge?.copyWith(fontSize: 17),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                child: isSelected
                    ? const Icon(
                        Icons.check_circle_rounded,
                        key: ValueKey('selected'),
                        color: AppColors.primary,
                      )
                    : const SizedBox(
                        key: ValueKey('not-selected'),
                        width: 24,
                        height: 24,
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

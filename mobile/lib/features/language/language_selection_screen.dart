import 'package:flutter/material.dart';

import '../../config/theme/app_colors.dart';
import '../home/presentation/pages/home_page.dart';

class LanguageSelectionScreen extends StatefulWidget {
  const LanguageSelectionScreen({super.key});

  @override
  State<LanguageSelectionScreen> createState() =>
      _LanguageSelectionScreenState();
}

class _LanguageSelectionScreenState
    extends State<LanguageSelectionScreen> {
  String? selectedLanguage;

  void _continueToHome() {
    if (selectedLanguage == null) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => const HomePage(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Text(
                'Choose your language',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'You can change this later in your profile.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 40),
              _LanguageCard(
                title: 'کوردی بادینی',
                subtitle: 'Badini Kurdish',
                isSelected: selectedLanguage == 'badini',
                onTap: () {
                  setState(() {
                    selectedLanguage = 'badini';
                  });
                },
              ),
              const SizedBox(height: 12),
              _LanguageCard(
                title: 'English',
                subtitle: 'English',
                isSelected: selectedLanguage == 'english',
                onTap: () {
                  setState(() {
                    selectedLanguage = 'english';
                  });
                },
              ),
              const SizedBox(height: 12),
              _LanguageCard(
                title: 'العربية',
                subtitle: 'Arabic',
                isSelected: selectedLanguage == 'arabic',
                onTap: () {
                  setState(() {
                    selectedLanguage = 'arabic';
                  });
                },
              ),
              const Spacer(),
              ElevatedButton(
                onPressed:
                    selectedLanguage == null ? null : _continueToHome,
                child: const Text('Continue'),
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
          padding: const EdgeInsets.symmetric(
            horizontal: 18,
            vertical: 18,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isSelected
                  ? AppColors.primary
                  : AppColors.border,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.primary
                      : AppColors.background,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.language_rounded,
                  color: isSelected
                      ? AppColors.white
                      : AppColors.primary,
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
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontSize: 17),
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
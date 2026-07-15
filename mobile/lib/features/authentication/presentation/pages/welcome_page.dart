import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';

class WelcomePage extends StatelessWidget {
  const WelcomePage({
    required this.onContinue,
    required this.onContinueAsGuest,
    this.sessionExpired = false,
    super.key,
  });
  final VoidCallback onContinue, onContinueAsGuest;
  final bool sessionExpired;

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    return Scaffold(
      body: SafeArea(
        child: SaxlemResponsiveContent(
          child: SingleChildScrollView(
            padding: const EdgeInsetsDirectional.symmetric(
              vertical: SaxlemSpacing.four,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Image.asset(
                    'assets/images/saxlem_logo.png',
                    height: 42,
                    semanticLabel: strings.appName,
                  ),
                ),
                const SizedBox(height: SaxlemSpacing.six),
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(SaxlemRadii.extraLarge),
                  ),
                  child: Icon(
                    Icons.health_and_safety_outlined,
                    size: 36,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(height: SaxlemSpacing.three),
                Text(
                  strings.welcomeTitle,
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: SaxlemSpacing.two),
                Text(
                  strings.welcomeBody,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: SaxlemSpacing.three),
                SaxlemCard(
                  child: Column(
                    children: [
                      _TrustLine(
                        icon: Icons.verified_user_outlined,
                        text: strings.welcomeTrust,
                      ),
                      _TrustLine(
                        icon: Icons.search_rounded,
                        text: strings.welcomeBook,
                      ),
                      _TrustLine(
                        icon: Icons.timeline_rounded,
                        text: strings.welcomeQueue,
                      ),
                      _TrustLine(
                        icon: Icons.calendar_month_outlined,
                        text: strings.welcomeAppointments,
                      ),
                    ],
                  ),
                ),
                if (sessionExpired) ...[
                  const SizedBox(height: SaxlemSpacing.two),
                  SaxlemCard(
                    child: Text(
                      '${strings.sessionExpiredTitle}\n${strings.sessionExpiredBody}',
                    ),
                  ),
                ],
                const SizedBox(height: SaxlemSpacing.four),
                SaxlemButton(
                  label: strings.continueLabel,
                  onPressed: onContinue,
                  expand: true,
                ),
                const SizedBox(height: SaxlemSpacing.one),
                SaxlemButton(
                  label: strings.continueAsGuest,
                  onPressed: onContinueAsGuest,
                  hierarchy: SaxlemButtonHierarchy.tertiary,
                  expand: true,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TrustLine extends StatelessWidget {
  const _TrustLine({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.symmetric(vertical: SaxlemSpacing.one),
    child: Row(
      children: [
        Icon(icon, size: 22, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: SaxlemSpacing.two),
        Expanded(child: Text(text)),
      ],
    ),
  );
}

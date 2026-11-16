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
                Row(
                  children: [
                    SaxlemMark(size: 36, semanticLabel: strings.appName),
                    const SizedBox(width: 10),
                    ExcludeSemantics(
                      child: Text(
                        'saxlem',
                        style: TextStyle(
                          fontFamily: SaxlemTypography.display,
                          fontSize: 26,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -.8,
                          color: context.saxlemColors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: SaxlemSpacing.four),
                _Hero(title: strings.welcomeTitle, body: strings.welcomeBody),
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

class _Hero extends StatelessWidget {
  const _Hero({required this.title, required this.body});
  final String title, body;

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
          PositionedDirectional(
            end: -40,
            top: -30,
            child: Opacity(
              opacity: .16,
              child: SaxlemMark(size: 170, color: colors.onFill),
            ),
          ),
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(22, 96, 22, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Semantics(
                  header: true,
                  child: Text(
                    title,
                    style: theme.textTheme.headlineLarge?.copyWith(
                      color: colors.onFill,
                    ),
                  ),
                ),
                const SizedBox(height: SaxlemSpacing.one),
                Text(
                  body,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: colors.onFill.withValues(alpha: .92),
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

class _TrustLine extends StatelessWidget {
  const _TrustLine({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.symmetric(vertical: SaxlemSpacing.one),
    child: Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: context.saxlemColors.brandTint,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 19, color: context.saxlemColors.brandPrimary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(text, style: Theme.of(context).textTheme.bodyLarge),
        ),
      ],
    ),
  );
}

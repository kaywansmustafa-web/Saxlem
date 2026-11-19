import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';

/// First impression (v3): the Saxlem mark glowing in the aura on the night
/// ground, one promise, three reasons, one obvious button.
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
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final onNight = colors.onFill;
    return Scaffold(
      backgroundColor: colors.night,
      body: Stack(
        children: [
          const Positioned.fill(child: _NightAura()),
          SafeArea(
            child: SaxlemResponsiveContent(
              child: LayoutBuilder(
                builder: (context, constraints) => SingleChildScrollView(
                  padding: const EdgeInsetsDirectional.fromSTEB(4, 20, 4, 20),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight - 40,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            SaxlemMark(
                              size: 34,
                              onDark: true,
                              semanticLabel: strings.appName,
                            ),
                            const SizedBox(width: 10),
                            ExcludeSemantics(
                              child: Text(
                                'saxlem',
                                style: TextStyle(
                                  fontFamily: SaxlemTypography.display,
                                  fontSize: 24,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: -.8,
                                  color: onNight,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 56),
                        Center(
                          child: Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: onNight.withValues(alpha: .06),
                              border: Border.all(
                                color: onNight.withValues(alpha: .14),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: colors.auraStart.withValues(alpha: .5),
                                  blurRadius: 60,
                                  spreadRadius: 4,
                                ),
                              ],
                            ),
                            child: const Center(
                              child: SaxlemMark(
                                size: 64,
                                onDark: true,
                                semanticLabel: '',
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 40),
                        Semantics(
                          header: true,
                          child: Text(
                            strings.welcomeTitle,
                            style: theme.textTheme.displaySmall?.copyWith(
                              color: onNight,
                              fontWeight: FontWeight.w700,
                              height: 1.1,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          strings.welcomeBody,
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: onNight.withValues(alpha: .78),
                          ),
                        ),
                        const SizedBox(height: 28),
                        for (final (icon, text) in [
                          (Icons.search_rounded, strings.welcomeBook),
                          (Icons.timeline_rounded, strings.welcomeQueue),
                          (Icons.verified_user_outlined, strings.welcomeTrust),
                        ]) ...[
                          _Reason(icon: icon, text: text),
                          const SizedBox(height: 10),
                        ],
                        if (sessionExpired) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: colors.cautionSurface,
                              borderRadius: BorderRadius.circular(
                                SaxlemRadii.card,
                              ),
                            ),
                            child: Text(
                              '${strings.sessionExpiredTitle}\n${strings.sessionExpiredBody}',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: colors.cautionContent,
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 32),
                        _GlowButton(
                          label: strings.continueLabel,
                          onPressed: onContinue,
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: onContinueAsGuest,
                          style: TextButton.styleFrom(
                            foregroundColor: onNight,
                            minimumSize: const Size.fromHeight(52),
                            textStyle: theme.textTheme.titleSmall,
                          ),
                          child: Text(strings.continueAsGuest),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NightAura extends StatelessWidget {
  const _NightAura();

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    Widget orb(Color color, double size, double alpha, Alignment at) => Align(
      alignment: at,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              color.withValues(alpha: alpha),
              color.withValues(alpha: 0),
            ],
          ),
        ),
      ),
    );
    return IgnorePointer(
      child: Stack(
        children: [
          orb(colors.auraStart, 620, .55, const Alignment(1.6, -1.2)),
          orb(colors.auraEnd, 520, .40, const Alignment(-1.7, -.35)),
          orb(const Color(0xFF7C5CFF), 460, .28, const Alignment(1.4, .9)),
        ],
      ),
    );
  }
}

class _Reason extends StatelessWidget {
  const _Reason({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(12, 12, 16, 12),
      decoration: BoxDecoration(
        color: colors.onFill.withValues(alpha: .07),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.onFill.withValues(alpha: .12)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: colors.aura,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 19, color: colors.onFill),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colors.onFill.withValues(alpha: .92),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// The one primary action on the night ground: white, glowing.
class _GlowButton extends StatelessWidget {
  const _GlowButton({required this.label, required this.onPressed});
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(SaxlemRadii.large + 4),
        boxShadow: [
          BoxShadow(
            color: colors.auraStart.withValues(alpha: .45),
            blurRadius: 30,
            spreadRadius: -6,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: colors.onFill,
          foregroundColor: colors.night,
          minimumSize: const Size.fromHeight(58),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(SaxlemRadii.large + 4),
          ),
          textStyle: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        child: Text(label),
      ),
    );
  }
}

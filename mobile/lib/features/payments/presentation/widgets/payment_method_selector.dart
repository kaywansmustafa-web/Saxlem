import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/appointment_payment.dart';

/// The two ways to pay, as large tappable cards. Online appears only when the
/// clinic has connected its own merchant account.
class PaymentMethodSelector extends StatelessWidget {
  const PaymentMethodSelector({
    required this.selected,
    required this.onlineAvailable,
    required this.onChanged,
    this.loading = false,
    super.key,
  });
  final PaymentMethod selected;
  final bool onlineAvailable, loading;
  final ValueChanged<PaymentMethod> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Semantics(
      container: true,
      label: context.l10n.paymentHowToPay,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            context.l10n.paymentHowToPay,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          AnimatedSize(
            duration: SaxlemMotion.standard,
            curve: SaxlemMotion.standardCurve,
            alignment: AlignmentDirectional.topCenter,
            child: loading
                ? const _SelectorSkeleton()
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (onlineAvailable) ...[
                        _MethodCard(
                          key: const ValueKey('payment-online'),
                          selected: selected == PaymentMethod.online,
                          icon: Icons.bolt_rounded,
                          title: context.l10n.paymentOnlineTitle,
                          body: context.l10n.paymentOnlineBody,
                          badge: context.l10n.paymentRecommended,
                          trailing: const _FibMark(),
                          onTap: () => onChanged(PaymentMethod.online),
                        ),
                        const SizedBox(height: 10),
                      ],
                      _MethodCard(
                        key: const ValueKey('payment-counter'),
                        selected: selected == PaymentMethod.counter,
                        icon: Icons.storefront_rounded,
                        title: context.l10n.paymentAtCounterTitle,
                        body: context.l10n.paymentAtCounterBody,
                        onTap: () => onChanged(PaymentMethod.counter),
                      ),
                      if (!onlineAvailable) ...[
                        const SizedBox(height: 10),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              Icons.info_outline_rounded,
                              size: 18,
                              color: colors.textMuted,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                context.l10n.paymentOnlineUnavailable,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colors.textSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _MethodCard extends StatelessWidget {
  const _MethodCard({
    required this.selected,
    required this.icon,
    required this.title,
    required this.body,
    required this.onTap,
    this.badge,
    this.trailing,
    super.key,
  });
  final bool selected;
  final IconData icon;
  final String title, body;
  final String? badge;
  final Widget? trailing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final radius = BorderRadius.circular(SaxlemRadii.card);
    return Semantics(
      inMutuallyExclusiveGroup: true,
      checked: selected,
      button: true,
      label: '$title. $body',
      excludeSemantics: true,
      child: AnimatedContainer(
        duration: SaxlemMotion.standard,
        curve: SaxlemMotion.standardCurve,
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          borderRadius: radius,
          gradient: selected ? colors.aura : null,
          color: selected ? null : colors.border,
          boxShadow: selected
              ? SaxlemElevation.glow(colors.brandPrimary)
              : SaxlemElevation.none,
        ),
        child: Material(
          color: Colors.transparent,
          child: Ink(
            decoration: BoxDecoration(
              color: selected
                  ? Color.alphaBlend(colors.brandTint, colors.surfaceRaised)
                  : colors.surfaceRaised,
              borderRadius: BorderRadius.circular(SaxlemRadii.card - 2),
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(SaxlemRadii.card - 2),
              onTap: () {
                HapticFeedback.selectionClick();
                onTap();
              },
              child: Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(14, 14, 14, 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AnimatedContainer(
                      duration: SaxlemMotion.standard,
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: selected ? colors.deepAura : null,
                        color: selected ? null : colors.surfaceSunken,
                      ),
                      child: Icon(
                        icon,
                        size: 22,
                        color: selected ? colors.onFill : colors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            spacing: 8,
                            runSpacing: 4,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(
                                title,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if (badge != null)
                                Container(
                                  padding:
                                      const EdgeInsetsDirectional.symmetric(
                                        horizontal: 8,
                                        vertical: 2,
                                      ),
                                  decoration: BoxDecoration(
                                    color: colors.positiveSurface,
                                    borderRadius: BorderRadius.circular(
                                      SaxlemRadii.full,
                                    ),
                                  ),
                                  child: Text(
                                    badge!,
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      color: colors.positiveContent,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            body,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colors.textSecondary,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        _Radio(selected: selected),
                        if (trailing != null) ...[
                          const SizedBox(height: 10),
                          trailing!,
                        ],
                      ],
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

class _Radio extends StatelessWidget {
  const _Radio({required this.selected});
  final bool selected;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return AnimatedContainer(
      duration: SaxlemMotion.standard,
      curve: SaxlemMotion.standardCurve,
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: selected ? colors.deepAura : null,
        border: selected
            ? null
            : Border.all(color: colors.outlineStrong, width: 1.5),
      ),
      child: AnimatedScale(
        scale: selected ? 1 : 0,
        duration: SaxlemMotion.standard,
        curve: Curves.easeOutBack,
        child: Icon(Icons.check_rounded, size: 16, color: colors.onFill),
      ),
    );
  }
}

/// A neutral "FIB" wordmark chip (text only, no bank logo artwork).
class _FibMark extends StatelessWidget {
  const _FibMark();
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return Container(
      padding: const EdgeInsetsDirectional.symmetric(
        horizontal: 7,
        vertical: 3,
      ),
      decoration: BoxDecoration(
        color: colors.surfaceSunken,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: colors.border),
      ),
      child: Text(
        'FIB',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: .6,
          color: colors.textSecondary,
        ),
      ),
    );
  }
}

class _SelectorSkeleton extends StatelessWidget {
  const _SelectorSkeleton();
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return Column(
      children: [
        for (var i = 0; i < 2; i++) ...[
          Container(
            height: 84,
            decoration: BoxDecoration(
              color: colors.surfaceSunken,
              borderRadius: BorderRadius.circular(SaxlemRadii.card),
            ),
          ),
          if (i == 0) const SizedBox(height: 10),
        ],
      ],
    );
  }
}

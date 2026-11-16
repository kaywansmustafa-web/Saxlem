import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/appointment_payment.dart';
import '../../domain/payments_repository.dart';
import '../controllers/online_payment_controller.dart';
import '../payment_copy.dart';

/// Pay for an appointment in the FIB app. Pops with the latest
/// [AppointmentPayment] (or null if nothing was loaded).
class OnlinePaymentPage extends StatefulWidget {
  const OnlinePaymentPage({
    required this.repository,
    required this.appointmentId,
    this.title,
    this.subtitle,
    this.launcher,
    this.pollInterval = const Duration(seconds: 3),
    super.key,
  });
  final PaymentsRepository repository;
  final String appointmentId;
  final String? title, subtitle;

  /// Overridable in tests.
  final Future<bool> Function(Uri uri)? launcher;
  final Duration pollInterval;

  static Future<AppointmentPayment?> open(
    BuildContext context, {
    required PaymentsRepository repository,
    required String appointmentId,
    String? title,
    String? subtitle,
  }) => Navigator.of(context).push<AppointmentPayment>(
    MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => OnlinePaymentPage(
        repository: repository,
        appointmentId: appointmentId,
        title: title,
        subtitle: subtitle,
      ),
    ),
  );

  @override
  State<OnlinePaymentPage> createState() => _OnlinePaymentPageState();
}

class _OnlinePaymentPageState extends State<OnlinePaymentPage>
    with WidgetsBindingObserver {
  late final OnlinePaymentController controller;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    controller = OnlinePaymentController(
      repository: widget.repository,
      appointmentId: widget.appointmentId,
      pollInterval: widget.pollInterval,
    )..start();
    controller.addListener(_maybeCloseAfterCounter);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) controller.checkNow();
  }

  void _maybeCloseAfterCounter() {
    final payment = controller.payment;
    if (payment != null && payment.method == PaymentMethod.counter && mounted) {
      Navigator.of(context).pop(payment);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    controller.removeListener(_maybeCloseAfterCounter);
    controller.dispose();
    super.dispose();
  }

  Future<void> _open(Uri uri) async {
    final launch =
        widget.launcher ??
        (u) => launchUrl(u, mode: LaunchMode.externalApplication);
    final opened = await launch(uri);
    if (!opened && mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.l10n.paymentFibNotOpened)));
    }
  }

  @override
  Widget build(BuildContext context) => PopScope<AppointmentPayment>(
    canPop: false,
    onPopInvokedWithResult: (didPop, _) {
      if (!didPop) Navigator.of(context).pop(controller.payment);
    },
    child: Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.paymentTitle),
        leading: IconButton(
          tooltip: MaterialLocalizations.of(context).closeButtonTooltip,
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.of(context).pop(controller.payment),
        ),
      ),
      body: SafeArea(
        top: false,
        child: ListenableBuilder(
          listenable: controller,
          builder: (context, _) => AnimatedSwitcher(
            duration: SaxlemMotion.page,
            switchInCurve: SaxlemMotion.enter,
            switchOutCurve: SaxlemMotion.exit,
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: SlideTransition(
                position: Tween(
                  begin: const Offset(0, .03),
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            ),
            layoutBuilder: (current, previous) => Stack(
              alignment: AlignmentDirectional.topStart,
              fit: StackFit.expand,
              children: [...previous, ?current],
            ),
            child: _body(context),
          ),
        ),
      ),
    ),
  );

  Widget _body(BuildContext context) {
    final payment = controller.payment;
    if (payment == null && controller.problem != null) {
      return _Problem(
        key: const ValueKey('problem'),
        message: paymentProblemCopy(context, controller.problem!),
        onRetry: controller.start,
        onCounter: controller.switchToCounter,
        busy: controller.busy,
      );
    }
    if (payment == null) {
      return const Center(
        key: ValueKey('loading'),
        child: CircularProgressIndicator(),
      );
    }
    if (payment.isPaid) {
      return _Paid(
        key: const ValueKey('paid'),
        payment: payment,
        onDone: () => Navigator.of(context).pop(payment),
      );
    }
    if (controller.needsNewLink) {
      return _Expired(
        key: const ValueKey('expired'),
        busy: controller.busy,
        onRetry: controller.start,
        onCounter: controller.switchToCounter,
      );
    }
    return _Waiting(
      key: const ValueKey('waiting'),
      payment: payment,
      title: widget.title,
      subtitle: widget.subtitle,
      busy: controller.busy,
      problem: controller.problem,
      onOpen: _open,
      onCounter: controller.switchToCounter,
      onLater: () => Navigator.of(context).pop(payment),
    );
  }
}

class _Waiting extends StatelessWidget {
  const _Waiting({
    required this.payment,
    required this.busy,
    required this.onOpen,
    required this.onCounter,
    required this.onLater,
    this.title,
    this.subtitle,
    this.problem,
    super.key,
  });
  final AppointmentPayment payment;
  final bool busy;
  final String? title, subtitle;
  final PaymentProblem? problem;
  final Future<void> Function(Uri) onOpen;
  final VoidCallback onCounter, onLater;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final online = payment.online;
    final link = online?.personalAppLink;
    final validUntil = online?.validUntil;
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.only(top: 8, bottom: 32),
      child: SaxlemResponsiveContent(
        maxWidth: SaxlemSizes.formMaxWidth,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _AmountHero(
              amount: payment.amountIqd,
              title: title,
              subtitle: subtitle,
            ),
            const SizedBox(height: 22),
            const Center(child: _PulseBeacon()),
            const SizedBox(height: 14),
            Semantics(
              liveRegion: true,
              child: Text(
                context.l10n.paymentWaiting,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              context.l10n.paymentWaitingBody,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.textSecondary,
              ),
            ),
            const SizedBox(height: 22),
            if (link != null) ...[
              SaxlemButton(
                label: context.l10n.paymentOpenFib,
                leadingIcon: Icons.open_in_new_rounded,
                expand: true,
                onPressed: () => onOpen(link),
              ),
              const SizedBox(height: 16),
            ],
            // FIB patients pay by opening the app (same phone) or scanning the
            // QR (another phone). The FIB app has no field to type a code.
            if (online?.qrCode != null) _QrCard(dataUrl: online!.qrCode!),
            if (validUntil != null) ...[
              const SizedBox(height: 10),
              Text(
                context.l10n.paymentLinkValidUntil(
                  TimeOfDay.fromDateTime(validUntil.toLocal()).format(context),
                ),
                textAlign: TextAlign.center,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: colors.textMuted,
                ),
              ),
            ],
            if (problem != null) ...[
              const SizedBox(height: 12),
              Text(
                paymentProblemCopy(context, problem!),
                textAlign: TextAlign.center,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colors.criticalContent,
                ),
              ),
            ],
            const SizedBox(height: 22),
            SaxlemButton(
              label: context.l10n.paymentSwitchToCounter,
              hierarchy: SaxlemButtonHierarchy.secondary,
              leadingIcon: Icons.storefront_rounded,
              expand: true,
              loading: busy,
              onPressed: onCounter,
            ),
            const SizedBox(height: 6),
            SaxlemButton(
              label: context.l10n.paymentLater,
              hierarchy: SaxlemButtonHierarchy.tertiary,
              expand: true,
              onPressed: onLater,
            ),
            const SizedBox(height: 18),
            const _SecureNote(),
          ],
        ),
      ),
    );
  }
}

class _AmountHero extends StatelessWidget {
  const _AmountHero({required this.amount, this.title, this.subtitle});
  final int amount;
  final String? title, subtitle;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return Container(
      clipBehavior: Clip.antiAlias,
      padding: const EdgeInsetsDirectional.fromSTEB(22, 20, 22, 22),
      decoration: BoxDecoration(
        gradient: colors.deepAura,
        borderRadius: BorderRadius.circular(SaxlemRadii.hero),
        boxShadow: SaxlemElevation.glow(colors.brandPrimary),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          PositionedDirectional(
            end: -60,
            top: -70,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: colors.onFill.withValues(alpha: .07),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.l10n.paymentAmountDue,
                style: theme.textTheme.labelLarge?.copyWith(
                  color: colors.onFill.withValues(alpha: .85),
                ),
              ),
              const SizedBox(height: 4),
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: amount.toDouble()),
                duration: SaxlemMotion.celebration,
                curve: SaxlemMotion.enter,
                builder: (context, value, _) => Text(
                  formatIqd(value.round()),
                  style: theme.textTheme.displaySmall?.copyWith(
                    color: colors.onFill,
                    fontWeight: FontWeight.w700,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ),
              if (title != null) ...[
                const SizedBox(height: 10),
                Text(
                  title!,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: colors.onFill,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
              if (subtitle != null)
                Text(
                  subtitle!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colors.onFill.withValues(alpha: .85),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Three soft rings expanding from a phone icon while we wait for FIB.
class _PulseBeacon extends StatefulWidget {
  const _PulseBeacon();
  @override
  State<_PulseBeacon> createState() => _PulseBeaconState();
}

class _PulseBeaconState extends State<_PulseBeacon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _c.stop();
    } else if (!_c.isAnimating) {
      _c.repeat();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return SizedBox(
      width: 120,
      height: 120,
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, child) => Stack(
          alignment: Alignment.center,
          children: [
            for (var i = 0; i < 3; i++)
              Builder(
                builder: (context) {
                  final t = (_c.value + i / 3) % 1;
                  return Opacity(
                    opacity: (1 - t) * .55,
                    child: Container(
                      width: 56 + 64 * t,
                      height: 56 + 64 * t,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Color.lerp(
                            colors.auraStart,
                            colors.auraEnd,
                            t,
                          )!,
                          width: 2,
                        ),
                      ),
                    ),
                  );
                },
              ),
            child!,
          ],
        ),
        child: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: colors.aura,
            boxShadow: SaxlemElevation.glow(colors.brandPrimary),
          ),
          child: Icon(
            Icons.phone_iphone_rounded,
            color: colors.onFill,
            size: 28,
          ),
        ),
      ),
    );
  }
}

class _QrCard extends StatelessWidget {
  const _QrCard({required this.dataUrl});
  final String dataUrl;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final bytes = base64Decode(dataUrl.substring(dataUrl.indexOf(',') + 1));
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceRaised,
        borderRadius: BorderRadius.circular(SaxlemRadii.card),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.memory(
              bytes,
              width: 96,
              height: 96,
              gaplessPlayback: true,
              semanticLabel: context.l10n.paymentScanQr,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              context.l10n.paymentScanQr,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _Paid extends StatelessWidget {
  const _Paid({required this.payment, required this.onDone, super.key});
  final AppointmentPayment payment;
  final VoidCallback onDone;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.only(top: 40, bottom: 32),
      child: SaxlemResponsiveContent(
        maxWidth: SaxlemSizes.formMaxWidth,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Center(child: _SuccessBurst()),
            const SizedBox(height: 24),
            Semantics(
              liveRegion: true,
              header: true,
              child: Text(
                context.l10n.paymentPaidTitle,
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineMedium,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              context.l10n.paymentPaidBody,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: colors.textSecondary,
              ),
            ),
            const SizedBox(height: 18),
            Center(
              child: Container(
                padding: const EdgeInsetsDirectional.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: colors.positiveSurface,
                  borderRadius: BorderRadius.circular(SaxlemRadii.full),
                ),
                child: Text(
                  formatIqd(payment.amountIqd),
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: colors.positiveContent,
                    fontWeight: FontWeight.w700,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            SaxlemButton(
              label: MaterialLocalizations.of(context).okButtonLabel,
              expand: true,
              onPressed: onDone,
            ),
          ],
        ),
      ),
    );
  }
}

/// Check mark that pops in with a ring of dots bursting outward.
class _SuccessBurst extends StatefulWidget {
  const _SuccessBurst();
  @override
  State<_SuccessBurst> createState() => _SuccessBurstState();
}

class _SuccessBurstState extends State<_SuccessBurst>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  );

  @override
  void initState() {
    super.initState();
    HapticFeedback.mediumImpact();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _c.value = 1;
    } else if (_c.value == 0) {
      _c.forward();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return SizedBox(
      width: 160,
      height: 160,
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) {
          final pop = Curves.elasticOut.transform(
            (_c.value / .7).clamp(0.0, 1.0),
          );
          final burst = Curves.easeOutCubic.transform(_c.value);
          return Stack(
            alignment: Alignment.center,
            children: [
              for (var i = 0; i < 10; i++)
                Transform.translate(
                  offset: Offset.fromDirection(
                    i * math.pi / 5,
                    30 + 46 * burst,
                  ),
                  child: Opacity(
                    opacity: (1 - burst).clamp(0.0, 1.0),
                    child: Container(
                      width: i.isEven ? 8 : 6,
                      height: i.isEven ? 8 : 6,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: i.isEven ? colors.auraStart : colors.auraEnd,
                      ),
                    ),
                  ),
                ),
              Transform.scale(
                scale: pop,
                child: Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: colors.aura,
                    boxShadow: SaxlemElevation.glow(colors.brandPrimary),
                  ),
                  child: Icon(
                    Icons.check_rounded,
                    size: 54,
                    color: colors.onFill,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Expired extends StatelessWidget {
  const _Expired({
    required this.busy,
    required this.onRetry,
    required this.onCounter,
    super.key,
  });
  final bool busy;
  final VoidCallback onRetry, onCounter;
  @override
  Widget build(BuildContext context) => _Message(
    icon: Icons.timer_off_rounded,
    title: context.l10n.paymentExpiredTitle,
    body: context.l10n.paymentExpiredBody,
    primary: context.l10n.paymentTryAgain,
    onPrimary: onRetry,
    secondary: context.l10n.paymentSwitchToCounter,
    onSecondary: onCounter,
    busy: busy,
  );
}

class _Problem extends StatelessWidget {
  const _Problem({
    required this.message,
    required this.onRetry,
    required this.onCounter,
    required this.busy,
    super.key,
  });
  final String message;
  final bool busy;
  final VoidCallback onRetry, onCounter;
  @override
  Widget build(BuildContext context) => _Message(
    icon: Icons.wifi_tethering_error_rounded,
    title: context.l10n.paymentTitle,
    body: message,
    primary: context.l10n.paymentTryAgain,
    onPrimary: onRetry,
    secondary: context.l10n.paymentSwitchToCounter,
    onSecondary: onCounter,
    busy: busy,
  );
}

class _Message extends StatelessWidget {
  const _Message({
    required this.icon,
    required this.title,
    required this.body,
    required this.primary,
    required this.onPrimary,
    required this.secondary,
    required this.onSecondary,
    required this.busy,
  });
  final IconData icon;
  final String title, body, primary, secondary;
  final VoidCallback onPrimary, onSecondary;
  final bool busy;
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.only(top: 48, bottom: 32),
      child: SaxlemResponsiveContent(
        maxWidth: SaxlemSizes.formMaxWidth,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 84,
                height: 84,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: colors.cautionSurface,
                ),
                child: Icon(icon, size: 38, color: colors.cautionContent),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              textAlign: TextAlign.center,
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              body,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: colors.textSecondary,
              ),
            ),
            const SizedBox(height: 28),
            SaxlemButton(
              label: primary,
              expand: true,
              loading: busy,
              onPressed: onPrimary,
            ),
            const SizedBox(height: 8),
            SaxlemButton(
              label: secondary,
              hierarchy: SaxlemButtonHierarchy.secondary,
              leadingIcon: Icons.storefront_rounded,
              expand: true,
              onPressed: busy ? null : onSecondary,
            ),
          ],
        ),
      ),
    );
  }
}

class _SecureNote extends StatelessWidget {
  const _SecureNote();
  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return Container(
      padding: const EdgeInsetsDirectional.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceSunken,
        borderRadius: BorderRadius.circular(SaxlemRadii.medium),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.lock_rounded, size: 18, color: colors.positiveContent),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              context.l10n.paymentSecureNote,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.textSecondary,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/components/content/saxlem_avatar.dart';
import '../../../../design_system/foundations/saxlem_elevation.dart';
import '../../../../design_system/foundations/saxlem_motion.dart';
import '../../../../design_system/foundations/saxlem_radii.dart';
import '../../../../design_system/theme/saxlem_colors.dart';
import '../../domain/entities/patient_queue_status.dart';

/// The live ticket (v2 "Aura"): Saxlem's signature screen element.
///
/// Waiting: a white card with the ticket number in large display type, a ring
/// that fills as the patient gets closer to the front, the time range and the
/// clinic's instruction. Called: the card turns to the Deep Aura gradient with
/// white text. Every value comes from the backend; nothing is estimated here.
class LiveTicket extends StatelessWidget {
  const LiveTicket({required this.status, super.key});
  final PatientQueueStatus status;

  @override
  Widget build(BuildContext context) => switch (status.patientEntryStatus) {
    PatientEntryStatus.called => _CalledTicket(status: status),
    PatientEntryStatus.waiting ||
    PatientEntryStatus.notEnqueued => _WaitingTicket(status: status),
    PatientEntryStatus.noResponse => _NoticeTicket(
      status: status,
      tone: _NoticeTone.caution,
      icon: Icons.notifications_active_rounded,
      title: context.l10n.calledNoResponseTitle,
    ),
    PatientEntryStatus.inConsultation => _NoticeTicket(
      status: status,
      tone: _NoticeTone.positive,
      icon: Icons.medical_services_rounded,
      title: context.l10n.withDoctorTitle,
    ),
    PatientEntryStatus.completed => _NoticeTicket(
      status: status,
      tone: _NoticeTone.positive,
      icon: Icons.check_circle_rounded,
      title: context.l10n.visitCompleteTitle,
    ),
    PatientEntryStatus.removed => _NoticeTicket(
      status: status,
      tone: _NoticeTone.neutral,
      icon: Icons.event_busy_rounded,
      title: context.l10n.removedFromQueueTitle,
    ),
  };
}

String _initials(String name) {
  final parts = name
      .replaceFirst(RegExp(r'^(Dr\.?|د\.)\s*', caseSensitive: false), '')
      .split(RegExp(r'\s+'))
      .where((p) => p.isNotEmpty)
      .toList();
  if (parts.isEmpty) return '';
  final first = parts.first.characters.first;
  final last = parts.length > 1 ? parts.last.characters.first : '';
  return (first + last).toUpperCase();
}

class _TicketHeader extends StatelessWidget {
  const _TicketHeader({required this.status, this.onGradient = false});
  final PatientQueueStatus status;
  final bool onGradient;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final ink = onGradient ? colors.onFill : colors.textPrimary;
    final sub = onGradient
        ? colors.onFill.withValues(alpha: .86)
        : colors.textSecondary;
    return Row(
      children: [
        onGradient
            ? Container(
                width: 48,
                height: 48,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: colors.onFill.withValues(alpha: .2),
                  shape: BoxShape.circle,
                ),
                child: Text(
                  _initials(status.doctor.name),
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: colors.onFill,
                    fontFamily: theme.textTheme.titleLarge?.fontFamily,
                  ),
                ),
              )
            : SaxlemAvatar(
                semanticLabel: status.doctor.name,
                initials: _initials(status.doctor.name),
                size: 48,
                ring: true,
              ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                status.doctor.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.titleMedium?.copyWith(
                  color: ink,
                  fontFamily: theme.textTheme.titleLarge?.fontFamily,
                ),
              ),
              Text(
                status.clinic.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodySmall?.copyWith(color: sub),
              ),
            ],
          ),
        ),
        if (!onGradient && status.queueState == QueueState.open) ...[
          const SizedBox(width: 8),
          const LiveBadge(),
        ],
      ],
    );
  }
}

/// A "LIVE" pill whose dot pulses (still when reduced motion is on).
class LiveBadge extends StatefulWidget {
  const LiveBadge({super.key});
  @override
  State<LiveBadge> createState() => _LiveBadgeState();
}

class _LiveBadgeState extends State<LiveBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _pulse.stop();
    } else if (!_pulse.isAnimating) {
      _pulse.repeat();
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(10, 5, 12, 5),
      decoration: BoxDecoration(
        color: colors.brandTint,
        borderRadius: BorderRadius.circular(SaxlemRadii.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _pulse,
            builder: (context, _) => Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                color: colors.brandPrimary,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: colors.brandPrimary.withValues(
                      alpha: (1 - _pulse.value) * .5,
                    ),
                    spreadRadius: _pulse.value * 6,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 7),
          Text(
            context.l10n.live,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: colors.brandPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _WaitingTicket extends StatelessWidget {
  const _WaitingTicket({required this.status});
  final PatientQueueStatus status;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final l10n = context.l10n;
    final wait = status.estimatedWait;
    final notArrived =
        status.patientEntryStatus == PatientEntryStatus.notEnqueued;
    return Semantics(
      container: true,
      label: [
        if (status.ticketNumber != null)
          '${l10n.yourNumber} ${status.ticketNumber}',
        l10n.patientsAheadCount(status.patientsAhead),
        if (wait != null && !status.estimateSuspended)
          l10n.waitRange(
            wait.minimumMinutes,
            wait.maximumMinutes,
            l10n.minutesShort,
          ),
      ].join('. '),
      child: Container(
        padding: const EdgeInsetsDirectional.fromSTEB(20, 20, 20, 20),
        decoration: BoxDecoration(
          color: colors.surfaceRaised,
          borderRadius: BorderRadius.circular(SaxlemRadii.hero),
          border: Border.all(color: colors.border),
          boxShadow: SaxlemElevation.level2(colors.night),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _TicketHeader(status: status),
            const SizedBox(height: 24),
            if (notArrived) ...[
              Text(l10n.notCheckedInTitle, style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
            ],
            ExcludeSemantics(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.yourNumber,
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: colors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: AlignmentDirectional.centerStart,
                          child: AnimatedSwitcher(
                            duration: SaxlemMotion.standard,
                            child: Text(
                              '${status.ticketNumber ?? '—'}',
                              key: ValueKey(status.ticketNumber),
                              style: _ticketNumberStyle(
                                context,
                                colors.textPrimary,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  AheadRing(ahead: status.patientsAhead),
                ],
              ),
            ),
            if (wait != null && !status.estimateSuspended) ...[
              const SizedBox(height: 20),
              Text(
                l10n.waitRange(
                  wait.minimumMinutes,
                  wait.maximumMinutes,
                  l10n.minutesShort,
                ),
                style: theme.textTheme.titleMedium,
              ),
            ],
            if (status.instruction.isNotEmpty) ...[
              const SizedBox(height: 4),
              Semantics(
                liveRegion: true,
                child: Text(
                  status.instruction,
                  style: theme.textTheme.bodyMedium,
                ),
              ),
            ],
            const SizedBox(height: 20),
            _QueueSteps(current: notArrived ? 1 : 2),
          ],
        ),
      ),
    );
  }
}

TextStyle _ticketNumberStyle(BuildContext context, Color color) {
  final theme = Theme.of(context);
  return theme.textTheme.displayMedium!.copyWith(
    fontSize: 64,
    height: 1.05,
    color: color,
    fontWeight: FontWeight.w700,
    fontFeatures: const [FontFeature.tabularFigures()],
  );
}

/// A ring that fills as fewer people are ahead: 1 / (ahead + 1). It is a
/// picture of closeness, not a promise of time.
class AheadRing extends StatelessWidget {
  const AheadRing({required this.ahead, this.size = 108, super.key});
  final int ahead;
  final double size;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final progress = 1 / (ahead + 1);
    return SizedBox.square(
      dimension: size,
      child: TweenAnimationBuilder<double>(
        tween: Tween(end: progress),
        duration: SaxlemMotion.slow,
        curve: SaxlemMotion.standardCurve,
        builder: (context, value, _) => CustomPaint(
          painter: _RingPainter(
            progress: value,
            track: colors.surfaceSunken,
            start: colors.auraStart,
            end: colors.auraEnd,
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '$ahead',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
                Text(
                  context.l10n.aheadShort,
                  style: theme.textTheme.labelSmall,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({
    required this.progress,
    required this.track,
    required this.start,
    required this.end,
  });
  final double progress;
  final Color track, start, end;

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 10.0;
    final rect = Offset.zero & size;
    final arcRect = rect.deflate(stroke / 2);
    canvas.drawArc(
      arcRect,
      0,
      math.pi * 2,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..color = track,
    );
    if (progress <= 0) return;
    canvas.drawArc(
      arcRect,
      -math.pi / 2,
      math.pi * 2 * progress.clamp(0, 1),
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..shader = SweepGradient(
          startAngle: -math.pi / 2,
          endAngle: math.pi * 1.5,
          colors: [start, end, start],
          stops: const [0, .5, 1],
          transform: const GradientRotation(-math.pi / 2),
        ).createShader(rect),
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.progress != progress || old.track != track;
}

class _QueueSteps extends StatelessWidget {
  const _QueueSteps({required this.current});

  /// 0 booked, 1 arrived, 2 waiting, 3 your turn: the step in progress.
  final int current;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final l10n = context.l10n;
    final labels = [
      l10n.queueStepBooked,
      l10n.queueStepArrived,
      l10n.queueStepWaiting,
      l10n.queueStepYourTurn,
    ];
    return ExcludeSemantics(
      child: Row(
        children: List.generate(4, (i) {
          final done = i < current;
          final now = i == current;
          return Expanded(
            child: Padding(
              padding: EdgeInsetsDirectional.only(end: i == 3 ? 0 : 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 6,
                    decoration: BoxDecoration(
                      color: done
                          ? colors.brandPrimary
                          : (now ? null : colors.surfaceSunken),
                      gradient: now ? colors.aura : null,
                      borderRadius: BorderRadius.circular(SaxlemRadii.full),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    labels[i],
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: now ? colors.textPrimary : colors.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _CalledTicket extends StatelessWidget {
  const _CalledTicket({required this.status});
  final PatientQueueStatus status;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final l10n = context.l10n;
    return Semantics(
      container: true,
      liveRegion: true,
      label: '${l10n.itsYourTurn}. ${status.instruction}',
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          gradient: colors.deepAura,
          borderRadius: BorderRadius.circular(SaxlemRadii.hero),
          boxShadow: [
            ...SaxlemElevation.glow(colors.brandPrimary),
            ...SaxlemElevation.level2(colors.night),
          ],
        ),
        child: Stack(
          children: [
            PositionedDirectional(
              end: -90,
              top: -110,
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      colors.onFill.withValues(alpha: .22),
                      colors.onFill.withValues(alpha: 0),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsetsDirectional.all(20),
              child: ExcludeSemantics(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _TicketHeader(status: status, onGradient: true),
                    const SizedBox(height: 28),
                    Container(
                      padding: const EdgeInsetsDirectional.symmetric(
                        horizontal: 14,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: colors.onFill,
                        borderRadius: BorderRadius.circular(SaxlemRadii.full),
                      ),
                      child: Text(
                        l10n.itsYourTurn,
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: colors.night,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    if (status.ticketNumber != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        '${status.ticketNumber}',
                        style: _ticketNumberStyle(context, colors.onFill),
                      ),
                    ],
                    if (status.instruction.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(
                        status.instruction,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          color: colors.onFill,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

enum _NoticeTone { positive, caution, neutral }

class _NoticeTicket extends StatelessWidget {
  const _NoticeTicket({
    required this.status,
    required this.tone,
    required this.icon,
    required this.title,
  });
  final PatientQueueStatus status;
  final _NoticeTone tone;
  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final (tint, ink) = switch (tone) {
      _NoticeTone.positive => (colors.positiveSurface, colors.positiveContent),
      _NoticeTone.caution => (colors.cautionSurface, colors.cautionContent),
      _NoticeTone.neutral => (colors.surfaceSunken, colors.textSecondary),
    };
    return Semantics(
      container: true,
      liveRegion: true,
      label: '$title. ${status.instruction}',
      child: Container(
        padding: const EdgeInsetsDirectional.all(20),
        decoration: BoxDecoration(
          color: colors.surfaceRaised,
          borderRadius: BorderRadius.circular(SaxlemRadii.hero),
          border: Border.all(color: colors.border),
          boxShadow: SaxlemElevation.level2(colors.night),
        ),
        child: ExcludeSemantics(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _TicketHeader(status: status),
              const SizedBox(height: 24),
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(color: tint, shape: BoxShape.circle),
                child: Icon(icon, color: ink, size: 28),
              ),
              const SizedBox(height: 16),
              Text(title, style: theme.textTheme.headlineSmall),
              if (status.instruction.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(status.instruction, style: theme.textTheme.bodyLarge),
              ],
              if (status.ticketNumber != null) ...[
                const SizedBox(height: 16),
                Text(
                  '${context.l10n.yourNumber} ${status.ticketNumber}',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

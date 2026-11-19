import 'package:flutter/material.dart';

import '../../../../core/formatting/clinic_format.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/location/patient_locator.dart';
import '../../../../core/notifications/leave_alerts.dart';
import '../../../../design_system/design_system.dart';
import '../../../../l10n/app_localizations.dart';
import '../../domain/entities/departure_plan.dart';
import '../../domain/entities/patient_appointment.dart';
import 'leave_by_controller.dart';
import 'leave_by_services.dart';

enum LeaveByLook {
  /// A card of its own, on the visit's page.
  card,

  /// One line inside Home's dark "next visit" card.
  onAura,
}

/// "Leave by 09:40 · 14 min drive · 8.2 km", from the patient's location, for
/// a visit in the next 24 hours. Asks before reading the location; quietly
/// absent when there's nothing to say.
class LeaveByPanel extends StatefulWidget {
  const LeaveByPanel({
    required this.appointment,
    required this.planner,
    this.services,
    this.look = LeaveByLook.card,
    this.now = DateTime.now,
    super.key,
  });

  final PatientAppointment appointment;
  final DeparturePlanner? planner;
  final LeaveByServices? services;
  final LeaveByLook look;
  final DateTime Function() now;

  @override
  State<LeaveByPanel> createState() => _LeaveByPanelState();
}

class _LeaveByPanelState extends State<LeaveByPanel> {
  LeaveByController? _controller;

  @override
  void initState() {
    super.initState();
    _create();
  }

  @override
  void didUpdateWidget(LeaveByPanel old) {
    super.didUpdateWidget(old);
    if (old.appointment.id != widget.appointment.id ||
        !old.appointment.startsAt.isAtSameMomentAs(
          widget.appointment.startsAt,
        ) ||
        old.appointment.status != widget.appointment.status ||
        old.planner != widget.planner) {
      _controller?.dispose();
      _create();
    }
  }

  void _create() {
    final planner = widget.planner;
    _controller = planner == null
        ? null
        : (LeaveByController(
            appointment: widget.appointment,
            planner: planner,
            services: widget.services ?? LeaveByServices.device,
            alertFor: _alert,
            now: widget.now,
          )..start());
  }

  LeaveAlert _alert(DeparturePlan plan, DateTime at) {
    final strings = context.l10n;
    final item = widget.appointment;
    return LeaveAlert(
      appointmentId: item.id,
      profileId: item.profileId.value,
      at: at,
      channelName: strings.leaveAlertChannel,
      title: strings.leaveAlertTitle,
      body: strings.leaveAlertBody(
        ClinicFormat.time(plan.leaveAt),
        item.doctor.displayName,
        ClinicFormat.time(item.startsAt),
        plan.travelMinutes,
      ),
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    if (controller == null) return const SizedBox.shrink();
    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) => switch (widget.look) {
        LeaveByLook.card => _card(context, controller),
        LeaveByLook.onAura => _line(context, controller),
      },
    );
  }

  // ---- The visit page ----------------------------------------------------

  Widget _card(BuildContext context, LeaveByController controller) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final strings = context.l10n;
    final state = controller.state;
    if (state is LeaveByHidden) return const SizedBox.shrink();
    final late = state is LeaveByReady && _late(state.plan);
    final Widget body = switch (state) {
      LeaveByHidden() => const SizedBox.shrink(),
      LeaveByAsk() => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _heading(
            context,
            strings.leaveAskTitle,
            Icons.directions_car_rounded,
          ),
          const SizedBox(height: 8),
          Text(
            strings.leaveAskBody,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colors.textSecondary,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(
                Icons.lock_outline_rounded,
                size: 14,
                color: colors.textMuted,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  strings.leaveAskPrivacy,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colors.textMuted,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SaxlemButton(
            label: strings.leaveAskButton,
            leadingIcon: Icons.my_location_rounded,
            hierarchy: SaxlemButtonHierarchy.secondary,
            expand: true,
            onPressed: controller.enable,
          ),
        ],
      ),
      LeaveByWorking() => Row(
        children: [
          const SizedBox.square(
            dimension: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              strings.leaveWorking,
              style: theme.textTheme.bodyMedium,
            ),
          ),
        ],
      ),
      LeaveByReady(:final plan, :final approximate) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: late ? colors.cautionSurface : colors.brandTint,
                  borderRadius: BorderRadius.circular(SaxlemRadii.small),
                ),
                child: Icon(
                  Icons.directions_car_rounded,
                  size: 20,
                  color: late ? colors.cautionContent : colors.brandPrimary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _headline(strings, plan),
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: late ? colors.cautionContent : null,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _detail(strings, plan, approximate: approximate),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            strings.leaveArriveBy(ClinicFormat.time(plan.arriveBy)),
            style: theme.textTheme.bodyMedium,
          ),
          if (controller.canSayOnMyWay(plan)) ...[
            const SizedBox(height: 12),
            SaxlemButton(
              label: strings.leaveOnMyWay,
              leadingIcon: Icons.near_me_rounded,
              expand: true,
              onPressed: controller.onMyWay,
            ),
            const SizedBox(height: 6),
            Text(
              controller.onMyWayFailed
                  ? strings.leaveOnMyWayFailed
                  : strings.leaveOnMyWayNote,
              style: theme.textTheme.bodySmall?.copyWith(
                color: controller.onMyWayFailed
                    ? colors.criticalContent
                    : colors.textMuted,
              ),
            ),
          ],
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: TextButton(
              onPressed: controller.disable,
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                foregroundColor: colors.textMuted,
                textStyle: theme.textTheme.labelMedium,
              ),
              child: Text(strings.leaveStop),
            ),
          ),
        ],
      ),
      LeaveByBlocked(:final problem) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _heading(context, strings.leaveAskTitle, Icons.location_off_rounded),
          const SizedBox(height: 8),
          Text(
            problem == LocationProblem.serviceOff
                ? strings.leaveServiceOff
                : strings.leaveDeniedForever,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colors.textSecondary,
            ),
          ),
          const SizedBox(height: 12),
          SaxlemButton(
            label: problem == LocationProblem.serviceOff
                ? strings.leaveTurnOn
                : strings.leaveOpenSettings,
            leadingIcon: Icons.settings_rounded,
            hierarchy: SaxlemButtonHierarchy.secondary,
            expand: true,
            onPressed: () async {
              await controller.openSettings();
              await controller.refresh();
            },
          ),
        ],
      ),
      LeaveByOnTheWay(:final arrivalEta) => Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: colors.positiveSurface,
              borderRadius: BorderRadius.circular(SaxlemRadii.small),
            ),
            child: Icon(
              Icons.near_me_rounded,
              size: 20,
              color: colors.positiveContent,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.leaveOnTheWayTitle,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  strings.leaveExpectedAt(ClinicFormat.time(arrivalEta)),
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 2),
                Text(
                  strings.leaveReceptionSees,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colors.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      LeaveByFailed() => Row(
        children: [
          Expanded(
            child: Text(
              strings.leaveFailed,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.textSecondary,
              ),
            ),
          ),
          TextButton(
            onPressed: controller.refresh,
            child: Text(strings.tryAgain),
          ),
        ],
      ),
    };
    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: 16),
      child: Semantics(
        liveRegion: state is LeaveByReady,
        container: true,
        child: SaxlemCard(
          borderColor: late ? colors.cautionContent : null,
          child: AnimatedSize(
            duration: SaxlemMotion.standard,
            alignment: AlignmentDirectional.topStart,
            child: body,
          ),
        ),
      ),
    );
  }

  Widget _heading(BuildContext context, String text, IconData icon) {
    final colors = context.saxlemColors;
    return Row(
      children: [
        Icon(icon, size: 20, color: colors.brandPrimary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(text, style: Theme.of(context).textTheme.titleSmall),
        ),
      ],
    );
  }

  // ---- Home's next-visit card -------------------------------------------

  Widget _line(BuildContext context, LeaveByController controller) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final strings = context.l10n;
    final state = controller.state;
    final (IconData, String, VoidCallback?)? line = switch (state) {
      LeaveByAsk() => (
        Icons.directions_car_rounded,
        '${strings.leaveAskTitle} · ${strings.leaveAskButton}',
        controller.enable,
      ),
      LeaveByWorking() => (
        Icons.directions_car_rounded,
        strings.leaveWorking,
        null,
      ),
      LeaveByReady(:final plan) when controller.canSayOnMyWay(plan) => (
        _late(plan)
            ? Icons.warning_amber_rounded
            : Icons.directions_car_rounded,
        '${_headline(strings, plan)} · ${strings.leaveOnMyWay}',
        controller.onMyWay,
      ),
      LeaveByReady(:final plan) => (
        Icons.directions_car_rounded,
        // Short enough for one line on a phone; the visit page has the rest.
        '${_headline(strings, plan)} · ${strings.minutesShortDrive(plan.travelMinutes)}',
        null,
      ),
      LeaveByOnTheWay(:final arrivalEta) => (
        Icons.near_me_rounded,
        strings.leaveExpectedShort(ClinicFormat.time(arrivalEta)),
        null,
      ),
      LeaveByBlocked(:final problem) => (
        Icons.location_off_rounded,
        problem == LocationProblem.serviceOff
            ? strings.leaveServiceOff
            : strings.leaveDeniedForever,
        () async {
          await controller.openSettings();
          await controller.refresh();
        },
      ),
      LeaveByHidden() || LeaveByFailed() => null,
    };
    if (line == null) return const SizedBox.shrink();
    final (icon, text, onTap) = line;
    final content = Container(
      padding: const EdgeInsetsDirectional.symmetric(
        horizontal: 12,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: colors.onFill.withValues(alpha: .16),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: colors.onFill),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: theme.textTheme.labelLarge?.copyWith(
                color: colors.onFill,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          if (onTap != null)
            Icon(
              Directionality.of(context) == TextDirection.rtl
                  ? Icons.chevron_left_rounded
                  : Icons.chevron_right_rounded,
              size: 18,
              color: colors.onFill,
            ),
        ],
      ),
    );
    return Padding(
      padding: const EdgeInsetsDirectional.only(top: 10),
      child: Semantics(
        liveRegion: state is LeaveByReady,
        button: onTap != null,
        child: onTap == null
            ? content
            : Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: onTap,
                  child: content,
                ),
              ),
      ),
    );
  }

  // ---- Words -------------------------------------------------------------

  bool _late(DeparturePlan plan) =>
      widget.now().isAfter(plan.leaveAt.add(const Duration(minutes: 2)));

  String _headline(AppLocalizations strings, DeparturePlan plan) {
    final left = plan.leaveAt.difference(widget.now());
    if (_late(plan)) return strings.leaveLate;
    if (left <= const Duration(minutes: 1)) return strings.leaveNow;
    if (left <= const Duration(minutes: 15)) {
      return strings.leaveInMinutes((left.inSeconds / 60).ceil());
    }
    return strings.leaveByTime(ClinicFormat.time(plan.leaveAt));
  }

  String _detail(
    AppLocalizations strings,
    DeparturePlan plan, {
    required bool approximate,
  }) => [
    strings.leaveDrive(
      plan.travelMinutes,
      _distance(strings, plan.distanceMeters),
    ),
    switch (plan.source) {
      DepartureSource.traffic => strings.leaveWithTraffic,
      DepartureSource.roads => strings.leaveNoTraffic,
      DepartureSource.estimate => strings.leaveEstimate,
      DepartureSource.learned => strings.leaveLearned,
    },
    if (approximate) strings.leaveApproximate,
  ].join(' · ');

  static String _distance(AppLocalizations strings, int meters) => meters < 1000
      ? strings.leaveMeters(((meters / 50).round() * 50).toString())
      : strings.leaveKm(
          (meters / 1000).toStringAsFixed(meters < 10000 ? 1 : 0),
        );
}

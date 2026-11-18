import 'package:flutter/material.dart';

import '../../../../core/formatting/clinic_format.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../../booking/domain/entities/appointment_slot.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../domain/repositories/patient_appointments_repository.dart';

/// "Tell me if an earlier time opens" for an upcoming visit, and the earlier
/// time Saxlem found, with one tap to move to it.
class EarlierTimeCard extends StatefulWidget {
  const EarlierTimeCard({
    required this.appointment,
    required this.source,
    required this.onMove,
    this.now = DateTime.now,
    super.key,
  });
  final PatientAppointment appointment;
  final EarlierTimeSource source;
  final Future<void> Function(AppointmentSlot slot) onMove;
  final DateTime Function() now;

  @override
  State<EarlierTimeCard> createState() => _EarlierTimeCardState();
}

class _EarlierTimeCardState extends State<EarlierTimeCard> {
  EarlierTimeStatus? _status;
  bool _busy = false, _failed = false;

  bool get _farEnough =>
      widget.appointment.canMutate &&
      widget.appointment.startsAt.difference(widget.now()) >=
          const Duration(hours: 3);

  @override
  void initState() {
    super.initState();
    if (!_farEnough) return;
    widget.source
        .earlierTime(widget.appointment.id)
        .then((status) {
          if (mounted) setState(() => _status = status);
        })
        .catchError((Object _) {});
  }

  Future<void> _watch(bool watch) async {
    setState(() {
      _busy = true;
      _failed = false;
    });
    try {
      final status = await widget.source.watchEarlierTime(
        widget.appointment.id,
        watch: watch,
      );
      if (mounted) setState(() => _status = status);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = _status;
    if (status == null || !_farEnough) return const SizedBox.shrink();
    final strings = context.l10n;
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    final language = Localizations.localeOf(context).languageCode;
    final offer = status.offer;
    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: 16),
      child: SaxlemCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (offer != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: colors.positiveSurface,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      strings.earlierFound,
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: colors.positiveContent,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${ClinicFormat.clinicDay(offer.startsAt, language)} · ${ClinicFormat.time(offer.startsAt)}',
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 10),
                    SaxlemButton(
                      label: strings.earlierMove,
                      leadingIcon: Icons.fast_forward_rounded,
                      expand: true,
                      onPressed: _busy ? null : () => widget.onMove(offer),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      strings.earlierFirstCome,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
            ],
            Material(
              type: MaterialType.transparency,
              child: SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                value: status.watching,
                onChanged: _busy ? null : _watch,
                title: Text(strings.earlierWatch),
                subtitle: Text(
                  _failed
                      ? strings.earlierFailed
                      : strings.earlierWatchHelp(
                          widget.appointment.doctor.displayName,
                        ),
                  style: _failed
                      ? theme.textTheme.bodySmall?.copyWith(
                          color: colors.criticalContent,
                        )
                      : null,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../../design_system/foundations/saxlem_radii.dart';
import '../../../../design_system/theme/saxlem_colors.dart';
import '../../domain/entities/appointment_slot.dart';
import '../booking_copy.dart';
import '../../../../l10n/app_localizations.dart';

/// Times for one day (v3): grouped into morning, afternoon and evening so a
/// patient finds "after work" at a glance. Tapping a time selects it.
class SlotGrid extends StatelessWidget {
  const SlotGrid({
    required this.slots,
    required this.timezone,
    required this.onSelected,
    super.key,
  });
  final List<AppointmentSlot> slots;
  final String timezone;
  final ValueChanged<AppointmentSlot> onSelected;
  @override
  Widget build(BuildContext context) {
    const copy = BookingCopy();
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        const gap = 10.0;
        final textScale = MediaQuery.textScalerOf(context).scale(1);
        final columns = (constraints.maxWidth / (84 * textScale)).floor().clamp(
          2,
          6,
        );
        final width = (constraints.maxWidth - gap * (columns - 1)) / columns;
        Widget chip(AppointmentSlot slot) {
          final label = copy.time(slot.startsAt, timezone: timezone);
          return Semantics(
            button: true,
            enabled: true,
            label: label,
            child: SizedBox(
              width: width,
              child: Material(
                type: MaterialType.transparency,
                child: Ink(
                  decoration: BoxDecoration(
                    color: colors.surfaceRaised,
                    borderRadius: BorderRadius.circular(SaxlemRadii.medium),
                    border: Border.all(color: colors.border, width: 1.5),
                  ),
                  child: InkWell(
                    onTap: () => onSelected(slot),
                    borderRadius: BorderRadius.circular(SaxlemRadii.medium),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(minHeight: 52),
                      child: Center(
                        child: ExcludeSemantics(
                          child: Text(
                            label,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              fontFeatures: const [
                                FontFeature.tabularFigures(),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        }

        int hour(AppointmentSlot slot) =>
            int.tryParse(
              copy.time(slot.startsAt, timezone: timezone).split(':').first,
            ) ??
            0;
        final strings = AppLocalizations.of(context);
        final groups = [
          (
            Icons.wb_twilight_rounded,
            strings.slotMorning,
            slots.where((s) => hour(s) < 12),
          ),
          (
            Icons.wb_sunny_outlined,
            strings.slotAfternoon,
            slots.where((s) => hour(s) >= 12 && hour(s) < 17),
          ),
          (
            Icons.nights_stay_outlined,
            strings.slotEvening,
            slots.where((s) => hour(s) >= 17),
          ),
        ].where((group) => group.$3.isNotEmpty).toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (final (icon, title, items) in groups) ...[
              Padding(
                padding: const EdgeInsetsDirectional.only(top: 4, bottom: 10),
                child: Row(
                  children: [
                    Icon(icon, size: 18, color: colors.brandPrimary),
                    const SizedBox(width: 8),
                    Text(title, style: theme.textTheme.labelLarge),
                    const SizedBox(width: 8),
                    Text(
                      '${items.length}',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: colors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              Wrap(
                spacing: gap,
                runSpacing: gap,
                children: items.map(chip).toList(),
              ),
              const SizedBox(height: 16),
            ],
          ],
        );
      },
    );
  }
}

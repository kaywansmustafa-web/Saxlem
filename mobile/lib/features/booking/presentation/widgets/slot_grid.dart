import 'package:flutter/material.dart';
import '../../../../design_system/foundations/saxlem_radii.dart';
import '../../../../design_system/theme/saxlem_colors.dart';
import '../../domain/entities/appointment_slot.dart';
import '../booking_copy.dart';

/// Times for one day as a grid of rounded chips (v2 "Aura"). Tapping a time
/// selects it immediately.
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
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: slots.map((slot) {
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
          }).toList(),
        );
      },
    );
  }
}

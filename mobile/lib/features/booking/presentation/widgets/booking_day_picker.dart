import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../design_system/foundations/saxlem_elevation.dart';
import '../../../../design_system/foundations/saxlem_motion.dart';
import '../../../../design_system/foundations/saxlem_radii.dart';
import '../../../../design_system/theme/saxlem_colors.dart';
import '../../domain/entities/booking_availability.dart';
import 'slot_grid.dart';
import '../../domain/entities/appointment_slot.dart';

/// Pick a day, then a time: two taps to an appointment (v2 "Aura").
/// Days with no free times stay visible but muted, so the week keeps its shape.
class BookingDayPicker extends StatefulWidget {
  const BookingDayPicker({
    required this.days,
    required this.timezone,
    required this.emptyLabel,
    required this.onSelected,
    super.key,
  });
  final List<BookingDay> days;
  final String timezone, emptyLabel;
  final ValueChanged<AppointmentSlot> onSelected;

  @override
  State<BookingDayPicker> createState() => _BookingDayPickerState();
}

class _BookingDayPickerState extends State<BookingDayPicker> {
  late int _selected = _firstOpenDay();

  int _firstOpenDay() {
    final index = widget.days.indexWhere((day) => day.slots.isNotEmpty);
    return index < 0 ? 0 : index;
  }

  String _format(BuildContext context, DateTime date, String pattern) {
    final code = Localizations.localeOf(context).languageCode;
    final locale = code == 'ku' ? 'ar' : code;
    try {
      return DateFormat(pattern, locale).format(date);
    } catch (_) {
      return DateFormat(pattern, 'en').format(date);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    if (widget.days.isEmpty) return Text(widget.emptyLabel);
    final day = widget.days[_selected];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          clipBehavior: Clip.none,
          child: Row(
            children: List.generate(widget.days.length, (i) {
              final item = widget.days[i];
              final selected = i == _selected;
              final open = item.slots.isNotEmpty;
              final fullDate = MaterialLocalizations.of(
                context,
              ).formatMediumDate(item.date);
              return Padding(
                padding: EdgeInsetsDirectional.only(
                  end: i == widget.days.length - 1 ? 0 : 10,
                ),
                child: Semantics(
                  button: true,
                  selected: selected,
                  label: open ? fullDate : '$fullDate. ${widget.emptyLabel}',
                  child: GestureDetector(
                    onTap: () => setState(() => _selected = i),
                    child: AnimatedContainer(
                      duration: SaxlemMotion.standard,
                      curve: SaxlemMotion.standardCurve,
                      width: 64,
                      padding: const EdgeInsetsDirectional.symmetric(
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: selected ? null : colors.surfaceRaised,
                        gradient: selected ? colors.deepAura : null,
                        borderRadius: BorderRadius.circular(SaxlemRadii.medium),
                        border: Border.all(
                          color: selected ? Colors.transparent : colors.border,
                        ),
                        boxShadow: selected
                            ? SaxlemElevation.glow(colors.brandPrimary)
                            : null,
                      ),
                      child: ExcludeSemantics(
                        child: Column(
                          children: [
                            Text(
                              _format(context, item.date, 'E'),
                              maxLines: 1,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: selected
                                    ? colors.onFill.withValues(alpha: .9)
                                    : colors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _format(context, item.date, 'd'),
                              style: theme.textTheme.titleLarge?.copyWith(
                                color: selected
                                    ? colors.onFill
                                    : (open
                                          ? colors.textPrimary
                                          : colors.textDisabled),
                                fontFeatures: const [
                                  FontFeature.tabularFigures(),
                                ],
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              width: 5,
                              height: 5,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: open
                                    ? (selected
                                          ? colors.onFill
                                          : colors.auraEnd)
                                    : Colors.transparent,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
        const SizedBox(height: 20),
        Semantics(
          header: true,
          child: Text(
            MaterialLocalizations.of(context).formatFullDate(day.date),
            style: theme.textTheme.titleMedium,
          ),
        ),
        const SizedBox(height: 12),
        AnimatedSwitcher(
          duration: SaxlemMotion.fast,
          child: day.slots.isEmpty
              ? Text(widget.emptyLabel, key: ValueKey('empty$_selected'))
              : SlotGrid(
                  key: ValueKey('slots$_selected'),
                  slots: day.slots,
                  timezone: widget.timezone,
                  onSelected: widget.onSelected,
                ),
        ),
      ],
    );
  }
}

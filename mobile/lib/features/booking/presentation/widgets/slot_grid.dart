import 'package:flutter/material.dart';
import '../../domain/entities/appointment_slot.dart';
import '../booking_copy.dart';

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
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: slots.map((slot) {
        return Semantics(
          button: true,
          enabled: true,
          label: copy.time(slot.startsAt, timezone: timezone),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 96, minHeight: 48),
            child: OutlinedButton(
              onPressed: () => onSelected(slot),
              child: Text(copy.time(slot.startsAt, timezone: timezone)),
            ),
          ),
        );
      }).toList(),
    );
  }
}

import 'package:flutter/material.dart';
import '../../domain/entities/appointment_slot.dart';
import '../../domain/entities/booking_types.dart';
import '../booking_copy.dart';

class SlotGrid extends StatelessWidget {
  const SlotGrid({required this.slots, required this.onSelected, super.key});
  final List<AppointmentSlot> slots;
  final ValueChanged<AppointmentSlot> onSelected;
  @override
  Widget build(BuildContext context) {
    const copy = BookingCopy();
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: slots.map((slot) {
        final enabled = slot.status == BookingSlotStatus.available;
        return Semantics(
          button: enabled,
          enabled: enabled,
          label:
              '${copy.time(slot.start)}, ${enabled ? 'available' : 'unavailable'}',
          child: ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 96, minHeight: 48),
            child: OutlinedButton(
              onPressed: enabled ? () => onSelected(slot) : null,
              child: Text(copy.time(slot.start)),
            ),
          ),
        );
      }).toList(),
    );
  }
}

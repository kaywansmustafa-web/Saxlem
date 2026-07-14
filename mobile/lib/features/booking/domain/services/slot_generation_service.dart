import '../entities/appointment_slot.dart';
import '../entities/booking_types.dart';
import '../entities/schedule_rule.dart';

class SlotGenerationService {
  const SlotGenerationService();
  List<AppointmentSlot> generate({
    required String clinicId,
    required DateTime date,
    required List<ScheduleRule> rules,
    required Set<String> bookedSlotIds,
    required int version,
  }) {
    final slots = <AppointmentSlot>[];
    for (final rule in rules.where((r) => r.weekday == date.weekday)) {
      for (
        var minute = rule.startMinute;
        minute + rule.durationMinutes <= rule.endMinute;
        minute += rule.durationMinutes + rule.bufferMinutes
      ) {
        final start = DateTime(
          date.year,
          date.month,
          date.day,
          minute ~/ 60,
          minute % 60,
        );
        if (start.isBefore(DateTime.now())) continue;
        final id = '$clinicId-${start.toIso8601String()}';
        slots.add(
          AppointmentSlot(
            id: id,
            clinicId: clinicId,
            start: start,
            end: start.add(Duration(minutes: rule.durationMinutes)),
            status: bookedSlotIds.contains(id)
                ? BookingSlotStatus.booked
                : BookingSlotStatus.available,
            availabilityVersion: version,
          ),
        );
      }
    }
    return slots;
  }
}

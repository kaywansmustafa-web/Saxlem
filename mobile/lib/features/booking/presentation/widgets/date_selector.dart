import 'package:flutter/material.dart';
import '../../domain/entities/booking_availability.dart';
import '../../domain/entities/booking_types.dart';
import '../booking_copy.dart';

class DateSelector extends StatelessWidget {
  const DateSelector({required this.days, required this.onSelected, super.key});
  final List<BookingDay> days;
  final ValueChanged<BookingDay> onSelected;
  @override
  Widget build(BuildContext context) {
    const copy = BookingCopy();
    return Column(
      children: days.map((day) {
        final enabled = day.status == BookingDayStatus.available;
        final reason = switch (day.status) {
          BookingDayStatus.available => 'Available',
          BookingDayStatus.fullyBooked => 'Fully booked',
          BookingDayStatus.clinicClosed => 'Clinic closed',
          BookingDayStatus.holiday => 'Holiday',
          BookingDayStatus.doctorAbsent => 'Doctor unavailable',
        };
        return Semantics(
          button: enabled,
          enabled: enabled,
          label: '${copy.date(day.date)}, $reason',
          child: ListTile(
            onTap: enabled ? () => onSelected(day) : null,
            leading: Icon(
              enabled
                  ? Icons.calendar_month_rounded
                  : Icons.event_busy_outlined,
            ),
            title: Text(copy.date(day.date)),
            subtitle: Text(reason),
            trailing: enabled
                ? const Icon(Icons.arrow_forward_ios_rounded, size: 16)
                : null,
          ),
        );
      }).toList(),
    );
  }
}

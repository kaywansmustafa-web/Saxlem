import '../../domain/entities/appointment_slot.dart';
import '../../domain/entities/booking_availability.dart';
import '../../domain/entities/booking_clinic_option.dart';
import '../../domain/entities/booking_types.dart';
import '../dto/booking_availability_dto.dart';

class BookingMapper {
  const BookingMapper();
  BookingClinicOption clinic(BookingClinicDto d) => BookingClinicOption(
    id: d.id,
    displayName: d.name,
    cityDisplayName: d.city,
    areaDisplayName: d.area,
    timezone: d.timezone,
    consultationFeeIqd: d.feeIqd,
    durationMinutes: d.durationMinutes,
    cancellationPolicy: d.policy,
  );
  BookingAvailability availability(BookingAvailabilityDto d) =>
      BookingAvailability(
        clinicId: d.clinicId,
        version: d.version,
        days: d.days
            .map(
              (day) => BookingDay(
                date: day.date,
                status: BookingDayStatus.values.byName(day.status),
                slots: day.slots
                    .map(
                      (s) => AppointmentSlot(
                        id: s.id,
                        clinicId: s.clinicId,
                        start: s.start,
                        end: s.end,
                        status: BookingSlotStatus.values.byName(s.status),
                        availabilityVersion: s.version,
                      ),
                    )
                    .toList(),
              ),
            )
            .toList(),
      );
}

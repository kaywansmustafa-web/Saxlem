import '../dto/booking_availability_dto.dart';

class MockBookingDataSource {
  MockBookingDataSource({this.delay = const Duration(milliseconds: 350)});
  final Duration delay;
  final Set<String> booked = {};
  int version = 1;
  Future<List<BookingClinicDto>> clinics() async {
    await Future<void>.delayed(delay);
    return const [
      BookingClinicDto(
        id: 'clinic-a',
        name: 'Saxlem Demo Medical Center',
        city: 'Duhok',
        area: 'City Center',
        timezone: 'Asia/Baghdad',
        feeIqd: 35000,
        durationMinutes: 30,
        policy: 'Free cancellation up to 24 hours before the appointment.',
      ),
      BookingClinicDto(
        id: 'clinic-b',
        name: 'Saxlem Demo Family Clinic',
        city: 'Duhok',
        area: 'Malta',
        timezone: 'Asia/Baghdad',
        feeIqd: 30000,
        durationMinutes: 20,
        policy: 'Free cancellation up to 12 hours before the appointment.',
      ),
    ];
  }

  Future<BookingAvailabilityDto> availability(String clinicId) async {
    await Future<void>.delayed(delay);
    final now = DateTime.now();
    final days = <BookingDayDto>[];
    for (var i = 1; i <= 10; i++) {
      final date = DateTime(now.year, now.month, now.day + i);
      String status = 'available';
      if (date.weekday == DateTime.friday) status = 'clinicClosed';
      if (i == 3) status = 'holiday';
      if (i == 5) status = 'doctorAbsent';
      final slots = <BookingSlotDto>[];
      if (status == 'available') {
        for (final hour in [9, 10, 11, 14, 15, 16]) {
          final start = DateTime(date.year, date.month, date.day, hour);
          final id = '$clinicId-${start.toIso8601String()}';
          slots.add(
            BookingSlotDto(
              id: id,
              clinicId: clinicId,
              start: start,
              end: start.add(const Duration(minutes: 30)),
              status: booked.contains(id) ? 'booked' : 'available',
              version: version,
            ),
          );
        }
        if (i == 2) {
          for (final s in slots) {
            booked.add(s.id);
          }
          status = 'fullyBooked';
        }
      }
      days.add(BookingDayDto(date: date, status: status, slots: slots));
    }
    return BookingAvailabilityDto(
      clinicId: clinicId,
      version: version,
      days: days,
    );
  }

  bool isAvailable(String slotId) => !booked.contains(slotId);
  void book(String slotId) {
    booked.add(slotId);
    version++;
  }
}

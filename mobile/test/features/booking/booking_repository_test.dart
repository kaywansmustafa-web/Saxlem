import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/booking/data/data_sources/mock_booking_data_source.dart';
import 'package:saxlem_app/features/booking/data/mappers/booking_mapper.dart';
import 'package:saxlem_app/features/booking/data/repositories/booking_repository_impl.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_doctor_reference.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_draft.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_types.dart';
import 'package:saxlem_app/features/booking/domain/services/arrival_recommendation_service.dart';

void main() {
  test(
    'provides clinics, unavailable days, integer IQD, and idempotent confirmation',
    () async {
      final repo = BookingRepositoryImpl(
        MockBookingDataSource(delay: Duration.zero),
        const BookingMapper(),
        const ArrivalRecommendationService(),
      );
      const doctor = BookingDoctorReference(
        id: 'd',
        displayName: 'Demo Doctor',
        specialtyDisplayName: 'Dentistry',
      );
      final clinics = await repo.getClinics(doctor);
      expect(clinics.length, 2);
      expect(clinics.first.consultationFeeIqd, isA<int>());
      final availability = await repo.getAvailability(doctor, clinics.first);
      expect(
        availability.days.any((d) => d.status == BookingDayStatus.holiday),
        isTrue,
      );
      expect(
        availability.days.any((d) => d.status == BookingDayStatus.doctorAbsent),
        isTrue,
      );
      final day = availability.days.firstWhere(
        (d) => d.status == BookingDayStatus.available,
      );
      final slot = day.slots.firstWhere(
        (s) => s.status == BookingSlotStatus.available,
      );
      final quote = await repo.createQuote(
        BookingDraft(
          doctor: doctor,
          clinic: clinics.first,
          date: day.date,
          slot: slot,
          availabilityVersion: availability.version,
        ),
      );
      final a = await repo.confirm(quote, 'same-key');
      final b = await repo.confirm(quote, 'same-key');
      expect(a.mockAppointmentId, b.mockAppointmentId);
    },
  );
}

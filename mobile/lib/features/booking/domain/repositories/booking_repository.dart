import '../entities/booking_availability.dart';
import '../entities/booking_confirmation.dart';
import '../entities/booking_draft.dart';
import '../entities/booking_types.dart';

abstract interface class BookingRepository {
  Future<BookingAvailability> loadOptions(BookingOptionsRequest request);
  Future<BookingConfirmation> create(BookingDraft draft, String operationId);
}

class BookingOptionsRequest {
  const BookingOptionsRequest({
    required this.doctorId,
    required this.clinicId,
    required this.patientProfileId,
    required this.appointmentType,
    required this.dateFrom,
    required this.dateTo,
  });
  final String doctorId, clinicId, patientProfileId;
  final BookingAppointmentType appointmentType;
  final DateTime dateFrom, dateTo;
}

class BookingFailure implements Exception {
  const BookingFailure(this.problem);
  final BookingProblem problem;
}

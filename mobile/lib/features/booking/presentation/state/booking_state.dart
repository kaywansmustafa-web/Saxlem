import '../../domain/entities/booking_availability.dart';
import '../../domain/entities/booking_confirmation.dart';
import '../../domain/entities/booking_doctor_reference.dart';
import '../../domain/entities/booking_quote.dart';
import '../../domain/entities/booking_types.dart';

sealed class BookingState {
  const BookingState();
}

class BookingInitial extends BookingState {
  const BookingInitial(this.doctor);
  final BookingDoctorReference doctor;
}

class BookingSetup extends BookingState {
  const BookingSetup(this.doctor);
  final BookingDoctorReference doctor;
}

class BookingLoadingOptions extends BookingState {
  const BookingLoadingOptions();
}

class BookingOptionsReady extends BookingState {
  const BookingOptionsReady(this.availability);
  final BookingAvailability availability;
}

class BookingEmpty extends BookingState {
  const BookingEmpty(this.availability);
  final BookingAvailability availability;
}

class BookingReviewing extends BookingState {
  const BookingReviewing(this.quote);
  final BookingQuote quote;
}

class BookingConfirming extends BookingState {
  const BookingConfirming(this.quote);
  final BookingQuote quote;
}

class BookingSuccess extends BookingState {
  const BookingSuccess(this.confirmation);
  final BookingConfirmation confirmation;
}

class BookingProblemState extends BookingState {
  const BookingProblemState(this.problem, {this.retained});
  final BookingProblem problem;
  final BookingAvailability? retained;
}

import 'package:flutter/material.dart';
import 'data/data_sources/mock_booking_data_source.dart';
import 'data/mappers/booking_mapper.dart';
import 'data/repositories/booking_repository_impl.dart';
import 'domain/entities/booking_doctor_reference.dart';
import 'domain/services/arrival_recommendation_service.dart';
import 'domain/use_cases/confirm_booking.dart';
import 'domain/use_cases/create_booking_quote.dart';
import 'domain/use_cases/get_booking_availability.dart';
import 'domain/use_cases/get_doctor_clinics.dart';
import 'presentation/controllers/booking_controller.dart';
import 'presentation/pages/booking_flow_page.dart';

class BookingFeature extends StatefulWidget {
  const BookingFeature({required this.doctor, super.key});
  final BookingDoctorReference doctor;
  @override
  State<BookingFeature> createState() => _BookingFeatureState();
}

class _BookingFeatureState extends State<BookingFeature> {
  late final BookingController controller;
  @override
  void initState() {
    super.initState();
    final repo = BookingRepositoryImpl(
      MockBookingDataSource(),
      const BookingMapper(),
      const ArrivalRecommendationService(),
    );
    controller = BookingController(
      doctor: widget.doctor,
      getClinics: GetDoctorClinics(repo),
      getAvailability: GetBookingAvailability(repo),
      createQuote: CreateBookingQuote(repo),
      confirmBooking: ConfirmBooking(repo),
    )..load();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => BookingFlowPage(
    controller: controller,
    onViewDoctor: () => Navigator.pop(context),
    onReturnHome: () => Navigator.popUntil(context, (route) => route.isFirst),
  );
}

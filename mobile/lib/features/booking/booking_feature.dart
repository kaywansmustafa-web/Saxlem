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
import '../appointments/appointments_feature.dart';
import '../appointments/data/mappers/booking_confirmation_appointment_mapper.dart';
import '../appointments/data/repositories/in_memory_patient_appointments_repository.dart';
import '../appointments/domain/repositories/patient_appointments_repository.dart';
import '../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../core/models/patient_profile.dart';

class BookingFeature extends StatefulWidget {
  const BookingFeature({
    required this.doctor,
    this.appointmentsRepository,
    this.onOpenAppointments,
    this.profilesController,
    super.key,
  });
  final BookingDoctorReference doctor;
  final PatientAppointmentsRepository? appointmentsRepository;
  final VoidCallback? onOpenAppointments;
  final PatientProfilesController? profilesController;
  @override
  State<BookingFeature> createState() => _BookingFeatureState();
}

class _BookingFeatureState extends State<BookingFeature> {
  late final BookingController controller;
  late final PatientAppointmentsRepository appointments;
  @override
  void initState() {
    super.initState();
    final repo = BookingRepositoryImpl(
      MockBookingDataSource(),
      const BookingMapper(),
      const ArrivalRecommendationService(),
    );
    appointments =
        widget.appointmentsRepository ??
        InMemoryPatientAppointmentsRepository.shared;
    controller = BookingController(
      doctor: widget.doctor,
      getClinics: GetDoctorClinics(repo),
      getAvailability: GetBookingAvailability(repo),
      createQuote: CreateBookingQuote(repo),
      confirmBooking: ConfirmBooking(repo),
      onConfirmed: (confirmation) => appointments.add(
        const BookingConfirmationAppointmentMapper()(confirmation),
      ),
      profileId:
          widget.profilesController?.activeProfileId ?? PatientProfileId.me,
    )..load();
    widget.profilesController?.addListener(_profileChanged);
  }

  void _profileChanged() =>
      controller.selectProfile(widget.profilesController!.activeProfileId);

  @override
  void dispose() {
    widget.profilesController?.removeListener(_profileChanged);
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => BookingFlowPage(
    controller: controller,
    profilesController: widget.profilesController,
    onViewDoctor: () => Navigator.pop(context),
    onMyAppointments: widget.onOpenAppointments == null
        ? () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => Scaffold(
                body: SafeArea(
                  child: AppointmentsFeature(repository: appointments),
                ),
              ),
            ),
          )
        : () {
            Navigator.popUntil(context, (route) => route.isFirst);
            widget.onOpenAppointments!();
          },
    onReturnHome: () => Navigator.popUntil(context, (route) => route.isFirst),
  );
}

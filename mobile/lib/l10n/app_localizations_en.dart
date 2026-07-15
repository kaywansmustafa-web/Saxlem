// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'Saxlem';

  @override
  String get chooseLanguage => 'Choose your language';

  @override
  String get languageCanChange => 'You can change this later in your profile.';

  @override
  String get badiniKurdish => 'Badini Kurdish';

  @override
  String get english => 'English';

  @override
  String get arabic => 'Arabic';

  @override
  String get continueLabel => 'Continue';

  @override
  String get savingLanguage => 'Saving language';

  @override
  String get languageSaveFailed =>
      'We couldn\'t save your language. Please try again.';

  @override
  String get home => 'Home';

  @override
  String get discover => 'Discover';

  @override
  String get appointments => 'Appointments';

  @override
  String get alerts => 'Alerts';

  @override
  String get profile => 'Profile';

  @override
  String get alertsTitle => 'Alerts are coming soon';

  @override
  String get alertsBody =>
      'Important appointment and clinic updates will appear here in a future release.';

  @override
  String get profileTitle => 'Your profile is coming soon';

  @override
  String get profileBody =>
      'You\'ll be able to manage your details, language, and care preferences here.';

  @override
  String get goodMorning => 'Good morning,';

  @override
  String get goodAfternoon => 'Good afternoon,';

  @override
  String get goodEvening => 'Good evening,';

  @override
  String get searchHint => 'Search doctors, clinics or specialties';

  @override
  String get openHealthcareSearch => 'Open healthcare search';

  @override
  String get openSearchFilters => 'Open search filters';

  @override
  String get liveQueue => 'Live queue';

  @override
  String get live => 'LIVE';

  @override
  String get currentPatient => 'Current patient';

  @override
  String get yourNumber => 'Your Number';

  @override
  String get patientsAhead => 'Patients ahead';

  @override
  String get estimatedWait => 'Estimated wait';

  @override
  String get doctorStatus => 'Doctor status';

  @override
  String get minutesShort => 'min';

  @override
  String get viewLiveQueue => 'View live queue';

  @override
  String get popularSpecialties => 'Popular specialties';

  @override
  String get recommendedDoctors => 'Recommended doctors';

  @override
  String get seeAll => 'See all';

  @override
  String get book => 'Book';

  @override
  String get filters => 'Filters';

  @override
  String get sortResults => 'Sort results';

  @override
  String get tryAgain => 'Try again';

  @override
  String get clearFilters => 'Clear filters';

  @override
  String get findRightCare => 'Find the right care';

  @override
  String get findRightCareBody =>
      'Search in everyday words. We\'ll help you find doctors who may be able to help.';

  @override
  String get quickCategories => 'Quick categories';

  @override
  String get doctorProfile => 'Doctor Profile';

  @override
  String get viewProfile => 'View profile';

  @override
  String get addToMyDoctors => 'Add to My Doctors';

  @override
  String get removeFromMyDoctors => 'Remove from My Doctors';

  @override
  String get bookAppointment => 'Book appointment';

  @override
  String get chooseAppointment => 'Choose an appointment';

  @override
  String get chooseClinic => 'Choose a clinic';

  @override
  String get chooseDate => 'Choose a date';

  @override
  String get chooseTime => 'Choose a time';

  @override
  String get reviewAppointment => 'Review appointment';

  @override
  String get confirmAppointment => 'Confirm appointment';

  @override
  String get confirmingAppointment => 'Confirming appointment';

  @override
  String get appointmentConfirmed => 'Appointment confirmed';

  @override
  String get goToAppointments => 'Go to My Appointments';

  @override
  String get viewDoctor => 'View Doctor';

  @override
  String get returnHome => 'Return Home';

  @override
  String get loadingBooking => 'Loading booking options';

  @override
  String get bookingUnavailable => 'Booking unavailable';

  @override
  String get timeUnavailable => 'Time unavailable';

  @override
  String get myAppointments => 'My Appointments';

  @override
  String get upcoming => 'Upcoming';

  @override
  String get completed => 'Completed';

  @override
  String get cancelled => 'Cancelled';

  @override
  String get viewAppointment => 'View Appointment';

  @override
  String get rateVisit => 'Rate Visit';

  @override
  String get bookAgain => 'Book Again';

  @override
  String get actionUnavailable =>
      'This action will be available in a future release.';

  @override
  String get discoverDoctors => 'Discover Doctors';

  @override
  String get firstAppointmentTitle => 'Your care starts here';

  @override
  String get firstAppointmentBody =>
      'Book your first visit with a trusted doctor.';

  @override
  String get emptyAppointmentsTitle => 'Nothing here right now';

  @override
  String get emptyAppointmentsBody =>
      'Your appointments in this category will appear here.';

  @override
  String get appointmentDetails => 'Appointment Details';

  @override
  String get clinic => 'Clinic';

  @override
  String get date => 'Date';

  @override
  String get time => 'Time';

  @override
  String get status => 'Status';

  @override
  String get fee => 'Fee';

  @override
  String get duration => 'Duration';

  @override
  String get appointmentId => 'Appointment ID';

  @override
  String get queueOpensAppointmentDay => 'Queue opens on appointment day.';

  @override
  String get queueAvailableToday =>
      'Live Queue is available for today\'s appointment.';

  @override
  String get queueNotReady =>
      'Your queue entry is not ready yet. We\'ll update this appointment when it becomes available.';

  @override
  String get openLiveQueue => 'Open Live Queue';

  @override
  String get loadingAppointments => 'Loading your appointments';

  @override
  String get appointmentsLoadFailed => 'We could not load your appointments.';

  @override
  String consultationMinutes(int minutes) {
    return '$minutes min consultation';
  }

  @override
  String estimatedWaitMinutes(int minutes) {
    return 'Estimated wait: $minutes min';
  }

  @override
  String tabWithCount(String label, int count) {
    return '$label ($count)';
  }

  @override
  String minutesLong(int minutes) {
    return '$minutes minutes';
  }

  @override
  String iqdAmount(int amount) {
    return '$amount IQD';
  }

  @override
  String appointmentIdValue(String id) {
    return 'Appointment ID $id';
  }

  @override
  String get informationalScreen => 'Informational screen';

  @override
  String get welcomeTitle => 'Healthcare, made clearer';

  @override
  String get welcomeBody =>
      'Saxlem brings trusted care, appointments, and live clinic updates into one calm experience.';

  @override
  String get welcomeTrust => 'Built for patients across Kurdistan and Iraq';

  @override
  String get welcomeBook => 'Find and book trusted doctors';

  @override
  String get welcomeQueue => 'Understand your place in the live queue';

  @override
  String get welcomeAppointments => 'Keep your care organized';

  @override
  String get continueAsGuest => 'Continue as Guest';

  @override
  String get verifyNumber => 'Verify my number';

  @override
  String get guestMode => 'Guest mode';

  @override
  String get guestModeMessage =>
      'You can explore Saxlem, but booking and personal appointments require verification.';

  @override
  String get phoneTitle => 'Your mobile number';

  @override
  String get phoneBody =>
      'We\'ll send a one-time code to securely verify your number.';

  @override
  String get country => 'Country';

  @override
  String get iraq => 'Iraq';

  @override
  String get phoneNumber => 'Mobile number';

  @override
  String get phoneHint => '750 123 4567';

  @override
  String get phoneInvalid => 'Enter a valid Iraqi mobile number.';

  @override
  String get sendCode => 'Send code';

  @override
  String get otpTitle => 'Enter your code';

  @override
  String otpBody(String phone) {
    return 'We sent a 6-digit code to $phone.';
  }

  @override
  String get otpLabel => '6-digit verification code';

  @override
  String get otpHint => 'Enter 6 digits';

  @override
  String get verify => 'Verify and continue';

  @override
  String get changeNumber => 'Change number';

  @override
  String get resendCode => 'Resend code';

  @override
  String resendIn(int seconds) {
    return 'Resend in ${seconds}s';
  }

  @override
  String get otpInvalid => 'That code is not correct. Please try again.';

  @override
  String get otpExpired => 'This code has expired. Request a new one.';

  @override
  String get otpLimited => 'Too many attempts. Please request a new code.';

  @override
  String get authUnavailable =>
      'Phone verification is not available in this build yet.';

  @override
  String get sessionExpiredTitle => 'Your session has expired';

  @override
  String get sessionExpiredBody =>
      'Verify your number again to continue securely.';

  @override
  String developmentCodeHint(String code) {
    return 'Development code: $code';
  }

  @override
  String get logOut => 'Log out';

  @override
  String get personalizedFeatureTitle => 'Verification required';

  @override
  String get personalizedFeatureBody =>
      'Sign in with your mobile number to use appointments and other personalized care features.';
}

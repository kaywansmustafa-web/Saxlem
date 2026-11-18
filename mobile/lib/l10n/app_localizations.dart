import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';
import 'app_localizations_ku.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
    Locale('ku'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'Saxlem'**
  String get appName;

  /// No description provided for @chooseLanguage.
  ///
  /// In en, this message translates to:
  /// **'Choose your language'**
  String get chooseLanguage;

  /// No description provided for @languageCanChange.
  ///
  /// In en, this message translates to:
  /// **'You can change this later in your profile.'**
  String get languageCanChange;

  /// No description provided for @badiniKurdish.
  ///
  /// In en, this message translates to:
  /// **'Badini Kurdish'**
  String get badiniKurdish;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @arabic.
  ///
  /// In en, this message translates to:
  /// **'Arabic'**
  String get arabic;

  /// No description provided for @continueLabel.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueLabel;

  /// No description provided for @savingLanguage.
  ///
  /// In en, this message translates to:
  /// **'Saving language'**
  String get savingLanguage;

  /// No description provided for @languageSaveFailed.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t save your language. Please try again.'**
  String get languageSaveFailed;

  /// No description provided for @home.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// No description provided for @discover.
  ///
  /// In en, this message translates to:
  /// **'Discover'**
  String get discover;

  /// No description provided for @appointments.
  ///
  /// In en, this message translates to:
  /// **'Appointments'**
  String get appointments;

  /// No description provided for @alerts.
  ///
  /// In en, this message translates to:
  /// **'Alerts'**
  String get alerts;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @alertsTitle.
  ///
  /// In en, this message translates to:
  /// **'Alerts are coming soon'**
  String get alertsTitle;

  /// No description provided for @alertsBody.
  ///
  /// In en, this message translates to:
  /// **'Important appointment and clinic updates will appear here in a future release.'**
  String get alertsBody;

  /// No description provided for @profileTitle.
  ///
  /// In en, this message translates to:
  /// **'Your profile is coming soon'**
  String get profileTitle;

  /// No description provided for @profileBody.
  ///
  /// In en, this message translates to:
  /// **'You\'ll be able to manage your details, language, and care preferences here.'**
  String get profileBody;

  /// No description provided for @goodMorning.
  ///
  /// In en, this message translates to:
  /// **'Good morning,'**
  String get goodMorning;

  /// No description provided for @goodAfternoon.
  ///
  /// In en, this message translates to:
  /// **'Good afternoon,'**
  String get goodAfternoon;

  /// No description provided for @goodEvening.
  ///
  /// In en, this message translates to:
  /// **'Good evening,'**
  String get goodEvening;

  /// No description provided for @searchHint.
  ///
  /// In en, this message translates to:
  /// **'Search doctors, clinics or specialties'**
  String get searchHint;

  /// No description provided for @openHealthcareSearch.
  ///
  /// In en, this message translates to:
  /// **'Open healthcare search'**
  String get openHealthcareSearch;

  /// No description provided for @openSearchFilters.
  ///
  /// In en, this message translates to:
  /// **'Open search filters'**
  String get openSearchFilters;

  /// No description provided for @liveQueue.
  ///
  /// In en, this message translates to:
  /// **'Live queue'**
  String get liveQueue;

  /// No description provided for @live.
  ///
  /// In en, this message translates to:
  /// **'LIVE'**
  String get live;

  /// No description provided for @currentPatient.
  ///
  /// In en, this message translates to:
  /// **'Current Patient'**
  String get currentPatient;

  /// No description provided for @yourNumber.
  ///
  /// In en, this message translates to:
  /// **'Your Number'**
  String get yourNumber;

  /// No description provided for @patientsAhead.
  ///
  /// In en, this message translates to:
  /// **'Patients ahead'**
  String get patientsAhead;

  /// No description provided for @estimatedWait.
  ///
  /// In en, this message translates to:
  /// **'Estimated wait'**
  String get estimatedWait;

  /// No description provided for @doctorStatus.
  ///
  /// In en, this message translates to:
  /// **'Doctor status'**
  String get doctorStatus;

  /// No description provided for @minutesShort.
  ///
  /// In en, this message translates to:
  /// **'min'**
  String get minutesShort;

  /// No description provided for @viewLiveQueue.
  ///
  /// In en, this message translates to:
  /// **'View live queue'**
  String get viewLiveQueue;

  /// No description provided for @popularSpecialties.
  ///
  /// In en, this message translates to:
  /// **'Popular specialties'**
  String get popularSpecialties;

  /// No description provided for @recommendedDoctors.
  ///
  /// In en, this message translates to:
  /// **'Recommended doctors'**
  String get recommendedDoctors;

  /// No description provided for @seeAll.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get seeAll;

  /// No description provided for @book.
  ///
  /// In en, this message translates to:
  /// **'Book'**
  String get book;

  /// No description provided for @filters.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get filters;

  /// No description provided for @sortResults.
  ///
  /// In en, this message translates to:
  /// **'Sort results'**
  String get sortResults;

  /// No description provided for @tryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get tryAgain;

  /// No description provided for @clearFilters.
  ///
  /// In en, this message translates to:
  /// **'Clear filters'**
  String get clearFilters;

  /// No description provided for @findRightCare.
  ///
  /// In en, this message translates to:
  /// **'Find the right care'**
  String get findRightCare;

  /// No description provided for @findRightCareBody.
  ///
  /// In en, this message translates to:
  /// **'Search in everyday words. We\'ll help you find doctors who may be able to help.'**
  String get findRightCareBody;

  /// No description provided for @quickCategories.
  ///
  /// In en, this message translates to:
  /// **'Quick categories'**
  String get quickCategories;

  /// No description provided for @doctorProfile.
  ///
  /// In en, this message translates to:
  /// **'Doctor Profile'**
  String get doctorProfile;

  /// No description provided for @viewProfile.
  ///
  /// In en, this message translates to:
  /// **'View profile'**
  String get viewProfile;

  /// No description provided for @addToMyDoctors.
  ///
  /// In en, this message translates to:
  /// **'Add to My Doctors'**
  String get addToMyDoctors;

  /// No description provided for @removeFromMyDoctors.
  ///
  /// In en, this message translates to:
  /// **'Remove from My Doctors'**
  String get removeFromMyDoctors;

  /// No description provided for @bookAppointment.
  ///
  /// In en, this message translates to:
  /// **'Book appointment'**
  String get bookAppointment;

  /// No description provided for @chooseAppointment.
  ///
  /// In en, this message translates to:
  /// **'Choose an appointment'**
  String get chooseAppointment;

  /// No description provided for @chooseClinic.
  ///
  /// In en, this message translates to:
  /// **'Choose a clinic'**
  String get chooseClinic;

  /// No description provided for @chooseDate.
  ///
  /// In en, this message translates to:
  /// **'Choose a date'**
  String get chooseDate;

  /// No description provided for @chooseTime.
  ///
  /// In en, this message translates to:
  /// **'Choose a time'**
  String get chooseTime;

  /// No description provided for @appointmentType.
  ///
  /// In en, this message translates to:
  /// **'Appointment type'**
  String get appointmentType;

  /// No description provided for @initialAppointment.
  ///
  /// In en, this message translates to:
  /// **'Initial appointment'**
  String get initialAppointment;

  /// No description provided for @followUpAppointment.
  ///
  /// In en, this message translates to:
  /// **'Follow-up appointment'**
  String get followUpAppointment;

  /// No description provided for @appointmentReason.
  ///
  /// In en, this message translates to:
  /// **'Reason for visit'**
  String get appointmentReason;

  /// No description provided for @checkAvailability.
  ///
  /// In en, this message translates to:
  /// **'Check availability'**
  String get checkAvailability;

  /// No description provided for @noAvailableSlots.
  ///
  /// In en, this message translates to:
  /// **'No available times in this date range.'**
  String get noAvailableSlots;

  /// No description provided for @timezone.
  ///
  /// In en, this message translates to:
  /// **'Time zone'**
  String get timezone;

  /// No description provided for @bookingTimeout.
  ///
  /// In en, this message translates to:
  /// **'The availability request timed out. Please try again.'**
  String get bookingTimeout;

  /// No description provided for @slotTaken.
  ///
  /// In en, this message translates to:
  /// **'That time is no longer available. Check availability again.'**
  String get slotTaken;

  /// No description provided for @bookingValidationFailure.
  ///
  /// In en, this message translates to:
  /// **'Check your booking details and try again.'**
  String get bookingValidationFailure;

  /// No description provided for @bookingUnknownOutcome.
  ///
  /// In en, this message translates to:
  /// **'We could not confirm the result. Do not submit another booking until you retry this request.'**
  String get bookingUnknownOutcome;

  /// No description provided for @bookingSuccessful.
  ///
  /// In en, this message translates to:
  /// **'Your appointment is booked.'**
  String get bookingSuccessful;

  /// No description provided for @appointmentReferenceValue.
  ///
  /// In en, this message translates to:
  /// **'Appointment reference {reference}'**
  String appointmentReferenceValue(String reference);

  /// No description provided for @reviewAppointment.
  ///
  /// In en, this message translates to:
  /// **'Review appointment'**
  String get reviewAppointment;

  /// No description provided for @confirmAppointment.
  ///
  /// In en, this message translates to:
  /// **'Confirm appointment'**
  String get confirmAppointment;

  /// No description provided for @confirmingAppointment.
  ///
  /// In en, this message translates to:
  /// **'Confirming appointment'**
  String get confirmingAppointment;

  /// No description provided for @appointmentConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Appointment confirmed'**
  String get appointmentConfirmed;

  /// No description provided for @goToAppointments.
  ///
  /// In en, this message translates to:
  /// **'Go to My Appointments'**
  String get goToAppointments;

  /// No description provided for @viewDoctor.
  ///
  /// In en, this message translates to:
  /// **'View Doctor'**
  String get viewDoctor;

  /// No description provided for @returnHome.
  ///
  /// In en, this message translates to:
  /// **'Return Home'**
  String get returnHome;

  /// No description provided for @loadingBooking.
  ///
  /// In en, this message translates to:
  /// **'Loading booking options'**
  String get loadingBooking;

  /// No description provided for @bookingUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Booking unavailable'**
  String get bookingUnavailable;

  /// No description provided for @timeUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Time unavailable'**
  String get timeUnavailable;

  /// No description provided for @myAppointments.
  ///
  /// In en, this message translates to:
  /// **'My Appointments'**
  String get myAppointments;

  /// No description provided for @upcoming.
  ///
  /// In en, this message translates to:
  /// **'Upcoming'**
  String get upcoming;

  /// No description provided for @completed.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get completed;

  /// No description provided for @cancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get cancelled;

  /// No description provided for @viewAppointment.
  ///
  /// In en, this message translates to:
  /// **'View Appointment'**
  String get viewAppointment;

  /// No description provided for @rateVisit.
  ///
  /// In en, this message translates to:
  /// **'Rate Visit'**
  String get rateVisit;

  /// No description provided for @bookAgain.
  ///
  /// In en, this message translates to:
  /// **'Book Again'**
  String get bookAgain;

  /// No description provided for @actionUnavailable.
  ///
  /// In en, this message translates to:
  /// **'This action will be available in a future release.'**
  String get actionUnavailable;

  /// No description provided for @discoverDoctors.
  ///
  /// In en, this message translates to:
  /// **'Discover Doctors'**
  String get discoverDoctors;

  /// No description provided for @firstAppointmentTitle.
  ///
  /// In en, this message translates to:
  /// **'Your care starts here'**
  String get firstAppointmentTitle;

  /// No description provided for @firstAppointmentBody.
  ///
  /// In en, this message translates to:
  /// **'Book your first visit with a trusted doctor.'**
  String get firstAppointmentBody;

  /// No description provided for @emptyAppointmentsTitle.
  ///
  /// In en, this message translates to:
  /// **'Nothing here right now'**
  String get emptyAppointmentsTitle;

  /// No description provided for @emptyAppointmentsBody.
  ///
  /// In en, this message translates to:
  /// **'Your appointments in this category will appear here.'**
  String get emptyAppointmentsBody;

  /// No description provided for @appointmentDetails.
  ///
  /// In en, this message translates to:
  /// **'Appointment Details'**
  String get appointmentDetails;

  /// No description provided for @clinic.
  ///
  /// In en, this message translates to:
  /// **'Clinic'**
  String get clinic;

  /// No description provided for @date.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get date;

  /// No description provided for @time.
  ///
  /// In en, this message translates to:
  /// **'Time'**
  String get time;

  /// No description provided for @status.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// No description provided for @fee.
  ///
  /// In en, this message translates to:
  /// **'Fee'**
  String get fee;

  /// No description provided for @duration.
  ///
  /// In en, this message translates to:
  /// **'Duration'**
  String get duration;

  /// No description provided for @appointmentId.
  ///
  /// In en, this message translates to:
  /// **'Appointment ID'**
  String get appointmentId;

  /// No description provided for @queueOpensAppointmentDay.
  ///
  /// In en, this message translates to:
  /// **'Queue opens on appointment day.'**
  String get queueOpensAppointmentDay;

  /// No description provided for @queueAvailableToday.
  ///
  /// In en, this message translates to:
  /// **'Live Queue is available for today\'s appointment.'**
  String get queueAvailableToday;

  /// No description provided for @queueNotReady.
  ///
  /// In en, this message translates to:
  /// **'Your queue entry is not ready yet. We\'ll update this appointment when it becomes available.'**
  String get queueNotReady;

  /// No description provided for @openLiveQueue.
  ///
  /// In en, this message translates to:
  /// **'Open Live Queue'**
  String get openLiveQueue;

  /// No description provided for @loadingAppointments.
  ///
  /// In en, this message translates to:
  /// **'Loading your appointments'**
  String get loadingAppointments;

  /// No description provided for @appointmentsLoadFailed.
  ///
  /// In en, this message translates to:
  /// **'We could not load your appointments.'**
  String get appointmentsLoadFailed;

  /// No description provided for @consultationMinutes.
  ///
  /// In en, this message translates to:
  /// **'{minutes} min consultation'**
  String consultationMinutes(int minutes);

  /// No description provided for @estimatedWaitMinutes.
  ///
  /// In en, this message translates to:
  /// **'Estimated wait: {minutes} min'**
  String estimatedWaitMinutes(int minutes);

  /// No description provided for @tabWithCount.
  ///
  /// In en, this message translates to:
  /// **'{label} ({count})'**
  String tabWithCount(String label, int count);

  /// No description provided for @minutesLong.
  ///
  /// In en, this message translates to:
  /// **'{minutes} minutes'**
  String minutesLong(int minutes);

  /// No description provided for @iqdAmount.
  ///
  /// In en, this message translates to:
  /// **'{amount} IQD'**
  String iqdAmount(String amount);

  /// No description provided for @appointmentIdValue.
  ///
  /// In en, this message translates to:
  /// **'Appointment ID {id}'**
  String appointmentIdValue(String id);

  /// No description provided for @informationalScreen.
  ///
  /// In en, this message translates to:
  /// **'Informational screen'**
  String get informationalScreen;

  /// No description provided for @welcomeTitle.
  ///
  /// In en, this message translates to:
  /// **'Healthcare, made clearer'**
  String get welcomeTitle;

  /// No description provided for @welcomeBody.
  ///
  /// In en, this message translates to:
  /// **'Saxlem brings trusted care, appointments, and live clinic updates into one calm experience.'**
  String get welcomeBody;

  /// No description provided for @welcomeTrust.
  ///
  /// In en, this message translates to:
  /// **'Built for patients across Kurdistan and Iraq'**
  String get welcomeTrust;

  /// No description provided for @welcomeBook.
  ///
  /// In en, this message translates to:
  /// **'Find and book trusted doctors'**
  String get welcomeBook;

  /// No description provided for @welcomeQueue.
  ///
  /// In en, this message translates to:
  /// **'Understand your place in the live queue'**
  String get welcomeQueue;

  /// No description provided for @welcomeAppointments.
  ///
  /// In en, this message translates to:
  /// **'Keep your care organized'**
  String get welcomeAppointments;

  /// No description provided for @continueAsGuest.
  ///
  /// In en, this message translates to:
  /// **'Continue as Guest'**
  String get continueAsGuest;

  /// No description provided for @verifyNumber.
  ///
  /// In en, this message translates to:
  /// **'Verify my number'**
  String get verifyNumber;

  /// No description provided for @guestMode.
  ///
  /// In en, this message translates to:
  /// **'Guest mode'**
  String get guestMode;

  /// No description provided for @guestModeMessage.
  ///
  /// In en, this message translates to:
  /// **'You can explore Saxlem, but booking and personal appointments require verification.'**
  String get guestModeMessage;

  /// No description provided for @phoneTitle.
  ///
  /// In en, this message translates to:
  /// **'Your mobile number'**
  String get phoneTitle;

  /// No description provided for @phoneBody.
  ///
  /// In en, this message translates to:
  /// **'We\'ll send a one-time code to securely verify your number.'**
  String get phoneBody;

  /// No description provided for @country.
  ///
  /// In en, this message translates to:
  /// **'Country'**
  String get country;

  /// No description provided for @iraq.
  ///
  /// In en, this message translates to:
  /// **'Iraq'**
  String get iraq;

  /// No description provided for @phoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Mobile number'**
  String get phoneNumber;

  /// No description provided for @phoneHint.
  ///
  /// In en, this message translates to:
  /// **'750 123 4567'**
  String get phoneHint;

  /// No description provided for @phoneInvalid.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid Iraqi mobile number.'**
  String get phoneInvalid;

  /// No description provided for @sendCode.
  ///
  /// In en, this message translates to:
  /// **'Send code'**
  String get sendCode;

  /// No description provided for @otpTitle.
  ///
  /// In en, this message translates to:
  /// **'Enter your code'**
  String get otpTitle;

  /// No description provided for @otpBody.
  ///
  /// In en, this message translates to:
  /// **'We sent a 6-digit code to {phone}.'**
  String otpBody(String phone);

  /// No description provided for @otpLabel.
  ///
  /// In en, this message translates to:
  /// **'6-digit verification code'**
  String get otpLabel;

  /// No description provided for @otpHint.
  ///
  /// In en, this message translates to:
  /// **'Enter 6 digits'**
  String get otpHint;

  /// No description provided for @verify.
  ///
  /// In en, this message translates to:
  /// **'Verify and continue'**
  String get verify;

  /// No description provided for @changeNumber.
  ///
  /// In en, this message translates to:
  /// **'Change number'**
  String get changeNumber;

  /// No description provided for @resendCode.
  ///
  /// In en, this message translates to:
  /// **'Resend code'**
  String get resendCode;

  /// No description provided for @resendIn.
  ///
  /// In en, this message translates to:
  /// **'Resend in {seconds}s'**
  String resendIn(int seconds);

  /// No description provided for @otpInvalid.
  ///
  /// In en, this message translates to:
  /// **'That code is not correct. Please try again.'**
  String get otpInvalid;

  /// No description provided for @otpExpired.
  ///
  /// In en, this message translates to:
  /// **'This code has expired. Request a new one.'**
  String get otpExpired;

  /// No description provided for @otpLimited.
  ///
  /// In en, this message translates to:
  /// **'Too many attempts. Please request a new code.'**
  String get otpLimited;

  /// No description provided for @authUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Phone verification is not available in this build yet.'**
  String get authUnavailable;

  /// No description provided for @sessionExpiredTitle.
  ///
  /// In en, this message translates to:
  /// **'Your session has expired'**
  String get sessionExpiredTitle;

  /// No description provided for @sessionExpiredBody.
  ///
  /// In en, this message translates to:
  /// **'Verify your number again to continue securely.'**
  String get sessionExpiredBody;

  /// No description provided for @developmentCodeHint.
  ///
  /// In en, this message translates to:
  /// **'Development code: {code}'**
  String developmentCodeHint(String code);

  /// No description provided for @logOut.
  ///
  /// In en, this message translates to:
  /// **'Log out'**
  String get logOut;

  /// No description provided for @personalizedFeatureTitle.
  ///
  /// In en, this message translates to:
  /// **'Verification required'**
  String get personalizedFeatureTitle;

  /// No description provided for @personalizedFeatureBody.
  ///
  /// In en, this message translates to:
  /// **'Sign in with your mobile number to use appointments and other personalized care features.'**
  String get personalizedFeatureBody;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @unread.
  ///
  /// In en, this message translates to:
  /// **'Unread'**
  String get unread;

  /// No description provided for @today.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get today;

  /// No description provided for @earlier.
  ///
  /// In en, this message translates to:
  /// **'Earlier'**
  String get earlier;

  /// No description provided for @unreadNotifications.
  ///
  /// In en, this message translates to:
  /// **'{count} unread'**
  String unreadNotifications(int count);

  /// No description provided for @notificationUpdates.
  ///
  /// In en, this message translates to:
  /// **'{count} queue updates'**
  String notificationUpdates(int count);

  /// No description provided for @notificationDetails.
  ///
  /// In en, this message translates to:
  /// **'Notification details'**
  String get notificationDetails;

  /// No description provided for @queueUpdates.
  ///
  /// In en, this message translates to:
  /// **'Queue updates'**
  String get queueUpdates;

  /// No description provided for @whatHappened.
  ///
  /// In en, this message translates to:
  /// **'What happened'**
  String get whatHappened;

  /// No description provided for @whyItHappened.
  ///
  /// In en, this message translates to:
  /// **'Why'**
  String get whyItHappened;

  /// No description provided for @whatToDoNext.
  ///
  /// In en, this message translates to:
  /// **'What to do next'**
  String get whatToDoNext;

  /// No description provided for @viewUpdate.
  ///
  /// In en, this message translates to:
  /// **'View update'**
  String get viewUpdate;

  /// No description provided for @deleteNotification.
  ///
  /// In en, this message translates to:
  /// **'Delete notification'**
  String get deleteNotification;

  /// No description provided for @notificationsEmpty.
  ///
  /// In en, this message translates to:
  /// **'You\'re all caught up'**
  String get notificationsEmpty;

  /// No description provided for @notificationsEmptyBody.
  ///
  /// In en, this message translates to:
  /// **'Appointment, clinic, and queue updates will appear here.'**
  String get notificationsEmptyBody;

  /// No description provided for @notificationsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Notifications are unavailable'**
  String get notificationsUnavailable;

  /// No description provided for @notificationsUnavailableBody.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t load your updates. Please try again.'**
  String get notificationsUnavailableBody;

  /// No description provided for @notificationBookingConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Appointment confirmed'**
  String get notificationBookingConfirmed;

  /// No description provided for @notificationBookingHappened.
  ///
  /// In en, this message translates to:
  /// **'Your appointment with {doctor} is confirmed.'**
  String notificationBookingHappened(String doctor);

  /// No description provided for @notificationBookingWhy.
  ///
  /// In en, this message translates to:
  /// **'The clinic accepted your booking request.'**
  String get notificationBookingWhy;

  /// No description provided for @notificationBookingNext.
  ///
  /// In en, this message translates to:
  /// **'Review the appointment details and arrive at the recommended time.'**
  String get notificationBookingNext;

  /// No description provided for @notificationQueueOpened.
  ///
  /// In en, this message translates to:
  /// **'Your queue is open'**
  String get notificationQueueOpened;

  /// No description provided for @notificationQueueOpenedHappened.
  ///
  /// In en, this message translates to:
  /// **'The live queue for {doctor} is now available.'**
  String notificationQueueOpenedHappened(String doctor);

  /// No description provided for @notificationQueueOpenedWhy.
  ///
  /// In en, this message translates to:
  /// **'The clinic has started today\'s patient queue.'**
  String get notificationQueueOpenedWhy;

  /// No description provided for @notificationQueueOpenedNext.
  ///
  /// In en, this message translates to:
  /// **'Open Live Queue when you are ready to follow your place.'**
  String get notificationQueueOpenedNext;

  /// No description provided for @notificationAlmostTurn.
  ///
  /// In en, this message translates to:
  /// **'You\'re almost next'**
  String get notificationAlmostTurn;

  /// No description provided for @notificationAlmostTurnHappened.
  ///
  /// In en, this message translates to:
  /// **'Your current number is {number}.'**
  String notificationAlmostTurnHappened(int number);

  /// No description provided for @notificationAlmostTurnWhy.
  ///
  /// In en, this message translates to:
  /// **'The queue has moved closer to your turn.'**
  String get notificationAlmostTurnWhy;

  /// No description provided for @notificationAlmostTurnNext.
  ///
  /// In en, this message translates to:
  /// **'Please head to reception and stay nearby.'**
  String get notificationAlmostTurnNext;

  /// No description provided for @notificationWelcome.
  ///
  /// In en, this message translates to:
  /// **'Welcome to Saxlem'**
  String get notificationWelcome;

  /// No description provided for @notificationWelcomeHappened.
  ///
  /// In en, this message translates to:
  /// **'Your Saxlem experience is ready.'**
  String get notificationWelcomeHappened;

  /// No description provided for @notificationWelcomeWhy.
  ///
  /// In en, this message translates to:
  /// **'You started using Saxlem on this device.'**
  String get notificationWelcomeWhy;

  /// No description provided for @notificationWelcomeNext.
  ///
  /// In en, this message translates to:
  /// **'Explore trusted doctors and keep your care organized.'**
  String get notificationWelcomeNext;

  /// No description provided for @notificationReservedType.
  ///
  /// In en, this message translates to:
  /// **'Appointment update'**
  String get notificationReservedType;

  /// No description provided for @notificationReservedHappened.
  ///
  /// In en, this message translates to:
  /// **'Your appointment check-in was updated.'**
  String get notificationReservedHappened;

  /// No description provided for @notificationReservedWhy.
  ///
  /// In en, this message translates to:
  /// **'The clinic recorded your arrival.'**
  String get notificationReservedWhy;

  /// No description provided for @notificationReservedNext.
  ///
  /// In en, this message translates to:
  /// **'Please wait for guidance from reception.'**
  String get notificationReservedNext;

  /// No description provided for @notificationGeneralHappened.
  ///
  /// In en, this message translates to:
  /// **'There is a new update about your care.'**
  String get notificationGeneralHappened;

  /// No description provided for @notificationGeneralWhy.
  ///
  /// In en, this message translates to:
  /// **'New information became available.'**
  String get notificationGeneralWhy;

  /// No description provided for @notificationGeneralNext.
  ///
  /// In en, this message translates to:
  /// **'Review the update and follow any instructions shown.'**
  String get notificationGeneralNext;

  /// No description provided for @notificationTimeJustNow.
  ///
  /// In en, this message translates to:
  /// **'Updated just now'**
  String get notificationTimeJustNow;

  /// No description provided for @notificationTimeMinutesAgo.
  ///
  /// In en, this message translates to:
  /// **'Updated {minutes} minutes ago'**
  String notificationTimeMinutesAgo(int minutes);

  /// No description provided for @notificationTimeEarlier.
  ///
  /// In en, this message translates to:
  /// **'Updated earlier'**
  String get notificationTimeEarlier;

  /// No description provided for @choosePatient.
  ///
  /// In en, this message translates to:
  /// **'Choose Patient'**
  String get choosePatient;

  /// No description provided for @bookingFor.
  ///
  /// In en, this message translates to:
  /// **'Booking For'**
  String get bookingFor;

  /// No description provided for @addPatient.
  ///
  /// In en, this message translates to:
  /// **'Add family member'**
  String get addPatient;

  /// No description provided for @firstName.
  ///
  /// In en, this message translates to:
  /// **'First name'**
  String get firstName;

  /// No description provided for @lastName.
  ///
  /// In en, this message translates to:
  /// **'Last name'**
  String get lastName;

  /// No description provided for @relationship.
  ///
  /// In en, this message translates to:
  /// **'Relationship'**
  String get relationship;

  /// No description provided for @gender.
  ///
  /// In en, this message translates to:
  /// **'Gender'**
  String get gender;

  /// No description provided for @dateOfBirth.
  ///
  /// In en, this message translates to:
  /// **'Date of birth'**
  String get dateOfBirth;

  /// No description provided for @patientRelationship.
  ///
  /// In en, this message translates to:
  /// **'{relationship, select, mother {Mother} father {Father} wife {Wife} husband {Husband} son {Son} daughter {Daughter} brother {Brother} sister {Sister} grandfather {Grandfather} grandmother {Grandmother} me {Me} other {Other}}'**
  String patientRelationship(String relationship);

  /// No description provided for @patientGender.
  ///
  /// In en, this message translates to:
  /// **'{gender, select, female {Female} male {Male} other {Not specified}}'**
  String patientGender(String gender);

  /// No description provided for @loadingPatientAccount.
  ///
  /// In en, this message translates to:
  /// **'Loading your patient account'**
  String get loadingPatientAccount;

  /// No description provided for @profileSetupTitle.
  ///
  /// In en, this message translates to:
  /// **'Tell us about the patient'**
  String get profileSetupTitle;

  /// No description provided for @profileSetupBody.
  ///
  /// In en, this message translates to:
  /// **'Add the essential details needed to personalize your care.'**
  String get profileSetupBody;

  /// No description provided for @creatingPatientProfile.
  ///
  /// In en, this message translates to:
  /// **'Creating patient profile'**
  String get creatingPatientProfile;

  /// No description provided for @profileCreationFailed.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t create this patient profile. Your details are still here—please try again.'**
  String get profileCreationFailed;

  /// No description provided for @profileSelectionFailed.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t switch patients. Please try again.'**
  String get profileSelectionFailed;

  /// No description provided for @patientAccountUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Your patient account is temporarily unavailable.'**
  String get patientAccountUnavailable;

  /// No description provided for @patientAccountInvalid.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t safely read your patient account. Please try again.'**
  String get patientAccountInvalid;

  /// No description provided for @patientAccountOffline.
  ///
  /// In en, this message translates to:
  /// **'You\'re offline. Showing your last available patient information.'**
  String get patientAccountOffline;

  /// No description provided for @emptyPatientProfiles.
  ///
  /// In en, this message translates to:
  /// **'No patient profiles are available yet.'**
  String get emptyPatientProfiles;

  /// No description provided for @doctorDiscoveryTitle.
  ///
  /// In en, this message translates to:
  /// **'Find a doctor'**
  String get doctorDiscoveryTitle;

  /// No description provided for @doctorDiscoveryInstruction.
  ///
  /// In en, this message translates to:
  /// **'Search trusted doctors and narrow the results with the available filters.'**
  String get doctorDiscoveryInstruction;

  /// No description provided for @searchDoctorsLabel.
  ///
  /// In en, this message translates to:
  /// **'Search doctors'**
  String get searchDoctorsLabel;

  /// No description provided for @searchDoctorsHint.
  ///
  /// In en, this message translates to:
  /// **'Doctor name'**
  String get searchDoctorsHint;

  /// No description provided for @clearSearch.
  ///
  /// In en, this message translates to:
  /// **'Clear search'**
  String get clearSearch;

  /// No description provided for @applyFilters.
  ///
  /// In en, this message translates to:
  /// **'Apply filters'**
  String get applyFilters;

  /// No description provided for @specialtyLabel.
  ///
  /// In en, this message translates to:
  /// **'Specialty'**
  String get specialtyLabel;

  /// No description provided for @languageLabel.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get languageLabel;

  /// No description provided for @soraniKurdish.
  ///
  /// In en, this message translates to:
  /// **'Sorani Kurdish'**
  String get soraniKurdish;

  /// No description provided for @turkish.
  ///
  /// In en, this message translates to:
  /// **'Turkish'**
  String get turkish;

  /// No description provided for @experienceLabel.
  ///
  /// In en, this message translates to:
  /// **'Experience'**
  String get experienceLabel;

  /// No description provided for @minimumExperienceLabel.
  ///
  /// In en, this message translates to:
  /// **'Minimum experience'**
  String get minimumExperienceLabel;

  /// No description provided for @anyOption.
  ///
  /// In en, this message translates to:
  /// **'Any'**
  String get anyOption;

  /// No description provided for @appliedFilters.
  ///
  /// In en, this message translates to:
  /// **'Applied filters'**
  String get appliedFilters;

  /// No description provided for @doctorResults.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0 {No doctors} =1 {1 doctor} other {{count} doctors}}'**
  String doctorResults(int count);

  /// No description provided for @noDoctorsTitle.
  ///
  /// In en, this message translates to:
  /// **'No doctors found'**
  String get noDoctorsTitle;

  /// No description provided for @noDoctorsBody.
  ///
  /// In en, this message translates to:
  /// **'Try another doctor name.'**
  String get noDoctorsBody;

  /// No description provided for @noDoctorsFilteredBody.
  ///
  /// In en, this message translates to:
  /// **'Try removing one or more filters.'**
  String get noDoctorsFilteredBody;

  /// No description provided for @loadingDoctors.
  ///
  /// In en, this message translates to:
  /// **'Loading doctors'**
  String get loadingDoctors;

  /// No description provided for @loadingMoreDoctors.
  ///
  /// In en, this message translates to:
  /// **'Loading more doctors'**
  String get loadingMoreDoctors;

  /// No description provided for @loadMoreFailed.
  ///
  /// In en, this message translates to:
  /// **'More doctors could not be loaded. Your current results are still shown.'**
  String get loadMoreFailed;

  /// No description provided for @offlineTitle.
  ///
  /// In en, this message translates to:
  /// **'You are offline'**
  String get offlineTitle;

  /// No description provided for @offlineBody.
  ///
  /// In en, this message translates to:
  /// **'Check your connection and try again.'**
  String get offlineBody;

  /// No description provided for @discoveryUnavailableTitle.
  ///
  /// In en, this message translates to:
  /// **'Doctor discovery is unavailable'**
  String get discoveryUnavailableTitle;

  /// No description provided for @discoveryUnavailableBody.
  ///
  /// In en, this message translates to:
  /// **'The service is temporarily unavailable. Please try again.'**
  String get discoveryUnavailableBody;

  /// No description provided for @discoveryForbiddenTitle.
  ///
  /// In en, this message translates to:
  /// **'Doctor discovery is restricted'**
  String get discoveryForbiddenTitle;

  /// No description provided for @discoveryForbiddenBody.
  ///
  /// In en, this message translates to:
  /// **'Your account cannot access doctor discovery.'**
  String get discoveryForbiddenBody;

  /// No description provided for @malformedDoctorDataTitle.
  ///
  /// In en, this message translates to:
  /// **'Doctor information is unavailable'**
  String get malformedDoctorDataTitle;

  /// No description provided for @malformedDoctorDataBody.
  ///
  /// In en, this message translates to:
  /// **'We could not safely read the doctor information. Please try again.'**
  String get malformedDoctorDataBody;

  /// No description provided for @discoveryErrorTitle.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get discoveryErrorTitle;

  /// No description provided for @discoveryErrorBody.
  ///
  /// In en, this message translates to:
  /// **'Please try again.'**
  String get discoveryErrorBody;

  /// No description provided for @discoveryAuthTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in to find doctors'**
  String get discoveryAuthTitle;

  /// No description provided for @discoveryAuthBody.
  ///
  /// In en, this message translates to:
  /// **'Verify your mobile number to browse authoritative doctor information.'**
  String get discoveryAuthBody;

  /// No description provided for @doctorNotFound.
  ///
  /// In en, this message translates to:
  /// **'Doctor not found'**
  String get doctorNotFound;

  /// No description provided for @doctorNotFoundBody.
  ///
  /// In en, this message translates to:
  /// **'This doctor profile is no longer available.'**
  String get doctorNotFoundBody;

  /// No description provided for @yearsExperience.
  ///
  /// In en, this message translates to:
  /// **'{years, plural, =0 {New to practice} =1 {1 year of experience} other {{years} years of experience}}'**
  String yearsExperience(int years);

  /// No description provided for @genderFemale.
  ///
  /// In en, this message translates to:
  /// **'Female'**
  String get genderFemale;

  /// No description provided for @genderMale.
  ///
  /// In en, this message translates to:
  /// **'Male'**
  String get genderMale;

  /// No description provided for @genderUnspecified.
  ///
  /// In en, this message translates to:
  /// **'Not specified'**
  String get genderUnspecified;

  /// No description provided for @languagesLabel.
  ///
  /// In en, this message translates to:
  /// **'Languages'**
  String get languagesLabel;

  /// No description provided for @clinicsLabel.
  ///
  /// In en, this message translates to:
  /// **'Clinics'**
  String get clinicsLabel;

  /// No description provided for @specialtiesLabel.
  ///
  /// In en, this message translates to:
  /// **'Specialties'**
  String get specialtiesLabel;

  /// No description provided for @biographyLabel.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get biographyLabel;

  /// No description provided for @availabilityLabel.
  ///
  /// In en, this message translates to:
  /// **'Availability'**
  String get availabilityLabel;

  /// No description provided for @doctorAvailable.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get doctorAvailable;

  /// No description provided for @doctorUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Unavailable'**
  String get doctorUnavailable;

  /// No description provided for @acceptingNewPatients.
  ///
  /// In en, this message translates to:
  /// **'Accepting new patients'**
  String get acceptingNewPatients;

  /// No description provided for @notAcceptingNewPatients.
  ///
  /// In en, this message translates to:
  /// **'Not accepting new patients'**
  String get notAcceptingNewPatients;

  /// No description provided for @profileImageLabel.
  ///
  /// In en, this message translates to:
  /// **'Profile image for {name}'**
  String profileImageLabel(String name);

  /// No description provided for @profileImageFallback.
  ///
  /// In en, this message translates to:
  /// **'No profile image for {name}'**
  String profileImageFallback(String name);

  /// No description provided for @viewDoctorProfile.
  ///
  /// In en, this message translates to:
  /// **'View profile for {name}'**
  String viewDoctorProfile(String name);

  /// No description provided for @removeAppliedFilter.
  ///
  /// In en, this message translates to:
  /// **'Remove {label} filter'**
  String removeAppliedFilter(String label);

  /// No description provided for @bookingComingSoon.
  ///
  /// In en, this message translates to:
  /// **'Booking will be available in the next release.'**
  String get bookingComingSoon;

  /// No description provided for @scheduled.
  ///
  /// In en, this message translates to:
  /// **'Scheduled'**
  String get scheduled;

  /// No description provided for @confirmed.
  ///
  /// In en, this message translates to:
  /// **'Confirmed'**
  String get confirmed;

  /// No description provided for @noShow.
  ///
  /// In en, this message translates to:
  /// **'No-show'**
  String get noShow;

  /// No description provided for @loadMore.
  ///
  /// In en, this message translates to:
  /// **'Load more'**
  String get loadMore;

  /// No description provided for @loadingMoreAppointments.
  ///
  /// In en, this message translates to:
  /// **'Loading more appointments'**
  String get loadingMoreAppointments;

  /// No description provided for @appointmentTimeout.
  ///
  /// In en, this message translates to:
  /// **'The request took too long. Please try again.'**
  String get appointmentTimeout;

  /// No description provided for @appointmentForbidden.
  ///
  /// In en, this message translates to:
  /// **'Your account cannot access this appointment.'**
  String get appointmentForbidden;

  /// No description provided for @appointmentNotFound.
  ///
  /// In en, this message translates to:
  /// **'This appointment is no longer available.'**
  String get appointmentNotFound;

  /// No description provided for @staleAppointment.
  ///
  /// In en, this message translates to:
  /// **'The appointment changed. We loaded the latest details.'**
  String get staleAppointment;

  /// No description provided for @appointmentValidation.
  ///
  /// In en, this message translates to:
  /// **'Check the information and try again.'**
  String get appointmentValidation;

  /// No description provided for @appointmentUnknownOutcome.
  ///
  /// In en, this message translates to:
  /// **'We could not confirm the result. Retry to safely check the same request.'**
  String get appointmentUnknownOutcome;

  /// No description provided for @appointmentsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Appointments are temporarily unavailable.'**
  String get appointmentsUnavailable;

  /// No description provided for @reload.
  ///
  /// In en, this message translates to:
  /// **'Reload'**
  String get reload;

  /// No description provided for @patient.
  ///
  /// In en, this message translates to:
  /// **'Patient'**
  String get patient;

  /// No description provided for @appointmentReference.
  ///
  /// In en, this message translates to:
  /// **'Appointment reference'**
  String get appointmentReference;

  /// No description provided for @cancellationReason.
  ///
  /// In en, this message translates to:
  /// **'Cancellation reason'**
  String get cancellationReason;

  /// No description provided for @cancelAppointment.
  ///
  /// In en, this message translates to:
  /// **'Cancel appointment'**
  String get cancelAppointment;

  /// No description provided for @rescheduleAppointment.
  ///
  /// In en, this message translates to:
  /// **'Reschedule appointment'**
  String get rescheduleAppointment;

  /// No description provided for @chooseNewDateTime.
  ///
  /// In en, this message translates to:
  /// **'Choose a new date and time'**
  String get chooseNewDateTime;

  /// No description provided for @confirmCancellation.
  ///
  /// In en, this message translates to:
  /// **'Confirm cancellation'**
  String get confirmCancellation;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @recordArrival.
  ///
  /// In en, this message translates to:
  /// **'Record arrival'**
  String get recordArrival;

  /// No description provided for @nextAppointmentTitle.
  ///
  /// In en, this message translates to:
  /// **'Your next appointment'**
  String get nextAppointmentTitle;

  /// No description provided for @patientsAheadCount.
  ///
  /// In en, this message translates to:
  /// **'{count} patients ahead'**
  String patientsAheadCount(int count);

  /// No description provided for @estimatedWaitLong.
  ///
  /// In en, this message translates to:
  /// **'Estimated wait: {minutes} minutes'**
  String estimatedWaitLong(int minutes);

  /// No description provided for @loadingYourLiveQueue.
  ///
  /// In en, this message translates to:
  /// **'Loading your live queue'**
  String get loadingYourLiveQueue;

  /// No description provided for @queueStatusSemantic.
  ///
  /// In en, this message translates to:
  /// **'Queue status: {status}'**
  String queueStatusSemantic(String status);

  /// No description provided for @queueIsLive.
  ///
  /// In en, this message translates to:
  /// **'Queue is live'**
  String get queueIsLive;

  /// No description provided for @queueIsPaused.
  ///
  /// In en, this message translates to:
  /// **'Queue is paused'**
  String get queueIsPaused;

  /// No description provided for @queueIsClosed.
  ///
  /// In en, this message translates to:
  /// **'Queue is closed'**
  String get queueIsClosed;

  /// No description provided for @queueConnectedTitle.
  ///
  /// In en, this message translates to:
  /// **'Connected'**
  String get queueConnectedTitle;

  /// No description provided for @queueConnectedBody.
  ///
  /// In en, this message translates to:
  /// **'Your queue is live.'**
  String get queueConnectedBody;

  /// No description provided for @queueReconnectingTitle.
  ///
  /// In en, this message translates to:
  /// **'Reconnecting'**
  String get queueReconnectingTitle;

  /// No description provided for @queueReconnectingBody.
  ///
  /// In en, this message translates to:
  /// **'Showing your latest queue update.'**
  String get queueReconnectingBody;

  /// No description provided for @queueDelayedTitle.
  ///
  /// In en, this message translates to:
  /// **'Update delayed'**
  String get queueDelayedTitle;

  /// No description provided for @queueDelayedBody.
  ///
  /// In en, this message translates to:
  /// **'This information may be out of date.'**
  String get queueDelayedBody;

  /// No description provided for @queueOfflineTitle.
  ///
  /// In en, this message translates to:
  /// **'You are offline'**
  String get queueOfflineTitle;

  /// No description provided for @queueOfflineBody.
  ///
  /// In en, this message translates to:
  /// **'Showing the last queue update saved on this device.'**
  String get queueOfflineBody;

  /// No description provided for @queuePausedTitle.
  ///
  /// In en, this message translates to:
  /// **'The queue is temporarily paused'**
  String get queuePausedTitle;

  /// No description provided for @queuePausedBody.
  ///
  /// In en, this message translates to:
  /// **'Your place is safe. We\'ll update you when the queue resumes.'**
  String get queuePausedBody;

  /// No description provided for @queueClosedTitle.
  ///
  /// In en, this message translates to:
  /// **'This queue has closed'**
  String get queueClosedTitle;

  /// No description provided for @queueClosedBody.
  ///
  /// In en, this message translates to:
  /// **'For assistance with your appointment, please contact reception.'**
  String get queueClosedBody;

  /// Shown on the live ticket when the clinic calls the patient's number.
  ///
  /// In en, this message translates to:
  /// **'It\'s your turn'**
  String get itsYourTurn;

  /// Under the count of patients ahead, inside the progress ring.
  ///
  /// In en, this message translates to:
  /// **'ahead'**
  String get aheadShort;

  /// Live ticket progress step 1.
  ///
  /// In en, this message translates to:
  /// **'Booked'**
  String get queueStepBooked;

  /// Live ticket progress step 2.
  ///
  /// In en, this message translates to:
  /// **'Arrived'**
  String get queueStepArrived;

  /// Live ticket progress step 3.
  ///
  /// In en, this message translates to:
  /// **'Waiting'**
  String get queueStepWaiting;

  /// Live ticket progress step 4.
  ///
  /// In en, this message translates to:
  /// **'Your turn'**
  String get queueStepYourTurn;

  /// Live ticket title during the consultation.
  ///
  /// In en, this message translates to:
  /// **'You\'re with the doctor'**
  String get withDoctorTitle;

  /// Live ticket title after the consultation.
  ///
  /// In en, this message translates to:
  /// **'Visit complete'**
  String get visitCompleteTitle;

  /// Live ticket title when the patient was called but did not respond.
  ///
  /// In en, this message translates to:
  /// **'We called your number'**
  String get calledNoResponseTitle;

  /// Live ticket title before the patient has arrived at the clinic.
  ///
  /// In en, this message translates to:
  /// **'You\'re booked for today'**
  String get notCheckedInTitle;

  /// Live ticket title when the clinic removed the entry.
  ///
  /// In en, this message translates to:
  /// **'You\'re no longer in this queue'**
  String get removedFromQueueTitle;

  /// Estimated wait as a range.
  ///
  /// In en, this message translates to:
  /// **'About {min}–{max} {unit}'**
  String waitRange(int min, int max, String unit);

  /// Row label for the doctor on the booking review.
  ///
  /// In en, this message translates to:
  /// **'Doctor'**
  String get doctorLabel;

  /// Section title on the profile tab listing the patient profiles.
  ///
  /// In en, this message translates to:
  /// **'Family members'**
  String get familyMembersTitle;

  /// No description provided for @paymentHowToPay.
  ///
  /// In en, this message translates to:
  /// **'How would you like to pay?'**
  String get paymentHowToPay;

  /// No description provided for @paymentAtCounterTitle.
  ///
  /// In en, this message translates to:
  /// **'Pay at the clinic'**
  String get paymentAtCounterTitle;

  /// No description provided for @paymentAtCounterBody.
  ///
  /// In en, this message translates to:
  /// **'Pay the receptionist when you arrive.'**
  String get paymentAtCounterBody;

  /// No description provided for @paymentOnlineTitle.
  ///
  /// In en, this message translates to:
  /// **'Pay now in the app'**
  String get paymentOnlineTitle;

  /// FIB is First Iraqi Bank's app; keep the name as is.
  ///
  /// In en, this message translates to:
  /// **'Pay securely with your FIB app and skip the counter.'**
  String get paymentOnlineBody;

  /// No description provided for @paymentOnlineUnavailable.
  ///
  /// In en, this message translates to:
  /// **'This clinic takes payment at the clinic only for now.'**
  String get paymentOnlineUnavailable;

  /// No description provided for @paymentRecommended.
  ///
  /// In en, this message translates to:
  /// **'Fastest'**
  String get paymentRecommended;

  /// No description provided for @paymentConfirmAndPay.
  ///
  /// In en, this message translates to:
  /// **'Confirm and pay'**
  String get paymentConfirmAndPay;

  /// No description provided for @paymentTitle.
  ///
  /// In en, this message translates to:
  /// **'Payment'**
  String get paymentTitle;

  /// No description provided for @paymentAmountDue.
  ///
  /// In en, this message translates to:
  /// **'Amount to pay'**
  String get paymentAmountDue;

  /// No description provided for @paymentOpenFib.
  ///
  /// In en, this message translates to:
  /// **'Open FIB to pay'**
  String get paymentOpenFib;

  /// No description provided for @paymentScanQr.
  ///
  /// In en, this message translates to:
  /// **'Paying from another phone? Scan this code.'**
  String get paymentScanQr;

  /// No description provided for @paymentWaiting.
  ///
  /// In en, this message translates to:
  /// **'Waiting for your payment…'**
  String get paymentWaiting;

  /// No description provided for @paymentWaitingBody.
  ///
  /// In en, this message translates to:
  /// **'Approve the payment in FIB, then come back. This screen updates on its own.'**
  String get paymentWaitingBody;

  /// No description provided for @paymentPaidTitle.
  ///
  /// In en, this message translates to:
  /// **'Payment received'**
  String get paymentPaidTitle;

  /// No description provided for @paymentPaidBody.
  ///
  /// In en, this message translates to:
  /// **'You\'re all set. There\'s nothing to pay at the clinic.'**
  String get paymentPaidBody;

  /// No description provided for @paymentExpiredTitle.
  ///
  /// In en, this message translates to:
  /// **'This payment wasn\'t completed'**
  String get paymentExpiredTitle;

  /// No description provided for @paymentExpiredBody.
  ///
  /// In en, this message translates to:
  /// **'Start a new payment, or pay at the clinic. Your appointment is still booked.'**
  String get paymentExpiredBody;

  /// No description provided for @paymentTryAgain.
  ///
  /// In en, this message translates to:
  /// **'Start a new payment'**
  String get paymentTryAgain;

  /// No description provided for @paymentSwitchToCounter.
  ///
  /// In en, this message translates to:
  /// **'Pay at the clinic instead'**
  String get paymentSwitchToCounter;

  /// No description provided for @paymentLater.
  ///
  /// In en, this message translates to:
  /// **'I\'ll pay later'**
  String get paymentLater;

  /// No description provided for @paymentStatusDueAtCounter.
  ///
  /// In en, this message translates to:
  /// **'Pay at clinic'**
  String get paymentStatusDueAtCounter;

  /// No description provided for @paymentStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Payment pending'**
  String get paymentStatusPending;

  /// No description provided for @paymentStatusPaid.
  ///
  /// In en, this message translates to:
  /// **'Paid'**
  String get paymentStatusPaid;

  /// No description provided for @paymentStatusRefunded.
  ///
  /// In en, this message translates to:
  /// **'Refunded'**
  String get paymentStatusRefunded;

  /// No description provided for @paymentStatusRefundPending.
  ///
  /// In en, this message translates to:
  /// **'Refund in progress'**
  String get paymentStatusRefundPending;

  /// No description provided for @paymentStatusRefundFailed.
  ///
  /// In en, this message translates to:
  /// **'Clinic will refund you'**
  String get paymentStatusRefundFailed;

  /// No description provided for @paymentStatusExpired.
  ///
  /// In en, this message translates to:
  /// **'Payment not completed'**
  String get paymentStatusExpired;

  /// No description provided for @paymentStatusVoid.
  ///
  /// In en, this message translates to:
  /// **'Nothing to pay'**
  String get paymentStatusVoid;

  /// No description provided for @paymentPayNow.
  ///
  /// In en, this message translates to:
  /// **'Pay now'**
  String get paymentPayNow;

  /// No description provided for @paymentProblemOffline.
  ///
  /// In en, this message translates to:
  /// **'You\'re offline. Check your connection and try again.'**
  String get paymentProblemOffline;

  /// No description provided for @paymentProblemUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Online payment is unavailable right now. You can pay at the clinic.'**
  String get paymentProblemUnavailable;

  /// No description provided for @paymentProblemNotAccepted.
  ///
  /// In en, this message translates to:
  /// **'This payment can\'t be changed now.'**
  String get paymentProblemNotAccepted;

  /// No description provided for @paymentProblemGeneric.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong with the payment. Your appointment is still booked.'**
  String get paymentProblemGeneric;

  /// No description provided for @paymentBookedPayNext.
  ///
  /// In en, this message translates to:
  /// **'Booked! One last step: pay for your visit.'**
  String get paymentBookedPayNext;

  /// No description provided for @paymentSecureNote.
  ///
  /// In en, this message translates to:
  /// **'You pay inside the FIB app. Saxlem never sees your card or bank details.'**
  String get paymentSecureNote;

  /// Shown under the online payment code.
  ///
  /// In en, this message translates to:
  /// **'Link valid until {time}'**
  String paymentLinkValidUntil(String time);

  /// No description provided for @paymentFibNotOpened.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t open FIB. Install or update the FIB app, or scan the QR code from another phone.'**
  String get paymentFibNotOpened;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsTitle;

  /// No description provided for @appLanguage.
  ///
  /// In en, this message translates to:
  /// **'App language'**
  String get appLanguage;

  /// No description provided for @deleteAccount.
  ///
  /// In en, this message translates to:
  /// **'Delete account'**
  String get deleteAccount;

  /// No description provided for @deleteAccountTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete your Saxlem account?'**
  String get deleteAccountTitle;

  /// No description provided for @deleteAccountBody.
  ///
  /// In en, this message translates to:
  /// **'You\'ll be signed out on every device and your family profiles will be removed from the app. Clinics keep the record of visits you already had.'**
  String get deleteAccountBody;

  /// No description provided for @deleteAccountConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete my account'**
  String get deleteAccountConfirm;

  /// No description provided for @deleteAccountUpcoming.
  ///
  /// In en, this message translates to:
  /// **'Cancel your upcoming appointments first, then try again.'**
  String get deleteAccountUpcoming;

  /// No description provided for @deleteAccountFailed.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t delete your account. Check your connection and try again.'**
  String get deleteAccountFailed;

  /// No description provided for @cancelAction.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancelAction;

  /// No description provided for @languageSaved.
  ///
  /// In en, this message translates to:
  /// **'Language changed'**
  String get languageSaved;

  /// No description provided for @specialtyDentist.
  ///
  /// In en, this message translates to:
  /// **'Dentist'**
  String get specialtyDentist;

  /// No description provided for @specialtyCardiology.
  ///
  /// In en, this message translates to:
  /// **'Cardiology'**
  String get specialtyCardiology;

  /// No description provided for @specialtyPediatrics.
  ///
  /// In en, this message translates to:
  /// **'Pediatrics'**
  String get specialtyPediatrics;

  /// No description provided for @specialtyEye.
  ///
  /// In en, this message translates to:
  /// **'Eye'**
  String get specialtyEye;

  /// No description provided for @specialtyNeurology.
  ///
  /// In en, this message translates to:
  /// **'Neurology'**
  String get specialtyNeurology;

  /// No description provided for @browseSpecialty.
  ///
  /// In en, this message translates to:
  /// **'Browse {specialty} doctors'**
  String browseSpecialty(String specialty);

  /// No description provided for @nextVisitTitle.
  ///
  /// In en, this message translates to:
  /// **'Your next visit'**
  String get nextVisitTitle;

  /// No description provided for @todayChip.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get todayChip;

  /// No description provided for @tomorrowChip.
  ///
  /// In en, this message translates to:
  /// **'Tomorrow'**
  String get tomorrowChip;

  /// No description provided for @howItWorks.
  ///
  /// In en, this message translates to:
  /// **'How Saxlem works'**
  String get howItWorks;

  /// No description provided for @stepBook.
  ///
  /// In en, this message translates to:
  /// **'Book in the app'**
  String get stepBook;

  /// No description provided for @stepCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Check in at reception'**
  String get stepCheckIn;

  /// No description provided for @stepCalled.
  ///
  /// In en, this message translates to:
  /// **'Get called on your phone'**
  String get stepCalled;

  /// No description provided for @alertsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Queue calls and booking updates'**
  String get alertsSubtitle;

  /// No description provided for @slotMorning.
  ///
  /// In en, this message translates to:
  /// **'Morning'**
  String get slotMorning;

  /// No description provided for @slotAfternoon.
  ///
  /// In en, this message translates to:
  /// **'Afternoon'**
  String get slotAfternoon;

  /// No description provided for @slotEvening.
  ///
  /// In en, this message translates to:
  /// **'Evening'**
  String get slotEvening;

  /// No description provided for @ntfBookedTitle.
  ///
  /// In en, this message translates to:
  /// **'Booking confirmed'**
  String get ntfBookedTitle;

  /// No description provided for @ntfBookedNext.
  ///
  /// In en, this message translates to:
  /// **'We\'ll remind you the day before and shortly before your visit.'**
  String get ntfBookedNext;

  /// No description provided for @ntfReminderDayTitle.
  ///
  /// In en, this message translates to:
  /// **'Your visit is tomorrow'**
  String get ntfReminderDayTitle;

  /// No description provided for @ntfReminderSoonTitle.
  ///
  /// In en, this message translates to:
  /// **'Your visit is soon'**
  String get ntfReminderSoonTitle;

  /// No description provided for @ntfReminderNext.
  ///
  /// In en, this message translates to:
  /// **'Check in at reception when you arrive. Can\'t come? Cancel in Appointments so someone else can have the time.'**
  String get ntfReminderNext;

  /// No description provided for @ntfCancelledTitle.
  ///
  /// In en, this message translates to:
  /// **'The clinic cancelled your visit'**
  String get ntfCancelledTitle;

  /// No description provided for @ntfCancelledNext.
  ///
  /// In en, this message translates to:
  /// **'Book another time with the same doctor or another one.'**
  String get ntfCancelledNext;

  /// No description provided for @ntfRescheduledTitle.
  ///
  /// In en, this message translates to:
  /// **'Your visit has a new time'**
  String get ntfRescheduledTitle;

  /// No description provided for @ntfRescheduledNext.
  ///
  /// In en, this message translates to:
  /// **'If the new time doesn\'t suit you, change or cancel it in Appointments.'**
  String get ntfRescheduledNext;

  /// No description provided for @ntfAlmostTitle.
  ///
  /// In en, this message translates to:
  /// **'Almost your turn'**
  String get ntfAlmostTitle;

  /// No description provided for @ntfNextTitle.
  ///
  /// In en, this message translates to:
  /// **'You\'re next'**
  String get ntfNextTitle;

  /// No description provided for @ntfAlmostNext.
  ///
  /// In en, this message translates to:
  /// **'Make your way to the waiting area and stay close.'**
  String get ntfAlmostNext;

  /// No description provided for @ntfQueueOpenedTitle.
  ///
  /// In en, this message translates to:
  /// **'The queue is open'**
  String get ntfQueueOpenedTitle;

  /// No description provided for @ntfFollowQueue.
  ///
  /// In en, this message translates to:
  /// **'Follow your place in the live queue.'**
  String get ntfFollowQueue;

  /// No description provided for @ntfPausedTitle.
  ///
  /// In en, this message translates to:
  /// **'The queue is paused'**
  String get ntfPausedTitle;

  /// No description provided for @ntfPausedNext.
  ///
  /// In en, this message translates to:
  /// **'Your place is kept. We\'ll tell you when it moves again.'**
  String get ntfPausedNext;

  /// No description provided for @ntfResumedTitle.
  ///
  /// In en, this message translates to:
  /// **'The queue is moving again'**
  String get ntfResumedTitle;

  /// No description provided for @ntfClosedTitle.
  ///
  /// In en, this message translates to:
  /// **'The queue is closed'**
  String get ntfClosedTitle;

  /// No description provided for @ntfClosedNext.
  ///
  /// In en, this message translates to:
  /// **'If you weren\'t seen, ask the clinic\'s reception.'**
  String get ntfClosedNext;

  /// No description provided for @ntfEnqueuedTitle.
  ///
  /// In en, this message translates to:
  /// **'You\'re in the queue'**
  String get ntfEnqueuedTitle;

  /// No description provided for @ntfCalledTitle.
  ///
  /// In en, this message translates to:
  /// **'It\'s your turn'**
  String get ntfCalledTitle;

  /// No description provided for @ntfCalledNext.
  ///
  /// In en, this message translates to:
  /// **'Please go in to the doctor now.'**
  String get ntfCalledNext;

  /// No description provided for @ntfMissedTitle.
  ///
  /// In en, this message translates to:
  /// **'You missed your turn'**
  String get ntfMissedTitle;

  /// No description provided for @ntfMissedNext.
  ///
  /// In en, this message translates to:
  /// **'Speak to reception — they can put you back in the queue.'**
  String get ntfMissedNext;

  /// No description provided for @ntfStartedTitle.
  ///
  /// In en, this message translates to:
  /// **'Your consultation has started'**
  String get ntfStartedTitle;

  /// No description provided for @ntfCompletedTitle.
  ///
  /// In en, this message translates to:
  /// **'Visit finished'**
  String get ntfCompletedTitle;

  /// No description provided for @ntfCompletedNext.
  ///
  /// In en, this message translates to:
  /// **'Get well soon. Need a follow-up? Book it from the doctor\'s page.'**
  String get ntfCompletedNext;

  /// No description provided for @ntfWhyAppointment.
  ///
  /// In en, this message translates to:
  /// **'About a visit you booked in Saxlem.'**
  String get ntfWhyAppointment;

  /// No description provided for @ntfWhyQueue.
  ///
  /// In en, this message translates to:
  /// **'From the clinic\'s live queue.'**
  String get ntfWhyQueue;

  /// No description provided for @ntfAtClinic.
  ///
  /// In en, this message translates to:
  /// **'{doctor} at {clinic}'**
  String ntfAtClinic(String doctor, String clinic);

  /// No description provided for @ntfTicket.
  ///
  /// In en, this message translates to:
  /// **'Ticket {number}'**
  String ntfTicket(int number);

  /// No description provided for @ntfAhead.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{Nobody ahead of you} =1{1 person ahead of you} other{{count} people ahead of you}}'**
  String ntfAhead(int count);

  /// No description provided for @ntfDoctorStarted.
  ///
  /// In en, this message translates to:
  /// **'{doctor} has started seeing patients.'**
  String ntfDoctorStarted(String doctor);

  /// No description provided for @ntfDoctorPaused.
  ///
  /// In en, this message translates to:
  /// **'{doctor} paused the queue for a short time.'**
  String ntfDoctorPaused(String doctor);

  /// No description provided for @ntfDoctorResumed.
  ///
  /// In en, this message translates to:
  /// **'{doctor} is seeing patients again.'**
  String ntfDoctorResumed(String doctor);

  /// No description provided for @ntfDoctorFinished.
  ///
  /// In en, this message translates to:
  /// **'{doctor} has finished for today.'**
  String ntfDoctorFinished(String doctor);

  /// No description provided for @ntfCompletedHappened.
  ///
  /// In en, this message translates to:
  /// **'Your visit with {doctor} is complete.'**
  String ntfCompletedHappened(String doctor);

  /// No description provided for @feeFirstVisit.
  ///
  /// In en, this message translates to:
  /// **'First visit'**
  String get feeFirstVisit;

  /// No description provided for @feeFollowUp.
  ///
  /// In en, this message translates to:
  /// **'Follow-up'**
  String get feeFollowUp;

  /// No description provided for @feesTitle.
  ///
  /// In en, this message translates to:
  /// **'Fees'**
  String get feesTitle;

  /// No description provided for @feesNote.
  ///
  /// In en, this message translates to:
  /// **'Pay at the clinic, or in the app with FIB when you book.'**
  String get feesNote;

  /// No description provided for @nextFreeLabel.
  ///
  /// In en, this message translates to:
  /// **'Next free'**
  String get nextFreeLabel;

  /// No description provided for @yearsShort.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 year} other{{count} years}}'**
  String yearsShort(int count);

  /// No description provided for @directions.
  ///
  /// In en, this message translates to:
  /// **'Directions'**
  String get directions;

  /// No description provided for @callClinic.
  ///
  /// In en, this message translates to:
  /// **'Call'**
  String get callClinic;

  /// No description provided for @clinicLocationMissing.
  ///
  /// In en, this message translates to:
  /// **'The clinic hasn\'t added its address yet.'**
  String get clinicLocationMissing;

  /// No description provided for @openMapsFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t open maps on this phone.'**
  String get openMapsFailed;

  /// No description provided for @bookAgainTitle.
  ///
  /// In en, this message translates to:
  /// **'Book again'**
  String get bookAgainTitle;

  /// No description provided for @bookAgainAction.
  ///
  /// In en, this message translates to:
  /// **'Book again with {doctor}'**
  String bookAgainAction(String doctor);

  /// No description provided for @familyTileTitle.
  ///
  /// In en, this message translates to:
  /// **'Family'**
  String get familyTileTitle;

  /// No description provided for @familyTileSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Book for your children and parents'**
  String get familyTileSubtitle;

  /// No description provided for @addToCalendar.
  ///
  /// In en, this message translates to:
  /// **'Add to calendar'**
  String get addToCalendar;

  /// No description provided for @visitWith.
  ///
  /// In en, this message translates to:
  /// **'Visit with {doctor}'**
  String visitWith(String doctor);

  /// No description provided for @freeTodayFilter.
  ///
  /// In en, this message translates to:
  /// **'Free today'**
  String get freeTodayFilter;

  /// No description provided for @noneFreeToday.
  ///
  /// In en, this message translates to:
  /// **'None of these doctors has a free time left today. Turn off \"Free today\" to see other days.'**
  String get noneFreeToday;

  /// No description provided for @helpTitle.
  ///
  /// In en, this message translates to:
  /// **'Help and support'**
  String get helpTitle;

  /// No description provided for @contactSaxlem.
  ///
  /// In en, this message translates to:
  /// **'Message Saxlem on WhatsApp'**
  String get contactSaxlem;

  /// No description provided for @termsOfUse.
  ///
  /// In en, this message translates to:
  /// **'Terms of use'**
  String get termsOfUse;

  /// No description provided for @privacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Privacy policy'**
  String get privacyPolicy;

  /// No description provided for @appVersion.
  ///
  /// In en, this message translates to:
  /// **'Version {version}'**
  String appVersion(String version);

  /// No description provided for @whatsBothering.
  ///
  /// In en, this message translates to:
  /// **'What\'s bothering you?'**
  String get whatsBothering;

  /// No description provided for @symptomFever.
  ///
  /// In en, this message translates to:
  /// **'Fever or cold'**
  String get symptomFever;

  /// No description provided for @symptomChild.
  ///
  /// In en, this message translates to:
  /// **'My child is sick'**
  String get symptomChild;

  /// No description provided for @symptomTooth.
  ///
  /// In en, this message translates to:
  /// **'Tooth pain'**
  String get symptomTooth;

  /// No description provided for @symptomSkin.
  ///
  /// In en, this message translates to:
  /// **'Skin'**
  String get symptomSkin;

  /// No description provided for @symptomHeart.
  ///
  /// In en, this message translates to:
  /// **'Heart and blood pressure'**
  String get symptomHeart;

  /// No description provided for @symptomEyes.
  ///
  /// In en, this message translates to:
  /// **'Eyes'**
  String get symptomEyes;

  /// No description provided for @symptomPregnancy.
  ///
  /// In en, this message translates to:
  /// **'Pregnancy and women\'s health'**
  String get symptomPregnancy;

  /// No description provided for @symptomBones.
  ///
  /// In en, this message translates to:
  /// **'Bones and joints'**
  String get symptomBones;

  /// No description provided for @symptomEar.
  ///
  /// In en, this message translates to:
  /// **'Ear, nose, throat'**
  String get symptomEar;

  /// No description provided for @symptomHead.
  ///
  /// In en, this message translates to:
  /// **'Headache and nerves'**
  String get symptomHead;

  /// No description provided for @symptomStomach.
  ///
  /// In en, this message translates to:
  /// **'Stomach'**
  String get symptomStomach;

  /// No description provided for @specialtiesTitle.
  ///
  /// In en, this message translates to:
  /// **'Specialties'**
  String get specialtiesTitle;

  /// No description provided for @emergencyTitle.
  ///
  /// In en, this message translates to:
  /// **'Emergency'**
  String get emergencyTitle;

  /// No description provided for @emergencySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Ambulance: 122'**
  String get emergencySubtitle;

  /// No description provided for @emergencyConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Call 122 now?'**
  String get emergencyConfirmTitle;

  /// No description provided for @emergencyConfirmBody.
  ///
  /// In en, this message translates to:
  /// **'Saxlem is for booking visits, not emergencies. If someone needs urgent help, call the ambulance.'**
  String get emergencyConfirmBody;

  /// No description provided for @emergencyCall.
  ///
  /// In en, this message translates to:
  /// **'Call 122'**
  String get emergencyCall;

  /// No description provided for @liveNotOpen.
  ///
  /// In en, this message translates to:
  /// **'The queue hasn\'t opened yet'**
  String get liveNotOpen;

  /// No description provided for @liveCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Queue open · check in at reception'**
  String get liveCheckIn;

  /// No description provided for @liveWithDoctor.
  ///
  /// In en, this message translates to:
  /// **'With the doctor now'**
  String get liveWithDoctor;

  /// No description provided for @liveWait.
  ///
  /// In en, this message translates to:
  /// **'about {min}–{max} min'**
  String liveWait(int min, int max);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en', 'ku'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
    case 'ku':
      return AppLocalizationsKu();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}

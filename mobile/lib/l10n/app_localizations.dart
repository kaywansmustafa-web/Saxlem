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
  String iqdAmount(int amount);

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

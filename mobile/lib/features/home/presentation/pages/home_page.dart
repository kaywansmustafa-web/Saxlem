import 'package:flutter/material.dart';

import '../../../../config/theme/app_colors.dart';
import '../../../../shared/widgets/navigation/saxlem_bottom_navigation.dart';
import '../widgets/dashboard_view.dart';
import '../../../discover/discover_feature.dart';
import '../../../discover/domain/entities/doctor_search_criteria.dart';
import '../../../appointments/appointments_feature.dart';
import '../../../../core/localization/localization_extensions.dart';
import 'informational_page.dart';
import '../../../notifications/domain/entities/patient_notification.dart';
import '../../../notifications/domain/entities/notification_types.dart';
import '../../../notifications/notifications_feature.dart';
import '../../../notifications/presentation/controllers/notifications_controller.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/pages/patient_profiles_page.dart';
import '../../../discover/domain/repositories/doctor_discovery_repository.dart';
import '../../../discover/data/repositories/unavailable_doctor_discovery_repository.dart';
import '../../../booking/domain/repositories/booking_repository.dart';
import '../../../booking/data/repositories/backend_booking_repository.dart';
import '../../../appointments/domain/repositories/patient_appointments_repository.dart';
import '../../../appointments/data/repositories/backend_patient_appointments_repository.dart';
import '../../../arrival/domain/repositories/patient_arrival_repository.dart';
import '../../../arrival/data/repositories/backend_patient_arrival_repository.dart';
import '../../../live_queue/domain/repositories/live_queue_repository.dart';
import '../../../live_queue/data/repositories/live_queue_repository_impl.dart';
import '../../../notifications/domain/repositories/notifications_repository.dart';
import '../../../notifications/data/repositories/backend_notifications_repository.dart';

class HomePage extends StatefulWidget {
  const HomePage({
    this.guestMode = false,
    this.onLogout,
    this.profilesController,
    this.doctorDiscoveryRepository =
        const UnavailableDoctorDiscoveryRepository(),
    this.bookingRepository = const UnavailableBookingRepository(),
    this.appointmentsRepository =
        const UnavailablePatientAppointmentsRepository(),
    this.arrivalRepository = const UnavailablePatientArrivalRepository(),
    this.liveQueueRepository = const UnavailableLiveQueueRepository(),
    this.notificationsRepository = const UnavailableNotificationsRepository(),
    super.key,
  });
  final bool guestMode;
  final Future<void> Function()? onLogout;
  final PatientProfilesController? profilesController;
  final DoctorDiscoveryRepository doctorDiscoveryRepository;
  final BookingRepository bookingRepository;
  final PatientAppointmentsRepository appointmentsRepository;
  final PatientArrivalRepository arrivalRepository;
  final LiveQueueRepository liveQueueRepository;
  final NotificationsRepository notificationsRepository;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with WidgetsBindingObserver {
  int _selectedIndex = 0;
  int _discoverRequest = 0;
  DoctorSearchCriteria? _discoverCriteria;
  bool _focusDiscover = false;
  bool _openDiscoverFilters = false;
  late final NotificationsController _notifications;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _notifications = NotificationsController(
      widget.notificationsRepository,
      onAction: _openNotificationAction,
    );
    if (!widget.guestMode) _notifications.load();
    _notifications.addListener(_onNotificationsChanged);
    widget.profilesController?.addListener(_onProfileChanged);
  }

  void _onProfileChanged() =>
      _notifications.load(widget.profilesController!.activeProfileId);

  void _onNotificationsChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _notifications.removeListener(_onNotificationsChanged);
    widget.profilesController?.removeListener(_onProfileChanged);
    _notifications.dispose();
    super.dispose();
  }

  Future<void> _logout() async {
    _notifications.clear();
    await widget.onLogout?.call();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (widget.guestMode) return;
    if (state == AppLifecycleState.resumed) {
      _notifications.resume();
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive ||
        state == AppLifecycleState.detached) {
      _notifications.pause();
    }
  }

  void _openNotificationAction(NotificationAction action) {
    switch (action.destination) {
      case NotificationDestination.appointment:
        setState(() => _selectedIndex = 2);
      case NotificationDestination.doctor:
      case NotificationDestination.booking:
        _openDiscover();
      case NotificationDestination.liveQueue:
        setState(() => _selectedIndex = 2);
      case NotificationDestination.settings:
        setState(() => _selectedIndex = 4);
      case NotificationDestination.none:
        break;
    }
  }

  void _openDiscover({
    DoctorSearchCriteria? criteria,
    bool focus = false,
    bool openFilters = false,
  }) {
    setState(() {
      _selectedIndex = 1;
      _discoverCriteria = criteria;
      _focusDiscover = focus;
      _openDiscoverFilters = openFilters;
      _discoverRequest++;
    });
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            if (widget.guestMode)
              Semantics(
                container: true,
                label: '${strings.guestMode}. ${strings.guestModeMessage}',
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsetsDirectional.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  color: Theme.of(context).colorScheme.primaryContainer,
                  child: Text(
                    '${strings.guestMode}: ${strings.guestModeMessage}',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            Expanded(
              child: IndexedStack(
                index: _selectedIndex,
                children: [
                  DashboardView(
                    onOpenDiscover: _openDiscover,
                    onOpenAlerts: () => setState(() => _selectedIndex = 3),
                    onOpenAppointments: () =>
                        setState(() => _selectedIndex = 2),
                    profilesController: widget.profilesController,
                  ),
                  DiscoverFeature(
                    repository: widget.doctorDiscoveryRepository,
                    bookingRepository: widget.bookingRepository,
                    onAuthenticationRequired: _logout,
                    key: ValueKey(_discoverRequest),
                    initialCriteria: _discoverCriteria,
                    focusSearch: _focusDiscover,
                    openFilters: _openDiscoverFilters,
                    onOpenAppointments: () =>
                        setState(() => _selectedIndex = 2),
                    guestMode: widget.guestMode,
                    profilesController: widget.profilesController,
                  ),
                  widget.guestMode
                      ? InformationalPage(
                          title: strings.personalizedFeatureTitle,
                          message: strings.personalizedFeatureBody,
                          icon: Icons.lock_outline_rounded,
                          semanticLabel: strings.informationalScreen,
                          actionLabel: strings.verifyNumber,
                          onAction: _logout,
                        )
                      : AppointmentsFeature(
                          repository: widget.appointmentsRepository,
                          bookingRepository: widget.bookingRepository,
                          arrivalRepository: widget.arrivalRepository,
                          liveQueueRepository: widget.liveQueueRepository,
                          notificationSignals: _notifications.signals,
                          onOpenDiscover: () => _openDiscover(),
                          profilesController: widget.profilesController,
                          doctorDiscoveryRepository:
                              widget.doctorDiscoveryRepository,
                          onAuthenticationRequired: _logout,
                        ),
                  NotificationsFeature(
                    controller: _notifications,
                    profilesController: widget.profilesController,
                  ),
                  widget.guestMode || widget.profilesController == null
                      ? InformationalPage(
                          title: strings.profileTitle,
                          message: strings.profileBody,
                          icon: Icons.person_outline_rounded,
                          semanticLabel: strings.informationalScreen,
                          actionLabel: widget.guestMode
                              ? strings.verifyNumber
                              : strings.logOut,
                          onAction: _logout,
                        )
                      : PatientProfilesPage(
                          controller: widget.profilesController!,
                          onLogout: _logout,
                        ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SaxlemBottomNavigation(
        selectedIndex: _selectedIndex,
        onItemSelected: (index) => setState(() => _selectedIndex = index),
        labels: [
          strings.home,
          strings.discover,
          strings.appointments,
          strings.notifications,
          strings.profile,
        ],
        notificationCount: _notifications.unreadCount,
        notificationBadgeLabel: strings.unreadNotifications(
          _notifications.unreadCount,
        ),
      ),
    );
  }
}

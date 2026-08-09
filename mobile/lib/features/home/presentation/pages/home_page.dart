import 'package:flutter/material.dart';

import '../../../../config/theme/app_colors.dart';
import '../../../../shared/widgets/navigation/saxlem_bottom_navigation.dart';
import '../widgets/dashboard_view.dart';
import '../../../discover/discover_feature.dart';
import '../../../discover/domain/entities/doctor_search_criteria.dart';
import '../../../appointments/appointments_feature.dart';
import '../../../../core/localization/localization_extensions.dart';
import 'informational_page.dart';
import '../../../notifications/data/data_sources/mock_notifications_data_source.dart';
import '../../../notifications/data/mappers/patient_notification_mapper.dart';
import '../../../notifications/data/repositories/in_memory_notifications_repository.dart';
import '../../../notifications/domain/entities/patient_notification.dart';
import '../../../notifications/domain/entities/notification_types.dart';
import '../../../notifications/notifications_feature.dart';
import '../../../notifications/presentation/controllers/notifications_controller.dart';
import '../../../live_queue/live_queue_feature.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/pages/patient_profiles_page.dart';
import '../../../discover/domain/repositories/doctor_discovery_repository.dart';
import '../../../discover/data/repositories/unavailable_doctor_discovery_repository.dart';
import '../../../booking/domain/repositories/booking_repository.dart';
import '../../../booking/data/repositories/backend_booking_repository.dart';

class HomePage extends StatefulWidget {
  const HomePage({
    this.guestMode = false,
    this.onLogout,
    this.profilesController,
    this.doctorDiscoveryRepository =
        const UnavailableDoctorDiscoveryRepository(),
    this.bookingRepository = const UnavailableBookingRepository(),
    super.key,
  });
  final bool guestMode;
  final Future<void> Function()? onLogout;
  final PatientProfilesController? profilesController;
  final DoctorDiscoveryRepository doctorDiscoveryRepository;
  final BookingRepository bookingRepository;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  int _discoverRequest = 0;
  DoctorSearchCriteria? _discoverCriteria;
  bool _focusDiscover = false;
  bool _openDiscoverFilters = false;
  late final NotificationsController _notifications;

  @override
  void initState() {
    super.initState();
    _notifications = NotificationsController(
      InMemoryNotificationsRepository(
        MockNotificationsDataSource(),
        const PatientNotificationMapper(),
      ),
      onAction: _openNotificationAction,
    )..load();
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
    _notifications.removeListener(_onNotificationsChanged);
    widget.profilesController?.removeListener(_onProfileChanged);
    _notifications.dispose();
    super.dispose();
  }

  void _openQueue() => Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => LiveQueueFeature(
        queueEntryId:
            'entry-${widget.profilesController?.activeProfileId.value ?? 'me'}',
        profilesController: widget.profilesController,
      ),
    ),
  );

  void _openNotificationAction(NotificationAction action) {
    switch (action.destination) {
      case NotificationDestination.appointment:
        setState(() => _selectedIndex = 2);
      case NotificationDestination.doctor:
      case NotificationDestination.booking:
        _openDiscover();
      case NotificationDestination.liveQueue:
        _openQueue();
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
                    onOpenLiveQueue: _openQueue,
                    profilesController: widget.profilesController,
                  ),
                  DiscoverFeature(
                    repository: widget.doctorDiscoveryRepository,
                    bookingRepository: widget.bookingRepository,
                    onAuthenticationRequired: widget.onLogout,
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
                          onAction: widget.onLogout,
                        )
                      : AppointmentsFeature(
                          onOpenDiscover: () => _openDiscover(),
                          profilesController: widget.profilesController,
                          doctorDiscoveryRepository:
                              widget.doctorDiscoveryRepository,
                          onAuthenticationRequired: widget.onLogout,
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
                          onAction: widget.onLogout,
                        )
                      : PatientProfilesPage(
                          controller: widget.profilesController!,
                          onLogout: widget.onLogout,
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

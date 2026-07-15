import 'package:flutter/material.dart';

import '../../../../config/theme/app_colors.dart';
import '../../../../shared/widgets/navigation/saxlem_bottom_navigation.dart';
import '../widgets/dashboard_view.dart';
import '../../../discover/discover_feature.dart';
import '../../../discover/domain/entities/doctor_search_criteria.dart';
import '../../../appointments/appointments_feature.dart';
import '../../../../core/localization/localization_extensions.dart';
import 'informational_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({this.guestMode = false, this.onLogout, super.key});
  final bool guestMode;
  final Future<void> Function()? onLogout;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  int _discoverRequest = 0;
  DoctorSearchCriteria? _discoverCriteria;
  bool _focusDiscover = false;
  bool _openDiscoverFilters = false;

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
                  ),
                  DiscoverFeature(
                    key: ValueKey(_discoverRequest),
                    initialCriteria: _discoverCriteria,
                    focusSearch: _focusDiscover,
                    openFilters: _openDiscoverFilters,
                    onOpenAppointments: () =>
                        setState(() => _selectedIndex = 2),
                    guestMode: widget.guestMode,
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
                        ),
                  InformationalPage(
                    title: strings.alertsTitle,
                    message: strings.alertsBody,
                    icon: Icons.notifications_none_rounded,
                    semanticLabel: strings.informationalScreen,
                  ),
                  InformationalPage(
                    title: strings.profileTitle,
                    message: strings.profileBody,
                    icon: Icons.person_outline_rounded,
                    semanticLabel: strings.informationalScreen,
                    actionLabel: widget.guestMode
                        ? strings.verifyNumber
                        : strings.logOut,
                    onAction: widget.onLogout,
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
          strings.alerts,
          strings.profile,
        ],
      ),
    );
  }
}

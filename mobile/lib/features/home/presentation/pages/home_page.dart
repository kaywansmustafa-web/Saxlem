import 'package:flutter/material.dart';

import '../../../../config/theme/app_colors.dart';
import '../../../../shared/widgets/navigation/saxlem_bottom_navigation.dart';
import '../widgets/dashboard_header.dart';
import '../widgets/dashboard_search_bar.dart';
import '../widgets/next_appointment_card.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;

  void _handleNavigationTap(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: IndexedStack(
          index: _selectedIndex,
          children: const [
            _DashboardView(),
            _PlaceholderTab(title: 'Discover'),
            _PlaceholderTab(title: 'Appointments'),
            _PlaceholderTab(title: 'Alerts'),
            _PlaceholderTab(title: 'Profile'),
          ],
        ),
      ),
      bottomNavigationBar: SaxlemBottomNavigation(
        selectedIndex: _selectedIndex,
        onItemSelected: _handleNavigationTap,
      ),
    );
  }
}

class _DashboardView extends StatelessWidget {
  const _DashboardView();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DashboardHeader(
            userName: 'Kaywan',
            onNotificationPressed: () {},
          ),
          const SizedBox(height: 28),
          DashboardSearchBar(
            onTap: () {},
            onFilterPressed: () {},
          ),
          const SizedBox(height: 28),
          NextAppointmentCard(
            doctorName: 'Dr. Ahmed Hassan',
            specialty: 'Dentist · New consultation',
            appointmentTime: '4:30 PM',
            patientsAhead: 4,
            estimatedWaitMinutes: 26,
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({
    required this.title,
  });

  final String title;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        title,
        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}
import 'package:flutter/material.dart';

import '../../../../config/theme/app_colors.dart';
import '../../../../shared/widgets/navigation/saxlem_bottom_navigation.dart';
import '../widgets/dashboard_view.dart';
import '../../../discover/discover_feature.dart';
import '../../../discover/domain/entities/doctor_search_criteria.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

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
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: IndexedStack(
          index: _selectedIndex,
          children: [
            DashboardView(onOpenDiscover: _openDiscover),
            DiscoverFeature(
              key: ValueKey(_discoverRequest),
              initialCriteria: _discoverCriteria,
              focusSearch: _focusDiscover,
              openFilters: _openDiscoverFilters,
            ),
            const _PlaceholderTab(title: 'Appointments'),
            const _PlaceholderTab(title: 'Alerts'),
            const _PlaceholderTab(title: 'Profile'),
          ],
        ),
      ),
      bottomNavigationBar: SaxlemBottomNavigation(
        selectedIndex: _selectedIndex,
        onItemSelected: (index) => setState(() => _selectedIndex = index),
      ),
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) => Center(
    child: Text(title, style: Theme.of(context).textTheme.headlineMedium),
  );
}

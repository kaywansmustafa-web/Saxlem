import 'package:flutter/material.dart';

import '../../../design_system/components/navigation/saxlem_navigation_bar.dart';

class SaxlemBottomNavigation extends StatelessWidget {
  const SaxlemBottomNavigation({
    required this.selectedIndex,
    required this.onItemSelected,
    required this.labels,
    this.notificationCount = 0,
    this.notificationBadgeLabel,
    super.key,
  });

  final int selectedIndex;
  final ValueChanged<int> onItemSelected;
  final List<String> labels;
  final int notificationCount;
  final String? notificationBadgeLabel;

  static const List<_NavigationItemData> _items = [
    _NavigationItemData(
      label: 'Home',
      icon: Icons.home_outlined,
      selectedIcon: Icons.home_rounded,
    ),
    _NavigationItemData(
      label: 'Discover',
      icon: Icons.search_outlined,
      selectedIcon: Icons.search_rounded,
    ),
    _NavigationItemData(
      label: 'Appointments',
      icon: Icons.calendar_today_outlined,
      selectedIcon: Icons.calendar_month_rounded,
    ),
    _NavigationItemData(
      label: 'Alerts',
      icon: Icons.notifications_none_rounded,
      selectedIcon: Icons.notifications_rounded,
    ),
    _NavigationItemData(
      label: 'Profile',
      icon: Icons.person_outline_rounded,
      selectedIcon: Icons.person_rounded,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    assert(labels.length == _items.length);
    return SaxlemNavigationBar(
      selectedIndex: selectedIndex,
      onSelected: onItemSelected,
      destinations: List.generate(
        _items.length,
        (index) => SaxlemNavigationDestination(
          label: labels[index],
          icon: _items[index].icon,
          selectedIcon: _items[index].selectedIcon,
          badgeCount: index == 3 ? notificationCount : 0,
          badgeSemanticLabel: index == 3 ? notificationBadgeLabel : null,
        ),
      ),
    );
  }
}

class _NavigationItemData {
  const _NavigationItemData({
    required this.label,
    required this.icon,
    required this.selectedIcon,
  });

  final String label;
  final IconData icon;
  final IconData selectedIcon;
}

import 'package:flutter/material.dart';

import '../../../../config/theme/app_colors.dart';
import '../widgets/dashboard_header.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          child: DashboardHeader(
            userName: 'Kaywan',
            onNotificationPressed: () {},
          ),
        ),
      ),
    );
  }
}
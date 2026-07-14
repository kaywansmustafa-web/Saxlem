import 'package:flutter/material.dart';

import '../../../../config/theme/app_colors.dart';
import '../widgets/dashboard_header.dart';
import '../widgets/dashboard_search_bar.dart';
import '../widgets/next_appointment_card.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
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
        ),
      ),
    );
  }
}
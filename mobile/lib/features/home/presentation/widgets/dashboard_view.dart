import 'package:flutter/material.dart';

import '../../../../core/models/recommended_doctor.dart';
import '../../../../core/models/specialty.dart';
import '../../../live_queue/domain/entities/patient_queue_snapshot.dart';
import '../../../live_queue/domain/entities/queue_types.dart';
import '../../../live_queue/live_queue_feature.dart';
import 'dashboard_header.dart';
import 'dashboard_search_bar.dart';
import 'live_queue_card.dart';
import 'popular_specialties_section.dart';
import 'recommended_doctors_section.dart';

class DashboardView extends StatelessWidget {
  const DashboardView({super.key});

  static const _specialties = [
    Specialty(id: 'dentist', name: 'Dentist', iconKey: 'dentist'),
    Specialty(id: 'cardiology', name: 'Cardiology', iconKey: 'cardiology'),
    Specialty(id: 'pediatrics', name: 'Pediatrics', iconKey: 'pediatrics'),
    Specialty(id: 'eye', name: 'Eye', iconKey: 'eye'),
    Specialty(id: 'neurology', name: 'Neurology', iconKey: 'neurology'),
  ];

  static const _doctors = [
    RecommendedDoctor(
      id: '1',
      name: 'Dr. Shilan Ahmed',
      specialty: 'Cardiologist',
      rating: 4.9,
      availability: 'Available today',
      price: 35000,
      currency: 'IQD',
    ),
    RecommendedDoctor(
      id: '2',
      name: 'Dr. Karwan Ali',
      specialty: 'Dentist',
      rating: 4.8,
      availability: 'Tomorrow, 10:00',
      price: 30000,
      currency: 'IQD',
    ),
    RecommendedDoctor(
      id: '3',
      name: 'Dr. Lana Omer',
      specialty: 'Pediatrician',
      rating: 4.9,
      availability: 'Available today',
      price: 40000,
      currency: 'IQD',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.fromSTEB(24, 24, 24, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DashboardHeader(
            greeting: _greeting(DateTime.now().hour),
            userName: 'Kaywan',
            notificationLabel: 'Notifications',
            onNotificationPressed: () {},
          ),
          const SizedBox(height: 26),
          DashboardSearchBar(
            hintText: 'Search doctors, clinics or specialties',
            searchSemanticLabel: 'Open healthcare search',
            filterSemanticLabel: 'Open search filters',
            onTap: () {},
            onFilterPressed: () {},
          ),
          const SizedBox(height: 24),
          LiveQueueCard(
            queue: PatientQueueSnapshot(
              sessionId: 'session-duhok-01',
              queueEntryId: 'entry-patient-23',
              queueVersion: 12,
              careProviderDisplayName: 'Dr. Ahmed Hassan',
              serviceDisplayName: 'Dentistry',
              anonymousCurrentToken: '18',
              patientNumber: '23',
              patientsAhead: 4,
              estimatedWaitLowerMinutes: 21,
              estimatedWaitUpperMinutes: 29,
              estimateConfidence: QueueEstimateConfidence.medium,
              doctorTimingMinutes: 8,
              patientStatus: PatientQueueStatus.expected,
              sessionStatus: QueueSessionStatus.open,
              lastUpdatedAt: DateTime.now(),
              remoteWaitingAllowed: true,
              allowedActions: const {
                PatientQueueAction.onMyWay,
                PatientQueueAction.arrived,
              },
              guidanceMessage: 'Relax, no need to leave yet.',
            ),
            labels: const LiveQueueLabels(
              title: 'Live queue',
              live: 'LIVE',
              currentPatient: 'Current patient',
              youAre: 'Your Number',
              patientsAhead: 'Patients ahead',
              estimatedWait: 'Estimated wait',
              doctorDelay: 'Doctor status',
              minutes: 'min',
              action: 'View live queue',
              semanticSummary:
                  'Live queue. Now serving 18. Your number is 23. '
                  '4 patients ahead. Estimated wait 21 to 29 minutes.',
            ),
            onActionPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) =>
                    const LiveQueueFeature(queueEntryId: 'entry-patient-23'),
              ),
            ),
          ),
          const SizedBox(height: 30),
          PopularSpecialtiesSection(
            title: 'Popular specialties',
            specialties: _specialties,
            semanticLabelBuilder: (item) => 'Browse ${item.name} doctors',
            onSpecialtySelected: (_) {},
          ),
          const SizedBox(height: 30),
          RecommendedDoctorsSection(
            title: 'Recommended doctors',
            actionLabel: 'See all',
            doctors: _doctors,
            bookLabel: 'Book',
            priceLabelBuilder: (doctor) =>
                '${doctor.price.toStringAsFixed(0)} ${doctor.currency}',
            semanticLabelBuilder: (doctor) =>
                '${doctor.name}, ${doctor.specialty}, '
                '${doctor.rating} rating, ${doctor.availability}',
            onActionPressed: () {},
            onBookPressed: (_) {},
          ),
        ],
      ),
    );
  }

  String _greeting(int hour) {
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  }
}

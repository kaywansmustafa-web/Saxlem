import 'package:flutter/material.dart';

import '../../../../core/models/recommended_doctor.dart';
import '../../../../core/models/specialty.dart';
import '../../../live_queue/domain/entities/patient_queue_snapshot.dart';
import '../../../live_queue/domain/entities/queue_types.dart';
import '../../../discover/domain/entities/doctor_search_criteria.dart';
import 'dashboard_header.dart';
import 'dashboard_search_bar.dart';
import 'live_queue_card.dart';
import 'popular_specialties_section.dart';
import 'recommended_doctors_section.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../../family_profiles/presentation/widgets/patient_selector.dart';

class DashboardView extends StatelessWidget {
  const DashboardView({
    required this.onOpenDiscover,
    required this.onOpenAlerts,
    required this.onOpenAppointments,
    required this.onOpenLiveQueue,
    this.profilesController,
    super.key,
  });
  final void Function({
    DoctorSearchCriteria? criteria,
    bool focus,
    bool openFilters,
  })
  onOpenDiscover;
  final VoidCallback onOpenAlerts;
  final VoidCallback onOpenAppointments;
  final VoidCallback onOpenLiveQueue;
  final PatientProfilesController? profilesController;

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
    final strings = context.l10n;
    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.fromSTEB(24, 24, 24, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DashboardHeader(
            greeting: _greeting(context, DateTime.now().hour),
            userName: 'Kaywan',
            notificationLabel: strings.alerts,
            onNotificationPressed: onOpenAlerts,
          ),
          if (profilesController != null) ...[
            const SizedBox(height: 16),
            PatientSelector(
              controller: profilesController!,
              label: strings.currentPatient,
            ),
          ],
          const SizedBox(height: 26),
          DashboardSearchBar(
            hintText: strings.searchHint,
            searchSemanticLabel: strings.openHealthcareSearch,
            filterSemanticLabel: strings.openSearchFilters,
            onTap: () => onOpenDiscover(focus: true, openFilters: false),
            onFilterPressed: () =>
                onOpenDiscover(focus: false, openFilters: true),
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
            labels: LiveQueueLabels(
              title: strings.liveQueue,
              live: strings.live,
              currentPatient: strings.currentPatient,
              youAre: strings.yourNumber,
              patientsAhead: strings.patientsAhead,
              estimatedWait: strings.estimatedWait,
              doctorDelay: strings.doctorStatus,
              minutes: strings.minutesShort,
              action: strings.viewLiveQueue,
              semanticSummary:
                  '${strings.liveQueue}. ${strings.currentPatient} 18. '
                  '${strings.yourNumber} 23. ${strings.patientsAhead} 4. '
                  '${strings.estimatedWait} 21–29 ${strings.minutesShort}.',
            ),
            onActionPressed: onOpenLiveQueue,
          ),
          const SizedBox(height: 30),
          PopularSpecialtiesSection(
            title: strings.popularSpecialties,
            specialties: _specialties,
            semanticLabelBuilder: (item) => 'Browse ${item.name} doctors',
            onSpecialtySelected: (item) => onOpenDiscover(
              criteria: DoctorSearchCriteria(
                specialtyCode: item.id == 'eye' ? 'ophthalmology' : item.id,
              ),
              focus: false,
              openFilters: false,
            ),
          ),
          const SizedBox(height: 30),
          RecommendedDoctorsSection(
            title: strings.recommendedDoctors,
            actionLabel: strings.seeAll,
            doctors: _doctors,
            bookLabel: strings.book,
            priceLabelBuilder: (doctor) => '${doctor.price} ${doctor.currency}',
            semanticLabelBuilder: (doctor) =>
                '${doctor.name}, ${doctor.specialty}, '
                '${doctor.rating} rating, ${doctor.availability}',
            onActionPressed: () =>
                onOpenDiscover(focus: false, openFilters: false),
            onBookPressed: (doctor) => onOpenDiscover(
              criteria: DoctorSearchCriteria(query: doctor.name),
              focus: false,
              openFilters: false,
            ),
          ),
        ],
      ),
    );
  }

  String _greeting(BuildContext context, int hour) {
    if (hour < 12) return context.l10n.goodMorning;
    if (hour < 17) return context.l10n.goodAfternoon;
    return context.l10n.goodEvening;
  }
}

import 'package:flutter/material.dart';
import 'data/data_sources/mock_doctor_discovery_data_source.dart';
import 'data/mappers/doctor_discovery_result_mapper.dart';
import 'data/repositories/doctor_discovery_repository_impl.dart';
import 'domain/entities/doctor_search_criteria.dart';
import 'domain/services/patient_term_specialty_mapper.dart';
import 'domain/use_cases/search_doctors.dart';
import 'domain/use_cases/toggle_my_doctor.dart';
import 'presentation/controllers/discover_controller.dart';
import 'presentation/pages/discover_page.dart';

class DiscoverFeature extends StatefulWidget {
  const DiscoverFeature({
    this.initialCriteria,
    this.focusSearch = false,
    this.openFilters = false,
    super.key,
  });
  final DoctorSearchCriteria? initialCriteria;
  final bool focusSearch;
  final bool openFilters;
  @override
  State<DiscoverFeature> createState() => _DiscoverFeatureState();
}

class _DiscoverFeatureState extends State<DiscoverFeature> {
  late final DiscoverController controller;
  @override
  void initState() {
    super.initState();
    final repo = DoctorDiscoveryRepositoryImpl(
      MockDoctorDiscoveryDataSource(),
      const DoctorDiscoveryResultMapper(),
      const PatientTermSpecialtyMapper(),
    );
    controller = DiscoverController(
      SearchDoctors(repo),
      ToggleMyDoctor(repo),
      repo,
    );
    if (widget.initialCriteria != null) {
      controller.load(withCriteria: widget.initialCriteria);
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => DiscoverPage(
    controller: controller,
    focusSearch: widget.focusSearch,
    openFilters: widget.openFilters,
  );
}

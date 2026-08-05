import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../domain/entities/doctor_discovery_options.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../../domain/entities/doctor_search_criteria.dart';

class AppliedDoctorFilters extends StatelessWidget {
  const AppliedDoctorFilters({
    required this.criteria,
    required this.options,
    required this.onChanged,
    super.key,
  });

  final DoctorSearchCriteria criteria;
  final DoctorDiscoveryOptions options;
  final ValueChanged<DoctorSearchCriteria> onChanged;

  @override
  Widget build(BuildContext context) {
    final filters = _labels(context);
    if (filters.isEmpty) return const SizedBox.shrink();
    return Semantics(
      container: true,
      label: context.l10n.appliedFilters,
      child: Padding(
        padding: const EdgeInsetsDirectional.only(top: 12),
        child: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ...filters.map(
              (filter) => InputChip(
                label: Text(filter.$1),
                onDeleted: () => onChanged(_remove(filter.$2)),
                deleteButtonTooltipMessage: context.l10n.removeAppliedFilter(
                  filter.$1,
                ),
              ),
            ),
            ActionChip(
              label: Text(context.l10n.clearFilters),
              onPressed: () => onChanged(criteria.clearFilters()),
            ),
          ],
        ),
      ),
    );
  }

  List<(String, _FilterKind)> _labels(BuildContext context) => [
    if (criteria.specialtyCode case final code?)
      (
        options.specialties
                .where((item) => item.code == code)
                .map((item) => item.displayName)
                .firstOrNull ??
            code,
        _FilterKind.specialty,
      ),
    if (criteria.clinicId case final id?)
      (
        options.clinics
                .where((item) => item.id == id)
                .map((item) => item.name)
                .firstOrNull ??
            id,
        _FilterKind.clinic,
      ),
    if (criteria.language case final language?)
      (localizedDoctorLanguage(context, language), _FilterKind.language),
    if (criteria.gender case final gender?)
      (_genderLabel(context, gender), _FilterKind.gender),
    if (criteria.minimumYearsOfExperience case final years?)
      (context.l10n.yearsExperience(years), _FilterKind.experience),
  ];

  DoctorSearchCriteria _remove(_FilterKind kind) => switch (kind) {
    _FilterKind.specialty => criteria.copyWith(clearSpecialty: true),
    _FilterKind.clinic => criteria.copyWith(clearClinic: true),
    _FilterKind.language => criteria.copyWith(clearLanguage: true),
    _FilterKind.gender => criteria.copyWith(clearGender: true),
    _FilterKind.experience => criteria.copyWith(clearExperience: true),
  };
}

String localizedDoctorGender(
  BuildContext context,
  BackendDoctorGender gender,
) => _genderLabel(context, gender);

String localizedDoctorLanguage(BuildContext context, String language) =>
    switch (language) {
      'badiniKurdish' => context.l10n.badiniKurdish,
      'soraniKurdish' => context.l10n.soraniKurdish,
      'arabic' => context.l10n.arabic,
      'english' => context.l10n.english,
      'turkish' => context.l10n.turkish,
      _ => language,
    };

String _genderLabel(BuildContext context, BackendDoctorGender gender) =>
    switch (gender) {
      BackendDoctorGender.female => context.l10n.genderFemale,
      BackendDoctorGender.male => context.l10n.genderMale,
      BackendDoctorGender.unspecified => context.l10n.genderUnspecified,
    };

enum _FilterKind { specialty, clinic, language, gender, experience }

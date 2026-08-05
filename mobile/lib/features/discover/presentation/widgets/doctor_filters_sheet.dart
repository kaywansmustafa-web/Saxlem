import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../domain/entities/doctor_discovery_options.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../../domain/entities/doctor_search_criteria.dart';
import 'applied_doctor_filters.dart';

Future<DoctorSearchCriteria?> showDoctorFiltersSheet({
  required BuildContext context,
  required DoctorSearchCriteria criteria,
  required DoctorDiscoveryOptions options,
}) {
  var draft = criteria;
  return showModalBottomSheet<DoctorSearchCriteria>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (context) => StatefulBuilder(
      builder: (context, setSheet) => SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsetsDirectional.fromSTEB(
            24,
            8,
            24,
            24 + MediaQuery.viewInsetsOf(context).bottom,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Semantics(
                header: true,
                child: Text(
                  context.l10n.filters,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
              const SizedBox(height: 16),
              if (options.specialties.isNotEmpty) ...[
                _FilterDropdown<String>(
                  label: context.l10n.specialtyLabel,
                  value: draft.specialtyCode,
                  options: options.specialties
                      .map((item) => (item.code, item.displayName))
                      .toList(),
                  onChanged: (value) => setSheet(
                    () => draft = draft.copyWith(
                      specialtyCode: value,
                      clearSpecialty: value == null,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (options.clinics.isNotEmpty) ...[
                _FilterDropdown<String>(
                  label: context.l10n.clinic,
                  value: draft.clinicId,
                  options: options.clinics
                      .map((item) => (item.id, item.name))
                      .toList(),
                  onChanged: (value) => setSheet(
                    () => draft = draft.copyWith(
                      clinicId: value,
                      clearClinic: value == null,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (options.languages.isNotEmpty) ...[
                _FilterDropdown<String>(
                  label: context.l10n.languageLabel,
                  value: draft.language,
                  options: options.languages
                      .map(
                        (item) =>
                            (item, localizedDoctorLanguage(context, item)),
                      )
                      .toList(),
                  onChanged: (value) => setSheet(
                    () => draft = draft.copyWith(
                      language: value,
                      clearLanguage: value == null,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (options.genders.isNotEmpty) ...[
                _FilterDropdown<BackendDoctorGender>(
                  label: context.l10n.gender,
                  value: draft.gender,
                  options: options.genders
                      .map(
                        (item) => (item, localizedDoctorGender(context, item)),
                      )
                      .toList(),
                  onChanged: (value) => setSheet(
                    () => draft = draft.copyWith(
                      gender: value,
                      clearGender: value == null,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (options.minimumExperience case final minimum?)
                if (options.maximumExperience case final maximum?)
                  _FilterDropdown<int>(
                    label: context.l10n.minimumExperienceLabel,
                    value: draft.minimumYearsOfExperience,
                    options: [
                      for (var value = minimum; value <= maximum; value++)
                        (value, context.l10n.yearsExperience(value)),
                    ],
                    onChanged: (value) => setSheet(
                      () => draft = draft.copyWith(
                        minimumYearsOfExperience: value,
                        clearExperience: value == null,
                      ),
                    ),
                  ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () => Navigator.pop(context, draft),
                child: Text(context.l10n.applyFilters),
              ),
              TextButton(
                onPressed: () => Navigator.pop(
                  context,
                  DoctorSearchCriteria(query: draft.query),
                ),
                child: Text(context.l10n.clearFilters),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _FilterDropdown<T> extends StatelessWidget {
  const _FilterDropdown({
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
  });

  final String label;
  final T? value;
  final List<(T, String)> options;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) => DropdownButtonFormField<T?>(
    initialValue: value,
    isExpanded: true,
    decoration: InputDecoration(labelText: label),
    items: [
      DropdownMenuItem<T?>(value: null, child: Text(context.l10n.anyOption)),
      ...options.map(
        (item) => DropdownMenuItem<T?>(value: item.$1, child: Text(item.$2)),
      ),
    ],
    onChanged: onChanged,
  );
}

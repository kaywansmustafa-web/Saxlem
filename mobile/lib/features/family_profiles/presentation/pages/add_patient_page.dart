import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../../design_system/design_system.dart';
import '../controllers/patient_profiles_controller.dart';

class AddPatientPage extends StatefulWidget {
  const AddPatientPage({required this.controller, super.key});
  final PatientProfilesController controller;
  @override
  State<AddPatientPage> createState() => _AddPatientPageState();
}

class _AddPatientPageState extends State<AddPatientPage> {
  String first = '', last = '';
  PatientRelationship relationship = PatientRelationship.other;
  PatientGender gender = PatientGender.unspecified;
  DateTime birth = DateTime(2000, 1, 1);
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(context.l10n.addPatient)),
    body: SaxlemResponsiveContent(
      child: ListView(
        padding: const EdgeInsetsDirectional.symmetric(
          vertical: SaxlemSpacing.three,
        ),
        children: [
          SaxlemTextField(
            label: context.l10n.firstName,
            onChanged: (v) => setState(() => first = v),
          ),
          const SizedBox(height: SaxlemSpacing.two),
          SaxlemTextField(
            label: context.l10n.lastName,
            onChanged: (v) => setState(() => last = v),
          ),
          const SizedBox(height: SaxlemSpacing.two),
          SaxlemCard(
            onTap: () async {
              final value = await Navigator.of(context)
                  .push<PatientRelationship>(
                    MaterialPageRoute(
                      builder: (_) => _OptionPage(
                        title: context.l10n.relationship,
                        values: PatientRelationship.values
                            .where((e) => e != PatientRelationship.me)
                            .toList(),
                        label: (e) => context.l10n.patientRelationship(e.name),
                      ),
                    ),
                  );
              if (value != null) setState(() => relationship = value);
            },
            child: Text(
              '${context.l10n.relationship}: ${context.l10n.patientRelationship(relationship.name)}',
            ),
          ),
          const SizedBox(height: SaxlemSpacing.two),
          SaxlemCard(
            onTap: () async {
              final value = await Navigator.of(context).push<PatientGender>(
                MaterialPageRoute(
                  builder: (_) => _OptionPage(
                    title: context.l10n.gender,
                    values: PatientGender.values,
                    label: (e) => context.l10n.patientGender(e.name),
                  ),
                ),
              );
              if (value != null) setState(() => gender = value);
            },
            child: Text(
              '${context.l10n.gender}: ${context.l10n.patientGender(gender.name)}',
            ),
          ),
          const SizedBox(height: SaxlemSpacing.two),
          SaxlemCard(
            onTap: () async {
              final value = await showDatePicker(
                context: context,
                firstDate: DateTime(1900),
                lastDate: DateTime.now(),
                initialDate: birth,
              );
              if (value != null) setState(() => birth = value);
            },
            child: Text(
              '${context.l10n.dateOfBirth}: ${birth.year}-${birth.month}-${birth.day}',
            ),
          ),
          const SizedBox(height: SaxlemSpacing.three),
          if (widget.controller.failure != null) ...[
            Semantics(
              liveRegion: true,
              child: Text(context.l10n.profileCreationFailed),
            ),
            const SizedBox(height: SaxlemSpacing.two),
          ],
          SaxlemButton(
            label: widget.controller.status == PatientProfilesStatus.submitting
                ? context.l10n.creatingPatientProfile
                : context.l10n.addPatient,
            expand: true,
            onPressed:
                first.trim().isEmpty ||
                    last.trim().isEmpty ||
                    widget.controller.status == PatientProfilesStatus.submitting
                ? null
                : () async {
                    final success = await widget.controller.add(
                      relationship: relationship,
                      firstName: first,
                      lastName: last,
                      gender: gender,
                      dateOfBirth: birth,
                    );
                    if (context.mounted && success) Navigator.pop(context);
                  },
          ),
        ],
      ),
    ),
  );
}

class _OptionPage<T> extends StatelessWidget {
  const _OptionPage({
    required this.title,
    required this.values,
    required this.label,
  });
  final String title;
  final Iterable<T> values;
  final String Function(T) label;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(title)),
    body: SaxlemResponsiveContent(
      child: ListView(
        padding: const EdgeInsetsDirectional.symmetric(
          vertical: SaxlemSpacing.three,
        ),
        children: values
            .map(
              (value) => Padding(
                padding: const EdgeInsetsDirectional.only(
                  bottom: SaxlemSpacing.one,
                ),
                child: SaxlemCard(
                  onTap: () => Navigator.pop(context, value),
                  child: Text(label(value)),
                ),
              ),
            )
            .toList(),
      ),
    ),
  );
}

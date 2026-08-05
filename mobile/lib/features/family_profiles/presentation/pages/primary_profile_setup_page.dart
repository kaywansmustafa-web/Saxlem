import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../../design_system/design_system.dart';
import '../controllers/patient_profiles_controller.dart';

class PrimaryProfileSetupPage extends StatefulWidget {
  const PrimaryProfileSetupPage({required this.controller, super.key});
  final PatientProfilesController controller;
  @override
  State<PrimaryProfileSetupPage> createState() =>
      _PrimaryProfileSetupPageState();
}

class _PrimaryProfileSetupPageState extends State<PrimaryProfileSetupPage> {
  String firstName = '';
  String lastName = '';
  PatientGender gender = PatientGender.unspecified;
  DateTime dateOfBirth = DateTime(2000);

  Future<void> _submit() async {
    await widget.controller.add(
      relationship: PatientRelationship.me,
      firstName: firstName,
      lastName: lastName,
      gender: gender,
      dateOfBirth: dateOfBirth,
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: SaxlemResponsiveContent(
        child: ListenableBuilder(
          listenable: widget.controller,
          builder: (context, _) => ListView(
            padding: const EdgeInsetsDirectional.symmetric(
              vertical: SaxlemSpacing.four,
            ),
            children: [
              Text(
                context.l10n.profileSetupTitle,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: SaxlemSpacing.one),
              Text(context.l10n.profileSetupBody),
              const SizedBox(height: SaxlemSpacing.three),
              SaxlemTextField(
                label: context.l10n.firstName,
                onChanged: (value) => setState(() => firstName = value),
              ),
              const SizedBox(height: SaxlemSpacing.two),
              SaxlemTextField(
                label: context.l10n.lastName,
                onChanged: (value) => setState(() => lastName = value),
              ),
              const SizedBox(height: SaxlemSpacing.two),
              DropdownButtonFormField<PatientGender>(
                initialValue: gender,
                decoration: InputDecoration(labelText: context.l10n.gender),
                items: PatientGender.values
                    .map(
                      (value) => DropdownMenuItem(
                        value: value,
                        child: Text(context.l10n.patientGender(value.name)),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value != null) setState(() => gender = value);
                },
              ),
              const SizedBox(height: SaxlemSpacing.two),
              Semantics(
                button: true,
                label: context.l10n.dateOfBirth,
                child: SaxlemCard(
                  onTap:
                      widget.controller.status ==
                          PatientProfilesStatus.submitting
                      ? null
                      : () async {
                          final value = await showDatePicker(
                            context: context,
                            firstDate: DateTime(1900),
                            lastDate: DateTime.now(),
                            initialDate: dateOfBirth,
                          );
                          if (value != null) {
                            setState(() => dateOfBirth = value);
                          }
                        },
                  child: Text(
                    '${context.l10n.dateOfBirth}: ${dateOfBirth.year}-${dateOfBirth.month}-${dateOfBirth.day}',
                  ),
                ),
              ),
              if (widget.controller.failure != null) ...[
                const SizedBox(height: SaxlemSpacing.two),
                Semantics(
                  liveRegion: true,
                  child: Text(context.l10n.profileCreationFailed),
                ),
              ],
              const SizedBox(height: SaxlemSpacing.three),
              SaxlemButton(
                label:
                    widget.controller.status == PatientProfilesStatus.submitting
                    ? context.l10n.creatingPatientProfile
                    : context.l10n.continueLabel,
                expand: true,
                onPressed:
                    firstName.trim().isEmpty ||
                        lastName.trim().isEmpty ||
                        widget.controller.status ==
                            PatientProfilesStatus.submitting
                    ? null
                    : _submit,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

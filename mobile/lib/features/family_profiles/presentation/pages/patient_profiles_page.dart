import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../controllers/patient_profiles_controller.dart';
import '../widgets/patient_selector.dart';
import 'add_patient_page.dart';

class PatientProfilesPage extends StatelessWidget {
  const PatientProfilesPage({
    required this.controller,
    this.onLogout,
    super.key,
  });
  final PatientProfilesController controller;
  final Future<void> Function()? onLogout;
  @override
  Widget build(BuildContext context) => SaxlemResponsiveContent(
    child: ListView(
      padding: const EdgeInsetsDirectional.symmetric(
        vertical: SaxlemSpacing.three,
      ),
      children: [
        Text(
          context.l10n.currentPatient,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: SaxlemSpacing.two),
        PatientSelector(
          controller: controller,
          label: context.l10n.currentPatient,
        ),
        const SizedBox(height: SaxlemSpacing.three),
        SaxlemButton(
          label: context.l10n.addPatient,
          onPressed: controller.guest
              ? null
              : () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => AddPatientPage(controller: controller),
                  ),
                ),
          expand: true,
        ),
        if (onLogout != null) ...[
          const SizedBox(height: SaxlemSpacing.one),
          SaxlemButton(
            label: context.l10n.logOut,
            onPressed: onLogout,
            hierarchy: SaxlemButtonHierarchy.tertiary,
            expand: true,
          ),
        ],
      ],
    ),
  );
}

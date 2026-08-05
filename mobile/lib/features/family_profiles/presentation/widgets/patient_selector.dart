import 'package:flutter/material.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../controllers/patient_profiles_controller.dart';

class PatientSelector extends StatelessWidget {
  const PatientSelector({
    required this.controller,
    required this.label,
    super.key,
  });
  final PatientProfilesController controller;
  final String label;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) {
      final profile = controller.activeProfile;
      if (profile == null) return const SizedBox.shrink();
      return SaxlemCard(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => PatientChooserPage(controller: controller),
          ),
        ),
        semanticLabel:
            '$label. ${profile.displayName}. ${context.l10n.choosePatient}',
        child: Row(
          children: [
            SaxlemAvatar(
              semanticLabel: profile.displayName,
              initials: profile.initials,
            ),
            const SizedBox(width: SaxlemSpacing.two),
            Expanded(
              child: AnimatedSwitcher(
                duration: SaxlemMotion.standard,
                child: Column(
                  key: ValueKey(profile.id.value),
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: Theme.of(context).textTheme.labelMedium),
                    Text(
                      profile.displayName,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(
                      context.l10n.patientRelationship(
                        profile.relationship.name,
                      ),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
            const Icon(Icons.swap_horiz_rounded),
          ],
        ),
      );
    },
  );
}

class PatientChooserPage extends StatelessWidget {
  const PatientChooserPage({required this.controller, super.key});
  final PatientProfilesController controller;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(context.l10n.choosePatient)),
    body: SaxlemResponsiveContent(
      child: ListenableBuilder(
        listenable: controller,
        builder: (context, _) => ListView(
          padding: const EdgeInsetsDirectional.symmetric(
            vertical: SaxlemSpacing.three,
          ),
          children: [
            if (controller.failure != null)
              Semantics(
                liveRegion: true,
                child: Text(context.l10n.profileSelectionFailed),
              ),
            ...controller.profiles.map(
              (profile) => Padding(
                padding: const EdgeInsetsDirectional.only(
                  bottom: SaxlemSpacing.one,
                ),
                child: SaxlemCard(
                  onTap: controller.status == PatientProfilesStatus.selecting
                      ? null
                      : () async {
                          final success = await controller.select(profile.id);
                          if (context.mounted && success) {
                            Navigator.pop(context);
                          }
                        },
                  semanticLabel: profile.displayName,
                  child: Row(
                    children: [
                      SaxlemAvatar(
                        semanticLabel: profile.displayName,
                        initials: profile.initials,
                      ),
                      const SizedBox(width: SaxlemSpacing.two),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(profile.displayName),
                            Text(
                              context.l10n.patientRelationship(
                                profile.relationship.name,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (profile.id == controller.activeProfileId)
                        const Icon(Icons.check_circle_rounded),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

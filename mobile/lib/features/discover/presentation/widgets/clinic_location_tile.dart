import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/entities/clinic_location.dart';

/// A clinic with its address and one-tap Directions and Call.
/// Loads the location itself; shows just the name if it isn't known.
class ClinicLocationTile extends StatefulWidget {
  const ClinicLocationTile({
    required this.clinicId,
    required this.clinicName,
    this.source,
    super.key,
  });
  final String clinicId, clinicName;
  final ClinicLocationSource? source;

  @override
  State<ClinicLocationTile> createState() => _ClinicLocationTileState();
}

class _ClinicLocationTileState extends State<ClinicLocationTile> {
  ClinicLocation? _location;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    final source = widget.source;
    if (source == null) {
      _loaded = true;
      return;
    }
    source
        .clinicLocation(widget.clinicId)
        .then((value) {
          if (mounted) {
            setState(() {
              _location = value;
              _loaded = true;
            });
          }
        })
        .catchError((Object _) {
          if (mounted) setState(() => _loaded = true);
        });
  }

  Future<void> _open(Uri uri) async {
    final messenger = ScaffoldMessenger.maybeOf(context);
    final failed = context.l10n.openMapsFailed;
    final opened = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    ).catchError((Object _) => false);
    if (!opened) messenger?.showSnackBar(SnackBar(content: Text(failed)));
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    final theme = Theme.of(context);
    final strings = context.l10n;
    final location = _location;
    final line = location?.line ?? '';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: colors.brandTint,
                borderRadius: BorderRadius.circular(SaxlemRadii.small),
              ),
              child: Icon(
                Icons.local_hospital_outlined,
                size: 20,
                color: colors.brandPrimary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.clinicName, style: theme.textTheme.titleSmall),
                  if (line.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      line,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                  ] else if (_loaded && widget.source != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      strings.clinicLocationMissing,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.textMuted,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        if (location != null &&
            (location.canNavigate || location.call != null)) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              if (location.canNavigate)
                Expanded(
                  flex: 3,
                  child: SaxlemButton(
                    label: strings.directions,
                    leadingIcon: Icons.directions_rounded,
                    onPressed: () => _open(location.directions),
                    expand: true,
                  ),
                ),
              if (location.canNavigate && location.call != null)
                const SizedBox(width: 10),
              if (location.call case final call?)
                Expanded(
                  flex: 2,
                  child: SaxlemButton(
                    label: strings.callClinic,
                    leadingIcon: Icons.call_rounded,
                    hierarchy: SaxlemButtonHierarchy.secondary,
                    onPressed: () => _open(call),
                    expand: true,
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }
}

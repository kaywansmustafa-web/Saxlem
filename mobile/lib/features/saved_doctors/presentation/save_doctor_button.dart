import 'package:flutter/material.dart';

import '../../../core/localization/localization_extensions.dart';
import '../../../design_system/design_system.dart';
import '../domain/saved_doctors.dart';

/// A heart that saves or un-saves a doctor, right away.
class SaveDoctorButton extends StatefulWidget {
  const SaveDoctorButton({
    required this.doctorId,
    required this.doctorName,
    required this.source,
    super.key,
  });
  final String doctorId, doctorName;
  final SavedDoctorsSource source;

  @override
  State<SaveDoctorButton> createState() => _SaveDoctorButtonState();
}

class _SaveDoctorButtonState extends State<SaveDoctorButton> {
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    if (widget.source.savedIds.value == null) {
      widget.source.savedDoctors().then((_) {}, onError: (Object _) {});
    }
  }

  Future<void> _toggle(bool saved) async {
    if (_busy) return;
    final strings = context.l10n;
    final messenger = ScaffoldMessenger.maybeOf(context);
    setState(() => _busy = true);
    try {
      await widget.source.setSaved(widget.doctorId, saved: !saved);
      messenger?.hideCurrentSnackBar();
      messenger?.showSnackBar(
        SnackBar(
          content: Text(saved ? strings.savedRemoved : strings.savedAdded),
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (_) {
      messenger?.hideCurrentSnackBar();
      messenger?.showSnackBar(SnackBar(content: Text(strings.savedFailed)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<Set<String>?>(
    valueListenable: widget.source.savedIds,
    builder: (context, ids, _) {
      final saved = ids?.contains(widget.doctorId) ?? false;
      final strings = context.l10n;
      return IconButton(
        tooltip: saved
            ? strings.unsaveDoctor(widget.doctorName)
            : strings.saveDoctor(widget.doctorName),
        isSelected: saved,
        onPressed: ids == null || _busy ? null : () => _toggle(saved),
        icon: Icon(
          saved ? Icons.favorite_rounded : Icons.favorite_border_rounded,
          color: saved
              ? const Color(0xFFE5484D)
              : context.saxlemColors.textSecondary,
        ),
      );
    },
  );
}

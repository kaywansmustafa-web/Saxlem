import 'package:flutter/material.dart';

import '../../../core/localization/localization_extensions.dart';
import '../../../design_system/design_system.dart';
import '../../discover/domain/entities/doctor_discovery_result.dart';
import '../../discover/presentation/widgets/doctor_result_card.dart';
import '../../reviews/presentation/rating_stars.dart';
import '../domain/saved_doctors.dart';

/// Home's "Saved doctors" row. Quietly absent until something is saved.
class SavedDoctorsStrip extends StatefulWidget {
  const SavedDoctorsStrip({
    required this.source,
    required this.onOpenDoctor,
    super.key,
  });
  final SavedDoctorsSource source;
  final ValueChanged<String> onOpenDoctor;

  @override
  State<SavedDoctorsStrip> createState() => _SavedDoctorsStripState();
}

class _SavedDoctorsStripState extends State<SavedDoctorsStrip> {
  List<DoctorDiscoveryResult> _doctors = const [];
  Set<String>? _shown;

  @override
  void initState() {
    super.initState();
    widget.source.savedIds.addListener(_changed);
    _load();
  }

  @override
  void dispose() {
    widget.source.savedIds.removeListener(_changed);
    super.dispose();
  }

  /// Saved or removed elsewhere (a doctor's profile): follow along.
  /// Removals are dropped here; a new doctor needs a reload.
  void _changed() {
    final ids = widget.source.savedIds.value;
    if (ids == null || _shown == null) return;
    if (ids.difference(_shown!).isNotEmpty) {
      _load();
      return;
    }
    if (ids.length == _shown!.length) return;
    setState(() {
      _doctors = [
        for (final doctor in _doctors)
          if (ids.contains(doctor.doctorId)) doctor,
      ];
      _shown = ids;
    });
  }

  Future<void> _load() async {
    try {
      final doctors = await widget.source.savedDoctors();
      if (!mounted) return;
      setState(() {
        _doctors = doctors;
        _shown = {for (final doctor in doctors) doctor.doctorId};
      });
    } catch (_) {
      // Home still works without the row.
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_doctors.isEmpty) return const SizedBox.shrink();
    final strings = context.l10n;
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsetsDirectional.only(top: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            header: true,
            child: Text(
              strings.savedDoctorsTitle,
              style: theme.textTheme.titleMedium,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 144,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _doctors.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final doctor = _doctors[index];
                return SizedBox(
                  width: 168,
                  child: SaxlemCard(
                    onTap: () => widget.onOpenDoctor(doctor.doctorId),
                    semanticLabel: strings.viewDoctorProfile(
                      doctor.doctorDisplayName,
                    ),
                    padding: const EdgeInsets.all(14),
                    child: ExcludeSemantics(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              SaxlemAvatar(
                                size: 40,
                                ring: true,
                                imageUrl: doctor.photoUrl,
                                initials: doctorInitials(
                                  doctor.doctorDisplayName,
                                ),
                                semanticLabel: doctor.doctorDisplayName,
                              ),
                              const Spacer(),
                              Icon(
                                Icons.favorite_rounded,
                                size: 18,
                                color: context.saxlemColors.roseContent,
                              ),
                            ],
                          ),
                          const Spacer(),
                          Text(
                            doctor.doctorDisplayName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleSmall,
                          ),
                          Text(
                            doctor.primarySpecialtyDisplayName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodySmall,
                          ),
                          if (doctor.rating case final rating?
                              when rating.count > 0)
                            RatingLine(
                              average: rating.average,
                              count: rating.count,
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Profile → Saved doctors: everyone the patient kept, to open or book.
class SavedDoctorsPage extends StatefulWidget {
  const SavedDoctorsPage({
    required this.source,
    required this.onOpenDoctor,
    super.key,
  });
  final SavedDoctorsSource source;
  final ValueChanged<String> onOpenDoctor;

  @override
  State<SavedDoctorsPage> createState() => _SavedDoctorsPageState();
}

class _SavedDoctorsPageState extends State<SavedDoctorsPage> {
  late Future<List<DoctorDiscoveryResult>> _doctors = widget.source
      .savedDoctors();

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(strings.savedDoctorsTitle)),
      body: SaxlemAuraBackdrop(
        strength: .5,
        child: SafeArea(
          top: false,
          child: FutureBuilder<List<DoctorDiscoveryResult>>(
            future: _doctors,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(strings.savedFailed),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () => setState(
                          () => _doctors = widget.source.savedDoctors(),
                        ),
                        child: Text(strings.tryAgain),
                      ),
                    ],
                  ),
                );
              }
              final doctors = snapshot.data!;
              if (doctors.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.favorite_border_rounded,
                          size: 40,
                          color: context.saxlemColors.textMuted,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          strings.savedDoctorsEmpty,
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodyLarge,
                        ),
                      ],
                    ),
                  ),
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: doctors.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, index) => DoctorResultCard(
                  doctor: doctors[index],
                  onProfile: () => widget.onOpenDoctor(doctors[index].doctorId),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

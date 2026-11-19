import 'package:flutter/material.dart';

import '../../../../core/formatting/clinic_format.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../discover/domain/entities/doctor_discovery_options.dart';
import '../../../discover/domain/entities/doctor_discovery_result.dart';
import '../../../discover/domain/entities/doctor_search_criteria.dart';
import '../../../discover/domain/repositories/doctor_discovery_repository.dart';
import '../../../discover/presentation/widgets/doctor_result_card.dart';
import '../../../discover/presentation/widgets/visit_facts.dart';

/// A symptom a patient recognises, and the specialty codes it leads to.
/// Codes are matched by keyword, because each clinic network names its
/// specialties itself; a symptom is shown only when a matching specialty
/// really has doctors.
class _Symptom {
  const _Symptom(this.label, this.icon, this.keywords);
  final String Function(AppLocalizations) label;
  final IconData icon;

  /// Regular expressions, tried against the lower-case specialty code.
  final List<String> keywords;

  bool matches(String code) =>
      keywords.any((pattern) => RegExp(pattern).hasMatch(code.toLowerCase()));
}

final _symptoms = <_Symptom>[
  _Symptom((s) => s.symptomFever, Icons.thermostat_rounded, [
    'general',
    'family',
    'internal',
  ]),
  _Symptom((s) => s.symptomChild, Icons.child_care_rounded, [
    'pediat',
    'paediat',
  ]),
  _Symptom((s) => s.symptomTooth, Icons.medical_services_outlined, ['dent']),
  _Symptom((s) => s.symptomSkin, Icons.spa_outlined, ['derma', 'skin']),
  _Symptom((s) => s.symptomHeart, Icons.favorite_border_rounded, ['cardi']),
  _Symptom((s) => s.symptomEyes, Icons.remove_red_eye_outlined, [
    'ophthal',
    'eye',
  ]),
  _Symptom((s) => s.symptomPregnancy, Icons.pregnant_woman_rounded, [
    'gyn',
    'obstet',
  ]),
  _Symptom((s) => s.symptomBones, Icons.accessibility_new_rounded, [
    'ortho',
    'rheum',
  ]),
  // "ent" alone, not inside "dentistry".
  _Symptom((s) => s.symptomEar, Icons.hearing_rounded, [
    '^ent\$',
    '^ent-',
    '-ent\$',
    'otolaryng',
  ]),
  _Symptom((s) => s.symptomHead, Icons.psychology_outlined, ['neuro']),
  _Symptom((s) => s.symptomStomach, Icons.lunch_dining_outlined, [
    'gastro',
    'digest',
  ]),
];

/// The icon for a specialty, by its code.
IconData specialtyIcon(String code) {
  for (final symptom in _symptoms) {
    if (symptom.matches(code)) return symptom.icon;
  }
  return Icons.local_hospital_outlined;
}

/// Home's discovery: "What's bothering you?", doctors free today, and the
/// specialties that really have doctors. Loads once; each part hides itself
/// when it has nothing real to show.
class HomeDiscoverySections extends StatefulWidget {
  const HomeDiscoverySections({
    required this.repository,
    required this.onOpenDiscover,
    required this.onOpenDoctor,
    this.fallback,
    this.now = DateTime.now,
    super.key,
  });

  /// Shown instead when the doctor directory can't be read (signed out,
  /// offline), so Home still offers a way in.
  final Widget? fallback;
  final DoctorDiscoveryRepository repository;
  final void Function({DoctorSearchCriteria? criteria}) onOpenDiscover;
  final ValueChanged<String> onOpenDoctor;
  final DateTime Function() now;

  @override
  State<HomeDiscoverySections> createState() => _HomeDiscoverySectionsState();
}

class _HomeDiscoverySectionsState extends State<HomeDiscoverySections> {
  DoctorDiscoveryOptions? _options;
  bool _optionsFailed = false;
  List<DoctorDiscoveryResult> _freeToday = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final options = await widget.repository.loadOptions();
      if (mounted) setState(() => _options = options);
    } catch (_) {
      if (mounted) setState(() => _optionsFailed = true);
      return;
    }
    try {
      final page = await widget.repository.search(
        const DoctorSearchCriteria(),
        page: 1,
        pageSize: 50,
      );
      final today = ClinicFormat.atClinic(widget.now());
      final free =
          page.results.where((doctor) {
            final next = doctor.availability.nextAvailableAt;
            if (next == null) return false;
            final day = ClinicFormat.atClinic(next);
            return day.year == today.year &&
                day.month == today.month &&
                day.day == today.day;
          }).toList()..sort(
            (a, b) => a.availability.nextAvailableAt!.compareTo(
              b.availability.nextAvailableAt!,
            ),
          );
      if (mounted) setState(() => _freeToday = free.take(8).toList());
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_optionsFailed && widget.fallback != null) return widget.fallback!;
    final strings = context.l10n;
    final specialties = _options?.specialties ?? const [];
    final symptoms = [
      for (final symptom in _symptoms)
        if (specialties.firstWhereOrNull((s) => symptom.matches(s.code))
            case final match?)
          (symptom: symptom, code: match.code),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (symptoms.isNotEmpty) ...[
          const SizedBox(height: 22),
          _Heading(strings.whatsBothering),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final item in symptoms)
                _SymptomChip(
                  icon: item.symptom.icon,
                  label: item.symptom.label(strings),
                  onTap: () => widget.onOpenDiscover(
                    criteria: DoctorSearchCriteria(specialtyCode: item.code),
                  ),
                ),
            ],
          ),
        ],
        if (_freeToday.isNotEmpty) ...[
          const SizedBox(height: 22),
          _Heading(strings.freeTodayFilter),
          const SizedBox(height: 12),
          SizedBox(
            height: 150,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _freeToday.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, index) => _FreeDoctorCard(
                doctor: _freeToday[index],
                onTap: () => widget.onOpenDoctor(_freeToday[index].doctorId),
              ),
            ),
          ),
        ],
        if (specialties.isNotEmpty) ...[
          const SizedBox(height: 22),
          Row(
            children: [
              Expanded(child: _Heading(strings.specialtiesTitle)),
              TextButton(
                onPressed: () => widget.onOpenDiscover(),
                child: Text(strings.seeAll),
              ),
            ],
          ),
          const SizedBox(height: 4),
          SizedBox(
            height: 104,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: specialties.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final specialty = specialties[index];
                return _SpecialtyTile(
                  icon: specialtyIcon(specialty.code),
                  label: specialty.displayName,
                  semanticLabel: strings.browseSpecialty(specialty.displayName),
                  onTap: () => widget.onOpenDiscover(
                    criteria: DoctorSearchCriteria(
                      specialtyCode: specialty.code,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }
}

extension<T> on List<T> {
  T? firstWhereOrNull(bool Function(T) test) {
    for (final item in this) {
      if (test(item)) return item;
    }
    return null;
  }
}

class _Heading extends StatelessWidget {
  const _Heading(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Semantics(
    header: true,
    child: Text(text, style: Theme.of(context).textTheme.titleMedium),
  );
}

class _SymptomChip extends StatelessWidget {
  const _SymptomChip({
    required this.icon,
    required this.label,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return Semantics(
      button: true,
      child: Material(
        color: colors.surfaceRaised,
        shape: StadiumBorder(side: BorderSide(color: colors.border)),
        child: InkWell(
          customBorder: const StadiumBorder(),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(12, 9, 14, 9),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 18, color: colors.brandPrimary),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    label,
                    style: Theme.of(
                      context,
                    ).textTheme.labelLarge?.copyWith(color: colors.textPrimary),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FreeDoctorCard extends StatelessWidget {
  const _FreeDoctorCard({required this.doctor, required this.onTap});
  final DoctorDiscoveryResult doctor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    final next = doctor.availability.nextAvailableAt!;
    final time = ClinicFormat.time(next);
    return SizedBox(
      width: 196,
      child: SaxlemCard(
        onTap: onTap,
        semanticLabel:
            '${doctor.doctorDisplayName}, ${doctor.primarySpecialtyDisplayName}, ${nextFreeText(context, next)}',
        padding: const EdgeInsets.all(14),
        child: ExcludeSemantics(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  SaxlemAvatar(
                    size: 38,
                    ring: true,
                    imageUrl: doctor.photoUrl,
                    initials: doctorInitials(doctor.doctorDisplayName),
                    semanticLabel: doctor.doctorDisplayName,
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: colors.positiveSurface,
                      borderRadius: BorderRadius.circular(SaxlemRadii.full),
                    ),
                    child: Text(
                      time,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: colors.positiveContent,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
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
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colors.textSecondary,
                ),
              ),
              if (doctor.fees case final fees?) ...[
                const SizedBox(height: 4),
                Text(
                  feeText(context, fees.firstVisitIqd),
                  style: theme.textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _SpecialtyTile extends StatelessWidget {
  const _SpecialtyTile({
    required this.icon,
    required this.label,
    required this.semanticLabel,
    required this.onTap,
  });
  final IconData icon;
  final String label, semanticLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.saxlemColors;
    return SizedBox(
      width: 96,
      child: SaxlemCard(
        onTap: onTap,
        semanticLabel: semanticLabel,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        child: ExcludeSemantics(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  gradient: colors.deepAura,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(icon, size: 21, color: colors.onFill),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelLarge,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

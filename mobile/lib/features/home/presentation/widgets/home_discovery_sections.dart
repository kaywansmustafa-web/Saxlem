import 'package:flutter/material.dart';

import '../../../../core/formatting/clinic_format.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../../discover/domain/entities/doctor_discovery_options.dart';
import '../../../discover/domain/entities/doctor_discovery_result.dart';
import '../../../discover/domain/entities/doctor_search_criteria.dart';
import '../../../discover/domain/repositories/doctor_discovery_repository.dart';
import '../../../discover/presentation/widgets/doctor_result_card.dart';
import '../../../discover/presentation/widgets/visit_facts.dart';
import '../../../../core/app_config/app_config.dart';
import '../../../../core/app_config/app_config_store.dart';
import '../../../../core/app_config/catalog_icons.dart';

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
    final config = context.appConfig;
    final locale = Localizations.localeOf(context);
    final available = {
      for (final item
          in _options?.specialties ?? const <DoctorSpecialtyOption>[])
        item.code,
    };
    // Tiles from Owner Portal → Home tiles; each keeps only the
    // specialties that really have doctors, and hides when none do.
    final concerns = !config.home('concerns')
        ? const <(HomeConcern, List<String>)>[]
        : [
            for (final concern in config.concerns)
              if (concern.specialtyCodes.where(available.contains).toList()
                  case final codes when codes.isNotEmpty)
                (concern, codes),
          ];
    // Specialties in the owner's order, without those taken off Home.
    final specialties = !config.home('specialties')
        ? const <DoctorSpecialtyOption>[]
        : ((_options?.specialties ?? const <DoctorSpecialtyOption>[])
              .where((s) => config.specialty(s.code)?.showOnHome ?? true)
              .toList()
            ..sort(
              (a, b) => config
                  .specialtyRank(a.code)
                  .compareTo(config.specialtyRank(b.code)),
            ));
    final freeToday = config.home('freeToday') ? _freeToday : const [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (concerns.isNotEmpty) ...[
          const SizedBox(height: 22),
          _Heading(strings.whatsBothering),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 14,
            crossAxisSpacing: 8,
            childAspectRatio: .72,
            padding: EdgeInsets.zero,
            children: [
              for (final (index, (concern, codes)) in concerns.indexed)
                _SymptomTile(
                  index: index,
                  icon: catalogIcon(concern.icon),
                  tone: concern.tone,
                  label: concern.labels.of(locale),
                  onTap: () => widget.onOpenDiscover(
                    criteria: DoctorSearchCriteria(
                      specialtyCodes: codes,
                      concernLabel: concern.labels.of(locale),
                    ),
                  ),
                ),
            ],
          ),
        ],
        if (freeToday.isNotEmpty) ...[
          const SizedBox(height: 22),
          _Heading(strings.freeTodayFilter),
          const SizedBox(height: 12),
          SizedBox(
            height: 160,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: freeToday.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, index) => _FreeDoctorCard(
                doctor: freeToday[index],
                onTap: () => widget.onOpenDoctor(freeToday[index].doctorId),
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
            height: 112,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: specialties.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final specialty = specialties[index];
                final name = config.specialtyName(
                  specialty.code,
                  locale,
                  specialty.displayName,
                );
                return _SpecialtyTile(
                  icon: catalogIcon(
                    config.specialty(specialty.code)?.icon ?? 'hospital',
                  ),
                  label: name,
                  semanticLabel: strings.browseSpecialty(name),
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

class _Heading extends StatelessWidget {
  const _Heading(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Semantics(
    header: true,
    child: Text(text, style: Theme.of(context).textTheme.titleMedium),
  );
}

/// Design A symptom tile: a coloured shape with the icon, the words below.
class _SymptomTile extends StatelessWidget {
  const _SymptomTile({
    required this.index,
    required this.icon,
    required this.tone,
    required this.label,
    required this.onTap,
  });
  final int index;
  final IconData icon;
  final String tone;
  final String label;
  final VoidCallback onTap;

  static const _kinds = [
    SaxlemShapeKind.circle,
    SaxlemShapeKind.cookie,
    SaxlemShapeKind.squircle,
    SaxlemShapeKind.flower,
  ];

  @override
  Widget build(BuildContext context) {
    final (wash, tint) = toneColors(context.saxlemColors, tone);
    return Semantics(
      button: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Column(
          children: [
            SaxlemShape(
              kind: _kinds[index % _kinds.length],
              color: wash,
              size: 62,
              child: Icon(icon, size: 26, color: tint),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                height: 1.25,
              ),
            ),
          ],
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
            '${doctor.doctorDisplayName}, ${context.specialtyLabel(doctor.primarySpecialtyDisplayName)}, ${nextFreeText(context, next)}',
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
                      color: colors.liveSurface,
                      borderRadius: BorderRadius.circular(SaxlemRadii.full),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: colors.liveContent,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          time,
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: colors.liveContent,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
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
                context.specialtyLabel(doctor.primarySpecialtyDisplayName),
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
                  color: colors.brandTint,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(icon, size: 21, color: colors.brandPrimary),
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

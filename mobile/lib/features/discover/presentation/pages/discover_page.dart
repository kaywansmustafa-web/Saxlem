import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../../domain/entities/discovery_types.dart';
import '../../domain/entities/doctor_search_criteria.dart';
import '../controllers/discover_controller.dart';
import '../discover_copy.dart';
import '../state/discover_state.dart';
import '../widgets/doctor_result_card.dart';
import 'doctor_details_page.dart';

class DiscoverPage extends StatefulWidget {
  const DiscoverPage({
    required this.controller,
    this.focusSearch = false,
    this.openFilters = false,
    super.key,
  });
  final DiscoverController controller;
  final bool focusSearch;
  final bool openFilters;
  @override
  State<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends State<DiscoverPage> {
  final _search = TextEditingController();
  final _focus = FocusNode();
  static const copy = DiscoverCopy();
  @override
  void initState() {
    super.initState();
    if (widget.focusSearch) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => _focus.requestFocus(),
      );
    }
    if (widget.openFilters) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _showFilters());
    }
  }

  @override
  void dispose() {
    _search.dispose();
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ColoredBox(
    color: AppColors.background,
    child: SafeArea(
      child: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, _) => Column(
          children: [
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(24, 18, 24, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _search,
                      focusNode: _focus,
                      onChanged: widget.controller.updateQuery,
                      decoration: InputDecoration(
                        hintText: 'Search doctors, clinics or health concerns',
                        prefixIcon: const Icon(Icons.search_rounded),
                        suffixIcon: _search.text.isEmpty
                            ? null
                            : IconButton(
                                onPressed: () {
                                  _search.clear();
                                  widget.controller.updateQuery('');
                                },
                                icon: const Icon(Icons.close_rounded),
                              ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filledTonal(
                    onPressed: _showFilters,
                    tooltip: 'Filters',
                    icon: const Icon(Icons.tune_rounded),
                  ),
                  PopupMenuButton<DiscoverySort>(
                    tooltip: 'Sort results',
                    onSelected: widget.controller.sort,
                    itemBuilder: (_) => DiscoverySort.values
                        .map(
                          (v) => PopupMenuItem(
                            value: v,
                            child: Text(_sortLabel(v)),
                          ),
                        )
                        .toList(),
                    icon: const Icon(Icons.swap_vert_rounded),
                  ),
                ],
              ),
            ),
            Expanded(child: _body(widget.controller.state)),
          ],
        ),
      ),
    ),
  );
  Widget _body(DiscoverState state) => switch (state) {
    DiscoverInitial() => _initial(),
    DiscoverLoading() => const Center(child: CircularProgressIndicator()),
    DiscoverOffline() => _message(
      Icons.cloud_off_outlined,
      'You are offline',
      'Connect to view the latest doctors.',
      widget.controller.retry,
    ),
    DiscoverFailure(:final message) => _message(
      Icons.error_outline_rounded,
      'Something went wrong',
      message,
      widget.controller.retry,
    ),
    DiscoverEmpty(:final filtered) => _message(
      Icons.search_off_rounded,
      filtered ? 'No doctors match these filters' : 'No doctors found',
      filtered
          ? 'Try removing one or two filters.'
          : 'Try another doctor, clinic, or health term.',
      filtered ? widget.controller.clearFilters : widget.controller.retry,
    ),
    DiscoverResults(:final page, :final criteria, :final loadingMore) =>
      NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n.metrics.extentAfter < 300) widget.controller.loadMore();
          return false;
        },
        child: ListView(
          padding: const EdgeInsetsDirectional.fromSTEB(24, 8, 24, 36),
          children: [
            if (page.stale)
              Container(
                margin: const EdgeInsetsDirectional.only(bottom: 12),
                padding: const EdgeInsetsDirectional.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.tertiaryContainer,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Text(
                  'Showing saved results. Updates may be delayed.',
                ),
              ),
            if (criteria.hasFilters)
              Wrap(
                spacing: 7,
                children: [
                  ActionChip(
                    label: const Text('Clear filters'),
                    onPressed: widget.controller.clearFilters,
                  ),
                ],
              ),
            Padding(
              padding: const EdgeInsetsDirectional.symmetric(vertical: 12),
              child: Text(
                '${page.totalCount} doctors',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            ...page.results.map(
              (doctor) => Padding(
                padding: const EdgeInsetsDirectional.only(bottom: 14),
                child: DoctorResultCard(
                  doctor: doctor,
                  copy: copy,
                  onFavorite: () =>
                      widget.controller.toggleMyDoctor(doctor.doctorId),
                  onProfile: () => _details(doctor),
                  onBook: () => _details(doctor, book: true),
                ),
              ),
            ),
            if (loadingMore)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(18),
                  child: CircularProgressIndicator(),
                ),
              ),
          ],
        ),
      ),
  };
  Widget _initial() => ListView(
    padding: const EdgeInsetsDirectional.fromSTEB(24, 12, 24, 36),
    children: [
      Text(
        'Find the right care',
        style: Theme.of(
          context,
        ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
      ),
      const SizedBox(height: 8),
      const Text(
        'Search in everyday words. We’ll help you find doctors who may be able to help.',
      ),
      const SizedBox(height: 24),
      Text('Quick categories', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 12),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: MedicalSpecialty.values
            .take(8)
            .map(
              (s) => ActionChip(
                label: Text(copy.specialty(s)),
                onPressed: () => widget.controller.applyCriteria(
                  DoctorSearchCriteria(specialty: s),
                ),
              ),
            )
            .toList(),
      ),
    ],
  );
  Widget _message(
    IconData icon,
    String title,
    String message,
    VoidCallback action,
  ) => Center(
    child: Padding(
      padding: const EdgeInsetsDirectional.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 52, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 16),
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 7),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 20),
          FilledButton(onPressed: action, child: const Text('Try again')),
        ],
      ),
    ),
  );
  void _details(dynamic doctor, {bool book = false}) =>
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) =>
              DoctorDetailsPage(doctor: doctor, bookingEmphasized: book),
        ),
      );
  String _sortLabel(DiscoverySort v) => switch (v) {
    DiscoverySort.recommended => 'Recommended',
    DiscoverySort.earliestAvailability => 'Earliest availability',
    DiscoverySort.shortestWait => 'Shortest wait',
    DiscoverySort.nearest => 'Nearest',
    DiscoverySort.lowestFee => 'Lowest fee',
    DiscoverySort.highestRating => 'Highest rating',
  };
  Future<void> _showFilters() async {
    var draft = widget.controller.criteria;
    final result = await showModalBottomSheet<DoctorSearchCriteria>(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheet) => SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsetsDirectional.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Filters',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 18),
                DropdownButtonFormField<MedicalSpecialty>(
                  initialValue: draft.specialty,
                  decoration: const InputDecoration(labelText: 'Specialty'),
                  items: MedicalSpecialty.values
                      .map(
                        (s) => DropdownMenuItem(
                          value: s,
                          child: Text(copy.specialty(s)),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setSheet(
                    () => draft = draft.copyWith(
                      specialty: v,
                      clearSpecialty: v == null,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text('Neighborhood'),
                Wrap(
                  spacing: 7,
                  children:
                      const {
                            'malta': 'Malta',
                            'masike': 'Masike',
                            'city-center': 'City Center',
                            'zawa': 'Zawa',
                            'baroshke': 'Baroshke',
                          }.entries
                          .map(
                            (entry) => FilterChip(
                              label: Text(entry.value),
                              selected: draft.areaIds.contains(entry.key),
                              onSelected: (selected) => setSheet(() {
                                final areas = {...draft.areaIds};
                                selected
                                    ? areas.add(entry.key)
                                    : areas.remove(entry.key);
                                draft = draft.copyWith(
                                  cityId: 'duhok',
                                  areaIds: areas,
                                );
                              }),
                            ),
                          )
                          .toList(),
                ),
                const SizedBox(height: 10),
                const Text('Doctor gender'),
                Wrap(
                  spacing: 7,
                  children: DoctorGender.values
                      .map(
                        (gender) => ChoiceChip(
                          label: Text(
                            gender == DoctorGender.female ? 'Female' : 'Male',
                          ),
                          selected: draft.gender == gender,
                          onSelected: (_) => setSheet(
                            () => draft = draft.copyWith(gender: gender),
                          ),
                        ),
                      )
                      .toList(),
                ),
                const SizedBox(height: 10),
                const Text('Languages'),
                Wrap(
                  spacing: 7,
                  children: SpokenLanguage.values
                      .map(
                        (language) => FilterChip(
                          label: Text(copy.language(language)),
                          selected: draft.languages.contains(language),
                          onSelected: (selected) => setSheet(() {
                            final languages = {...draft.languages};
                            selected
                                ? languages.add(language)
                                : languages.remove(language);
                            draft = draft.copyWith(languages: languages);
                          }),
                        ),
                      )
                      .toList(),
                ),
                SwitchListTile(
                  title: const Text('Available today'),
                  value: draft.availableToday,
                  onChanged: (v) =>
                      setSheet(() => draft = draft.copyWith(availableToday: v)),
                ),
                SwitchListTile(
                  title: const Text('Available now'),
                  value: draft.availableNow,
                  onChanged: (v) =>
                      setSheet(() => draft = draft.copyWith(availableNow: v)),
                ),
                SwitchListTile(
                  title: const Text('Verified doctors only'),
                  value: draft.verifiedOnly,
                  onChanged: (v) =>
                      setSheet(() => draft = draft.copyWith(verifiedOnly: v)),
                ),
                SwitchListTile(
                  title: const Text('Shortest expected wait'),
                  value: draft.shortestWaitOnly,
                  onChanged: (v) => setSheet(
                    () => draft = draft.copyWith(shortestWaitOnly: v),
                  ),
                ),
                const SizedBox(height: 12),
                Text('Maximum fee: ${copy.fee(draft.maximumFeeIqd)}'),
                Slider(
                  value: draft.maximumFeeIqd.toDouble(),
                  min: 20000,
                  max: 100000,
                  divisions: 16,
                  onChanged: (v) => setSheet(
                    () => draft = draft.copyWith(maximumFeeIqd: v.round()),
                  ),
                ),
                const SizedBox(height: 14),
                FilledButton(
                  onPressed: () => Navigator.pop(context, draft),
                  child: const Text('Show doctors'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    if (result != null) await widget.controller.applyCriteria(result);
  }
}

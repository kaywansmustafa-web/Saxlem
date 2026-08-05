import 'package:flutter/material.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../domain/entities/doctor_search_criteria.dart';
import '../controllers/discover_controller.dart';
import '../state/discover_state.dart';
import '../widgets/doctor_result_card.dart';
import 'doctor_details_page.dart';

class DiscoverPage extends StatefulWidget {
  const DiscoverPage({
    required this.controller,
    this.focusSearch = false,
    this.openFilters = false,
    this.onOpenAppointments,
    this.guestMode = false,
    this.profilesController,
    super.key,
  });
  final DiscoverController controller;
  final bool focusSearch;
  final bool openFilters;
  final VoidCallback? onOpenAppointments;
  final bool guestMode;
  final PatientProfilesController? profilesController;
  @override
  State<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends State<DiscoverPage> {
  final _search = TextEditingController();
  final _focus = FocusNode();
  @override
  void initState() {
    super.initState();
    _search.text = widget.controller.criteria.query;
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
                        hintText: context.l10n.searchHint,
                        prefixIcon: const Icon(Icons.search_rounded),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filledTonal(
                    onPressed:
                        widget.controller.state is DiscoverReady ||
                            widget.controller.state is DiscoverEmpty
                        ? _showFilters
                        : null,
                    tooltip: context.l10n.filters,
                    icon: const Icon(Icons.tune_rounded),
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
    DiscoverInitial() ||
    DiscoverLoadingOptions() ||
    DiscoverLoading() => const Center(child: CircularProgressIndicator()),
    DiscoverAuthenticationRequired() => _message(
      Icons.lock_outline_rounded,
      context.l10n.personalizedFeatureTitle,
      context.l10n.personalizedFeatureBody,
      null,
    ),
    DiscoverFailure(:final problem, :final retained) =>
      retained != null
          ? _results(retained)
          : _message(
              Icons.error_outline_rounded,
              _problemTitle(problem),
              _problemBody(problem),
              widget.controller.retry,
            ),
    DiscoverEmpty(:final criteria) => _message(
      Icons.search_off_rounded,
      'No doctors found',
      criteria.hasFilters
          ? 'Try removing one or more filters.'
          : 'Try another doctor or specialty.',
      criteria.hasFilters
          ? widget.controller.clearFilters
          : widget.controller.retry,
    ),
    DiscoverReady() => _results(state),
  };
  Widget _results(DiscoverReady state) =>
      NotificationListener<ScrollNotification>(
        onNotification: (event) {
          if (event.metrics.extentAfter < 300) widget.controller.loadMore();
          return false;
        },
        child: ListView(
          padding: const EdgeInsetsDirectional.fromSTEB(24, 8, 24, 36),
          children: [
            if (state.criteria.hasFilters)
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: ActionChip(
                  label: Text(context.l10n.clearFilters),
                  onPressed: widget.controller.clearFilters,
                ),
              ),
            Padding(
              padding: const EdgeInsetsDirectional.symmetric(vertical: 12),
              child: Text(
                '${state.page.totalCount} doctors',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            ...state.page.results.map(
              (doctor) => Padding(
                padding: const EdgeInsetsDirectional.only(bottom: 14),
                child: DoctorResultCard(
                  doctor: doctor,
                  onProfile: () => _details(doctor.doctorId),
                ),
              ),
            ),
            if (state.loadingMore)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(18),
                  child: CircularProgressIndicator(),
                ),
              ),
            if (state.loadMoreFailed)
              Center(
                child: TextButton(
                  onPressed: widget.controller.retryLoadMore,
                  child: Text(context.l10n.tryAgain),
                ),
              ),
          ],
        ),
      );
  Widget _message(
    IconData icon,
    String title,
    String body,
    VoidCallback? action,
  ) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 52),
          const SizedBox(height: 16),
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(body, textAlign: TextAlign.center),
          if (action != null) ...[
            const SizedBox(height: 20),
            FilledButton(onPressed: action, child: Text(context.l10n.tryAgain)),
          ],
        ],
      ),
    ),
  );
  String _problemTitle(DiscoverProblem problem) => switch (problem) {
    DiscoverProblem.offline => 'You are offline',
    DiscoverProblem.forbidden => 'Doctor discovery is unavailable',
    DiscoverProblem.sessionExpired => 'Your session has expired',
    DiscoverProblem.malformedResponse => 'Doctor information is unavailable',
    DiscoverProblem.backendUnavailable => 'Service temporarily unavailable',
    DiscoverProblem.unknown => 'Something went wrong',
  };
  String _problemBody(DiscoverProblem problem) =>
      problem == DiscoverProblem.sessionExpired
      ? 'Sign in again to discover doctors.'
      : 'Please try again.';
  void _details(String id) => Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) =>
          DoctorDetailsPage(controller: widget.controller, doctorId: id),
    ),
  );
  Future<void> _showFilters() async {
    final state = widget.controller.state;
    final options = switch (state) {
      DiscoverReady(:final options) => options,
      DiscoverEmpty(:final options) => options,
      _ => null,
    };
    if (options == null || !mounted) return;
    var draft = widget.controller.criteria;
    final selected = await showModalBottomSheet<DoctorSearchCriteria>(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheet) => SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  context.l10n.filters,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: draft.specialtyCode,
                  decoration: const InputDecoration(labelText: 'Specialty'),
                  items: options.specialties
                      .map(
                        (item) => DropdownMenuItem(
                          value: item.code,
                          child: Text(item.displayName),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => setSheet(
                    () => draft = draft.copyWith(
                      specialtyCode: value,
                      clearSpecialty: value == null,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: draft.clinicId,
                  decoration: const InputDecoration(labelText: 'Clinic'),
                  items: options.clinics
                      .map(
                        (item) => DropdownMenuItem(
                          value: item.id,
                          child: Text(item.name),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => setSheet(
                    () => draft = draft.copyWith(
                      clinicId: value,
                      clearClinic: value == null,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: draft.language,
                  decoration: const InputDecoration(labelText: 'Language'),
                  items: options.languages
                      .map(
                        (item) =>
                            DropdownMenuItem(value: item, child: Text(item)),
                      )
                      .toList(),
                  onChanged: (value) => setSheet(
                    () => draft = draft.copyWith(
                      language: value,
                      clearLanguage: value == null,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () => Navigator.pop(context, draft),
                  child: const Text('Apply filters'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    if (selected != null) await widget.controller.applyCriteria(selected);
  }
}

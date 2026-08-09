import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../config/theme/app_colors.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/components/feedback/saxlem_state_view.dart';
import '../../../../design_system/components/layout/saxlem_responsive_content.dart';
import '../../../family_profiles/presentation/controllers/patient_profiles_controller.dart';
import '../../domain/entities/doctor_discovery_options.dart';
import '../controllers/discover_controller.dart';
import '../state/discover_state.dart';
import '../widgets/applied_doctor_filters.dart';
import '../widgets/doctor_filters_sheet.dart';
import '../widgets/doctor_result_card.dart';
import 'doctor_details_page.dart';
import '../../../booking/domain/repositories/booking_repository.dart';
import '../../../booking/data/repositories/backend_booking_repository.dart';

class DiscoverPage extends StatefulWidget {
  const DiscoverPage({
    required this.controller,
    this.focusSearch = false,
    this.openFilters = false,
    this.onOpenAppointments,
    this.guestMode = false,
    this.profilesController,
    this.onAuthenticationRequired,
    this.bookingRepository = const UnavailableBookingRepository(),
    super.key,
  });

  final DiscoverController controller;
  final bool focusSearch;
  final bool openFilters;
  final VoidCallback? onOpenAppointments;
  final bool guestMode;
  final PatientProfilesController? profilesController;
  final Future<void> Function()? onAuthenticationRequired;
  final BookingRepository bookingRepository;

  @override
  State<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends State<DiscoverPage> {
  final _search = TextEditingController();
  final _searchFocus = FocusNode();
  final _filterFocus = FocusNode();
  final _resultsFocus = FocusNode();
  final _errorFocus = FocusNode();
  DiscoverState? _previousState;

  @override
  void initState() {
    super.initState();
    _search.text = widget.controller.criteria.query;
    _search.addListener(_onSearchTextChanged);
    widget.controller.addListener(_handleStateFocus);
    if (widget.focusSearch) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _searchFocus.requestFocus();
      });
    }
    if (widget.openFilters) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _showFilters());
    }
  }

  void _handleStateFocus() {
    final next = widget.controller.state;
    final previous = _previousState;
    _previousState = next;
    if (previous is DiscoverLoading || previous is DiscoverLoadingOptions) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        if (next is DiscoverReady || next is DiscoverEmpty) {
          _resultsFocus.requestFocus();
        } else if (next is DiscoverFailure && next.retained == null) {
          _errorFocus.requestFocus();
        }
      });
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_handleStateFocus);
    _search.removeListener(_onSearchTextChanged);
    _search.dispose();
    _searchFocus.dispose();
    _filterFocus.dispose();
    _resultsFocus.dispose();
    _errorFocus.dispose();
    super.dispose();
  }

  void _onSearchTextChanged() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) => ColoredBox(
    color: AppColors.background,
    child: SafeArea(
      child: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, _) => Column(
          children: [
            Flexible(
              flex: 2,
              fit: FlexFit.loose,
              child: SingleChildScrollView(
                child: SaxlemResponsiveContent(
                  child: Padding(
                    padding: const EdgeInsetsDirectional.fromSTEB(0, 18, 0, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Semantics(
                          header: true,
                          child: Text(
                            context.l10n.doctorDiscoveryTitle,
                            style: Theme.of(context).textTheme.headlineSmall
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(context.l10n.doctorDiscoveryInstruction),
                        const SizedBox(height: 18),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: _searchField()),
                            const SizedBox(width: 8),
                            _filterButton(),
                          ],
                        ),
                        if (_optionsFor(widget.controller.state)
                            case final options?)
                          AppliedDoctorFilters(
                            criteria: widget.controller.criteria,
                            options: options,
                            onChanged: widget.controller.applyCriteria,
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Expanded(flex: 5, child: _body(widget.controller.state)),
          ],
        ),
      ),
    ),
  );

  Widget _searchField() => Focus(
    onKeyEvent: (_, event) {
      if (event is KeyDownEvent &&
          event.logicalKey == LogicalKeyboardKey.escape &&
          _search.text.isNotEmpty) {
        _clearSearch();
        return KeyEventResult.handled;
      }
      return KeyEventResult.ignored;
    },
    child: TextField(
      controller: _search,
      focusNode: _searchFocus,
      onChanged: widget.controller.updateQuery,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        labelText: context.l10n.searchDoctorsLabel,
        hintText: context.l10n.searchDoctorsHint,
        prefixIcon: const Icon(Icons.search_rounded),
        suffixIcon: _search.text.isEmpty
            ? null
            : IconButton(
                tooltip: context.l10n.clearSearch,
                onPressed: _clearSearch,
                icon: const Icon(Icons.clear_rounded),
              ),
      ),
    ),
  );

  Widget _filterButton() {
    final enabled = _optionsFor(widget.controller.state) != null;
    return Semantics(
      button: true,
      label: context.l10n.openSearchFilters,
      child: IconButton.filledTonal(
        focusNode: _filterFocus,
        onPressed: enabled ? _showFilters : null,
        tooltip: context.l10n.filters,
        icon: const Icon(Icons.tune_rounded),
      ),
    );
  }

  Widget _body(DiscoverState state) => switch (state) {
    DiscoverInitial() ||
    DiscoverLoadingOptions() ||
    DiscoverLoading() => _loading(context.l10n.loadingDoctors),
    DiscoverAuthenticationRequired() => SaxlemStateView(
      kind: SaxlemStateKind.permissionRequired,
      title: context.l10n.discoveryAuthTitle,
      message: context.l10n.discoveryAuthBody,
      icon: Icons.lock_outline_rounded,
    ),
    DiscoverFailure(:final problem, :final retained) =>
      retained == null
          ? Focus(
              focusNode: _errorFocus,
              child: _problemView(problem, widget.controller.retry),
            )
          : _results(retained, refreshProblem: problem),
    DiscoverEmpty(:final criteria) => Focus(
      focusNode: _resultsFocus,
      child: SaxlemStateView(
        kind: SaxlemStateKind.empty,
        title: context.l10n.noDoctorsTitle,
        message: criteria.hasFilters
            ? context.l10n.noDoctorsFilteredBody
            : context.l10n.noDoctorsBody,
        actionLabel: criteria.hasFilters ? context.l10n.clearFilters : null,
        onAction: criteria.hasFilters ? widget.controller.clearFilters : null,
        icon: Icons.search_off_rounded,
      ),
    ),
    DiscoverReady() => _results(state),
  };

  Widget _loading(String label) => Semantics(
    container: true,
    liveRegion: true,
    label: label,
    child: const Center(child: CircularProgressIndicator()),
  );

  Widget _problemView(DiscoverProblem problem, VoidCallback retry) {
    final values = _problemCopy(problem);
    return SaxlemStateView(
      kind: problem == DiscoverProblem.offline
          ? SaxlemStateKind.offline
          : problem == DiscoverProblem.forbidden ||
                problem == DiscoverProblem.sessionExpired
          ? SaxlemStateKind.permissionRequired
          : SaxlemStateKind.error,
      title: values.$1,
      message: values.$2,
      actionLabel:
          problem == DiscoverProblem.sessionExpired &&
              widget.onAuthenticationRequired != null
          ? context.l10n.verifyNumber
          : context.l10n.tryAgain,
      onAction:
          problem == DiscoverProblem.sessionExpired &&
              widget.onAuthenticationRequired != null
          ? () {
              widget.onAuthenticationRequired!();
            }
          : retry,
    );
  }

  Widget _results(DiscoverReady state, {DiscoverProblem? refreshProblem}) =>
      NotificationListener<ScrollNotification>(
        onNotification: (event) {
          if (event.metrics.extentAfter < 300) widget.controller.loadMore();
          return false;
        },
        child: ListView(
          key: const Key('doctor-results-list'),
          padding: const EdgeInsetsDirectional.fromSTEB(24, 8, 24, 36),
          children: [
            if (refreshProblem != null)
              Padding(
                padding: const EdgeInsetsDirectional.only(bottom: 12),
                child: _problemView(refreshProblem, widget.controller.retry),
              ),
            Focus(
              focusNode: _resultsFocus,
              child: Semantics(
                header: true,
                liveRegion: true,
                child: Padding(
                  padding: const EdgeInsetsDirectional.symmetric(vertical: 12),
                  child: Text(
                    context.l10n.doctorResults(state.page.totalCount),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
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
              Padding(
                padding: const EdgeInsets.all(18),
                child: _loading(context.l10n.loadingMoreDoctors),
              ),
            if (state.loadMoreFailed)
              Semantics(
                liveRegion: true,
                container: true,
                child: Column(
                  children: [
                    Text(
                      context.l10n.loadMoreFailed,
                      textAlign: TextAlign.center,
                    ),
                    TextButton(
                      onPressed: widget.controller.retryLoadMore,
                      child: Text(context.l10n.tryAgain),
                    ),
                  ],
                ),
              ),
          ],
        ),
      );

  (String, String) _problemCopy(DiscoverProblem problem) => switch (problem) {
    DiscoverProblem.offline => (
      context.l10n.offlineTitle,
      context.l10n.offlineBody,
    ),
    DiscoverProblem.forbidden => (
      context.l10n.discoveryForbiddenTitle,
      context.l10n.discoveryForbiddenBody,
    ),
    DiscoverProblem.sessionExpired => (
      context.l10n.sessionExpiredTitle,
      context.l10n.sessionExpiredBody,
    ),
    DiscoverProblem.malformedResponse => (
      context.l10n.malformedDoctorDataTitle,
      context.l10n.malformedDoctorDataBody,
    ),
    DiscoverProblem.backendUnavailable => (
      context.l10n.discoveryUnavailableTitle,
      context.l10n.discoveryUnavailableBody,
    ),
    DiscoverProblem.unknown => (
      context.l10n.discoveryErrorTitle,
      context.l10n.discoveryErrorBody,
    ),
  };

  DoctorDiscoveryOptions? _optionsFor(DiscoverState state) => switch (state) {
    DiscoverReady(:final options) || DiscoverEmpty(:final options) => options,
    DiscoverFailure(retained: DiscoverReady(:final options)) => options,
    _ => null,
  };

  void _clearSearch() {
    _search.clear();
    widget.controller.clearQuery();
    _searchFocus.requestFocus();
  }

  void _details(String id) => Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => DoctorDetailsPage(
        controller: widget.controller,
        doctorId: id,
        onAuthenticationRequired: widget.onAuthenticationRequired,
        bookingRepository: widget.bookingRepository,
        guestMode: widget.guestMode,
        profilesController: widget.profilesController,
      ),
    ),
  );

  Future<void> _showFilters() async {
    final options = _optionsFor(widget.controller.state);
    if (options == null || !mounted) return;
    final selected = await showDoctorFiltersSheet(
      context: context,
      criteria: widget.controller.criteria,
      options: options,
    );
    if (mounted) _filterFocus.requestFocus();
    if (selected != null) await widget.controller.applyCriteria(selected);
  }
}

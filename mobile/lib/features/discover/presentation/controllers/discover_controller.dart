import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../domain/entities/doctor_discovery_options.dart';
import '../../domain/entities/doctor_search_criteria.dart';
import '../../domain/entities/doctor_search_page.dart';
import '../../domain/repositories/doctor_discovery_repository.dart';
import '../state/discover_state.dart';

class DiscoverController extends ChangeNotifier {
  DiscoverController(
    this._repository, {
    required this.guest,
    this.debounceDuration = const Duration(milliseconds: 280),
  });
  final DoctorDiscoveryRepository _repository;
  final bool guest;
  final Duration debounceDuration;
  DiscoverState state = const DiscoverInitial();
  DoctorDetailState detailState = const DoctorDetailInitial();
  DoctorSearchCriteria criteria = const DoctorSearchCriteria();
  DoctorDiscoveryOptions? _options;
  Timer? _debounce;
  int _generation = 0;
  int _detailGeneration = 0;
  bool _disposed = false;
  bool _loadingMore = false;

  Future<void> load({DoctorSearchCriteria? withCriteria}) async {
    if (guest) {
      state = const DiscoverAuthenticationRequired();
      _notify();
      return;
    }
    if (withCriteria != null) criteria = withCriteria;
    final token = ++_generation;
    state = const DiscoverLoadingOptions();
    _notify();
    try {
      final options = await _repository.loadOptions();
      if (!_current(token)) return;
      _options = options;
      criteria = _criteriaSupportedBy(options);
      await _firstPage(token);
    } on DoctorDiscoveryFailure catch (failure) {
      _setFailure(failure, token);
    }
  }

  void updateQuery(String query) {
    criteria = criteria.copyWith(query: query);
    _debounce?.cancel();
    final token = ++_generation;
    _debounce = Timer(debounceDuration, () => _firstPage(token));
  }

  Future<void> clearQuery() => applyCriteria(criteria.copyWith(query: ''));

  Future<void> applyCriteria(DoctorSearchCriteria value) async {
    if (value == criteria) return;
    criteria = value;
    _debounce?.cancel();
    await _firstPage(++_generation);
  }

  Future<void> clearFilters() => applyCriteria(criteria.clearFilters());
  Future<void> retry() => _options == null
      ? load(withCriteria: criteria)
      : _firstPage(++_generation);

  Future<void> _firstPage(int token) async {
    if (guest || _options == null || !_current(token)) return;
    final retained = state is DiscoverReady ? state as DiscoverReady : null;
    state = const DiscoverLoading();
    _notify();
    try {
      final page = await _repository.search(criteria, page: 1);
      if (!_current(token)) return;
      state = page.results.isEmpty
          ? DiscoverEmpty(criteria, _options!)
          : DiscoverReady(page, criteria, _options!);
      _notify();
    } on DoctorDiscoveryFailure catch (failure) {
      _setFailure(failure, token, retained: retained);
    }
  }

  Future<void> loadMore() async {
    final current = state;
    if (current is! DiscoverReady || !current.page.hasMore || _loadingMore) {
      return;
    }
    _loadingMore = true;
    final token = _generation;
    state = DiscoverReady(
      current.page,
      current.criteria,
      current.options,
      loadingMore: true,
    );
    _notify();
    try {
      final next = await _repository.search(
        current.criteria,
        page: current.page.page + 1,
        pageSize: current.page.pageSize,
      );
      if (!_current(token)) return;
      final byId = {
        for (final doctor in current.page.results) doctor.doctorId: doctor,
      };
      for (final doctor in next.results) {
        byId.putIfAbsent(doctor.doctorId, () => doctor);
      }
      state = DiscoverReady(
        DoctorSearchPage(
          results: List.unmodifiable(byId.values),
          page: next.page,
          pageSize: next.pageSize,
          totalCount: next.totalCount,
          totalPages: next.totalPages,
        ),
        current.criteria,
        current.options,
      );
    } on DoctorDiscoveryFailure {
      if (_current(token)) {
        state = DiscoverReady(
          current.page,
          current.criteria,
          current.options,
          loadMoreFailed: true,
        );
      }
    } finally {
      _loadingMore = false;
      _notify();
    }
  }

  Future<void> retryLoadMore() => loadMore();
  Future<void> loadDoctor(String id) async {
    if (guest || !_uuid.hasMatch(id)) {
      detailState = guest
          ? const DoctorDetailFailure(DiscoverProblem.sessionExpired)
          : const DoctorDetailNotFound();
      _notify();
      return;
    }
    final token = ++_detailGeneration;
    detailState = const DoctorDetailLoading();
    _notify();
    try {
      final doctor = await _repository.loadDoctor(id);
      if (_detailCurrent(token)) detailState = DoctorDetailReady(doctor);
    } on DoctorDiscoveryFailure catch (failure) {
      if (_detailCurrent(token)) {
        detailState = failure.type == DoctorDiscoveryFailureType.notFound
            ? const DoctorDetailNotFound()
            : DoctorDetailFailure(_problem(failure));
      }
    }
    _notify();
  }

  void clearAuthoritativeData() {
    _debounce?.cancel();
    ++_generation;
    ++_detailGeneration;
    _options = null;
    state = guest
        ? const DiscoverAuthenticationRequired()
        : const DiscoverInitial();
    detailState = const DoctorDetailInitial();
    _notify();
  }

  void _setFailure(
    DoctorDiscoveryFailure failure,
    int token, {
    DiscoverReady? retained,
  }) {
    if (!_current(token)) return;
    if (failure.type == DoctorDiscoveryFailureType.unauthenticated) {
      _options = null;
      detailState = const DoctorDetailInitial();
      retained = null;
    }
    state = DiscoverFailure(_problem(failure), retained: retained);
    _notify();
  }

  DiscoverProblem _problem(DoctorDiscoveryFailure failure) =>
      switch (failure.type) {
        DoctorDiscoveryFailureType.offline ||
        DoctorDiscoveryFailureType.timeout => DiscoverProblem.offline,
        DoctorDiscoveryFailureType.forbidden => DiscoverProblem.forbidden,
        DoctorDiscoveryFailureType.unauthenticated =>
          DiscoverProblem.sessionExpired,
        DoctorDiscoveryFailureType.malformedResponse =>
          DiscoverProblem.malformedResponse,
        DoctorDiscoveryFailureType.unavailable ||
        DoctorDiscoveryFailureType.rateLimited =>
          DiscoverProblem.backendUnavailable,
        _ => DiscoverProblem.unknown,
      };

  DoctorSearchCriteria _criteriaSupportedBy(DoctorDiscoveryOptions options) {
    final specialty = criteria.specialtyCode;
    final clinic = criteria.clinicId;
    final language = criteria.language;
    final gender = criteria.gender;
    final experience = criteria.minimumYearsOfExperience;
    return criteria.copyWith(
      clearSpecialty:
          specialty != null &&
          !options.specialties.any((item) => item.code == specialty),
      clearClinic:
          clinic != null && !options.clinics.any((item) => item.id == clinic),
      clearLanguage: language != null && !options.languages.contains(language),
      clearGender: gender != null && !options.genders.contains(gender),
      clearExperience:
          experience != null &&
          (options.minimumExperience == null ||
              experience < options.minimumExperience! ||
              experience > options.maximumExperience!),
    );
  }

  bool _current(int token) => !_disposed && token == _generation;
  bool _detailCurrent(int token) => !_disposed && token == _detailGeneration;
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _debounce?.cancel();
    ++_generation;
    ++_detailGeneration;
    super.dispose();
  }
}

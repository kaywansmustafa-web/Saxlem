import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../data/data_sources/mock_doctor_discovery_data_source.dart';
import '../../domain/entities/discovery_types.dart';
import '../../domain/entities/doctor_search_criteria.dart';
import '../../domain/entities/doctor_search_page.dart';
import '../../domain/repositories/doctor_discovery_repository.dart';
import '../../domain/use_cases/search_doctors.dart';
import '../../domain/use_cases/toggle_my_doctor.dart';
import '../state/discover_state.dart';

class DiscoverController extends ChangeNotifier {
  DiscoverController(this._search, this._toggle, this._repository);
  final SearchDoctors _search;
  final ToggleMyDoctor _toggle;
  final DoctorDiscoveryRepository _repository;
  DiscoverState state = const DiscoverInitial();
  DoctorSearchCriteria criteria = const DoctorSearchCriteria();
  Timer? _debounce;
  int _request = 0;
  bool _disposed = false;
  List<String> get recentSearches => _repository.recentSearches();

  Future<void> load({DoctorSearchCriteria? withCriteria}) async {
    if (withCriteria != null) criteria = withCriteria;
    await _run();
  }

  void updateQuery(String query) {
    criteria = criteria.copyWith(query: query);
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 280), _run);
  }

  Future<void> applyCriteria(DoctorSearchCriteria value) async {
    criteria = value;
    await _run();
  }

  Future<void> sort(DiscoverySort value) =>
      applyCriteria(criteria.copyWith(sort: value));
  Future<void> clearFilters() => applyCriteria(criteria.clearFilters());
  Future<void> retry() => _run();

  Future<void> _run() async {
    final request = ++_request;
    state = const DiscoverLoading();
    _notify();
    try {
      final page = await _search(criteria);
      if (request != _request || _disposed) return;
      if (criteria.query.trim().isNotEmpty) {
        _repository.saveRecentSearch(criteria.query);
      }
      state = page.results.isEmpty
          ? DiscoverEmpty(criteria, filtered: criteria.hasFilters)
          : DiscoverResults(page, criteria);
    } on DiscoveryOfflineException {
      state = const DiscoverOffline();
    } catch (_) {
      state = const DiscoverFailure(
        'We could not load doctors. Please try again.',
      );
    }
    _notify();
  }

  Future<void> loadMore() async {
    final current = state;
    if (current is! DiscoverResults ||
        !current.page.hasMore ||
        current.loadingMore) {
      return;
    }
    state = DiscoverResults(current.page, criteria, loadingMore: true);
    _notify();
    final next = await _search(criteria, offset: current.page.results.length);
    state = DiscoverResults(
      DoctorSearchPage(
        results: [...current.page.results, ...next.results],
        totalCount: next.totalCount,
        hasMore: next.hasMore,
        updatedAt: next.updatedAt,
        stale: next.stale,
      ),
      criteria,
    );
    _notify();
  }

  Future<void> toggleMyDoctor(String id) async {
    final current = state;
    if (current is! DiscoverResults) return;
    final selected = await _toggle(id);
    final updated = current.page.results
        .map((d) => d.doctorId == id ? d.copyWith(isInMyDoctors: selected) : d)
        .toList();
    state = DiscoverResults(
      DoctorSearchPage(
        results: updated,
        totalCount: current.page.totalCount,
        hasMore: current.page.hasMore,
        updatedAt: current.page.updatedAt,
        stale: current.page.stale,
      ),
      criteria,
    );
    _notify();
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _debounce?.cancel();
    super.dispose();
  }
}

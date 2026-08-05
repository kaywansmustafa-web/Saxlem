import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_discovery_options.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_discovery_result.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_search_criteria.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_search_page.dart';
import 'package:saxlem_app/features/discover/domain/repositories/doctor_discovery_repository.dart';
import 'package:saxlem_app/features/discover/presentation/controllers/discover_controller.dart';
import 'package:saxlem_app/features/discover/presentation/state/discover_state.dart';

void main() {
  test('guest discovery is honest and never calls repository', () async {
    final repository = _FakeRepository();
    final controller = DiscoverController(repository, guest: true);
    await controller.load();
    expect(controller.state, isA<DiscoverAuthenticationRequired>());
    expect(repository.calls, 0);
  });

  test('numbered pagination deduplicates and stops at total pages', () async {
    final repository = _FakeRepository(
      pages: {
        1: _page(
          1,
          [_doctor('00000000-0000-4000-8000-000000000001')],
          total: 2,
          totalPages: 2,
        ),
        2: _page(
          2,
          [
            _doctor('00000000-0000-4000-8000-000000000001'),
            _doctor('00000000-0000-4000-8000-000000000002'),
          ],
          total: 2,
          totalPages: 2,
        ),
      },
    );
    final controller = DiscoverController(repository, guest: false);
    await controller.load();
    await controller.loadMore();
    final state = controller.state as DiscoverReady;
    expect(state.page.page, 2);
    expect(state.page.results.map((d) => d.doctorId), hasLength(2));
    expect(state.page.hasMore, isFalse);
  });

  test(
    'load-more failure retains authoritative first page and retries',
    () async {
      final repository = _FakeRepository(
        pages: {
          1: _page(
            1,
            [_doctor('00000000-0000-4000-8000-000000000001')],
            total: 2,
            totalPages: 2,
          ),
        },
        failPageOnce: 2,
      );
      final controller = DiscoverController(repository, guest: false);
      await controller.load();
      await controller.loadMore();
      expect((controller.state as DiscoverReady).loadMoreFailed, isTrue);
      expect((controller.state as DiscoverReady).page.results, hasLength(1));
      repository.pages[2] = _page(
        2,
        [_doctor('00000000-0000-4000-8000-000000000002')],
        total: 2,
        totalPages: 2,
      );
      await controller.retryLoadMore();
      expect((controller.state as DiscoverReady).page.results, hasLength(2));
    },
  );

  test('slower stale search response cannot overwrite newer query', () async {
    final first = Completer<DoctorSearchPage>();
    final repository = _FakeRepository(
      searchCompleters: [first, Completer<DoctorSearchPage>()],
    );
    final controller = DiscoverController(
      repository,
      guest: false,
      debounceDuration: Duration.zero,
    );
    final load = controller.load();
    await Future<void>.delayed(Duration.zero);
    controller.updateQuery('new');
    await Future<void>.delayed(Duration.zero);
    repository.searchCompleters[1].complete(
      _page(
        1,
        [_doctor('00000000-0000-4000-8000-000000000002')],
        total: 1,
        totalPages: 1,
      ),
    );
    await Future<void>.delayed(Duration.zero);
    first.complete(
      _page(
        1,
        [_doctor('00000000-0000-4000-8000-000000000001')],
        total: 1,
        totalPages: 1,
      ),
    );
    await load;
    expect(
      ((controller.state as DiscoverReady).page.results.single).doctorId,
      endsWith('2'),
    );
  });

  test('clearing authoritative data invalidates late responses', () async {
    final pending = Completer<DoctorSearchPage>();
    final controller = DiscoverController(
      _FakeRepository(searchCompleters: [pending]),
      guest: false,
    );
    final load = controller.load();
    await Future<void>.delayed(Duration.zero);
    controller.clearAuthoritativeData();
    pending.complete(
      _page(
        1,
        [_doctor('00000000-0000-4000-8000-000000000001')],
        total: 1,
        totalPages: 1,
      ),
    );
    await load;
    expect(controller.state, isA<DiscoverInitial>());
  });

  test('invalid detail UUID is rejected before repository access', () async {
    final repository = _FakeRepository();
    final controller = DiscoverController(repository, guest: false);

    await controller.loadDoctor('not-a-doctor-id');

    expect(controller.detailState, isA<DoctorDetailNotFound>());
    expect(repository.detailCalls, 0);
  });

  test('stale doctor detail cannot replace a newer selection', () async {
    final first = Completer<DoctorDiscoveryResult>();
    final second = Completer<DoctorDiscoveryResult>();
    final repository = _FakeRepository(detailCompleters: [first, second]);
    final controller = DiscoverController(repository, guest: false);

    final older = controller.loadDoctor('00000000-0000-4000-8000-000000000001');
    final newer = controller.loadDoctor('00000000-0000-4000-8000-000000000002');
    second.complete(_doctor('00000000-0000-4000-8000-000000000002'));
    await newer;
    first.complete(_doctor('00000000-0000-4000-8000-000000000001'));
    await older;

    expect(
      (controller.detailState as DoctorDetailReady).doctor.doctorId,
      endsWith('2'),
    );
  });

  test('unsupported and out-of-range initial filters are removed', () async {
    final repository = _FakeRepository(
      options: const DoctorDiscoveryOptions(
        specialties: [
          DoctorSpecialtyOption(code: 'cardiology', displayName: 'Cardiology'),
        ],
        clinics: [],
        languages: ['english'],
        genders: [BackendDoctorGender.female],
        minimumExperience: 3,
        maximumExperience: 15,
      ),
    );
    final controller = DiscoverController(repository, guest: false);

    await controller.load(
      withCriteria: const DoctorSearchCriteria(
        specialtyCode: 'unsupported',
        clinicId: '00000000-0000-4000-8000-000000000099',
        language: 'arabic',
        gender: BackendDoctorGender.male,
        minimumYearsOfExperience: 20,
      ),
    );

    expect(controller.criteria.hasFilters, isFalse);
  });
}

class _FakeRepository implements DoctorDiscoveryRepository {
  _FakeRepository({
    Map<int, DoctorSearchPage>? pages,
    this.failPageOnce,
    List<Completer<DoctorSearchPage>>? searchCompleters,
    List<Completer<DoctorDiscoveryResult>>? detailCompleters,
    this.options = _options,
  }) : pages = pages ?? {},
       searchCompleters = searchCompleters ?? [],
       detailCompleters = detailCompleters ?? [];
  final Map<int, DoctorSearchPage> pages;
  int? failPageOnce;
  final List<Completer<DoctorSearchPage>> searchCompleters;
  final List<Completer<DoctorDiscoveryResult>> detailCompleters;
  final DoctorDiscoveryOptions options;
  int calls = 0;
  int detailCalls = 0;
  int _searchIndex = 0;
  int _detailIndex = 0;
  @override
  Future<DoctorDiscoveryOptions> loadOptions() async {
    calls++;
    return options;
  }

  @override
  Future<DoctorSearchPage> search(
    DoctorSearchCriteria criteria, {
    required int page,
    int pageSize = 20,
  }) async {
    calls++;
    if (_searchIndex < searchCompleters.length) {
      return searchCompleters[_searchIndex++].future;
    }
    if (failPageOnce == page) {
      failPageOnce = null;
      throw const DoctorDiscoveryFailure(DoctorDiscoveryFailureType.offline);
    }
    return pages[page] ?? _page(page, const [], total: 0, totalPages: 0);
  }

  @override
  Future<DoctorDiscoveryResult> loadDoctor(String doctorId) async {
    detailCalls++;
    if (_detailIndex < detailCompleters.length) {
      return detailCompleters[_detailIndex++].future;
    }
    return _doctor(doctorId);
  }
}

const _options = DoctorDiscoveryOptions(
  specialties: [],
  clinics: [],
  languages: [],
  genders: [],
  minimumExperience: null,
  maximumExperience: null,
);
DoctorSearchPage _page(
  int page,
  List<DoctorDiscoveryResult> values, {
  required int total,
  required int totalPages,
}) => DoctorSearchPage(
  results: values,
  page: page,
  pageSize: 20,
  totalCount: total,
  totalPages: totalPages,
);
DoctorDiscoveryResult _doctor(String id) => DoctorDiscoveryResult(
  doctorId: id,
  doctorDisplayName: 'Dr Test',
  fullName: 'Dr Test',
  primarySpecialtyDisplayName: 'Cardiology',
  gender: BackendDoctorGender.unspecified,
  status: BackendDoctorStatus.active,
  yearsOfExperience: 10,
  languages: const ['english'],
  clinics: const [
    DoctorClinicReference(
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Clinic',
    ),
  ],
  availability: const DoctorAvailabilityFoundation(
    status: DoctorAvailabilityStatus.available,
    acceptingNewPatients: true,
    nextAvailableAt: null,
    updatedAt: null,
  ),
);

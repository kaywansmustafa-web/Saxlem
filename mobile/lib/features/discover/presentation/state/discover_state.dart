import '../../domain/entities/doctor_discovery_options.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../../domain/entities/doctor_search_criteria.dart';
import '../../domain/entities/doctor_search_page.dart';

sealed class DiscoverState {
  const DiscoverState();
}

class DiscoverInitial extends DiscoverState {
  const DiscoverInitial();
}

class DiscoverAuthenticationRequired extends DiscoverState {
  const DiscoverAuthenticationRequired();
}

class DiscoverLoadingOptions extends DiscoverState {
  const DiscoverLoadingOptions();
}

class DiscoverLoading extends DiscoverState {
  const DiscoverLoading();
}

class DiscoverReady extends DiscoverState {
  const DiscoverReady(
    this.page,
    this.criteria,
    this.options, {
    this.loadingMore = false,
    this.loadMoreFailed = false,
  });
  final DoctorSearchPage page;
  final DoctorSearchCriteria criteria;
  final DoctorDiscoveryOptions options;
  final bool loadingMore;
  final bool loadMoreFailed;
}

class DiscoverEmpty extends DiscoverState {
  const DiscoverEmpty(this.criteria, this.options);
  final DoctorSearchCriteria criteria;
  final DoctorDiscoveryOptions options;
}

enum DiscoverProblem {
  offline,
  forbidden,
  sessionExpired,
  malformedResponse,
  backendUnavailable,
  unknown,
}

class DiscoverFailure extends DiscoverState {
  const DiscoverFailure(this.problem, {this.retained});
  final DiscoverProblem problem;
  final DiscoverReady? retained;
}

sealed class DoctorDetailState {
  const DoctorDetailState();
}

class DoctorDetailInitial extends DoctorDetailState {
  const DoctorDetailInitial();
}

class DoctorDetailLoading extends DoctorDetailState {
  const DoctorDetailLoading();
}

class DoctorDetailReady extends DoctorDetailState {
  const DoctorDetailReady(this.doctor);
  final DoctorDiscoveryResult doctor;
}

class DoctorDetailNotFound extends DoctorDetailState {
  const DoctorDetailNotFound();
}

class DoctorDetailFailure extends DoctorDetailState {
  const DoctorDetailFailure(this.problem);
  final DiscoverProblem problem;
}

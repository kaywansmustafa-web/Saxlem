import '../../domain/entities/doctor_search_criteria.dart';
import '../../domain/entities/doctor_search_page.dart';

sealed class DiscoverState {
  const DiscoverState();
}

class DiscoverInitial extends DiscoverState {
  const DiscoverInitial();
}

class DiscoverLoading extends DiscoverState {
  const DiscoverLoading();
}

class DiscoverResults extends DiscoverState {
  const DiscoverResults(this.page, this.criteria, {this.loadingMore = false});
  final DoctorSearchPage page;
  final DoctorSearchCriteria criteria;
  final bool loadingMore;
}

class DiscoverEmpty extends DiscoverState {
  const DiscoverEmpty(this.criteria, {required this.filtered});
  final DoctorSearchCriteria criteria;
  final bool filtered;
}

class DiscoverOffline extends DiscoverState {
  const DiscoverOffline();
}

class DiscoverFailure extends DiscoverState {
  const DiscoverFailure(this.message);
  final String message;
}

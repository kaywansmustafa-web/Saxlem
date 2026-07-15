import 'dart:async';
import '../../domain/entities/notification_snapshot.dart';
import '../../domain/entities/patient_notification.dart';
import '../../domain/entities/notification_types.dart';
import '../../domain/repositories/notifications_repository.dart';
import '../data_sources/mock_notifications_data_source.dart';
import '../mappers/patient_notification_mapper.dart';
import '../../../../core/models/patient_profile.dart';

class InMemoryNotificationsRepository implements NotificationsRepository {
  InMemoryNotificationsRepository(this._source, this._mapper);
  final MockNotificationsDataSource _source;
  final PatientNotificationMapper _mapper;
  final _changes = StreamController<NotificationSnapshot>.broadcast();
  List<PatientNotification>? _items;

  @override
  Future<NotificationSnapshot> load([
    PatientProfileId profileId = PatientProfileId.me,
  ]) async {
    _items ??= (await _source.load()).map(_mapper.map).toList();
    return _for(profileId);
  }

  @override
  Stream<NotificationSnapshot> watch([
    PatientProfileId profileId = PatientProfileId.me,
  ]) => _changes.stream.map((_) => _for(profileId));
  NotificationSnapshot _for(PatientProfileId id) => NotificationSnapshot(
    notifications: _items!.where(
      (e) => e.profileId == null || e.profileId == id,
    ),
  );
  @override
  Future<PatientNotification?> get(NotificationId id) async =>
      (await load()).notifications.where((e) => e.id == id).firstOrNull;
  @override
  Future<void> markRead(NotificationId id) async {
    await load();
    _items = _items!.map((e) => e.id == id ? e.markRead() : e).toList();
    _changes.add(_snapshot);
  }

  @override
  Future<void> delete(NotificationId id) async {
    await load();
    final item = await get(id);
    if (item?.priority == NotificationPriority.critical) return;
    _items!.removeWhere((e) => e.id == id);
    _changes.add(_snapshot);
  }

  NotificationSnapshot get _snapshot =>
      NotificationSnapshot(notifications: _items!);
  @override
  Future<void> dispose() => _changes.close();
}

import 'dart:convert';
import '../../domain/entities/notification_page.dart';
import '../../domain/repositories/authoritative_notifications_repository.dart';
import '../dto/backend_notification_dto.dart';

class NotificationSseParser {
  const NotificationSseParser();
  static const maximumLineBytes = 8192, maximumDataBytes = 65536;
  Stream<NotificationSignal> parse(Stream<List<int>> bytes) async* {
    var id = '', event = '', data = <String>[];
    var dataBytes = 0;
    await for (final line
        in bytes
            .map<List<int>>((chunk) => chunk)
            .transform(utf8.decoder)
            .transform(const LineSplitter())) {
      if (utf8.encode(line).length > maximumLineBytes)
        throw const NotificationFailure(NotificationProblem.malformed);
      if (line.isEmpty) {
        if (data.isNotEmpty) {
          if (event.isEmpty || event == 'notification') {
            if (!RegExp(r'^[1-9]\d{0,18}$').hasMatch(id))
              throw const NotificationFailure(NotificationProblem.malformed);
            try {
              final decoded = jsonDecode(data.join('\n'));
              if (decoded is! Map<String, dynamic>)
                throw const FormatException();
              final notification = BackendNotificationDto.parse(decoded);
              if (notification.deliverySequence != id)
                throw const FormatException();
              yield NotificationSignal(
                deliverySequence: id,
                notification: notification,
              );
            } catch (_) {
              throw const NotificationFailure(NotificationProblem.malformed);
            }
          }
        }
        id = '';
        event = '';
        data = <String>[];
        dataBytes = 0;
        continue;
      }
      if (line.startsWith(':')) continue;
      final separator = line.indexOf(':');
      final field = separator < 0 ? line : line.substring(0, separator);
      var value = separator < 0 ? '' : line.substring(separator + 1);
      if (value.startsWith(' ')) value = value.substring(1);
      switch (field) {
        case 'id':
          id = value;
        case 'event':
          event = value;
        case 'data':
          dataBytes += utf8.encode(value).length;
          if (dataBytes > maximumDataBytes)
            throw const NotificationFailure(NotificationProblem.malformed);
          data.add(value);
      }
    }
  }
}

// ignore_for_file: curly_braces_in_flow_control_structures

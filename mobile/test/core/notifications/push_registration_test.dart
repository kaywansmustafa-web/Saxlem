import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/notifications/push_messaging.dart';
import 'package:saxlem_app/core/notifications/push_registration.dart';

class _Phone implements PushTokenProvider {
  _Phone({this.allowed = true});
  final bool allowed;
  final _registered = StreamController<String>.broadcast();
  int registers = 0, unregisters = 0;
  @override
  Future<bool> requestPermission() async => allowed;
  @override
  Stream<String> get registrations => _registered.stream;
  @override
  Future<void> register() async {
    registers++;
    // Firebase answers on the stream, as on a device.
    scheduleMicrotask(() => _registered.add('fid-aaaaaaaaaaaaaaaaaaaaaa'));
  }

  void rotate(String fid) => _registered.add(fid);
  @override
  Future<void> unregister() async => unregisters++;
}

class _Server implements PushDevicesSource {
  final registered = <String>[];
  final removed = <String>[];
  bool fail = false;
  @override
  Future<void> registerPushDevice({
    required String token,
    required String platform,
    required String locale,
  }) async {
    if (fail) throw Exception('offline');
    registered.add('$token|$platform|$locale');
  }

  @override
  Future<void> removePushDevice(String token) async => removed.add(token);
}

Future<void> _settle() => Future<void>.delayed(Duration.zero);

void main() {
  test('registers the phone in its language and follows changes', () async {
    final phone = _Phone(), server = _Server();
    final push = PushRegistration(
      provider: phone,
      devices: server,
      platform: 'android',
    );
    await push.start('ku');
    await _settle();
    expect(server.registered, ['fid-aaaaaaaaaaaaaaaaaaaaaa|android|ku']);

    await push.setLocale('ar');
    expect(server.registered.last, 'fid-aaaaaaaaaaaaaaaaaaaaaa|android|ar');

    phone.rotate('fid-bbbbbbbbbbbbbbbbbbbbbb');
    await _settle();
    expect(server.registered.last, 'fid-bbbbbbbbbbbbbbbbbbbbbb|android|ar');

    // Starting again (Home rebuilt) does not register twice.
    await push.start('ar');
    expect(phone.registers, 1);

    await push.stop();
    expect(server.removed, ['fid-bbbbbbbbbbbbbbbbbbbbbb']);
    expect(phone.unregisters, 1);
  });

  test('nothing is sent when the person says no to notifications', () async {
    final server = _Server();
    await PushRegistration(
      provider: _Phone(allowed: false),
      devices: server,
      platform: 'ios',
    ).start('en');
    await _settle();
    expect(server.registered, isEmpty);
  });

  test('a server failure never reaches the person', () async {
    final server = _Server()..fail = true;
    final push = PushRegistration(
      provider: _Phone(),
      devices: server,
      platform: 'ios',
    );
    await push.start('en');
    await _settle();
    await push.setLocale('ar');
    expect(server.registered, isEmpty);
  });

  test('a tapped push only keeps what it can trust', () {
    final tap = PushTap.fromData({
      'type': 'queue.patient.called',
      'appointmentId': '01a1e0f5-05cb-713b-a70f-946f28664cd3',
    })!;
    expect(tap.type, 'queue.patient.called');
    expect(tap.appointmentId, '01a1e0f5-05cb-713b-a70f-946f28664cd3');
    expect(
      PushTap.fromData({
        'type': 'x',
        'appointmentId': '../../etc',
      })!.appointmentId,
      isNull,
    );
    expect(PushTap.fromData({}), isNull);
  });

  test('without Firebase settings push is off and harmless', () async {
    expect(PushMessaging.instance.enabled, isFalse);
    expect(await PushMessaging.instance.initialTap(), isNull);
    await PushMessaging.instance.stop();
  });
}

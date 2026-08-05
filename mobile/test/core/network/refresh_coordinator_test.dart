import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/network/refresh_coordinator.dart';

void main() {
  test('concurrent callers share one successful refresh result', () async {
    final coordinator = RefreshCoordinator<String>();
    final completer = Completer<String>();
    var calls = 0;
    Future<String> refresh() {
      calls++;
      return completer.future;
    }

    final first = coordinator.run(refresh);
    final second = coordinator.run(refresh);
    final third = coordinator.run(refresh);
    completer.complete('refreshed');

    expect(await Future.wait([first, second, third]), [
      'refreshed',
      'refreshed',
      'refreshed',
    ]);
    expect(calls, 1);
  });

  test('concurrent callers share one deterministic failure', () async {
    final coordinator = RefreshCoordinator<String>();
    final completer = Completer<String>();
    var calls = 0;
    Future<String> refresh() {
      calls++;
      return completer.future;
    }

    final first = coordinator.run(refresh);
    final second = coordinator.run(refresh);
    completer.completeError(StateError('redacted'));

    await expectLater(first, throwsStateError);
    await expectLater(second, throwsStateError);
    expect(calls, 1);
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/live_queue/presentation/controllers/live_queue_controller.dart';
import 'package:saxlem_app/features/live_queue/presentation/state/live_queue_state.dart';
import '../live_queue_test_helpers.dart';

void main() {
  test('loads authoritative queue by appointment id and refreshes', () async {
    final repo = FakeQueueRepository(queueStatus());
    final controller = LiveQueueController(
      appointmentId: '11111111-1111-4111-8111-111111111111',
      repository: repo,
    );
    await controller.load();
    expect(controller.state, isA<LiveQueueReady>());
    await controller.load();
    expect(repo.calls, 2);
    controller.dispose();
  });
}

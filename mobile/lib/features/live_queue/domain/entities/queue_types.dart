enum PatientQueueStatus {
  expected,
  onTheWay,
  checkedIn,
  ready,
  called,
  completed,
}

enum QueueSessionStatus { open, paused, closed }

enum QueueEstimateConfidence { high, medium, low }

enum PatientQueueAction { onMyWay, arrived, runningLate, cancel, requestHelp }

enum QueueConnectionStatus { connected, reconnecting, stale, offline }

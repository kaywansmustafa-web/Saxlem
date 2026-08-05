class RefreshCoordinator<T> {
  Future<T>? _activeRefresh;

  Future<T> run(Future<T> Function() refresh) {
    final active = _activeRefresh;
    if (active != null) return active;
    final future = refresh();
    _activeRefresh = future;
    return future.whenComplete(() {
      if (identical(_activeRefresh, future)) _activeRefresh = null;
    });
  }
}

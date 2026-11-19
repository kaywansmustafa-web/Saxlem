import 'package:flutter/widgets.dart';
import 'domain/payments_repository.dart';

/// Makes the payments repository available to booking and appointment screens.
class PaymentsScope extends InheritedWidget {
  const PaymentsScope({
    required this.repository,
    required super.child,
    super.key,
  });
  final PaymentsRepository repository;

  static PaymentsRepository of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<PaymentsScope>()?.repository ??
      const UnavailablePaymentsRepository();

  /// For initState: reads without subscribing to changes.
  static PaymentsRepository read(BuildContext context) =>
      context.getInheritedWidgetOfExactType<PaymentsScope>()?.repository ??
      const UnavailablePaymentsRepository();

  @override
  bool updateShouldNotify(PaymentsScope oldWidget) =>
      repository != oldWidget.repository;
}

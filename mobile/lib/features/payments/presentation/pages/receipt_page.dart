import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../core/formatting/clinic_format.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/payments_repository.dart';
import '../../domain/receipt.dart';
import '../payment_copy.dart';
import '../receipt_copy.dart';

/// One receipt: what was paid, when, how, to whom, and for which visit.
/// Pass [receipt] when it is at hand, or [source] and [appointmentId] to load.
class ReceiptDetailsPage extends StatefulWidget {
  const ReceiptDetailsPage({
    this.receipt,
    this.source,
    this.appointmentId,
    super.key,
  }) : assert(receipt != null || (source != null && appointmentId != null));
  final Receipt? receipt;
  final ReceiptsSource? source;
  final String? appointmentId;

  @override
  State<ReceiptDetailsPage> createState() => _ReceiptDetailsPageState();
}

class _ReceiptDetailsPageState extends State<ReceiptDetailsPage> {
  Receipt? _receipt;
  PaymentProblem? _problem;

  @override
  void initState() {
    super.initState();
    _receipt = widget.receipt;
    if (_receipt == null) _load();
  }

  Future<void> _load() async {
    setState(() => _problem = null);
    try {
      final receipt = await widget.source!.receipt(widget.appointmentId!);
      if (mounted) setState(() => _receipt = receipt);
    } on PaymentFailure catch (failure) {
      if (mounted) setState(() => _problem = failure.problem);
    }
  }

  Future<void> _copy(Receipt receipt) async {
    final messenger = ScaffoldMessenger.of(context);
    final copied = context.l10n.receiptCopied;
    await Clipboard.setData(ClipboardData(text: receiptText(context, receipt)));
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(copied)));
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    final receipt = _receipt;
    return Scaffold(
      appBar: AppBar(title: Text(strings.receiptTitle)),
      body: SaxlemAuraBackdrop(
        strength: .5,
        child: SafeArea(
          top: false,
          child: switch ((receipt, _problem)) {
            (final Receipt r, _) => ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              children: [
                ReceiptCard(receipt: r),
                const SizedBox(height: 16),
                SaxlemButton(
                  label: strings.receiptCopy,
                  leadingIcon: Icons.copy_rounded,
                  hierarchy: SaxlemButtonHierarchy.secondary,
                  expand: true,
                  onPressed: () => _copy(r),
                ),
              ],
            ),
            (null, final PaymentProblem problem) => SaxlemStateView(
              kind: problem == PaymentProblem.offline
                  ? SaxlemStateKind.offline
                  : SaxlemStateKind.error,
              title: strings.receiptFailed,
              message: paymentProblemCopy(context, problem),
              actionLabel: strings.tryAgain,
              onAction: _load,
            ),
            _ => const Center(child: CircularProgressIndicator()),
          },
        ),
      ),
    );
  }
}

class ReceiptCard extends StatelessWidget {
  const ReceiptCard({required this.receipt, super.key});
  final Receipt receipt;

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    return SaxlemCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  strings.receiptAmount,
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
              ),
              SaxlemStatusPill(
                label: paymentStatusText(context, receipt.status),
                tone: paymentStatusTone(receipt.status),
                icon: paymentStatusIcon(receipt.status),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            strings.iqdAmount(ClinicFormat.number(receipt.amountIqd)),
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w800,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 16),
          Divider(height: 1, color: colors.divider),
          const SizedBox(height: 8),
          for (final (:label, :value, :code) in receiptLines(context, receipt))
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 7),
              child: MergeSemantics(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 116,
                      child: Text(
                        label,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colors.textSecondary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SelectableText(
                        // Isolated left to right, so "+964 750 …" keeps its
                        // order inside Arabic and Kurdish text.
                        code ? '\u2066$value\u2069' : value,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

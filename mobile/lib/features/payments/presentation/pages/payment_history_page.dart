import 'package:flutter/material.dart';

import '../../../../core/formatting/clinic_format.dart';
import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../../domain/appointment_payment.dart';
import '../../domain/payments_repository.dart';
import '../../domain/receipt.dart';
import '../payment_copy.dart';
import 'receipt_page.dart';

/// Profile → Payments & receipts: every visit the account paid for, newest
/// first, grouped by month.
class PaymentHistoryPage extends StatefulWidget {
  const PaymentHistoryPage({required this.source, super.key});
  final ReceiptsSource source;

  @override
  State<PaymentHistoryPage> createState() => _PaymentHistoryPageState();
}

class _PaymentHistoryPageState extends State<PaymentHistoryPage> {
  final _items = <Receipt>[];
  String? _next;
  bool _loading = true, _loadingMore = false, _moreFailed = false;
  PaymentProblem? _problem;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _problem = null;
    });
    try {
      final page = await widget.source.receipts();
      if (!mounted) return;
      setState(() {
        _items
          ..clear()
          ..addAll(page.items);
        _next = page.nextCursor;
      });
    } on PaymentFailure catch (failure) {
      if (mounted) setState(() => _problem = failure.problem);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _more() async {
    final cursor = _next;
    if (cursor == null || _loadingMore) return;
    setState(() {
      _loadingMore = true;
      _moreFailed = false;
    });
    try {
      final page = await widget.source.receipts(cursor: cursor);
      if (!mounted) return;
      setState(() {
        final seen = {for (final item in _items) item.id};
        _items.addAll(page.items.where((item) => !seen.contains(item.id)));
        _next = page.nextCursor;
      });
    } on PaymentFailure {
      if (mounted) setState(() => _moreFailed = true);
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(strings.receiptsTitle)),
      body: SaxlemAuraBackdrop(
        strength: .5,
        child: SafeArea(top: false, child: _body(context)),
      ),
    );
  }

  Widget _body(BuildContext context) {
    final strings = context.l10n;
    if (_loading && _items.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_problem case final problem?) {
      return SaxlemStateView(
        kind: problem == PaymentProblem.offline
            ? SaxlemStateKind.offline
            : SaxlemStateKind.error,
        title: strings.receiptsFailed,
        message: paymentProblemCopy(context, problem),
        actionLabel: strings.tryAgain,
        onAction: _load,
      );
    }
    if (_items.isEmpty) {
      return SaxlemStateView(
        kind: SaxlemStateKind.empty,
        icon: Icons.receipt_long_rounded,
        title: strings.receiptsEmptyTitle,
        message: strings.receiptsEmptyBody,
      );
    }
    final language = Localizations.localeOf(context).languageCode;
    final rows = <Widget>[];
    String? month;
    for (final item in _items) {
      final at = ClinicFormat.atClinic(item.paidAt);
      final label = '${ClinicFormat.month(at, language)} ${at.year}';
      if (label != month) {
        month = label;
        rows.add(
          Padding(
            padding: EdgeInsetsDirectional.only(
              top: rows.isEmpty ? 0 : 18,
              bottom: 8,
            ),
            child: Semantics(
              header: true,
              child: Text(
                label.toUpperCase(),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: SaxlemTypography.tracking(context, .8),
                ),
              ),
            ),
          ),
        );
      }
      rows.add(
        Padding(
          padding: const EdgeInsetsDirectional.only(bottom: 10),
          child: ReceiptRow(
            receipt: item,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => ReceiptDetailsPage(receipt: item),
              ),
            ),
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          ...rows,
          if (_next != null) ...[
            const SizedBox(height: 6),
            if (_moreFailed)
              Padding(
                padding: const EdgeInsetsDirectional.only(bottom: 8),
                child: Text(
                  strings.receiptsMoreFailed,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            SaxlemButton(
              label: strings.loadMore,
              hierarchy: SaxlemButtonHierarchy.secondary,
              expand: true,
              onPressed: _loadingMore ? null : _more,
            ),
          ],
        ],
      ),
    );
  }
}

/// One payment in the history list.
class ReceiptRow extends StatelessWidget {
  const ReceiptRow({required this.receipt, required this.onTap, super.key});
  final Receipt receipt;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    final theme = Theme.of(context);
    final colors = context.saxlemColors;
    final language = Localizations.localeOf(context).languageCode;
    final amount = strings.iqdAmount(ClinicFormat.number(receipt.amountIqd));
    final refund = receipt.status != PaymentStatus.paid;
    final online = receipt.method == PaymentMethod.online;
    return SaxlemCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      semanticLabel: [
        receipt.doctorName,
        receipt.patientName,
        ClinicFormat.clinicDay(receipt.paidAt, language),
        amount,
        paymentStatusText(context, receipt.status),
      ].join(', '),
      child: ExcludeSemantics(
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: online ? colors.infoSurface : colors.surfaceSunken,
                shape: BoxShape.circle,
              ),
              child: Icon(
                online ? Icons.bolt_rounded : Icons.storefront_rounded,
                size: 20,
                color: online ? colors.infoContent : colors.textSecondary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    receipt.doctorName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleSmall,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${ClinicFormat.clinicDay(receipt.paidAt, language)} · ${receipt.patientName}',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  amount,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontFeatures: const [FontFeature.tabularFigures()],
                    decoration: receipt.status == PaymentStatus.refunded
                        ? TextDecoration.lineThrough
                        : null,
                  ),
                ),
                if (refund)
                  Text(
                    paymentStatusText(context, receipt.status),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: receipt.status == PaymentStatus.refundFailed
                          ? colors.cautionContent
                          : colors.infoContent,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'saxlem_card.dart';

class SaxlemDetailItem {
  const SaxlemDetailItem(this.label, this.value);
  final String label, value;
}

class SaxlemDetailsList extends StatelessWidget {
  const SaxlemDetailsList({required this.items, super.key});
  final List<SaxlemDetailItem> items;

  @override
  Widget build(BuildContext context) => SaxlemCard(
    child: LayoutBuilder(
      builder: (context, constraints) => Column(
        children: items
            .map(
              (item) => Padding(
                padding: const EdgeInsetsDirectional.symmetric(vertical: 8),
                child: constraints.maxWidth < 320
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            item.label,
                            style: Theme.of(context).textTheme.labelMedium,
                          ),
                          const SizedBox(height: 4),
                          Text(item.value),
                        ],
                      )
                    : Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: Text(item.label)),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(item.value, textAlign: TextAlign.end),
                          ),
                        ],
                      ),
              ),
            )
            .toList(),
      ),
    ),
  );
}

import 'package:flutter/material.dart';
import '../../foundations/saxlem_radii.dart';
import '../../foundations/saxlem_sizes.dart';

class SaxlemSearchBar extends StatelessWidget {
  const SaxlemSearchBar({
    required this.hint,
    this.controller,
    this.focusNode,
    this.onChanged,
    this.onTap,
    this.onFilter,
    this.filterLabel,
    super.key,
  });
  final String hint;
  final TextEditingController? controller;
  final FocusNode? focusNode;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onTap, onFilter;
  final String? filterLabel;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          onChanged: onChanged,
          onTap: onTap,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: const Icon(Icons.search_rounded),
          ),
        ),
      ),
      if (onFilter != null) ...[
        const SizedBox(width: 8),
        Semantics(
          button: true,
          label: filterLabel,
          child: IconButton.filledTonal(
            constraints: const BoxConstraints.tightFor(
              width: SaxlemSizes.minimumTouchTarget,
              height: SaxlemSizes.minimumTouchTarget,
            ),
            onPressed: onFilter,
            icon: const Icon(Icons.tune_rounded),
            style: IconButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(SaxlemRadii.large),
              ),
            ),
          ),
        ),
      ],
    ],
  );
}

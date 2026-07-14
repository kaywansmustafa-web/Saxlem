import 'package:flutter/material.dart';

class AppointmentsEmptyState extends StatelessWidget {
  const AppointmentsEmptyState({
    required this.firstTime,
    required this.onDiscover,
    super.key,
  });
  final bool firstTime;
  final VoidCallback onDiscover;
  @override
  Widget build(BuildContext context) => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsetsDirectional.all(32),
      child: Column(
        children: [
          Icon(
            Icons.calendar_month_outlined,
            size: 64,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 18),
          Text(
            firstTime ? 'Your care starts here' : 'Nothing here right now',
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            firstTime
                ? 'Book your first visit with a trusted doctor.'
                : 'Your appointments in this category will appear here.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 22),
          FilledButton(
            onPressed: onDiscover,
            child: const Text('Discover Doctors'),
          ),
        ],
      ),
    ),
  );
}

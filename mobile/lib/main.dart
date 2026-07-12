import 'package:flutter/material.dart';

import 'config/theme/app_theme.dart';

void main() {
  runApp(const SaxlemApp());
}

class SaxlemApp extends StatelessWidget {
  const SaxlemApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Saxlem',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const DesignSystemPreview(),
    );
  }
}

class DesignSystemPreview extends StatelessWidget {
  const DesignSystemPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Saxlem'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Your Health, Simplified',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            Text(
              'Book trusted doctors and manage your appointments.',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 32),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Search doctors',
                prefixIcon: Icon(Icons.search),
              ),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () {},
              child: const Text('Get Started'),
            ),
          ],
        ),
      ),
    );
  }
}
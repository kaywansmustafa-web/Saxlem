import 'package:flutter/material.dart';

import 'config/theme/app_theme.dart';
import 'features/splash/splash_screen.dart';

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
      home: const SplashScreen(),
    );
  }
}
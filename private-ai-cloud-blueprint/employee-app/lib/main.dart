// Flutter client skeleton — targets mobile/desktop from same codebase.
// Run: flutter create . && flutter run (after installing Flutter SDK)

import 'package:flutter/material.dart';

void main() => runApp(const CompanyAIApp());

class CompanyAIApp extends StatelessWidget {
  const CompanyAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Company AI',
      home: Scaffold(
        appBar: AppBar(title: const Text('Company AI')),
        body: const Center(child: Text('Connect to /api/v1/chat/query')),
      ),
    );
  }
}

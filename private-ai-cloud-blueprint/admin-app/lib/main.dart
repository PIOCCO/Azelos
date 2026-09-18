import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'services/api_client.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  runApp(PaicAdminApp(prefs: prefs));
}

class PaicAdminApp extends StatefulWidget {
  const PaicAdminApp({super.key, required this.prefs});

  final SharedPreferences prefs;

  @override
  State<PaicAdminApp> createState() => _PaicAdminAppState();
}

class _PaicAdminAppState extends State<PaicAdminApp> {
  late final ApiClient _api = ApiClient(widget.prefs);

  @override
  Widget build(BuildContext context) {
    final loggedIn = _api.token != null && _api.token!.isNotEmpty;
    return MaterialApp(
      title: 'Private AI Admin',
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1E293B)), useMaterial3: true),
      home: loggedIn
          ? HomeScreen(
              api: _api,
              onLogout: () async {
                await _api.logout();
                setState(() {});
              },
            )
          : LoginScreen(
              api: _api,
              onLoggedIn: () => setState(() {}),
            ),
    );
  }
}

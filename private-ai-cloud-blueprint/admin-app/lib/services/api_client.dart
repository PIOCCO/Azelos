import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';

class ApiClient {
  ApiClient(this._prefs);

  final SharedPreferences _prefs;
  static const _tokenKey = 'paic_admin_token';

  String? get token => _prefs.getString(_tokenKey);

  Future<void> setToken(String? value) async {
    if (value == null) {
      await _prefs.remove(_tokenKey);
    } else {
      await _prefs.setString(_tokenKey, value);
    }
  }

  Uri _uri(String path) => Uri.parse('${AppConfig.apiBaseUrl}$path');

  Future<Map<String, dynamic>> login(String email, String password) async {
    final r = await http.post(
      _uri('/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (r.statusCode != 200) {
      throw Exception('Login failed: ${r.body}');
    }
    final data = jsonDecode(r.body) as Map<String, dynamic>;
    await setToken(data['access_token'] as String);
    return data;
  }

  Future<void> logout() => setToken(null);

  Future<List<dynamic>> listDocuments() async {
    final r = await http.get(_uri('/documents'), headers: _authHeaders());
    _ensureOk(r);
    return jsonDecode(r.body) as List<dynamic>;
  }

  Future<Map<String, dynamic>> adminUsage() async {
    final r = await http.get(_uri('/admin/usage'), headers: _authHeaders());
    _ensureOk(r);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createDepartment(String name) async {
    final r = await http.post(
      _uri('/admin/departments'),
      headers: {..._authHeaders(), 'Content-Type': 'application/json'},
      body: jsonEncode({'name': name}),
    );
    _ensureOk(r);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }

  Future<void> uploadDocument(List<int> bytes, String filename) async {
    final req = http.MultipartRequest('POST', _uri('/documents/upload'));
    req.headers.addAll(_authHeaders());
    req.files.add(http.MultipartFile.fromBytes('file', bytes, filename: filename));
    final streamed = await req.send();
    final body = await streamed.stream.bytesToString();
    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw Exception('Upload failed: $body');
    }
  }

  Map<String, String> _authHeaders() {
    final t = token;
    if (t == null || t.isEmpty) {
      throw Exception('Not authenticated');
    }
    return {'Authorization': 'Bearer $t'};
  }

  void _ensureOk(http.Response r) {
    if (r.statusCode < 200 || r.statusCode >= 300) {
      throw Exception('API error ${r.statusCode}: ${r.body}');
    }
  }
}

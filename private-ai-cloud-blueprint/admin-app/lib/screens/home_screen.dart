import 'package:cross_file/cross_file.dart';
import 'package:desktop_drop/desktop_drop.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../services/api_client.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.api, required this.onLogout});

  final ApiClient api;
  final VoidCallback onLogout;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _docs = [];
  Map<String, dynamic>? _usage;
  final _deptController = TextEditingController();
  String? _status;
  bool _dragging = false;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    try {
      final docs = await widget.api.listDocuments();
      final usage = await widget.api.adminUsage();
      setState(() {
        _docs = docs;
        _usage = usage;
        _status = null;
      });
    } catch (e) {
      setState(() => _status = e.toString());
    }
  }

  Future<void> _uploadFiles(List<XFile> files) async {
    for (final f in files) {
      final bytes = await f.readAsBytes();
      await widget.api.uploadDocument(bytes, f.name);
    }
    await _refresh();
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(withData: true, allowMultiple: true);
    if (result == null) return;
    for (final f in result.files) {
      if (f.bytes == null) continue;
      await widget.api.uploadDocument(f.bytes!, f.name);
    }
    await _refresh();
  }

  Future<void> _addDept() async {
    final name = _deptController.text.trim();
    if (name.isEmpty) return;
    await widget.api.createDepartment(name);
    _deptController.clear();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Department "$name" created')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _refresh),
          IconButton(icon: const Icon(Icons.logout), onPressed: widget.onLogout),
        ],
      ),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Documents', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  DropTarget(
                    onDragEntered: (_) => setState(() => _dragging = true),
                    onDragExited: (_) => setState(() => _dragging = false),
                    onDragDone: (details) async {
                      setState(() => _dragging = false);
                      await _uploadFiles(details.files);
                    },
                    child: Material(
                      color: _dragging ? Colors.blue.shade50 : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                      child: InkWell(
                        onTap: _pickFiles,
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.all(32),
                          alignment: Alignment.center,
                          child: const Text('Drag & drop files here\nor click to browse'),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.builder(
                      itemCount: _docs.length,
                      itemBuilder: (context, i) {
                        final d = _docs[i] as Map<String, dynamic>;
                        return ListTile(
                          title: Text(d['filename']?.toString() ?? ''),
                          subtitle: Text('Status: ${d['status']}'),
                          leading: const Icon(Icons.description_outlined),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Departments', style: Theme.of(context).textTheme.titleLarge),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _deptController,
                          decoration: const InputDecoration(hintText: 'New department'),
                        ),
                      ),
                      IconButton(onPressed: _addDept, icon: const Icon(Icons.add)),
                    ],
                  ),
                  const Divider(),
                  Text('AI usage', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(_usage?.toString() ?? 'Loading…'),
                  if (_status != null) ...[
                    const SizedBox(height: 16),
                    Text(_status!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

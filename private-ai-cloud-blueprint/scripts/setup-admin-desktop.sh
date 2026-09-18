#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/admin-app"
command -v flutter >/dev/null || { echo "Install Flutter SDK first: https://docs.flutter.dev/get-started/install"; exit 1; }
flutter pub get
flutter create . --platforms=linux,windows,macos
echo "Run: flutter run -d linux"

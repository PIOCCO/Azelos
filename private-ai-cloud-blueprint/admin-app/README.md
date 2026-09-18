# Admin desktop application (Flutter)

Native **desktop admin** for Windows, macOS, and Linux — same API as the web admin dashboard.

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) 3.16+
- Desktop support enabled: `flutter config --enable-windows-desktop` (and/or macOS, Linux)

## Run

Start the API stack first (`docker compose up` from blueprint root).

```bash
cd admin-app
flutter pub get
flutter run -d linux
# or: flutter run -d windows / macos
```

Point at a remote API:

```bash
flutter run -d linux --dart-define=API_BASE_URL=https://your-host/api/v1
```

## Features (v1)

- Secure login (JWT stored in platform preferences)
- Document list and file upload (picker + click-to-browse)
- Create departments
- AI usage summary

Extend with permissions UI, user management, and audit views using the same `ApiClient`.

## vs web admin

| | Web (`admin-frontend/`) | Desktop (`admin-app/`) |
|--|-------------------------|-------------------------|
| Delivery | Browser / Nginx | Flutter native window |
| API | `/api/v1` | Same REST API |

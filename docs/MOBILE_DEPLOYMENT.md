# eRankUp Mobile App Deployment Guide

This guide covers building and distributing the Flutter mobile app for testing.

---

## How the Mobile App Works (Important!)

**The mobile app does NOT run on the server.** It is a Flutter app that is:
- Built as an **APK (Android)** or **IPA (iOS)** file on your local machine
- Installed directly on testers' phones
- Connects to the **existing backend** at `https://erankup.in/api`

✅ **Your server (CX43 | 160 GB) is perfectly fine for 200–500 users** — both web and mobile share the same backend API. No additional server setup needed.

✅ **The `.env` file on the server is for the backend only.** The mobile app does NOT use it.

---

## App Architecture

```
[Tester's Android/iOS Phone]
        │
        │  HTTPS API calls
        ▼
[erankup.in → Nginx → Backend:3001]  (your existing server)
        │
        ├── PostgreSQL (same DB)
        └── Redis (same cache)
```

---

## Pre-requisites (on your local machine)

- Flutter SDK (`>=3.0.0`) — [Install Flutter](https://docs.flutter.dev/get-started/install)
- Android Studio / Android SDK (for APK builds)
- Xcode (for iOS builds, Mac only)

Verify your setup:
```bash
flutter doctor
```

---

## Step 1: Navigate to Mobile Directory

```bash
cd /opt/erankup/mobile   # on server (if building there)
# OR
cd mobile                # on your local machine
```

---

## Step 2: Install Dependencies

```bash
flutter pub get
```

---

## Step 3: Build Production APK (Android)

```bash
# Build release APK pointing to production server
flutter build apk --release --dart-define=ENV=prod
```

> **Why `--dart-define=ENV=prod`?** Without this flag, the app defaults to `dev` mode and tries to connect to your local machine IP (`http://192.168.1.4:3001`) which won't work on testers' phones. This flag switches the API to `https://erankup.in/api`.

### APK Output Location (Windows)

Once the build finishes, your APK is at:

```
C:\Users\Public\eRankUp\mobile\build\app\outputs\flutter-apk\app-release.apk
```

You can open File Explorer directly to that folder:
```bash
start C:\Users\Public\eRankUp\mobile\build\app\outputs\flutter-apk
```

---

## Step 4: Distribute APK to Testers

### Option A: Direct Share (Easiest for Testing)
1. Copy `app-release.apk` from `build/app/outputs/flutter-apk/`
2. Share via WhatsApp, Google Drive, or email
3. Testers enable **"Install from Unknown Sources"** on their phone
4. Testers install the APK

### Option B: Firebase App Distribution (Recommended)
```bash
# Install Firebase CLI if not done
npm install -g firebase-tools
firebase login

# Upload to Firebase App Distribution
firebase appdistribution:distribute build/app/outputs/flutter-apk/app-release.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups testers \
  --release-notes "Testing release v1.0"
```

---

## iOS Build (Mac only)

```bash
# Build for iOS (requires Mac + Xcode)
flutter build ios --release --dart-define=ENV=prod

# Then use Xcode to archive and distribute via TestFlight
```

---

## Checking Which API the App Connects To

The API URL is configured in `mobile/lib/config/config.dart`:

| Environment Flag | API URL |
|-----------------|---------|
| `ENV=dev` (default) | `http://192.168.1.4:3001` (local) |
| `ENV=prod` | `https://erankup.in/api` ✅ |

**Always use `--dart-define=ENV=prod` when building for testers.**

---

## Server — No Changes Needed

Your existing server already handles mobile API requests:
- Nginx already proxies `/api/*` → `backend:3001`
- All existing endpoints work for mobile
- No new Docker containers needed
- No `.env` changes needed

### Verify Backend is Live

```bash
# SSH to server
ssh root@89.167.49.18

# Check all containers running
docker ps

# Test API endpoint
curl https://erankup.in/api/health
# or
curl https://erankup.in/api/exams
```

---

## Verifying Mobile App Flow

| Screen | What it does |
|--------|-------------|
| Login / Signup | Calls `/auth/login` or `/auth/register` |
| Home | Fetches exams, announcements |
| Exams | Lists, searches, filters exams |
| Test Engine | Starts, submits exam attempts |
| Results | Shows score breakdown, AI explanations |
| AI Chat | Connects to `/ai-chat` endpoints |
| Leaderboard | Fetches rankings |
| Subscription | Razorpay payment integration |
| Settings | Dark mode, profile edit |

---

## Quick Troubleshooting

### "Network Error" or API not reachable
- Verify: `curl https://erankup.in/api/exams` returns data
- Check Docker containers: `docker ps` on server
- Ensure you built with `--dart-define=ENV=prod`

### APK won't install on phone
- Enable **Settings → Security → Install Unknown Apps**
- Or use Firebase App Distribution for easier installs

### Google Sign-In not working
- Requires proper SHA-1 fingerprint registration in Google Cloud Console
- For testing: use email/password login instead

---

## Summary — Deployment Checklist

- [x] Server already running (web app deployed)
- [x] Backend API available at `https://erankup.in/api`
- [x] `config.dart` updated with correct prod URL
- [ ] Run `flutter pub get` in `mobile/` directory
- [ ] Build APK: `flutter build apk --release --dart-define=ENV=prod`
- [ ] Share APK with testers
- [ ] Testers install and test on their phones

---

*Last Updated: March 2026*

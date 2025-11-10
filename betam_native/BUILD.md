# Build Instructions

## Prerequisites

1. Android Studio Hedgehog (2023.1.1) or later
2. JDK 17 or later
3. Android SDK with API 34
4. Firebase project configured

## Setup

### 1. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable **Firestore Database**
3. Enable **Firebase Storage** (optional, for image uploads)
4. Add Android app with package name: `com.example.ethiopianradio`
5. Download `google-services.json` and place it in `app/` directory
6. Update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stations/{document=**} {
      allow read: if true;
      allow write: if true;  // Change in production!
    }
  }
}
```

### 2. Build Release APK

```bash
./gradlew assembleRelease
```

The APK will be in: `app/build/outputs/apk/release/app-release.apk`

### 3. Build Split APKs (Smaller Size)

```bash
./gradlew assembleRelease
# Then use Android App Bundle (AAB) for Play Store
./gradlew bundleRelease
```

### 4. Install

```bash
adb install app/build/outputs/apk/release/app-release.apk
```

## Expected APK Size

- **Single APK**: ~15-20 MB
- **Split APK (arm64-v8a)**: ~8-12 MB
- **Installed Size**: ~25-30 MB

## Troubleshooting

### Firebase Not Initialized
- Ensure `google-services.json` is in `app/` directory
- Check package name matches Firebase project

### Build Errors
- Clean project: `./gradlew clean`
- Invalidate caches in Android Studio
- Sync Gradle files

### Streaming Issues
- Check internet connection
- Verify stream URL is valid
- Check AndroidManifest permissions

## Optimization

The app is already optimized with:
- ✅ Code shrinking (R8/ProGuard)
- ✅ Resource shrinking
- ✅ Minimal dependencies
- ✅ Optimized images
- ✅ No unused libraries

## Next Steps

1. Test on physical device
2. Configure Firebase security rules for production
3. Add app signing for release
4. Upload to Play Store


# Install Guide

## APK Files Built

### Debug APK (for testing)
- **Location**: `app/build/outputs/apk/debug/app-debug.apk`
- **Size**: 12.19 MB
- **Status**: Ready to install (signed with debug key)

### Release APK (for production)
- **Location**: `app/build/outputs/apk/release/app-release-unsigned.apk`
- **Size**: 4.88 MB
- **Status**: Unsigned (needs signing for production)

## Install Steps

### Option 1: Install Debug APK (Recommended for testing)

1. **Connect your device or start emulator**:
   ```bash
   adb devices
   ```

2. **Install the debug APK**:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

### Option 2: Install Release APK (for production)

1. **Sign the release APK** (if not already signed):
   ```bash
   jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore your-keystore.jks app/build/outputs/apk/release/app-release-unsigned.apk your-alias
   ```

2. **Align the APK**:
   ```bash
   zipalign -v 4 app/build/outputs/apk/release/app-release-unsigned.apk app/build/outputs/apk/release/app-release.apk
   ```

3. **Install**:
   ```bash
   adb install -r app/build/outputs/apk/release/app-release.apk
   ```

## Troubleshooting

### No device found
- Ensure USB debugging is enabled on your device
- Check `adb devices` shows your device
- Try restarting ADB: `adb kill-server && adb start-server`

### Installation failed
- Uninstall previous version: `adb uninstall com.example.ethiopianradio`
- Check if device has enough storage
- Ensure APK is not corrupted

### App crashes on startup
- Check Firebase configuration (`google-services.json` is in `app/` directory)
- Verify Firestore is enabled in Firebase Console
- Check logcat for errors: `adb logcat | grep EthiopianRadio`

## Next Steps

1. **Test the app** on a physical device or emulator
2. **Configure Firebase** if not already done
3. **Add stations** using the admin screen
4. **Test streaming** functionality
5. **Build signed release** for production

## Size Comparison

- **Flutter App**: 18.4 MB (APK), ~143 MB (installed)
- **Native Android App**: 4.88 MB (Release APK), ~25-30 MB (installed)
- **Savings**: ~73% smaller APK, ~80% smaller installed size

## Firebase Setup Required

Before using the app, ensure:
1. ✅ Firebase project created
2. ✅ `google-services.json` in `app/` directory
3. ✅ Firestore Database enabled
4. ✅ Firestore security rules configured
5. ✅ Firebase Storage enabled (optional, for image uploads)

See `BUILD.md` for detailed Firebase setup instructions.


# Ethiopian Radio - Native Android App

A fully native Android radio streaming app built with Kotlin, Android Jetpack, and ExoPlayer.

## Features

- ✅ Radio streaming with background playback
- ✅ Firebase Firestore integration
- ✅ Firebase Storage for images (optional)
- ✅ Admin screen for adding stations
- ✅ Material Design 3 UI
- ✅ Dark mode support
- ✅ Optimized for small size (<25 MB)
- ✅ ExoPlayer for stable audio streaming
- ✅ MediaSession for system integration

## Architecture

- **MVVM Pattern**: ViewModel + LiveData
- **Repository Pattern**: Firebase Firestore
- **ExoPlayer**: Audio streaming
- **MediaSession**: Background playback
- **Material Design 3**: Modern UI
- **Kotlin Coroutines**: Async operations

## Setup

### 1. Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database
3. Enable Firebase Storage (optional)
4. Add Android app with package name: `com.example.ethiopianradio`
5. Download `google-services.json` and place it in `app/` directory
6. Update Firestore security rules (see `FIREBASE_SETUP.md`)

### 2. Build

```bash
./gradlew assembleRelease
```

### 3. Install

```bash
adb install app/build/outputs/apk/release/app-release.apk
```

## Project Structure

```
app/
├── src/main/
│   ├── java/com/example/ethiopianradio/
│   │   ├── data/
│   │   │   ├── model/
│   │   │   │   └── RadioStation.kt
│   │   │   └── repository/
│   │   │       └── RadioStationRepository.kt
│   │   ├── service/
│   │   │   └── RadioPlayerService.kt
│   │   ├── ui/
│   │   │   ├── adapter/
│   │   │   │   └── StationAdapter.kt
│   │   │   ├── admin/
│   │   │   │   └── AdminActivity.kt
│   │   │   ├── viewmodel/
│   │   │   │   └── RadioStationViewModel.kt
│   │   │   └── MainActivity.kt
│   │   └── EthiopianRadioApplication.kt
│   └── res/
│       ├── layout/
│       ├── values/
│       └── xml/
```

## Dependencies

- **AndroidX Core**: 1.12.0
- **Material Design**: 1.11.0
- **ExoPlayer (Media3)**: 1.2.0
- **Firebase**: BOM 32.7.0
- **Glide**: 4.16.0
- **Lifecycle**: 2.6.2

## Size Optimization

- ✅ Code shrinking (R8/ProGuard)
- ✅ Resource shrinking
- ✅ Minimal dependencies
- ✅ No unused libraries
- ✅ Optimized images

## License

MIT License


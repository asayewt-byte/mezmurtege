# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard
4. Enable **Firestore Database** and **Storage**

## Step 2: Add Android App to Firebase

1. In Firebase Console, click the Android icon (or "Add app")
2. Register your app:
   - **Package name**: `com.example.betam_app` (check your `android/app/build.gradle` for actual package name)
   - **App nickname**: Ethiopian Radio (optional)
   - **Debug signing certificate**: Leave blank for now
3. Download `google-services.json`
4. Place it in: `android/app/google-services.json`

## Step 3: Configure Android Build Files

### Update `android/build.gradle.kts`:
Add to `dependencies` block:
```kotlin
dependencies {
    classpath("com.google.gms:google-services:4.4.0")
}
```

### Update `android/app/build.gradle.kts`:
Add to `plugins` block:
```kotlin
plugins {
    id("com.google.gms.google-services")
}
```

**Note**: The build files have been updated automatically. Just make sure `google-services.json` is in place.

## Step 4: Setup Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose a location close to you
5. Create a collection named `stations` with these fields:
   - `name` (string)
   - `frequency` (string)
   - `city` (string)
   - `streamUrl` (string)
   - `imageUrl` (string)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

## Step 5: Setup Firebase Storage

1. In Firebase Console, go to **Storage**
2. Click "Get started"
3. Start in **test mode** (for development)
4. Create a folder: `station_images/`

## Step 6: Security Rules (Important!)

### Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stations/{document=**} {
      allow read: if true;  // Anyone can read
      allow write: if request.auth != null;  // Only authenticated users can write
    }
  }
}
```

### Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /station_images/{allPaths=**} {
      allow read: if true;  // Anyone can read
      allow write: if request.auth != null;  // Only authenticated users can write
    }
  }
}
```

## Step 7: Install FlutterFire CLI (Optional but Recommended)

```bash
dart pub global activate flutterfire_cli
flutterfire configure
```

This will automatically configure Firebase for your project.

## Step 8: Run the App

```bash
flutter pub get
flutter run
```

## Testing

1. Open the app
2. Tap the **+** button in the top right
3. Fill in the form:
   - Station Name: "Mirt Internet Radio"
   - Frequency: "Online"
   - City: "Ethiopia"
   - Stream URL: Your stream URL
   - Image: Select a station logo
4. Tap "Upload Station"
5. The station should appear in the favorites grid!

## Troubleshooting

- **"Firebase not initialized"**: Make sure `google-services.json` is in `android/app/`
- **"Permission denied"**: Check Firestore and Storage security rules
- **"Image upload fails"**: Verify Storage is enabled and rules allow writes


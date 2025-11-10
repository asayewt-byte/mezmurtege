# Quick Start Guide 🚀

## ✅ Firebase Setup Complete!

Your `google-services.json` file has been added to the project. The backend is ready to use!

## Next Steps

### 1. Enable Firebase Services

Go to your Firebase Console: https://console.firebase.google.com/project/radio-479dd

#### Enable Firestore:
1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose a location
5. Create a collection named `stations`

#### Enable Storage (Optional):
**Option A: Enable Storage (Recommended)**
1. Go to **Storage**
2. Click "Get started"
3. You'll see a billing notice - click "Upgrade" to Blaze plan
4. **Don't worry!** Free tier includes 5GB storage (more than enough)
5. Start in **test mode**
6. Storage is ready!

**Option B: Use Image URLs (No Storage Needed)**
- Skip Storage setup
- Use the "Image URL" field in the admin screen
- Upload images to external hosting (Imgur, Cloudinary, etc.)
- Enter the URL when adding stations
- See `STORAGE_OPTIONS.md` for details

### 2. Set Security Rules (Important!)

#### ✅ Firestore Rules - You've already set these!
Your Firestore rules are correctly configured. Great job!

#### ⏳ Storage Rules - Set This Next!
Go to Firebase Console → **Storage** → **Rules** tab and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /station_images/{allPaths=**} {
      allow read: if true;
      allow write: if true;  // For development - change in production!
    }
  }
}
```

Click **"Publish"** to save the rules.

### 3. Run the App

```bash
cd betam_app
flutter run -d emulator-5554
```

## How to Use

### Add a Radio Station:
1. Tap the **+** button (top right)
2. Fill in the form:
   - **Station Name**: e.g., "Mirt Internet Radio"
   - **Frequency**: e.g., "Online" or "102.1"
   - **City**: e.g., "Ethiopia"
   - **Stream URL**: Your radio stream URL
   - **Image**: 
     - **Option 1**: Tap image area to upload from gallery/camera (requires Firebase Storage)
     - **Option 2**: Enter image URL in "Image URL" field (no Storage needed)
3. Tap **"Upload Station"**
4. Station appears in the grid automatically!

### Play Radio:
1. Tap any station card to start playing
2. Use the play/pause button in the mini player
3. Switch stations by tapping different cards

## Project Info

- **Firebase Project**: radio-479dd
- **Package Name**: com.example.betam_app
- **Storage Bucket**: radio-479dd.firebasestorage.app

## Features

✅ Upload stations with images  
✅ Stream radio stations  
✅ Play/pause controls  
✅ Firebase backend  
✅ Image storage  
✅ Real-time updates  

## Troubleshooting

- **"Firebase not initialized"**: Check that `google-services.json` is in `android/app/`
- **"Permission denied"**: Update Firestore/Storage security rules
- **"No stations"**: Add stations via the Admin Screen (+ button)
- **Network errors**: Ensure emulator has internet access

Happy streaming! 📻


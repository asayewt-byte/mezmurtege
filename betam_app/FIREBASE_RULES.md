# Firebase Security Rules

## Firestore Rules ✅ (Already Set)

Your Firestore rules are correctly configured for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stations/{document=**} {
      allow read: if true;
      allow write: if true;  // For development - change in production!
    }
  }
}
```

## Storage Rules (Set This Next!)

Go to Firebase Console → Storage → Rules and set:

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

## Production Rules (For Later)

When you're ready for production, update the rules to require authentication:

### Firestore Production Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stations/{document=**} {
      allow read: if true;  // Public read
      allow write: if request.auth != null;  // Authenticated write only
    }
  }
}
```

### Storage Production Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /station_images/{allPaths=**} {
      allow read: if true;  // Public read
      allow write: if request.auth != null;  // Authenticated write only
    }
  }
}
```

## Test Data Structure

Your Firestore `stations` collection should have documents like:

```json
{
  "name": "Mirt Internet Radio",
  "frequency": "Online",
  "city": "Ethiopia",
  "streamUrl": "https://stream-175.zeno.fm/...",
  "imageUrl": "https://firebasestorage.googleapis.com/...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Next Steps

1. ✅ Firestore Rules - DONE
2. ⏳ Storage Rules - Set this next
3. ⏳ Test the app - Add a station via the app
4. ⏳ Verify data appears in Firestore


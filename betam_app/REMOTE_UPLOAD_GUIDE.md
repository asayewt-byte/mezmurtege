# Remote Upload Guide 📤

This guide shows you how to upload radio stations remotely without using the mobile app.

## Option 1: Firebase Console (Easiest) 🎯

### Steps:
1. Go to [Firebase Console](https://console.firebase.google.com/project/radio-479dd/firestore)
2. Click on **Firestore Database**
3. Click on the **`stations`** collection
4. Click **"Add document"**
5. Fill in the fields:
   - `name` (string): Station name, e.g., "Mirt Internet Radio"
   - `frequency` (string): Frequency, e.g., "Online" or "102.1"
   - `city` (string): City, e.g., "Ethiopia"
   - `streamUrl` (string): Stream URL
   - `imageUrl` (string): Image URL (optional)
   - `createdAt` (timestamp): Click timestamp icon, select "Set to current time"
   - `updatedAt` (timestamp): Click timestamp icon, select "Set to current time"
6. Click **"Save"**

### Example Document:
```json
{
  "name": "Mirt Internet Radio",
  "frequency": "Online",
  "city": "Ethiopia",
  "streamUrl": "https://stream-175.zeno.fm/...",
  "imageUrl": "https://example.com/station-logo.jpg",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

## Option 2: Web Admin Interface 🌐

We've created a simple HTML page you can use to upload stations from any browser.

### How to Use:
1. Open `web_admin.html` in your browser
2. Fill in the form:
   - Station Name
   - Frequency
   - City
   - Stream URL
   - Image URL (optional)
3. Click **"Upload Station"**
4. Station appears in the app automatically!

### Access from Anywhere:
- Upload the HTML file to a web server
- Or use a local web server:
  ```bash
  # Python
  python -m http.server 8000
  
  # Node.js
  npx http-server
  ```
- Open `http://localhost:8000/web_admin.html`

## Option 3: Firebase REST API 🔌

### Using curl:
```bash
curl -X POST \
  'https://firestore.googleapis.com/v1/projects/radio-479dd/databases/(default)/documents/stations' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "fields": {
      "name": {"stringValue": "Mirt Internet Radio"},
      "frequency": {"stringValue": "Online"},
      "city": {"stringValue": "Ethiopia"},
      "streamUrl": {"stringValue": "https://stream-175.zeno.fm/..."},
      "imageUrl": {"stringValue": "https://example.com/logo.jpg"},
      "createdAt": {"timestampValue": "2024-01-15T10:00:00Z"},
      "updatedAt": {"timestampValue": "2024-01-15T10:00:00Z"}
    }
  }'
```

### Using JavaScript (Node.js):
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addStation() {
  await db.collection('stations').add({
    name: 'Mirt Internet Radio',
    frequency: 'Online',
    city: 'Ethiopia',
    streamUrl: 'https://stream-175.zeno.fm/...',
    imageUrl: 'https://example.com/logo.jpg',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('Station added!');
}

addStation();
```

## Option 4: Mobile App (Current) 📱

1. Open the app on your phone
2. Tap the **+** button (top right)
3. Fill in the form
4. Upload station

## Quick Comparison

| Method | Ease | Speed | Remote Access |
|--------|------|-------|---------------|
| Firebase Console | ⭐⭐⭐⭐⭐ | Fast | ✅ Yes |
| Web Admin | ⭐⭐⭐⭐ | Fast | ✅ Yes |
| REST API | ⭐⭐ | Medium | ✅ Yes |
| Mobile App | ⭐⭐⭐⭐⭐ | Fast | ❌ No |

## Recommended: Firebase Console

For quick remote uploads, **Firebase Console** is the easiest option:
- No code required
- Works from any browser
- Instant updates in the app
- Free to use

Just go to: https://console.firebase.google.com/project/radio-479dd/firestore


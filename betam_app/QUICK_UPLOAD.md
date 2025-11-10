# Quick Remote Upload 🚀

## Easiest Method: Firebase Console

### Step-by-Step:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/project/radio-479dd/firestore

2. **Navigate to Stations Collection**
   - Click **"Firestore Database"** in left menu
   - Click on **"stations"** collection

3. **Add New Document**
   - Click **"Add document"** button
   - Document ID: Leave blank (auto-generated)

4. **Fill in Fields**
   Click **"Add field"** for each:
   - **Field name**: `name` | **Type**: string | **Value**: "Mirt Internet Radio"
   - **Field name**: `frequency` | **Type**: string | **Value**: "Online"
   - **Field name**: `city` | **Type**: string | **Value**: "Ethiopia"
   - **Field name**: `streamUrl` | **Type**: string | **Value**: "https://stream-175.zeno.fm/..."
   - **Field name**: `imageUrl` | **Type**: string | **Value**: "https://example.com/logo.jpg" (optional)
   - **Field name**: `createdAt` | **Type**: timestamp | Click timestamp icon → "Set to current time"
   - **Field name**: `updatedAt` | **Type**: timestamp | Click timestamp icon → "Set to current time"

5. **Save**
   - Click **"Save"** button
   - ✅ Station appears in app immediately!

## Visual Guide

```
Firebase Console
└── Firestore Database
    └── stations (collection)
        └── [New Document]
            ├── name: "Mirt Internet Radio"
            ├── frequency: "Online"
            ├── city: "Ethiopia"
            ├── streamUrl: "https://..."
            ├── imageUrl: "https://..."
            ├── createdAt: [timestamp]
            └── updatedAt: [timestamp]
```

## Example Document

```json
{
  "name": "Mirt Internet Radio",
  "frequency": "Online",
  "city": "Ethiopia",
  "streamUrl": "https://stream-175.zeno.fm/akmuznguawzuv?zt=...",
  "imageUrl": "https://lh3.googleusercontent.com/aida-public/...",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

## Tips

- ✅ **No code needed** - Just use the web interface
- ✅ **Works from anywhere** - Any browser, any device
- ✅ **Instant updates** - Changes appear in app immediately
- ✅ **Free** - No additional costs
- ✅ **Safe** - Uses Firebase security rules

## Need Help?

See `REMOTE_UPLOAD_GUIDE.md` for more options:
- Web admin interface
- REST API method
- Script-based uploads

## Quick Link

🔗 **Direct link**: https://console.firebase.google.com/project/radio-479dd/firestore/data/~2Fstations


# Quick Deploy Guide 🚀

## Firebase Hosting (Recommended)

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login
```bash
firebase login
```

### Step 3: Deploy
```bash
cd betam_app
firebase deploy --only hosting
```

### Step 4: Access Your Site
After deployment, you'll get a URL like:
- `https://radio-479dd.web.app`
- `https://radio-479dd.firebaseapp.com`

## Local Testing

### Option 1: Python
```bash
cd betam_app/public
python -m http.server 8000
```
Open: http://localhost:8000

### Option 2: Node.js
```bash
cd betam_app/public
npx http-server -p 8000
```
Open: http://localhost:8000

### Option 3: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `public/index.html`
3. Select "Open with Live Server"

## Files Ready
- ✅ `firebase.json` - Firebase configuration
- ✅ `.firebaserc` - Project settings
- ✅ `public/index.html` - Web admin interface
- ✅ Firebase config - Already configured

## Next Steps
1. Run `firebase deploy --only hosting`
2. Share the URL with your team
3. Upload stations from any browser!

For detailed instructions, see `HOSTING_GUIDE.md`


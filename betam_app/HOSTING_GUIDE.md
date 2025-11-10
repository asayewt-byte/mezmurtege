# Web Admin Hosting Guide 🌐

This guide shows you how to host the web admin interface so you can upload stations remotely from any browser.

## Option 1: Firebase Hosting (Recommended) ⭐

### Why Firebase Hosting?
- ✅ Free hosting (10 GB storage, 360 MB/day bandwidth)
- ✅ Automatic HTTPS
- ✅ Custom domain support
- ✅ CDN (Content Delivery Network)
- ✅ Easy deployment
- ✅ Same project as your app

### Setup Steps:

#### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

Or if you don't have Node.js, use standalone installer:
- Download from: https://firebase.tools/bin/win/instant/latest

#### 2. Login to Firebase
```bash
firebase login
```
This will open your browser to authenticate.

#### 3. Initialize Firebase Hosting
```bash
cd betam_app
firebase init hosting
```

**Select:**
- Use an existing project: **radio-479dd**
- Public directory: **public**
- Single-page app: **Yes**
- Set up automatic builds: **No**

#### 4. Deploy
```bash
firebase deploy --only hosting
```

#### 5. Access Your Site
After deployment, you'll get a URL like:
```
https://radio-479dd.web.app
```
or
```
https://radio-479dd.firebaseapp.com
```

### Update the Site:
1. Make changes to `web_admin.html`
2. Copy to `public/index.html`
3. Run: `firebase deploy --only hosting`

---

## Option 2: Local Server (Quick Testing) 🚀

### Python (if installed):
```bash
cd betam_app
python -m http.server 8000
```
Then open: http://localhost:8000/web_admin.html

### Node.js (if installed):
```bash
cd betam_app
npx http-server -p 8000
```
Then open: http://localhost:8000/web_admin.html

### PHP (if installed):
```bash
cd betam_app
php -S localhost:8000
```
Then open: http://localhost:8000/web_admin.html

### VS Code Live Server:
1. Install "Live Server" extension in VS Code
2. Right-click on `web_admin.html`
3. Select "Open with Live Server"

---

## Option 3: GitHub Pages (Free) 🐙

### Steps:
1. Create a GitHub repository
2. Upload `web_admin.html` (rename to `index.html`)
3. Go to repository Settings → Pages
4. Select branch and folder
5. Your site will be at: `https://yourusername.github.io/repository-name`

---

## Option 4: Netlify (Free) 🌟

### Steps:
1. Go to https://www.netlify.com/
2. Sign up/login
3. Drag and drop the `public` folder (or `web_admin.html`)
4. Your site is live instantly!

### Or use Netlify CLI:
```bash
npm install -g netlify-cli
cd betam_app
netlify deploy --dir=public
```

---

## Option 5: Vercel (Free) ⚡

### Steps:
1. Go to https://vercel.com/
2. Sign up/login
3. Import your project
4. Deploy!

### Or use Vercel CLI:
```bash
npm install -g vercel
cd betam_app
vercel --cwd public
```

---

## Firebase Hosting Setup (Detailed)

### Project Structure:
```
betam_app/
├── firebase.json          # Firebase configuration
├── .firebaserc           # Firebase project settings
├── public/               # Hosting directory
│   └── index.html       # Your web admin (copied from web_admin.html)
└── web_admin.html       # Source file
```

### Firebase Configuration:
The `firebase.json` file is already configured:
- Public directory: `public`
- Single-page app: enabled
- Cache headers: optimized

### Deployment Commands:

**Deploy hosting only:**
```bash
firebase deploy --only hosting
```

**Deploy everything:**
```bash
firebase deploy
```

**Preview locally:**
```bash
firebase serve
```
Then open: http://localhost:5000

---

## Security Considerations

### Current Setup (Development):
- Firestore rules: Allow read/write to all (test mode)
- Web admin: No authentication required

### For Production:
1. **Add Authentication:**
   - Enable Firebase Authentication
   - Add login to web admin
   - Update Firestore rules to require auth

2. **Update Firestore Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /stations/{document=**} {
         allow read: if true;
         allow write: if request.auth != null;  // Require authentication
       }
     }
   }
   ```

3. **Add CORS Headers:**
   - Configure CORS in Firebase Hosting
   - Or use Firebase Functions as a proxy

---

## Troubleshooting

### Firebase Hosting Not Working:
- Check `firebase.json` configuration
- Verify `public` folder exists
- Ensure `index.html` is in `public` folder
- Check Firebase project: `firebase projects:list`

### Web Admin Not Connecting to Firestore:
- Check Firebase config in `web_admin.html`
- Verify Firestore rules allow write
- Check browser console for errors
- Ensure Firestore is enabled in Firebase Console

### CORS Errors:
- Update Firestore rules to allow web access
- Check Firebase project settings
- Verify API keys are correct

---

## Quick Start (Firebase Hosting)

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Initialize (if not done)
cd betam_app
firebase init hosting

# 4. Copy web admin to public folder
copy web_admin.html public\index.html

# 5. Deploy
firebase deploy --only hosting

# 6. Access your site!
# URL will be shown after deployment
```

---

## Recommended: Firebase Hosting

**Best for:**
- ✅ Same project as your app
- ✅ Free hosting
- ✅ Easy deployment
- ✅ Automatic HTTPS
- ✅ Custom domain support

**Get started:**
1. Install Firebase CLI
2. Run `firebase init hosting`
3. Run `firebase deploy --only hosting`
4. Share the URL with your team!

---

## Need Help?

- Firebase Hosting Docs: https://firebase.google.com/docs/hosting
- Firebase Console: https://console.firebase.google.com/project/radio-479dd/hosting
- Firebase CLI Reference: https://firebase.google.com/docs/cli

Happy hosting! 🚀


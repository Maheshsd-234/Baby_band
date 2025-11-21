# Push Notifications Setup Guide (Step-by-Step)

This guide will help you set up push notifications with **LOUD alarm sound** that works even when your phone is locked.

---

## Step 1: Enable Cloud Messaging in Firebase

### 1.1 Go to Firebase Console
1. Open https://console.firebase.google.com
2. Select your project: **BabyBand** (babyband-5cc12)

### 1.2 Navigate to Cloud Messaging
1. Click the **gear icon** (⚙️) next to "Project Overview"
2. Click **Project Settings**
3. Click the **Cloud Messaging** tab (at the top)

### 1.3 Generate VAPID Key
1. Scroll down to **Web configuration** section
2. Under "Web Push certificates", click **Generate key pair**
3. A VAPID key will appear (starts with `BK...`)
4. **Copy this key** - you'll need it in Step 2

**Example VAPID key format:**
```
BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 2: Add VAPID Key to Your Project

### 2.1 Open `.env.local` File
1. Go to `baby-band/dashboard/` folder
2. Open `.env.local` file (create it if it doesn't exist)

### 2.2 Add VAPID Key
Add this line to your `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Replace** `BKxxxxxxxx...` with your actual VAPID key from Step 1.3

**Example:**
```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BK1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3
```

---

## Step 3: Update Service Worker with Firebase Config

### 3.1 Open Service Worker File
1. Open `baby-band/dashboard/public/firebase-messaging-sw.js`

### 3.2 Replace Firebase Config
Find this section (around line 9-16):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "babyband-5cc12.firebaseapp.com",
  projectId: "babyband-5cc12",
  storageBucket: "babyband-5cc12.appspot.com",
  messagingSenderId: "338700946828",
  appId: "YOUR_APP_ID",
};
```

### 3.3 Get Your Firebase Config Values
1. Go to Firebase Console → Project Settings → General
2. Scroll to **Your apps** section
3. Click on your **Web app** (or add one if you don't have it)
4. You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "babyband-5cc12.firebaseapp.com",
  projectId: "babyband-5cc12",
  storageBucket: "babyband-5cc12.appspot.com",
  messagingSenderId: "338700946828",
  appId: "1:338700946828:web:xxxxx"
};
```

### 3.4 Update Service Worker
Replace the placeholder values in `firebase-messaging-sw.js` with your actual values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...", // Your actual API key
  authDomain: "babyband-5cc12.firebaseapp.com",
  projectId: "babyband-5cc12",
  storageBucket: "babyband-5cc12.appspot.com",
  messagingSenderId: "338700946828",
  appId: "1:338700946828:web:xxxxx", // Your actual App ID
};
```

**Save the file!**

---

## Step 4: Register Service Worker

### 4.1 Check if Service Worker Registration Exists
The dashboard should automatically register the service worker. Let's verify:

1. Open `baby-band/dashboard/src/app/page.tsx`
2. Look for the notification initialization code (should be around line 85-120)
3. It should already be there from our previous setup

If it's missing, the code should include:
```javascript
// Initialize push notifications
useEffect(() => {
  // Request notification permission
  // Initialize messaging
  // Get FCM token
}, []);
```

---

## Step 5: Test Locally

### 5.1 Restart Development Server
```bash
cd baby-band/dashboard
npm run dev
```

### 5.2 Open Dashboard in Browser
1. Open http://localhost:3000 (or 3001 if 3000 is busy)
2. Open **Developer Tools** (F12)
3. Go to **Console** tab

### 5.3 Allow Notifications
1. Browser will ask: **"Allow notifications?"**
2. Click **Allow**
3. Check console - you should see: `FCM Token: ...`

### 5.4 Verify Service Worker
1. In Developer Tools, go to **Application** tab
2. Click **Service Workers** (left sidebar)
3. You should see `firebase-messaging-sw.js` registered
4. Status should be **"activated and is running"**

---

## Step 6: Test Push Notification

### 6.1 Trigger an Alert
1. Connect ESP32
2. Open Serial Monitor
3. Type `remove` and press Enter
4. OR unplug ESP32 (wait 10+ seconds)

### 6.2 What Should Happen
✅ **Push notification appears** (even if browser is minimized)  
✅ **LOUD alarm sound plays** (at maximum volume)  
✅ **Strong vibration** (if phone supports it)  
✅ **Notification stays visible** until you interact with it  

---

## Step 7: Test on Mobile Phone

### 7.1 Deploy to Vercel (or use local network)
```bash
cd baby-band/dashboard
vercel --prod
```

OR use local network:
- Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Open on phone: `http://YOUR_IP:3000`

### 7.2 Open on Mobile Browser
1. Open the dashboard URL on your phone
2. **Allow notifications** when prompted
3. **Add to Home Screen** (optional but recommended):
   - **iOS**: Share button → Add to Home Screen
   - **Android**: Menu (⋮) → Add to Home Screen

### 7.3 Test with Phone Locked
1. **Lock your phone** (put it in your pocket)
2. Trigger alert (unplug ESP32 or type `remove`)
3. You should receive:
   - ✅ **Push notification** on lock screen
   - ✅ **LOUD alarm sound** (even when locked!)
   - ✅ **Vibration**

---

## Troubleshooting

### ❌ No Notification Permission Prompt?
- **Chrome**: Settings → Site Settings → Notifications → Allow
- **Safari**: Settings → Safari → Notifications → Allow
- **Firefox**: Settings → Privacy → Notifications → Allow

### ❌ Service Worker Not Registering?
1. Check browser console for errors
2. Verify `firebase-messaging-sw.js` is in `public/` folder
3. Clear browser cache and reload
4. Check that Firebase config in service worker is correct

### ❌ No Alarm Sound?
1. Check phone volume is up
2. Check browser notification settings
3. Verify `alarm.mp3` exists in `public/` folder
4. Check browser console for audio errors

### ❌ FCM Token Not Generated?
1. Verify VAPID key is correct in `.env.local`
2. Check Firebase Cloud Messaging is enabled
3. Verify all Firebase config values are correct
4. Check browser console for FCM errors

### ❌ Notifications Work But No Sound?
- Some browsers require user interaction before playing sound
- Try clicking anywhere on the page first
- Then trigger the alert again

---

## Quick Checklist

Before testing, make sure:

- [ ] VAPID key generated in Firebase Console
- [ ] VAPID key added to `.env.local`
- [ ] Service worker updated with Firebase config
- [ ] All Firebase config values are correct
- [ ] Development server restarted
- [ ] Notification permission granted
- [ ] Service worker registered (check DevTools)
- [ ] FCM token generated (check console)

---

## Next Steps (Optional)

Once push notifications work, you can add:
1. **SMS alerts** (see `SMS_SETUP.md`)
2. **Multiple phone numbers**
3. **Custom notification sounds**
4. **Alert history tracking**

---

## Support

If you're stuck:
1. Check browser console for errors (F12 → Console)
2. Check Vercel function logs (if deployed)
3. Verify all environment variables are set
4. Make sure Firebase project is active

---

## Success Indicators

You'll know it's working when:
- ✅ Browser asks for notification permission
- ✅ Console shows: `FCM Token: ...`
- ✅ Service worker is registered
- ✅ Push notification appears when alert triggers
- ✅ **LOUD alarm sound plays** (even when phone locked!)
- ✅ Vibration works

**You're all set!** 🎉


# 🚀 Quick Start: Push Notifications (5 Minutes)

## Step 1: Get VAPID Key (2 minutes)

1. Go to: https://console.firebase.google.com
2. Select project: **BabyBand**
3. Click **⚙️ Settings** → **Project Settings**
4. Click **Cloud Messaging** tab
5. Scroll to **Web Push certificates**
6. Click **Generate key pair**
7. **Copy the VAPID key** (starts with `BK...`)

---

## Step 2: Add to .env.local (1 minute)

Open `baby-band/dashboard/.env.local` and add:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Replace** `BKxxx...` with your actual key from Step 1.

---

## Step 3: Update Service Worker (2 minutes)

1. Open `baby-band/dashboard/public/firebase-messaging-sw.js`
2. Find `firebaseConfig` (around line 9)
3. Replace with your actual Firebase values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...", // From Firebase Console → Project Settings → Your apps → Web app
  authDomain: "babyband-5cc12.firebaseapp.com",
  projectId: "babyband-5cc12",
  storageBucket: "babyband-5cc12.appspot.com",
  messagingSenderId: "338700946828",
  appId: "1:338700946828:web:xxxxx", // Your actual App ID
};
```

**Where to find these values:**
- Firebase Console → Project Settings → General → Your apps → Web app
- Copy the `firebaseConfig` object values

---

## Step 4: Test! (1 minute)

1. **Restart server:**
   ```bash
   cd baby-band/dashboard
   npm run dev
   ```

2. **Open dashboard:** http://localhost:3000

3. **Allow notifications** when browser asks

4. **Check console** (F12) - should see: `✅ FCM Token: ...`

5. **Trigger alert:**
   - Unplug ESP32, OR
   - Type `remove` in Serial Monitor

6. **You should get:**
   - ✅ Push notification
   - ✅ **LOUD alarm sound**
   - ✅ Vibration

---

## ✅ Success Checklist

- [ ] VAPID key added to `.env.local`
- [ ] Service worker updated with Firebase config
- [ ] Server restarted
- [ ] Notification permission granted
- [ ] FCM token appears in console
- [ ] Alert triggers notification + loud sound

---

## 🐛 Troubleshooting

**No notification?**
- Check browser console for errors
- Verify VAPID key is correct
- Check notification permission in browser settings

**No sound?**
- Check phone volume is up
- Verify `alarm.mp3` exists in `public/` folder
- Try clicking page first (some browsers need interaction)

**Service worker not registering?**
- Check `firebase-messaging-sw.js` is in `public/` folder
- Clear browser cache
- Check console for service worker errors

---

## 📱 Test on Mobile

1. Deploy: `vercel --prod`
2. Open on phone
3. Allow notifications
4. Lock phone
5. Trigger alert
6. **LOUD alarm should play even when locked!** 🔔

---

**That's it!** You're ready to test the loud alarm system! 🎉


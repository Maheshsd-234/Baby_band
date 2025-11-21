# 🚀 Deployment Guide - Baby Band Safety System

This guide will help you deploy the Next.js dashboard to **Vercel** so it works on mobile devices with background notifications and alarms.

## ✅ What Works After Deployment

1. **Mobile Access**: Access dashboard from any mobile device via URL
2. **Background Notifications**: Get push notifications even when dashboard is closed
3. **Alarm Sounds**: Loud alarm plays when ESP32 disconnects (hotspot off)
4. **Server-Side Monitoring**: Vercel cron job checks ESP32 status every 10 seconds
5. **SMS Alerts**: Optional SMS notifications via Twilio

---

## 📋 Prerequisites

1. **Firebase Project** (already set up)
2. **Vercel Account** (free tier works)
3. **GitHub Account** (for Vercel deployment)

---

## 🔧 Step 1: Prepare Environment Variables

Create a `.env.local` file in `baby-band/dashboard/` with these variables:

```env
# Firebase Configuration (from Firebase Console → Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef

# Firebase VAPID Key (for push notifications)
# Get from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Firebase Server Key (for sending push notifications from server)
# Get from: Firebase Console → Project Settings → Cloud Messaging → Server key
FIREBASE_SERVER_KEY=your_server_key

# App URL (will be your Vercel URL after deployment)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Twilio SMS (Optional - for SMS alerts)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
ALERT_PHONE_NUMBERS=+1234567890,+0987654321
```

---

## 🔑 Step 2: Get Firebase Server Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **⚙️ Project Settings** → **Cloud Messaging** tab
4. Find **Server key** (or **Legacy server key**)
5. Copy it to `FIREBASE_SERVER_KEY` in `.env.local`

**Note**: If you don't see a server key, you may need to:
- Enable Cloud Messaging API in Google Cloud Console
- Or use Firebase Admin SDK (more complex)

---

## 📱 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push code to GitHub**:
   ```bash
   cd baby-band/dashboard
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/baby-band-dashboard.git
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click **"Add New Project"**
   - Import your GitHub repository
   - Select `baby-band/dashboard` as root directory

3. **Add Environment Variables**:
   - In Vercel project settings → **Environment Variables**
   - Add ALL variables from `.env.local`
   - Make sure to add them for **Production**, **Preview**, and **Development**

4. **Deploy**:
   - Click **"Deploy"**
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Option B: Deploy via CLI

```bash
cd baby-band/dashboard
npm install -g vercel
vercel login
vercel --prod
```

Follow prompts to add environment variables.

---

## ⚙️ Step 4: Configure Vercel Cron Job

The `vercel.json` file is already configured, but verify:

1. **Check `vercel.json`**:
   ```json
   {
     "crons": [
       {
         "path": "/api/monitor-device",
         "schedule": "*/10 * * * * *"
       }
     ]
   }
   ```

2. **Enable Cron Jobs** (Vercel Pro required for cron):
   - Free tier: Cron jobs run on-demand or via external service
   - **Alternative**: Use a free cron service like [cron-job.org](https://cron-job.org) to ping `/api/monitor-device` every 10 seconds

---

## 📲 Step 5: Test on Mobile

1. **Open dashboard on mobile**:
   - Go to `https://your-app.vercel.app` on your phone
   - Allow notification permissions when prompted
   - The service worker will register automatically

2. **Test ESP32 disconnection**:
   - Connect ESP32 to your phone's hotspot
   - Open dashboard and wait for it to show "Connected"
   - **Turn off hotspot** (or disconnect ESP32)
   - Wait 15 seconds
   - **You should receive**:
     - Push notification (even if dashboard is closed)
     - Alarm sound (if dashboard is open)
     - SMS alert (if configured)

3. **Test background notifications**:
   - Close the dashboard completely (swipe away from recent apps)
   - Disconnect ESP32
   - **You should still get**:
     - Push notification with sound
     - Vibration
     - Notification banner

---

## 🔍 Troubleshooting

### Notifications Not Working?

1. **Check browser permissions**:
   - Mobile: Settings → Apps → Your Browser → Notifications (ON)
   - Desktop: Browser settings → Notifications (Allow)

2. **Check service worker**:
   - Open browser DevTools → Application → Service Workers
   - Verify `firebase-messaging-sw.js` is registered

3. **Check FCM token**:
   - Open browser console
   - Look for: `✅ FCM Token: ...`
   - If missing, check `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### Alarm Sound Not Playing?

1. **Mobile browsers require user interaction**:
   - User must interact with page first (click/tap)
   - Then alarms can play automatically

2. **Check audio file**:
   - Verify `/public/alarm.mp3` exists
   - File should be accessible at `https://your-app.vercel.app/alarm.mp3`

### Cron Job Not Running?

1. **Vercel Free Tier**: Cron jobs may not run automatically
   - Use external cron service: [cron-job.org](https://cron-job.org)
   - Set URL: `https://your-app.vercel.app/api/monitor-device`
   - Set interval: Every 10 seconds

2. **Check logs**:
   - Vercel Dashboard → Functions → View logs
   - Look for errors in `/api/monitor-device`

---

## 📝 Environment Variables Checklist

Before deploying, ensure you have:

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_URL`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- [ ] `FIREBASE_SERVER_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (your Vercel URL)
- [ ] `TWILIO_ACCOUNT_SID` (optional)
- [ ] `TWILIO_AUTH_TOKEN` (optional)
- [ ] `TWILIO_PHONE_NUMBER` (optional)
- [ ] `ALERT_PHONE_NUMBERS` (optional)

---

## 🎯 Quick Test Checklist

After deployment:

1. [ ] Dashboard loads on mobile
2. [ ] ESP32 connects and shows "Connected"
3. [ ] Heartbeat, battery, temperature update every 5s
4. [ ] Turn off hotspot → Alarm triggers within 15s
5. [ ] Close dashboard → Still get push notification
6. [ ] Notification plays alarm sound
7. [ ] Click notification → Opens dashboard
8. [ ] Dismiss alarm → Sound stops

---

## 🚨 Important Notes

1. **Mobile Browser Limitations**:
   - iOS Safari: Limited background audio support
   - Android Chrome: Full support for background notifications
   - **Recommendation**: Use Android Chrome for best experience

2. **Service Worker**:
   - Must be served over HTTPS (Vercel provides this)
   - Must be in `/public/` directory
   - Automatically registered on first page load

3. **Push Notifications**:
   - Require user permission (one-time prompt)
   - Work even when app is closed
   - Sound plays automatically on Android

4. **Cron Jobs**:
   - Vercel Pro required for automatic cron
   - Free tier: Use external cron service
   - Or manually trigger `/api/monitor-device` endpoint

---

## ✅ You're Done!

Your Baby Band Safety System is now deployed and will:
- ✅ Work on mobile devices
- ✅ Send notifications when ESP32 disconnects
- ✅ Play alarm sounds even when dashboard is closed
- ✅ Monitor ESP32 status every 10 seconds
- ✅ Send SMS alerts (if configured)

**Test it**: Connect ESP32 to hotspot, then turn off hotspot. You should get notifications and alarms! 🎉


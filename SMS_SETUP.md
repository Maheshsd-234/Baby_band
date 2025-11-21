# SMS Alert Setup Guide

This guide will help you set up SMS alerts that work even when the phone is in your pocket.

## Features

✅ **SMS Alerts** - Receive SMS when ESP32 triggers alerts  
✅ **Push Notifications** - Alarm sound even when phone is locked  
✅ **Background Monitoring** - Works without dashboard open  

---

## Step 1: Set Up Twilio (SMS Service)

### 1.1 Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account (includes $15.50 credit)
3. Verify your phone number

### 1.2 Get Twilio Credentials

1. Go to Twilio Console: https://console.twilio.com/
2. Copy your **Account SID** and **Auth Token**
3. Get a **Phone Number**:
   - Go to Phone Numbers → Buy a Number
   - Choose a number (free trial numbers available)
   - Copy the phone number (format: +1234567890)

### 1.3 Add to Environment Variables

Add these to your `.env.local` file:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Phone numbers to send alerts to (comma-separated)
ALERT_PHONE_NUMBERS=+1234567890,+0987654321

# Your app URL (for production, use your Vercel URL)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Step 2: Set Up Firebase Cloud Messaging (Push Notifications)

### 2.1 Enable Cloud Messaging in Firebase

1. Go to Firebase Console → Project Settings
2. Click **Cloud Messaging** tab
3. Under **Web configuration**, click **Generate key pair**
4. Copy the **VAPID key** (starts with `BK...`)

### 2.2 Add VAPID Key to Environment

Add to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.3 Update Service Worker

1. Open `public/firebase-messaging-sw.js`
2. Replace placeholder values with your Firebase config:

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

---

## Step 3: Deploy to Vercel

### 3.1 Add Environment Variables to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.local`:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `ALERT_PHONE_NUMBERS`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
   - All other Firebase variables

### 3.2 Deploy

```bash
cd baby-band/dashboard
vercel --prod
```

---

## Step 4: Test SMS Alerts

### 4.1 Enable Notifications on Phone

1. Open your deployed dashboard on mobile
2. Browser will ask for notification permission → **Allow**
3. Dashboard will start monitoring alerts

### 4.2 Test Alert

1. Connect ESP32
2. Type `remove` in Serial Monitor
3. You should receive:
   - ✅ SMS on configured phone numbers
   - ✅ Push notification (if dashboard was open)
   - ✅ Alarm sound (if dashboard is open)

---

## How It Works

### SMS Flow:
```
ESP32 → Firebase Alert → Backend Monitor → Twilio API → SMS to Phone
```

### Push Notification Flow:
```
ESP32 → Firebase Alert → FCM → Phone Notification (even when locked)
```

### Monitoring Service:
- Backend checks Firebase every 5 seconds for new alerts
- When alert detected → Sends SMS to all configured numbers
- Works even if dashboard is closed

---

## Troubleshooting

### SMS Not Sending?

1. Check Twilio credentials in `.env.local`
2. Verify phone numbers are in E.164 format: `+1234567890`
3. Check Twilio Console → Logs for errors
4. Verify account has credits (free trial has $15.50)

### Push Notifications Not Working?

1. Check browser notification permission (Settings → Site Settings)
2. Verify VAPID key is set correctly
3. Check browser console for FCM errors
4. Make sure service worker is registered

### Alerts Not Detected?

1. Check `/api/alerts/monitor` endpoint is accessible
2. Verify Firebase URL is correct
3. Check browser console for errors

---

## Cost Estimate

- **Twilio SMS**: ~$0.0075 per SMS (very cheap)
- **Free Trial**: $15.50 credit = ~2,000 SMS
- **Firebase**: Free tier includes generous limits

---

## Production Recommendations

1. **Use Firebase Cloud Functions** instead of API route polling (more efficient)
2. **Add rate limiting** to prevent SMS spam
3. **Add alert deduplication** (don't send same alert twice)
4. **Add SMS delivery status tracking**

---

## Quick Start Checklist

- [ ] Twilio account created
- [ ] Twilio credentials added to `.env.local`
- [ ] Phone numbers configured
- [ ] Firebase VAPID key generated
- [ ] Service worker updated with Firebase config
- [ ] Environment variables added to Vercel
- [ ] Dashboard deployed
- [ ] Notification permission granted on phone
- [ ] Test alert sent successfully

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Vercel function logs
3. Check Twilio Console → Logs
4. Verify all environment variables are set


# ✅ Deployment Checklist

Use this checklist to ensure everything is configured before deploying to Vercel.

## 🔑 Environment Variables

### Required for Push Notifications:
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` - From Firebase Console → Project Settings
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Your project domain
- [ ] `NEXT_PUBLIC_FIREBASE_URL` - Your Realtime Database URL
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your project ID
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Your storage bucket
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - From Firebase Console
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` - From Firebase Console
- [ ] `NEXT_PUBLIC_FIREBASE_VAPID_KEY` - From Firebase Console → Cloud Messaging → Web Push certificates
- [ ] `FIREBASE_SERVER_KEY` ✅ **YOU ADDED THIS!** - From Firebase Console → Cloud Messaging → Server key
- [ ] `NEXT_PUBLIC_APP_URL` - Will be your Vercel URL (e.g., `https://your-app.vercel.app`)

### Optional for SMS:
- [ ] `TWILIO_ACCOUNT_SID` - If using SMS alerts
- [ ] `TWILIO_AUTH_TOKEN` - If using SMS alerts
- [ ] `TWILIO_PHONE_NUMBER` - If using SMS alerts
- [ ] `ALERT_PHONE_NUMBERS` - Comma-separated phone numbers

## 📱 Pre-Deployment Testing

### Local Testing:
1. [ ] Run `npm run dev` locally
2. [ ] Open dashboard in browser
3. [ ] Check browser console for: `✅ FCM Token: ...`
4. [ ] Verify ESP32 connects and shows "Connected"
5. [ ] Test alarm by disconnecting ESP32

### Firebase Setup:
1. [ ] Firebase Realtime Database is enabled
2. [ ] Database rules allow read/write (for testing)
3. [ ] Cloud Messaging API is enabled
4. [ ] VAPID key is generated
5. [ ] Server key is obtained ✅ **DONE!**

## 🚀 Vercel Deployment Steps

1. [ ] Push code to GitHub
2. [ ] Import project to Vercel
3. [ ] Add ALL environment variables in Vercel dashboard
4. [ ] Deploy to production
5. [ ] Update `NEXT_PUBLIC_APP_URL` with your Vercel URL
6. [ ] Redeploy (to update the URL)

## 📲 Post-Deployment Testing

1. [ ] Open dashboard on mobile device
2. [ ] Allow notification permissions
3. [ ] Check console for FCM token registration
4. [ ] Connect ESP32 to phone hotspot
5. [ ] Verify dashboard shows "Connected"
6. [ ] Turn off hotspot
7. [ ] Wait 15 seconds
8. [ ] Verify push notification received
9. [ ] Verify alarm sound plays (if dashboard open)
10. [ ] Test with dashboard closed - should still get notification

## 🔧 Troubleshooting

If notifications don't work:
- [ ] Check Vercel function logs for errors
- [ ] Verify `FIREBASE_SERVER_KEY` is correct
- [ ] Check browser notification permissions
- [ ] Verify service worker is registered (DevTools → Application → Service Workers)

If alarm doesn't play:
- [ ] Check browser audio permissions
- [ ] Verify `/alarm.mp3` file exists in `/public/`
- [ ] Test audio file plays manually: `https://your-app.vercel.app/alarm.mp3`

---

**Status**: ✅ Firebase Server Key added! Ready for deployment.


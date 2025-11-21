# 🔑 How to Get Firebase Server Key (Step-by-Step)

## 📋 **Quick Steps:**

### **Step 1: Go to Firebase Console**
1. Open your browser
2. Go to: **https://console.firebase.google.com/**
3. Select your project: **babyband-5cc12** (or your project name)

### **Step 2: Navigate to Project Settings**
1. Click the **⚙️ gear icon** (top left, next to "Project Overview")
2. Click **"Project settings"**

### **Step 3: Go to Cloud Messaging Tab**
1. In the settings page, click the **"Cloud Messaging"** tab
2. Scroll down to find **"Cloud Messaging API (Legacy)"** section

### **Step 4: Get Server Key**
1. Look for **"Server key"** or **"Legacy server key"**
2. Click **"Show"** or **"Reveal"** button (if hidden)
3. **Copy the key** (it's a long string like: `AAAA...xyz`)

### **Step 5: Add to Vercel Environment Variables**

#### **Option A: Via Vercel Dashboard (Recommended)**
1. Go to: **https://vercel.com/dashboard**
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. **Name**: `FIREBASE_SERVER_KEY`
6. **Value**: Paste your server key
7. Select **Production**, **Preview**, and **Development** (or just Production)
8. Click **"Save"**

#### **Option B: Via Vercel CLI**
```bash
vercel env add FIREBASE_SERVER_KEY
# Paste your key when prompted
# Select: Production, Preview, Development
```

### **Step 6: Redeploy (if already deployed)**
```bash
cd dashboard
vercel --prod
```

---

## 🎯 **Alternative: Use VAPID Key (Newer Method)**

If you can't find the Server Key, you can use the **VAPID Key** instead:

### **Get VAPID Key:**
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Scroll to **"Web configuration"** section
3. Find **"Web Push certificates"**
4. Click **"Generate key pair"** (if not already generated)
5. Copy the **"Key pair"** (VAPID key)

### **Add VAPID Key to Vercel:**
- **Name**: `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- **Value**: Your VAPID key

**Note**: The code already uses VAPID key for client-side notifications. Server key is only needed for server-side push notifications.

---

## 🔍 **Troubleshooting:**

### **Can't Find Server Key?**
- **Firebase may have removed Legacy Server Key** in newer projects
- **Solution**: Use VAPID key method instead (see above)
- Or use Firebase Admin SDK (more complex setup)

### **Server Key Not Working?**
1. Make sure you copied the **entire key** (no spaces)
2. Check it starts with `AAAA...`
3. Verify it's added to Vercel environment variables
4. Redeploy after adding the variable

### **Where is Cloud Messaging Tab?**
- If you don't see it, make sure:
  - You're in the correct Firebase project
  - You have **Editor** or **Owner** permissions
  - Cloud Messaging API is enabled

---

## ✅ **Verify It's Working:**

1. **Check Vercel Environment Variables:**
   ```bash
   vercel env ls
   ```
   Should show: `FIREBASE_SERVER_KEY`

2. **Test Push Notification:**
   - Open dashboard
   - Allow notifications
   - Turn off ESP32
   - Wait 10 seconds
   - Should receive push notification!

---

## 📝 **Quick Reference:**

| What | Where to Find |
|------|---------------|
| **Server Key** | Firebase Console → Project Settings → Cloud Messaging → Server key |
| **VAPID Key** | Firebase Console → Project Settings → Cloud Messaging → Web Push certificates |
| **Add to Vercel** | Vercel Dashboard → Settings → Environment Variables |

---

## 🎯 **For Your Demo:**

**You can skip this step for now!** The system will still work, but:
- ✅ **Client-side notifications** work (when dashboard is open)
- ⚠️ **Server-side push** (when dashboard closed) needs server key

**For judges demo**, you can:
1. Show it works when dashboard is open (no server key needed)
2. Mention: "Server-side push notifications can be enabled with Firebase Server Key"

**Or** set it up now for full functionality! 🚀


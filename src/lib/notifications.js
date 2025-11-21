"use client";

import { getToken, onMessage } from "firebase/messaging";
import { initializeApp, getApps } from "firebase/app";

// Initialize Firebase (reuse existing config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-app.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-app",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-app.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123:web:demo",
};

let messaging = null;

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("Browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    console.warn("Notification permission denied");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function initializeMessaging() {
  if (typeof window === "undefined") return null;

  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const { getMessaging, isSupported } = await import("firebase/messaging");
    
    if (!isSupported()) {
      console.warn("Firebase Messaging not supported");
      return null;
    }

    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error("Failed to initialize messaging:", error);
    return null;
  }
}

export async function getFCMToken() {
  if (!messaging) {
    messaging = await initializeMessaging();
  }

  if (!messaging) return null;

  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY. Generate a Web Push certificate in Firebase Console → Project Settings → Cloud Messaging.",
      );
    }

    const registration = await navigator.serviceWorker.ready;
    // Debug: log important context used for token request
    try {
      console.log("[notifications] Firebase config used for getToken:", config);
    } catch {
      // ignore logging issues
    }

    try {
      console.log("[notifications] Messaging app options:", messaging?.app?.options || null);
    } catch {
      // ignore logging issues
    }

    try {
      console.log("[notifications] Service worker registration:", registration);

      // Primary attempt: include the service worker registration (recommended)
      let token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      return token;
    } catch (errPrimary) {
      console.error("[notifications] getToken with serviceWorkerRegistration failed:", errPrimary);

      // Try again without passing the registration (some environments accept this)
      try {
        const tokenFallback = await getToken(messaging, { vapidKey });
        console.warn("[notifications] getToken succeeded without serviceWorkerRegistration (fallback)");
        return tokenFallback;
      } catch (errFallback) {
        console.error("[notifications] getToken fallback without registration also failed:", errFallback);
        // Re-throw the fallback error so outer catch logs it consistently
        throw errFallback;
      }
    }
  } catch (error) {
    console.error("Failed to get FCM token:", error);
    return null;
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    // Play LOUD alarm sound immediately when message received
    playAlarmSound();
    
    // Show browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(payload.notification?.title || "🚨 Baby Band Alert", {
        body: payload.notification?.body || "Critical alert detected!",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "baby-band-alert",
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500, 200, 1000],
        sound: "/alarm.mp3",
        silent: false,
      });
      
      // Play alarm when notification is clicked
      notification.onclick = () => {
        playAlarmSound();
        window.focus();
      };
    }
    
    callback(payload);
  });
}

// Play LOUD alarm sound when notification received
export function playAlarmSound() {
  if (typeof window === "undefined") return;
  
  try {
    const audio = new Audio("/alarm.mp3");
    audio.volume = 1.0; // Maximum volume
    audio.loop = true;
    
    // Set audio to play even when device is locked
    if (audio.setSinkId) {
      // Use default audio output (loudest)
      audio.setSinkId("").catch(() => {});
    }
    
    // Play immediately and aggressively
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Alarm sound playing at maximum volume");
          // Keep playing until user dismisses
        })
        .catch((err) => {
          console.warn("Failed to play alarm:", err);
          // Retry after user interaction
          document.addEventListener(
            "click",
            () => {
              audio.play().catch(() => {});
            },
            { once: true }
          );
        });
    }
    
    // Store audio reference to stop it later
    window.babyBandAlarm = audio;
    
    // Stop after 60 seconds (or let it play until dismissed)
    setTimeout(() => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    }, 60000);
  } catch (error) {
    console.error("Error playing alarm:", error);
  }
}

// Stop alarm sound
export function stopAlarmSound() {
  if (typeof window !== "undefined" && window.babyBandAlarm) {
    window.babyBandAlarm.pause();
    window.babyBandAlarm.currentTime = 0;
    window.babyBandAlarm = null;
  }
}


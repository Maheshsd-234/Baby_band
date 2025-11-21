// Server-side monitoring service to detect ESP32 offline status
// This runs on Vercel every 10 seconds (via cron) and sends push notifications
// Works even when dashboard is closed!

import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const deviceId = "baby1";
const OFFLINE_THRESHOLD_MS = 15000; // Alert if no update for 15 seconds

// Store FCM tokens (in production, use a database)
// For demo: tokens are registered via POST request
let fcmTokens = new Set();

// FCM Server Key from Firebase Console
const FCM_SERVER_KEY = process.env.FIREBASE_SERVER_KEY;

async function sendPushNotification(token, title, body) {
  if (!FCM_SERVER_KEY) {
    console.error("FIREBASE_SERVER_KEY not configured");
    return false;
  }

  try {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
          sound: "default",
          priority: "high",
        },
        data: {
          type: "offline",
          timestamp: Date.now().toString(),
        },
        priority: "high",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("FCM error:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return false;
  }
}

async function postAlertToFirebase(alertType) {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const alertsRef = ref(db, `/devices/${deviceId}/alerts`);

    // Use Firebase REST API to POST alert
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FIREBASE_URL}/devices/${deviceId}/alerts.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: alertType,
          ts: Date.now(),
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Failed to post alert to Firebase:", error);
    return false;
  }
}

// GET: Check device status and send notifications if offline
export async function GET() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const stateRef = ref(db, `/devices/${deviceId}/state`);

    const snapshot = await get(stateRef);
    const state = snapshot.val();

    if (!state) {
      return Response.json({
        status: "no_data",
        message: "No device state found",
      });
    }

    const lastSeen = state.lastSeen || 0;
    const now = Date.now();
    const timeSinceLastSeen = now - lastSeen;

    // Check if device is offline
    if (timeSinceLastSeen > OFFLINE_THRESHOLD_MS) {
      // Device is offline - send push notifications to all registered tokens
      const title = "🚨 Baby Band Offline";
      const body = `No heartbeat detected for ${Math.floor(timeSinceLastSeen / 1000)} seconds. Check immediately!`;

      // Send push notifications
      const notificationPromises = Array.from(fcmTokens).map((token) =>
        sendPushNotification(token, title, body)
      );

      await Promise.allSettled(notificationPromises);

      // Post alert to Firebase
      await postAlertToFirebase("offline");

      return Response.json({
        status: "offline_detected",
        message: "Device offline - notifications sent",
        timeSinceLastSeen: Math.floor(timeSinceLastSeen / 1000),
        tokensNotified: fcmTokens.size,
      });
    }

    return Response.json({
      status: "online",
      message: "Device is online",
      timeSinceLastSeen: Math.floor(timeSinceLastSeen / 1000),
    });
  } catch (error) {
    console.error("Monitor device error:", error);
    return Response.json(
      {
        status: "error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST: Register FCM token for push notifications
export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return Response.json(
        { error: "Token required" },
        { status: 400 }
      );
    }

    fcmTokens.add(token);
    console.log(`FCM token registered. Total tokens: ${fcmTokens.size}`);

    return Response.json({
      success: true,
      message: "Token registered",
      totalTokens: fcmTokens.size,
    });
  } catch (error) {
    console.error("Token registration error:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


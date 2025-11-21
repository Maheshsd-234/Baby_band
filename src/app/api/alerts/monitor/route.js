// Backend service to monitor Firebase alerts and send SMS
// This API route can be called periodically or via webhook

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Phone numbers to send SMS to (configure these)
const ALERT_PHONE_NUMBERS = process.env.ALERT_PHONE_NUMBERS
  ? process.env.ALERT_PHONE_NUMBERS.split(",")
  : [];

const deviceId = "baby1";

// Track last alert timestamp to avoid duplicate SMS
let lastAlertTimestamp = 0;

async function sendSMS(phoneNumber, message) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(`SMS API returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to send SMS to ${phoneNumber}:`, error);
    throw error;
  }
}

function getAlertMessage(alertType) {
  const messages = {
    removed: "🚨 CRITICAL: Baby band was removed! Check immediately!",
    offline: "⚠️ ALERT: Baby band went offline. No heartbeat detected for 10+ seconds.",
    out_of_range: "⚠️ ALERT: Baby band went out of range. No heartbeat detected for 10+ seconds.",
    default: "🚨 Baby Band Alert: Please check the dashboard immediately.",
  };
  return messages[alertType] || messages.default;
}

// Monitor Firebase alerts
export async function GET() {
  return new Promise((resolve) => {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const alertsRef = ref(db, `/devices/${deviceId}/alerts`);

    // Set up listener
    const unsubscribe = onValue(alertsRef, async (snapshot) => {
      const alerts = snapshot.val();
      if (!alerts) {
        resolve(Response.json({ message: "No alerts" }));
        return;
      }

      // Get latest alert
      const alertEntries = Object.entries(alerts);
      if (alertEntries.length === 0) {
        resolve(Response.json({ message: "No alerts" }));
        return;
      }

      // Sort by timestamp and get latest
      const latestAlert = alertEntries
        .map(([id, alert]) => ({ id, ...alert }))
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];

      // Check if this is a new alert (not already processed)
      if (latestAlert.ts && latestAlert.ts > lastAlertTimestamp) {
        lastAlertTimestamp = latestAlert.ts;

        // Send SMS to all configured phone numbers
        const message = getAlertMessage(latestAlert.type);
        const smsPromises = ALERT_PHONE_NUMBERS.map((phone) =>
          sendSMS(phone.trim(), message).catch((err) => {
            console.error(`Failed to send SMS to ${phone}:`, err);
            return { error: err.message };
          })
        );

        await Promise.allSettled(smsPromises);

        unsubscribe();
        resolve(
          Response.json({
            success: true,
            alert: latestAlert,
            smsSent: ALERT_PHONE_NUMBERS.length,
          })
        );
      } else {
        unsubscribe();
        resolve(Response.json({ message: "No new alerts" }));
      }
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      unsubscribe();
      resolve(Response.json({ message: "Timeout" }));
    }, 5000);
  });
}


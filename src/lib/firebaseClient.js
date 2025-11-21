import { initializeApp, getApps } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
} from "firebase/database";

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_URL;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-app.firebaseapp.com",
  databaseURL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-app",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-app.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123:web:demo",
};

let dbInstance;

function getDb() {
  if (!databaseURL) {
    console.warn(
      "[firebaseClient] NEXT_PUBLIC_FIREBASE_URL is not set. Realtime listeners are disabled.",
    );
    return null;
  }

  if (!dbInstance) {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    dbInstance = getDatabase(app, databaseURL);
  }
  return dbInstance;
}

export const isSimulationEnabled =
  process.env.NEXT_PUBLIC_SIMULATE === "true";

export function listenToDeviceState(deviceId, callback) {
  const db = getDb();
  if (!db) return () => {};

  const stateRef = ref(db, `/devices/${deviceId}/state`);
  const unsubscribe = onValue(stateRef, (snapshot) => {
    callback(snapshot.val());
  });
  return unsubscribe;
}

export function listenToDeviceAlerts(deviceId, callback) {
  const db = getDb();
  if (!db) return () => {};

  const alertsRef = ref(db, `/devices/${deviceId}/alerts`);
  const unsubscribe = onValue(alertsRef, (snapshot) => {
    const raw = snapshot.val();
    if (!raw) {
      callback([]);
      return;
    }
    const entries = Object.entries(raw).map(([id, alert]) => ({
      id,
      ...(alert || {}),
    }));
    entries.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    callback(entries);
  });
  return unsubscribe;
}

export async function postAlert(deviceId, type) {
  if (!databaseURL) return;

  const endpoint = `${databaseURL}/devices/${deviceId}/alerts.json`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ts: Date.now() }),
  });

  if (!res.ok) {
    throw new Error(`Failed to post alert: ${res.status}`);
  }
}

export async function overrideDeviceState(deviceId, state) {
  if (!databaseURL) return;

  const endpoint = `${databaseURL}/devices/${deviceId}/state.json`;
  const res = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });

  if (!res.ok) {
    throw new Error(`Failed to update device state: ${res.status}`);
  }
}

export async function simulateOffline(deviceId) {
  await Promise.all([
    overrideDeviceState(deviceId, {
      status: "disconnected",
      lastSeen: Date.now(),
      heartbeat: 0,
      battery: 0,
    }),
    postAlert(deviceId, "offline"),
  ]);
}

export async function simulateRemoval(deviceId) {
  await postAlert(deviceId, "removed");
}

export async function clearDeviceAlerts(deviceId) {
  if (!databaseURL) return;

  const endpoint = `${databaseURL}/devices/${deviceId}/alerts.json`;
  const res = await fetch(endpoint, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Failed to clear alerts: ${res.status}`);
  }
}


// Service Worker for Firebase Cloud Messaging
// This runs in the background even when the app is closed

importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");

let messagingPromise = null;

async function initFirebaseMessaging() {
  if (messagingPromise) return messagingPromise;

  messagingPromise = fetch("/api/firebase-config")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load Firebase config");
      }
      return response.json();
    })
    .then((config) => {
      firebase.initializeApp(config);
      return firebase.messaging();
    })
    .catch((error) => {
      console.error("[ServiceWorker] Failed to initialize Firebase messaging:", error);
      return null;
    });

  return messagingPromise;
}

self.addEventListener("install", (event) => {
  event.waitUntil(initFirebaseMessaging());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle background messages (when app is closed)
initFirebaseMessaging().then((messaging) => {
  if (!messaging) return;

  messaging.onBackgroundMessage((payload) => {
    console.log("[ServiceWorker] Background message received:", payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || "🚨 Baby Band Alert";
    const notificationBody = payload.notification?.body || payload.data?.body || "Critical alert detected! Check immediately!";
    
    const notificationOptions = {
      body: notificationBody,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "baby-band-alert",
      requireInteraction: true, // Keep notification visible until user interacts
      vibrate: [500, 200, 500, 200, 500, 200, 1000], // Strong vibration pattern
      sound: "/alarm.mp3", // Alarm sound
      data: payload.data || {},
      silent: false, // MUST be false for sound
      renotify: true, // Re-notify even if notification already exists
      priority: "high", // High priority
    };

    // Show notification
    self.registration.showNotification(notificationTitle, notificationOptions);
    
    // Play LOUD alarm sound immediately (even when app is closed!)
    playAlarmSound();
    
    console.log("[ServiceWorker] Notification shown and alarm playing");
  });
});

// Store active alarm sources to stop them later
let activeAlarmSources = [];

// Function to play loud alarm sound
function playAlarmSound() {
  // Create audio context for background playback
  const audioContext = new (self.AudioContext || self.webkitAudioContext)();
  
  // Fetch and play alarm.mp3
  fetch("/alarm.mp3")
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
    .then((audioBuffer) => {
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = audioBuffer;
      source.loop = true; // Loop the alarm
      
      // Set volume to maximum (1.0)
      gainNode.gain.value = 1.0;
      
      // Connect: source -> gain -> destination (speakers)
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Store source so we can stop it later
      activeAlarmSources.push(source);
      
      // Play immediately
      source.start(0);
      
      // Stop after 60 seconds (or let it play until user dismisses)
      setTimeout(() => {
        stopAlarmSound();
      }, 60000);
    })
    .catch((error) => {
      console.error("Failed to play alarm sound:", error);
    });
}

// Function to stop all alarm sounds
function stopAlarmSound() {
  activeAlarmSources.forEach((source) => {
    try {
      source.stop();
    } catch {
      // Already stopped
    }
  });
  activeAlarmSources = [];
}

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  // Stop alarm when user clicks notification
  stopAlarmSound();
  
  // Open the app
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow("/");
    })
  );
});

// Handle messages from main thread (e.g., stop alarm command)
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "stopAlarm") {
    stopAlarmSound();
  }
});


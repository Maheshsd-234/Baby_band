"use client";

// Register Firebase Messaging Service Worker
export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.warn("Service workers not supported");
    return null;
  }

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });

    console.log("Service Worker registered:", registration);

    // Check for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("New service worker available. Reload to update.");
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}


"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Baby,
  BatteryFull,
  Clock3,
  HeartPulse,
  Activity,
  Thermometer,
  MapPin,
} from "lucide-react";
import { useDevice } from "@/hooks/useDevice";
import { clearDeviceAlerts } from "@/lib/firebaseClient";
import { AlertBanner } from "@/components/alert-banner";
import { AlertHistory } from "@/components/alert-history";
import { SimulationControls } from "@/components/simulation-controls";

type MetricCardProps = {
  label: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
  accent?: string;
};

function MetricCard({ label, value, trend, icon, accent }: MetricCardProps) {
  return (
    <div className="rounded-[24px] border border-white/50 bg-white/80 p-5 shadow-soft-card transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="stat-label">{label}</p>
        <div
          className="rounded-2xl p-2 text-white"
          style={{ backgroundColor: accent || "#1C1C1E" }}
        >
          {icon}
        </div>
      </div>
      <p className="stat-value mt-3">{value}</p>
      {trend && <p className="text-xs uppercase tracking-[0.35em] text-gray-400">{trend}</p>}
    </div>
  );
}

export default function Home() {
  const deviceId = "baby1";
  const {
    loading,
    statusLabel,
    heartbeat,
    battery,
    temperature,
    location,
    lastSeenLabel,
    alerts,
    isOutOfRange,
    isConnected,
    state,
  } = useDevice(deviceId);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [historyStatus, setHistoryStatus] = useState<string | null>(null);
  const handleClearHistory = useCallback(async () => {
    if (clearingHistory) return;
    setClearingHistory(true);
    setHistoryStatus(null);
    try {
      await clearDeviceAlerts(deviceId);
      setHistoryStatus("Alert history cleared");
    } catch (error) {
      console.error("Failed to clear alert history:", error);
      setHistoryStatus("Failed to clear history");
    } finally {
      setClearingHistory(false);
      setTimeout(() => setHistoryStatus(null), 3000);
    }
  }, [clearingHistory, deviceId]);

  // Enable audio on first user interaction (required for mobile browsers)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const unlockAudio = async () => {
      try {
        const audio = new Audio("/alarm.mp3");
        audio.volume = 0.01; // Very quiet test
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        // Store that audio is enabled
        sessionStorage.setItem("audioUnlocked", "true");
      } catch {
        // Audio will be enabled when user interacts with alert banner
      }
    };

    // Only unlock if not already done this session
    if (!sessionStorage.getItem("audioUnlocked")) {
      const events = ["click", "touchstart", "keydown"];
      const handler = () => {
        unlockAudio();
        events.forEach((e) => document.removeEventListener(e, handler));
      };
      events.forEach((e) => document.addEventListener(e, handler, { once: true }));
    }
  }, []);

  // Initialize push notifications and SMS monitoring
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register service worker first
    const initServiceWorker = async () => {
      try {
        const { registerServiceWorker } = await import("@/lib/registerServiceWorker");
        await registerServiceWorker();
      } catch (error) {
        console.error("Service worker registration error:", error);
      }
    };

    initServiceWorker();

    // Request notification permission
    const initNotifications = async () => {
      try {
        const { requestNotificationPermission, initializeMessaging, getFCMToken } = await import("@/lib/notifications");
        
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          await initializeMessaging();
          const token = await getFCMToken();
          if (token) {
            console.log("✅ FCM Token:", token);
            // Store token for backend use if needed
            localStorage.setItem("fcmToken", token);
          }
        } else {
          console.warn("⚠️ Notification permission denied");
        }
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
      }
    };

    // Wait a bit for service worker to register, then init notifications
    setTimeout(() => {
      initNotifications();
    }, 1000);

    // Register FCM token with monitoring service
    const registerToken = async () => {
      try {
        const token = localStorage.getItem("fcmToken");
        if (token) {
          await fetch("/api/monitor-device", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          console.log("✅ FCM token registered with monitoring service");
        }
      } catch (error) {
        console.error("Failed to register token:", error);
      }
    };

    // Register token after getting it
    setTimeout(() => {
      registerToken();
    }, 2000);

    // Start device monitoring service (checks if ESP32 is offline)
    // This works even when dashboard is closed (via server-side monitoring)
    const startDeviceMonitoring = () => {
      const monitorInterval = setInterval(async () => {
        try {
          const response = await fetch("/api/monitor-device");
          if (response.ok) {
            const data = await response.json();
            if (data.status === "offline_detected") {
              console.log("🚨 Device offline detected by monitoring service:", data);
            }
          }
        } catch (error) {
          console.error("Device monitoring error:", error);
        }
      }, 8000); // Check every 8 seconds (slightly less than 10s threshold)

      return () => clearInterval(monitorInterval);
    };

    // Start SMS monitoring service (polls for new alerts)
    const startSMSMonitoring = () => {
      const monitorInterval = setInterval(async () => {
        try {
          const response = await fetch("/api/alerts/monitor");
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.alert) {
              console.log("Alert detected, SMS sent:", data);
            }
          }
        } catch (error) {
          console.error("SMS monitoring error:", error);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(monitorInterval);
    };

    const cleanup1 = startDeviceMonitoring();
    const cleanup2 = startSMSMonitoring();
    return () => {
      cleanup1();
      cleanup2();
    };
  }, []);

  const criticalAlert = useMemo(() => {
    // Only show alert if device is actually disconnected
    // Don't show false alarms when device is connected
    if (isConnected && !isOutOfRange) {
      return null; // Device is connected - no alarm
    }

    // If device is disconnected, show alert
    if (!isConnected && state) {
      return {
        key: `connection-${state?.lastSeen ?? "na"}`,
        message: isOutOfRange ? "Band out of range." : "Band disconnected.",
      };
    }

    // Check for recent alerts (only if device is still disconnected)
    const latest = alerts[alerts.length - 1];
    if (!latest) return null;

    const alertTime = latest.ts || 0;
    const now = Date.now();
    const isRecentAlert =
      alertTime > 1577836800000 ? now - alertTime < 300000 : true;
    if (!isRecentAlert) return null;

    // Only show alert if device is still disconnected
    // This prevents false alarms when device reconnects
    if (isConnected && !isOutOfRange) {
      return null; // Device reconnected - don't show old alerts
    }

    const messageMap: Record<string, string> = {
      removed: "Baby band was removed.",
      out_of_range: "Band out of range.",
      offline: "Band offline.",
    };

    const message = messageMap[latest.type || ""] || null;
    if (!message) return null;

    return {
      key: `${latest.type}-${latest.id ?? latest.ts}`,
      message,
    };
  }, [alerts, isConnected, isOutOfRange, state]);

  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [persistentAlert, setPersistentAlert] = useState<{ key: string; message: string } | null>(null);

  // When alert appears, make it persistent until user dismisses
  useEffect(() => {
    if (criticalAlert) {
      // If we have a new alert, set it as persistent (even if device reconnects)
      if (!persistentAlert || persistentAlert.key !== criticalAlert.key) {
        setPersistentAlert(criticalAlert);
      }
    }
    // Don't auto-clear persistent alert - only clear when user dismisses
    // This allows alarm to persist even after reconnection until user dismisses
  }, [criticalAlert, persistentAlert]);

  // Handle dismiss - clear persistent alert and stop ALL alarms
  const handleDismiss = useCallback(() => {
    // Stop all audio alarms
    if (typeof window !== "undefined") {
      // Stop notification alarms
      import("@/lib/notifications").then(({ stopAlarmSound }) => {
        stopAlarmSound();
      }).catch(() => {});
      
      // Stop service worker alarms by sending a message
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.active?.postMessage({ action: "stopAlarm" });
        }).catch(() => {});
      }
      
      // Stop any window-level alarms
      if ((window as any).babyBandAlarm) {
        (window as any).babyBandAlarm.pause();
        (window as any).babyBandAlarm.currentTime = 0;
        (window as any).babyBandAlarm = null;
      }
    }
    
    if (persistentAlert) {
      setDismissedKey(persistentAlert.key);
      setPersistentAlert(null);
    }
  }, [persistentAlert]);

  // Show banner if we have persistent alert and it's not dismissed
  // But only if device is actually disconnected (prevent false alarms when connected)
  const bannerActive = Boolean(persistentAlert) && 
                       dismissedKey !== persistentAlert?.key &&
                       (!isConnected || isOutOfRange);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-brand-muted px-4 py-12 sm:px-8">
      <main className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="space-y-3 text-center sm:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-gray-500 shadow-soft-card">
            <Activity className="h-4 w-4" />
            Live Monitoring
          </p>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
              Baby Band Safety Command Center
            </h1>
            <p className="text-base text-gray-500 sm:text-lg">
              Real-time heartbeat, device health, and critical alerts powered by
              Firebase Realtime Database + ESP32.
            </p>
          </div>
        </header>

        <section className="glass-panel grid gap-4 p-4 sm:p-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Status"
            value={loading ? "Syncing..." : statusLabel}
            trend={isOutOfRange ? "watch range" : "stable link"}
            icon={<Baby className="h-5 w-5" />}
            accent={isConnected ? "#2ECC71" : "#FF3B30"}
          />
          <MetricCard
            label="Heartbeat"
            value={`${heartbeat} bpm`}
            trend="updated every 5s"
            icon={<HeartPulse className="h-5 w-5" />}
            accent="#FF453A"
          />
          <MetricCard
            label="Battery"
            value={`${battery}%`}
            trend={battery < 40 ? "charge soon" : "optimal"}
            icon={<BatteryFull className="h-5 w-5" />}
            accent="#FDBA74"
          />
          <MetricCard
            label="Temperature"
            value={`${temperature}°C`}
            trend={temperature >= 35 && temperature <= 38 ? "normal range" : temperature > 0 ? "monitoring" : "sensor off"}
            icon={<Thermometer className="h-5 w-5" />}
            accent="#EF4444"
          />
          <MetricCard
            label="Location"
            value={location?.lat && location?.lon 
              ? `${location.lat.toFixed(4)}°N, ${location.lon.toFixed(4)}°E`
              : "N/A"}
            trend={location ? "last known GPS" : "no GPS module"}
            icon={<MapPin className="h-5 w-5" />}
            accent="#3B82F6"
          />
          <MetricCard
            label="Last seen"
            value={lastSeenLabel}
            trend="Firebase last update"
            icon={<Clock3 className="h-5 w-5" />}
            accent="#6366F1"
          />
        </section>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1.6fr,1fr]">
          <div className="space-y-6">
            <div className="glass-panel flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-500">
                  Device stream
                </p>
                <h2 className="text-2xl font-semibold text-gray-900">
                  ESP32 → Firebase → Dashboard
                </h2>
                <p className="text-sm text-gray-500">
                  Heartbeat, battery, temperature, and location data refresh every five seconds. 
                  Band removal and offline states trigger immediate alerts that sync to all clients 
                  instantly via Firebase listeners.
                </p>
              </div>

              <div className="rounded-[24px] border border-dashed border-gray-200 bg-white/70 p-6 text-sm text-gray-600">
                <p className="font-semibold text-gray-900">Latest payload</p>
                {state ? (
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-gray-900/90 p-4 text-xs text-gray-50 shadow-inner">
                    {JSON.stringify(state, null, 2)}
                  </pre>
                ) : (
                  <p className="mt-3 text-gray-500">
                    Waiting for ESP32 heartbeat...
          </p>
                )}
              </div>
            </div>

            <SimulationControls deviceId={deviceId} />
        </div>

          <AlertHistory
            alerts={alerts}
            onClear={handleClearHistory}
            clearing={clearingHistory}
            statusMessage={historyStatus}
          />
        </div>
      </main>

      <AlertBanner
        active={bannerActive}
        message={persistentAlert?.message ?? ""}
        onDismiss={handleDismiss}
      />
    </div>
  );
}

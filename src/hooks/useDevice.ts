"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  isSimulationEnabled,
  listenToDeviceAlerts,
  listenToDeviceState,
  postAlert,
} from "@/lib/firebaseClient";

type DeviceState = {
  status?: string;
  lastSeen?: number;
  heartbeat?: number;
  battery?: number;
  temperature?: number;
  location?: {
    lat?: number;
    lon?: number;
  };
};

type DeviceAlert = {
  id?: string;
  type?: string;
  ts?: number;
};

const STALE_THRESHOLD = 10000;

function formatTimeAgo(timestamp?: number, now?: number) {
  if (!timestamp) return "N/A";
  const delta = (now ?? Date.now()) - timestamp;
  if (delta < 0) return "just now";
  
  // Always show relative time for real-time updates
  if (delta < 60000) {
    const seconds = Math.floor(delta / 1000);
    return seconds <= 0 ? "just now" : `${seconds}s ago`;
  }
  if (delta < 3600000) {
    const minutes = Math.floor(delta / 60000);
    return `${minutes}m ago`;
  }
  if (delta < 86400000) {
    const hours = Math.floor(delta / 3600000);
    return `${hours}h ago`;
  }
  // For very old timestamps, show date but still calculate relative
  const days = Math.floor(delta / 86400000);
  if (days < 7) {
    return `${days}d ago`;
  }
  // Fallback to formatted date for very old
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function useDevice(deviceId: string) {
  const [state, setState] = useState<DeviceState | null>(null);
  const [alerts, setAlerts] = useState<DeviceAlert[]>([]);
  const [loading, setLoading] = useState(() => !isSimulationEnabled);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [clock, setClock] = useState(() => Date.now());
  const prevOutOfRangeRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulation mode
  useEffect(() => {
    if (!isSimulationEnabled) return;

    let heartbeat = 82;

    const interval = setInterval(() => {
      heartbeat += (Math.random() - 0.5) * 4;
      heartbeat = Math.min(Math.max(heartbeat, 70), 100);

      const simulatedState = {
        status: "connected",
        lastSeen: Date.now(),
        heartbeat: Math.round(heartbeat),
        battery: 70 + Math.round(Math.random() * 25),
      };

      setState(simulatedState);
      setLastUpdateTime(Date.now());
    }, 5000);

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<DeviceAlert>).detail;
      if (!detail) return;
      setAlerts((prev) => [...prev, detail]);
    };

    window.addEventListener("baby-band-alert", handler as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "baby-band-alert",
        handler as EventListener,
      );
    };
  }, []);

  // Live Firebase mode
  useEffect(() => {
    if (isSimulationEnabled) return;

    const unsubscribeState = listenToDeviceState(deviceId, (snapshot: DeviceState | null) => {
      setState(snapshot);
      setLastUpdateTime(Date.now());
      setLoading(false);
    });

    const unsubscribeAlerts = listenToDeviceAlerts(deviceId, (list: DeviceAlert[]) => {
      setAlerts(list);
    });

    return () => {
      unsubscribeState?.();
      unsubscribeAlerts?.();
    };
  }, [deviceId]);

  const isStale = useMemo(() => {
    if (!state) return true;
    
    const now = clock;
    
    // Primary check: Has Firebase sent us an update recently?
    // This is the most reliable way to detect if ESP32 is still connected
    if (lastUpdateTime > 0) {
      const timeSinceLastUpdate = now - lastUpdateTime;
      if (timeSinceLastUpdate > STALE_THRESHOLD) {
        return true; // No Firebase updates for 10+ seconds = disconnected
      }
    }
    
    // Secondary check: Is the lastSeen timestamp stale?
    if (state.lastSeen) {
      const lastSeen = state.lastSeen;
      
      // If timestamp is reasonable (after 2020), use normal comparison
      if (lastSeen > 1577836800000) { // Jan 1, 2020
        const timeSinceLastSeen = now - lastSeen;
        if (timeSinceLastSeen > STALE_THRESHOLD) {
          return true;
        }
      }
    }
    
    // If status is explicitly "disconnected", it's stale
    if (state.status === "disconnected") {
      return true;
    }
    
    // Otherwise, if we have recent updates, it's fresh
    return false;
  }, [state, lastUpdateTime, clock]);

  const statusLabel = state
    ? isStale || state.status !== "connected"
      ? "Disconnected"
      : "Connected"
    : "Waiting";

  const heartbeat = state?.heartbeat ?? 0;
  const battery = state?.battery ?? 0;
  const temperature = state?.temperature ?? 0;
  const location = state?.location;
  const lastSeenLabel = formatTimeAgo(state?.lastSeen, clock);

  useEffect(() => {
    if (isSimulationEnabled) return;
    const prevOutOfRange = prevOutOfRangeRef.current;
    if (!prevOutOfRange && isStale && lastUpdateTime > 0) {
      postAlert(deviceId, "out_of_range").catch((error) =>
        console.error("[useDevice] Failed to post out_of_range alert:", error),
      );
    }
    prevOutOfRangeRef.current = isStale;
  }, [
    deviceId,
    isStale,
    lastUpdateTime,
  ]);

  return {
    loading,
    state,
    alerts,
    statusLabel,
    heartbeat,
    battery,
    temperature,
    location,
    lastSeenLabel,
    isOutOfRange: isStale,
    isConnected: !isStale && state?.status === "connected",
  };
}


"use client";

import { useState } from "react";
import {
  isSimulationEnabled,
  simulateOffline,
  simulateRemoval,
} from "@/lib/firebaseClient";
import { WifiOff, ShieldOff } from "lucide-react";

type Props = {
  deviceId: string;
};

const buttonStyles =
  "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold shadow-soft-card transition hover:-translate-y-0.5";

export function SimulationControls({ deviceId }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const emitLocalAlert = (type: string) => {
    if (typeof window === "undefined") return;
    const event = new CustomEvent("baby-band-alert", {
      detail: { type, ts: Date.now(), id: crypto.randomUUID() },
    });
    window.dispatchEvent(event);
    setMessage(`Simulated ${type} alert locally.`);
  };

  const handleAction = async (action: "offline" | "removed") => {
    setLoading(action);
    setMessage("");
    try {
      if (isSimulationEnabled) {
        emitLocalAlert(action);
      } else if (action === "offline") {
        await simulateOffline(deviceId);
        setMessage("Offline alert posted to Firebase.");
      } else {
        await simulateRemoval(deviceId);
        setMessage("Removal alert posted to Firebase.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to send alert. Check Firebase URL.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="glass-panel space-y-3 p-6">
      <div>
        <p className="text-lg font-semibold text-gray-900">Simulation lab</p>
        <p className="text-sm text-gray-500">
          Trigger demo alerts instantly {isSimulationEnabled && "(local mode)"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className={`${buttonStyles} bg-[#ffe5e0] text-[#c03b2a]`}
          onClick={() => handleAction("offline")}
          disabled={loading === "offline"}
        >
          <WifiOff className="h-5 w-5" />
          {loading === "offline" ? "Sending..." : "Simulate Offline"}
        </button>
        <button
          className={`${buttonStyles} bg-[#fff2cc] text-[#b17400]`}
          onClick={() => handleAction("removed")}
          disabled={loading === "removed"}
        >
          <ShieldOff className="h-5 w-5" />
          {loading === "removed" ? "Sending..." : "Simulate Removal"}
        </button>
      </div>

      {message && (
        <p className="text-sm font-medium text-gray-600" role="status">
          {message}
        </p>
      )}
    </div>
  );
}


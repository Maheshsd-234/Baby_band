"use client";

import { BellRing, RotateCcw } from "lucide-react";

type Alert = {
  id?: string;
  type?: string;
  ts?: number;
};

const LABELS: Record<string, string> = {
  offline: "Band offline",
  removed: "Band removed",
  out_of_range: "Band out of range",
  default: "Alert",
};

function formatTimestamp(ts?: number) {
  if (!ts) return "Unknown";
  return new Date(ts).toLocaleString();
}

type Props = {
  alerts: Alert[];
  onClear?: () => void;
  clearing?: boolean;
  statusMessage?: string | null;
};

export function AlertHistory({ alerts, onClear, clearing, statusMessage }: Props) {
  return (
    <div className="glass-panel flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-black text-white p-3">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Alert history</p>
            <p className="text-sm text-gray-500">
              Live feed from Firebase Realtime Database
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={clearing || alerts.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {clearing ? "Clearing..." : "Reset"}
            </button>
          )}
          {statusMessage && (
            <p className="pt-1 text-[11px] font-medium text-gray-500">
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/40 text-center text-xs uppercase tracking-[0.4em] text-gray-400">
            No alert history found
          </div>
        ) : (
          <ul className="space-y-3">
            {alerts
              .slice()
              .reverse()
              .map((alert) => (
                <li
                  key={alert.id || alert.ts}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white/70 px-4 py-3 text-sm text-gray-700 shadow-sm transition hover:border-gray-200"
                >
                  <div>
                    <p className="font-semibold">
                      {LABELS[alert.type || "default"] || LABELS.default}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(alert.type || "default").toUpperCase()}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-gray-600">
                    {formatTimestamp(alert.ts)}
                  </p>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}


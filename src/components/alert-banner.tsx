"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X, Volume2 } from "lucide-react";

type AlertBannerProps = {
  active: boolean;
  message: string;
  onDismiss: () => void;
};

export function AlertBanner({ active, message, onDismiss }: AlertBannerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioError, setAudioError] = useState(false);

  // Initialize audio with max volume
  useEffect(() => {
    if (!audioRef.current && typeof window !== "undefined") {
      audioRef.current = new Audio("/alarm.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 1.0; // Maximum volume
      audioRef.current.preload = "auto";
    }
  }, []);

  // Enable audio on user interaction (required for mobile browsers)
  const enableAudio = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioEnabled(true);
      setAudioError(false);
    } catch (err) {
      console.warn("Audio permission denied:", err);
      setAudioError(true);
    }
  };

  // Play LOUD alarm when alert is active
  useEffect(() => {
    if (!active || !audioRef.current) return;

    const playAlarm = async () => {
      try {
        // Set maximum volume
        audioRef.current!.volume = 1.0;
        
        // Try to use system audio output (loudest)
        if (audioRef.current?.setSinkId) {
          audioRef.current.setSinkId("").catch(() => {});
        }
        
        // Play immediately
        await audioRef.current!.play();
        setAudioError(false);
        
        // Import and use notification sound function for extra loudness
        import("@/lib/notifications").then(({ playAlarmSound }) => {
          playAlarmSound(); // This plays at max volume too
        }).catch(() => {});
        
      } catch (err) {
        console.warn("Failed to play alarm:", err);
        setAudioError(true);
        // Try to enable on next user interaction
        if (!audioEnabled) {
          document.addEventListener("click", enableAudio, { once: true });
          document.addEventListener("touchstart", enableAudio, { once: true });
        }
      }
    };

    if (audioEnabled || active) {
      playAlarm();
    } else {
      // Auto-enable on first alert if user has interacted with page
      enableAudio();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      // Stop notification alarm too
      import("@/lib/notifications").then(({ stopAlarmSound }) => {
        stopAlarmSound();
      }).catch(() => {});
    };
  }, [active, audioEnabled]);

  if (!active) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[94%] max-w-3xl -translate-x-1/2 animate-pulse-banner rounded-3xl bg-[#ff3b30] px-6 py-5 text-white shadow-soft-card sm:px-8">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-white/20 p-3">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.35em] text-white/70">
            Critical Alert
          </p>
          <p className="text-lg font-semibold">{message}</p>
          <p className="text-sm text-white/80">Check on baby immediately.</p>
          {audioError && !audioEnabled && (
            <button
              onClick={enableAudio}
              className="mt-2 flex items-center gap-2 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Enable Sound
            </button>
          )}
        </div>
        <button
          aria-label="Dismiss alert"
          onClick={onDismiss}
          className="rounded-full bg-white/20 p-2 transition hover:bg-white/30"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}


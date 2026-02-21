import { useState, useEffect, useRef } from "react";
import type { SignalLevel } from "@/components/ui/SignalStrength";

interface NetworkState {
  signalLevel: SignalLevel;
  isOffline: boolean;
}

export function useNetworkStrength(): NetworkState {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [latency, setLatency] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Periodic latency ping
  useEffect(() => {
    const ping = async () => {
      if (!navigator.onLine) {
        setLatency(null);
        return;
      }
      try {
        const start = performance.now();
        await fetch(`${window.location.origin}/?_ping=${Date.now()}`, {
          method: "HEAD",
          cache: "no-store",
        });
        const end = performance.now();
        setLatency(end - start);
      } catch {
        setLatency(null);
      }
    };

    ping();
    intervalRef.current = setInterval(ping, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Also check Network Information API
  const getSignalLevel = (): SignalLevel => {
    if (isOffline || latency === null) return 0;

    // Use Network Information API if available (with iOS/WebKit fallbacks)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection?.effectiveType) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === "slow-2g" || effectiveType === "2g") return 1;
      if (effectiveType === "3g") return 2;
      // 4g — further refine by latency
    }

    // Latency-based assessment
    if (latency > 800) return 1;
    if (latency > 400) return 2;
    if (latency > 150) return 3;
    return 4;
  };

  return {
    signalLevel: getSignalLevel(),
    isOffline,
  };
}

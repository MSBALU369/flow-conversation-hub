import { useCallback, useRef } from "react";

/**
 * Plays a short synthesized notification sound exactly once.
 * "ding" — general notifications (higher pitch)
 * "ting" — incoming calls / messages (softer, lower pitch)
 */
export function useNotificationSound() {
  const playingRef = useRef(false);

  const play = useCallback((type: "ding" | "ting" = "ding") => {
    if (playingRef.current) return; // prevent overlapping
    playingRef.current = true;

    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "ding") {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        // "ting" — softer, gentler
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.15);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      }

      osc.onended = () => {
        ctx.close();
        playingRef.current = false;
      };
    } catch {
      playingRef.current = false;
    }
  }, []);

  return play;
}

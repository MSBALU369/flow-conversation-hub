import { useCallback, useRef } from "react";

/**
 * Plays short synthesized notification sounds.
 * "ding" — general notifications (higher pitch)
 * "ting" — incoming calls / messages (softer, lower pitch)
 * "pop" — call connected (quick pop sound, 0.5s)
 * "beep" — call ended (descending beep, 0.5s)
 */
export function useNotificationSound() {
  const playingRef = useRef(false);

  const play = useCallback((type: "ding" | "ting" | "pop" | "beep" = "ding") => {
    if (playingRef.current) return;
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
      } else if (type === "ting") {
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.15);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === "pop") {
        // Quick pop — ascending, bright
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "beep") {
        // Call ended — descending tone
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
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

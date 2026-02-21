import { useEffect, useRef, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FORFEIT_TIMEOUT = 60_000; // 60 seconds

/**
 * Hook to handle coin betting in games.
 * - Deducts bet on mount (backend-first)
 * - NO REFUNDS on disconnect. 60s reconnect window, then forfeit.
 * - Provides `settleBet` to call on game over with result
 */
export function useGameBet(betAmount: number) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const deducted = useRef(false);
  const [partnerDisconnected, setPartnerDisconnected] = useState(false);
  const forfeitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deduct bet on mount — backend-first
  useEffect(() => {
    if (betAmount > 0 && !deducted.current && profile?.id) {
      deducted.current = true;
      const currentCoins = profile?.coins ?? 0;
      supabase
        .from("profiles")
        .update({ coins: Math.max(0, currentCoins - betAmount) })
        .eq("id", profile.id)
        .then(({ error }) => {
          if (error) console.error("Failed to deduct bet:", error);
        });
    }
  }, [profile?.id]);

  // Cleanup forfeit timer
  useEffect(() => {
    return () => {
      if (forfeitTimerRef.current) clearTimeout(forfeitTimerRef.current);
    };
  }, []);

  /**
   * Call when partner disconnects during a game.
   * Starts a 60s countdown — if not cancelled, declares local user winner.
   */
  const onPartnerDisconnect = useCallback((onForfeitWin: () => void) => {
    setPartnerDisconnected(true);
    toast({ title: "⏳ Opponent disconnected", description: "Waiting 60s for reconnection...", duration: 5000 });
    forfeitTimerRef.current = setTimeout(() => {
      toast({ title: "🏆 Opponent forfeited!", description: "You win by default.", duration: 3000 });
      onForfeitWin();
    }, FORFEIT_TIMEOUT);
  }, [toast]);

  /** Call if partner reconnects within the 60s window */
  const onPartnerReconnect = useCallback(() => {
    setPartnerDisconnected(false);
    if (forfeitTimerRef.current) {
      clearTimeout(forfeitTimerRef.current);
      forfeitTimerRef.current = null;
    }
    toast({ title: "✅ Opponent reconnected!", duration: 2000 });
  }, [toast]);

  const settleBet = async (result: "win" | "lose" | "tie") => {
    if (betAmount <= 0 || !profile?.id) return;
    const { data } = await supabase.from("profiles").select("coins").eq("id", profile.id).single();
    const currentCoins = data?.coins ?? 0;

    if (result === "win") {
      const winnings = betAmount * 2;
      await supabase.from("profiles").update({ coins: currentCoins + winnings }).eq("id", profile.id);
      toast({ title: `🎉 You won ${winnings} coins!`, duration: 3000 });
    } else if (result === "tie") {
      // NO REFUNDS per Founder's rule — tie = both lose their bet
      toast({ title: `🤝 It's a tie! No refunds.`, duration: 3000 });
    } else {
      toast({ title: `😔 You lost ${betAmount} coins`, duration: 3000 });
    }
  };

  return { settleBet, betAmount, partnerDisconnected, onPartnerDisconnect, onPartnerReconnect };
}

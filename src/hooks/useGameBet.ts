import { useEffect, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to handle coin betting in games.
 * - Deducts bet on mount (backend-first)
 * - Provides `settleBet` to call on game over with result
 */
export function useGameBet(betAmount: number) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const deducted = useRef(false);

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

  const settleBet = async (result: "win" | "lose" | "tie") => {
    if (betAmount <= 0 || !profile?.id) return;
    // Re-fetch current coins to avoid stale state
    const { data } = await supabase.from("profiles").select("coins").eq("id", profile.id).single();
    const currentCoins = data?.coins ?? 0;

    if (result === "win") {
      const winnings = betAmount * 2;
      await supabase.from("profiles").update({ coins: currentCoins + winnings }).eq("id", profile.id);
      toast({ title: `🎉 You won ${winnings} coins!`, duration: 3000 });
    } else if (result === "tie") {
      await supabase.from("profiles").update({ coins: currentCoins + betAmount }).eq("id", profile.id);
      toast({ title: "🤝 It's a tie! Bet refunded.", duration: 3000 });
    } else {
      toast({ title: `😔 You lost ${betAmount} coins`, duration: 3000 });
    }
  };

  return { settleBet, betAmount };
}

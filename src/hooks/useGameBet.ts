import { useEffect, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to handle coin betting in games.
 * - Deducts bet on mount
 * - Provides `settlebet` to call on game over with result
 */
export function useGameBet(betAmount: number) {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const deducted = useRef(false);

  // Deduct bet on mount
  useEffect(() => {
    if (betAmount > 0 && !deducted.current) {
      deducted.current = true;
      const currentCoins = profile?.coins ?? 0;
      updateProfile({ coins: Math.max(0, currentCoins - betAmount) });
    }
  }, []);

  const settleBet = (result: "win" | "lose" | "tie") => {
    if (betAmount <= 0) return;
    const currentCoins = profile?.coins ?? 0;
    if (result === "win") {
      const winnings = betAmount * 2;
      updateProfile({ coins: currentCoins + winnings });
      toast({ title: `🎉 You won ${winnings} coins!`, duration: 3000 });
    } else if (result === "tie") {
      updateProfile({ coins: currentCoins + betAmount });
      toast({ title: "🤝 It's a tie! Bet refunded.", duration: 3000 });
    } else {
      toast({ title: `😔 You lost ${betAmount} coins`, duration: 3000 });
    }
  };

  return { settleBet, betAmount };
}

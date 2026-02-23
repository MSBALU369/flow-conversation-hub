import { useEffect, useRef, useCallback } from "react";
import { useProfile } from "./useProfile";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";

const DRAIN_INTERVAL_MS = 5 * 60 * 1000; // Drain 1 bar every 5 minutes
const RECHARGE_INTERVAL_MS = 60 * 60 * 1000; // Recharge 1 bar every hour
const MAX_BARS = 7;
const LOW_ENERGY_THRESHOLD = 2; // Warning at 2 bars (~28%)
const COIN_RECHARGE_COST = 10; // 10 coins = full recharge

/**
 * Real-time energy bar system.
 * - Drains 1 bar every 5 min while `isDraining` is true (call/room active).
 * - Auto-recharges 1 bar/hour when idle.
 * - Provides `rechargeWithCoins` for instant full recharge.
 * - Returns `energyBars`, `isLowEnergy`, `isEmptyEnergy`.
 */
export function useEnergySystem({ isDraining = false }: { isDraining?: boolean } = {}) {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const drainRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rechargeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const energyBars = profile?.energy_bars ?? MAX_BARS;
  const isPremium = profile?.is_premium ?? false;
  const isLowEnergy = !isPremium && energyBars <= LOW_ENERGY_THRESHOLD && energyBars > 0;
  const isEmptyEnergy = !isPremium && energyBars <= 0;

  // Check grace period (first 7 days)
  const isInGracePeriod = profile?.created_at
    ? (Date.now() - new Date(profile.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  // Drain energy during active call/room
  useEffect(() => {
    if (!isDraining || isPremium || isInGracePeriod || !profile?.id) return;

    drainRef.current = setInterval(async () => {
      const currentBars = profile?.energy_bars ?? MAX_BARS;
      if (currentBars <= 0) return;

      const newBars = Math.max(0, currentBars - 1);
      await supabase
        .from("profiles")
        .update({ energy_bars: newBars })
        .eq("id", profile.id);
      // Realtime subscription in useProfile will sync state
    }, DRAIN_INTERVAL_MS);

    return () => {
      if (drainRef.current) clearInterval(drainRef.current);
    };
  }, [isDraining, isPremium, isInGracePeriod, profile?.id, profile?.energy_bars]);

  // Auto-recharge when NOT draining (idle)
  useEffect(() => {
    if (isDraining || isPremium || !profile?.id) return;

    rechargeRef.current = setInterval(async () => {
      const currentBars = profile?.energy_bars ?? MAX_BARS;
      if (currentBars >= MAX_BARS) return;

      const newBars = Math.min(MAX_BARS, currentBars + 1);
      await supabase
        .from("profiles")
        .update({ energy_bars: newBars })
        .eq("id", profile.id);
    }, RECHARGE_INTERVAL_MS);

    return () => {
      if (rechargeRef.current) clearInterval(rechargeRef.current);
    };
  }, [isDraining, isPremium, profile?.id, profile?.energy_bars]);

  // Recharge with coins (instant full recharge)
  const rechargeWithCoins = useCallback(async () => {
    if (!profile?.id) return false;
    const currentCoins = profile.coins ?? 0;
    if (currentCoins < COIN_RECHARGE_COST) {
      toast({ title: "Not enough coins", description: `You need ${COIN_RECHARGE_COST} coins to recharge.`, variant: "destructive" });
      return false;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        energy_bars: MAX_BARS,
        coins: currentCoins - COIN_RECHARGE_COST,
      })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Recharge failed", variant: "destructive" });
      return false;
    }

    toast({ title: "⚡ Fully Recharged!", description: `${COIN_RECHARGE_COST} coins used.` });
    return true;
  }, [profile?.id, profile?.coins, toast]);

  return {
    energyBars,
    maxBars: MAX_BARS,
    isLowEnergy,
    isEmptyEnergy,
    isPremium,
    isInGracePeriod,
    rechargeWithCoins,
    coinRechargeCoast: COIN_RECHARGE_COST,
  };
}

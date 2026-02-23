import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Battery, Play, Volume2, Coins } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useEnergySystem } from "@/hooks/useEnergySystem";

export function BatteryWarningModal() {
  const { profile } = useProfile();
  const { isLowEnergy, isEmptyEnergy, rechargeWithCoins, coinRechargeCoast, isInGracePeriod, isPremium, energyBars } = useEnergySystem();
  const [open, setOpen] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  // Show warning when energy is low or empty (not premium, not grace period)
  useEffect(() => {
    if (!isPremium && !isInGracePeriod && (isLowEnergy || isEmptyEnergy)) {
      setOpen(true);
    }
  }, [isLowEnergy, isEmptyEnergy, isPremium, isInGracePeriod]);

  // Simulate ad playback — recharge 1 bar
  useEffect(() => {
    if (!adPlaying) return;
    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setAdPlaying(false);
          // Recharge 1 battery bar via direct DB update
          if (profile?.id) {
            import("@/integrations/supabase/client").then(({ supabase }) => {
              supabase
                .from("profiles")
                .update({ energy_bars: Math.min((profile.energy_bars ?? 0) + 1, 7) })
                .eq("id", profile.id)
                .then();
            });
          }
          setOpen(false);
          return 100;
        }
        return prev + (100 / 30); // 30 seconds
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [adPlaying]);

  if (!profile || isPremium || isInGracePeriod) return null;

  const handleCoinRecharge = async () => {
    const success = await rechargeWithCoins();
    if (success) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Battery className="w-5 h-5" />
            {isEmptyEnergy ? "Battery Empty!" : "Low Battery!"}
          </DialogTitle>
        </DialogHeader>
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-destructive/20 flex items-center justify-center">
            <Battery className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-sm text-foreground font-medium mb-1">
            {isEmptyEnergy
              ? "Your battery is fully down"
              : `Battery low — ${energyBars} bar${energyBars !== 1 ? "s" : ""} remaining`}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Watch a 30s ad for +1 bar, or use {coinRechargeCoast} coins for a full recharge
          </p>

          {adPlaying ? (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <Volume2 className="w-6 h-6 text-primary" />
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${adProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{Math.round(adProgress)}%</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={() => { setAdPlaying(true); setAdProgress(0); }}
                className="w-full gap-2"
              >
                <Play className="w-4 h-4" />
                Watch Ad (+1 Bar)
              </Button>
              <Button
                variant="outline"
                onClick={handleCoinRecharge}
                className="w-full gap-2"
                disabled={(profile.coins ?? 0) < coinRechargeCoast}
              >
                <Coins className="w-4 h-4" />
                Full Recharge ({coinRechargeCoast} Coins)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

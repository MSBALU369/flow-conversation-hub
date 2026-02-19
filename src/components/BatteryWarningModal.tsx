import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Battery, Play, Volume2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export function BatteryWarningModal() {
  const { profile, updateProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  // Check if user is in grace period (first 7 days)
  const isInGracePeriod = profile?.created_at
    ? (Date.now() - new Date(profile.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  // Show warning when battery is 0 and not premium and not in grace period
  useEffect(() => {
    if (
      profile &&
      !profile.is_premium &&
      !isInGracePeriod &&
      (profile.energy_bars ?? 5) <= 0
    ) {
      setOpen(true);
    }
  }, [profile?.energy_bars, profile?.is_premium, isInGracePeriod]);

  // Simulate ad playback
  useEffect(() => {
    if (!adPlaying) return;
    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setAdPlaying(false);
          // Recharge 1 battery bar
          if (profile) {
            updateProfile({ energy_bars: Math.min((profile.energy_bars ?? 0) + 1, 7) });
          }
          setOpen(false);
          return 100;
        }
        return prev + (100 / 30); // 30 seconds
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [adPlaying]);

  if (!profile || profile.is_premium || isInGracePeriod) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Battery className="w-5 h-5" />
            Battery Empty!
          </DialogTitle>
        </DialogHeader>
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-destructive/20 flex items-center justify-center">
            <Battery className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-sm text-foreground font-medium mb-1">
            Your battery is fully down
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Watch a 30-second ad to recharge 1 battery bar
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
            <Button
              onClick={() => { setAdPlaying(true); setAdProgress(0); }}
              className="w-full gap-2"
            >
              <Play className="w-4 h-4" />
              Watch Ad to Recharge
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

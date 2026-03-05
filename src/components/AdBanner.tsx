import { useState } from "react";
import { ShieldAlert, Target, Lock, Flame, Crown, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AdBannerProps {
  variant?: "standard" | "compact";
  className?: string;
}

export function AdBanner({ variant = "standard", className = "" }: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <div className={`relative border border-dashed border-border rounded-xl bg-muted/30 ${className}`}>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-muted flex items-center justify-center z-10">
          
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
        






        
      </div>

      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">🛡️ Your Safe Space to Speak!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-foreground"><span className="font-semibold">Zero Tolerance:</span> Ignore bad talks. If someone misbehaves, just cut the call and hit 'Report'. We monitor and permanently ban toxic users.</p>
            </div>
            <div className="flex gap-3">
              <Target className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground"><span className="font-semibold">Eyes on the Prize:</span> Your goal is to be perfect in English. Focus only on that. Make mistakes and learn.</p>
            </div>
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground"><span className="font-semibold">Privacy First:</span> Never share your contact numbers or personal details with anyone. Stay anonymous.</p>
            </div>
            <div className="flex gap-3">
              <Flame className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground"><span className="font-semibold">Consistency is Magic:</span> Practice daily for perfection. Speaking regularly is the only way to fluency.</p>
            </div>
            <div className="flex gap-3">
              <Crown className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground"><span className="font-semibold">The VIP Shield:</span> Go premium to avoid unwanted stuff and connect only with verified, serious learners.</p>
            </div>
          </div>
          <Button className="w-full mt-6 bg-primary text-primary-foreground" onClick={() => setShowGuide(false)}>
            Got it, let's speak! 🎤
          </Button>
        </DialogContent>
      </Dialog>
    </>);

}
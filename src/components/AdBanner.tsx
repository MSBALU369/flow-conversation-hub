import { useState } from "react";
import { Play, Volume2, X } from "lucide-react";

interface AdBannerProps {
  variant?: "standard" | "compact";
  className?: string;
}

export function AdBanner({ variant = "standard", className = "" }: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={`relative border border-dashed border-border rounded-xl bg-muted/30 ${className}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-muted flex items-center justify-center z-10"
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
      <div className={`flex flex-col items-center justify-center gap-1.5 ${variant === "compact" ? "py-3 px-4" : "py-6 px-4"}`}>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Play className="w-4 h-4 text-primary fill-primary" />
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Ad Space — Sponsor Banner
        </p>
        <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60 bg-muted px-2 py-0.5 rounded">
          Advertisement
        </span>
      </div>
    </div>
  );
}

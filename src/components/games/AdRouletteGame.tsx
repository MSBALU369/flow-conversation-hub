import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Coins, Tv, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameCallBubble } from "./GameCallBubble";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

interface AdRouletteGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  partnerName: string;
  room?: any;
}

const PRIZES = [
  { label: "5", value: 5, color: "hsl(0, 70%, 55%)" },
  { label: "10", value: 10, color: "hsl(210, 70%, 55%)" },
  { label: "20", value: 20, color: "hsl(130, 60%, 45%)" },
  { label: "50", value: 50, color: "hsl(45, 90%, 50%)" },
  { label: "100", value: 100, color: "hsl(280, 60%, 55%)" },
  { label: "Try Again", value: 0, color: "hsl(0, 0%, 40%)" },
];

const SLICE_ANGLE = 360 / PRIZES.length;

export function AdRouletteGame({ onClose, onMinimize, partnerName, room }: AdRouletteGameProps) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [phase, setPhase] = useState<"idle" | "watching" | "spinning" | "result">("idle");
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<typeof PRIZES[0] | null>(null);
  const [spinsToday, setSpinsToday] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const MAX_SPINS = 5;

  const startAd = () => {
    if (spinsToday >= MAX_SPINS) {
      toast({ title: "⏳ Daily limit reached", description: "Come back tomorrow for more spins!", duration: 3000 });
      return;
    }
    setPhase("watching");
    // Simulate 3-second ad
    setTimeout(() => {
      spinWheel();
    }, 3000);
  };

  const spinWheel = () => {
    setPhase("spinning");
    
    // Pick random prize
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const selectedPrize = PRIZES[prizeIndex];
    
    // Calculate rotation: multiple full spins + land on prize
    // Prize at index 0 is at top, each slice is SLICE_ANGLE degrees
    // We want the pointer (at top) to land on the selected prize
    const prizeAngle = prizeIndex * SLICE_ANGLE + SLICE_ANGLE / 2;
    const extraSpins = 5 * 360; // 5 full rotations
    const finalRotation = rotation + extraSpins + (360 - prizeAngle);
    
    setRotation(finalRotation);
    
    setTimeout(() => {
      setPrize(selectedPrize);
      setPhase("result");
      setSpinsToday(prev => prev + 1);
      
      if (selectedPrize.value > 0) {
        awardCoins(selectedPrize.value);
      }
    }, 3500);
  };

  const awardCoins = async (amount: number) => {
    if (!profile?.id) return;
    const { data } = await supabase.from("profiles").select("coins").eq("id", profile.id).single();
    const currentCoins = data?.coins ?? 0;
    await supabase.from("profiles").update({ coins: currentCoins + amount }).eq("id", profile.id);
    toast({ title: `🎉 You won ${amount} coins!`, description: "Added to your balance", duration: 3000 });
  };

  const resetForNewSpin = () => {
    setPrize(null);
    setPhase("idle");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <span className="text-sm font-bold text-foreground">🎰 Ad Roulette</span>
        <span className="text-xs text-muted-foreground">{spinsToday}/{MAX_SPINS} spins today</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Ad Overlay */}
      {phase === "watching" && (
        <div className="absolute inset-0 z-60 bg-background flex flex-col items-center justify-center gap-4">
          <Tv className="w-16 h-16 text-primary animate-pulse" />
          <p className="text-lg font-bold text-foreground">Watching Sponsored Ad...</p>
          <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-[grow_3s_linear]" 
              style={{ animation: "grow 3s linear forwards" }} />
          </div>
          <p className="text-xs text-muted-foreground">Please wait 3 seconds</p>
        </div>
      )}

      {/* Wheel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        {/* Pointer */}
        <div className="relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-2xl">▼</div>
          
          {/* Spinning Wheel */}
          <div
            ref={wheelRef}
            className="relative rounded-full border-4 border-border shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
            style={{
              width: "min(75vw, 300px)",
              height: "min(75vw, 300px)",
              transform: `rotate(${rotation}deg)`,
              transition: phase === "spinning" ? "transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {PRIZES.map((p, i) => {
                const startAngle = i * SLICE_ANGLE;
                const endAngle = startAngle + SLICE_ANGLE;
                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);
                
                const x1 = 100 + 95 * Math.cos(startRad);
                const y1 = 100 + 95 * Math.sin(startRad);
                const x2 = 100 + 95 * Math.cos(endRad);
                const y2 = 100 + 95 * Math.sin(endRad);
                
                const largeArc = SLICE_ANGLE > 180 ? 1 : 0;
                
                const midAngle = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
                const labelX = 100 + 60 * Math.cos(midAngle);
                const labelY = 100 + 60 * Math.sin(midAngle);
                const textRotation = (startAngle + endAngle) / 2;
                
                return (
                  <g key={i}>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={p.color}
                      stroke="hsl(var(--border))"
                      strokeWidth="0.5"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize={p.value === 0 ? "8" : "14"}
                      fontWeight="bold"
                      transform={`rotate(${textRotation}, ${labelX}, ${labelY})`}
                    >
                      {p.value > 0 ? `${p.value}💎` : "🔄"}
                    </text>
                  </g>
                );
              })}
              {/* Center circle */}
              <circle cx="100" cy="100" r="18" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
              <text x="100" y="100" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="hsl(var(--foreground))" fontWeight="bold">
                SPIN
              </text>
            </svg>
          </div>
        </div>

        {/* Result */}
        {phase === "result" && prize && (
          <div className="text-center animate-scale-in space-y-2">
            {prize.value > 0 ? (
              <>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-[hsl(45,100%,50%)]" />
                  <span className="text-2xl font-bold text-foreground">+{prize.value} Coins!</span>
                  <Sparkles className="w-6 h-6 text-[hsl(45,100%,50%)]" />
                </div>
                <p className="text-xs text-muted-foreground">Added to your balance</p>
              </>
            ) : (
              <p className="text-lg font-semibold text-muted-foreground">Try Again! 🔄</p>
            )}
            <Button onClick={resetForNewSpin} variant="outline" size="sm" className="mt-2">
              {spinsToday < MAX_SPINS ? "Spin Again" : "Done"}
            </Button>
          </div>
        )}

        {/* Spin Button */}
        {phase === "idle" && (
          <Button
            onClick={startAd}
            disabled={spinsToday >= MAX_SPINS}
            className="gap-2 px-8 py-6 text-base"
          >
            <Tv className="w-5 h-5" />
            Watch Ad to Spin
          </Button>
        )}

        {phase === "spinning" && (
          <p className="text-sm font-semibold text-foreground animate-pulse">Spinning...</p>
        )}
      </div>

      {/* Footer info */}
      <div className="px-4 pb-3 safe-bottom text-center">
        <p className="text-[10px] text-muted-foreground">
          Watch a short ad to spin the wheel and win coins! Max {MAX_SPINS} spins per day.
        </p>
      </div>

      {/* CSS for ad progress animation */}
      <style>{`
        @keyframes grow {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Target, Coins } from "lucide-react";
import { GameCallBubble } from "./GameCallBubble";
import { cn } from "@/lib/utils";
import { useGameBet } from "@/hooks/useGameBet";
import { useGameSync } from "@/hooks/useGameSync";

interface ArcheryGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  betAmount?: number;
  partnerName: string;
  room?: any;
}

const TOTAL_SHOTS = 5;
const RING_SCORES = [10, 8, 6, 4, 2, 0]; // bullseye to miss

export function ArcheryGame({ onClose, onMinimize, betAmount = 0, partnerName }: ArcheryGameProps) {
  const { settleBet } = useGameBet(betAmount);
  const [myScore, setMyScore] = useState(0);
  const [partnerScore, setPartnerScore] = useState(0);
  const [shot, setShot] = useState(0);
  const [arrowPos, setArrowPos] = useState(50);
  const [moving, setMoving] = useState(true);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [partnerLastScore, setPartnerLastScore] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [settled, setSettled] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const dirRef = useRef(1);
  const speedRef = useRef(2);

  // Move arrow back and forth
  useEffect(() => {
    if (!moving || gameOver) return;
    const interval = setInterval(() => {
      setArrowPos(prev => {
        let next = prev + dirRef.current * speedRef.current;
        if (next >= 100 || next <= 0) dirRef.current *= -1;
        return Math.max(0, Math.min(100, next));
      });
    }, 30);
    return () => clearInterval(interval);
  }, [moving, gameOver]);

  // Increase speed each shot
  useEffect(() => {
    speedRef.current = 2 + shot * 0.5;
  }, [shot]);

  const calculateScore = (position: number): number => {
    const distFromCenter = Math.abs(position - 50);
    if (distFromCenter <= 5) return 10;
    if (distFromCenter <= 12) return 8;
    if (distFromCenter <= 20) return 6;
    if (distFromCenter <= 30) return 4;
    if (distFromCenter <= 40) return 2;
    return 0;
  };

  const handleShoot = () => {
    if (!moving || gameOver) return;
    setMoving(false);
    const score = calculateScore(arrowPos);
    setLastScore(score);
    setMyScore(s => s + score);

    // Partner shoots
    const pPos = 50 + (Math.random() - 0.5) * 60; // random position
    const pScore = calculateScore(pPos);
    setPartnerLastScore(pScore);
    setPartnerScore(s => s + pScore);
    setShowResult(true);

    setTimeout(() => {
      const nextShot = shot + 1;
      if (nextShot >= TOTAL_SHOTS) {
        setGameOver(true);
      } else {
        setShot(nextShot);
        setMoving(true);
        setShowResult(false);
        setLastScore(null);
        setPartnerLastScore(null);
      }
    }, 1500);
  };

  if (gameOver) {
    const won = myScore > partnerScore;
    const tied = myScore === partnerScore;
    if (!settled) { settleBet(won ? "win" : tied ? "tie" : "lose"); setSettled(true); }
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center", won ? "bg-[hsl(45,100%,50%)]/20" : tied ? "bg-primary/20" : "bg-destructive/20")}>
          <Trophy className={cn("w-10 h-10", won ? "text-[hsl(45,100%,50%)]" : tied ? "text-primary" : "text-destructive")} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{won ? "You Win! 🎉" : tied ? "It's a Tie! 🤝" : "You Lost 😔"}</h2>
        <div className="flex gap-8 mt-2">
          <div className="text-center"><p className="text-2xl font-bold text-primary">{myScore}</p><p className="text-xs text-muted-foreground">You</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-destructive">{partnerScore}</p><p className="text-xs text-muted-foreground">{partnerName}</p></div>
        </div>
        {betAmount > 0 && (
          <p className="text-sm font-semibold flex items-center gap-1">
            <Coins className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            {won ? `+${betAmount * 2} coins` : tied ? "Bet refunded" : `-${betAmount} coins`}
          </p>
        )}
        <Button onClick={onClose} className="mt-4 w-full max-w-[200px]">Back to Call</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <span className="text-xs font-bold text-foreground">🏹 Archery</span>
        <span className="text-xs font-bold text-primary">Shot {shot + 1}/{TOTAL_SHOTS}</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Scores */}
      <div className="flex justify-center gap-6 px-4 mb-4">
        <span className="text-xs text-primary font-bold">You: {myScore}</span>
        <span className="text-xs text-destructive font-bold">{partnerName}: {partnerScore}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* Target */}
        <div className="relative w-56 h-56">
          {/* Concentric rings */}
          {[100, 80, 60, 40, 20].map((size, i) => (
            <div key={i} className={cn(
              "absolute rounded-full border-2",
              i === 0 ? "border-muted bg-muted/20" :
              i === 1 ? "border-blue-400/40 bg-blue-400/10" :
              i === 2 ? "border-primary/40 bg-primary/10" :
              i === 3 ? "border-[hsl(45,100%,50%)]/40 bg-[hsl(45,100%,50%)]/10" :
              "border-destructive/60 bg-destructive/20"
            )} style={{
              width: `${size}%`, height: `${size}%`,
              top: `${(100 - size) / 2}%`, left: `${(100 - size) / 2}%`
            }} />
          ))}
          {/* Bullseye */}
          <div className="absolute w-3 h-3 rounded-full bg-destructive" style={{ top: "calc(50% - 6px)", left: "calc(50% - 6px)" }} />

          {/* Arrow indicator (only when not shot) */}
          {!showResult && (
            <div className="absolute top-full mt-4 w-full">
              <div className="relative h-2 bg-muted rounded-full">
                <div className="absolute w-4 h-4 rounded-full bg-primary -top-1 transition-none" style={{ left: `calc(${arrowPos}% - 8px)` }}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-lg">🏹</span>
                </div>
              </div>
            </div>
          )}

          {/* Show hit position */}
          {showResult && lastScore !== null && (
            <div className="absolute w-3 h-3" style={{
              left: `calc(${arrowPos}% - 6px)`,
              top: "calc(50% - 6px)"
            }}>
              <span className="text-lg">🎯</span>
            </div>
          )}
        </div>

        {/* Shot result */}
        {showResult && lastScore !== null && (
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-primary">You scored {lastScore}!</p>
            <p className="text-xs text-muted-foreground">{partnerName} scored {partnerLastScore}</p>
          </div>
        )}

        {/* Shoot button */}
        {!showResult && (
          <Button onClick={handleShoot} size="lg" className="w-full max-w-[200px] gap-2">
            <Target className="w-5 h-5" />
            Shoot!
          </Button>
        )}
      </div>
    </div>
  );
}

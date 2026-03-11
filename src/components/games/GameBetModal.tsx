import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Diamond, Zap } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const GAME_INFO: Record<string, { name: string; icon: string }> = {
  chess: { name: "Chess", icon: "♟️" },
  sudoku: { name: "Sudoku", icon: "🧩" },
  ludo: { name: "Ludo", icon: "🎲" },
  snakeandladder: { name: "Snake & Ladder", icon: "🐍" },
  wordchain: { name: "Word Chain", icon: "🔗" },
  wouldyourather: { name: "Would You Rather", icon: "🤔" },
  truthordare: { name: "Truth or Dare", icon: "🎯" },
  archery: { name: "Archery", icon: "🏹" },
};

interface GameBetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  onStart: (betAmount: number) => void;
}

export function GameBetModal({ open, onOpenChange, gameId, onStart }: GameBetModalProps) {
  const { profile } = useProfile();
  const coins = profile?.coins ?? 0;
  const [betAmount, setBetAmount] = useState<string>("10");
  const [isStarting, setIsStarting] = useState(false);
  const info = GAME_INFO[gameId] || { name: "Game", icon: "🎮" };

  const numericBet = Math.floor(Number(betAmount) || 0);
  const isValid = numericBet >= 1 && numericBet <= 1000 && numericBet <= coins;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg flex items-center gap-2">
            <span className="text-xl">{info.icon}</span> {info.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Diamond className="w-3.5 h-3.5 text-[hsl(45,100%,50%)]" />
              Bet FP (1 – 1000)
            </p>
            <Input
              type="number"
              min={1}
              max={1000}
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Enter bet amount"
              className="text-center text-lg font-bold"
            />
            <div className="flex justify-between mt-1.5">
              <p className="text-[10px] text-muted-foreground">
                You have <span className="font-bold text-foreground">{coins}</span> FP
              </p>
              <p className="text-[10px] text-muted-foreground">
                Win = <span className="font-bold text-[hsl(45,100%,50%)]">{numericBet * 2}</span> FP
              </p>
            </div>
            {numericBet > coins && (
              <p className="text-[10px] text-destructive font-semibold mt-1">Not enough Flow Points!</p>
            )}
            {betAmount !== "" && numericBet < 1 && (
              <p className="text-[10px] text-destructive font-semibold mt-1">Minimum bet is 1 FP</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                if (!isValid) return;
                setIsStarting(true);
                onStart(numericBet);
              }}
              disabled={isStarting || !isValid}
              className="w-full gap-2"
            >
              <Zap className="w-4 h-4" />
              {isStarting ? "Sending Invite..." : `Bet ${numericBet} FP & Invite`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

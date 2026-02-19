import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Zap } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const BET_OPTIONS = [0, 5, 10, 20, 50];

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
  const [betAmount, setBetAmount] = useState(0);
  const info = GAME_INFO[gameId] || { name: "Game", icon: "🎮" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg flex items-center gap-2">
            <span className="text-xl">{info.icon}</span> {info.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bet Amount */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[hsl(45,100%,50%)]" />
              Bet Coins
            </p>
            <div className="flex gap-2">
              {BET_OPTIONS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={amount > coins}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    betAmount === amount
                      ? "bg-[hsl(45,100%,50%)]/20 border border-[hsl(45,100%,50%)]/50 text-[hsl(45,100%,50%)]"
                      : amount > coins
                        ? "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {amount === 0 ? "Free" : amount}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              You have <span className="font-bold text-foreground">{coins}</span> coins. Win = bet × 2!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onStart(betAmount)}
            className="w-full gap-2"
          >
            <Zap className="w-4 h-4" />
            Start Game {betAmount > 0 && `(Bet ${betAmount} coins)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

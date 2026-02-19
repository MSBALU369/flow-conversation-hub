import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Zap } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const CATEGORIES = [
  { id: "all", label: "All Categories", emoji: "🎲" },
  { id: "general", label: "General Knowledge", emoji: "🌍" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "history", label: "History", emoji: "📜" },
  { id: "movies", label: "Movies & TV", emoji: "🎬" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "geography", label: "Geography", emoji: "🗺️" },
  { id: "news", label: "News & Current Affairs", emoji: "📰" },
  { id: "reasoning", label: "Reasoning", emoji: "🧩" },
];

const BET_OPTIONS = [0, 5, 10, 20, 50];

interface QuizBetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (category: string, betAmount: number) => void;
}

export function QuizBetModal({ open, onOpenChange, onStart }: QuizBetModalProps) {
  const { profile } = useProfile();
  const coins = profile?.coins ?? 0;
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [betAmount, setBetAmount] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg flex items-center gap-2">
            🧠 Quiz Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Selection */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Choose Category</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-2 rounded-lg text-xs text-left transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? "bg-primary/20 border border-primary/50 text-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[hsl(45,100%,50%)]" />
              Bet Coins (optional)
            </p>
            <div className="flex gap-2">
              {BET_OPTIONS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={amount > coins}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
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
            <p className="text-[10px] text-muted-foreground mt-1">
              You have <span className="font-bold text-foreground">{coins}</span> coins. Win = bet × 2!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onStart(selectedCategory, betAmount)}
            className="w-full gap-2"
          >
            <Zap className="w-4 h-4" />
            Start Quiz {betAmount > 0 && `(Bet ${betAmount} coins)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

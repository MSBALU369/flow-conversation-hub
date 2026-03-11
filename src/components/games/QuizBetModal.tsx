import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Diamond, Send } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const CATEGORIES = [
  { id: "all", label: "All-in-One (Mixed)", emoji: "🎲" },
  { id: "upsc", label: "UPSC & Politics", emoji: "🏛️" },
  { id: "medical", label: "Medical & Science", emoji: "🔬" },
  { id: "iit", label: "IIT & Tech", emoji: "💻" },
  { id: "gk", label: "GK & Current Affairs", emoji: "🌍" },
  { id: "movies", label: "Movies & Entertainment", emoji: "🎬" },
] as const;

interface QuizBetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (category: string, betAmount: number) => void;
}

export function QuizBetModal({ open, onOpenChange, onStart }: QuizBetModalProps) {
  const { profile } = useProfile();
  const coins = profile?.coins ?? 0;
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [betInput, setBetInput] = useState("10");

  const betAmount = Math.max(0, parseInt(betInput) || 0);
  const isValid = betAmount >= 1 && betAmount <= 1000 && betAmount <= coins;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg flex items-center gap-2">
            🧠 Quiz Battle Setup
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
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-2.5 rounded-lg text-xs text-left transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? "bg-primary/20 border border-primary/50 text-foreground font-semibold"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Bet Input */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Diamond className="w-3.5 h-3.5 text-[hsl(45,100%,50%)]" />
              Bet FP (1 – 1000)
            </p>
            <Input
              type="number"
              min={1}
              max={1000}
              value={betInput}
              onChange={(e) => setBetInput(e.target.value)}
              placeholder="Enter FP to bet"
              className="text-center text-lg font-bold"
            />
            <div className="flex justify-between mt-1.5">
              <p className="text-[10px] text-muted-foreground">
                Balance: <span className="font-bold text-foreground">{coins}</span> FP
              </p>
              {betAmount > coins && (
                <p className="text-[10px] text-destructive font-semibold">Not enough Flow Points!</p>
              )}
              {betAmount > 1000 && (
                <p className="text-[10px] text-destructive font-semibold">Max 1000</p>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              🏆 Winner takes <span className="font-bold text-[hsl(45,100%,50%)]">{betAmount * 2}</span> FP!
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => onStart(selectedCategory, betAmount)}
              disabled={!isValid}
              className="w-full gap-2"
            >
              <Send className="w-4 h-4" />
              Invite Opponent ({betAmount} coins)
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

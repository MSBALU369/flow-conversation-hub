import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Diamond, Check, X, Loader2 } from "lucide-react";

interface GameInviteDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  gameId: string;
  category: string;
  betAmount: number;
  partnerName: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "All-in-One (Mixed)",
  upsc: "UPSC & Politics",
  medical: "Medical & Science",
  iit: "IIT & Tech",
  gk: "GK & Current Affairs",
  movies: "Movies & Entertainment",
};

const GAME_NAMES: Record<string, { name: string; icon: string }> = {
  quiz: { name: "Quiz Battle", icon: "🧠" },
  chess: { name: "Chess", icon: "♟️" },
  ludo: { name: "Ludo", icon: "🎲" },
  snakeandladder: { name: "Snake & Ladder", icon: "🐍" },
  wordchain: { name: "Word Chain", icon: "🔗" },
  wouldyourather: { name: "Would You Rather", icon: "🤔" },
  truthordare: { name: "Truth or Dare", icon: "🎯" },
  archery: { name: "Archery", icon: "🏹" },
  sudoku: { name: "Sudoku", icon: "🧩" },
};

export function GameInviteDialog({ open, onAccept, onDecline, gameId, category, betAmount, partnerName }: GameInviteDialogProps) {
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const gameInfo = GAME_NAMES[gameId] || { name: "Game", icon: "🎮" };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onDecline(); }}>
      <DialogContent className="glass-card border-border max-w-[320px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg text-center">🎮 Game Invite!</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-3">
          <p className="text-sm text-foreground">
            <span className="font-bold">{partnerName}</span> wants to play
          </p>
          <div className="bg-primary/10 rounded-xl p-3">
            <p className="text-lg font-bold text-foreground">{gameInfo.icon} {gameInfo.name}</p>
            {category && gameId === 'quiz' && <p className="text-xs text-muted-foreground mt-1">{categoryLabel}</p>}
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Diamond className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            <span className="text-sm font-bold text-[hsl(45,100%,50%)]">{betAmount} FP</span>
            <span className="text-xs text-muted-foreground">each (Winner gets {betAmount * 2})</span>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onDecline} className="flex-1 gap-1">
            <X className="w-4 h-4" /> Decline
          </Button>
          <Button onClick={onAccept} className="flex-1 gap-1">
            <Check className="w-4 h-4" /> Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Waiting state shown to the host after sending invite */
export function GameInviteWaiting({ open, onCancel }: { open: boolean; onCancel: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="glass-card border-border max-w-[300px]" onInteractOutside={(e) => e.preventDefault()}>
        <div className="text-center space-y-4 py-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-sm font-semibold text-foreground">Waiting for opponent to accept...</p>
          <p className="text-xs text-muted-foreground">Invite sent via call</p>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

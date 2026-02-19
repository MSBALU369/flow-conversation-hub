import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gamepad2, Coins, Lock, Crown } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface GameListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGame: (game: string) => void;
}

const games = [
  {
    id: "quiz",
    name: "AI Quiz Battle",
    icon: "🧠",
    description: "Answer AI-generated questions. Bet coins!",
    available: true,
    premiumOnly: false,
  },
  {
    id: "chess",
    name: "Chess",
    icon: "♟️",
    description: "Classic strategy board game — challenge your partner",
    available: true,
    premiumOnly: false,
  },
  {
    id: "wordchain",
    name: "Word Chain",
    icon: "🔗",
    description: "Take turns saying words that start with the last letter",
    available: true,
    premiumOnly: false,
  },
  {
    id: "wouldyourather",
    name: "Would You Rather",
    icon: "🤔",
    description: "Fun dilemma questions to spark conversation",
    available: true,
    premiumOnly: false,
  },
  {
    id: "truthordare",
    name: "Truth or Dare",
    icon: "🎯",
    description: "Classic party game — premium only",
    available: true,
    premiumOnly: true,
  },
  {
    id: "ludo",
    name: "Ludo",
    icon: "🎲",
    description: "Roll the dice and race to the finish",
    available: true,
    premiumOnly: false,
  },
  {
    id: "snakeandladder",
    name: "Snake & Ladder",
    icon: "🐍",
    description: "Climb ladders and dodge snakes to win",
    available: true,
    premiumOnly: false,
  },
  {
    id: "archery",
    name: "Archery",
    icon: "🏹",
    description: "Aim and shoot — test your precision skills",
    available: true,
    premiumOnly: false,
  },
];

export function GameListModal({ open, onOpenChange, onSelectGame }: GameListModalProps) {
  const { profile } = useProfile();
  const isPremium = profile?.is_premium;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            In-Call Games
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {games.map((game) => {
            const locked = !game.available || (game.premiumOnly && !isPremium);
            return (
              <button
                key={game.id}
                onClick={() => !locked && onSelectGame(game.id)}
                disabled={locked}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  locked
                    ? "opacity-50 cursor-not-allowed bg-muted/30"
                    : "hover:bg-primary/10 bg-muted/50 active:scale-[0.98]"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl shrink-0">
                  {game.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground">{game.name}</p>
                    {game.premiumOnly && (
                      <Crown className="w-3.5 h-3.5 text-[hsl(45,100%,50%)]" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{game.description}</p>
                </div>
                {locked && (
                  <div className="shrink-0">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 pt-2 border-t border-border">
          <Coins className="w-3.5 h-3.5 text-[hsl(45,100%,50%)]" />
          <span className="text-[10px] text-muted-foreground">
            Your coins: <span className="font-bold text-foreground">{profile?.coins ?? 0}</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

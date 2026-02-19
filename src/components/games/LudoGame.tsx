import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { GameCallBubble } from "./GameCallBubble";
import { cn } from "@/lib/utils";

interface LudoGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  partnerName: string;
}

const TRACK_LENGTH = 30;
const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export function LudoGame({ onClose, onMinimize, partnerName }: LudoGameProps) {
  const [myPos, setMyPos] = useState(0);
  const [partnerPos, setPartnerPos] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [lastPartnerDice, setLastPartnerDice] = useState<number | null>(null);

  const rollDice = () => {
    if (rolling || gameOver) return;
    setRolling(true);
    setDiceValue(null);

    // Animate dice
    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 8) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setRolling(false);

        if (isMyTurn) {
          const newPos = Math.min(myPos + finalValue, TRACK_LENGTH);
          setMyPos(newPos);
          if (newPos >= TRACK_LENGTH) {
            setGameOver("You Win!");
            return;
          }
          setIsMyTurn(false);
          // Partner's turn
          setTimeout(() => {
            const pDice = Math.floor(Math.random() * 6) + 1;
            setLastPartnerDice(pDice);
            const newPPos = Math.min(partnerPos + pDice, TRACK_LENGTH);
            setPartnerPos(newPPos);
            if (newPPos >= TRACK_LENGTH) {
              setGameOver("You Lost!");
              return;
            }
            setIsMyTurn(true);
          }, 1200);
        }
      }
    }, 100);
  };

  const DiceIcon = diceValue ? DICE_ICONS[diceValue - 1] : Dice1;

  if (gameOver) {
    const won = gameOver.includes("Win");
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center", won ? "bg-[hsl(45,100%,50%)]/20" : "bg-destructive/20")}>
          <Trophy className={cn("w-10 h-10", won ? "text-[hsl(45,100%,50%)]" : "text-destructive")} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{gameOver} {won ? "🎉" : "😔"}</h2>
        <Button onClick={onClose} className="mt-4 w-full max-w-[200px]">Back to Call</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <span className="text-xs font-bold text-foreground">🎲 Ludo Race</span>
        <span className={cn("text-xs font-bold", isMyTurn ? "text-primary" : "text-muted-foreground")}>
          {isMyTurn ? "Your turn — Roll!" : `${partnerName} rolling...`}
        </span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Track visualization */}
        <div className="w-full max-w-[320px] space-y-4">
          {/* You */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-primary">You</span>
              <span className="text-xs text-muted-foreground">{myPos}/{TRACK_LENGTH}</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden relative">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(myPos / TRACK_LENGTH) * 100}%` }} />
              {myPos > 0 && myPos < TRACK_LENGTH && (
                <div className="absolute top-0 h-full flex items-center" style={{ left: `${(myPos / TRACK_LENGTH) * 100}%`, transform: "translateX(-50%)" }}>
                  <span className="text-sm">🏃</span>
                </div>
              )}
            </div>
          </div>

          {/* Partner */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-destructive">{partnerName}</span>
              <span className="text-xs text-muted-foreground">{partnerPos}/{TRACK_LENGTH}</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden relative">
              <div className="h-full bg-destructive rounded-full transition-all duration-500" style={{ width: `${(partnerPos / TRACK_LENGTH) * 100}%` }} />
              {partnerPos > 0 && partnerPos < TRACK_LENGTH && (
                <div className="absolute top-0 h-full flex items-center" style={{ left: `${(partnerPos / TRACK_LENGTH) * 100}%`, transform: "translateX(-50%)" }}>
                  <span className="text-sm">🏃</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dice */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={rollDice}
            disabled={!isMyTurn || rolling}
            className={cn(
              "w-24 h-24 rounded-2xl flex items-center justify-center transition-all",
              isMyTurn && !rolling ? "bg-primary/20 border-2 border-primary/40 hover:bg-primary/30 active:scale-90" : "bg-muted/30 border-2 border-transparent",
              rolling && "animate-bounce"
            )}
          >
            <DiceIcon className={cn("w-12 h-12", isMyTurn ? "text-primary" : "text-muted-foreground")} />
          </button>
          {!isMyTurn && lastPartnerDice && (
            <p className="text-xs text-muted-foreground">{partnerName} rolled a {lastPartnerDice}</p>
          )}
          {isMyTurn && <p className="text-xs text-muted-foreground">Tap the dice to roll!</p>}
        </div>

        {/* Finish line */}
        <div className="text-center">
          <span className="text-2xl">🏁</span>
          <p className="text-xs text-muted-foreground">First to {TRACK_LENGTH} wins!</p>
        </div>
      </div>
    </div>
  );
}

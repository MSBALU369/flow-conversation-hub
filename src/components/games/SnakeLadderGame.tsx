import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SnakeLadderGameProps {
  onClose: () => void;
  partnerName: string;
}

const BOARD_SIZE = 50;
const SNAKES: Record<number, number> = { 47: 19, 38: 12, 33: 6, 25: 9, 44: 22 };
const LADDERS: Record<number, number> = { 3: 21, 8: 26, 14: 32, 28: 42, 36: 48 };
const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export function SnakeLadderGame({ onClose, partnerName }: SnakeLadderGameProps) {
  const [myPos, setMyPos] = useState(0);
  const [partnerPos, setPartnerPos] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const processMove = (pos: number, roll: number, isPlayer: boolean): number => {
    let newPos = Math.min(pos + roll, BOARD_SIZE);
    if (SNAKES[newPos]) {
      setMessage(`${isPlayer ? "You" : partnerName} hit a snake! 🐍 ${newPos} → ${SNAKES[newPos]}`);
      newPos = SNAKES[newPos];
    } else if (LADDERS[newPos]) {
      setMessage(`${isPlayer ? "You" : partnerName} found a ladder! 🪜 ${newPos} → ${LADDERS[newPos]}`);
      newPos = LADDERS[newPos];
    } else {
      setMessage(null);
    }
    return newPos;
  };

  const rollDice = () => {
    if (rolling || gameOver) return;
    setRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 8) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setRolling(false);

        const newPos = processMove(myPos, finalValue, true);
        setMyPos(newPos);
        if (newPos >= BOARD_SIZE) { setGameOver("You Win!"); return; }

        setIsMyTurn(false);
        setTimeout(() => {
          const pDice = Math.floor(Math.random() * 6) + 1;
          setDiceValue(pDice);
          const newPPos = processMove(partnerPos, pDice, false);
          setPartnerPos(newPPos);
          if (newPPos >= BOARD_SIZE) { setGameOver("You Lost!"); return; }
          setIsMyTurn(true);
        }, 1500);
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

  // Render simplified board
  const cells = [];
  for (let i = BOARD_SIZE; i >= 1; i--) {
    const isSnake = SNAKES[i];
    const isLadder = LADDERS[i];
    const hasMe = myPos === i;
    const hasPartner = partnerPos === i;
    cells.push(
      <div key={i} className={cn(
        "aspect-square flex flex-col items-center justify-center text-[8px] rounded-sm relative",
        isSnake ? "bg-destructive/20" : isLadder ? "bg-green-500/20" : "bg-muted/40",
        hasMe && "ring-2 ring-primary",
        hasPartner && "ring-2 ring-destructive",
      )}>
        <span className="font-mono">{i}</span>
        {isSnake && <span className="text-[10px] absolute -top-0.5">🐍</span>}
        {isLadder && <span className="text-[10px] absolute -top-0.5">🪜</span>}
        {hasMe && <span className="text-[10px]">🔵</span>}
        {hasPartner && <span className="text-[10px]">🔴</span>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <span className="text-xs font-bold text-foreground">🐍 Snake & Ladder</span>
        <span className={cn("text-xs font-bold", isMyTurn ? "text-primary" : "text-muted-foreground")}>
          {isMyTurn ? "Your turn" : `${partnerName}'s turn`}
        </span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Scores */}
      <div className="flex justify-center gap-6 px-4 mb-2">
        <span className="text-xs text-primary font-bold">🔵 You: {myPos}/{BOARD_SIZE}</span>
        <span className="text-xs text-destructive font-bold">🔴 {partnerName}: {partnerPos}/{BOARD_SIZE}</span>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-start justify-center px-3 overflow-y-auto">
        <div className="grid grid-cols-10 gap-0.5 w-full max-w-[340px]">
          {cells}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="px-4 py-1 text-center">
          <p className="text-xs font-semibold text-foreground">{message}</p>
        </div>
      )}

      {/* Dice */}
      <div className="flex flex-col items-center gap-2 py-3 safe-bottom">
        <button
          onClick={rollDice}
          disabled={!isMyTurn || rolling}
          className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center transition-all",
            isMyTurn && !rolling ? "bg-primary/20 border-2 border-primary/40 active:scale-90" : "bg-muted/30 border-2 border-transparent",
            rolling && "animate-bounce"
          )}
        >
          <DiceIcon className={cn("w-8 h-8", isMyTurn ? "text-primary" : "text-muted-foreground")} />
        </button>
        <p className="text-[10px] text-muted-foreground">🐍 = Go down · 🪜 = Go up</p>
      </div>
    </div>
  );
}

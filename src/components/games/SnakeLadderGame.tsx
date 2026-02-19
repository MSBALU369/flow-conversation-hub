import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Coins } from "lucide-react";
import { GameCallBubble } from "./GameCallBubble";
import { cn } from "@/lib/utils";
import { useGameBet } from "@/hooks/useGameBet";

interface SnakeLadderGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  betAmount?: number;
  partnerName: string;
}

const BOARD_SIZE = 100;

// Classic snakes (head → tail)
const SNAKES: Record<number, number> = {
  99: 54, 95: 75, 92: 51, 83: 19, 73: 1, 64: 36, 48: 30, 44: 22, 34: 6, 16: 4,
};

// Classic ladders (bottom → top)
const LADDERS: Record<number, number> = {
  2: 38, 7: 14, 8: 31, 15: 26, 21: 42, 28: 84, 36: 57, 51: 67, 62: 81, 71: 91, 78: 98,
};

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

// Convert position (1-100) to row/col for display (bottom-left = 1, snake pattern)
function posToRowCol(pos: number): { row: number; col: number } {
  const p = pos - 1;
  const row = 9 - Math.floor(p / 10);
  const colInRow = p % 10;
  const col = (9 - Math.floor(p / 10)) % 2 === 0 ? colInRow : 9 - colInRow;
  // Actually: row 0 is top (91-100), row 9 is bottom (1-10)
  // pos 1-10 → row 9, pos 11-20 → row 8, etc.
  const r = 9 - Math.floor(p / 10);
  const rowFromBottom = Math.floor(p / 10);
  const c = rowFromBottom % 2 === 0 ? colInRow : 9 - colInRow;
  return { row: r, col: c };
}

// Build board numbers in display order (row 0 = top = 100-91, row 9 = bottom = 1-10)
function getBoardNumber(row: number, col: number): number {
  const rowFromBottom = 9 - row;
  if (rowFromBottom % 2 === 0) {
    return rowFromBottom * 10 + col + 1;
  } else {
    return rowFromBottom * 10 + (9 - col) + 1;
  }
}

export function SnakeLadderGame({ onClose, onMinimize, betAmount = 0, partnerName }: SnakeLadderGameProps) {
  const { settleBet } = useGameBet(betAmount);
  const [myPos, setMyPos] = useState(0);
  const [partnerPos, setPartnerPos] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastPartnerDice, setLastPartnerDice] = useState<number | null>(null);

  const processMove = (pos: number, roll: number, isPlayer: boolean): number => {
    let newPos = pos + roll;
    if (newPos > BOARD_SIZE) return pos; // Must land exactly on 100
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
          setLastPartnerDice(pDice);
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
    if (!settled) { settleBet(won ? "win" : "lose"); setSettled(true); }
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center", won ? "bg-[hsl(45,100%,50%)]/20" : "bg-destructive/20")}>
          <Trophy className={cn("w-10 h-10", won ? "text-[hsl(45,100%,50%)]" : "text-destructive")} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{gameOver} {won ? "🎉" : "😔"}</h2>
        {betAmount > 0 && (
          <p className="text-sm font-semibold flex items-center gap-1">
            <Coins className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            {won ? `+${betAmount * 2} coins` : `-${betAmount} coins`}
          </p>
        )}
        <Button onClick={onClose} className="mt-4 w-full max-w-[200px]">Back to Call</Button>
      </div>
    );
  }

  // Build the 10x10 board
  const boardCells = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const num = getBoardNumber(row, col);
      const isSnakeHead = SNAKES[num] !== undefined;
      const isSnakeTail = Object.values(SNAKES).includes(num);
      const isLadderBottom = LADDERS[num] !== undefined;
      const isLadderTop = Object.values(LADDERS).includes(num);
      const hasMe = myPos === num;
      const hasPartner = partnerPos === num;
      const isSpecial = isSnakeHead || isLadderBottom;

      boardCells.push(
        <div
          key={num}
          className={cn(
            "aspect-square flex flex-col items-center justify-center relative text-[7px] leading-none",
            isSnakeHead ? "bg-destructive/25" :
            isLadderBottom ? "bg-green-500/25" :
            (row + col) % 2 === 0 ? "bg-muted/30" : "bg-muted/50",
          )}
        >
          <span className={cn(
            "font-mono font-bold",
            isSnakeHead ? "text-destructive" : isLadderBottom ? "text-green-400" : "text-muted-foreground"
          )}>
            {num}
          </span>
          {isSnakeHead && (
            <span className="text-[8px] leading-none">🐍→{SNAKES[num]}</span>
          )}
          {isLadderBottom && (
            <span className="text-[8px] leading-none">🪜→{LADDERS[num]}</span>
          )}
          {/* Player tokens */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5">
            {hasMe && <span className="text-[10px]">🔵</span>}
            {hasPartner && <span className="text-[10px]">🔴</span>}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />
      <div className="flex items-center justify-between px-4 py-2 safe-top">
        <span className="text-xs font-bold text-foreground">🐍 Snake & Ladder</span>
        <span className={cn("text-xs font-bold", isMyTurn ? "text-primary" : "text-muted-foreground")}>
          {isMyTurn ? "Your turn" : `${partnerName}'s turn`}
        </span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Scores */}
      <div className="flex justify-center gap-6 px-4 mb-1">
        <span className="text-[10px] text-primary font-bold">🔵 You: {myPos}/{BOARD_SIZE}</span>
        <span className="text-[10px] text-destructive font-bold">🔴 {partnerName}: {partnerPos}/{BOARD_SIZE}</span>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-start justify-center px-2 overflow-y-auto">
        <div className="grid grid-cols-10 gap-0 w-full max-w-[360px] border border-foreground/20 rounded-lg overflow-hidden">
          {boardCells}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="px-4 py-1 text-center">
          <p className="text-xs font-semibold text-foreground animate-fade-in">{message}</p>
        </div>
      )}

      {/* Dice & Controls */}
      <div className="flex items-center justify-center gap-4 py-2 safe-bottom">
        <button
          onClick={rollDice}
          disabled={!isMyTurn || rolling}
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center transition-all",
            isMyTurn && !rolling ? "bg-primary/20 border-2 border-primary/40 active:scale-90" : "bg-muted/30 border-2 border-transparent",
            rolling && "animate-bounce"
          )}
        >
          <DiceIcon className={cn("w-7 h-7", isMyTurn ? "text-primary" : "text-muted-foreground")} />
        </button>
        <div className="text-center">
          {!isMyTurn && lastPartnerDice && (
            <p className="text-[10px] text-muted-foreground">{partnerName} rolled {lastPartnerDice}</p>
          )}
          {isMyTurn && <p className="text-[10px] text-muted-foreground">Tap dice to roll!</p>}
          <p className="text-[8px] text-muted-foreground mt-0.5">🐍 = Down · 🪜 = Up · Land on 100 to win</p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Diamond } from "lucide-react";
import { GameCallBubble } from "./GameCallBubble";
import { cn } from "@/lib/utils";
import { useGameSync } from "@/hooks/useGameSync";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

interface SnakeLadderGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  betAmount?: number;
  partnerName: string;
  room?: any;
  isHost?: boolean;
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
const MOVE_TIME = 60;

function getBoardNumber(row: number, col: number): number {
  const rowFromBottom = 9 - row;
  if (rowFromBottom % 2 === 0) return rowFromBottom * 10 + col + 1;
  return rowFromBottom * 10 + (9 - col) + 1;
}

export function SnakeLadderGame({ onClose, onMinimize, betAmount = 0, partnerName, room, isHost = true }: SnakeLadderGameProps) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const { sendMessage, onMessage } = useGameSync<any>(room || null, "snakeladder");

  const [myPos, setMyPos] = useState(0);
  const [partnerPos, setPartnerPos] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(isHost);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [gameOver, setGameOver] = useState<{ result: string; won: boolean } | null>(null);
  const [settled, setSettled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(MOVE_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameOverRef = useRef(false);

  // Listen for opponent moves
  useEffect(() => {
    return onMessage("GAME_MOVE", (msg: any) => {
      if (msg.game !== "snakeladder" || !msg.data) return;
      const { action, dice, newPos } = msg.data;

      if (action === "ROLL_AND_MOVE") {
        setDiceValue(dice);
        const oldPos = partnerPos;
        let landed = oldPos + dice;
        if (landed > BOARD_SIZE) {
          setMessage(`${partnerName} rolled ${dice} — stays at ${oldPos}`);
          // Turn passes back
        } else {
          if (SNAKES[landed]) {
            setMessage(`${partnerName} hit a snake! 🐍 ${landed} → ${SNAKES[landed]}`);
            landed = SNAKES[landed];
          } else if (LADDERS[landed]) {
            setMessage(`${partnerName} found a ladder! 🪜 ${landed} → ${LADDERS[landed]}`);
            landed = LADDERS[landed];
          } else {
            setMessage(`${partnerName} rolled ${dice} → moved to ${landed}`);
          }
          setPartnerPos(landed);
          if (landed >= BOARD_SIZE) {
            handleGameEnd("You Lost!", false);
            return;
          }
        }
        // My turn now
        setIsMyTurn(true);
        setTimeLeft(MOVE_TIME);
      } else if (action === "TIMEOUT_LOSS") {
        handleGameEnd("Opponent timed out — You Win!", true);
      }
    });
  }, [onMessage, partnerPos, partnerName]);

  // 60s turn timer
  useEffect(() => {
    if (gameOverRef.current || gameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setTimeLeft(MOVE_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (isMyTurn) {
            sendMessage({ type: 'GAME_MOVE', game: 'snakeladder', data: { action: 'TIMEOUT_LOSS' } });
            handleGameEnd("Time's up — You Lost!", false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isMyTurn, gameOver]);

  const handleGameEnd = useCallback(async (result: string, won: boolean) => {
    if (gameOverRef.current || settled) return;
    gameOverRef.current = true;
    setGameOver({ result, won });
    setSettled(true);

    if (betAmount > 0 && profile?.id) {
      const { data } = await supabase.from("profiles").select("coins").eq("id", profile.id).single();
      const currentCoins = data?.coins ?? 0;
      if (won) {
        await supabase.from("profiles").update({ coins: currentCoins + betAmount * 2 }).eq("id", profile.id);
        toast({ title: `🎉 You won ${betAmount * 2} coins!`, duration: 3000 });
      } else {
        toast({ title: `💀 You lost ${betAmount} coins`, duration: 3000 });
      }
    }
    setTimeout(() => onClose(), 5000);
  }, [settled, betAmount, profile?.id, toast, onClose]);

  const rollDice = () => {
    if (rolling || !isMyTurn || gameOverRef.current) return;
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

        let newPos = myPos + finalValue;
        if (newPos > BOARD_SIZE) {
          setMessage(`You rolled ${finalValue} — stay at ${myPos}`);
          newPos = myPos; // Stay in place
        } else {
          if (SNAKES[newPos]) {
            setMessage(`You hit a snake! 🐍 ${newPos} → ${SNAKES[newPos]}`);
            newPos = SNAKES[newPos];
          } else if (LADDERS[newPos]) {
            setMessage(`You found a ladder! 🪜 ${newPos} → ${LADDERS[newPos]}`);
            newPos = LADDERS[newPos];
          } else {
            setMessage(`You rolled ${finalValue} → moved to ${newPos}`);
          }
        }

        setMyPos(newPos);

        // Send move to opponent
        sendMessage({
          type: 'GAME_MOVE',
          game: 'snakeladder',
          data: { action: 'ROLL_AND_MOVE', dice: finalValue, newPos },
        });

        if (newPos >= BOARD_SIZE) {
          handleGameEnd("You Win! 🎉", true);
          return;
        }

        // Pass turn
        setIsMyTurn(false);
        setTimeLeft(MOVE_TIME);
      }
    }, 100);
  };

  const DiceIcon = diceValue ? DICE_ICONS[diceValue - 1] : Dice1;

  if (gameOver) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center", gameOver.won ? "bg-[hsl(45,100%,50%)]/20" : "bg-destructive/20")}>
          <Trophy className={cn("w-10 h-10", gameOver.won ? "text-[hsl(45,100%,50%)]" : "text-destructive")} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{gameOver.result}</h2>
        {betAmount > 0 && (
          <p className="text-sm font-semibold flex items-center gap-1">
            <Diamond className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            {gameOver.won ? `+${betAmount * 2} FP` : `-${betAmount} FP`}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Closing in a few seconds...</p>
        <Button onClick={onClose} className="mt-2">Back to Call</Button>
      </div>
    );
  }

  // Build the 10x10 board
  const boardCells = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const num = getBoardNumber(row, col);
      const isSnakeHead = SNAKES[num] !== undefined;
      const isLadderBottom = LADDERS[num] !== undefined;
      const hasMe = myPos === num;
      const hasPartner = partnerPos === num;

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
          {isSnakeHead && <span className="text-[8px] leading-none">🐍→{SNAKES[num]}</span>}
          {isLadderBottom && <span className="text-[8px] leading-none">🪜→{LADDERS[num]}</span>}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5">
            {hasMe && <span className="text-[10px]">🔵</span>}
            {hasPartner && <span className="text-[10px]">🔴</span>}
          </div>
        </div>
      );
    }
  }

  const timerPercent = (timeLeft / MOVE_TIME) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />
      <div className="flex items-center justify-between px-4 py-2 safe-top">
        <span className="text-xs font-bold text-foreground">🐍 Snake & Ladder</span>
        <span className={cn("text-xs font-bold", isMyTurn ? "text-primary" : "text-muted-foreground")}>
          {isMyTurn ? "Your turn" : `${partnerName}'s turn`}
        </span>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Timer */}
      <div className="px-4 mb-1">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", timeLeft <= 10 ? "bg-destructive" : timeLeft <= 30 ? "bg-[hsl(45,100%,50%)]" : "bg-primary")}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
        <p className={cn("text-[10px] font-mono text-right mt-0.5", timeLeft <= 10 ? "text-destructive" : "text-muted-foreground")}>{timeLeft}s</p>
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
          type="button"
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
          {!isMyTurn && <p className="text-[10px] text-muted-foreground">{partnerName} is playing...</p>}
          {isMyTurn && <p className="text-[10px] text-muted-foreground">Tap dice to roll!</p>}
          <p className="text-[8px] text-muted-foreground mt-0.5">🐍 = Down · 🪜 = Up · Land exactly on 100 to win</p>
        </div>
      </div>
    </div>
  );
}

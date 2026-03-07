import { useState, useEffect, useRef, useCallback } from "react";
import { Chess, type Square, type Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "@/components/ui/button";
import { X, Trophy, Coins, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameCallBubble } from "./GameCallBubble";
import { useGameSync } from "@/hooks/useGameSync";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

interface ChessGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  betAmount?: number;
  partnerName: string;
  room?: any;
  isHost?: boolean; // true = White, false = Black
}

const MOVE_TIME = 60; // seconds per move

export function ChessGame({ onClose, onMinimize, betAmount = 0, partnerName, room, isHost = true }: ChessGameProps) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const { sendMessage, onMessage } = useGameSync(room || null, "chess");
  const [game, setGame] = useState(new Chess());
  const [boardPosition, setBoardPosition] = useState(game.fen());
  const [gameOver, setGameOver] = useState<{ result: string; won: boolean; draw: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState(MOVE_TIME);
  const [settled, setSettled] = useState(false);
  const gameRef = useRef(game);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myColor: "white" | "black" = isHost ? "white" : "black";
  const myColorShort = isHost ? "w" : "b";
  const isMyTurn = game.turn() === myColorShort;

  // Keep ref in sync
  useEffect(() => { gameRef.current = game; }, [game]);

  // Listen for opponent moves
  useEffect(() => {
    return onMessage("CHESS_MOVE", (msg: any) => {
      const gameCopy = new Chess(msg.fen);
      setGame(gameCopy);
      setBoardPosition(msg.fen);
      setTimeLeft(MOVE_TIME); // reset timer for my turn
    });
  }, [onMessage]);

  // 60s move timer
  useEffect(() => {
    if (gameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(MOVE_TIME);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up — current turn player loses
          if (timerRef.current) clearInterval(timerRef.current);
          const timedOutColor = gameRef.current.turn();
          const iLost = timedOutColor === myColorShort;
          handleGameEnd(
            iLost ? "Time's up — You Lost!" : "Opponent ran out of time!",
            !iLost,
            false
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [boardPosition, gameOver]);

  // Check for game end conditions after each position change
  useEffect(() => {
    if (gameOver) return;
    if (game.isCheckmate()) {
      // The player whose turn it is has been checkmated (they lost)
      const loserTurn = game.turn();
      const iWon = loserTurn !== myColorShort;
      handleGameEnd(
        iWon ? "Checkmate — You Win!" : "Checkmate — You Lost!",
        iWon,
        false
      );
    } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
      handleGameEnd("Draw!", false, true);
    }
  }, [boardPosition]);

  const handleGameEnd = useCallback(async (result: string, won: boolean, draw: boolean) => {
    if (gameOver || settled) return;
    setGameOver({ result, won, draw });
    setSettled(true);

    if (betAmount <= 0 || !profile?.id) return;
    const { data } = await supabase.from("profiles").select("coins").eq("id", profile.id).single();
    const currentCoins = data?.coins ?? 0;

    if (won) {
      const winnings = betAmount * 2;
      await supabase.from("profiles").update({ coins: currentCoins + winnings }).eq("id", profile.id);
      toast({ title: `🎉 You won ${winnings} coins!`, duration: 3000 });
    } else if (draw) {
      toast({ title: "🤝 Draw! No refunds.", duration: 3000 });
    } else {
      toast({ title: `💀 You lost ${betAmount} coins`, duration: 3000 });
    }

    // Auto-close after 5 seconds
    setTimeout(() => onClose(), 5000);
  }, [gameOver, settled, betAmount, profile?.id, toast, onClose]);

  function onDrop(sourceSquare: Square, targetSquare: Square): boolean {
    if (gameOver) return false;
    if (!isMyTurn) return false;

    const gameCopy = new Chess(game.fen());
    let move: Move | null = null;
    try {
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // auto-queen
      });
    } catch {
      return false;
    }

    if (!move) return false;

    setGame(gameCopy);
    setBoardPosition(gameCopy.fen());

    // Send move to opponent via LiveKit
    sendMessage({ type: 'GAME_MOVE', game: 'chess', data: { type: 'CHESS_MOVE', fen: gameCopy.fen(), move } } as any);

    return true;
  }

  // Game Over screen
  if (gameOver) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center",
          gameOver.won ? "bg-[hsl(45,100%,50%)]/20" : gameOver.draw ? "bg-primary/20" : "bg-destructive/20"
        )}>
          <Trophy className={cn(
            "w-10 h-10",
            gameOver.won ? "text-[hsl(45,100%,50%)]" : gameOver.draw ? "text-primary" : "text-destructive"
          )} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {gameOver.result} {gameOver.won ? "🎉" : gameOver.draw ? "🤝" : "💀"}
        </h2>
        {betAmount > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Coins className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            <span className="text-sm text-foreground font-semibold">
              {gameOver.won ? `+${betAmount * 2} coins` : gameOver.draw ? "No refund" : `-${betAmount} coins`}
            </span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Closing in a few seconds...</p>
        <Button onClick={onClose} className="mt-2">Back to Call</Button>
      </div>
    );
  }

  const timerPercent = (timeLeft / MOVE_TIME) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">♟️ Chess</span>
          {betAmount > 0 && (
            <div className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-[hsl(45,100%,50%)]" />
              <span className="text-xs font-bold text-[hsl(45,100%,50%)]">{betAmount}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Crown className={cn("w-4 h-4", isMyTurn ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-xs font-semibold", isMyTurn ? "text-primary" : "text-muted-foreground")}>
            {isMyTurn ? "Your Move" : `${partnerName}'s Move`}
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Move Timer */}
      <div className="px-4 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "text-xs font-mono font-bold",
            timeLeft <= 10 ? "text-destructive" : "text-muted-foreground"
          )}>
            ⏱ {timeLeft}s
          </span>
          <span className="text-[10px] text-muted-foreground">
            {isMyTurn ? "Your timer" : `${partnerName}'s timer`}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              timeLeft <= 10 ? "bg-destructive" : timeLeft <= 30 ? "bg-[hsl(45,100%,50%)]" : "bg-primary"
            )}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
      </div>

      {/* Opponent label */}
      <div className="px-4 mb-1">
        <span className="text-[10px] text-muted-foreground font-semibold">
          {partnerName} ({myColor === "white" ? "Black" : "White"})
        </span>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center px-2">
        <div style={{ width: "min(88vw, 380px)", maxWidth: "380px" }}>
          <Chessboard
            position={boardPosition}
            onPieceDrop={onDrop}
            boardOrientation={myColor}
            arePiecesDraggable={isMyTurn && !gameOver}
            animationDuration={200}
            customBoardStyle={{
              borderRadius: "8px",
              boxShadow: "0 8px 32px hsl(var(--primary) / 0.15)",
            }}
            customDarkSquareStyle={{ backgroundColor: "hsl(25, 30%, 42%)" }}
            customLightSquareStyle={{ backgroundColor: "hsl(35, 30%, 82%)" }}
          />
        </div>
      </div>

      {/* Your label */}
      <div className="px-4 mt-1 pb-2 safe-bottom">
        <span className="text-[10px] text-muted-foreground font-semibold">
          You ({myColor === "white" ? "White" : "Black"})
        </span>
        {game.inCheck() && isMyTurn && (
          <span className="ml-2 text-[10px] text-destructive font-bold animate-pulse">⚠️ CHECK!</span>
        )}
      </div>
    </div>
  );
}

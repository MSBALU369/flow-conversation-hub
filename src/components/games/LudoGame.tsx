import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Coins, Crown, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameCallBubble } from "./GameCallBubble";
import { useGameSync } from "@/hooks/useGameSync";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

interface LudoGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  betAmount?: number;
  partnerName: string;
  room?: any;
  isHost?: boolean;
}

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
const MOVE_TIME = 60;

// ─── Ludo Board Layout (15x15) ────────────────────────────────────
// Each cell type: 'empty' | 'track' | 'home-red' | 'home-blue' | 'safe' | 'finish-red' | 'finish-blue' | 'center'

// 52-step main track positions as [row, col] on the 15x15 grid
// Starting from RED start (row 13, col 6) going clockwise
const MAIN_TRACK: [number, number][] = [
  // Bottom-left upward (RED side)
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Top-left row going right
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // Left column going up
  [7, 0], [6, 0],
  // Top-left going right along top
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Top middle going up
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // Top-right going right
  [0, 7], [0, 8],
  // Right side going down
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Top-right to right
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // Right going down
  [7, 14], [8, 14],
  // Bottom-right going left
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Going down on right
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // Bottom going left
  [14, 7], [14, 6],
  // Back up on left
  [13, 6], // This wraps — we handle modulo
];

// Actual 52-step track (no wrap duplication)
const TRACK: [number, number][] = [
  // RED start going up
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
];

// Home stretch for RED (enters from pos 51 into home column)
const RED_HOME: [number, number][] = [
  [13, 7], [12, 7], [11, 7], [10, 7], [9, 7],
];

// Home stretch for BLUE (enters from pos 25 into home column)
const BLUE_HOME: [number, number][] = [
  [1, 7], [2, 7], [3, 7], [4, 7], [5, 7],
];

// Safe zones (star positions on track)
const SAFE_POSITIONS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// RED starts at track index 0, BLUE starts at track index 26
const RED_START = 0;
const BLUE_START = 26;

// Base positions for display
const RED_BASE_CELLS: [number, number][] = [[10, 1], [10, 4], [13, 1], [13, 4]];
const BLUE_BASE_CELLS: [number, number][] = [[1, 10], [1, 13], [4, 10], [4, 13]];

type TokenState = {
  id: string;
  position: number; // -1 = in base, 0-51 = on track, 52-56 = home stretch, 57 = finished
};

function getTokenGridPos(token: TokenState, isRed: boolean): [number, number] | null {
  if (token.position === -1) return null; // in base
  if (token.position === 57) return [7, 7]; // center/finished
  
  const startOffset = isRed ? RED_START : BLUE_START;
  
  if (token.position >= 52) {
    // Home stretch
    const homeIdx = token.position - 52;
    const homeTrack = isRed ? RED_HOME : BLUE_HOME;
    return homeTrack[homeIdx] || [7, 7];
  }
  
  // Main track
  const trackIdx = (startOffset + token.position) % 52;
  return TRACK[trackIdx] || null;
}

// Check if a position can enter home stretch
function canEnterHome(position: number, isRed: boolean): boolean {
  if (isRed) return position >= 50; // RED enters home after position 50
  return position >= 24 && position < 26; // BLUE enters home after going around
}

export function LudoGame({ onClose, onMinimize, betAmount = 0, partnerName, room, isHost = true }: LudoGameProps) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const { sendMessage, onMessage } = useGameSync(room || null, "ludo");

  const myColor = isHost ? "red" : "blue";
  const [myTokens, setMyTokens] = useState<TokenState[]>([
    { id: "m0", position: -1 }, { id: "m1", position: -1 },
    { id: "m2", position: -1 }, { id: "m3", position: -1 },
  ]);
  const [oppTokens, setOppTokens] = useState<TokenState[]>([
    { id: "o0", position: -1 }, { id: "o1", position: -1 },
    { id: "o2", position: -1 }, { id: "o3", position: -1 },
  ]);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(isHost); // Host goes first
  const [rolling, setRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [gameOver, setGameOver] = useState<{ result: string; won: boolean; draw: boolean } | null>(null);
  const [settled, setSettled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MOVE_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameOverRef = useRef(false);

  // Listen for opponent actions
  useEffect(() => {
    return onMessage("GAME_MOVE", (msg: any) => {
      if (msg.game !== "ludo" || !msg.data) return;
      const { action, diceValue: dv, tokenId, newPosition } = msg.data;
      
      if (action === "ROLL") {
        setDiceValue(dv);
      } else if (action === "MOVE") {
        setOppTokens(prev => prev.map(t =>
          t.id === tokenId ? { ...t, position: newPosition } : t
        ));
        // Check if opponent captured any of my tokens
        // (handled locally based on position matching)
      } else if (action === "TURN_DONE") {
        setIsMyTurn(true);
        setHasRolled(false);
        setDiceValue(null);
        setTimeLeft(MOVE_TIME);
      } else if (action === "TIMEOUT_LOSS") {
        handleGameEnd("Opponent timed out — You Win!", true, false);
      }
    });
  }, [onMessage]);

  // Check for captures after opponent moves
  useEffect(() => {
    if (gameOverRef.current) return;
    const myIsRed = isHost;
    
    oppTokens.forEach(opp => {
      if (opp.position < 0 || opp.position >= 52) return;
      const oppGrid = getTokenGridPos(opp, !myIsRed);
      if (!oppGrid) return;
      
      myTokens.forEach(mine => {
        if (mine.position < 0 || mine.position >= 52) return;
        const myGrid = getTokenGridPos(mine, myIsRed);
        if (!myGrid) return;
        
        if (myGrid[0] === oppGrid[0] && myGrid[1] === oppGrid[1]) {
          const oppTrackIdx = (!myIsRed ? RED_START : BLUE_START) + opp.position;
          if (!SAFE_POSITIONS.has(oppTrackIdx % 52)) {
            // My token gets captured — return to base
            setMyTokens(prev => prev.map(t =>
              t.id === mine.id ? { ...t, position: -1 } : t
            ));
          }
        }
      });
    });
  }, [oppTokens]);

  // Check win condition
  useEffect(() => {
    if (gameOverRef.current) return;
    const myFinished = myTokens.every(t => t.position === 57);
    const oppFinished = oppTokens.every(t => t.position === 57);
    
    if (myFinished) handleGameEnd("You Win!", true, false);
    else if (oppFinished) handleGameEnd("You Lost!", false, false);
  }, [myTokens, oppTokens]);

  // 60s move timer
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
            // I timed out — I lose
            sendMessage({ type: 'GAME_MOVE', game: 'ludo', data: { action: 'TIMEOUT_LOSS' } });
            handleGameEnd("Time's up — You Lost!", false, false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMyTurn, gameOver]);

  const handleGameEnd = useCallback(async (result: string, won: boolean, draw: boolean) => {
    if (gameOverRef.current || settled) return;
    gameOverRef.current = true;
    setGameOver({ result, won, draw });
    setSettled(true);

    if (betAmount > 0 && profile?.id) {
      const { data } = await supabase.from("profiles").select("coins").eq("id", profile.id).single();
      const currentCoins = data?.coins ?? 0;
      if (won) {
        await supabase.from("profiles").update({ coins: currentCoins + betAmount * 2 }).eq("id", profile.id);
        toast({ title: `🎉 You won ${betAmount * 2} coins!`, duration: 3000 });
      } else if (draw) {
        toast({ title: "🤝 Draw! No refunds.", duration: 3000 });
      } else {
        toast({ title: `💀 You lost ${betAmount} coins`, duration: 3000 });
      }
    }

    setTimeout(() => onClose(), 5000);
  }, [settled, betAmount, profile?.id, toast, onClose]);

  const rollDice = () => {
    if (rolling || !isMyTurn || hasRolled || gameOverRef.current) return;
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
        setHasRolled(true);
        
        // Send dice roll to opponent
        sendMessage({ type: 'GAME_MOVE', game: 'ludo', data: { action: 'ROLL', diceValue: finalValue } });
        
        // Check if any move is possible
        const canMove = myTokens.some(t => {
          if (t.position === 57) return false;
          if (t.position === -1) return finalValue === 6;
          const newPos = t.position + finalValue;
          return newPos <= 57;
        });
        
        if (!canMove) {
          // No valid moves, pass turn
          setTimeout(() => endTurn(), 1000);
        }
      }
    }, 100);
  };

  const moveToken = (tokenId: string) => {
    if (!hasRolled || !diceValue || gameOverRef.current) return;
    
    const token = myTokens.find(t => t.id === tokenId);
    if (!token) return;
    
    let newPosition: number;
    
    if (token.position === -1) {
      // Move out of base — needs a 6
      if (diceValue !== 6) return;
      newPosition = 0;
    } else if (token.position === 57) {
      return; // Already finished
    } else {
      newPosition = Math.min(token.position + diceValue, 57);
    }
    
    // Check captures against opponent
    if (newPosition >= 0 && newPosition < 52) {
      const myIsRed = isHost;
      const myGrid = getTokenGridPos({ id: tokenId, position: newPosition }, myIsRed);
      if (myGrid) {
        const oppIsRed = !isHost;
        setOppTokens(prev => prev.map(opp => {
          if (opp.position < 0 || opp.position >= 52) return opp;
          const oppGrid = getTokenGridPos(opp, oppIsRed);
          if (!oppGrid) return opp;
          const oppTrackIdx = (oppIsRed ? RED_START : BLUE_START) + opp.position;
          if (myGrid[0] === oppGrid[0] && myGrid[1] === oppGrid[1] && !SAFE_POSITIONS.has(oppTrackIdx % 52)) {
            toast({ title: "💥 Captured opponent's token!", duration: 2000 });
            return { ...opp, position: -1 };
          }
          return opp;
        }));
      }
    }
    
    setMyTokens(prev => prev.map(t =>
      t.id === tokenId ? { ...t, position: newPosition } : t
    ));
    
    // Send move to opponent
    sendMessage({ type: 'GAME_MOVE', game: 'ludo', data: { action: 'MOVE', tokenId, newPosition } });
    
    // If rolled 6, get another turn
    if (diceValue === 6) {
      setHasRolled(false);
      setDiceValue(null);
    } else {
      setTimeout(() => endTurn(), 500);
    }
  };

  const endTurn = () => {
    setIsMyTurn(false);
    setHasRolled(false);
    setDiceValue(null);
    setTimeLeft(MOVE_TIME);
    sendMessage({ type: 'GAME_MOVE', game: 'ludo', data: { action: 'TURN_DONE' } });
  };

  const DiceIcon = diceValue ? DICE_ICONS[diceValue - 1] : Dice1;

  // Game Over screen
  if (gameOver) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center",
          gameOver.won ? "bg-[hsl(45,100%,50%)]/20" : "bg-destructive/20"
        )}>
          <Trophy className={cn("w-10 h-10", gameOver.won ? "text-[hsl(45,100%,50%)]" : "text-destructive")} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{gameOver.result} {gameOver.won ? "🎉" : "💀"}</h2>
        {betAmount > 0 && (
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            <span className="text-sm font-semibold text-foreground">
              {gameOver.won ? `+${betAmount * 2} coins` : `-${betAmount} coins`}
            </span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Closing in a few seconds...</p>
        <Button onClick={onClose} className="mt-2">Back to Call</Button>
      </div>
    );
  }

  // ─── Board Rendering ────────────────────────────────────────
  const getCellType = (r: number, c: number): string => {
    // Center
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
      if (r === 7 && c === 7) return "center";
      // Home stretches
      if (c === 7 && r >= 9 && r <= 13) return "home-red";
      if (c === 7 && r >= 1 && r <= 5) return "home-blue";
      return "center";
    }
    // Red base (bottom-left quadrant)
    if (r >= 9 && r <= 14 && c >= 0 && c <= 5) {
      if (r >= 10 && r <= 13 && c >= 1 && c <= 4) return "base-red";
      if (r === 9 || r === 14 || c === 0 || c === 5) return "base-red-border";
    }
    // Blue base (top-right quadrant)
    if (r >= 0 && r <= 5 && c >= 9 && c <= 14) {
      if (r >= 1 && r <= 4 && c >= 10 && c <= 13) return "base-blue";
      if (r === 0 || r === 5 || c === 9 || c === 14) return "base-blue-border";
    }
    // Green base (top-left)
    if (r >= 0 && r <= 5 && c >= 0 && c <= 5) return "base-green";
    // Yellow base (bottom-right)
    if (r >= 9 && r <= 14 && c >= 9 && c <= 14) return "base-yellow";
    
    return "track";
  };

  const isOnTrack = (r: number, c: number): boolean => {
    return TRACK.some(([tr, tc]) => tr === r && tc === c);
  };

  const isSafeCell = (r: number, c: number): boolean => {
    const idx = TRACK.findIndex(([tr, tc]) => tr === r && tc === c);
    return idx >= 0 && SAFE_POSITIONS.has(idx);
  };

  const getTokensAt = (r: number, c: number): { color: string; id: string }[] => {
    const tokens: { color: string; id: string }[] = [];
    const myIsRed = isHost;
    
    myTokens.forEach(t => {
      if (t.position === -1 || t.position === 57) return;
      const pos = getTokenGridPos(t, myIsRed);
      if (pos && pos[0] === r && pos[1] === c) {
        tokens.push({ color: myColor, id: t.id });
      }
    });
    
    oppTokens.forEach(t => {
      if (t.position === -1 || t.position === 57) return;
      const pos = getTokenGridPos(t, !myIsRed);
      if (pos && pos[0] === r && pos[1] === c) {
        tokens.push({ color: isHost ? "blue" : "red", id: t.id });
      }
    });
    
    return tokens;
  };

  const getBaseTokens = (color: "red" | "blue"): TokenState[] => {
    const tokens = color === myColor ? myTokens : oppTokens;
    return tokens.filter(t => t.position === -1);
  };

  const timerPercent = (timeLeft / MOVE_TIME) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 safe-top">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">🎲 Ludo</span>
          {betAmount > 0 && (
            <div className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-[hsl(45,100%,50%)]" />
              <span className="text-xs font-bold text-[hsl(45,100%,50%)]">{betAmount}</span>
            </div>
          )}
        </div>
        <span className={cn("text-xs font-semibold", isMyTurn ? "text-primary" : "text-muted-foreground")}>
          {isMyTurn ? "Your Turn" : `${partnerName}'s Turn`}
        </span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Timer */}
      <div className="px-4 mb-1">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              timeLeft <= 10 ? "bg-destructive" : timeLeft <= 30 ? "bg-[hsl(45,100%,50%)]" : "bg-primary"
            )}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
        <p className={cn("text-[10px] font-mono text-right mt-0.5", timeLeft <= 10 ? "text-destructive" : "text-muted-foreground")}>
          {timeLeft}s
        </p>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center px-1">
        <div
          className="grid border border-border rounded-lg overflow-hidden"
          style={{
            gridTemplateColumns: "repeat(15, 1fr)",
            gridTemplateRows: "repeat(15, 1fr)",
            width: "min(92vw, 380px)",
            height: "min(92vw, 380px)",
          }}
        >
          {Array.from({ length: 15 }, (_, r) =>
            Array.from({ length: 15 }, (_, c) => {
              const cellType = getCellType(r, c);
              const onTrack = isOnTrack(r, c);
              const safe = isSafeCell(r, c);
              const tokensHere = getTokensAt(r, c);
              
              // Home stretch cells
              const isRedHome = c === 7 && r >= 9 && r <= 13;
              const isBlueHome = c === 7 && r >= 1 && r <= 5;
              const isRedFinish = r >= 7 && r <= 7 && c >= 6 && c <= 8 && !(r === 7 && c === 7);
              
              let bg = "bg-background";
              if (cellType === "base-red" || cellType === "base-red-border") bg = "bg-red-500/20";
              else if (cellType === "base-blue" || cellType === "base-blue-border") bg = "bg-blue-500/20";
              else if (cellType === "base-green") bg = "bg-green-500/15";
              else if (cellType === "base-yellow") bg = "bg-yellow-500/15";
              else if (cellType === "center") bg = "bg-muted/60";
              else if (isRedHome) bg = "bg-red-500/30";
              else if (isBlueHome) bg = "bg-blue-500/30";
              else if (safe) bg = "bg-[hsl(45,100%,50%)]/20";
              else if (onTrack) bg = "bg-muted/30";

              // Base token rendering
              const isRedBaseCell = RED_BASE_CELLS.some(([br, bc]) => br === r && bc === c);
              const isBlueBaseCell = BLUE_BASE_CELLS.some(([br, bc]) => br === r && bc === c);
              const redBaseTokens = getBaseTokens("red");
              const blueBaseTokens = getBaseTokens("blue");

              return (
                <div
                  key={`${r}-${c}`}
                  className={cn(
                    "border border-border/20 flex items-center justify-center relative",
                    bg,
                    r === 7 && c === 7 && "bg-gradient-to-br from-red-500/30 via-blue-500/30 to-green-500/30"
                  )}
                >
                  {safe && <span className="absolute text-[6px] opacity-40">⭐</span>}
                  
                  {/* Base tokens */}
                  {isRedBaseCell && redBaseTokens.length > 0 && (() => {
                    const baseIdx = RED_BASE_CELLS.findIndex(([br, bc]) => br === r && bc === c);
                    const token = redBaseTokens[baseIdx];
                    if (!token) return null;
                    const isClickable = isMyTurn && hasRolled && diceValue === 6 && myColor === "red";
                    return (
                      <button
                        key={token.id}
                        onClick={() => isClickable && moveToken(token.id)}
                        className={cn(
                          "w-[70%] h-[70%] rounded-full border-2",
                          "bg-red-500 border-red-700",
                          isClickable && "animate-pulse ring-2 ring-[hsl(45,100%,50%)] cursor-pointer"
                        )}
                      />
                    );
                  })()}
                  
                  {isBlueBaseCell && blueBaseTokens.length > 0 && (() => {
                    const baseIdx = BLUE_BASE_CELLS.findIndex(([br, bc]) => br === r && bc === c);
                    const token = blueBaseTokens[baseIdx];
                    if (!token) return null;
                    const isClickable = isMyTurn && hasRolled && diceValue === 6 && myColor === "blue";
                    return (
                      <button
                        key={token.id}
                        onClick={() => isClickable && moveToken(token.id)}
                        className={cn(
                          "w-[70%] h-[70%] rounded-full border-2",
                          "bg-blue-500 border-blue-700",
                          isClickable && "animate-pulse ring-2 ring-[hsl(45,100%,50%)] cursor-pointer"
                        )}
                      />
                    );
                  })()}
                  
                  {/* Track tokens */}
                  {tokensHere.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-[1px]">
                      {tokensHere.map(({ color, id }) => {
                        const isMine = color === myColor;
                        const canClick = isMine && isMyTurn && hasRolled && !gameOverRef.current;
                        return (
                          <button
                            key={id}
                            onClick={() => canClick && moveToken(id)}
                            className={cn(
                              "rounded-full border",
                              tokensHere.length > 1 ? "w-[40%] h-[40%]" : "w-[65%] h-[65%]",
                              color === "red" ? "bg-red-500 border-red-700" : "bg-blue-500 border-blue-700",
                              canClick && "animate-pulse ring-1 ring-[hsl(45,100%,50%)] cursor-pointer"
                            )}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dice & Controls */}
      <div className="flex items-center justify-center gap-6 py-3 safe-bottom">
        <button
          onClick={rollDice}
          disabled={!isMyTurn || rolling || hasRolled}
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
            isMyTurn && !hasRolled ? "bg-primary/20 border-2 border-primary/40 hover:bg-primary/30 active:scale-90" : "bg-muted/30 border-2 border-transparent",
            rolling && "animate-bounce"
          )}
        >
          <DiceIcon className={cn("w-8 h-8", isMyTurn ? "text-primary" : "text-muted-foreground")} />
        </button>
        
        <div className="text-center">
          {rolling && <p className="text-xs text-muted-foreground animate-pulse">Rolling...</p>}
          {hasRolled && diceValue && (
            <p className="text-sm font-bold text-foreground">
              Rolled: <span className="text-primary">{diceValue}</span>
              {diceValue === 6 && <span className="ml-1">🎉</span>}
            </p>
          )}
          {!isMyTurn && <p className="text-xs text-muted-foreground">{partnerName} is playing...</p>}
          {isMyTurn && !hasRolled && <p className="text-xs text-muted-foreground">Tap dice to roll!</p>}
          {isMyTurn && hasRolled && <p className="text-[10px] text-muted-foreground">Tap a token to move</p>}
        </div>
      </div>
    </div>
  );
}

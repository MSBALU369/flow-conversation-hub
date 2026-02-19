import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Eraser, Lightbulb, RotateCcw, Coins } from "lucide-react";
import { GameCallBubble } from "./GameCallBubble";
import { cn } from "@/lib/utils";
import { useGameBet } from "@/hooks/useGameBet";

interface SudokuGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  betAmount?: number;
  partnerName: string;
}

type Difficulty = "easy" | "medium" | "hard";

// Simple Sudoku generator
function generateSudoku(difficulty: Difficulty): { puzzle: number[][]; solution: number[][] } {
  const solution = createSolvedBoard();
  const puzzle = solution.map(row => [...row]);
  
  const removeCounts: Record<Difficulty, number> = { easy: 35, medium: 45, hard: 55 };
  const toRemove = removeCounts[difficulty];
  
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) positions.push([r, c]);
  
  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  for (let i = 0; i < toRemove && i < positions.length; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = 0;
  }
  
  return { puzzle, solution };
}

function createSolvedBoard(): number[][] {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board);
  return board;
}

function fillBoard(board: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const n of nums) {
          if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (fillBoard(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function isValid(board: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
  }
  const boxR = Math.floor(row / 3) * 3;
  const boxC = Math.floor(col / 3) * 3;
  for (let r = boxR; r < boxR + 3; r++) {
    for (let c = boxC; c < boxC + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SudokuGame({ onClose, onMinimize, betAmount = 0, partnerName }: SudokuGameProps) {
  const { settleBet } = useGameBet(betAmount);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [puzzle, setPuzzle] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [board, setBoard] = useState<number[][]>([]);
  const [fixed, setFixed] = useState<boolean[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hints, setHints] = useState(3);

  // Timer
  useEffect(() => {
    if (!difficulty || gameOver) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [difficulty, gameOver]);

  const startGame = useCallback((diff: Difficulty) => {
    const { puzzle: p, solution: s } = generateSudoku(diff);
    setPuzzle(p);
    setSolution(s);
    setBoard(p.map(row => [...row]));
    setFixed(p.map(row => row.map(v => v !== 0)));
    setDifficulty(diff);
    setSelected(null);
    setErrors(new Set());
    setGameOver(false);
    setSeconds(0);
    setHints(3);
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (fixed[r]?.[c] || gameOver) return;
    setSelected([r, c]);
  };

  const handleNumberInput = (num: number) => {
    if (!selected || gameOver) return;
    const [r, c] = selected;
    if (fixed[r][c]) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    // Check errors
    const newErrors = new Set<string>();
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (newBoard[row][col] !== 0 && newBoard[row][col] !== solution[row][col]) {
          newErrors.add(`${row}-${col}`);
        }
      }
    }
    setErrors(newErrors);

    // Check win
    if (newErrors.size === 0) {
      const complete = newBoard.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]));
      if (complete) setGameOver(true);
    }
  };

  const handleErase = () => {
    if (!selected || gameOver) return;
    const [r, c] = selected;
    if (fixed[r][c]) return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = 0;
    setBoard(newBoard);
    const newErrors = new Set(errors);
    newErrors.delete(`${r}-${c}`);
    setErrors(newErrors);
  };

  const handleHint = () => {
    if (hints <= 0 || gameOver) return;
    // Find an empty or wrong cell
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!fixed[r][c] && board[r][c] !== solution[r][c]) {
          emptyCells.push([r, c]);
        }
      }
    }
    if (emptyCells.length === 0) return;
    const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = solution[r][c];
    setBoard(newBoard);
    const newFixed = fixed.map(row => [...row]);
    newFixed[r][c] = true;
    setFixed(newFixed);
    setHints(h => h - 1);
    const newErrors = new Set(errors);
    newErrors.delete(`${r}-${c}`);
    setErrors(newErrors);

    // Check win
    const complete = newBoard.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]));
    if (complete) setGameOver(true);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Difficulty selection screen
  if (!difficulty) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-6 px-6">
        <GameCallBubble onMinimize={onMinimize} />
        <div className="flex items-center justify-between w-full max-w-[300px]">
          <span className="text-lg font-bold text-foreground">🧩 Sudoku</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <p className="text-sm text-muted-foreground text-center">Choose difficulty level</p>
        <div className="flex flex-col gap-3 w-full max-w-[260px]">
          {([
            { level: "easy" as Difficulty, label: "Easy", desc: "35 cells removed", color: "bg-green-500/20 border-green-500/40 text-green-400" },
            { level: "medium" as Difficulty, label: "Medium", desc: "45 cells removed", color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" },
            { level: "hard" as Difficulty, label: "Hard", desc: "55 cells removed", color: "bg-destructive/20 border-destructive/40 text-destructive" },
          ]).map(d => (
            <button
              key={d.level}
              onClick={() => startGame(d.level)}
              className={cn("flex items-center gap-3 p-4 rounded-xl border-2 transition-all active:scale-[0.97]", d.color)}
            >
              <span className="text-2xl">🧩</span>
              <div className="text-left">
                <p className="text-sm font-bold">{d.label}</p>
                <p className="text-[10px] text-muted-foreground">{d.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Playing with {partnerName}</p>
      </div>
    );
  }

  // Game over - sudoku is always a win (you solved it)
  if (gameOver) {
    settleBet("win");
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[hsl(45,100%,50%)]/20">
          <Trophy className="w-10 h-10 text-[hsl(45,100%,50%)]" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Puzzle Solved! 🎉</h2>
        <p className="text-sm text-muted-foreground">Time: {formatTime(seconds)} • {difficulty?.toUpperCase()}</p>
        {betAmount > 0 && (
          <p className="text-sm font-semibold flex items-center gap-1">
            <Coins className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            +{betAmount * 2} coins
          </p>
        )}
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => { setDifficulty(null); }}>New Game</Button>
          <Button onClick={onClose}>Back to Call</Button>
        </div>
      </div>
    );
  }

  // Get highlight info
  const selectedVal = selected ? board[selected[0]][selected[1]] : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <span className="text-xs font-bold text-foreground">🧩 Sudoku ({difficulty})</span>
        <span className="text-xs font-mono font-bold text-primary">{formatTime(seconds)}</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center px-2">
        <div className="w-full max-w-[340px] aspect-square">
          <div className="grid grid-cols-9 gap-0 border-2 border-foreground/40 rounded-lg overflow-hidden">
            {board.map((row, r) =>
              row.map((val, c) => {
                const isFixed = fixed[r][c];
                const isSelected = selected?.[0] === r && selected?.[1] === c;
                const isError = errors.has(`${r}-${c}`);
                const isSameNum = selectedVal > 0 && val === selectedVal;
                const isSameRow = selected?.[0] === r;
                const isSameCol = selected?.[1] === c;
                const isSameBox = selected && Math.floor(selected[0] / 3) === Math.floor(r / 3) && Math.floor(selected[1] / 3) === Math.floor(c / 3);
                const isHighlighted = !isSelected && (isSameRow || isSameCol || isSameBox);

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={cn(
                      "aspect-square flex items-center justify-center text-sm font-bold transition-colors relative",
                      // Grid borders
                      c % 3 === 2 && c < 8 && "border-r-2 border-foreground/30",
                      c % 3 !== 2 && c < 8 && "border-r border-foreground/10",
                      r % 3 === 2 && r < 8 && "border-b-2 border-foreground/30",
                      r % 3 !== 2 && r < 8 && "border-b border-foreground/10",
                      // States
                      isSelected ? "bg-primary/30" :
                      isSameNum ? "bg-primary/15" :
                      isHighlighted ? "bg-muted/60" : "bg-background",
                      isError && "bg-destructive/20",
                      isFixed ? "text-foreground" : isError ? "text-destructive" : "text-primary",
                    )}
                  >
                    {val > 0 ? val : ""}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Number pad */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-9 gap-1.5 max-w-[340px] mx-auto mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
            // Count how many of this number are placed
            const count = board.flat().filter(v => v === num).length;
            const isComplete = count >= 9;
            return (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                disabled={isComplete}
                className={cn(
                  "h-10 rounded-lg font-bold text-sm transition-all",
                  isComplete
                    ? "bg-muted/20 text-muted-foreground/30"
                    : "bg-primary/20 text-primary hover:bg-primary/30 active:scale-90"
                )}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 pb-3 safe-bottom">
          <button onClick={handleErase} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors">
            <Eraser className="w-5 h-5" />
            <span className="text-[9px]">Erase</span>
          </button>
          <button onClick={handleHint} disabled={hints <= 0} className={cn("flex flex-col items-center gap-0.5 transition-colors", hints > 0 ? "text-primary hover:text-primary/80" : "text-muted-foreground/30")}>
            <Lightbulb className="w-5 h-5" />
            <span className="text-[9px]">Hint ({hints})</span>
          </button>
          <button onClick={() => setDifficulty(null)} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-5 h-5" />
            <span className="text-[9px]">New</span>
          </button>
        </div>
      </div>
    </div>
  );
}

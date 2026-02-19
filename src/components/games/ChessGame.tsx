import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameCallBubble } from "./GameCallBubble";

interface ChessGameProps {
  onClose: () => void;
  partnerName: string;
}

type Piece = { type: string; color: "w" | "b" } | null;

const PIECE_ICONS: Record<string, Record<string, string>> = {
  w: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" },
  b: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" },
};

function createInitialBoard(): Piece[][] {
  const board: Piece[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRow = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRow[c], color: "b" };
    board[1][c] = { type: "P", color: "b" };
    board[6][c] = { type: "P", color: "w" };
    board[7][c] = { type: backRow[c], color: "w" };
  }
  return board;
}

function isValidMove(board: Piece[][], fr: number, fc: number, tr: number, tc: number, piece: Piece): boolean {
  if (!piece) return false;
  const target = board[tr][tc];
  if (target && target.color === piece.color) return false;
  const dr = tr - fr, dc = tc - fc;
  const adr = Math.abs(dr), adc = Math.abs(dc);

  switch (piece.type) {
    case "P": {
      const dir = piece.color === "w" ? -1 : 1;
      const start = piece.color === "w" ? 6 : 1;
      if (dc === 0 && !target) {
        if (dr === dir) return true;
        if (fr === start && dr === dir * 2 && !board[fr + dir][fc]) return true;
      }
      if (adc === 1 && dr === dir && target) return true;
      return false;
    }
    case "R": return (dr === 0 || dc === 0) && isPathClear(board, fr, fc, tr, tc);
    case "B": return adr === adc && isPathClear(board, fr, fc, tr, tc);
    case "Q": return (dr === 0 || dc === 0 || adr === adc) && isPathClear(board, fr, fc, tr, tc);
    case "N": return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
    case "K": return adr <= 1 && adc <= 1;
    default: return false;
  }
}

function isPathClear(board: Piece[][], fr: number, fc: number, tr: number, tc: number): boolean {
  const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
  let r = fr + dr, c = fc + dc;
  while (r !== tr || c !== tc) {
    if (board[r][c]) return false;
    r += dr; c += dc;
  }
  return true;
}

export function ChessGame({ onClose, partnerName }: ChessGameProps) {
  const [board, setBoard] = useState<Piece[][]>(createInitialBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [captures, setCaptures] = useState<{ w: string[]; b: string[] }>({ w: [], b: [] });

  const makeAIMove = useCallback((currentBoard: Piece[][]) => {
    setTimeout(() => {
      const moves: { fr: number; fc: number; tr: number; tc: number; capture: boolean }[] = [];
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const p = currentBoard[r][c];
        if (!p || p.color !== "b") continue;
        for (let tr = 0; tr < 8; tr++) for (let tc = 0; tc < 8; tc++) {
          if (isValidMove(currentBoard, r, c, tr, tc, p)) {
            moves.push({ fr: r, fc: c, tr, tc, capture: !!currentBoard[tr][tc] });
          }
        }
      }
      if (moves.length === 0) { setGameOver("You Win!"); return; }
      // Prefer captures
      const captureMoves = moves.filter(m => m.capture);
      const move = captureMoves.length > 0 && Math.random() > 0.3
        ? captureMoves[Math.floor(Math.random() * captureMoves.length)]
        : moves[Math.floor(Math.random() * moves.length)];

      const newBoard = currentBoard.map(r => [...r]);
      const captured = newBoard[move.tr][move.tc];
      if (captured?.type === "K") { setGameOver("You Lost!"); }
      if (captured) setCaptures(prev => ({ ...prev, b: [...prev.b, PIECE_ICONS.w[captured.type]] }));
      newBoard[move.tr][move.tc] = newBoard[move.fr][move.fc];
      newBoard[move.fr][move.fc] = null;
      setBoard(newBoard);
      setTurn("w");
    }, 500 + Math.random() * 1000);
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (gameOver || turn !== "w") return;
    const piece = board[r][c];

    if (selected) {
      const [sr, sc] = selected;
      const selPiece = board[sr][sc];
      if (r === sr && c === sc) { setSelected(null); return; }
      if (piece && piece.color === "w") { setSelected([r, c]); return; }
      if (selPiece && isValidMove(board, sr, sc, r, c, selPiece)) {
        const newBoard = board.map(row => [...row]);
        const captured = newBoard[r][c];
        if (captured?.type === "K") { setGameOver("You Win!"); }
        if (captured) setCaptures(prev => ({ ...prev, w: [...prev.w, PIECE_ICONS.b[captured.type]] }));
        // Pawn promotion
        if (selPiece.type === "P" && r === 0) newBoard[r][c] = { type: "Q", color: "w" };
        else newBoard[r][c] = selPiece;
        newBoard[sr][sc] = null;
        setBoard(newBoard);
        setSelected(null);
        setTurn("b");
        if (!gameOver) makeAIMove(newBoard);
      } else {
        setSelected(null);
      }
    } else {
      if (piece && piece.color === "w") setSelected([r, c]);
    }
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelected(null);
    setTurn("w");
    setGameOver(null);
    setCaptures({ w: [], b: [] });
  };

  if (gameOver) {
    const won = gameOver.includes("Win");
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center", won ? "bg-[hsl(45,100%,50%)]/20" : "bg-destructive/20")}>
          <Trophy className={cn("w-10 h-10", won ? "text-[hsl(45,100%,50%)]" : "text-destructive")} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{gameOver} {won ? "🎉" : "😔"}</h2>
        <div className="flex gap-3">
          <Button onClick={resetGame} variant="outline" className="gap-1"><RotateCcw className="w-4 h-4" /> Play Again</Button>
          <Button onClick={onClose}>Back to Call</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble />
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <span className="text-xs font-bold text-foreground">♟️ Chess</span>
        <span className={cn("text-xs font-bold", turn === "w" ? "text-primary" : "text-muted-foreground")}>
          {turn === "w" ? "Your turn" : `${partnerName} thinking...`}
        </span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Partner captures */}
      <div className="px-4 h-6 flex items-center gap-0.5">
        <span className="text-[10px] text-muted-foreground mr-1">{partnerName}:</span>
        {captures.b.map((p, i) => <span key={i} className="text-sm">{p}</span>)}
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center px-2">
        <div className="grid grid-cols-8 border border-border rounded-lg overflow-hidden" style={{ width: "min(90vw, 360px)", height: "min(90vw, 360px)" }}>
          {board.map((row, r) => row.map((piece, c) => {
            const isLight = (r + c) % 2 === 0;
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const canMove = selected && board[selected[0]][selected[1]] && isValidMove(board, selected[0], selected[1], r, c, board[selected[0]][selected[1]]);
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={cn(
                  "flex items-center justify-center text-2xl transition-all aspect-square",
                  isLight ? "bg-[hsl(35,30%,80%)]" : "bg-[hsl(25,30%,45%)]",
                  isSelected && "ring-2 ring-primary ring-inset bg-primary/30",
                  canMove && !piece && "bg-primary/20",
                  canMove && piece && "ring-2 ring-destructive ring-inset",
                )}
                style={{ fontSize: "min(6vw, 28px)" }}
              >
                {piece && PIECE_ICONS[piece.color][piece.type]}
              </button>
            );
          }))}
        </div>
      </div>

      {/* Your captures */}
      <div className="px-4 h-6 flex items-center gap-0.5 pb-2 safe-bottom">
        <span className="text-[10px] text-muted-foreground mr-1">You:</span>
        {captures.w.map((p, i) => <span key={i} className="text-sm">{p}</span>)}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Coins } from "lucide-react";
import { GameCallBubble } from "./GameCallBubble";
import { cn } from "@/lib/utils";
import { useGameBet } from "@/hooks/useGameBet";

interface WouldYouRatherGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  betAmount?: number;
  partnerName: string;
}

const QUESTIONS = [
  { a: "Be able to fly", b: "Be able to read minds" },
  { a: "Live without music", b: "Live without movies" },
  { a: "Always be 10 minutes late", b: "Always be 20 minutes early" },
  { a: "Have unlimited money", b: "Have unlimited time" },
  { a: "Speak every language fluently", b: "Play every instrument perfectly" },
  { a: "Live in the past", b: "Live in the future" },
  { a: "Never use social media again", b: "Never watch TV again" },
  { a: "Be famous but unhappy", b: "Be unknown but happy" },
  { a: "Have super strength", b: "Have super speed" },
  { a: "Travel to space", b: "Travel to the deepest ocean" },
  { a: "Always know the truth", b: "Always be believed" },
  { a: "Be invisible", b: "Be able to teleport" },
  { a: "Have free WiFi everywhere", b: "Have free food everywhere" },
  { a: "Live without AC", b: "Live without heating" },
  { a: "Give up chocolate", b: "Give up cheese" },
];

const TOTAL_ROUNDS = 8;

export function WouldYouRatherGame({ onClose, onMinimize, betAmount = 0, partnerName }: WouldYouRatherGameProps) {
  const { settleBet } = useGameBet(betAmount);
  const [shuffled] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS));
  const [round, setRound] = useState(0);
  const [myChoice, setMyChoice] = useState<"a" | "b" | null>(null);
  const [partnerChoice, setPartnerChoice] = useState<"a" | "b" | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [matches, setMatches] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [settled, setSettled] = useState(false);

  const handleChoice = (choice: "a" | "b") => {
    if (showResult) return;
    setMyChoice(choice);
    const pChoice = Math.random() > 0.5 ? "a" : "b";
    setPartnerChoice(pChoice as "a" | "b");
    setShowResult(true);
    if (choice === pChoice) setMatches(m => m + 1);

    setTimeout(() => {
      if (round + 1 >= TOTAL_ROUNDS) {
        setGameOver(true);
      } else {
        setRound(r => r + 1);
        setMyChoice(null);
        setPartnerChoice(null);
        setShowResult(false);
      }
    }, 2500);
  };

  if (gameOver) {
    const matchPercent = Math.round((matches / TOTAL_ROUNDS) * 100);
    const won = matchPercent >= 50;
    if (!settled) { settleBet(won ? "win" : "lose"); setSettled(true); }
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-primary/20">
          <Trophy className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Game Over!</h2>
        <p className="text-lg text-foreground">{matchPercent}% Match with {partnerName}!</p>
        <p className="text-sm text-muted-foreground">{matches}/{TOTAL_ROUNDS} same answers</p>
        <p className="text-xs text-muted-foreground mt-1">
          {matchPercent >= 75 ? "🔥 You two think alike!" : matchPercent >= 50 ? "😊 Pretty good compatibility!" : "🤷 Opposites attract!"}
        </p>
        {betAmount > 0 && (
          <p className="text-sm font-semibold flex items-center gap-1">
            <Coins className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            {won ? `+${betAmount * 2} coins (≥50% match)` : `-${betAmount} coins (<50% match)`}
          </p>
        )}
        <Button onClick={onClose} className="mt-4 w-full max-w-[200px]">Back to Call</Button>
      </div>
    );
  }

  const q = shuffled[round];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <span className="text-xs font-bold text-primary">Round {round + 1}/{TOTAL_ROUNDS}</span>
        <span className="text-xs text-muted-foreground">🤝 {matches} matches</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <h2 className="text-lg font-bold text-foreground text-center">Would You Rather...</h2>

        <button
          onClick={() => handleChoice("a")}
          disabled={showResult}
          className={cn(
            "w-full max-w-[300px] p-5 rounded-2xl border-2 transition-all text-center",
            showResult && myChoice === "a" ? "border-primary bg-primary/20" :
            showResult && partnerChoice === "a" ? "border-[hsl(45,100%,50%)] bg-[hsl(45,100%,50%)]/10" :
            showResult ? "border-transparent bg-muted/30 opacity-50" :
            "border-transparent bg-muted/50 hover:bg-primary/10 active:scale-[0.98]"
          )}
        >
          <p className="text-sm font-semibold text-foreground">{q.a}</p>
          {showResult && (
            <div className="flex justify-center gap-2 mt-2">
              {myChoice === "a" && <span className="text-[10px] bg-primary/30 px-2 py-0.5 rounded-full text-primary">You</span>}
              {partnerChoice === "a" && <span className="text-[10px] bg-[hsl(45,100%,50%)]/30 px-2 py-0.5 rounded-full text-[hsl(45,100%,50%)]">{partnerName}</span>}
            </div>
          )}
        </button>

        <span className="text-xs font-bold text-muted-foreground">OR</span>

        <button
          onClick={() => handleChoice("b")}
          disabled={showResult}
          className={cn(
            "w-full max-w-[300px] p-5 rounded-2xl border-2 transition-all text-center",
            showResult && myChoice === "b" ? "border-primary bg-primary/20" :
            showResult && partnerChoice === "b" ? "border-[hsl(45,100%,50%)] bg-[hsl(45,100%,50%)]/10" :
            showResult ? "border-transparent bg-muted/30 opacity-50" :
            "border-transparent bg-muted/50 hover:bg-primary/10 active:scale-[0.98]"
          )}
        >
          <p className="text-sm font-semibold text-foreground">{q.b}</p>
          {showResult && (
            <div className="flex justify-center gap-2 mt-2">
              {myChoice === "b" && <span className="text-[10px] bg-primary/30 px-2 py-0.5 rounded-full text-primary">You</span>}
              {partnerChoice === "b" && <span className="text-[10px] bg-[hsl(45,100%,50%)]/30 px-2 py-0.5 rounded-full text-[hsl(45,100%,50%)]">{partnerName}</span>}
            </div>
          )}
        </button>

        {showResult && myChoice === partnerChoice && (
          <p className="text-sm font-bold text-primary animate-pulse">🎉 You both chose the same!</p>
        )}
      </div>
    </div>
  );
}

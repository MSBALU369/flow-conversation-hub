import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Sparkles } from "lucide-react";
import { GameCallBubble } from "./GameCallBubble";
import { cn } from "@/lib/utils";

interface TruthOrDareGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  partnerName: string;
}

const TRUTHS = [
  "What's the most embarrassing thing you've ever done?",
  "What's your biggest fear?",
  "Have you ever lied to your best friend?",
  "What's your most unpopular opinion?",
  "What's the last thing you searched on your phone?",
  "What's a secret talent you have?",
  "What's the worst gift you've ever received?",
  "Have you ever pretended to like someone's cooking?",
  "What's the most childish thing you still do?",
  "What's the weirdest dream you've ever had?",
  "If you could change one thing about yourself, what would it be?",
  "What's the longest you've gone without showering?",
  "Have you ever eavesdropped on a conversation?",
  "What's the most money you've wasted?",
  "What's the silliest reason you've cried?",
];

const DARES = [
  "Sing the chorus of your favorite song right now!",
  "Do your best impression of a celebrity",
  "Speak in an accent for the next 2 minutes",
  "Say a tongue twister 3 times fast",
  "Tell a joke — if nobody laughs, you lose a point!",
  "Make up a rap about your partner right now",
  "Do 10 jumping jacks while counting in another language",
  "Describe yourself in 3 words — partner judges!",
  "Talk without using the letter 'S' for 1 minute",
  "Pretend to be a news anchor and report on today's weather",
  "Whisper everything you say for the next round",
  "Make 3 animal sounds and partner guesses",
  "Tell the most dramatic story about your day",
  "Compliment your partner in the most creative way",
  "Speak in only questions for 30 seconds",
];

const TOTAL_ROUNDS = 8;

export function TruthOrDareGame({ onClose, onMinimize, partnerName }: TruthOrDareGameProps) {
  const [round, setRound] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptType, setPromptType] = useState<"truth" | "dare" | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [partnerScore, setPartnerScore] = useState(0);
  const [usedTruths] = useState(new Set<number>());
  const [usedDares] = useState(new Set<number>());
  const [waitingComplete, setWaitingComplete] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const getRandomPrompt = (type: "truth" | "dare") => {
    const pool = type === "truth" ? TRUTHS : DARES;
    const used = type === "truth" ? usedTruths : usedDares;
    const available = pool.map((_, i) => i).filter(i => !used.has(i));
    if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)];
    const idx = available[Math.floor(Math.random() * available.length)];
    used.add(idx);
    return pool[idx];
  };

  const handleChoice = (type: "truth" | "dare") => {
    setPromptType(type);
    setPrompt(getRandomPrompt(type));
    setWaitingComplete(false);
  };

  const handleComplete = (didComplete: boolean) => {
    if (isMyTurn && didComplete) setMyScore(s => s + 1);
    if (!isMyTurn && didComplete) setPartnerScore(s => s + 1);

    const nextRound = round + 1;
    if (nextRound >= TOTAL_ROUNDS) {
      setGameOver(true);
    } else {
      setRound(nextRound);
      setIsMyTurn(!isMyTurn);
      setPrompt(null);
      setPromptType(null);
      setWaitingComplete(false);
    }
  };

  // Simulate partner's turn
  const handlePartnerTurn = () => {
    const type = Math.random() > 0.5 ? "truth" : "dare";
    setPromptType(type);
    setPrompt(getRandomPrompt(type));
    setTimeout(() => {
      setWaitingComplete(true);
    }, 2000);
  };

  if (gameOver) {
    const won = myScore > partnerScore;
    const tied = myScore === partnerScore;
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center", won ? "bg-[hsl(45,100%,50%)]/20" : tied ? "bg-primary/20" : "bg-destructive/20")}>
          <Trophy className={cn("w-10 h-10", won ? "text-[hsl(45,100%,50%)]" : tied ? "text-primary" : "text-destructive")} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{won ? "You Win! 🎉" : tied ? "It's a Tie! 🤝" : "You Lost 😔"}</h2>
        <div className="flex gap-8 mt-2">
          <div className="text-center"><p className="text-2xl font-bold text-primary">{myScore}</p><p className="text-xs text-muted-foreground">You</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-destructive">{partnerScore}</p><p className="text-xs text-muted-foreground">{partnerName}</p></div>
        </div>
        <Button onClick={onClose} className="mt-4 w-full max-w-[200px]">Back to Call</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <span className="text-xs font-bold text-primary">Round {round + 1}/{TOTAL_ROUNDS}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-foreground font-bold">{myScore}</span>
          <span className="text-[10px] text-muted-foreground">vs</span>
          <span className="text-xs text-destructive font-bold">{partnerScore}</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <p className="text-xs text-muted-foreground">{isMyTurn ? "Your turn!" : `${partnerName}'s turn`}</p>

        {!prompt && isMyTurn && (
          <>
            <h2 className="text-xl font-bold text-foreground">Truth or Dare?</h2>
            <div className="flex gap-4">
              <button onClick={() => handleChoice("truth")} className="w-32 h-32 rounded-2xl bg-primary/20 border-2 border-primary/40 flex flex-col items-center justify-center gap-2 hover:bg-primary/30 active:scale-95 transition-all">
                <span className="text-3xl">🤫</span>
                <span className="text-sm font-bold text-foreground">Truth</span>
              </button>
              <button onClick={() => handleChoice("dare")} className="w-32 h-32 rounded-2xl bg-destructive/20 border-2 border-destructive/40 flex flex-col items-center justify-center gap-2 hover:bg-destructive/30 active:scale-95 transition-all">
                <span className="text-3xl">🔥</span>
                <span className="text-sm font-bold text-foreground">Dare</span>
              </button>
            </div>
          </>
        )}

        {!prompt && !isMyTurn && (
          <>
            <h2 className="text-lg font-bold text-foreground">{partnerName} is choosing...</h2>
            <Button onClick={handlePartnerTurn} variant="outline">Simulate {partnerName}'s Choice</Button>
          </>
        )}

        {prompt && (
          <div className="w-full max-w-[300px] text-center space-y-4">
            <div className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold",
              promptType === "truth" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
            )}>
              <Sparkles className="w-3 h-3" />
              {promptType === "truth" ? "Truth" : "Dare"}
            </div>
            <div className="bg-muted/50 rounded-2xl p-5">
              <p className="text-sm font-semibold text-foreground leading-relaxed">{prompt}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {isMyTurn ? "Did you answer/complete it?" : waitingComplete ? `Did ${partnerName} complete it?` : `${partnerName} is responding...`}
            </p>
            {(isMyTurn || waitingComplete) && (
              <div className="flex gap-3 justify-center">
                <Button onClick={() => handleComplete(true)} variant="outline" className="gap-1">✅ Completed</Button>
                <Button onClick={() => handleComplete(false)} variant="outline" className="gap-1">❌ Skipped</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

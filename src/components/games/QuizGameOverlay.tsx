import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Coins, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { GameCallBubble } from "./GameCallBubble";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizGameOverlayProps {
  category: string;
  betAmount: number;
  onClose: () => void;
  onMinimize?: () => void;
  partnerName: string;
  room?: any;
}

const QUESTION_TIME = 15; // seconds per question

export function QuizGameOverlay({ category, betAmount, onClose, onMinimize, partnerName }: QuizGameOverlayProps) {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [partnerScore, setPartnerScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [gameOver, setGameOver] = useState(false);

  // Fetch questions from AI
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-quiz", {
        body: { category, difficulty: "medium" },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.questions?.length) throw new Error("No questions returned");

      setQuestions(data.questions);
    } catch (err: any) {
      console.error("Quiz fetch error:", err);
      setError(err.message || "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Deduct bet on start
  useEffect(() => {
    if (betAmount > 0 && questions.length > 0) {
      const currentCoins = profile?.coins ?? 0;
      updateProfile({ coins: Math.max(0, currentCoins - betAmount) });
    }
  }, [questions.length > 0]); // only once when questions load

  // Timer per question
  useEffect(() => {
    if (loading || gameOver || showResult || questions.length === 0) return;
    setTimeLeft(QUESTION_TIME);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — auto-wrong
          handleAnswer(-1);
          return QUESTION_TIME;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQ, loading, gameOver, showResult, questions.length]);

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);

    const correct = questions[currentQ]?.correctIndex;
    if (index === correct) {
      setMyScore((s) => s + 1);
    }

    // Simulate partner answer (50-70% accuracy)
    const partnerCorrect = Math.random() > 0.4;
    if (partnerCorrect) setPartnerScore((s) => s + 1);

    // Advance after delay
    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        finishGame(index === correct ? myScore + 1 : myScore, partnerCorrect ? partnerScore + 1 : partnerScore);
      } else {
        setCurrentQ((q) => q + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      }
    }, 1500);
  };

  const finishGame = async (finalMyScore: number, finalPartnerScore: number) => {
    setGameOver(true);
    const won = finalMyScore > finalPartnerScore;
    const tied = finalMyScore === finalPartnerScore;

    if (betAmount > 0) {
      const currentCoins = profile?.coins ?? 0;
      if (won) {
        const winnings = betAmount * 2;
        await updateProfile({ coins: currentCoins + winnings });
        toast({ title: `🎉 You won ${winnings} coins!`, duration: 3000 });
      } else if (tied) {
        await updateProfile({ coins: currentCoins + betAmount });
        toast({ title: "🤝 It's a tie! Bet refunded.", duration: 3000 });
      } else {
        toast({ title: `😔 You lost ${betAmount} coins`, duration: 3000 });
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-foreground font-semibold">Generating Quiz Questions...</p>
        <p className="text-xs text-muted-foreground">AI is crafting your questions</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <XCircle className="w-10 h-10 text-destructive" />
        <p className="text-foreground font-semibold">Failed to load quiz</p>
        <p className="text-xs text-muted-foreground text-center">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={fetchQuestions}>Retry</Button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    const won = myScore > partnerScore;
    const tied = myScore === partnerScore;
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4 px-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
          won ? "bg-[hsl(45,100%,50%)]/20" : tied ? "bg-primary/20" : "bg-destructive/20"
        }`}>
          <Trophy className={`w-10 h-10 ${
            won ? "text-[hsl(45,100%,50%)]" : tied ? "text-primary" : "text-destructive"
          }`} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {won ? "You Win! 🎉" : tied ? "It's a Tie! 🤝" : "You Lost 😔"}
        </h2>

        <div className="flex gap-8 mt-2">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{myScore}</p>
            <p className="text-xs text-muted-foreground">You</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{partnerScore}</p>
            <p className="text-xs text-muted-foreground">{partnerName}</p>
          </div>
        </div>

        {betAmount > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Coins className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            <span className="text-sm text-foreground font-semibold">
              {won ? `+${betAmount * 2} coins` : tied ? "Bet refunded" : `-${betAmount} coins`}
            </span>
          </div>
        )}

        <Button onClick={onClose} className="mt-4 w-full max-w-[200px]">
          Back to Call
        </Button>
      </div>
    );
  }

  const q = questions[currentQ];
  const correct = q?.correctIndex;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary">Q{currentQ + 1}/{questions.length}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-foreground font-bold">{myScore}</span>
            <span className="text-[10px] text-muted-foreground">vs</span>
            <span className="text-xs text-destructive font-bold">{partnerScore}</span>
          </div>
        </div>

        {betAmount > 0 && (
          <div className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-[hsl(45,100%,50%)]" />
            <span className="text-xs font-bold text-[hsl(45,100%,50%)]">{betAmount}</span>
          </div>
        )}

        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Timer */}
      <div className="px-4 mb-4">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              timeLeft <= 5 ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
          />
        </div>
        <p className={cn(
          "text-center text-xs font-mono mt-1",
          timeLeft <= 5 ? "text-destructive" : "text-muted-foreground"
        )}>
          {timeLeft}s
        </p>
      </div>

      {/* Question */}
      <div className="flex-1 px-4 flex flex-col">
        <div className="bg-muted/50 rounded-2xl p-4 mb-4">
          <p className="text-foreground font-semibold text-center text-sm leading-relaxed">
            {q?.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {q?.options.map((option, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === correct;
            let optionStyle = "bg-muted/50 border-transparent hover:bg-primary/10";

            if (showResult) {
              if (isCorrect) {
                optionStyle = "bg-green-500/20 border-green-500/60";
              } else if (isSelected && !isCorrect) {
                optionStyle = "bg-destructive/20 border-destructive/60";
              } else {
                optionStyle = "bg-muted/30 border-transparent opacity-50";
              }
            } else if (isSelected) {
              optionStyle = "bg-primary/20 border-primary/60";
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={showResult}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${optionStyle}`}
              >
                <span className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  showResult && isCorrect ? "bg-green-500 text-white" :
                  showResult && isSelected && !isCorrect ? "bg-destructive text-white" :
                  "bg-muted text-foreground"
                )}>
                  {showResult && isCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                   showResult && isSelected && !isCorrect ? <XCircle className="w-4 h-4" /> :
                   String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm text-foreground">{option}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Diamond, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { GameCallBubble } from "./GameCallBubble";
import { useGameSync, type GameMessage } from "@/hooks/useGameSync";

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
  isHost: boolean;
  syncedQuestions?: QuizQuestion[] | null;
}

const QUESTION_TIME = 15;

// OpenTDB category mapping
const CATEGORY_MAP: Record<string, number> = {
  all: 0,
  upsc: 24, // Politics
  medical: 17, // Science & Nature
  iit: 18, // Computers
  gk: 9, // General Knowledge
  movies: 11, // Film
};

// Fallback mock questions
const MOCK_QUESTIONS: QuizQuestion[] = [
  { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctIndex: 2 },
  { question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1 },
  { question: "Who painted the Mona Lisa?", options: ["Picasso", "Da Vinci", "Van Gogh", "Michelangelo"], correctIndex: 1 },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3 },
  { question: "How many continents are there?", options: ["5", "6", "7", "8"], correctIndex: 2 },
  { question: "What gas do plants breathe in?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Helium"], correctIndex: 2 },
  { question: "Which element has the symbol 'Au'?", options: ["Silver", "Gold", "Iron", "Copper"], correctIndex: 1 },
  { question: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], correctIndex: 2 },
  { question: "What is the speed of light (km/s)?", options: ["150,000", "300,000", "450,000", "600,000"], correctIndex: 1 },
  { question: "Which country invented paper?", options: ["India", "Egypt", "China", "Greece"], correctIndex: 2 },
];

function decodeHtml(html: string) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export function QuizGameOverlay({ category, betAmount, onClose, onMinimize, partnerName, room, isHost, syncedQuestions }: QuizGameOverlayProps) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const { sendMessage, onMessage } = useGameSync(room);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [partnerScore, setPartnerScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [gameOver, setGameOver] = useState(false);
  const answerTimeRef = useRef<number>(0);
  const partnerAnswersRef = useRef<Map<number, { isCorrect: boolean; timeTaken: number }>>(new Map());
  const myAnswersRef = useRef<Map<number, { isCorrect: boolean; timeTaken: number }>>(new Map());
  const questionStartRef = useRef<number>(Date.now());

  // Host: fetch questions and sync to partner
  useEffect(() => {
    if (isHost) {
      fetchAndSync();
    } else if (syncedQuestions && syncedQuestions.length > 0) {
      setQuestions(syncedQuestions);
      setLoading(false);
    }
  }, [isHost, syncedQuestions]);

  // Non-host: listen for synced questions if not provided yet
  useEffect(() => {
    if (!isHost && (!syncedQuestions || syncedQuestions.length === 0)) {
      return onMessage('QUIZ_SYNC_QUESTIONS', (msg: any) => {
        setQuestions(msg.questions);
        setLoading(false);
      });
    }
  }, [isHost, syncedQuestions, onMessage]);

  // Listen for partner answers
  useEffect(() => {
    return onMessage('QUIZ_ANSWER', (msg: any) => {
      partnerAnswersRef.current.set(msg.index, { isCorrect: msg.isCorrect, timeTaken: msg.timeTaken });
      // Update partner score
      if (msg.isCorrect) {
        setPartnerScore(prev => {
          // Check if my answer for this question was also correct & faster
          const myAnswer = myAnswersRef.current.get(msg.index);
          if (myAnswer?.isCorrect && myAnswer.timeTaken <= msg.timeTaken) {
            // I was faster or equal — partner doesn't get point
            return prev;
          }
          return prev + 1;
        });
      }
    });
  }, [onMessage]);

  const fetchAndSync = async () => {
    setLoading(true);
    let fetched: QuizQuestion[] = [];
    try {
      const catId = CATEGORY_MAP[category] || 0;
      const url = catId > 0
        ? `https://opentdb.com/api.php?amount=10&category=${catId}&type=multiple`
        : `https://opentdb.com/api.php?amount=10&type=multiple`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        fetched = data.results.map((r: any) => {
          const incorrect = r.incorrect_answers.map(decodeHtml);
          const correct = decodeHtml(r.correct_answer);
          const options = [...incorrect];
          const correctIndex = Math.floor(Math.random() * 4);
          options.splice(correctIndex, 0, correct);
          return { question: decodeHtml(r.question), options, correctIndex };
        });
      }
    } catch {
      // API failed
    }

    if (fetched.length === 0) {
      fetched = MOCK_QUESTIONS;
    }

    setQuestions(fetched);
    setLoading(false);
    // Sync to partner
    sendMessage({ type: 'QUIZ_SYNC_QUESTIONS', questions: fetched });
  };

  // Timer per question
  useEffect(() => {
    if (loading || gameOver || showResult || questions.length === 0) return;
    setTimeLeft(QUESTION_TIME);
    questionStartRef.current = Date.now();
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
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
    const isCorrect = index === correct;
    const timeTaken = Date.now() - questionStartRef.current;

    myAnswersRef.current.set(currentQ, { isCorrect, timeTaken });

    // Send answer to partner
    sendMessage({ type: 'QUIZ_ANSWER', index: currentQ, isCorrect, timeTaken });

    // Score: award point only if correct AND (no partner answer yet OR I was faster)
    if (isCorrect) {
      const partnerAns = partnerAnswersRef.current.get(currentQ);
      if (!partnerAns || !partnerAns.isCorrect || timeTaken <= partnerAns.timeTaken) {
        setMyScore((s) => s + 1);
        // If partner also answered correctly but slower, revoke their point
        if (partnerAns?.isCorrect && timeTaken < partnerAns.timeTaken) {
          setPartnerScore((s) => Math.max(0, s - 1));
        }
      }
    }

    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        const finalMy = isCorrect ? myScore + 1 : myScore;
        const finalPartner = partnerScore; // partner score updated reactively
        finishGame(finalMy, finalPartner);
      } else {
        setCurrentQ((q) => q + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      }
    }, 1500);
  };

  const finishGame = async (finalMyScore: number, finalPartnerScore: number) => {
    setGameOver(true);
    if (betAmount <= 0 || !profile?.id) return;

    const won = finalMyScore > finalPartnerScore;
    const tied = finalMyScore === finalPartnerScore;

    const { data } = await supabase.from("profiles").select("coins").eq("id", profile.id).single();
    const currentCoins = data?.coins ?? 0;

    if (won) {
      const winnings = betAmount * 2;
      await supabase.from("profiles").update({ coins: currentCoins + winnings }).eq("id", profile.id);
      toast({ title: `🎉 You won ${winnings} Flow Points!`, duration: 3000 });
    } else if (tied) {
      // No refunds — tie = both lose
      toast({ title: `🤝 It's a tie! No refunds.`, duration: 3000 });
    } else {
      toast({ title: `😔 You lost ${betAmount} Flow Points`, duration: 3000 });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-foreground font-semibold">
          {isHost ? "Fetching Quiz Questions..." : "Waiting for host to load questions..."}
        </p>
        <p className="text-xs text-muted-foreground">
          {isHost ? "Syncing with opponent" : "Almost ready"}
        </p>
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
            <Diamond className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            <span className="text-sm text-foreground font-semibold">
              {won ? `+${betAmount * 2} FP` : tied ? "No refund" : `-${betAmount} FP`}
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

        <div className="flex items-center gap-1">
          <Diamond className="w-3.5 h-3.5 text-[hsl(45,100%,50%)]" />
          <span className="text-xs font-bold text-[hsl(45,100%,50%)]">{betAmount}</span>
        </div>

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
            const isCorrectOpt = i === correct;
            let optionStyle = "bg-muted/50 border-transparent hover:bg-primary/10";

            if (showResult) {
              if (isCorrectOpt) {
                optionStyle = "bg-green-500/20 border-green-500/60";
              } else if (isSelected && !isCorrectOpt) {
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
                  showResult && isCorrectOpt ? "bg-green-500 text-white" :
                  showResult && isSelected && !isCorrectOpt ? "bg-destructive text-white" :
                  "bg-muted text-foreground"
                )}>
                  {showResult && isCorrectOpt ? <CheckCircle2 className="w-4 h-4" /> :
                   showResult && isSelected && !isCorrectOpt ? <XCircle className="w-4 h-4" /> :
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

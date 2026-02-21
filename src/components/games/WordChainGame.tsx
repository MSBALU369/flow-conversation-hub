import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Trophy, Send, Clock, Coins } from "lucide-react";
import { GameCallBubble } from "./GameCallBubble";
import { cn } from "@/lib/utils";
import { useGameBet } from "@/hooks/useGameBet";
import { useGameSync } from "@/hooks/useGameSync";

interface WordChainGameProps {
  onClose: () => void;
  onMinimize?: () => void;
  betAmount?: number;
  partnerName: string;
  room?: any;
}

const STARTER_WORDS = ["apple", "mountain", "elephant", "orange", "travel", "planet", "energy", "dolphin"];
const TURN_TIME = 15;

// Simple word bank for AI partner responses
const WORD_BANK = [
  "able","across","after","again","also","always","animal","answer","area","around",
  "ball","beautiful","because","before","begin","below","bird","black","blue","boat",
  "body","book","both","bring","build","call","came","car","care","carry","cat",
  "change","child","city","close","color","come","could","country","cut","dark",
  "deep","dinner","door","down","draw","dream","drink","drive","drop","dry","during",
  "each","early","earth","east","eat","eight","end","enough","even","ever","every",
  "example","eye","face","fall","family","far","fast","father","feel","find","fire",
  "first","fish","five","fly","follow","food","foot","forest","four","friend","front",
  "garden","girl","give","glass","gold","good","great","green","grow","half","hand",
  "happen","hard","head","hear","heart","help","here","high","hill","hold","home",
  "horse","hot","house","how","hundred","idea","important","inside","interest",
  "jump","just","keep","kind","king","know","land","language","large","last","late",
  "laugh","learn","leave","left","letter","life","light","line","listen","little",
  "live","long","look","love","low","magic","make","man","many","map","mark",
  "money","moon","more","morning","most","mother","move","much","music","must",
  "name","near","need","never","new","next","night","nine","north","nothing","now",
  "number","ocean","off","often","old","once","only","open","order","other","out",
  "over","own","paper","part","past","people","picture","place","plant","play",
  "point","power","pull","push","put","queen","question","quick","rain","reach",
  "read","ready","real","red","rest","rich","ride","right","river","road","rock",
  "room","round","run","same","sea","second","sentence","seven","ship","short",
  "show","side","silver","simple","since","sing","sister","sit","six","sleep",
  "small","snow","some","song","soon","sound","south","space","stand","star",
  "start","step","still","stone","stop","story","strong","study","summer","sun",
  "sure","table","tail","take","talk","tall","ten","than","their","them","then",
  "there","these","thing","think","third","thought","three","through","time","today",
  "together","told","top","toward","tree","true","turn","twelve","twenty","two",
  "under","until","upon","use","very","voice","walk","wall","want","warm","watch",
  "water","wave","well","west","white","whole","wide","wild","will","wind","winter",
  "wish","with","without","woman","wood","word","work","world","write","year","young",
];

function findWord(startLetter: string, usedWords: Set<string>): string | null {
  const matches = WORD_BANK.filter(w => w[0] === startLetter && !usedWords.has(w));
  return matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : null;
}

export function WordChainGame({ onClose, onMinimize, betAmount = 0, partnerName, room }: WordChainGameProps & { room?: any }) {
  const { settleBet } = useGameBet(betAmount);
  const { sendMove, lastReceivedMove } = useGameSync<{ word: string }>(room || null, "wordchain");
  const isMultiplayer = !!room;
  const starter = STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
  const [words, setWords] = useState<{ word: string; player: string }[]>([{ word: starter, player: "system" }]);
  const [input, setInput] = useState("");
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [myScore, setMyScore] = useState(0);
  const [partnerScore, setPartnerScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [settled, setSettled] = useState(false);
  const [round, setRound] = useState(1);
  const [usedWords] = useState<Set<string>>(new Set([starter]));
  const [error, setError] = useState("");

  const lastWord = words[words.length - 1].word;
  const requiredLetter = lastWord[lastWord.length - 1];
  const MAX_ROUNDS = 10;

  // Timer
  useEffect(() => {
    if (gameOver) return;
    setTimeLeft(TURN_TIME);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (isMyTurn) {
            // Player timed out - partner gets point
            setPartnerScore(s => s + 1);
            doPartnerTurn();
          }
          return TURN_TIME;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isMyTurn, gameOver, words.length]);

  const doPartnerTurn = useCallback(() => {
    setTimeout(() => {
      const currentLast = words[words.length - 1]?.word || lastWord;
      const needed = currentLast[currentLast.length - 1];
      const word = findWord(needed, usedWords);
      if (word) {
        usedWords.add(word);
        setWords(prev => [...prev, { word, player: "partner" }]);
        setPartnerScore(s => s + 1);
      }
      const nextRound = round + 1;
      if (nextRound > MAX_ROUNDS) {
        setGameOver(true);
      } else {
        setRound(nextRound);
        setIsMyTurn(true);
      }
    }, 1000 + Math.random() * 1500);
    setIsMyTurn(false);
  }, [words, lastWord, round, usedWords]);

  // Handle incoming moves from remote player
  useEffect(() => {
    if (!lastReceivedMove || !isMultiplayer) return;
    const { word } = lastReceivedMove;
    usedWords.add(word);
    setWords(prev => [...prev, { word, player: "partner" }]);
    setPartnerScore(s => s + 1);
    const nextRound = round + 1;
    if (nextRound > MAX_ROUNDS) {
      setGameOver(true);
    } else {
      setRound(nextRound);
      setIsMyTurn(true);
    }
  }, [lastReceivedMove, isMultiplayer]);

  const handleSubmit = () => {
    const word = input.trim().toLowerCase();
    setError("");
    if (!word) return;
    if (word[0] !== requiredLetter) {
      setError(`Word must start with "${requiredLetter.toUpperCase()}"`);
      return;
    }
    if (usedWords.has(word)) {
      setError("Word already used!");
      return;
    }
    if (word.length < 2) {
      setError("Word too short!");
      return;
    }
    usedWords.add(word);
    setWords(prev => [...prev, { word, player: "you" }]);
    setMyScore(s => s + 1);
    setInput("");
    if (isMultiplayer) {
      sendMove({ word });
      setIsMyTurn(false);
    } else {
      doPartnerTurn();
    }
  };

  if (gameOver) {
    const won = myScore > partnerScore;
    const tied = myScore === partnerScore;
    if (!settled) { settleBet(won ? "win" : tied ? "tie" : "lose"); setSettled(true); }
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
        {betAmount > 0 && (
          <p className="text-sm font-semibold flex items-center gap-1">
            <Coins className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            {won ? `+${betAmount * 2} coins` : tied ? "Bet refunded" : `-${betAmount} coins`}
          </p>
        )}
        <Button onClick={onClose} className="mt-4 w-full max-w-[200px]">Back to Call</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <GameCallBubble onMinimize={onMinimize} />
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <span className="text-xs font-bold text-primary">Round {round}/{MAX_ROUNDS}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-foreground font-bold">{myScore}</span>
          <span className="text-[10px] text-muted-foreground">vs</span>
          <span className="text-xs text-destructive font-bold">{partnerScore}</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Timer */}
      <div className="px-4 mb-3">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-1000", timeLeft <= 5 ? "bg-destructive" : "bg-primary")} style={{ width: `${(timeLeft / TURN_TIME) * 100}%` }} />
        </div>
        <p className={cn("text-center text-xs font-mono mt-1", timeLeft <= 5 ? "text-destructive" : "text-muted-foreground")}>{timeLeft}s</p>
      </div>

      {/* Word history */}
      <div className="flex-1 px-4 overflow-y-auto space-y-2">
        {words.map((w, i) => (
          <div key={i} className={cn("px-3 py-2 rounded-xl text-sm max-w-[80%]",
            w.player === "system" ? "bg-muted/50 text-muted-foreground mx-auto text-center" :
            w.player === "you" ? "bg-primary/20 text-foreground ml-auto" :
            "bg-muted/50 text-foreground mr-auto"
          )}>
            <span className="text-[10px] text-muted-foreground">{w.player === "system" ? "Start" : w.player === "you" ? "You" : partnerName}</span>
            <p className="font-semibold capitalize">{w.word}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 safe-bottom">
        <p className="text-xs text-muted-foreground mb-2 text-center">
          {isMyTurn ? <>Type a word starting with <span className="font-bold text-primary text-lg">"{requiredLetter.toUpperCase()}"</span></> : <>{partnerName} is thinking...</>}
        </p>
        {error && <p className="text-xs text-destructive text-center mb-1">{error}</p>}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            disabled={!isMyTurn}
            placeholder={isMyTurn ? `Word starting with "${requiredLetter}"...` : "Waiting..."}
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={!isMyTurn} size="icon"><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}

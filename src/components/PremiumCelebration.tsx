import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PremiumCelebrationProps {
  show: boolean;
  onComplete: () => void;
}

const emojiList = ["🎉", "🥳", "⭐", "👑", "🏆", "💎", "✨", "🌟", "🎊", "💫"];

export function PremiumCelebration({ show, onComplete }: PremiumCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const [emojis] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: emojiList[Math.floor(Math.random() * emojiList.length)],
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      size: 20 + Math.random() * 20,
    }))
  );

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [show, onComplete]);

  if (!show && !visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Falling emojis */}
      {emojis.map((e) => (
        <span
          key={e.id}
          className="absolute animate-bounce"
          style={{
            left: `${e.left}%`,
            top: "-10%",
            fontSize: `${e.size}px`,
            animation: `fall-emoji 2s ease-in ${e.delay}s forwards`,
          }}
        >
          {e.emoji}
        </span>
      ))}

      {/* Center text */}
      <div className="text-center animate-scale-in z-10">
        <p className="text-5xl mb-3">👑</p>
        <h2 className="text-2xl font-bold text-white mb-1">Congrats!</h2>
        <p className="text-lg font-semibold text-[hsl(45,100%,60%)]">Premium Star ⭐</p>
      </div>

      <style>{`
        @keyframes fall-emoji {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

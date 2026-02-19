import { useRef, useState, useCallback, useEffect } from "react";
import { Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingGameBubbleProps {
  gameName: string;
  onReopen: () => void;
}

const GAME_ICONS: Record<string, string> = {
  quiz: "❓",
  chess: "♟️",
  wordchain: "🔤",
  wouldyourather: "🤔",
  truthordare: "🎭",
  ludo: "🎲",
  snakeandladder: "🐍",
  archery: "🏹",
};

export function FloatingGameBubble({ gameName, onReopen }: FloatingGameBubbleProps) {
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const dragState = useRef({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const resetPosition = useCallback(() => {
    setPosition({ x: window.innerWidth - 64, y: 100 });
  }, []);

  useEffect(() => {
    resetPosition();
    window.addEventListener("resize", resetPosition);
    return () => window.removeEventListener("resize", resetPosition);
  }, [resetPosition]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const el = bubbleRef.current;
    if (!el || !position) return;
    el.setPointerCapture(e.pointerId);
    dragState.current = { isDragging: true, startX: e.clientX, startY: e.clientY, offsetX: position.x, offsetY: position.y };
    setDragging(true);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.isDragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const newX = Math.max(0, Math.min(window.innerWidth - 52, dragState.current.offsetX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 52, dragState.current.offsetY + dy));
    setPosition({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const wasDragging = dragState.current.isDragging;
    const dx = Math.abs(e.clientX - dragState.current.startX);
    const dy = Math.abs(e.clientY - dragState.current.startY);
    dragState.current.isDragging = false;
    setDragging(false);
    if (wasDragging && dx < 5 && dy < 5) {
      onReopen();
    }
  }, [onReopen]);

  if (!position) return null;

  const icon = GAME_ICONS[gameName] || "🎮";

  return (
    <button
      ref={bubbleRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="fixed z-[55] touch-none select-none"
      style={{
        left: position.x,
        top: position.y,
        transition: dragging ? "none" : "transform 0.15s ease-out",
      }}
    >
      <div className="relative flex items-center justify-center">
        {/* Blink effect */}
        {!dragging && (
          <div
            className={cn(
              "absolute w-12 h-12 rounded-xl border-2 border-primary/50 animate-pulse"
            )}
            style={{ animationDuration: "1.2s" }}
          />
        )}
        {/* Square bubble */}
        <div className="w-12 h-12 rounded-xl bg-primary/90 flex flex-col items-center justify-center shadow-lg shadow-primary/30 relative z-10 border border-primary/60">
          <span className="text-lg leading-none">{icon}</span>
          <Gamepad2 className="w-3 h-3 text-primary-foreground/70 mt-0.5" />
        </div>
      </div>
    </button>
  );
}

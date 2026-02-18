import { useRef, useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import { useCallState } from "@/hooks/useCallState";

export default function FloatingCallBubble() {
  const { callState } = useCallState();
  const location = useLocation();
  const navigate = useNavigate();

  const bubbleRef = useRef<HTMLButtonElement>(null);
  const dragState = useRef({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Reset to bottom center on mount / window resize
  const resetPosition = useCallback(() => {
    setPosition({ x: window.innerWidth / 2 - 28, y: window.innerHeight - 190 });
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
    const newX = Math.max(0, Math.min(window.innerWidth - 56, dragState.current.offsetX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 140, dragState.current.offsetY + dy));
    setPosition({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const wasDragging = dragState.current.isDragging;
    const dx = Math.abs(e.clientX - dragState.current.startX);
    const dy = Math.abs(e.clientY - dragState.current.startY);
    dragState.current.isDragging = false;
    setDragging(false);

    // Only navigate if it was a tap (not a drag)
    if (wasDragging && dx < 5 && dy < 5) {
      navigate("/call");
    }
  }, [navigate]);

  const isOnCallPage = location.pathname === "/call";
  if (!callState.isInCall || isOnCallPage || !position) return null;

  return (
    <button
      ref={bubbleRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    className="fixed z-50 touch-none select-none"
      style={{
        left: position.x,
        top: position.y,
        transition: dragging ? "none" : "transform 0.15s ease-out",
      }}
    >
      <div className="relative">
        {!dragging && (
          <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" style={{ animationDuration: "1.5s" }} />
        )}
        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 relative z-10">
          <Phone className="w-6 h-6 text-white" />
        </div>
      </div>
    </button>
  );
}
